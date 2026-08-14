import { normalizeExpression, areExpressionsEquivalent, formatExpressionToLatex, evaluateExpressionAtSample } from '../lib/math-parser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log("==========================================================================");
console.log("   DYNAMIC ALGEBRAIC MATH EXPRESSION EQUIVALENCE AUDIT SUITE");
console.log("==========================================================================");

// 1. Normalization Tests
assert(normalizeExpression("2x + 1") === "2*x+1", "Normalize 2x+1 -> 2*x+1");
assert(normalizeExpression("  (a + b) / (c - d) ") === "(a+b)/(c-d)", "Normalize whitespace & parentheses");
assert(normalizeExpression("\\frac{x^2+1}{2x}") === "(x^2+1)/(2*x)", "Normalize LaTeX fraction");

// 2. Algebraic Equivalence Tests
assert(areExpressionsEquivalent("2x + 1", "1 + 2x"), "Equivalent: 2x+1 == 1+2x");
console.log("Debug x^2+2x+1 at x=2:", evaluateExpressionAtSample("x^2+2x+1", {x:2}));
console.log("Debug (x+1)^2 at x=2:", evaluateExpressionAtSample("(x+1)^2", {x:2}));
assert(areExpressionsEquivalent("x^2 + 2x + 1", "(x + 1)^2"), "Equivalent: x^2+2x+1 == (x+1)^2");
assert(areExpressionsEquivalent("\\frac{a}{b}", "(a)/(b)"), "Equivalent: LaTeX \\frac{a}{b} == (a)/(b)");
assert(areExpressionsEquivalent("3.14159", "3.14", 0.01), "Equivalent: Float tolerance matching (3.14159 ~ 3.14)");
assert(!areExpressionsEquivalent("2x + 1", "2x + 2"), "Non-equivalent: 2x+1 != 2x+2");

// 3. Formatting to LaTeX Preview Tests
assert(formatExpressionToLatex("x^2") === "x^{2}", "Format LaTeX power x^2 -> x^{2}");
assert(formatExpressionToLatex("sqrt(x^2+1)") === "\\sqrt{x^{2}+1}", "Format sqrt -> \\sqrt");

console.log("--------------------------------------------------------------------------");
console.log("SUMMARY: ALL MATH EXPRESSION EQUIVALENCE TESTS PASSED CLEANLY!");
console.log("--------------------------------------------------------------------------");
