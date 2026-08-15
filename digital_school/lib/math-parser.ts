// Dynamic Math, Physics & Bengali Expression Parsing Engine
// Normalizes algebraic, chemical, physical & numerical expressions, handles implicit multiplication,
// commutativity of products (e.g. GMm == GmM), LaTeX superscripts (e.g. R^2 == $R^{2}$),
// Bengali digits & synonyms (e.g. ৫ == 5, হ্যাঁ == yes, বৃদ্ধি পাবে == increase),
// renders clean LaTeX representations, and evaluates equivalence.

/**
 * Normalizes Bengali numerals, Bengali punctuation/danda, zero-width characters,
 * and converts LaTeX / Greek symbols to unified standard ASCII identifiers.
 */
export function normalizeBengaliNumeralsAndText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let text = String(str).trim();
  if (!text) return '';

  // Zero-width characters & non-breaking spaces
  text = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');

  // Bengali digits 0-9 (০-৯) to standard 0-9
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  bnDigits.forEach((d, i) => {
    text = text.split(d).join(String(i));
  });

  // Bengali danda between digits or as dot
  text = text.replace(/(\d)[\u0964\u0965](\d)/g, '$1.$2');
  text = text.replace(/[\u0964\u0965]/g, ' ');

  // Replace LaTeX Greek letters (with 1 or more backslashes)
  text = text.replace(/\\+(pi|theta|lambda|mu|omega|alpha|beta|gamma|delta|rho|sigma|phi)\b/gi, '$1');

  // Greek letters & symbols
  const symbolMap: Record<string, string> = {
    'π': 'pi', 'Π': 'pi',
    'θ': 'theta', 'Θ': 'theta',
    'λ': 'lambda', 'Λ': 'lambda',
    'μ': 'mu',
    'ω': 'omega', 'Ω': 'omega',
    'α': 'alpha',
    'β': 'beta',
    'γ': 'gamma', 'Γ': 'gamma',
    'δ': 'delta', 'Δ': 'delta',
    'ρ': 'rho',
    'σ': 'sigma', 'Σ': 'sigma',
    'φ': 'phi', 'ϕ': 'phi', 'Φ': 'phi',
    '×': '*', '⋅': '*', '•': '*', '·': '*',
    '÷': '/'
  };

  for (const [sym, rep] of Object.entries(symbolMap)) {
    text = text.split(sym).join(rep);
  }

  return text.trim();
}

/**
 * Standard Bengali and English scientific synonym groups for semantic text evaluation.
 */
export const BENGALI_SYNONYM_GROUPS: string[][] = [
  ['yes', 'true', '1', 'হ্যাঁ', 'হাঁ', 'সঠিক', 'সত্য', 'রাইট', 'correct', 'right'],
  ['no', 'false', '0', 'না', 'নাই', 'ভুল', 'মিথ্যা', 'রং', 'incorrect', 'wrong'],
  ['increase', 'increases', 'increasing', 'বৃদ্ধি পাবে', 'বৃদ্ধি', 'বাড়বে', 'বাড়বে', 'উন্নতি', 'বেড়ে যাবে', 'বেড়ে যাবে', 'বৃদ্ধি পায়', 'বৃদ্ধি pay', 'বৃদ্ধি পায়'],
  ['decrease', 'decreases', 'decreasing', 'হ্রাস পাবে', 'হ্রাস', 'কমবে', 'কম', 'হ্রাস পায়', 'হ্রাস pay', 'হ্রাস পায়', 'কমে যাবে'],
  ['constant', 'unchanged', 'same', 'সমান', 'অপরিবর্তিত', 'একই থাকবে', 'ধ্রুবক', 'একই', 'অপরিবর্তিত থাকবে', 'স্থির থাকবে', 'স্থির'],
  ['zero', '0', '০', 'শূন্য', 'শূণ্য', 'নিল', 'nil', 'none'],
  ['positive', '+', 'ধনাত্মক', 'পজিটিভ', 'পজেটিভ'],
  ['negative', '-', 'ঋণাত্মক', 'নেগেটিভ'],
  ['north', 'উত্তর', 'উত্তরমুখী', 'উত্তর দিকে'],
  ['south', 'দক্ষিণ', 'দক্ষিণমুখী', 'দক্ষিণ দিকে'],
  ['east', 'পূর্ব', 'পূর্বমুখী', 'পূর্ব দিকে'],
  ['west', 'পশ্চিম', 'পশ্চিমমুখী', 'পশ্চিম দিকে']
];

