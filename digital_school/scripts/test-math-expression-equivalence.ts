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

// 2. Algebraic Expressions & Formulas
console.log('\n--- 2. Algebraic Expressions & Formulas ---');
assert(areExpressionsEquivalent("2x + 1", "1 + 2x"), "Equivalent: 2x+1 == 1+2x");
assert(areExpressionsEquivalent("x^2 + 2x + 1", "(x + 1)^2"), "Equivalent: x^2+2x+1 == (x+1)^2");
assert(areExpressionsEquivalent("x^2", "x^{2}"), "Equivalent: x^2 == x^{2}");
assert(areExpressionsEquivalent("\\frac{a}{b}", "(a)/(b)"), "Equivalent: LaTeX \\frac{a}{b} == (a)/(b)");
assert(areExpressionsEquivalent("0.5*m*v^2", "\\frac{1}{2}mv^2"), "Equivalent: 0.5*m*v^2 == \\frac{1}{2}mv^2");
assert(areExpressionsEquivalent("3.14159", "3.14", 0.01), "Equivalent: Float tolerance matching (3.14159 ~ 3.14)");
assert(!areExpressionsEquivalent("2x + 1", "2x + 2"), "Non-equivalent: 2x+1 != 2x+2");
assert(!areExpressionsEquivalent("D^2+", "D^3+"), "Non-equivalent: D^2+ != D^3+");

// 2.1 Equation Symmetry, Rearrangement & Transposition
console.log('\n--- 2.1 Equation Symmetry & Rearrangement ---');
assert(areExpressionsEquivalent("a^3+b^3+c=0", "$a^3+b^3+c=0$"), "Equation: a^3+b^3+c=0 == $a^3+b^3+c=0$");
assert(areExpressionsEquivalent("c+a^3+b^3=0", "$a^3+b^3+c=0$"), "Equation rearranged: c+a^3+b^3=0 == $a^3+b^3+c=0$");
assert(areExpressionsEquivalent("0=c+a^3+b^3", "$a^3+b^3+c=0$"), "Equation flipped: 0=c+a^3+b^3 == $a^3+b^3+c=0$");
assert(areExpressionsEquivalent("a^3+b^3=-c", "$a^3+b^3+c=0$"), "Equation transposed: a^3+b^3=-c == $a^3+b^3+c=0$");
assert(areExpressionsEquivalent("-c=a^3+b^3", "$a^3+b^3+c=0$"), "Equation transposed side: -c=a^3+b^3 == $a^3+b^3+c=0$");

// 2.2 Combinations & Permutations
console.log('\n--- 2.2 Combinations & Permutations ---');
assert(areExpressionsEquivalent("5C2", "10"), "Combinations: 5C2 == 10");
assert(areExpressionsEquivalent("5P2", "20"), "Permutations: 5P2 == 20");
assert(areExpressionsEquivalent("nCr", "\\binom{n}{r}"), "Combinations: nCr == \\binom{n}{r}");
assert(areExpressionsEquivalent("C(n, r)", "\\binom{n}{r}"), "Combinations: C(n, r) == \\binom{n}{r}");
assert(areExpressionsEquivalent("^{n+1}\\mathrm{C}_r", "\\binom{n+1}{r}"), "Combinations: ^{n+1}\\mathrm{C}_r == \\binom{n+1}{r}");
assert(areExpressionsEquivalent("P(n, r)", "^{n}\\mathrm{P}_r"), "Permutations: P(n, r) == ^{n}\\mathrm{P}_r");
assert(areExpressionsEquivalent("E=mc^2", "E = m * c^2"), "Formula with c: E=mc^2 == E=m*c^2");
assert(areExpressionsEquivalent("p*v=n*r*t", "pv = nRT"), "Formula with p: p*v=n*r*t == pv=nRT");

// 2.3 Coordinates, Tuples & Multi-Value Lists
console.log('\n--- 2.3 Coordinates, Tuples & Multi-Value Lists ---');
assert(areExpressionsEquivalent("13/5,0", "2.6,0"), "Coordinates: 13/5,0 == 2.6,0");
assert(areExpressionsEquivalent("13/5, 0", "2.6, 0"), "Coordinates with space: 13/5, 0 == 2.6, 0");
assert(areExpressionsEquivalent("(13/5, 0)", "(2.6, 0)"), "Parenthesized coordinates: (13/5, 0) == (2.6, 0)");
assert(areExpressionsEquivalent("[13/5, 0]", "[2.6, 0]"), "Bracketed coordinates: [13/5, 0] == [2.6, 0]");
assert(areExpressionsEquivalent("(13/5, 0)", "2.6, 0"), "Wrapped vs unwrapped: (13/5, 0) == 2.6, 0");
assert(areExpressionsEquivalent("13/5; 0", "2.6; 0"), "Semicolon separated list: 13/5; 0 == 2.6; 0");
assert(areExpressionsEquivalent("(1/2, 3/4)", "(0.5, 0.75)"), "Fraction coordinates: (1/2, 3/4) == (0.5, 0.75)");

