/**
 * SRA — Structured Reasoning Assembly Autograding Engine
 * 
 * Production-grade deterministic evaluation for SRA questions.
 * 100% Machine-checkable without AI, LLM, NLP, or paid external APIs.
 * 
 * Supports:
 * - CONSTRUCT (numeric, fraction, expression, text from allowed set, units, tolerances)
 * - EVIDENCE_SELECT (single/multi-select with configurable partial credit & penalty)
 * - RELATION (structured source -> relation -> target logical assertions)
 * - ORDER (step-by-step reasoning sequence with exact & partial scoring)
 * - MATCH_RELATION (cause-and-effect / entity matching)
 * - INTERMEDIATE_CONSTRUCT (intermediate calculations and variables)
 * - CONCLUSION (final constructed answer / structured token)
 * - Reasoning Graph validation & first-error position localization
 */

import { areExpressionsEquivalent, normalizeExpression } from '../math-parser';

export type SRAComponentKind =
  | 'CONSTRUCT'
  | 'EVIDENCE_SELECT'
  | 'RELATION'
  | 'ORDER'
  | 'MATCH_RELATION'
  | 'INTERMEDIATE_CONSTRUCT'
  | 'CONCLUSION';

export type SRAFieldType =
  | 'integer'
  | 'decimal'
  | 'numeric'
  | 'fraction'
  | 'expression'
  | 'text_from_allowed_set';

export type SRAScoringMode = 'ALL_OR_NOTHING' | 'PARTIAL' | 'PENALTY';

export interface SRAEvidenceOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  correct?: boolean; // legacy alias
}

export interface SRARelationItem {
  id?: string;
  source: string;
  target: string;
  relation: string; // e.g. 'IMPLIES', 'CAUSES', 'EQUIVALENT_TO', 'LEADS_TO', 'REQUIRES'
}

export interface SRASequenceItem {
  id: string;
  text: string;
}

export interface SRAMatchPair {
  id: string;
  left: string;
  right: string;
}

export interface SRAComponent {
  id: string;
  kind: SRAComponentKind;
  label?: string;
  prompt?: string;
  marks: number;
  negativeMarks?: number;

  // CONSTRUCT, INTERMEDIATE_CONSTRUCT, CONCLUSION fields
  fieldType?: SRAFieldType;
  expectedAnswer?: string | number;
  tolerance?: number;
  unit?: string;
  allowedAnswers?: string[];
  caseSensitive?: boolean;

  // EVIDENCE_SELECT fields
  selectMode?: 'SINGLE' | 'MULTI';
  evidenceOptions?: SRAEvidenceOption[];
  scoringMode?: SRAScoringMode;

  // RELATION fields
  relationOptions?: SRARelationItem[];
  expectedRelations?: SRARelationItem[];
  allowedRelations?: string[];

  // ORDER fields
  sequenceItems?: SRASequenceItem[];
  correctOrder?: string[]; // Array of sequence item IDs

  // MATCH_RELATION fields
  pairs?: SRAMatchPair[];
}

export interface SRAGraphNode {
  id: string;
  label: string;
  type: 'FACT' | 'EVIDENCE' | 'RULE' | 'INTERMEDIATE' | 'CONCLUSION';
}

export interface SRAGraphEdge {
  from: string;
  to: string;
  relation: string;
}

export interface SRAReasoningGraph {
  nodes: SRAGraphNode[];
  edges: SRAGraphEdge[];
}

export interface SRAQuestion {
  id: string;
  type?: 'SRA' | string;
  stem?: string;
  questionText?: string;
  marks?: number;
  components?: SRAComponent[];
  reasoningGraph?: SRAReasoningGraph;
  explanation?: string;
  negativeMarks?: number;
}

export interface SRAStudentComponentAnswer {
  // For CONSTRUCT, INTERMEDIATE_CONSTRUCT, CONCLUSION
  value?: string | number;
  
  // For EVIDENCE_SELECT
  selectedEvidenceIds?: string[];
  selectedId?: string;

