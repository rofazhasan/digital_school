import type { ClassPsychometrics, StudentScoreCard } from './types';

export class AnalyticsEngine {
  public static computePsychometrics(
    cohort: StudentScoreCard[],
    passingPercentage: number = 40.0
  ): ClassPsychometrics {
    const n = cohort.length;
    if (n === 0) {
      return {
        totalCandidates: 0,
        averageScore: 0,
        medianScore: 0,
        highestScore: 0,
        lowestScore: 0,
        standardDeviation: 0,
        passPercentage: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        itemAnalysis: {},
      };
    }

    const scores = cohort.map((c) => c.totalScore).sort((a, b) => a - b);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const averageScore = parseFloat((sum / n).toFixed(2));

    const mid = Math.floor(n / 2);
    const medianScore =
      n % 2 !== 0 ? scores[mid] : parseFloat(((scores[mid - 1] + scores[mid]) / 2).toFixed(2));
    const highestScore = scores[scores.length - 1];
    const lowestScore = scores[0];

    const variance = scores.reduce((acc, s) => acc + Math.pow(s - averageScore, 2), 0) / n;
    const standardDeviation = parseFloat(Math.sqrt(variance).toFixed(2));

    let passCount = 0;
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    for (const card of cohort) {
      const pct = card.percentage;
      if (pct >= passingPercentage) passCount++;

      if (pct >= 80) gradeDistribution.A++;
      else if (pct >= 65) gradeDistribution.B++;
      else if (pct >= 50) gradeDistribution.C++;
      else if (pct >= 40) gradeDistribution.D++;
      else gradeDistribution.F++;
    }

    const passPercentage = parseFloat(((passCount / n) * 100).toFixed(2));

    const sortedStudents = [...cohort].sort((a, b) => b.totalScore - a.totalScore);
    const sampleSize27 = Math.max(1, Math.round(n * 0.27));
    const upperGroup = sortedStudents.slice(0, sampleSize27);
    const lowerGroup = sortedStudents.slice(Math.max(0, n - sampleSize27));

    const allQuestions = Object.keys(cohort[0]?.questionVerdicts || {});
    const itemAnalysis: ClassPsychometrics['itemAnalysis'] = {};

    for (const qKey of allQuestions) {
      let totalCorrect = 0;
      const distractorCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, UNMARKED: 0 };

      for (const card of cohort) {
        const v = card.questionVerdicts[qKey];
        if (v?.verdict === 'correct' || v?.verdict === 'bonus') {
          totalCorrect++;
        }
        const ans = v?.studentAnswer || 'UNMARKED';
        distractorCounts[ans] = (distractorCounts[ans] || 0) + 1;
      }

      const difficultyIndex = parseFloat((totalCorrect / n).toFixed(2));

      let upperCorrect = 0;
      for (const card of upperGroup) {
        const v = card.questionVerdicts[qKey];
        if (v?.verdict === 'correct' || v?.verdict === 'bonus') upperCorrect++;
      }

      let lowerCorrect = 0;
      for (const card of lowerGroup) {
        const v = card.questionVerdicts[qKey];
        if (v?.verdict === 'correct' || v?.verdict === 'bonus') lowerCorrect++;
      }

      const discriminationIndex = parseFloat(((upperCorrect - lowerCorrect) / sampleSize27).toFixed(2));

      let classification: 'Ideal' | 'Too Easy' | 'Too Hard' | 'Poor Discriminator' = 'Ideal';
      if (difficultyIndex > 0.85) classification = 'Too Easy';
      else if (difficultyIndex < 0.20) classification = 'Too Hard';
      else if (discriminationIndex < 0.20) classification = 'Poor Discriminator';

      itemAnalysis[qKey] = {
        question: qKey,
        difficultyIndex,
        discriminationIndex,
        distractorCounts,
        classification,
      };
    }

    return {
      totalCandidates: n,
      averageScore,
      medianScore,
      highestScore,
      lowestScore,
      standardDeviation,
      passPercentage,
      gradeDistribution,
      itemAnalysis,
    };
  }

  /**
   * Generates a UTF-8 BOM Excel-compatible CSV string for the scanned cohort
   */
  public static exportCohortToCSV(cohort: StudentScoreCard[]): string {
    if (cohort.length === 0) return '';

    const questionKeys = Object.keys(cohort[0]?.questionVerdicts || {});
    const headers = [
      'Rank',
      'RollNumber',
      'RegistrationNo',
      'StudentName',
      'Set',
      'TotalScore',
      'MaxScore',
      'Percentage',
      'Correct',
      'Incorrect',
      'Unmarked',
      'NeedsReview',
      'Flags',
      ...questionKeys.map((q) => q.toUpperCase()),
    ];

    const escapeCell = (val: unknown): string => {
      const str = val === undefined || val === null ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = cohort.map((c) => [
      c.rank ?? '',
      c.rollNumber || '',
      c.registrationNo || '',
      c.studentName || '',
      c.examSet || 'A',
      c.totalScore,
      c.maxScore,
      c.percentage,
      c.correctCount,
      c.incorrectCount,
      c.unmarkedCount,
      c.needsReview ? 'YES' : 'NO',
      (c.flags || []).join('; '),
      ...questionKeys.map((q) => c.questionVerdicts?.[q]?.studentAnswer || ''),
    ]);

    return '\uFEFF' + [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  }
}
