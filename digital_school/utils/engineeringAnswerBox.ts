/**
 * Engineering Exam Subjective Question (SQ) Designated Answer-Box Engine
 *
 * Implements the adaptive engineering answer-box algorithm:
 * - Question classification (Definition, Explanation, Numerical, Derivation, Proof, Diagram, etc.)
 * - Hybrid line estimation: marks + question type + expected answer density
 * - Multi-part SQ decomposition: mini-boxes per subpart ((a), (b), (c))
 * - Page-break avoidance rules (break-inside: avoid)
 * - Visual cues for numericals (Given / Calculation / Answer), diagrams, derivations
 */

export type SqClassification =
  | 'definition'
  | 'short_explanation'
  | 'comparison'
  | 'numerical'
  | 'derivation'
  | 'proof'
  | 'diagram'
  | 'code'
  | 'design'
  | 'mixed';

export interface SqPart {
  partIndex: number;
  label: string;
  text: string;
  marks?: number;
  classification: SqClassification;
  lines: number;
  guideType: 'numerical' | 'diagram' | 'derivation' | 'code' | 'none';
}

export interface ParsedSq {
  isMultiPart: boolean;
  stem: string;
  parts: SqPart[];
  totalLines: number;
  overallClassification: SqClassification;
  guideType: 'numerical' | 'diagram' | 'derivation' | 'code' | 'none';
}

export interface BoxCalculationOptions {
  isSubPart?: boolean;
  userScale?: number; // 0.85 (compact), 1.0 (standard), 1.2 (spacious)
  paperSize?: 'legal' | 'a4' | 'letter' | 'a3';
  availableHeightMm?: number;
}

/**
 * Baseline lines per SQ question type (profile)
 */
export const SQ_BASE_LINES: Record<SqClassification, number> = {
  definition: 3,
  short_explanation: 6,
  comparison: 7,
  numerical: 10,
  derivation: 14,
  proof: 16,
  diagram: 12,
  code: 15,
  design: 18,
  mixed: 8,
};

/**
 * Classifies an SQ question text into its engineering category.
 * Supports both English and Bengali exam terminology.
 */
