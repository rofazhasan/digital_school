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

  // PRESERVE display math ($$...$$) - stop converting to inline
  // Convert LaTeX display delimiters (\[...\]) to standard display ($$...$$)
  processed = processed
    .replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$') // \[ -> $$, \] -> $$
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
