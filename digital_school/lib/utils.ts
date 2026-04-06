import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
 * Calculate grade based on percentage and pass mark.
 * Standard scale: 80+=A+, 70+=A, 60+=A-, 50+=B, 40+=C, Pass+=D, <Pass=F.
 * @param percentage - The percentage score (0-100)
 * @param passMark - The passing threshold (default: 33)
 * @returns The grade (A+, A, A-, B, C, D, F)
 */
export function calculateGrade(percentage: number, passMark: number = 33): string {
  if (percentage < passMark) {
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
export function calculateGPA(percentage: number, passMark: number = 33): number {
  if (percentage < passMark) return 0.00;
  if (percentage >= 80) return 5.00;

  // Segment definitions for linear mapping
  const segments = [
    { start: 70, end: 80, minGPA: 4.00, maxGPA: 5.00 },
    { start: 60, end: 70, minGPA: 3.50, maxGPA: 4.00 },
    { start: 50, end: 60, minGPA: 3.00, maxGPA: 3.50 },
    { start: 40, end: 50, minGPA: 2.00, maxGPA: 3.00 },
    { start: passMark, end: 40, minGPA: 1.00, maxGPA: 2.00 },
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

/**
 * Processes custom formatting markers from the Excel template
 * Handles:
 * - || -> <br /> (Line break / Poetry)
 * - **text** -> <strong>text</strong> (Bold)
 * - ___ -> underlined gap (Fill in the blanks)
 */
export function applyFormatting(text: string | null | undefined): string {
  if (!text) return "";

  let processed = text;

  // 1. Line Breaks (||)
  processed = processed.replace(/\|\|/g, '<br />');

  // 2. Bold (**text**)
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 3. Fill in the blanks (___)
  processed = processed.replace(/___/g, '<span class="inline-block border-b-2 border-current min-w-[60px] mx-1" style="vertical-align: baseline;">&nbsp;</span>');

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

  // 1. Normalize LaTeX delimiters to inline ($) for consistent processing
  // This must be done FIRST so we have a single delimiter to split by
  let normalized = text
    .replace(/\$\$/g, '$')
    .replace(/\\\[/g, '$').replace(/\\\]/g, '$')
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$');

  // 2. Split by $ to isolate math from text
  // Even indices are text, odd indices are math
  const parts = normalized.split('$');
  const processedParts = parts.map((part, index) => {
    // Even index: It's regular text, apply formatting
    if (index % 2 === 0) {
      return applyFormatting(part);
    }
    // Odd index: It's math content, DO NOT apply bold/italic/poetry formatting
    // But we still apply the internal cleanup logic like \text{} for Bangla
    let mathContent = part;
    
    // Wrap Bangla Unicode characters (U+0980 to U+09FF) in \text{}
    mathContent = mathContent.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (match: string, banglaText: string, offset: number, fullString: string) => {
      const before = fullString.slice(0, offset);
      if (/\\text\s*\{$/.test(before)) return match;
      return `\\text{${match}}`;
    });
    
    return mathContent;
  });

  // 3. Join back with $ delimiters
  let processed = processedParts.join('$');

  // 4. Fallback for Bangla text in explicit tables
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
