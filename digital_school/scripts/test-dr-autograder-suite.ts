import { gradeDRResponse, normalizeMultilingualText, parseNumericAnswer, normalizeUnit } from '../lib/dr-autograder';
import { evaluateDRQuestion } from '../lib/evaluation/drEvaluation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log("==========================================================================");
console.log("   PRODUCTION-GRADE DETERMINISTIC DR AUTOGRADER ENGINE TEST SUITE");
console.log("==========================================================================");

// --------------------------------------------------------------------------
// 1. DR_TEXT Subtype Tests (Bangla, English, Banglish, Canonical Aliases)
// --------------------------------------------------------------------------
const textConfig = {
  drSubtype: 'TEXT' as const,
  canonicalAnswer: 'NEPHRON',
  acceptedAnswers: ['nephron', 'নেফ্রন', 'functional unit of kidney']
};

assert(gradeDRResponse('NEPHRON', textConfig).status === 'CORRECT', 'DR_TEXT: Exact canonical match (NEPHRON -> CORRECT)');
assert(gradeDRResponse('nephron', textConfig).status === 'CORRECT', 'DR_TEXT: Case-insensitive alias (nephron -> CORRECT)');
assert(gradeDRResponse('নেফ্রন', textConfig).status === 'CORRECT', 'DR_TEXT: Bangla alias (নেফ্রন -> CORRECT)');
assert(gradeDRResponse('functional unit of kidney', textConfig).status === 'CORRECT', 'DR_TEXT: Multi-word alias (functional unit of kidney -> CORRECT)');
assert(gradeDRResponse('kidney', textConfig).status === 'INCORRECT', 'DR_TEXT: Near-miss rejection (kidney -> INCORRECT)');

// --------------------------------------------------------------------------
// 2. DR_NUMERIC Subtype Tests (Bengali Digits, Scientific Notation, Tolerances, Units)
// --------------------------------------------------------------------------
const numConfig = {
  drSubtype: 'NUMERIC' as const,
  canonicalAnswer: '9.8',
  toleranceType: 'ABSOLUTE' as const,
  toleranceValue: 0.01,
  expectedUnit: 'm/s^2',
  unitRequired: true
};

assert(gradeDRResponse('9.8 m/s^2', numConfig).status === 'CORRECT', 'DR_NUMERIC: Exact value + unit (9.8 m/s^2 -> CORRECT)');
console.log("Debug parseNumericAnswer('৯.৮ m/s²'):", parseNumericAnswer('৯.৮ m/s²'));
console.log("Debug numConfig grade:", gradeDRResponse('৯.৮ m/s²', numConfig));
assert(gradeDRResponse('৯.৮ m/s²', numConfig).status === 'CORRECT', 'DR_NUMERIC: Bengali digits + unicode unit (৯.৮ m/s² -> CORRECT)');
assert(gradeDRResponse('9.79 m/s^2', numConfig).status === 'CORRECT', 'DR_NUMERIC: Within absolute tolerance 0.01 (9.79 m/s^2 -> CORRECT)');
assert(gradeDRResponse('9.9 m/s^2', numConfig).status === 'INCORRECT', 'DR_NUMERIC: Outside absolute tolerance 0.01 (9.9 m/s^2 -> INCORRECT)');
assert(gradeDRResponse('9.8 kg', numConfig).status === 'INCORRECT', 'DR_NUMERIC: Wrong unit rejection when unitRequired=true (9.8 kg -> INCORRECT)');

// Relative & Percentage Tolerance
const relConfig = {
  drSubtype: 'NUMERIC' as const,
  canonicalAnswer: '100',
  toleranceType: 'PERCENTAGE' as const,
  toleranceValue: 5 // 5%
};
assert(gradeDRResponse('104', relConfig).status === 'CORRECT', 'DR_NUMERIC: Within 5% tolerance (104 -> CORRECT)');
assert(gradeDRResponse('110', relConfig).status === 'INCORRECT', 'DR_NUMERIC: Outside 5% tolerance (110 -> INCORRECT)');

// --------------------------------------------------------------------------
// 3. DR_SYMBOLIC Subtype Tests (Algebraic Equivalence, Zero-Eval AST Engine)
// --------------------------------------------------------------------------
const symConfig = {
  drSubtype: 'SYMBOLIC' as const,
  canonicalAnswer: 'F = m*a'
};

