// Dynamic Math & Chemical Expression Parsing Engine
// Normalizes algebraic, chemical & numerical expressions, handles implicit multiplication,
// renders clean LaTeX representations with automatic MathJax delimiters, and evaluates equivalence.

/**
 * Advanced canonical normalizer for math, chemical formulas, ion charges, superscripts, subscripts, and LaTeX.
 * Unifies:
 * - D^2+ vs D^{2+} vs D^{+2} vs D^{2 +} vs D²⁺
 * - Ca^2+ vs Ca^{2+} vs Ca^{2 +}
 * - SO_4^2- vs SO_4^{2-} vs SO_{4}^{2-}
 * - $D^{2+}$ vs D^{2+}
 * - \mathrm{D}^{2+} vs \text{D}^{2+} vs D^{2+}
 * - x^2 vs x^{2}
 * - a_1 vs a_{1}
 * - fractions: \frac{a}{b} vs (a)/(b)
 * - multiplication: \cdot, \times, *
 */
export function normalizeCanonicalMathOrChemical(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // 1. Strip outer enclosing dollar signs $...$ or $$...$$
  str = str.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();

  // 2. Normalize Unicode superscripts and subscripts
  const unicodeMap: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
    '₊': '_+', '₋': '_-'
  };
  for (const [u, r] of Object.entries(unicodeMap)) {
    str = str.split(u).join(r);
  }

  // 3. Remove LaTeX text / style wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}, \ce{...}, \pu{...}
  let prev = '';
  while (str !== prev) {
    prev = str;
    str = str.replace(/\\(text|mathrm|mathbf|mathit|textbf|textit|ce|pu)\{([^{}]+)\}/g, '$2');
  }

  // 4. Remove LaTeX spacing & bracket sizing commands
  str = str.replace(/\\left|\\right|\\!|\\,|\\;|\\:|\\quad|\\qquad/g, '');

  // 5. Convert LaTeX multiplication \cdot, \times -> *
  str = str.replace(/\\cdot|\\times/g, '*');

  // 6. Convert LaTeX fractions \frac{a}{b} -> (a)/(b)
  while (str.includes('\\frac')) {
    const nextStr = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    if (nextStr === str) break;
    str = nextStr;
  }

  // 7. Convert LaTeX sqrt \sqrt{a} -> sqrt(a)
  str = str.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');

  // 8. Clean spaces inside braces
  str = str.replace(/\^\s*\{([^}]+)\}/g, (_, inner) => `^{${inner.replace(/\s+/g, '')}}`);
  str = str.replace(/_\s*\{([^}]+)\}/g, (_, inner) => `_{${inner.replace(/\s+/g, '')}}`);

  // 9. Standardize ion charges and superscripts:
  // e.g. "D^2+", "D^{2+}", "D^{+2}", "D^+2" -> "D^{2+}"
  str = str.replace(/\^\{?\s*(\d+)\s*([+-])\s*\}?/g, '^{$1$2}');
  str = str.replace(/\^\{?\s*([+-])\s*(\d+)\s*\}?/g, '^{$2$1}');

  // Double signs e.g. ++ -> 2+, -- -> 2-
  str = str.replace(/\^\{?\s*(\+\+)\s*\}?/g, '^{2+}');
  str = str.replace(/\^\{?\s*(--)\s*\}?/g, '^{2-}');
  str = str.replace(/\^\{?\s*([+-])\s*\}?/g, '^{$1}');

  // Simple token superscript without braces: x^2 -> x^{2}, a^b -> a^{b}
  str = str.replace(/\^([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '^{$1}');

  // Simple token subscript without braces: H_2 -> H_{2}
  str = str.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '_{$1}');

  // 10. Clean remaining whitespace
  str = str.replace(/\s+/g, '');

  return str;
}

/**
 * Creates a flattened representation of a math/chemical expression by stripping
 * non-semantic braces and whitespace so that "D^{2+}" and "D^2+" become identical "D^2+".
 */
