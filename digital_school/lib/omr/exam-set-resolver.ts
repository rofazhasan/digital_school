/**
 * ExamSetResolver
 * 
 * Fetches, validates, and normalizes exam_set.questionsJson into a strongly typed
 * CanonicalQuestionSet. The exam set is the absolute single source of truth.
 */

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface CanonicalQuestion {
  id: string;
  sequenceNumber: number; // 1-indexed (Q1, Q2, ..., Q100)
  type: string;           // Normalized UPPERCASE: 'MCQ' | 'MC' | 'AR' | 'INT' | 'MTF' | 'SMCQ' | 'CMA' | 'MPC' | 'CQ' | 'SQ'
  questionText: string;
  marks: number;
  options: QuestionOption[];
  correctAnswer?: string | number;
  correctOption?: number;
  explanation?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  subQuestions?: any[];
  raw: any;
}

export interface CanonicalQuestionSet {
  setId: string;
  setName: string;
  examId: string;
  isActive: boolean;
  totalQuestions: number;
  totalObjectiveMarks: number;
  questions: CanonicalQuestion[];
  questionIdMap: Map<string, CanonicalQuestion>;
  sequenceMap: Map<number, CanonicalQuestion>;
  typeDistribution: Record<string, number>;
}

export class ExamSetResolver {
  /**
   * Resolves and validates an exam set from database or raw JSON object
   */
  public static async resolveById(
    examSetId: string,
    expectedExamId?: string
  ): Promise<{ success: boolean; questionSet?: CanonicalQuestionSet; error?: string }> {
    if (!examSetId) {
      return { success: false, error: "ExamSetId is required." };
    }

    try {
      const { default: prisma } = await import("@/lib/db");
      const dbSet = await prisma.examSet.findUnique({
        where: { id: examSetId },
        include: {
          exam: {
            select: { id: true, name: true, totalMarks: true, classId: true }
          }
        }
      });

      if (!dbSet) {
        return { success: false, error: `ExamSet with ID '${examSetId}' not found.` };
      }

      if (expectedExamId && dbSet.examId !== expectedExamId) {
        return {
          success: false,
          error: `ExamSet '${examSetId}' belongs to exam '${dbSet.examId}', expected '${expectedExamId}'.`
        };
      }

      const questionSet = this.parseRawQuestionsJson(
        dbSet.questionsJson,
        dbSet.id,
        dbSet.name,
        dbSet.examId,
        dbSet.isActive
      );

      return { success: true, questionSet };
    } catch (err: any) {
      console.error("[ExamSetResolver] DB resolution error:", err);
      return { success: false, error: err.message || "Failed to resolve ExamSet from database." };
    }
  }

  /**
   * Parses raw questionsJson into a validated, strongly-typed CanonicalQuestionSet
   */
  public static parseRawQuestionsJson(
    rawQuestionsJson: any,
    setId: string,
    setName: string = "A",
    examId: string = "",
    isActive: boolean = true
  ): CanonicalQuestionSet {
    let rawList: any[] = [];

    if (Array.isArray(rawQuestionsJson)) {
      rawList = rawQuestionsJson;
    } else if (typeof rawQuestionsJson === "string") {
      try {
        rawList = JSON.parse(rawQuestionsJson);
      } catch (e) {
        console.error("[ExamSetResolver] JSON parse error:", e);
        rawList = [];
      }
    } else if (rawQuestionsJson && typeof rawQuestionsJson === "object") {
      // In case questions are wrapped under questions or orderedObjective
      if (Array.isArray(rawQuestionsJson.questions)) {
        rawList = rawQuestionsJson.questions;
      } else if (Array.isArray(rawQuestionsJson.orderedObjective)) {
        rawList = rawQuestionsJson.orderedObjective;
      }
    }

    const questions: CanonicalQuestion[] = [];
    const questionIdMap = new Map<string, CanonicalQuestion>();
    const sequenceMap = new Map<number, CanonicalQuestion>();
    const typeDistribution: Record<string, number> = {};
    let totalObjectiveMarks = 0;

    rawList.forEach((q: any, idx: number) => {
      if (!q) return;

      const sequenceNumber = idx + 1;
      const id = String(q.id || `q_${sequenceNumber}`);
      const rawType = String(q.type || q.questionType || "MCQ").toUpperCase();
      const type = rawType === "NUMERIC" ? "INT" : rawType;
      const marks = Number(q.marks) || 1;

      // Extract normalized options
      let options: QuestionOption[] = [];
      if (Array.isArray(q.options)) {
        options = q.options.map((opt: any) => {
          if (typeof opt === "string") {
            return { text: opt };
          }
          return {
            text: String(opt.text || opt.title || ""),
            isCorrect: Boolean(opt.isCorrect),
            explanation: opt.explanation || undefined
          };
        });
      }

      // Track correct option index if present
      let correctOption: number | undefined = undefined;
      if (q.correctOption !== undefined && q.correctOption !== null) {
        correctOption = Number(q.correctOption);
      } else {
        const correctIdx = options.findIndex(o => o.isCorrect);
        if (correctIdx !== -1) correctOption = correctIdx;
      }

      const canonicalQ: CanonicalQuestion = {
        id,
        sequenceNumber,
        type,
        questionText: String(q.questionText || q.text || q.prompt || ""),
        marks,
        options,
        correctAnswer: q.correctAnswer ?? q.correct ?? (correctOption !== undefined ? String.fromCharCode(65 + correctOption) : undefined),
        correctOption,
        explanation: q.explanation || (correctOption !== undefined ? options[correctOption]?.explanation : undefined),
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        subQuestions: q.subQuestions || q.sub_questions,
        raw: q
      };

      questions.push(canonicalQ);
      questionIdMap.set(id, canonicalQ);
      sequenceMap.set(sequenceNumber, canonicalQ);

      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      totalObjectiveMarks += marks;
    });

    return {
      setId,
      setName,
      examId,
      isActive,
      totalQuestions: questions.length,
      totalObjectiveMarks,
      questions,
      questionIdMap,
      sequenceMap,
      typeDistribution
    };
  }
}
