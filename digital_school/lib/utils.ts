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