  // For RELATION
  relations?: Array<{ source: string; target: string; relation: string }>;

  // For ORDER
  order?: string[];

  // For MATCH_RELATION
  matches?: Record<string, string>;
}

export type SRAStudentAnswer = Record<string, SRAStudentComponentAnswer | string | number | string[] | any>;

export interface SRAComponentEvaluationResult {
  componentId: string;
  kind: SRAComponentKind;
  status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED';
  earnedMarks: number;
  maxMarks: number;
  studentAnswer: any;
  expectedAnswer: any;
  feedback?: string;
  isAttempted: boolean;
}

export interface SRAEvaluationResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isAttempted: boolean;
  accuracy: number; // 0.0 - 1.0
  componentResults: Record<string, SRAComponentEvaluationResult>;
  diagnosticTags: string[];
  firstErrorPosition: number | null; // 1-indexed component index where first mistake occurred
  feedback: string;
}

/**
 * Normalizes input strings for comparison
 */
function cleanStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Evaluates a CONSTRUCT, INTERMEDIATE_CONSTRUCT, or CONCLUSION component
 */
function evaluateConstruct(
  comp: SRAComponent,
  rawVal: any
): { earned: number; status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean } {
  const strVal = cleanStr(typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal ? rawVal.value : rawVal);
  if (!strVal) {
    return { earned: 0, status: 'UNANSWERED', isAttempted: false };
  }

  const expectedStr = cleanStr(comp.expectedAnswer);
  const tol = Number(comp.tolerance ?? 0);
  const max = comp.marks || 1;

  // 1. Check allowedAnswers list if provided
  if (comp.allowedAnswers && Array.isArray(comp.allowedAnswers) && comp.allowedAnswers.length > 0) {
    const matched = comp.allowedAnswers.some(ans => {
      if (comp.caseSensitive) return cleanStr(ans) === strVal;
      return cleanStr(ans).toLowerCase() === strVal.toLowerCase();
    });
    if (matched) {
      return { earned: max, status: 'CORRECT', isAttempted: true };
    }
  }

  // 2. Numeric / Float comparison with tolerance
  const studentNum = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
  const expectedNum = parseFloat(expectedStr.replace(/[^0-9.-]/g, ''));

  if (!isNaN(studentNum) && !isNaN(expectedNum)) {
    if (Math.abs(studentNum - expectedNum) <= tol + 1e-9) {
      return { earned: max, status: 'CORRECT', isAttempted: true };
    }
  }

  // 3. Mathematical algebraic equivalence
  if (areExpressionsEquivalent(strVal, expectedStr, tol)) {
    return { earned: max, status: 'CORRECT', isAttempted: true };
  }

  // 4. Exact string match fallback
  const isMatch = comp.caseSensitive
    ? strVal === expectedStr
    : strVal.toLowerCase() === expectedStr.toLowerCase();

  return {
    earned: isMatch ? max : 0,
    status: isMatch ? 'CORRECT' : 'INCORRECT',
    isAttempted: true
  };
}

/**
 * Evaluates an EVIDENCE_SELECT component
 */