export function classifySqQuestion(
  text: string,
  marks: number = 2
): {
  type: SqClassification;
  confidence: number;
  label: string;
  guideType: 'numerical' | 'diagram' | 'derivation' | 'code' | 'none';
} {
  const clean = (text || '').toLowerCase();

  // 1. Derivation (প্রতিপাদন)
  const isDerivation =
    /\b(derive|derivation|deduce the formula|obtain the expression|establish the equation)\b/i.test(clean) ||
    /(প্রতিপাদন|রাশিমালা প্রতিপাদন|সমীকরণটি প্রতিপাদন|প্রতিষ্ঠা কর|প্রতিপাদন কর)/.test(clean);
  if (isDerivation) {
    return { type: 'derivation', confidence: 0.95, label: 'Derivation', guideType: 'derivation' };
  }

  // 2. Mathematical Proof (প্রমাণ)
  const isProof =
    /\b(prove that|show that|prove the following|establish that|verify that)\b/i.test(clean) ||
    /(প্রমাণ কর|প্রমাণ করো|দেখাও যে|যাচাই কর)/.test(clean);
  if (isProof) {
    return { type: 'proof', confidence: 0.95, label: 'Proof', guideType: 'derivation' };
  }

  // 3. Diagram / Schematic / Graph (চিত্র / অঙ্কন)
  const isDiagram =
    /\b(draw|sketch|schematic|diagram|plot the|circuit diagram|block diagram|fbd|free body)\b/i.test(clean) ||
    /(চিত্র|অঙ্কন|আঁক|স্কেচ|লেখচিত্র|বর্তনী চিত্র|চিত্রসহ|ব্লক ডায়াগ্রাম)/.test(clean);
  if (isDiagram) {
    return { type: 'diagram', confidence: 0.9, label: 'Diagram', guideType: 'diagram' };
  }

  // 4. Programming / Code / Algorithm (প্রোগ্রামিং / অ্যালগরিদম)
  const isCode =
    /\b(write a program|c program|python|java|algorithm|flowchart|pseudocode|pseudo-code)\b/i.test(clean) ||
    /(প্রোগ্রাম|সি প্রোগ্রাম|অ্যালগরিদম|ফ্লোচার্ট)/.test(clean);
  if (isCode) {
    return { type: 'code', confidence: 0.9, label: 'Code', guideType: 'code' };
  }

  // 5. Engineering Design (ডিজাইন / নকশা)
  const isDesign =
    /\b(design a|design the|synthesize|dimension the)\b/i.test(clean) ||
    /(নকশা|ডিজাইন)/.test(clean);
  if (isDesign) {
    return { type: 'design', confidence: 0.85, label: 'Design', guideType: 'none' };
  }

  // 6. Comparison (পার্থক্য / তুলনা)
  const isComparison =
    /\b(differentiate|compare|difference between|distinguish|contrast)\b/i.test(clean) ||
    /(পার্থক্য|তুলনা|সাদৃশ্য|বৈসাদৃশ্য|পার্থক্য লিখ)/.test(clean);
  if (isComparison) {
    return { type: 'comparison', confidence: 0.9, label: 'Comparison', guideType: 'none' };
  }

  // 7. Numerical (গাণিতিক সমস্যা / হিসাব)
  const hasMathKeywords =
    /\b(calculate|find the|determine|evaluate|solve|compute|how much|value of|magnitude|resultant)\b/i.test(clean) ||
    /(মান নির্ণয়|হিসাব কর|গণনা কর|কত\?|নির্ণয় কর|সমাধান কর|মান কত)/.test(clean);
  const hasPhysicalUnits =
    /\b(\d+(\.\d+)?\s*(v|volt|a|amp|ma|ω|ohm|kω|mω|w|watt|kw|mw|j|joule|n|newton|kn|m|cm|mm|km|kg|gm|s|sec|ms|hz|khz|mhz|ghz|k|pa|kpa|mpa|bar|mol|rad|deg|°c|°|m\/s|m\/s\^2|μf|pf|nf|mh|henry))\b/i.test(clean);

  if (hasMathKeywords || hasPhysicalUnits) {
    return { type: 'numerical', confidence: 0.92, label: 'Numerical', guideType: 'numerical' };
  }

  // 8. Definition (সংজ্ঞা)
  const isDefinition =
    /\b(define|definition|what is meant by|what is|state the principle|state the law|state)\b/i.test(clean) ||
    /(সংজ্ঞা|কাকে বলে|বলতে কী বোঝায়|বলতে কি বোঝায়|বলতে কী বোঝ|বলতে কি বোঝ|কী\?|কি\?|বিবৃত কর|নাম লেখ)/.test(clean);
  if (isDefinition && marks <= 3) {
    return { type: 'definition', confidence: 0.88, label: 'Definition', guideType: 'none' };
  }

  // 9. Short Explanation (সংক্ষিপ্ত ব্যাখ্যা)
  const isExplanation =
    /\b(explain|describe|why|how|elaborate|give reasons|discuss|clarify|significance)\b/i.test(clean) ||
    /(ব্যাখ্যা কর|বর্ণনা কর|কেন|কীভাবে|কারণ দর্শাও|আলোচনা কর|তাৎপর্য)/.test(clean);
  if (isExplanation) {
    return { type: 'short_explanation', confidence: 0.85, label: 'Explanation', guideType: 'none' };
  }

  // Fallback depending on marks
  if (marks >= 8) {
    return { type: 'derivation', confidence: 0.6, label: 'Derivation/Analysis', guideType: 'derivation' };
  }
  if (marks >= 5) {
    return { type: 'numerical', confidence: 0.6, label: 'Numerical/Problem', guideType: 'numerical' };
  }
  if (marks >= 3) {
    return { type: 'short_explanation', confidence: 0.6, label: 'Explanation', guideType: 'none' };
  }
  return { type: 'definition', confidence: 0.6, label: 'Short Answer', guideType: 'none' };
}

