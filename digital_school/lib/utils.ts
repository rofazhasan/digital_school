export type ClassValue = ClassValue[] | Record<string, boolean | null | undefined> | string | number | null | boolean | undefined;

let _clsx: any = null;
let _twMerge: any = null;

try {
  _clsx = require("clsx").clsx || require("clsx");
} catch {}

try {
  _twMerge = require("tailwind-merge").twMerge || require("tailwind-merge");
} catch {}

export function cn(...inputs: ClassValue[]) {
  if (_clsx && _twMerge) {
    return _twMerge(_clsx(inputs));
  }
  return inputs
    .flat(Infinity as any)
    .filter(Boolean)
    .map(x => (typeof x === 'object' && x !== null ? Object.keys(x).filter(k => (x as any)[k]).join(' ') : String(x)))
    .join(' ')
    .trim();
}

/**
 * Normalize a Bangladeshi phone number to the canonical 01XXXXXXXXX (11-digit) format.
 * Handles: +8801XXXXXXXXX, +880 1XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX, etc.
 * Strips spaces, dashes, parentheses before normalizing.
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-().]/g, '');
  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  // +880 / 880 prefix (Bangladesh country code)
  if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  // +88 / 88 prefix
  if (cleaned.startsWith('88') && !cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Resolves the effective passing percentage threshold (0-100).
 * Handles raw pass marks (e.g. 92 out of 230 total marks => 40%) 
 * as well as direct percentage pass marks (e.g. 33 or 40).
 */
export function getPassPercentage(passMarks?: number | null, totalMarks?: number | null): number {
  const rawPass = Number(passMarks);
  const total = Number(totalMarks);

  if (isNaN(rawPass) || rawPass <= 0) {
    return 33;
  }

  // If no valid totalMarks provided or totalMarks <= 0
  if (isNaN(total) || total <= 0) {
    return rawPass <= 60 ? rawPass : 33;
  }

  if (total === 100) {
    return rawPass <= 60 ? rawPass : 33;
  }

  const asRawMarksPct = (rawPass / total) * 100;

  // In educational grading systems (e.g. Bangladesh NCTB / SSC / HSC / University),
  // a pass mark percentage is NEVER higher than 60% (60% is A-, 80% is A+).
  // If treating rawPass as raw marks produces a pass threshold > 60% (e.g. 40 out of 50 = 80%),
  // but rawPass itself is <= 60 (e.g. 40 or 33 or 50):
  // The user/teacher entered a direct percentage (e.g. 40% pass mark)!
  if (asRawMarksPct > 60 && rawPass <= 60) {
    return rawPass;
  }

  // Conversely, if treating rawPass as raw marks produces an unrealistically low threshold (< 25%, e.g. 40 out of 200 = 20%),
  // but rawPass is between 30 and 60 (e.g. 40 or 33):
  // The user also entered a direct percentage!
  if (asRawMarksPct < 25 && rawPass >= 30 && rawPass <= 60) {
    return rawPass;
  }

  // If rawPass is within total and represents a realistic pass percentage (25% to 60%):
  // e.g. 20 out of 50 => 40%
  // e.g. 16.5 out of 50 => 33%
  // e.g. 33 out of 100 => 33%
  // e.g. 80 out of 200 => 40%
  if (rawPass <= total) {
    return Math.round(asRawMarksPct * 100) / 100;
  }

  // If rawPass > total, but rawPass is a valid percentage (<= 60, e.g. 33% on 25 marks):
  if (rawPass <= 60) {
    return rawPass;
  }

  return 33;
}

/**
 * Calculate grade based on percentage and pass mark.
 * Standard scale: 80+=A+, 70+=A, 60+=A-, 50+=B, 40+=C, Pass+=D, <Pass=F.
 * @param percentage - The percentage score (0-100)
 * @param passMark - The passing threshold (default: 33). Can be a percentage or raw marks if totalMarks is provided.
 * @param totalMarks - Optional total marks of the exam to normalize raw pass marks.
 * @returns The grade (A+, A, A-, B, C, D, F)
 */
