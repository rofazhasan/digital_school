import { normalizeExpression, areExpressionsEquivalent, formatExpressionToLatex, normalizeCanonicalMathOrChemical, flattenMathOrChemical } from '../lib/math-parser';
import { evaluateCMAChildPart } from '../lib/evaluation/cmaEvaluation';
import { cleanupMath } from '../lib/utils';

console.log('==========================================================================');
console.log('   DYNAMIC ALGEBRAIC & CHEMICAL EXPRESSION EQUIVALENCE & PREVIEW SUITE');
console.log('==========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`, details || '');
  }
}

// 1. Ion Charges & Chemical Normalization: D^2+ vs D^{2+}
console.log('--- 1. Ion Charges & Chemical Normalization ---');
assert(
  areExpressionsEquivalent("D^2+", "D^{2+}"),
  'Direct Ion Charge Equivalence: D^2+ == D^{2+}'
);

assert(
  areExpressionsEquivalent("D^{+2}", "D^{2+}"),
  'Inverted Sign Ion Charge: D^{+2} == D^{2+}'
);

assert(
  areExpressionsEquivalent("D²⁺", "D^{2+}"),
  'Unicode Superscripts: D²⁺ == D^{2+}'
);

assert(
  areExpressionsEquivalent("Ca^2+", "Ca^{2+}"),
  'Calcium Ion: Ca^2+ == Ca^{2+}'
);

assert(
  areExpressionsEquivalent("SO_4^2-", "SO_{4}^{2-}"),
  'Sulfate Ion: SO_4^2- == SO_{4}^{2-}'
);

assert(
  areExpressionsEquivalent("\\mathrm{D}^{2+}", "D^2+"),
  'LaTeX mathrm wrapper: \\mathrm{D}^{2+} == D^2+'
);

assert(
  areExpressionsEquivalent("$D^{2+}$", "D^2+"),
  'Dollar sign wrapped vs raw: $D^{2+}$ == D^2+'
);

assert(
  areExpressionsEquivalent("Fe^{3+}", "Fe^3+"),
  'Iron(III) Ion: Fe^{3+} == Fe^3+'
);

// 2. Algebraic Equivalence
console.log('\n--- 2. Algebraic Expressions & Formulas ---');
assert(areExpressionsEquivalent("2x + 1", "1 + 2x"), "Equivalent: 2x+1 == 1+2x");
assert(areExpressionsEquivalent("x^2 + 2x + 1", "(x + 1)^2"), "Equivalent: x^2+2x+1 == (x+1)^2");
assert(areExpressionsEquivalent("x^2", "x^{2}"), "Equivalent: x^2 == x^{2}");
assert(areExpressionsEquivalent("\\frac{a}{b}", "(a)/(b)"), "Equivalent: LaTeX \\frac{a}{b} == (a)/(b)");
assert(areExpressionsEquivalent("0.5*m*v^2", "\\frac{1}{2}mv^2"), "Equivalent: 0.5*m*v^2 == \\frac{1}{2}mv^2");
assert(areExpressionsEquivalent("3.14159", "3.14", 0.01), "Equivalent: Float tolerance matching (3.14159 ~ 3.14)");
assert(!areExpressionsEquivalent("2x + 1", "2x + 2"), "Non-equivalent: 2x+1 != 2x+2");
assert(!areExpressionsEquivalent("D^2+", "D^3+"), "Non-equivalent: D^2+ != D^3+");

// 3. Auto LaTeX Formatting for Preview without manual $ $
console.log('\n--- 3. Auto LaTeX Preview Formatting ---');
const fmtD2 = formatExpressionToLatex("D^2+");
assert(fmtD2 === "$D^{2+}$", `Auto-wrapped preview for D^2+: got ${fmtD2}`);

const fmtFrac = formatExpressionToLatex("(2x+1)/(x-3)");
assert(fmtFrac.includes("\\frac{2x+1}{x-3}") && fmtFrac.startsWith("$") && fmtFrac.endsWith("$"), `Auto-wrapped fraction preview: got ${fmtFrac}`);

const cleanD2 = cleanupMath("D^2+");
assert(cleanD2.startsWith("$") && cleanD2.endsWith("$") && cleanD2.includes("D^{2+}"), `cleanupMath auto-delimit D^2+: got ${cleanD2}`);

const cleanBraced = cleanupMath("D^{2+}");
assert(cleanBraced.startsWith("$") && cleanBraced.endsWith("$"), `cleanupMath auto-delimit D^{2+}: got ${cleanBraced}`);

// 4. CMA Child Evaluation with D^2+ and D^{2+}
console.log('\n--- 4. CMA Child Part Evaluation ---');
const cmaPart = {
  id: 'p1',
  label: 'Product Ion Formula',
  type: 'expression',
  expectedAnswer: 'D^{2+}',
  marks: 2
};

const cmaRes_raw = evaluateCMAChildPart(cmaPart as any, "D^2+");
assert(cmaRes_raw.isCorrect && cmaRes_raw.earnedRatio === 1, 'CMA: Student enters "D^2+" against expected "D^{2+}" -> CORRECT (Score 2/2)', cmaRes_raw);

const cmaRes_spaces = evaluateCMAChildPart(cmaPart as any, "D ^ 2 +");
assert(cmaRes_spaces.isCorrect && cmaRes_spaces.earnedRatio === 1, 'CMA: Student enters "D ^ 2 +" with spaces -> CORRECT (Score 2/2)', cmaRes_spaces);

const cmaRes_unicode = evaluateCMAChildPart(cmaPart as any, "D²⁺");
assert(cmaRes_unicode.isCorrect && cmaRes_unicode.earnedRatio === 1, 'CMA: Student enters unicode "D²⁺" -> CORRECT (Score 2/2)', cmaRes_unicode);

console.log('\n==========================================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} AUDIT TESTS PASSED CLEANLY!`);
console.log('==========================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
