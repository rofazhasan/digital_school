// Dynamic Math & Expression Parsing Engine
// Normalizes algebraic & numerical expressions, handles implicit multiplication,
// renders LaTeX representations, and evaluates algebraic equivalence across sample points.

/**
 * Converts a raw mathematical string or LaTeX expression into a standardized ASCII expression.
 * E.g., "\frac{2x+1}{x-3}" -> "(2*x+1)/(x-3)"
 * E.g., "3x^2 + 5x" -> "3*x^2 + 5*x"
 */
export function normalizeExpression(rawExpr: string): string {
  if (!rawExpr || typeof rawExpr !== 'string') return '';

  let expr = rawExpr.trim();

  // 1. Convert LaTeX fractions \frac{num}{den} -> (num)/(den)
  let prevExpr = '';
  while (expr !== prevExpr) {
    prevExpr = expr;
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  }

  // 2. Convert LaTeX square roots \sqrt{val} -> sqrt(val)
  expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  expr = expr.replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, 'sqrt($1)');

  // 3. Convert LaTeX multiplication symbols \cdot, \times -> *
  expr = expr.replace(/\\cdot|\\times/g, '*');

  // 4. Convert Unicode superscripts: ² -> ^2, ³ -> ^3
  expr = expr.replace(/²/g, '^2').replace(/³/g, '^3');

  // 5. Remove LaTeX spacing commands and brackets
  expr = expr.replace(/\\left|\\right|\\!|\\,|\\;|\\:/g, '');

  // 6. Normalize implicit multiplication:
  // e.g. "2x" -> "2*x", "3(a+b)" -> "3*(a+b)", "(x+1)(x-1)" -> "(x+1)*(x-1)"
  expr = expr.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
  expr = expr.replace(/(\d+)\s*\(/g, '$1*(');
  expr = expr.replace(/\)\s*\(/g, ')*(');
  expr = expr.replace(/\)\s*([a-zA-Z])/g, ')*$1');

  // 7. Clean whitespace around operators
  expr = expr.replace(/\s+/g, '');

  return expr;
}

/**
 * Converts ASCII math syntax into clean MathJax / LaTeX syntax for dynamic rendering.
 * E.g., "(2*x+1)/(x-3)" -> "\frac{2x+1}{x-3}"
 * E.g., "sqrt(x^2+1)" -> "\sqrt{x^{2}+1}"
 */
export function formatExpressionToLatex(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';

  let latex = expr.trim();

  // If already full LaTeX, return as-is
  if (latex.includes('\\frac') || latex.includes('\\sqrt')) return latex;

  // Replace explicit multiplication with subtle spacing or implicit
  latex = latex.replace(/(\d+)\*([a-zA-Z])/g, '$1$2');
  latex = latex.replace(/\*/g, ' \\cdot ');

  // Format simple powers: x^2 -> x^{2}
  latex = latex.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');

  // Format sqrt(val) -> \sqrt{val}
  latex = latex.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');

  return latex;
}

/**
 * Safely evaluates a simple numeric/algebraic expression for sample variables.
 */
export function evaluateExpressionAtSample(expr: string, vars: Record<string, number> = {}): number | null {
  try {
    let norm = normalizeExpression(expr);

    // 1. Convert powers ^ to Math.pow before variable substitution
    let prevPow = '';
    while (norm !== prevPow) {
      prevPow = norm;
      norm = norm.replace(/\(([^()]+)\)\^([a-zA-Z0-9_.]+)/g, 'Math.pow($1,$2)');
      norm = norm.replace(/([a-zA-Z0-9_.]+)\^([a-zA-Z0-9_.]+)/g, 'Math.pow($1,$2)');
    }

    // 2. Convert sqrt to Math.sqrt
    norm = norm.replace(/sqrt\(([^()]+)\)/g, 'Math.sqrt($1)');

    // 3. Substitute variables
    for (const [varName, val] of Object.entries(vars)) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      norm = norm.replace(regex, `(${val})`);
    }

    // Sanitize string to allow only numbers, operators, Math.pow, Math.sqrt
    if (/[^0-9\.\+\-\*\/\(\)\,\sMath\.powsqrt]/.test(norm)) {
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
 * Dynamic Algorithm to check if two mathematical / algebraic expressions are equivalent.
 * 1. Checks direct string equality (case-insensitive & whitespace-free).
 * 2. Checks normalized string equality.
 * 3. Evaluates algebraic equivalence across sample points (e.g. x = 2.5, 5.1).
 * 4. Checks numeric float tolerance (e.g., ±0.05).
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

  // 2. Direct numeric comparison with tolerance for purely numeric strings
  if (/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(stuStr) && /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(expStr)) {
    const stuNum = Number(stuStr);
    const expNum = Number(expStr);
    if (Math.abs(stuNum - expNum) <= tolerance) return true;
  }

  // 3. Normalized string comparison
  const normStu = normalizeExpression(stuStr);
  const normExp = normalizeExpression(expStr);
  if (normStu && normExp && normStu.toLowerCase() === normExp.toLowerCase()) {
    return true;
  }

  // 4. Sample point evaluation for variable expressions (e.g. x, y, a, b)
  const varNames = Array.from(new Set([...stuStr.match(/[a-zA-Z]/g) || [], ...expStr.match(/[a-zA-Z]/g) || []]));
  
  if (varNames.length > 0) {
    const sampleSets = [
      { x: 2, y: 3, a: 2, b: 4, t: 1.5 },
      { x: 5.5, y: 1.2, a: 3, b: 7, t: 3.2 }
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
