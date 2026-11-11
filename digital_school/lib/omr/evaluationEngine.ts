import type {
  EvaluationConfig,
  MarkingScheme,
  QuestionVerdict,
  StudentScoreCard,
} from './types';

const DEFAULT_MARKING_SCHEME: MarkingScheme = {
  correct: 1,
  incorrect: -0.25,
  unmarked: 0,
  bonus: 1,
};

const BENGALI_TO_ENG_OPTION: Record<string, string> = {
  'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E',
};

function normalizeLetter(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  return BENGALI_TO_ENG_OPTION[trimmed] || trimmed.toUpperCase();
}

export class EvaluationEngine {
  private config: EvaluationConfig;

  constructor(config: EvaluationConfig) {
    this.config = config;
  }

  public evaluateCandidate(
    sheetId: string,
    filename: string,
    responses: Record<string, string[]>,
    concatenatedResponses: Record<string, string>,
    flags: string[] = []
  ): StudentScoreCard {
    const defaultScheme = this.config.markingSchemes?.['default'] || DEFAULT_MARKING_SCHEME;
    const bonusQuestions = new Set(this.config.bonusQuestions || []);
    
    // Extract roll number and candidate set if configured
    const rollField = this.config.rollNumberField || 'Roll';
    const serialField = this.config.serialNumberField || 'Serial';
    const setField = this.config.setNameField || 'Set';
    
    const rollNumber = concatenatedResponses[rollField] || responses[rollField]?.join('') || 'UNKNOWN';
    const serialNo = concatenatedResponses[serialField] || responses[serialField]?.join('') || '';
    const examSet = concatenatedResponses[setField] || responses[setField]?.join('') || 'A';

    // CQ Cover Sheet fields
    const regNo = concatenatedResponses['Registration'] || responses['Registration']?.join('') || undefined;
    const subCode = concatenatedResponses['SubjectCode'] || responses['SubjectCode']?.join('') || 
                    concatenatedResponses['SubjectCodePart2'] || responses['SubjectCodePart2']?.join('') || undefined;
    const scriptSerial = concatenatedResponses['ScriptSerial'] || responses['ScriptSerial']?.join('') || undefined;
    const cqObtainedMarks = concatenatedResponses['ObtainedMarks'] || responses['ObtainedMarks']?.join('');
    const isCQ = Boolean(cqObtainedMarks || concatenatedResponses['SubjectCodePart2'] || concatenatedResponses['ScriptSerial']);

    // Resolve set-specific answer key if multi-set keys are configured
    let answerKey = this.config.answerKey;
    if (this.config.multiSetAnswerKeys) {
      const cleanExamSet = examSet.toUpperCase().replace(/\s+/g, '');
      for (const [sKey, sObj] of Object.entries(this.config.multiSetAnswerKeys)) {
        const cleanKey = sKey.toUpperCase().replace(/\s+/g, '');
        if (cleanKey === cleanExamSet || cleanKey.endsWith(cleanExamSet) || cleanExamSet.endsWith(cleanKey)) {
          if (sObj && Object.keys(sObj).length > 0) {
            answerKey = sObj as any;
            break;
          }
        }
      }
    }

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unmarkedCount = 0;
    const studentFlags = [...flags];

    const questionVerdicts: Record<string, QuestionVerdict> = {};
    const sectionScores: Record<string, { score: number; max: number; correct: number; total: number }> = {};

    for (const [qKey, correctAns] of Object.entries(answerKey)) {
      let sectionName = 'General';
      let scheme = defaultScheme;

      if (this.config.sections) {
        for (const [secName, secInfo] of Object.entries(this.config.sections)) {
          if (secInfo.questions.includes(qKey)) {
            sectionName = secName;
            if (this.config.markingSchemes && this.config.markingSchemes[secInfo.markingScheme]) {
              scheme = this.config.markingSchemes[secInfo.markingScheme];
            }
            break;
          }
        }
      }

      if (!sectionScores[sectionName]) {
        sectionScores[sectionName] = { score: 0, max: 0, correct: 0, total: 0 };
      }
      sectionScores[sectionName].total += 1;
      sectionScores[sectionName].max += scheme.correct;
      maxScore += scheme.correct;

      const rawMarked = responses[qKey] || [];
      const studentAnswer = rawMarked.join('');

      let verdict: QuestionVerdict['verdict'] = 'unmarked';
      let scoreAwarded = 0;

      if (bonusQuestions.has(qKey)) {
        verdict = 'bonus';
        scoreAwarded = scheme.bonus ?? scheme.correct;
        correctCount++;
        sectionScores[sectionName].correct++;
      } else if (rawMarked.length === 0) {
        verdict = 'unmarked';
        scoreAwarded = scheme.unmarked;
        unmarkedCount++;
      } else if (rawMarked.length > 1 && !Array.isArray(correctAns)) {
        verdict = 'multi_marked';
        scoreAwarded = scheme.incorrect;
        incorrectCount++;
        studentFlags.push(`Multi-marked question ${qKey}: [${rawMarked.join(',')}]`);
      } else {
        if (typeof correctAns === 'string') {
          if (normalizeLetter(studentAnswer) === normalizeLetter(correctAns)) {
            verdict = 'correct';
            scoreAwarded = scheme.correct;
            correctCount++;
            sectionScores[sectionName].correct++;
          } else {
            verdict = 'incorrect';
            scoreAwarded = scheme.incorrect;
            incorrectCount++;
          }
        } else if (Array.isArray(correctAns)) {
          if (correctAns.length > 0 && Array.isArray(correctAns[0])) {
            const weightedTuples = correctAns as [string, number][];
            const matchedTuple = weightedTuples.find(([ans]) => normalizeLetter(ans) === normalizeLetter(studentAnswer));
            if (matchedTuple) {
              verdict = 'correct';
              scoreAwarded = matchedTuple[1];
              correctCount++;
              sectionScores[sectionName].correct++;
            } else {
              verdict = 'incorrect';
              scoreAwarded = scheme.incorrect;
              incorrectCount++;
            }
          } else {
            const allowedAnswers = (correctAns as string[]).map(a => normalizeLetter(a));
            if (allowedAnswers.includes(normalizeLetter(studentAnswer))) {
              verdict = 'correct';
              scoreAwarded = scheme.correct;
              correctCount++;
              sectionScores[sectionName].correct++;
            } else {
              verdict = 'incorrect';
              scoreAwarded = scheme.incorrect;
              incorrectCount++;
            }
          }
        }
      }

      totalScore += scoreAwarded;
      sectionScores[sectionName].score += scoreAwarded;

      questionVerdicts[qKey] = {
        question: qKey,
        studentAnswer,
        correctAnswer: correctAns,
        verdict,
        score: scoreAwarded,
        section: sectionName,
      };
    }

    // For CQ Top Sheet: If ObtainedMarks bubbles are present, set directly as totalScore
    if (isCQ && cqObtainedMarks && !isNaN(Number(cqObtainedMarks))) {
      totalScore = parseFloat(cqObtainedMarks);
      maxScore = maxScore > 0 ? maxScore : 100;
    }

    const percentage = maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(2)) : 0;
    const needsReview = studentFlags.length > 0 || totalScore < 0 || (Object.keys(answerKey).length > 0 && unmarkedCount > Object.keys(answerKey).length * 0.7);