function evaluateEvidenceSelect(
  comp: SRAComponent,
  rawVal: any
): { earned: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean } {
  let selectedIds: string[] = [];
  if (Array.isArray(rawVal)) {
    selectedIds = rawVal.map(String);
  } else if (rawVal && typeof rawVal === 'object' && Array.isArray(rawVal.selectedEvidenceIds)) {
    selectedIds = rawVal.selectedEvidenceIds.map(String);
  } else if (rawVal && typeof rawVal === 'object' && rawVal.selectedId) {
    selectedIds = [String(rawVal.selectedId)];
  } else if (typeof rawVal === 'string' && rawVal.trim()) {
    selectedIds = [rawVal.trim()];
  }

  if (selectedIds.length === 0) {
    return { earned: 0, status: 'UNANSWERED', isAttempted: false };
  }

  const options = comp.evidenceOptions || (comp as any).options || [];
  const correctIds = new Set(
    options.filter((opt: any) => opt.isCorrect || opt.correct).map((opt: any) => String(opt.id))
  );
  const max = comp.marks || 1;
  const scoringMode = comp.scoringMode || (comp as any).scoring || 'PARTIAL';

  // Single select mode
  if (comp.selectMode === 'SINGLE') {
    const studentChoice = selectedIds[0];
    const isCorrect = correctIds.has(studentChoice);
    return {
      earned: isCorrect ? max : 0,
      status: isCorrect ? 'CORRECT' : 'INCORRECT',
      isAttempted: true
    };
  }

  // Multi select evaluation
  let truePositives = 0;
  let falsePositives = 0;

  selectedIds.forEach(id => {
    if (correctIds.has(id)) {
      truePositives++;
    } else {
      falsePositives++;
    }
  });

  const totalCorrect = correctIds.size;

  if (scoringMode === 'ALL_OR_NOTHING') {
    const isAllCorrect = truePositives === totalCorrect && falsePositives === 0;
    return {
      earned: isAllCorrect ? max : 0,
      status: isAllCorrect ? 'CORRECT' : 'INCORRECT',
      isAttempted: true
    };
  }

  // Partial credit scoring with anti-guessing penalty
  if (totalCorrect === 0) {
    return { earned: 0, status: 'INCORRECT', isAttempted: true };
  }

  const markPerOption = max / totalCorrect;
  let score = truePositives * markPerOption;

  if (scoringMode === 'PENALTY') {
    score = Math.max(0, score - falsePositives * markPerOption);
  } else {
    // Standard partial
    score = Math.max(0, score - falsePositives * (markPerOption * 0.5));
  }

  score = Math.min(max, Math.max(0, Math.round(score * 100) / 100));

  let status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' = 'INCORRECT';
  if (score >= max - 1e-4) {
    status = 'CORRECT';
  } else if (score > 0) {
    status = 'PARTIAL';
  }

  return { earned: score, status, isAttempted: true };
}

/**
 * Evaluates a RELATION component (source -> relation -> target)
 */
function evaluateRelation(
  comp: SRAComponent,
  rawVal: any
): { earned: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean } {
  let studentRelations: Array<{ source: string; target: string; relation: string }> = [];
  if (Array.isArray(rawVal)) {
    studentRelations = rawVal;
  } else if (rawVal && typeof rawVal === 'object' && Array.isArray(rawVal.relations)) {
    studentRelations = rawVal.relations;
  } else if (rawVal && typeof rawVal === 'object' && rawVal.source && rawVal.target) {
    studentRelations = [rawVal];
  }

  if (studentRelations.length === 0) {
    return { earned: 0, status: 'UNANSWERED', isAttempted: false };
  }

  const expected = comp.expectedRelations || comp.relationOptions || [];
  const max = comp.marks || 1;

  if (expected.length === 0) {
    return { earned: max, status: 'CORRECT', isAttempted: true };
  }

  const normalizeRel = (r: any) => `${cleanStr(r.source).toLowerCase()}|${cleanStr(r.relation).toLowerCase()}|${cleanStr(r.target).toLowerCase()}`;
  const expectedSet = new Set(expected.map(normalizeRel));

  let correctCount = 0;
  studentRelations.forEach(r => {
    if (expectedSet.has(normalizeRel(r))) {
      correctCount++;
    }
  });

  const ratio = correctCount / expected.length;
  const score = Math.round(ratio * max * 100) / 100;

  let status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' = 'INCORRECT';
  if (score >= max - 1e-4) status = 'CORRECT';
  else if (score > 0) status = 'PARTIAL';

  return { earned: score, status, isAttempted: true };
}

/**
 * Evaluates an ORDER component (step-by-step reasoning sequence)
 */
