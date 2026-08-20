/**
 * PhysicalResponseMapper
 * 
 * Maps raw physical OMR bubble reads (question 1..100, bubbles A/B/C/D)
 * directly to canonical online ExamSubmission answers format using stable question IDs
 * from the exact assigned ExamSet.
 */

import { CanonicalQuestionSet, CanonicalQuestion } from "./exam-set-resolver";

export interface PhysicalAnswerEntry {
  questionNo: number;                    // 1-indexed physical sheet question number (1..100)
  selectedOption?: string | null;        // 'A' | 'B' | 'C' | 'D' | 'ক' | 'খ' | 'গ' | 'ঘ' | null
  selectedOptions?: string[];            // ['A', 'C'] for multi-select
  confidence?: number;                   // 0.0 - 1.0
  status?: string;                       // 'ONE_SELECTED' | 'BLANK' | 'MULTIPLE_MARKED' | 'AMBIGUOUS'
}

export interface MappedQuestionDetail {
  questionNo: number;
  questionId: string;
  questionType: string;
  physicalInput: string | null;
  canonicalResponse: any;
  status: string;
  confidence: number;
  expectedMarks: number;
}

export interface PhysicalMappingResult {
  validationStatus: "VALID" | "WARNINGS" | "ERROR";
  canonicalAnswers: Record<string, any>; // Compatible with ExamSubmission.answers
  mappedCount: number;
  skippedCount: number;
  multipleCount: number;
  ambiguousCount: number;
  unmappedQuestionIds: string[];
  warnings: string[];
  errors: string[];
  details: MappedQuestionDetail[];
}

export class PhysicalResponseMapper {
  private static readonly BENGALI_TO_LATIN: Record<string, string> = {
    "ক": "A",
    "খ": "B",
    "গ": "C",
    "ঘ": "D",
    "ঙ": "E",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4"
  };

  /**
   * Normalizes an option string (Bengali or Latin, uppercase/lowercase) to standard Latin A, B, C, D
   */
  public static normalizeOption(opt?: string | null): string | null {
    if (!opt) return null;
    const trimmed = opt.trim();
    if (!trimmed) return null;

    if (this.BENGALI_TO_LATIN[trimmed]) {
      return this.BENGALI_TO_LATIN[trimmed];
    }

    return trimmed.toUpperCase();
  }