export function calculateGrade(percentage: number, passMark: number = 33, totalMarks?: number): string {
  const effectivePassMark = getPassPercentage(passMark, totalMarks);

  if (percentage < effectivePassMark) {
    return 'F';
  }
  if (percentage >= 80) {
    return 'A+';
  } else if (percentage >= 70) {
    return 'A';
  } else if (percentage >= 60) {
    return 'A-';
  } else if (percentage >= 50) {
    return 'B';
  } else if (percentage >= 40) {
    return 'C';
  } else {
    return 'D';
  }
}

/**
 * Calculate GPA based on percentage and pass mark.
 * Uses piece-wise linear interpolation to ensure "Insaaf" (fairness) 
 * when the pass mark changes.
 * 
 * GPA scale:
 * A+: 5.00 (80-100)
 * A : 4.00 (70-79)
 * A-: 3.50 (60-69)
 * B : 3.00 (50-59)
 * C : 2.00 (40-49)
 * D : 1.00 (Pass-39)
 * F : 0.00 (<Pass)
 */
export function calculateGPA(percentage: number, passMark: number = 33, totalMarks?: number): number {
  const effectivePassMark = getPassPercentage(passMark, totalMarks);

  if (percentage < effectivePassMark) return 0.00;
  if (percentage >= 80) return 5.00;

  // Segment definitions for linear mapping
  const segments = [
    { start: 70, end: 80, minGPA: 4.00, maxGPA: 5.00 },
    { start: 60, end: 70, minGPA: 3.50, maxGPA: 4.00 },
    { start: 50, end: 60, minGPA: 3.00, maxGPA: 3.50 },
    { start: 40, end: 50, minGPA: 2.00, maxGPA: 3.00 },
    { start: effectivePassMark, end: 40, minGPA: 1.00, maxGPA: 2.00 },
  ];

  // Find the appropriate segment
  for (const seg of segments) {
    if (percentage >= seg.start && percentage < seg.end) {
      const range = seg.end - seg.start;
      if (range <= 0) return seg.minGPA;
      const ratio = (percentage - seg.start) / range;
      const gpa = seg.minGPA + ratio * (seg.maxGPA - seg.minGPA);
      return Math.round(gpa * 100) / 100;
    }
  }

  // Fallback for edge cases where passMark >= 40, 50, etc.
  if (percentage >= 70) return 4.00;
  if (percentage >= 60) return 3.50;
  if (percentage >= 50) return 3.00;
  if (percentage >= 40) return 2.00;

  return 1.00;
}

/**
 * Calculate percentage from total marks and earned marks
 * @param earnedMarks - Marks earned by student
 * @param totalMarks - Total possible marks
 * @returns Percentage (0-100)
 */
export function calculatePercentage(earnedMarks: number, totalMarks: number): number {
  if (totalMarks === 0) return 0;
  return Math.round((earnedMarks / totalMarks) * 100);
}

// Standard LaTeX commands starting with \n that should not be converted to a newline
const LATEX_N_COMMANDS = '(?:abla|atural|earrow|eq(?![a-zA-Z])|e(?![a-zA-Z])|eg(?![a-zA-Z])|ewcommand|ewenvironment|i(?![a-zA-Z])|eftarrow|Leftarrow|mid|obreak|ocite|oexpand|oindent|olimits|onstopmode|opagebreak|ormalsize|otin(?![a-zA-Z])|ot(?![a-zA-Z])|parallel|rightarrow|Rightarrow|sim|subset|subseteq|supset|supseteq|u(?![a-zA-Z])|ull|umber|warrow)';
const LITERAL_N_REGEX = new RegExp(`\\\\+n(?!${LATEX_N_COMMANDS})`, 'g');

/**
 * Sanitizes an HTML table string by stripping foster-parentable line breaks
 * and whitespace between structural table tags, ensuring compact rendering.
 */
