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
 * @param text - The text containing math to clean up
 * @returns Cleaned text with inline math delimiters
 */
export function cleanupMath(text: string | null | undefined): string {
  if (!text) return "";

  // 1. Strip $$ wrapping TikZ environments (user requirement: "tikz code will be in $$ $$")
  // We use a regex that handles newlines and optional spaces
  let cleaned = text.replace(/\$\$\s*(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})\s*\$\$/g, '$1');

  // 2. Protect TikZ blocks from further processing
  // We split by the TikZ block to separate "math text" from "tikz code"
  const tikzRegex = /(\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/g;
  const parts = cleaned.split(tikzRegex);

  return parts.map(part => {
    if (part.startsWith("\\begin{tikzpicture}")) {
      // Return TikZ code exactly as is (no replacement of internal symbols)
      return part;
    } else {
      // Process standard text/math
      return part
        .replace(/\$\$/g, '$') // $$ -> $
        .replace(/\\\[/g, '\\(').replace(/\\\]/g, '\\)'); // \[ -> \(
    }
  }).join(""); // Rejoin
}