  /**
   * Maps physical bubble reads to canonical ExamSubmission.answers using stable question IDs
   */
  public static mapResponses(
    examSet: CanonicalQuestionSet,
    physicalAnswers: PhysicalAnswerEntry[]
  ): PhysicalMappingResult {
    const canonicalAnswers: Record<string, any> = {};
    const warnings: string[] = [];
    const errors: string[] = [];
    const details: MappedQuestionDetail[] = [];

    let mappedCount = 0;
    let skippedCount = 0;
    let multipleCount = 0;
    let ambiguousCount = 0;

    if (!examSet || !examSet.questions || examSet.questions.length === 0) {
      return {
        validationStatus: "ERROR",
        canonicalAnswers: {},
        mappedCount: 0,
        skippedCount: 0,
        multipleCount: 0,
        ambiguousCount: 0,
        unmappedQuestionIds: [],
        warnings: [],
        errors: ["ExamSet contains 0 questions. Cannot map physical responses."],
        details: []
      };
    }

    // Index physical answers by questionNo (1..100)
    const physicalMap = new Map<number, PhysicalAnswerEntry>();
    physicalAnswers.forEach(ans => {
      if (ans.questionNo > 0) {
        physicalMap.set(ans.questionNo, ans);
      }
    });

    const unmappedQuestionIds: string[] = [];

    // Process every question in canonical order
    examSet.questions.forEach((q: CanonicalQuestion) => {
      const qNo = q.sequenceNumber;
      const physicalEntry = physicalMap.get(qNo);

      if (!physicalEntry) {
        unmappedQuestionIds.push(q.id);
        canonicalAnswers[q.id] = "";
        skippedCount++;
        details.push({
          questionNo: qNo,
          questionId: q.id,
          questionType: q.type,
          physicalInput: null,
          canonicalResponse: "",
          status: "BLANK",
          confidence: 0,
          expectedMarks: q.marks
        });
        return;
      }

      const confidence = physicalEntry.confidence ?? 1.0;
      const rawStatus = physicalEntry.status || (physicalEntry.selectedOptions?.length ? "MULTIPLE_MARKED" : (physicalEntry.selectedOption ? "ONE_SELECTED" : "BLANK"));

      let canonicalResponse: any = null;
      let status = rawStatus;

      if (rawStatus === "BLANK" || (!physicalEntry.selectedOption && (!physicalEntry.selectedOptions || physicalEntry.selectedOptions.length === 0))) {
        // Unanswered / Skipped
        canonicalResponse = "";
        status = "BLANK";
        skippedCount++;
      } else if (rawStatus === "MULTIPLE_MARKED" || (physicalEntry.selectedOptions && physicalEntry.selectedOptions.length > 1)) {
        // Multiple marks
        multipleCount++;
        if (q.type === "MC") {
          // Multi-choice question accepts array of option indices
          const rawOptions = physicalEntry.selectedOptions || (physicalEntry.selectedOption ? [physicalEntry.selectedOption] : []);
          const normalizedLetters = rawOptions
            .map(opt => this.normalizeOption(opt))
            .filter((o): o is string => o !== null);

          const indices = normalizedLetters
            .map(letter => letter.charCodeAt(0) - 65)
            .filter(idx => idx >= 0 && (q.options.length === 0 || idx < q.options.length));

          canonicalResponse = { selectedOptions: indices };
          status = "ONE_SELECTED";
          mappedCount++;
        } else {
          // For single-choice MCQ, multiple marks is recorded as invalid multi-response
          canonicalResponse = "MULTIPLE";
          status = "MULTIPLE_MARKED";
          warnings.push(`Question ${qNo} (${q.id}) has multiple marks on a single-choice question.`);
        }
      } else if (rawStatus === "AMBIGUOUS") {
        ambiguousCount++;
        canonicalResponse = this.normalizeOption(physicalEntry.selectedOption);
        warnings.push(`Question ${qNo} (${q.id}) has low-confidence / ambiguous mark.`);
      } else {
        // Confident single selection
        const normalized = this.normalizeOption(physicalEntry.selectedOption);
        mappedCount++;

        if (q.type === "MCQ") {
          canonicalResponse = normalized; // 'A', 'B', 'C', 'D'
        } else if (q.type === "MC") {
          const idx = (normalized?.charCodeAt(0) ?? 65) - 65;
          canonicalResponse = { selectedOptions: idx >= 0 ? [idx] : [] };
        } else if (q.type === "AR" || q.type === "INT") {
          canonicalResponse = normalized;
        } else {
          canonicalResponse = normalized;
        }
      }

      // Store in canonical answers dictionary under stable questionId
      if (canonicalResponse !== null) {
        canonicalAnswers[q.id] = canonicalResponse;
      }

      details.push({
        questionNo: qNo,
        questionId: q.id,
        questionType: q.type,
        physicalInput: physicalEntry.selectedOption || (physicalEntry.selectedOptions ? physicalEntry.selectedOptions.join(",") : null),
        canonicalResponse,
        status,
        confidence,
        expectedMarks: q.marks
      });
    });

    if (unmappedQuestionIds.length > 0 && physicalAnswers.length > 0) {
      warnings.push(`${unmappedQuestionIds.length} questions from ExamSet were not present on physical sheet.`);
    }

    let validationStatus: "VALID" | "WARNINGS" | "ERROR" = "VALID";
    if (errors.length > 0) validationStatus = "ERROR";
    else if (warnings.length > 0 || ambiguousCount > 0 || multipleCount > 0) validationStatus = "WARNINGS";

    return {
      validationStatus,
      canonicalAnswers,
      mappedCount,
      skippedCount,
      multipleCount,
      ambiguousCount,
      unmappedQuestionIds,
      warnings,
      errors,
      details
    };
  }
}