// 2.4 Tolerance Level Accuracy
console.log('\n--- 2.4 Tolerance Level Accuracy ---');
assert(areExpressionsEquivalent("2.605", "2.6", 0.01), "Tolerance within limit: 2.605 ~ 2.6 (tol 0.01)");
assert(!areExpressionsEquivalent("2.65", "2.6", 0.01), "Tolerance exceeded: 2.65 != 2.6 (tol 0.01)");
assert(areExpressionsEquivalent("2.605, 0", "2.6, 0", 0.01), "Tuple tolerance within limit: 2.605,0 ~ 2.6,0 (tol 0.01)");
assert(!areExpressionsEquivalent("2.65, 0", "2.6, 0", 0.01), "Tuple tolerance exceeded: 2.65,0 != 2.6,0 (tol 0.01)");

// 2.5 Mixed Fractions
console.log('\n--- 2.5 Mixed Fractions ---');
assert(areExpressionsEquivalent("2 1/2", "5/2"), "Mixed fraction: 2 1/2 == 5/2");
assert(areExpressionsEquivalent("2 1/2", "2.5"), "Mixed fraction to decimal: 2 1/2 == 2.5");
assert(areExpressionsEquivalent("2\\frac{1}{2}", "2.5"), "LaTeX mixed fraction: 2\\frac{1}{2} == 2.5");
assert(areExpressionsEquivalent("২ ১/২", "2.5"), "Bengali mixed fraction: ২ ১/২ == 2.5");

// 2.6 Trigonometric Powers, Degrees & Identities
console.log('\n--- 2.6 Trigonometry & Angles ---');
assert(areExpressionsEquivalent("\\sin^2(x)", "(sin(x))^2"), "Trig power notation: \\sin^2(x) == (sin(x))^2");
assert(areExpressionsEquivalent("\\sin^2(x) + \\cos^2(x)", "1"), "Pythagorean trig identity: sin^2(x) + cos^2(x) == 1");
assert(areExpressionsEquivalent("\\sin(30^\\circ)", "0.5"), "Trig with degree symbol: \\sin(30^\\circ) == 0.5");
assert(areExpressionsEquivalent("sin(30 deg)", "1/2"), "Trig with deg keyword: sin(30 deg) == 1/2");
assert(areExpressionsEquivalent("\\cos(60 deg)", "0.5"), "Trig cos 60 deg: \\cos(60 deg) == 0.5");

// 2.7 Plus-Minus & Multi-Root Sets
console.log('\n--- 2.7 Plus-Minus & Multi-Root Sets ---');
assert(areExpressionsEquivalent("\\pm 3", "3, -3"), "Plus-minus expansion: \\pm 3 == 3, -3");
assert(areExpressionsEquivalent("±3", "{-3, 3}"), "Unicode plus-minus set: ±3 == {-3, 3}");
assert(areExpressionsEquivalent("x = \\pm 5", "x = 5, -5"), "Variable plus-minus: x = \\pm 5 == x = 5, -5");

// 2.8 Absolute Values & Logarithms
console.log('\n--- 2.8 Absolute Values & Logarithms ---');
assert(areExpressionsEquivalent("|2x - 3|", "abs(2x - 3)"), "Absolute value bars: |2x-3| == abs(2x-3)");
assert(areExpressionsEquivalent("\\left| 2x - 3 \\right|", "abs(2x - 3)"), "LaTeX absolute value: \\left|2x-3\\right| == abs(2x-3)");
assert(areExpressionsEquivalent("\\ln(x)", "ln(x)"), "Natural logarithm: \\ln(x) == ln(x)");
assert(areExpressionsEquivalent("\\log_{2}(8)", "3"), "Logarithm with base: \\log_{2}(8) == 3");

// 2.9 Simultaneous Variable Assignments & Inequalities
console.log('\n--- 2.9 Simultaneous Assignments & Inequalities ---');
assert(areExpressionsEquivalent("x = 2, y = 3", "y = 3, x = 2"), "Simultaneous assignment order: x=2, y=3 == y=3, x=2");
assert(areExpressionsEquivalent("x > 5", "5 < x"), "Inequality directional symmetry: x > 5 == 5 < x");
assert(areExpressionsEquivalent("x \\le 10", "10 >= x"), "Inequality with LaTeX: x \\le 10 == 10 >= x");

// 2.10 Complex Numbers & Expanded Bengali STEM Terms
console.log('\n--- 2.10 Complex Numbers & STEM Ontology ---');
assert(areExpressionsEquivalent("3 + 4i", "4i + 3"), "Complex number commutativity: 3 + 4i == 4i + 3");
assert(areExpressionsEquivalent("3 + 4j", "3 + 4i"), "Complex engineering j: 3 + 4j == 3 + 4i");
assert(areExpressionsEquivalent("প্লবতা", "buoyancy"), "STEM Synonym: প্লবতা == buoyancy");
assert(areExpressionsEquivalent("অর্ধায়ু", "half life"), "STEM Synonym: অর্ধায়ু == half life");
assert(areExpressionsEquivalent("বিভব পার্থক্য", "voltage"), "STEM Synonym: বিভব পার্থক্য == voltage");
assert(areExpressionsEquivalent("রোধ", "resistance"), "STEM Synonym: রোধ == resistance");

