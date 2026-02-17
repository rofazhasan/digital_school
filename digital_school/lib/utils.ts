import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate grade based on percentage
 * @param percentage - The percentage score (0-100)
 * @returns The grade (A+, A, A-, B+, B, C, D, F)
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 80) {
    return 'A+';
  } else if (percentage >= 75) {
    return 'A';
  } else if (percentage >= 70) {
    return 'A-';
  } else if (percentage >= 65) {
    return 'B+';
  } else if (percentage >= 60) {
    return 'B';
  } else if (percentage >= 55) {
    return 'C';
  } else if (percentage >= 40) {
    return 'D';
  } else {
    return 'F';
  }
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
 * Ensures text uses inline math delimiters to prevent unwanted new lines and centering.
 * Replaces $$...$$ with $...$ and \[...\] with \(...\)
 * Also wraps Bangla/Unicode text in \text{} for proper rendering in LaTeX tables
 * @param text - The text containing math to clean up
 * @returns Cleaned text with inline math delimiters and Bangla support
 */
export function cleanupMath(text: string | null | undefined): string {
  if (!text) return "";

  let processed = text;

  // Convert LaTeX display delimiters (\[...\]) and $$ to inline ($) for better print flow
  processed = processed
    .replace(/\$\$/g, '$')  // $$ -> $
    .replace(/\\\[/g, '$').replace(/\\\]/g, '$') // \[ -> $, \] -> $
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$');   // \( -> $, \) -> $

  // Process Bangla text in tables (array, tabular environments)
  // This wraps Bangla Unicode characters in \text{} for proper rendering
  const tableRegex = /\\begin{(array|tabular|table)}([\s\S]*?)\\end{\1}/g;

  processed = processed.replace(tableRegex, (match) => {
    // Wrap Bangla text (Unicode range U+0980 to U+09FF) in \text{}
    // But only if it's not already wrapped
    return match.replace(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/g, (banglaText) => {
      // Check if already wrapped in \text{}
      const beforeText = match.substring(0, match.indexOf(banglaText));
      if (beforeText.endsWith('\\text{')) {
        return banglaText; // Already wrapped
      }
      return `\\text{${banglaText}}`;
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
  options: any[] | null | undefined,
  type: string,
  rightColumn?: any[] | null | undefined
): string {
  if (!text) return "";

  let processed = text;

  // 1. Handle explicit placeholders: [[opt:index]] or [[right:index]]
  // These are safe and reliable as they explicitly use original indices.
  if (options && Array.isArray(options)) {
    const optRegex = /\[\[opt:(\d+)\]\]/g;
    processed = processed.replace(optRegex, (match, originalIndexStr) => {
      const originalIndex = parseInt(originalIndexStr);
      const currentIndex = options.findIndex((opt: any) =>
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
      const currentIndex = options.findIndex((opt: any) =>
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
      const currentIndex = rightColumn.findIndex((item: any) =>
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