/**
 * Checks if two text strings are semantically equivalent based on scientific synonym groups.
 */
export function areSynonymsEquivalent(textA: string, textB: string): boolean {
  const a = textA.toLowerCase().replace(/\s+/g, ' ').trim();
  const b = textB.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  for (const group of BENGALI_SYNONYM_GROUPS) {
    const hasA = group.some(item => item.toLowerCase() === a);
    const hasB = group.some(item => item.toLowerCase() === b);
    if (hasA && hasB) return true;
  }
  return false;
}

/**
 * Strips LaTeX delimiters, style macros, fractions, roots, Unicode powers, and braces into clean ASCII.
 */
export function stripLatexAndMathFormatting(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let s = String(str).trim();
  if (!s) return '';

  // Strip dollar signs & display math markers ($...$, $$...$$, \(...\), \[...\])
  s = s.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();
  s = s.replace(/^\\\(|^\\\[/, '').replace(/\\\)$|\\\]$/, '').trim();
  s = s.replace(/\$/g, '').trim();

  // Strip LaTeX style commands: \text{...}, \mathrm{...}, \mathbf{...}, \ce{...}, etc.
  let prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/\\+(text|mathrm|mathbf|mathit|textbf|textit|bm|mathbb|ce|pu|displaystyle|textstyle)\{([^{}]+)\}/g, '$2');
  }
  s = s.replace(/\\+(displaystyle|textstyle|mathrm|mathbf|mathit|bm|mathbb)\b/g, '');

  // Strip LaTeX spacing and bracket sizing commands
  s = s.replace(/\\+(left|right|Big|bigg|Bigg|quad|qquad)\b/g, '');
  s = s.replace(/\\+(!|,|;|:)/g, '');

  // Convert LaTeX operators \cdot, \times -> *
  s = s.replace(/\\+(cdot|times)/g, '*');
  s = s.replace(/\\+(div)/g, '/');

  // Convert fractions \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b} -> (a)/(b)
  while (/\\+(frac|dfrac|tfrac)/.test(s)) {
    const nextS = s.replace(/\\+(frac|dfrac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '($2)/($3)');
    if (nextS === s) break;
    s = nextS;
  }

  // Convert sqrt
  s = s.replace(/\\+sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\+sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '(($2)^(1/($1)))');

  // Convert Unicode superscripts & subscripts
  const unicodeMap: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
    '₊': '_+', '₋': '_-'
  };
  for (const [u, r] of Object.entries(unicodeMap)) {
    s = s.split(u).join(r);
  }

  // Convert LaTeX power and subscript braces: ^{...} -> ^(...)
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)');
  s = s.replace(/_\{([^{}]+)\}/g, '_($1)');

  return s;
}

/**
 * Advanced canonical normalizer for math, chemical formulas, ion charges, superscripts, subscripts, and LaTeX.
 */