assert(gradeDRResponse('F = ma', symConfig).status === 'CORRECT', 'DR_SYMBOLIC: Formula match (F = ma -> CORRECT)');
assert(gradeDRResponse('m*a = F', symConfig).status === 'CORRECT', 'DR_SYMBOLIC: Commutative equation (ma = F -> CORRECT)');

const quadConfig = {
  drSubtype: 'SYMBOLIC' as const,
  canonicalAnswer: 'x^2 - 1'
};
assert(gradeDRResponse('(x - 1)*(x + 1)', quadConfig).status === 'CORRECT', 'DR_SYMBOLIC: Factored form ((x-1)(x+1) -> CORRECT)');
assert(gradeDRResponse('x^2 + 1', quadConfig).status === 'INCORRECT', 'DR_SYMBOLIC: Invalid math expression (x^2+1 -> INCORRECT)');

// --------------------------------------------------------------------------
// 4. DR_SET Subtype Tests (Order-Insensitive Set Matching)
// --------------------------------------------------------------------------
const setConfig = {
  drSubtype: 'SET' as const,
  canonicalAnswer: 'A, B, C'
};

assert(gradeDRResponse('C, A, B', setConfig).status === 'CORRECT', 'DR_SET: Reordered set match (C, A, B -> CORRECT)');
assert(gradeDRResponse('A, B', setConfig).status === 'INCORRECT', 'DR_SET: Incomplete set (A, B -> INCORRECT)');

// --------------------------------------------------------------------------
// 5. DR_LIST Subtype Tests (Order-Sensitive Sequence Matching)
// --------------------------------------------------------------------------
const listConfig = {
  drSubtype: 'LIST' as const,
  canonicalAnswer: 'Prophase -> Metaphase -> Anaphase -> Telophase'
};

assert(gradeDRResponse('Prophase -> Metaphase -> Anaphase -> Telophase', listConfig).status === 'CORRECT', 'DR_LIST: Correct ordered sequence -> CORRECT');
assert(gradeDRResponse('Prophase -> Anaphase -> Metaphase -> Telophase', listConfig).status === 'INCORRECT', 'DR_LIST: Reordered sequence -> INCORRECT');

// --------------------------------------------------------------------------
// 6. UNANSWERED Status & 2-Tier Diagnostic Matrix Integration
// --------------------------------------------------------------------------
const drQuestion = {
  id: 'q1',
  marks: 5,
  drSubtype: 'TEXT' as const,
  canonicalAnswer: 'NEPHRON',
  acceptedAnswers: ['nephron', 'নেফ্রন'],
  reasonOptions: [
    { id: 'r1', text: 'Nephrons filter blood in the renal cortex', isCorrect: true },
    { id: 'r2', text: 'Flawed reasoning', isCorrect: false }
  ]
};

// Unanswered Test
const unattemptedRes = evaluateDRQuestion(drQuestion as any, { answer: '', reasonId: '' } as any);
assert(unattemptedRes.status === 'UNANSWERED', 'UNANSWERED: Empty DR response produces status UNANSWERED');
assert(unattemptedRes.score === 0, 'UNANSWERED: Empty DR response awards 0 marks');
assert(unattemptedRes.isAttempted === false, 'UNANSWERED: isAttempted flag is false');

// Attempted Mastery Test
const masteryRes = evaluateDRQuestion(drQuestion as any, { answer: 'নেফ্রন', reasonId: 'r1', confidence: 'Certain' } as any);
assert(masteryRes.status === 'CORRECT', 'MASTERY: Answer + Correct Reason = CORRECT');
assert(masteryRes.score === 5, 'MASTERY: Full 5 marks awarded');
assert(masteryRes.diagnosticTag === 'MASTERY', 'MASTERY: Diagnostic tag is MASTERY');

// --------------------------------------------------------------------------
// 7. Security & Injection Protection
// --------------------------------------------------------------------------
const injectionInput = "process.exit(1); console.log('HACKED');";
const secRes = gradeDRResponse(injectionInput, textConfig);
assert(secRes.status === 'INCORRECT', 'SECURITY: Code injection payload handled safely without execution -> INCORRECT');

console.log("--------------------------------------------------------------------------");
console.log("SUMMARY: ALL DR AUTOGRADER TESTS PASSED CLEANLY!");
console.log("--------------------------------------------------------------------------");
