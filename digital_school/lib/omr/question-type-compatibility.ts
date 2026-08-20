/**
 * OMR Question Type Compatibility Registry & Auditor
 * 
 * Audits physical OMR sheet compatibility with every existing question type in Rofaz Academy.
 * The system remains 100% honest about what the physical sheet can accurately read.
 */

export type OMRSupportLevel = 'NATIVE' | 'COMPOSITE_SUPPORTED' | 'DIGITAL_ONLY';

export interface QuestionTypeOMRProfile {
  type: string;
  name: string;
  supportLevel: OMRSupportLevel;
  currentOMRRepresentation: string;
  requiredTemplateSupport: string;
  isNativelyReadableOnCurrentSheet: boolean;
  notes: string;
}

export const QUESTION_TYPE_COMPATIBILITY_REGISTRY: Record<string, QuestionTypeOMRProfile> = {
  MCQ: {
    type: 'MCQ',
    name: 'Multiple Choice Question (Single Correct)',
    supportLevel: 'NATIVE',
    currentOMRRepresentation: 'Single A/B/C/D bubble darkening',
    requiredTemplateSupport: 'Standard 4-bubble horizontal row (A, B, C, D / ক, খ, গ, ঘ)',
    isNativelyReadableOnCurrentSheet: true,
    notes: 'Fully and directly supported by canonical 1..100 bubble grid.'
  },
  SMCQ: {
    type: 'SMCQ',
    name: 'Single Choice Objective (Alternative Schema)',
    supportLevel: 'NATIVE',
    currentOMRRepresentation: 'Single A/B/C/D bubble darkening',
    requiredTemplateSupport: 'Standard 4-bubble horizontal row',
    isNativelyReadableOnCurrentSheet: true,
    notes: 'Directly supported; maps option index 0..3 to A..D.'
  },
  AR: {
    type: 'AR',
    name: 'Assertion & Reason',
    supportLevel: 'NATIVE',
    currentOMRRepresentation: 'Single A/B/C/D bubble corresponding to standard 4 assertion-reason logical outcomes',
    requiredTemplateSupport: 'Standard 4-bubble row with question stem defining standard A/B/C/D choices',
    isNativelyReadableOnCurrentSheet: true,
    notes: 'Natively supported when question JSON defines standard 4 assertion-reason option codes.'
  },
  MMCQ: {
    type: 'MMCQ',
    name: 'Multiple Correct Multiple Choice (Multi-Select)',
    supportLevel: 'COMPOSITE_SUPPORTED',
    currentOMRRepresentation: 'Multiple bubbles darkened on the same row (e.g. A + C)',
    requiredTemplateSupport: 'Multi-bubble threshold classifier (enabled in QuestionClassifier)',
    isNativelyReadableOnCurrentSheet: true,
    notes: 'Physically read by classifier when multiple bubbles are filled; instructions must explicitly inform students.'
  },
  MC: {
    type: 'MC',
    name: 'Multi-Choice Multi-Select (Legacy Key)',
    supportLevel: 'COMPOSITE_SUPPORTED',
    currentOMRRepresentation: 'Multiple bubbles darkened on the same row (e.g. A + C)',
    requiredTemplateSupport: 'Multi-bubble threshold classifier',
    isNativelyReadableOnCurrentSheet: true,
    notes: 'Same as MMCQ; maps to array of selected option indices [0, 2].'
  },
  MTF: {
    type: 'MTF',
    name: 'Match the Following / Column Matching',
    supportLevel: 'DIGITAL_ONLY',
    currentOMRRepresentation: 'Unsupported unless coded into 4 composite choices (A, B, C, D) in the question stem',
    requiredTemplateSupport: 'Requires 4 sub-rows per question (p->A/B/C/D, q->A/B/C/D) or OMR Template V2 Matrix',
    isNativelyReadableOnCurrentSheet: false,
    notes: 'Marked DIGITAL_ONLY on standard sheets. Supported if question author formats options as composite combinations.'
  },
  INT: {
    type: 'INT',
    name: 'Integer / Numerical Value Question',
    supportLevel: 'DIGITAL_ONLY',
    currentOMRRepresentation: 'Cannot represent arbitrary integers on a 4-bubble row',
    requiredTemplateSupport: 'Requires dedicated 3/4-column 0-9 numerical bubble grid (like Roll number matrix)',
    isNativelyReadableOnCurrentSheet: false,
    notes: 'Marked DIGITAL_ONLY on standard A/B/C/D sheets. Extensible for OMR Template V2 Numerical Grid.'
  },
  CMA: {
    type: 'CMA',
    name: 'Comprehensive Multi-Answer / Multi-Part Numerical',
    supportLevel: 'DIGITAL_ONLY',
    currentOMRRepresentation: 'Cannot represent structured multi-part sub-answers on a single bubble row',
    requiredTemplateSupport: 'Requires structured partitioned physical answer blocks per sub-part',
    isNativelyReadableOnCurrentSheet: false,
    notes: 'Marked DIGITAL_ONLY on standard sheets. Evaluated online or via teacher evaluation console.'
  },
  MPC: {
    type: 'MPC',
    name: 'Multi-Stage Problem with Cascading Branches',
    supportLevel: 'DIGITAL_ONLY',
    currentOMRRepresentation: 'Cannot represent interactive cascading stages on static paper sheet',
    requiredTemplateSupport: 'Requires separate physical sub-question numbering per stage',
    isNativelyReadableOnCurrentSheet: false,
    notes: 'Marked DIGITAL_ONLY for dynamic multi-stage branching.'
  }
};