export function sanitizeHtmlTable(tableHtml: string): string {
  if (!tableHtml || !tableHtml.includes('<table')) return tableHtml;

  return tableHtml
    // Remove all <br> tags placed inside structural table tags
    .replace(/(<\/?(?:table|thead|tbody|tfoot|tr|colgroup|col)[^>]*>)\s*(?:<br\s*\/?>|\r?\n|\r)+\s*/gi, '$1')
    .replace(/\s*(?:<br\s*\/?>|\r?\n|\r)+\s*(<\/?(?:table|thead|tbody|tfoot|tr|colgroup|col|th|td)[^>]*>)/gi, '$1')
    // Remove newlines and whitespace between structural tags
    .replace(/(>)\s*[\r\n]+\s*(<)/g, '$1$2')
    // Strip leading/trailing <br> inside cells
    .replace(/(<(?:th|td)[^>]*>)\s*(?:<br\s*\/?>|\r?\n|\r)+/gi, '$1')
    .replace(/(?:<br\s*\/?>|\r?\n|\r)+\s*(<\/(?:th|td)>)/gi, '$1');
}

function cleanupTableContent(tableStr: string): string {
  // Clean math inside table cells while keeping structural tags intact
  return tableStr.replace(/(<t[dh][^>]*>)([\s\S]*?)(<\/t[dh]>)/gi, (_, openTag, innerContent, closeTag) => {
    // Process math within this cell
    const cellCleaned = innerContent
      .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
      .replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (mathMatch: string) => {
        // Wrap Bangla in \text{}
        return mathMatch.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (m: string, banglaText: string, offset: number, fullString: string) => {
          const before = fullString.slice(0, offset);
          if (/\\text\s*\{$/.test(before)) return m;
          return `\\text{${m}}`;
        });
      });
    return `${openTag}${cellCleaned}${closeTag}`;
  });
}

/**
 * Processes custom formatting markers from the Excel template
 * Handles:
 * - || -> <br /> (Line break / Poetry)
 * - \n / \r\n / literal \n -> <br /> (Newlines)
 * - **text** -> <strong>text</strong> (Bold)
 * - ___ -> underlined gap (Fill in the blanks)
 */
export function applyFormatting(text: string | null | undefined): string {
  if (!text) return "";

  let processed = text;

  // Protect complete HTML tables during formatting
  const tablePlaceholders: string[] = [];
  if (processed.includes('<table')) {
    processed = processed.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
      const idx = tablePlaceholders.length;
      tablePlaceholders.push(sanitizeHtmlTable(match));
      return `@@@HTML_TABLE_PLACEHOLDER_${idx}@@@`;
    });
  }

  // 1. Line Breaks (||)
  processed = processed.replace(/\|\|/g, '<br />');

  // 2. CRLF and LF newlines (both literal \\r\\n and real \r\n, \r, \n)
  processed = processed.replace(/\\+r\\+n/g, '<br />');
  processed = processed.replace(/\r\n/g, '<br />');
  processed = processed.replace(/[\r\n]/g, '<br />');

  // 3. Literal \n (one or more backslashes followed by 'n') when not a recognized LaTeX command
  processed = processed.replace(LITERAL_N_REGEX, '<br />');

  // 4. Bold (**text**)
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Fill in the blanks (___)
  processed = processed.replace(/___/g, '<span class="inline-block border-b-2 border-current min-w-[60px] mx-1" style="vertical-align: baseline;">&nbsp;</span>');

  // Restore protected tables and collapse redundant <br /> tags directly adjacent to them
  if (tablePlaceholders.length > 0) {
    for (let i = 0; i < tablePlaceholders.length; i++) {
      const placeholder = `@@@HTML_TABLE_PLACEHOLDER_${i}@@@`;
      // Collapse multiple <br /> before/after placeholder
      const regexBefore = new RegExp(`(?:<br\\s*\\/?>\\s*)+${placeholder}`, 'g');
      processed = processed.replace(regexBefore, placeholder);
      const regexAfter = new RegExp(`${placeholder}(?:\\s*<br\\s*\\/?>)+`, 'g');
      processed = processed.replace(regexAfter, placeholder);
      processed = processed.replace(placeholder, tablePlaceholders[i]);
    }
  }

  return processed;
}

/**
 * Ensures text uses inline math delimiters to prevent unwanted new lines and centering.
 * Replaces $$...$$ with $...$ and \[...\] with \(...\)
 * Also wraps Bangla/Unicode text in \text{} for proper rendering in LaTeX tables
 * @param text - The text containing math to clean up
 * @returns Cleaned text with inline math delimiters, formatting, and Bangla support
 */
