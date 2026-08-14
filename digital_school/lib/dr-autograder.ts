/**
 * Production-Grade Deterministic DR Autograder Engine
 * 
 * 100% Local, Zero-AI, Deterministic, Fast (O(N)), Explainable, and Production-Safe.
 * Supports Multilingual (Bangla, English, Banglish) Text, Bengali Digits, 
 * Configurable Numeric Tolerances, Units, Symbolic Math, Order-Sensitive Lists & Sets.
 */

import { areExpressionsEquivalent, normalizeExpression } from './math-parser';

export type DRSubtype = 'TEXT' | 'NUMERIC' | 'SYMBOLIC' | 'SET' | 'LIST';
export type DRToleranceType = 'ABSOLUTE' | 'RELATIVE' | 'PERCENTAGE';
export type DRMatchMethod = 'EXACT' | 'ALIAS' | 'NUMERIC' | 'SYMBOLIC' | 'SET' | 'LIST' | 'NONE';

export interface DRGradingConfig {
  drSubtype?: DRSubtype;
  canonicalAnswer?: string;
  acceptedAnswers?: string[] | string; // Array or comma/newline separated list
  aliases?: string[] | string;
  toleranceType?: DRToleranceType;
  toleranceValue?: number;
  expectedUnit?: string;
  unitRequired?: boolean;
  orderSensitive?: boolean;
  caseSensitive?: boolean;
  allowBengali?: boolean;
}

export interface DRGradingResult {
  status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED' | 'REVIEW_REQUIRED';
  score: number;
  maxScore: number;
  matchedBy: DRMatchMethod;
  canonicalStudentAnswer: string;
  canonicalExpectedAnswer: string;
  feedback?: string;
  rawStudentAnswer: string;
  isAttempted: boolean;
}

// Map Bengali digits to Arabic digits
const BENGALI_DIGITS_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

// Superscript / Subscript Map
const SUPER_SUB_MAP: Record<string, string> = {
  '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
  '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9'
};

/**
 * Converts Bengali digits to Arabic numbers (e.g., '৯.৮' -> '9.8')
 */
export function normalizeBengaliDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[০-৯]/g, (digit) => BENGALI_DIGITS_MAP[digit] || digit);
}

/**
 * Normalizes text for multilingual matching:
 * 1. Unicode NFKC normalization
 * 2. Bengali digits -> Arabic digits
 * 3. Superscripts / Subscripts -> ASCII notation
 * 4. Mathematical symbol normalization (×, ·, −, ÷ -> *, *, -, /)
 * 5. Whitespace collapsing and optional case normalization
 */
export function normalizeMultilingualText(text: string, options: { caseSensitive?: boolean } = {}): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Superscripts and Subscripts before NFKC
  let norm = text.trim();
  norm = norm.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUPER_SUB_MAP[ch] || ch);

  // 2. Unicode NFKC normalization
  norm = norm.normalize('NFKC');

  // 3. Bengali digits -> Arabic digits
  norm = normalizeBengaliDigits(norm);

  // 4. Mathematical symbols
  norm = norm
    .replace(/[×·]/g, '*')
    .replace(/[−–—]/g, '-')
    .replace(/[÷]/g, '/');

  // 5. Punctuation & Whitespace
  norm = norm.replace(/[\s\t\r\n]+/g, ' ');

  // 6. Case sensitivity
  if (!options.caseSensitive) {
    norm = norm.toLowerCase();
  }

  return norm;
}

export function normalizeUnit(unitStr: string): string {
  if (!unitStr) return '';
  let u = unitStr.trim();
  u = u.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUPER_SUB_MAP[ch] || ch);
  u = normalizeBengaliDigits(u);
  u = u.normalize('NFKC');
  u = u.replace(/\s*[\/\\]\s*/g, '/');
  u = u.replace(/\s+/g, '*');
  u = u.replace(/(\w+)\^-(\d+)/g, '/$1^$2');
  return u.toLowerCase();
}

/**
 * Robust numeric parser supporting integer, decimal, scientific notation,
 * fractions, Bengali digits, and optional units.
 */
export function parseNumericAnswer(rawText: string): { value: number | null; unit: string } {
  if (!rawText) return { value: null, unit: '' };

  let norm = rawText.trim();
  norm = norm.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUPER_SUB_MAP[ch] || ch);
  norm = normalizeBengaliDigits(norm.normalize('NFKC'));

  // Check fraction e.g. "9/10" or "-3/4"
  const fracMatch = norm.match(/^([-+]?\d+)\s*\/\s*([-+]?\d+)(?:\s*(.*))?$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return { value: num / den, unit: normalizeUnit(fracMatch[3] || '') };
    }
  }

  // Check scientific notation or standard number (e.g. 1.2e3, 1.2 x 10^3, 9.8 m/s^2)
  const sciMatch = norm.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?|\d+)(?:\s*(?:\*|x|×)\s*10\^?([-+]?\d+))?(?:\s*(.*))?$/i);
  if (sciMatch) {
    let val = parseFloat(sciMatch[1]);
    if (sciMatch[2]) {
      val = val * Math.pow(10, parseFloat(sciMatch[2]));
    }
    const unitStr = sciMatch[3] || '';
    if (!isNaN(val)) {
      return { value: val, unit: normalizeUnit(unitStr) };
    }
  }

  return { value: null, unit: '' };
}