export function flattenMathOrChemical(raw: string | number | undefined | null): string {
  const norm = normalizeCanonicalMathOrChemical(raw);
  return norm
    .replace(/[\{\}]/g, '')
    .replace(/\^([+-])(\d+)/g, '^$2$1')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Converts a raw mathematical string or LaTeX expression into a standardized ASCII expression.
 * E.g., "\frac{2x+1}{x-3}" -> "(2*x+1)/(x-3)"
 * E.g., "3x^2 + 5x" -> "3*x^2 + 5*x"
 */
export function normalizeExpression(rawExpr: string): string {
  if (!rawExpr || typeof rawExpr !== 'string') return '';

  let expr = rawExpr.trim();

  // 1. Strip outer enclosing dollar signs $...$ or $$...$$
  expr = expr.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();

  // 2. Remove LaTeX text / style wrappers
  expr = expr.replace(/\\(text|mathrm|mathbf|mathit|textbf|textit|ce|pu)\{([^{}]+)\}/g, '$2');

  // 3. Convert LaTeX fractions \frac{num}{den} -> (num)/(den)
  let prevExpr = '';
  while (expr !== prevExpr) {
    prevExpr = expr;
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  }

  // 4. Convert LaTeX square roots \sqrt{val} -> sqrt(val)
  expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  expr = expr.replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, 'sqrt($1)');

  // 5. Convert LaTeX multiplication symbols \cdot, \times -> *
  expr = expr.replace(/\\cdot|\\times/g, '*');

  // 6. Convert Unicode superscripts: ² -> ^2, ³ -> ^3
  expr = expr.replace(/²/g, '^2').replace(/³/g, '^3');

  // 7. Remove LaTeX spacing commands and brackets
  expr = expr.replace(/\\left|\\right|\\!|\\,|\\;|\\:/g, '');

  // 8. Protect math functions and multi-letter variables with numbers/underscores (e.g. sqrt, sin, cos, prev, s1, p2, stage_1)
  const mathFunctions = ['sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'abs', 'prev'];
  const wordTokens = Array.from(new Set(expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []))
    .filter(w => mathFunctions.includes(w.toLowerCase()) || /[0-9_]/.test(w));

  const placeholders: Record<string, string> = {};
  wordTokens.forEach((word, idx) => {
    const ph = `__${idx}__`;
    placeholders[ph] = word;
    expr = expr.replace(new RegExp(`(?<![a-zA-Z0-9_])${word}(?![a-zA-Z0-9_])`, 'g'), ph);
  });

  // 9. Normalize implicit multiplication:
  // e.g. "2x" -> "2*x", "3(a+b)" -> "3*(a+b)", "(x+1)(x-1)" -> "(x+1)*(x-1)"
  expr = expr.replace(/(\d+)([a-zA-Z])/g, '$1*$2');

  let prevMul = '';
  while (expr !== prevMul) {
    prevMul = expr;
    expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
  }

  expr = expr.replace(/(\d+)\s*\(/g, '$1*(');
  expr = expr.replace(/([a-zA-Z])\s*\(/g, '$1*(');
  expr = expr.replace(/\)\s*\(/g, ')*(');
  expr = expr.replace(/\)\s*([a-zA-Z])/g, ')*$1');

  // Restore protected word tokens
  Object.entries(placeholders).forEach(([ph, word]) => {
    expr = expr.replace(new RegExp(ph, 'g'), word);
  });

  // 10. Clean whitespace around operators
  expr = expr.replace(/\s+/g, '');

  return expr;
}

/**
 * Converts ASCII math or raw student text into clean MathJax LaTeX syntax with automatic $...$ delimiters.
 * E.g., "D^2+" -> "$D^{2+}$"
 * E.g., "Ca^{2+}" -> "$Ca^{2+}$"
 * E.g., "(2*x+1)/(x-3)" -> "$\frac{2x+1}{x-3}$"
 * E.g., "sqrt(x^2+1)" -> "$\sqrt{x^{2}+1}$"
 */
export function formatExpressionToLatex(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';

  let raw = expr.trim();
  if (!raw) return '';

  // Strip leading/trailing dollar signs first for uniform processing
  let latex = raw.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();

  // If it's already full LaTeX with commands
  if (!latex.includes('\\frac') && !latex.includes('\\sqrt')) {
    // Replace explicit multiplication with subtle spacing or implicit
    latex = latex.replace(/(\d+)\*([a-zA-Z])/g, '$1$2');
    latex = latex.replace(/\*/g, ' \\cdot ');

    // Normalize ion charges and power superscripts: D^2+ -> D^{2+}, x^2 -> x^{2}
    latex = latex.replace(/\^\{?\s*(\d+)\s*([+-])\s*\}?/g, '^{$1$2}');
    latex = latex.replace(/\^\{?\s*([+-])\s*(\d+)\s*\}?/g, '^{$2$1}');
    latex = latex.replace(/\^\{?\s*(\+\+)\s*\}?/g, '^{2+}');
    latex = latex.replace(/\^\{?\s*(--)\s*\}?/g, '^{2-}');
    latex = latex.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');

    // Format simple fractions: (num)/(den) -> \frac{num}{den}
    latex = latex.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, '\\frac{$1}{$2}');
    latex = latex.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');

    // Format sqrt(val) -> \sqrt{val}
    latex = latex.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');
  }

  // Auto-wrap in inline MathJax delimiters $ ... $ so MathJax typesets it automatically
  return `$${latex}$`;
}

/**
 * Safely evaluates a simple numeric/algebraic expression for sample variables.
 */
export function evaluateExpressionAtSample(expr: string, vars: Record<string, number> = {}): number | null {
  try {
    let text = String(expr || '').trim();

    // 1. Normalize implicit multiplication & LaTeX FIRST (e.g. 2x -> 2*x, \frac{a}{b} -> (a)/(b))
    text = normalizeExpression(text);

    // 2. Substitute variables (e.g. prev, s1, part1, x, y, etc.)
    const sortedVars = Object.entries(vars).sort((a, b) => b[0].length - a[0].length);
    for (const [varName, val] of sortedVars) {
      const regex = new RegExp(`(?<![a-zA-Z_])${varName}(?![a-zA-Z0-9_])`, 'g');
      const valStr = (typeof val === 'number' && val < 0) ? `(${val})` : String(val);
      text = text.replace(regex, valStr);
    }

    // 3. Convert powers ^ to ** JS exponentiation
    let norm = text.replace(/\^/g, '**');

    // 4. Convert sqrt to Math.sqrt
    norm = norm.replace(/sqrt\(([^()]+)\)/g, 'Math.sqrt($1)');

    // Sanitize string to allow only numbers, operators, Math.pow, Math.sqrt, hyphens
    if (/[^0-9\.\+\*\/\(\)\,\sMath\.powsqrt\-]/ .test(norm)) {
      return null;
    }

    // Function constructor safe evaluation
    const evalFunc = new Function(`return ${norm};`);
    const res = Number(evalFunc());
    return isFinite(res) && !isNaN(res) ? res : null;
  } catch {
    return null;
  }
}

/**
 * Dynamic Algorithm to check if two mathematical / chemical / algebraic expressions are equivalent.
 * 1. Checks direct string equality (case-insensitive & whitespace-free).
 * 2. Checks canonical math/chemical normalization (D^2+ == D^{2+} == D^{+2} == D²⁺).
 * 3. Checks flattened brace-free comparison (removing non-semantic braces).
 * 4. Handles equation symmetry (LHS = RHS vs RHS = LHS).
 * 5. Checks numeric float tolerance (e.g., ±0.05).
 * 6. Checks normalized algebraic string equality.
 * 7. Evaluates algebraic equivalence across sample points (e.g. x = 2.5, 5.1).
 */
export function areExpressionsEquivalent(
  studentExpr: string | number,
  expectedExpr: string | number,
  tolerance: number = 0.01
): boolean {
  if (studentExpr === undefined || studentExpr === null || expectedExpr === undefined || expectedExpr === null) {
    return false;
  }

  const stuStr = String(studentExpr).trim();
  const expStr = String(expectedExpr).trim();

  // 1. Direct equality
  if (stuStr.toLowerCase() === expStr.toLowerCase()) return true;

  // 2. Canonical Math & Chemical Normalization (e.g. D^2+ vs D^{2+} vs D^{+2} vs D²⁺, Ca^2+ vs Ca^{2+}, SO_4^2- vs SO_4^{2-})
  const canonStu = normalizeCanonicalMathOrChemical(stuStr);
  const canonExp = normalizeCanonicalMathOrChemical(expStr);
  if (canonStu && canonExp && (canonStu === canonExp || canonStu.toLowerCase() === canonExp.toLowerCase())) {
    return true;
  }

  // 3. Flattened brace-free comparison (strips non-semantic braces from superscripts and subscripts)
  const flatStu = flattenMathOrChemical(stuStr);
  const flatExp = flattenMathOrChemical(expStr);
  if (flatStu && flatExp && flatStu === flatExp) {
    return true;
  }

  // 4. Equation Symmetry Check (e.g. F = ma vs ma = F)
  if (stuStr.includes('=') && expStr.includes('=')) {
    const stuParts = stuStr.split('=').map(s => s.trim());
    const expParts = expStr.split('=').map(s => s.trim());

    if (stuParts.length === 2 && expParts.length === 2) {
      const directEquiv = areExpressionsEquivalent(stuParts[0], expParts[0], tolerance) && areExpressionsEquivalent(stuParts[1], expParts[1], tolerance);
      const flippedEquiv = areExpressionsEquivalent(stuParts[0], expParts[1], tolerance) && areExpressionsEquivalent(stuParts[1], expParts[0], tolerance);
      if (directEquiv || flippedEquiv) return true;
    }
  }

  // 5. Direct numeric comparison with tolerance for purely numeric strings
  const cleanNumStu = stuStr.replace(/[$,]/g, '').trim();
  const cleanNumExp = expStr.replace(/[$,]/g, '').trim();
  if (/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(cleanNumStu) && /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(cleanNumExp)) {
    const stuNum = Number(cleanNumStu);
    const expNum = Number(cleanNumExp);
    if (Math.abs(stuNum - expNum) <= tolerance) return true;
  }

  // 6. Normalized algebraic string comparison
  const normStu = normalizeExpression(stuStr);
  const normExp = normalizeExpression(expStr);
  if (normStu && normExp && normStu.toLowerCase() === normExp.toLowerCase()) {
    return true;
  }

  // 7. Sample point evaluation for variable expressions (e.g. x, y, a, b, m, v, F, etc.)
  const normStuForVars = normalizeExpression(stuStr);
  const normExpForVars = normalizeExpression(expStr);
  const varNames = Array.from(new Set([
    ...(normStuForVars.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []),
    ...(normExpForVars.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [])
  ])).filter(w => !['sqrt', 'sin', 'cos', 'tan', 'log', 'ln', 'abs', 'Math', 'pow'].includes(w));
  
  if (varNames.length > 0) {
    const primes1 = [2.3, 3.7, 1.9, 4.1, 5.3, 2.9, 3.1, 4.7];
    const primes2 = [5.1, 1.7, 3.3, 2.7, 4.3, 1.3, 5.7, 2.1];

    const sampleSets = [
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes1[i % primes1.length] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes2[i % primes2.length] }), {} as Record<string, number>)
    ];

    let allSamplesMatch = true;
    let validSampleCount = 0;

    for (const samples of sampleSets) {
      const valStu = evaluateExpressionAtSample(stuStr, samples);
      const valExp = evaluateExpressionAtSample(expStr, samples);

      if (valStu !== null && valExp !== null) {
        validSampleCount++;
        if (Math.abs(valStu - valExp) > (tolerance || 0.05)) {
          allSamplesMatch = false;
          break;
        }
      } else {
        allSamplesMatch = false;
        break;
      }
    }

    if (validSampleCount > 0 && allSamplesMatch) {
      return true;
    }
  }

  return false;
}