// 2.11 Physical Units Stripping & Dimensional Equivalence
console.log('\n--- 2.11 Physics & STEM Units ---');
assert(areExpressionsEquivalent("9.8 m/s^2", "9.8 ms^-2"), "Units equivalence: 9.8 m/s^2 == 9.8 ms^-2");
assert(areExpressionsEquivalent("9.8 \\text{ m/s}^2", "9.8"), "LaTeX unit to raw number: 9.8 \\text{ m/s}^2 == 9.8");
assert(areExpressionsEquivalent("100 N", "100"), "Force unit stripping: 100 N == 100");
assert(areExpressionsEquivalent("50 J", "50 Joule"), "Energy unit equivalence: 50 J == 50 Joule");
assert(areExpressionsEquivalent("9.8 মিটার/সেকেন্ড^২", "9.8"), "Bengali unit stripping: 9.8 মিটার/সেকেন্ড^২ == 9.8");

// 2.12 Calculus Derivatives & Integrals
console.log('\n--- 2.12 Calculus & Derivatives ---');
assert(areExpressionsEquivalent("\\frac{dy}{dx}", "y'"), "First derivative: \\frac{dy}{dx} == y'");
assert(areExpressionsEquivalent("\\frac{d^2y}{dx^2}", "y''"), "Second derivative: \\frac{d^2y}{dx^2} == y''");
assert(areExpressionsEquivalent("\\int f(x) dx", "int f(x) dx"), "Indefinite integral: \\int f(x) dx == int f(x) dx");

// 2.13 Recurring & Repeating Decimals (পৌনঃপুনিক)
console.log('\n--- 2.13 Recurring Decimals ---');
assert(areExpressionsEquivalent("0.\\dot{3}", "1/3"), "Recurring decimal: 0.\\dot{3} == 1/3");
assert(areExpressionsEquivalent("0.3333333333333333", "1/3"), "Repeating decimal digits: 0.3333... == 1/3");
assert(areExpressionsEquivalent("0.\\dot{6}", "2/3"), "Recurring decimal 0.\\dot{6} == 2/3");
assert(areExpressionsEquivalent("০.৩̇", "1/3"), "Bengali recurring dot: ০.৩̇ == 1/3");

// 2.14 Set Theory & Logic
console.log('\n--- 2.14 Set Theory & Logic ---');
assert(areExpressionsEquivalent("A \\cup B", "A U B"), "Set union: A \\cup B == A U B");
assert(areExpressionsEquivalent("A \\cap B", "A cap B"), "Set intersection: A \\cap B == A cap B");
assert(areExpressionsEquivalent("\\emptyset", "{}"), "Empty set: \\emptyset == {}");

// 2.15 3D Vectors to Coordinate Tuple
console.log('\n--- 2.15 3D Unit Vectors to Coordinates ---');
assert(areExpressionsEquivalent("2\\hat{i} + 3\\hat{j} - \\hat{k}", "(2, 3, -1)"), "3D vector hat to tuple: 2\\hat{i}+3\\hat{j}-\\hat{k} == (2, 3, -1)");
assert(areExpressionsEquivalent("2i + 3j - k", "(2, 3, -1)"), "3D vector ASCII to tuple: 2i + 3j - k == (2, 3, -1)");
assert(areExpressionsEquivalent("3i - 2j", "(3, -2, 0)"), "2D vector in 3D: 3i - 2j == (3, -2, 0)");

// 2.16 Advanced Scientific Laws & Molecular Biology
console.log('\n--- 2.16 Advanced Scientific Laws ---');
assert(areExpressionsEquivalent("কেপলারের সূত্র", "kepler's law"), "Law: কেপলারের সূত্র == kepler's law");
assert(areExpressionsEquivalent("কার্শফের সূত্র", "kvl"), "Law: কার্শফের সূত্র == kvl");
assert(areExpressionsEquivalent("বার্নোলির নীতি", "bernoulli's principle"), "Law: বার্নোলির নীতি == bernoulli's principle");
assert(areExpressionsEquivalent("লে শাতেলীয়ার নীতি", "le chatelier's principle"), "Law: লে শাতেলীয়ার নীতি == le chatelier's principle");
assert(areExpressionsEquivalent("মেন্ডেলের প্রথম সূত্র", "law of segregation"), "Biology: মেন্ডেলের প্রথম সূত্র == law of segregation");
assert(areExpressionsEquivalent("ডিএনএ প্রতিলিপন", "dna replication"), "Biology: ডিএনএ প্রতিলিপন == dna replication");
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