/**
 * Converts accepted answers into a clean list of normalized strings & canonical mappings.
 */
function parseAcceptedList(accepted: string[] | string | undefined): string[] {
  if (!accepted) return [];
  if (Array.isArray(accepted)) {
    return accepted.map(a => String(a).trim()).filter(Boolean);
  }
  if (typeof accepted === 'string') {
    return accepted
      .split(/[\n,;।]+/)
      .map(a => a.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * 1. TEXT Autograder
 * Uses exact normalized matching & canonical alias map.
 */
export function evaluateTextDR(studentText: string, config: DRGradingConfig): { isCorrect: boolean; matchedBy: DRMatchMethod } {
  const normStu = normalizeMultilingualText(studentText, { caseSensitive: config.caseSensitive });
  if (!normStu) return { isCorrect: false, matchedBy: 'NONE' };

  const canonical = normalizeMultilingualText(config.canonicalAnswer || '', { caseSensitive: config.caseSensitive });

  // 1. Direct canonical match
  if (canonical && normStu === canonical) {
    return { isCorrect: true, matchedBy: 'EXACT' };
  }

  // 2. Alias list match
  const aliases = parseAcceptedList(config.acceptedAnswers || config.aliases);
  for (const alias of aliases) {
    const normAlias = normalizeMultilingualText(alias, { caseSensitive: config.caseSensitive });
    if (normAlias && normStu === normAlias) {
      return { isCorrect: true, matchedBy: 'ALIAS' };
    }
  }

  return { isCorrect: false, matchedBy: 'NONE' };
}

/**
 * 2. NUMERIC Autograder
 * Compares numeric values using ABSOLUTE, RELATIVE, or PERCENTAGE tolerance.
 */
export function evaluateNumericDR(studentText: string, config: DRGradingConfig): { isCorrect: boolean; matchedBy: DRMatchMethod } {
  const parsedStu = parseNumericAnswer(studentText);
  const parsedExp = parseNumericAnswer(config.canonicalAnswer || '');

  if (parsedStu.value === null || parsedExp.value === null) {
    return { isCorrect: false, matchedBy: 'NONE' };
  }

  // Verify Unit if required
  if (config.unitRequired) {
    const expectedUnit = normalizeUnit(config.expectedUnit || parsedExp.unit || '');
    if (expectedUnit && parsedStu.unit !== expectedUnit) {
      return { isCorrect: false, matchedBy: 'NONE' };
    }
  }

  const stu = parsedStu.value;
  const exp = parsedExp.value;
  const tolType = config.toleranceType || 'ABSOLUTE';
  const tolVal = Number(config.toleranceValue ?? 0.01);

  let isNumericOk = false;

  const diff = Math.abs(stu - exp);
  const eps = 1e-9;

  if (tolType === 'ABSOLUTE') {
    isNumericOk = diff <= (tolVal + eps);
  } else if (tolType === 'RELATIVE') {
    isNumericOk = exp !== 0 ? (diff / Math.abs(exp)) <= (tolVal + eps) : diff <= (tolVal + eps);
  } else if (tolType === 'PERCENTAGE') {
    isNumericOk = exp !== 0 ? (diff / Math.abs(exp)) <= ((tolVal / 100) + eps) : diff <= ((tolVal / 100) + eps);
  }

  return { isCorrect: isNumericOk, matchedBy: isNumericOk ? 'NUMERIC' : 'NONE' };
}

/**
 * 3. SYMBOLIC Autograder
 * Uses zero-eval AST / sample-point evaluation engine.
 */
export function evaluateSymbolicDR(studentText: string, config: DRGradingConfig): { isCorrect: boolean; matchedBy: DRMatchMethod } {
  const expected = config.canonicalAnswer || '';
  const tol = Number(config.toleranceValue ?? 0.01);

  // Check equivalence safely
  const isEquivalent = areExpressionsEquivalent(studentText, expected, tol);

  if (isEquivalent) {
    return { isCorrect: true, matchedBy: 'SYMBOLIC' };
  }

  // Check aliases as fallback for symbolic expressions
  const aliases = parseAcceptedList(config.acceptedAnswers || config.aliases);
  for (const alias of aliases) {
    if (areExpressionsEquivalent(studentText, alias, tol)) {
      return { isCorrect: true, matchedBy: 'SYMBOLIC' };
    }
  }

  return { isCorrect: false, matchedBy: 'NONE' };
}

/**
 * 4. SET Autograder (Order-Insensitive)
 */
export function evaluateSetDR(studentText: string, config: DRGradingConfig): { isCorrect: boolean; matchedBy: DRMatchMethod } {
  const splitItems = (txt: string) => {
    return txt
      .split(/[\n,;।]+/)
      .map(item => normalizeMultilingualText(item, { caseSensitive: config.caseSensitive }))
      .filter(Boolean);
  };

  const stuItems = Array.from(new Set(splitItems(studentText)));
  const expItems = Array.from(new Set(splitItems(config.canonicalAnswer || '')));

  if (stuItems.length === 0 || expItems.length === 0) {
    return { isCorrect: false, matchedBy: 'NONE' };
  }

  if (stuItems.length !== expItems.length) {
    return { isCorrect: false, matchedBy: 'NONE' };
  }

  const isSetMatch = expItems.every(expItem => stuItems.includes(expItem));

  return { isCorrect: isSetMatch, matchedBy: isSetMatch ? 'SET' : 'NONE' };
}

/**
 * 5. LIST Autograder (Order-Sensitive)
 */
export function evaluateListDR(studentText: string, config: DRGradingConfig): { isCorrect: boolean; matchedBy: DRMatchMethod } {
  const splitItems = (txt: string) => {
    return txt
      .split(/(?:->|→|[\n,;।])/)
      .map(item => normalizeMultilingualText(item, { caseSensitive: config.caseSensitive }))
      .filter(Boolean);
  };

  const stuList = splitItems(studentText);
  const expList = splitItems(config.canonicalAnswer || '');

  if (stuList.length === 0 || expList.length === 0 || stuList.length !== expList.length) {
    return { isCorrect: false, matchedBy: 'NONE' };
  }

  const isListMatch = expList.every((expItem, idx) => stuList[idx] === expItem);

  return { isCorrect: isListMatch, matchedBy: isListMatch ? 'LIST' : 'NONE' };
}

/**
 * Master Deterministic DR Autograder Entry Point
 */
export function gradeDRResponse(
  rawStudentAnswer: any,
  config: DRGradingConfig,
  maxMarks: number = 1
): DRGradingResult {
  const rawStr = typeof rawStudentAnswer === 'object' && rawStudentAnswer !== null
    ? String(rawStudentAnswer.answer ?? '').trim()
    : String(rawStudentAnswer ?? '').trim();

  const isAttempted = Boolean(rawStr && rawStr !== 'No answer provided');
  const canonicalExpected = (config.canonicalAnswer || '').trim();

  if (!isAttempted) {
    return {
      status: 'UNANSWERED',
      score: 0,
      maxScore: maxMarks,
      matchedBy: 'NONE',
      canonicalStudentAnswer: '',
      canonicalExpectedAnswer: canonicalExpected,
      feedback: 'Question unattempted.',
      rawStudentAnswer: '',
      isAttempted: false
    };
  }

  const subtype = (config.drSubtype || 'TEXT').toUpperCase() as DRSubtype;
  let evalResult: { isCorrect: boolean; matchedBy: DRMatchMethod } = { isCorrect: false, matchedBy: 'NONE' };

  // Dispatch to deterministic subtype engine
  switch (subtype) {
    case 'NUMERIC':
      evalResult = evaluateNumericDR(rawStr, config);
      break;
    case 'SYMBOLIC':
      evalResult = evaluateSymbolicDR(rawStr, config);
      break;
    case 'SET':
      evalResult = evaluateSetDR(rawStr, config);
      break;
    case 'LIST':
      evalResult = evaluateListDR(rawStr, config);
      break;
    case 'TEXT':
    default:
      evalResult = evaluateTextDR(rawStr, config);
      break;
  }

  const canonicalStudent = normalizeMultilingualText(rawStr, { caseSensitive: config.caseSensitive });
  const finalScore = evalResult.isCorrect ? maxMarks : 0;

  return {
    status: evalResult.isCorrect ? 'CORRECT' : 'INCORRECT',
    score: finalScore,
    maxScore: maxMarks,
    matchedBy: evalResult.matchedBy,
    canonicalStudentAnswer: canonicalStudent,
    canonicalExpectedAnswer: canonicalExpected,
    feedback: evalResult.isCorrect
      ? `Correct (${evalResult.matchedBy} match)`
      : `Incorrect. Expected: ${canonicalExpected}`,
    rawStudentAnswer: rawStr,
    isAttempted: true
  };
}