/**
 * Calculates the recommended number of writing lines for an answer box.
 * Follows the practical formula:
 *   base_lines = 2 + (marks * 1.5)
 *   with question-type specific baselines & bounds clamping.
 *   On Legal paper (14-inch), scales lines by ~1.20x to maximize usable paper space.
 */
export function calculateSqLines(
  classification: SqClassification,
  marks: number = 2,
  options?: BoxCalculationOptions
): number {
  const m = Math.max(1, marks || 2);
  let lines: number;

  switch (classification) {
    case 'definition':
      lines = Math.max(3, m * 1.5);
      break;
    case 'short_explanation':
      lines = Math.max(5, m * 2.0);
      break;
    case 'comparison':
      lines = Math.max(6, m * 2.0);
      break;
    case 'numerical':
      lines = Math.max(8, m * 2.5);
      break;
    case 'derivation':
      lines = Math.max(10, m * 3.0);
      break;
    case 'proof':
      lines = Math.max(12, m * 3.0);
      break;
    case 'diagram': {
      const baseLines = 2 + (m * 1.5);
      lines = Math.max(10, baseLines + 5);
      break;
    }
    case 'code':
      lines = Math.max(10, m * 2.5);
      break;
    case 'design':
      lines = Math.max(12, m * 3.0);
      break;
    default:
      lines = 2 + (m * 1.5);
      break;
  }

  // Legal paper optimization: Legal pages (14in / 355.6mm) have ~20% more vertical space than A4 (297mm).
  // Expand line allocation so students have abundant working space and zero vacant paper.
  if (options?.paperSize === 'legal') {
    lines = lines * 1.22;
  }

  // Bounds clamping:
  // For subparts: 2 to 18 lines (up to 20 on legal)
  // For standalone questions: 3 to 28 lines (up to 35 on legal)
  const isLegal = options?.paperSize === 'legal';
  const minLines = options?.isSubPart ? 2 : 3;
  const maxLines = options?.isSubPart ? (isLegal ? 20 : 16) : (isLegal ? 35 : 28);
  let clamped = Math.min(maxLines, Math.max(minLines, Math.round(lines)));

  if (options?.userScale && options.userScale !== 1) {
    clamped = Math.max(minLines, Math.round(clamped * options.userScale));
  }

  return clamped;
}



/**
 * Parses a question to check for multi-part structure (e.g. (a), (b), (c) or (ক), (খ), (গ)).
 * If multi-part, separates the introductory stem and generates mini-boxes per subpart.
 */