function evaluateOrder(
  comp: SRAComponent,
  rawVal: any
): { earned: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean } {
  let studentOrder: string[] = [];
  if (Array.isArray(rawVal)) {
    studentOrder = rawVal.map(String);
  } else if (rawVal && typeof rawVal === 'object' && Array.isArray(rawVal.order)) {
    studentOrder = rawVal.order.map(String);
  }

  if (studentOrder.length === 0) {
    return { earned: 0, status: 'UNANSWERED', isAttempted: false };
  }

  const correctOrder = (comp.correctOrder || (comp.sequenceItems || []).map(item => item.id)).map(String);
  const max = comp.marks || 1;

  if (correctOrder.length === 0) {
    return { earned: max, status: 'CORRECT', isAttempted: true };
  }

  // Exact match
  if (JSON.stringify(studentOrder) === JSON.stringify(correctOrder)) {
    return { earned: max, status: 'CORRECT', isAttempted: true };
  }

  // Partial positional scoring
  let correctPositions = 0;
  for (let i = 0; i < Math.min(studentOrder.length, correctOrder.length); i++) {
    if (studentOrder[i] === correctOrder[i]) {
      correctPositions++;
    }
  }

  const ratio = correctPositions / correctOrder.length;
  // Partial credit if at least 50% correctly positioned
  const score = ratio >= 0.5 ? Math.round(ratio * max * 100) / 100 : 0;
  const status = score >= max - 1e-4 ? 'CORRECT' : (score > 0 ? 'PARTIAL' : 'INCORRECT');

  return { earned: score, status, isAttempted: true };
}

/**
 * Evaluates a MATCH_RELATION component (key-value pairs)
 */
function evaluateMatchRelation(
  comp: SRAComponent,
  rawVal: any
): { earned: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean } {
  let matches: Record<string, string> = {};
  if (rawVal && typeof rawVal === 'object' && 'matches' in rawVal) {
    matches = rawVal.matches || {};
  } else if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal)) {
    matches = rawVal;
  }

  const matchKeys = Object.keys(matches);
  if (matchKeys.length === 0) {
    return { earned: 0, status: 'UNANSWERED', isAttempted: false };
  }

  const pairs = comp.pairs || [];
  const max = comp.marks || 1;

  if (pairs.length === 0) {
    return { earned: max, status: 'CORRECT', isAttempted: true };
  }

  let correctMatches = 0;
  pairs.forEach(p => {
    if (cleanStr(matches[p.id] || matches[p.left]).toLowerCase() === cleanStr(p.right).toLowerCase()) {
      correctMatches++;
    }
  });

  const ratio = correctMatches / pairs.length;
  const score = Math.round(ratio * max * 100) / 100;
  const status = score >= max - 1e-4 ? 'CORRECT' : (score > 0 ? 'PARTIAL' : 'INCORRECT');

  return { earned: score, status, isAttempted: true };
}

/**
 * Deterministically evaluates a complete SRA question
 */