export function cleanupMath(text: string | null | undefined): string {
  if (!text) return "";

  let raw = text.trim();

  // Auto-delimit raw math/chemical expressions missing $...$
  // BUT only if it is a single-line expression without newlines, pipes, or HTML tables
  if (!raw.includes('$') && !/[\r\n]|\\n|\|\||<table/i.test(raw)) {
    const hasMathTokens = /\\(frac|sqrt|cdot|times|pm|pi|alpha|beta|theta|gamma|Delta|omega|sigma|partial|int|sum|infty|text|mathrm|mathbf)|(\^[0-9a-zA-Z+-]+)|(\^\{[^{}]+\})|(_[0-9a-zA-Z+-]+)|(_{0,1}\{[^{}]+\})/i.test(raw);
    if (hasMathTokens) {
      // Format ion charges & simple powers before wrapping: e.g. D^2+ -> D^{2+}
      raw = raw.replace(/\^\{?\s*(\d+)\s*([+-])\s*\}?/g, '^{$1$2}');
      raw = raw.replace(/\^\{?\s*([+-])\s*(\d+)\s*\}?/g, '^{$2$1}');
      raw = raw.replace(/([a-zA-Z0-9])\^([0-9a-zA-Z+-]+)/g, '$1^{$2}');
      raw = `$${raw}$`;
    }
  }

  // 1. Normalize brackets: \[...\] -> $$...$$ and \(...\) -> $...$
  let normalized = raw
    .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // 2. Protect complete HTML tables so split on math delimiters ($...$) does not fragment table tags into applyFormatting
  const tables: string[] = [];
  if (normalized.includes('<table')) {
    normalized = normalized.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
      const idx = tables.length;
      tables.push(sanitizeHtmlTable(cleanupTableContent(match)));
      return `@@@CLEANUP_MATH_TABLE_${idx}@@@`;
    });
  }

  // 3. Process display math ($$...$$) first, then inline math ($...$)
  // We use regex split to separate math blocks from plain text
  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  const processedParts = parts.map((part) => {
    if (!part) return "";

    // If it's a display math block $$...$$
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      let innerMath = part.slice(2, -2);
      innerMath = innerMath.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (match: string, banglaText: string, offset: number, fullString: string) => {
        const before = fullString.slice(0, offset);
        if (/\\text\s*\{$/.test(before)) return match;
        return `\\text{${match}}`;
      });
      return `$$${innerMath}$$`;
    }

    // If it's an inline math block $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      let innerMath = part.slice(1, -1);
      innerMath = innerMath.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (match: string, banglaText: string, offset: number, fullString: string) => {
        const before = fullString.slice(0, offset);
        if (/\\text\s*\{$/.test(before)) return match;
        return `\\text{${match}}`;
      });
      return `$${innerMath}$`;
    }

    // Plain text segment: apply standard formatting
    return applyFormatting(part);
  });

  let processed = processedParts.join('');

  // 4. Restore protected HTML tables and collapse any redundant adjacent <br /> tags
  if (tables.length > 0) {
    for (let i = 0; i < tables.length; i++) {
      const placeholder = `@@@CLEANUP_MATH_TABLE_${i}@@@`;
      // Collapse multiple <br /> before/after placeholder
      const regexBefore = new RegExp(`(?:<br\\s*\\/?>\\s*)+${placeholder}`, 'g');
      processed = processed.replace(regexBefore, placeholder);
      const regexAfter = new RegExp(`${placeholder}(?:\\s*<br\\s*\\/?>)+`, 'g');
      processed = processed.replace(regexAfter, placeholder);
      processed = processed.replace(placeholder, tables[i]);
    }
  }

  // 5. Final safety check on any tables (including partial or nested)
  if (processed.includes('<table')) {
    processed = processed.replace(/<table[\s\S]*?<\/table>/gi, (match) => sanitizeHtmlTable(match));
    processed = processed.replace(/(?:<br\s*\/?>\s*)+(<table[^>]*>)/gi, '$1');
    processed = processed.replace(/(<\/table>)\s*(?:<br\s*\/?>\s*)+/gi, '$1');
  }

  // Fallback for Bangla text in explicit LaTeX tables
  const tableRegex = /\\begin{(array|tabular|table)}([\s\S]*?)\\end{\1}/g;
  processed = processed.replace(tableRegex, (match) => {
    return match.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (m: string, banglaText: string, offset: number, fullString: string) => {
      const before = fullString.slice(0, offset);
      if (/\\text\s*\{$/.test(before)) return m;
      return `\\text{${m}}`;
    });
  });

  return processed;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