export function normalizeCanonicalMathOrChemical(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null) return '';
  let str = normalizeBengaliNumeralsAndText(raw);
  str = stripLatexAndMathFormatting(str);

  // Standardize ion charges and superscripts:
  // e.g. "D^2+", "D^(2+)", "D^+2" -> "D^{2+}"
  str = str.replace(/\^\(?\s*(\d+)\s*([+-])\s*\)?/g, '^{$1$2}');
  str = str.replace(/\^\(?\s*([+-])\s*(\d+)\s*\)?/g, '^{$2$1}');
  str = str.replace(/\^\(?\s*(\+\+)\s*\)?/g, '^{2+}');
  str = str.replace(/\^\(?\s*(--)\s*\)?/g, '^{2-}');
  str = str.replace(/\^\(?\s*([+-])\s*\)?/g, '^{$1}');

  // Simple token superscript: x^2 -> x^{2}, a^b -> a^{b}
  str = str.replace(/\^([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '^{$1}');

  // Simple token subscript: H_2 -> H_{2}
  str = str.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '_{$1}');

  return str.replace(/\s+/g, '');
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
 * Handles implicit multiplication, scientific notation (1.5x10^8 -> 1.5e8), juxtaposed variables (GMm -> G*M*m).
 */
export function normalizeExpression(rawExpr: string | number | undefined | null): string {
  if (rawExpr === undefined || rawExpr === null) return '';
  const rawStr = String(rawExpr).trim();
  if (!rawStr) return '';

  let expr = normalizeBengaliNumeralsAndText(rawStr);
  expr = stripLatexAndMathFormatting(expr);

  // Convert scientific notation: 1.5x10^8 or 1.5*10^8 or 1.5*10^(8) or 1.5 \times 10^{8} -> 1.5e8
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*(?:\*|x|X)\s*10\^\(?([-+]?\d+)\)?/g, '$1e$2');

  // Multi-letter functions and named constants (pi, theta, sin, etc.)
  const knownKeywords = [
    'sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'abs', 'prev',
    'pi', 'theta', 'lambda', 'omega', 'delta', 'alpha', 'beta', 'gamma', 'rho', 'sigma', 'phi'
  ];

  // Tokenize string to preserve multi-letter functions and add explicit multiplication between variables/tokens
  // e.g. "2pir" -> "2 * pi * r", "GMm" -> "G * M * m", "2 pi r" -> "2 * pi * r", "2x" -> "2 * x"
  let formatted = '';
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    // If whitespace, convert to multiplication between valid math tokens
    if (/\s/.test(ch)) {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        let j = i + 1;
        while (j < expr.length && /\s/.test(expr[j])) j++;
        if (j < expr.length && /[a-zA-Z0-9_\(]/.test(expr[j])) {
          formatted += '*';
        }
      }
      i++;
      continue;
    }

    // Check if substring starts with a known keyword
    let matchedKw: string | null = null;
    for (const kw of knownKeywords) {
      if (expr.substring(i, i + kw.length).toLowerCase() === kw) {
        matchedKw = kw;
        break;
      }
    }

    if (matchedKw) {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        formatted += '*';
      }
      formatted += matchedKw;
      i += matchedKw.length;
      if (i < expr.length && /[a-zA-Z0-9_\(]/.test(expr[i])) {
        formatted += '*';
      }
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        formatted += '*';
      }
      formatted += ch;
      i++;
      continue;
    }

    if (/\d/.test(ch)) {
      if (formatted.length > 0 && formatted[formatted.length - 1] === ')') {
        formatted += '*';
      }
      formatted += ch;
      i++;
      continue;
    }

    if (ch === '(') {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        formatted += '*';
      }
      formatted += ch;
      i++;
      continue;
    }

    formatted += ch;
    i++;
  }

  // Clean syntax artifacts
  formatted = formatted.replace(/\*+/g, '*');
  formatted = formatted.replace(/\(\*/g, '(').replace(/\*\)/g, ')');
  formatted = formatted.replace(/\^\*/g, '^');
  formatted = formatted.replace(/\s+/g, '');

  return formatted;
}

/**
 * Converts ASCII math or raw student text into clean MathJax LaTeX syntax with automatic $...$ delimiters.
 */