    return {
      sheetId,
      filename,
      rollNumber,
      registrationNo: regNo,
      subjectCode: subCode,
      scriptSerial,
      isCQScript: isCQ,
      serialNo,
      examSet,
      totalScore: parseFloat(totalScore.toFixed(2)),
      maxScore,
      percentage,
      correctCount,
      incorrectCount,
      unmarkedCount,
      sectionScores,
      questionVerdicts,
      flags: studentFlags,
      needsReview,
    };
  }

  public static rankCohort(scoreCards: StudentScoreCard[]): StudentScoreCard[] {
    const sorted = [...scoreCards].sort((a, b) => b.totalScore - a.totalScore);
    const n = sorted.length;
    if (n === 0) return [];

    let currentRank = 1;
    return sorted.map((card, index) => {
      if (index > 0 && card.totalScore === sorted[index - 1].totalScore) {
        // Tied with previous student
      } else {
        currentRank = index + 1;
      }

      const countBelow = sorted.filter(c => c.totalScore < card.totalScore).length;
      const countEqual = sorted.filter(c => c.totalScore === card.totalScore).length;
      const percentile = parseFloat((((countBelow + 0.5 * countEqual) / n) * 100).toFixed(2));

      return {
        ...card,
        rank: currentRank,
        percentile,
      };
    });
  }
}