export function parseSqQuestion(
  q: any,
  userScale: number = 1.0,
  paperSize?: 'legal' | 'a4' | 'letter' | 'a3'
): ParsedSq {
  const rawText = (q?.questionText || q?.q || '').trim();
  const totalMarks = Number(q?.marks) || 2;

  // 1. Check if structured subquestions already exist
  const explicitSubs: any[] = q?.subQuestions || q?.parts || q?.sub_questions || [];
  if (Array.isArray(explicitSubs) && explicitSubs.length > 0) {
    const parts: SqPart[] = explicitSubs.map((sub: any, idx: number) => {
      const pText = (sub.text || sub.questionText || sub.q || '').trim();
      const pMarks = Number(sub.marks) || Math.max(1, Math.round(totalMarks / explicitSubs.length));
      const cls = classifySqQuestion(pText, pMarks);
      const lines = calculateSqLines(cls.type, pMarks, { isSubPart: true, userScale, paperSize });
      const label = sub.label || `(${String.fromCharCode(97 + idx)})`;
      return {
        partIndex: idx + 1,
        label,
        text: pText,
        marks: pMarks,
        classification: cls.type,
        lines,
        guideType: cls.guideType,
      };
    });

    const totalLines = parts.reduce((sum, p) => sum + p.lines, 0);
    const overallCls = classifySqQuestion(rawText, totalMarks);

    return {
      isMultiPart: true,
      stem: rawText,
      parts,
      totalLines,
      overallClassification: overallCls.type,
      guideType: overallCls.guideType,
    };
  }

  // 2. Check for embedded subparts in the question text:
  // e.g. "(a) Define entropy. [2] (b) State second law..."
  // e.g. "(ক) ... (খ) ..."
  // e.g. "a) ... b) ..."
  const subpartPattern = /(?:^|\n|[\s;])(?:\(([a-d]|[ক-ঘ]|[i-v]|\d{1,2})\)|([a-d]|[ক-ঘ]|[i-v]|\d{1,2})\))\s+/gi;
  const matches = [...rawText.matchAll(subpartPattern)];

  if (matches.length >= 2) {
    const firstMatchIndex = matches[0].index ?? 0;
    const stem = rawText.slice(0, firstMatchIndex).trim();

    const parts: SqPart[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchIndex = match.index ?? 0;
      const label = match[0].trim();
      const contentStart = matchIndex + match[0].length;
      const contentEnd = i + 1 < matches.length ? (matches[i + 1].index ?? rawText.length) : rawText.length;
      let partText = rawText.slice(contentStart, contentEnd).trim();

      // Extract marks if present at end of subpart (e.g. "[2]" or "(2 marks)" or "[২]")
      let partMarks: number | undefined;
      const marksMatch = partText.match(/\[(\d+|[০-৯]+)\s*(?:marks?|নম্বর)?\]\s*$/i);
      if (marksMatch) {
        const numStr = marksMatch[1].replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
        partMarks = Number(numStr);
        partText = partText.slice(0, marksMatch.index).trim();
      }

      const assignedMarks = partMarks || Math.max(1, Math.round(totalMarks / matches.length));
      const cls = classifySqQuestion(partText, assignedMarks);
      const lines = calculateSqLines(cls.type, assignedMarks, { isSubPart: true, userScale, paperSize });

      parts.push({
        partIndex: i + 1,
        label,
        text: partText,
        marks: assignedMarks,
        classification: cls.type,
        lines,
        guideType: cls.guideType,
      });
    }

    const totalLines = parts.reduce((sum, p) => sum + p.lines, 0);
    const overallCls = classifySqQuestion(rawText, totalMarks);

    return {
      isMultiPart: true,
      stem,
      parts,
      totalLines,
      overallClassification: overallCls.type,
      guideType: overallCls.guideType,
    };
  }

  // 3. Standalone Single Question
  const cls = classifySqQuestion(rawText, totalMarks);
  const lines = calculateSqLines(cls.type, totalMarks, { isSubPart: false, userScale, paperSize });

  return {
    isMultiPart: false,
    stem: '',
    parts: [
      {
        partIndex: 1,
        label: '',
        text: rawText,
        marks: totalMarks,
        classification: cls.type,
        lines,
        guideType: cls.guideType,
      },
    ],
    totalLines: lines,
    overallClassification: cls.type,
    guideType: cls.guideType,
  };
}

/**
 * Estimates visual units for pagination when engineering answer boxes are enabled.
 * 1 standard question unit is ~25-28px.
 * On Legal paper, accounts for the 14in vertical height budget.
 */
export function estimateSqVisualUnits(
  q: any,
  scale: number = 1.0,
  paperSize?: 'legal' | 'a4' | 'letter' | 'a3'
): number {
  const parsed = parseSqQuestion(q, scale, paperSize);
  const boxUnits = parsed.totalLines * 0.65;
  const paddingUnits = parsed.isMultiPart ? parsed.parts.length * 1.0 + 0.8 : 1.2;
  return 1.5 + boxUnits + paddingUnits;
}