export function formatExpressionToLatex(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';

  let raw = normalizeBengaliNumeralsAndText(expr.trim());
  if (!raw) return '';

  // Strip leading/trailing dollar signs first for uniform processing
  let latex = raw.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();

  // If it's already full LaTeX with commands
  if (!latex.includes('\\frac') && !latex.includes('\\sqrt')) {
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

  return `$${latex}$`;
}

/**
 * Safely evaluates a simple numeric/algebraic expression for sample variables.
 */
export function evaluateExpressionAtSample(expr: string, vars: Record<string, number> = {}): number | null {
  try {
    let text = normalizeExpression(expr);
    if (!text) return null;

    // Substitute variables (longest variable name first to prevent partial replacements)
    const sortedVars = Object.entries(vars).sort((a, b) => b[0].length - a[0].length);
    for (const [varName, val] of sortedVars) {
      if (varName.toLowerCase() === 'pi') {
        text = text.replace(/(?<![a-zA-Z0-9_])pi(?![a-zA-Z0-9_])/gi, `(${Math.PI})`);
        continue;
      }
      const regex = new RegExp(`(?<![a-zA-Z0-9_])${varName}(?![a-zA-Z0-9_])`, 'g');
      const valStr = (typeof val === 'number' && val < 0) ? `(${val})` : String(val);
      text = text.replace(regex, valStr);
    }

    text = text.replace(/(?<![a-zA-Z0-9_])pi(?![a-zA-Z0-9_])/gi, `(${Math.PI})`);

    // Convert powers: ^(...) or ^\d+ -> **(...) or **\d+
    let norm = text.replace(/\^/g, '**');

    // Convert sqrt
    norm = norm.replace(/sqrt\(([^()]+)\)/g, 'Math.sqrt($1)');

    // Sanitize string to allow only numbers, operators, Math.sqrt, scientific notation
    if (/[^0-9\.\+\*\/\(\)\,\sMath\.powsqrt\-eE]/.test(norm)) {
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
 * Dynamic Algorithm to check if two mathematical / chemical / physical expressions or Bengali text answers are equivalent.
 * 1. Checks direct string equality (case-insensitive & whitespace-free).
 * 2. Checks Bengali and scientific synonym groups (e.g. হ্যাঁ == yes, বৃদ্ধি পাবে == increase, শূন্য == 0).
 * 3. Normalizes Bengali digits (০-৯ -> 0-9) and danda.
 * 4. Strips LaTeX formatting, delimiters, style commands, fractions, and root wrappers.
 * 5. Handles equation symmetry (LHS = RHS vs RHS = LHS).
 * 6. Checks numeric float tolerance (e.g., ±0.05).
 * 7. Checks normalized algebraic string equality.
 * 8. Evaluates algebraic equivalence across multiple independent sample points.
 * 9. Handles product factor permutation (commutativity of multiplication: GMm == GmM == mGM, 2*pi*r == 2*r*pi).
 */
export function areExpressionsEquivalent(
  studentExpr: string | number | undefined | null,
  expectedExpr: string | number | undefined | null,
  tolerance: number = 0.01
): boolean {
  if (studentExpr === undefined || studentExpr === null || expectedExpr === undefined || expectedExpr === null) {
    return false;
  }

  let stuStr = String(studentExpr).trim();
  let expStr = String(expectedExpr).trim();

  if (!stuStr && !expStr) return true;
  if (!stuStr || !expStr) return false;

  // 1. Direct text equality
  if (stuStr.toLowerCase() === expStr.toLowerCase()) return true;

  // 2. Bengali & scientific synonyms equivalence (e.g. হ্যাঁ == yes, বৃদ্ধি পাবে == increase, শূন্য == 0)
  if (areSynonymsEquivalent(stuStr, expStr)) return true;

  // 3. Bengali text & numeral normalization
  const bnStu = normalizeBengaliNumeralsAndText(stuStr);
  const bnExp = normalizeBengaliNumeralsAndText(expStr);
  if (bnStu.toLowerCase() === bnExp.toLowerCase()) return true;
  if (areSynonymsEquivalent(bnStu, bnExp)) return true;

  // 4. Canonical Math & Chemical Normalization (e.g. D^2+ vs D^{2+} vs D²⁺, SO_4^{2-} vs SO_4^2-)
  const canonStu = normalizeCanonicalMathOrChemical(bnStu);
  const canonExp = normalizeCanonicalMathOrChemical(bnExp);
  if (canonStu && canonExp && (canonStu === canonExp || canonStu.toLowerCase() === canonExp.toLowerCase())) {
    return true;
  }

  // 5. Flattened brace-free comparison (strips non-semantic braces)
  const flatStu = flattenMathOrChemical(bnStu);
  const flatExp = flattenMathOrChemical(bnExp);
  if (flatStu && flatExp && flatStu === flatExp) {
    return true;
  }

  // 6. Strip LaTeX and formatting
  const cleanStu = stripLatexAndMathFormatting(bnStu);
  const cleanExp = stripLatexAndMathFormatting(bnExp);
  if (cleanStu.toLowerCase().replace(/\s+/g, '') === cleanExp.toLowerCase().replace(/\s+/g, '')) return true;
  if (areSynonymsEquivalent(cleanStu, cleanExp)) return true;

  // 7. Equation Symmetry Check (e.g. F = ma vs ma = F)
  if (cleanStu.includes('=') && cleanExp.includes('=')) {
    const sParts = cleanStu.split('=').map(s => s.trim());
    const eParts = cleanExp.split('=').map(s => s.trim());
    if (sParts.length === 2 && eParts.length === 2) {
      if (
        (areExpressionsEquivalent(sParts[0], eParts[0], tolerance) && areExpressionsEquivalent(sParts[1], eParts[1], tolerance)) ||
        (areExpressionsEquivalent(sParts[0], eParts[1], tolerance) && areExpressionsEquivalent(sParts[1], eParts[0], tolerance))
      ) {
        return true;
      }
    }
  }

  // 8. Direct numeric comparison (with tolerance) for purely numeric values
  const numStu = parseFloat(cleanStu.replace(/[$,]/g, ''));
  const numExp = parseFloat(cleanExp.replace(/[$,]/g, ''));
  if (!isNaN(numStu) && !isNaN(numExp) && String(numStu) === cleanStu.trim() && String(numExp) === cleanExp.trim()) {
    if (Math.abs(numStu - numExp) <= tolerance) return true;
  }

  // 9. Normalized algebraic string comparison
  const normStu = normalizeExpression(stuStr);
  const normExp = normalizeExpression(expectedExpr);
  if (normStu && normExp && normStu.toLowerCase() === normExp.toLowerCase()) {
    return true;
  }

  // 10. Multi-point sample point evaluation for variable expressions (e.g. G, M, m, R, x, y, v, t, etc.)
  const varNames = Array.from(new Set([
    ...(normStu.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []),
    ...(normExp.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [])
  ])).filter(w => !['sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'abs', 'Math', 'pow', 'pi'].includes(w.toLowerCase()));

  if (varNames.length > 0) {
    const primes1 = [2.3, 3.7, 1.9, 4.1, 5.3, 2.9, 3.1, 4.7];
    const primes2 = [5.1, 1.7, 3.3, 2.7, 4.3, 1.3, 5.7, 2.1];
    const primes3 = [3.9, 4.5, 2.1, 1.5, 6.1, 3.5, 4.9, 2.7];

    const sampleSets = [
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes1[i % primes1.length] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes2[i % primes2.length] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes3[i % primes3.length] }), {} as Record<string, number>)
    ];

    let allSamplesMatch = true;
    let validSampleCount = 0;

    for (const samples of sampleSets) {
      const valStu = evaluateExpressionAtSample(stuStr, samples);
      const valExp = evaluateExpressionAtSample(expectedExpr, samples);

      if (valStu !== null && valExp !== null && !isNaN(valStu) && !isNaN(valExp) && isFinite(valStu) && isFinite(valExp)) {
        validSampleCount++;
        const diff = Math.abs(valStu - valExp);
        const relativeDiff = Math.abs(valExp) > 1e-6 ? diff / Math.abs(valExp) : diff;
        if (diff > (tolerance || 0.05) && relativeDiff > 0.01) {
          allSamplesMatch = false;
          break;
        }
      } else {
        allSamplesMatch = false;
        break;
      }
    }

    if (validSampleCount >= 2 && allSamplesMatch) {
      return true;
    }
  }

  // 11. Permutation of product factors (e.g. GMm vs GmM vs mGM)
  const extractFactors = (expr: string) => {
    return normalizeExpression(expr).split('*').sort();
  };
  const factorsStu = extractFactors(stuStr);
  const factorsExp = extractFactors(expectedExpr);
  if (factorsStu.length > 1 && factorsStu.join('*') === factorsExp.join('*')) {
    return true;
  }
  if (factorsStu.length > 1 && factorsStu.map(s => s.toLowerCase()).sort().join('*') === factorsExp.map(s => s.toLowerCase()).sort().join('*')) {
    return true;
  }

  return false;
}