interface Option {
  id?: string;
  originalIndex?: number;
  [key: string]: unknown;
}

/**
 * Renders a dynamic explanation by replacing placeholders with current visual labels.
 * @param text - The explanation text (may contain [[opt:0]], [[right:1]], etc.)
 * @param options - Shuffled options for MCQ/MC/AR
 * @param type - Question type
 * @param rightColumn - Shuffled right column for MTF
 * @returns Refined explanation text
 */
export function renderDynamicExplanation(
  text: string | null | undefined,
  options: Option[] | null | undefined,
  type: string,
  rightColumn?: Option[] | null | undefined
): string {
  if (!text) return "";

  let processed = text;

  // 1. Handle explicit placeholders: [[opt:index]] or [[right:index]]
  // These are safe and reliable as they explicitly use original indices.
  if (options && Array.isArray(options)) {
    const optRegex = /\[\[opt:(\d+)\]\]/g;
    processed = processed.replace(optRegex, (match, originalIndexStr) => {
      const originalIndex = parseInt(originalIndexStr);
      const currentIndex = options.findIndex((opt: Option) =>
        (opt.originalIndex !== undefined ? opt.originalIndex === originalIndex : (opt.id && options.findIndex(o => o.id === opt.id) === originalIndex))
      );

      if (currentIndex !== -1) {
        if (type.toLowerCase() === 'mtf') return (currentIndex + 1).toString();
        return String.fromCharCode(0x0995 + currentIndex);
      }
      return match;
    });
  }

  // 2. Handle hardcoded labels: A/a/ক, B/b/খ, etc.
  // This is used for static explanations that haven't been migrated to placeholders.
  if (options && Array.isArray(options) && type.toLowerCase() !== 'mtf' && type.toLowerCase() !== 'cq' && type.toLowerCase() !== 'sq') {
    const labelMapping: Record<string, number> = {
      'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4, 'চ': 5,
      'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
      'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5
    };

    // Regex to find standalone labels, potentially followed by punctuation or inside parentheses.
    // We look for: (Start or space/punctuation) + (Label) + (End or space/punctuation)
    // We specifically want to avoid matching labels inside math (e.g., $a^2$) or as part of words.
    // Positive lookbehind (?<=...) and lookahead (?=...) are useful but not supported in all older environments, 
    // so we use a more compatible approach.

    const labels = Object.keys(labelMapping).join('');
    const hardcodedRegex = new RegExp(`(^|\\s|\\(|\\（)([${labels}])(\\.|\\:|\\)|\\-|\\s|\\）|$)`, 'g');

    processed = processed.replace(hardcodedRegex, (match, prefix, label, suffix) => {
      const originalIndex = labelMapping[label];
      // Find where this original option is now
      const currentIndex = options.findIndex((opt: Option) =>
        (opt.originalIndex !== undefined ? opt.originalIndex === originalIndex : false)
      );

      if (currentIndex !== -1) {
        const newLabel = String.fromCharCode(0x0995 + currentIndex);
        return `${prefix}${newLabel}${suffix}`;
      }
      return match;
    });
  }

  // 3. Handle MTF right column placeholders: [[right:index]]
  if (rightColumn && Array.isArray(rightColumn)) {
    const rightRegex = /\[\[right:(\d+)\]\]/g;
    processed = processed.replace(rightRegex, (match, originalIndexStr) => {
      const originalIndex = parseInt(originalIndexStr);
      const currentIndex = rightColumn.findIndex((item: Option) =>
        (item.originalIndex !== undefined ? item.originalIndex === originalIndex : false)
      );

      if (currentIndex !== -1) {
        return String.fromCharCode(65 + currentIndex);
      }
      return match;
    });
  }

  return processed;
}
