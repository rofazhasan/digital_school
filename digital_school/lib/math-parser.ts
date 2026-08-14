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

  // 6. Protect math functions and multi-letter variables with numbers/underscores (e.g. sqrt, sin, cos, prev, s1, p2, stage_1)
  const mathFunctions = ['sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'abs', 'prev'];
  const wordTokens = Array.from(new Set(expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []))
    .filter(w => mathFunctions.includes(w.toLowerCase()) || /[0-9_]/.test(w));

  const placeholders: Record<string, string> = {};
  wordTokens.forEach((word, idx) => {
    const ph = `__${idx}__`;
    placeholders[ph] = word;
    expr = expr.replace(new RegExp(`(?<![a-zA-Z0-9_])${word}(?![a-zA-Z0-9_])`, 'g'), ph);
  });

  // 7. Normalize implicit multiplication:
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

  // 8. Clean whitespace around operators
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
 * Dynamic Algorithm to check if two mathematical / algebraic expressions are equivalent.
 * 1. Checks direct string equality (case-insensitive & whitespace-free).
 * 2. Handles equation symmetry (LHS = RHS vs RHS = LHS).
 * 3. Checks normalized string equality.
 * 4. Evaluates algebraic equivalence across sample points (e.g. x = 2.5, 5.1).
 * 5. Checks numeric float tolerance (e.g., ±0.05).
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

  // 2. Equation Symmetry Check (e.g. F = ma vs ma = F)
  if (stuStr.includes('=') && expStr.includes('=')) {
    const stuParts = stuStr.split('=').map(s => s.trim());
    const expParts = expStr.split('=').map(s => s.trim());

    if (stuParts.length === 2 && expParts.length === 2) {
      const directEquiv = areExpressionsEquivalent(stuParts[0], expParts[0], tolerance) && areExpressionsEquivalent(stuParts[1], expParts[1], tolerance);
      const flippedEquiv = areExpressionsEquivalent(stuParts[0], expParts[1], tolerance) && areExpressionsEquivalent(stuParts[1], expParts[0], tolerance);
      if (directEquiv || flippedEquiv) return true;
    }
  }

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