export class QuestionTypeOMRAuditor {
  /**
   * Returns the OMR profile for a given question type.
   */
  public static getProfile(type: string): QuestionTypeOMRProfile {
    const upper = (type || 'MCQ').toUpperCase();
    return (
      QUESTION_TYPE_COMPATIBILITY_REGISTRY[upper] || {
        type: upper,
        name: `${upper} Custom Question`,
        supportLevel: 'DIGITAL_ONLY',
        currentOMRRepresentation: 'Custom schema not defined on standard physical sheet',
        requiredTemplateSupport: 'Requires custom OMR template definition',
        isNativelyReadableOnCurrentSheet: false,
        notes: 'Unrecognized question type; treated as DIGITAL_ONLY.'
      }
    );
  }

  /**
   * Audits an entire canonical question set and returns compatibility statistics and warnings.
   */
  public static auditQuestionSet(questions: Array<{ id: string; type?: string; sequenceNumber: number }>): {
    isFullyPhysicalCompatible: boolean;
    nativeCount: number;
    compositeCount: number;
    digitalOnlyCount: number;
    totalQuestions: number;
    breakdownByType: Record<string, number>;
    digitalOnlyQuestionIds: string[];
    warnings: string[];
  } {
    let nativeCount = 0;
    let compositeCount = 0;
    let digitalOnlyCount = 0;
    const breakdownByType: Record<string, number> = {};
    const digitalOnlyQuestionIds: string[] = [];
    const warnings: string[] = [];

    questions.forEach((q) => {
      const type = (q.type || 'MCQ').toUpperCase();
      breakdownByType[type] = (breakdownByType[type] || 0) + 1;

      const profile = this.getProfile(type);

      if (profile.supportLevel === 'NATIVE') {
        nativeCount++;
      } else if (profile.supportLevel === 'COMPOSITE_SUPPORTED') {
        compositeCount++;
      } else {
        digitalOnlyCount++;
        digitalOnlyQuestionIds.push(q.id);
        warnings.push(`Question Q${q.sequenceNumber} (${type}) is DIGITAL_ONLY on standard A/B/C/D OMR sheets.`);
      }
    });

    return {
      isFullyPhysicalCompatible: digitalOnlyCount === 0,
      nativeCount,
      compositeCount,
      digitalOnlyCount,
      totalQuestions: questions.length,
      breakdownByType,
      digitalOnlyQuestionIds,
      warnings
    };
  }
}