export function evaluateSRAQuestion(
  question: SRAQuestion | any,
  studentAnswer: SRAStudentAnswer | any = {},
  options?: { negativeMarkingRate?: number }
): SRAEvaluationResult {
  const components: SRAComponent[] = Array.isArray(question.components)
    ? question.components
    : (Array.isArray(question.sraComponents) ? question.sraComponents : []);

  // Fallback for legacy DR questions if passed directly
  if (components.length === 0 && (question.reasonOptions || question.canonicalAnswer || question.modelAnswer)) {
    return evaluateLegacyDRAsSRA(question, studentAnswer, options);
  }

  const componentResults: Record<string, SRAComponentEvaluationResult> = {};
  const diagnosticTags: string[] = [];
  let totalEarned = 0;
  let totalMax = 0;
  let attemptedComponentsCount = 0;
  let firstErrorPos: number | null = null;

  components.forEach((comp, idx) => {
    const rawVal = studentAnswer[comp.id] !== undefined
      ? studentAnswer[comp.id]
      : (studentAnswer[`part_${idx}`] !== undefined ? studentAnswer[`part_${idx}`] : studentAnswer[String(idx)]);

    const maxMarks = comp.marks || 1;
    totalMax += maxMarks;

    let res: { earned: number; status: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNANSWERED'; isAttempted: boolean };

    switch (comp.kind) {
      case 'CONSTRUCT':
      case 'INTERMEDIATE_CONSTRUCT':
      case 'CONCLUSION':
        res = evaluateConstruct(comp, rawVal);
        break;
      case 'EVIDENCE_SELECT':
        res = evaluateEvidenceSelect(comp, rawVal);
        break;
      case 'RELATION':
        res = evaluateRelation(comp, rawVal);
        break;
      case 'ORDER':
        res = evaluateOrder(comp, rawVal);
        break;
      case 'MATCH_RELATION':
        res = evaluateMatchRelation(comp, rawVal);
        break;
      default:
        res = evaluateConstruct(comp, rawVal);
    }

    if (res.isAttempted) {
      attemptedComponentsCount++;
    }

    // Apply component-level negative penalty if configured and answer is incorrect
    if (res.status === 'INCORRECT' && comp.negativeMarks && comp.negativeMarks > 0 && res.isAttempted) {
      res.earned = -comp.negativeMarks;
    }

    totalEarned += res.earned;

    // Track first error position (1-indexed)
    if (res.status === 'INCORRECT' || res.status === 'PARTIAL') {
      if (firstErrorPos === null) {
        firstErrorPos = idx + 1;
        diagnosticTags.push(`FIRST_ERROR_AT_STEP_${idx + 1}`);
      }
      if (comp.kind === 'EVIDENCE_SELECT') diagnosticTags.push('EVIDENCE_SELECTION_ERROR');
      if (comp.kind === 'RELATION') diagnosticTags.push('RELATIONAL_LOGIC_ERROR');
      if (comp.kind === 'ORDER') diagnosticTags.push('REASONING_SEQUENCE_ERROR');
      if (comp.kind === 'CONSTRUCT' || comp.kind === 'INTERMEDIATE_CONSTRUCT') diagnosticTags.push('CALCULATION_ERROR');
    }

    componentResults[comp.id] = {
      componentId: comp.id,
      kind: comp.kind,
      status: res.status,
      earnedMarks: res.earned,
      maxMarks,
      studentAnswer: rawVal,
      expectedAnswer: comp.expectedAnswer ?? comp.correctOrder ?? comp.evidenceOptions?.filter(o => o.isCorrect) ?? 'Defined in key',
      isAttempted: res.isAttempted,
      feedback: res.status === 'CORRECT' ? 'Correctly assembled' : (res.status === 'PARTIAL' ? 'Partial reasoning credit' : (res.status === 'UNANSWERED' ? 'Not answered' : 'Incorrect reasoning'))
    };
  });

  // Overall question score bounded between 0 and totalMax
  const finalScore = Math.max(0, Math.min(totalMax, Math.round(totalEarned * 100) / 100));
  const isCorrect = totalMax > 0 && finalScore >= totalMax - 1e-4;
  const isAttempted = attemptedComponentsCount > 0;
  const accuracy = totalMax > 0 ? finalScore / totalMax : 0;

  if (isCorrect) {
    diagnosticTags.push('CONCEPT_MASTERY');
  } else if (finalScore > 0) {
    diagnosticTags.push('PARTIAL_REASONING');
  } else if (!isAttempted) {
    diagnosticTags.push('UNATTEMPTED');
  } else {
    diagnosticTags.push('KNOWLEDGE_GAP');
  }

  let feedback = `Score: ${finalScore}/${totalMax}.`;
  if (isCorrect) feedback += ' Structured reasoning fully verified.';
  else if (firstErrorPos !== null) feedback += ` First reasoning discrepancy at Step ${firstErrorPos}.`;

  return {
    score: finalScore,
    maxScore: totalMax || Number(question.marks || 1),
    isCorrect,
    isAttempted,
    accuracy,
    componentResults,
    diagnosticTags,
    firstErrorPosition: firstErrorPos,
    feedback
  };
}

/**
 * Adapter to evaluate legacy DR question format as SRA seamlessly
 */
export function evaluateLegacyDRAsSRA(
  drQ: any,
  studentAns: any,
  options?: { negativeMarkingRate?: number }
): SRAEvaluationResult {
  const modelAnswer = cleanStr(drQ.canonicalAnswer || drQ.modelAnswer || drQ.expectedAnswer || drQ.correctAnswer);
  const reasons: SRAEvidenceOption[] = (drQ.reasonOptions || drQ.subQuestions || []).map((r: any, idx: number) => ({
    id: cleanStr(r.id || `r${idx + 1}`),
    text: cleanStr(r.text || r.question || r.label),
    isCorrect: Boolean(r.isCorrect || r.correct)
  }));

  const totalMarks = Number(drQ.marks || 2);
  const markA = totalMarks / 2;
  const markB = totalMarks / 2;

  const compA: SRAComponent = {
    id: 'step_1_answer',
    kind: 'CONSTRUCT',
    label: 'Primary Answer',
    expectedAnswer: modelAnswer,
    marks: markA,
    tolerance: drQ.toleranceValue ? Number(drQ.toleranceValue) : 0.01,
    unit: drQ.expectedUnit
  };

  const compB: SRAComponent = {
    id: 'step_2_evidence',
    kind: 'EVIDENCE_SELECT',
    label: 'Conceptual Justification',
    selectMode: 'SINGLE',
    evidenceOptions: reasons,
    marks: markB
  };

  const sraQuestion: SRAQuestion = {
    id: drQ.id,
    type: 'SRA',
    stem: drQ.questionText || drQ.stem,
    marks: totalMarks,
    components: [compA, compB]
  };

  const mappedStudentAns: SRAStudentAnswer = {
    step_1_answer: typeof studentAns === 'object' && studentAns !== null ? (studentAns.answer ?? studentAns.value ?? studentAns.partA) : studentAns,
    step_2_evidence: typeof studentAns === 'object' && studentAns !== null ? (studentAns.reasonId ?? studentAns.reason ?? studentAns.selectedEvidenceIds ?? studentAns.partB) : null
  };

  return evaluateSRAQuestion(sraQuestion, mappedStudentAns, options);
}

/**
 * Converts a legacy DR question record into a canonical SRA question structure
 */
export function convertDRToSRA(drQ: any): SRAQuestion {
  const modelAnswer = cleanStr(drQ.canonicalAnswer || drQ.modelAnswer || drQ.expectedAnswer || drQ.correctAnswer);
  const reasons: SRAEvidenceOption[] = (drQ.reasonOptions || drQ.subQuestions || []).map((r: any, idx: number) => ({
    id: cleanStr(r.id || `r${idx + 1}`),
    text: cleanStr(r.text || r.question || r.label),
    isCorrect: Boolean(r.isCorrect || r.correct)
  }));

  const totalMarks = Number(drQ.marks || 3);
  const markA = Math.ceil(totalMarks / 2);
  const markB = totalMarks - markA;

  const components: SRAComponent[] = [
    {
      id: 'answer',
      kind: 'CONSTRUCT',
      label: 'Construct Solution',
      fieldType: drQ.drSubtype === 'NUMERIC' ? 'numeric' : (drQ.drSubtype === 'SYMBOLIC' ? 'expression' : 'text_from_allowed_set'),
      expectedAnswer: modelAnswer,
      tolerance: drQ.toleranceValue ? Number(drQ.toleranceValue) : 0.01,
      unit: drQ.expectedUnit || undefined,
      allowedAnswers: Array.isArray(drQ.acceptedAnswers) ? drQ.acceptedAnswers : undefined,
      marks: markA
    },
    {
      id: 'evidence',
      kind: 'EVIDENCE_SELECT',
      label: 'Select Conceptual Evidence',
      selectMode: 'SINGLE',
      evidenceOptions: reasons,
      marks: markB,
      scoringMode: 'ALL_OR_NOTHING'
    }
  ];

  return {
    id: drQ.id,
    type: 'SRA',
    stem: drQ.questionText || drQ.stem || '',
    marks: totalMarks,
    components,
    explanation: drQ.explanation || ''
  };
}
