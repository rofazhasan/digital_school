/**
 * Utility functions for exam-related calculations
 */

/**
 * Calculate negative marks for MCQ questions
 * @param isCorrect - Whether the answer is correct
 * @param questionMarks - Total marks for the question
 * @param negativeMarkingPercentage - Percentage of marks to deduct for wrong answers
 * @returns The marks to award (negative for wrong answers with negative marking)
 */
export function calculateMCQMarks(
  isCorrect: boolean,
  questionMarks: number,
  negativeMarkingPercentage: number = 0
): number {
  if (isCorrect) {
    return questionMarks;
  } else {
    // Calculate negative marks based on percentage
    const negativeMarks = (questionMarks * negativeMarkingPercentage) / 100;
    return -negativeMarks;
  }
}

/**
 * Validate question selection settings
 * @param totalQuestions - Total questions available
 * @param requiredQuestions - Questions students must answer
 * @returns Whether the settings are valid
 */
export function validateQuestionSelection(
  totalQuestions: number,
  requiredQuestions: number
): boolean {
  return requiredQuestions <= totalQuestions && requiredQuestions > 0 && totalQuestions > 0;
}

/**
 * Get question selection summary for display
 * @param cqTotal - Total CQ questions
 * @param cqRequired - Required CQ questions
 * @param sqTotal - Total SQ questions
 * @param sqRequired - Required SQ questions
 * @returns Formatted summary string
 */
export function getQuestionSelectionSummary(
  cqTotal: number,
  cqRequired: number,
  sqTotal: number,
  sqRequired: number
): string {
  const cqSummary = `CQ: ${cqRequired}/${cqTotal}`;
  const sqSummary = `SQ: ${sqRequired}/${sqTotal}`;
  return `${cqSummary}, ${sqSummary}`;
}

/**
 * Calculate total possible marks for an exam
 * @param mcqMarks - Total MCQ marks
 * @param cqMarks - Total CQ marks
 * @param sqMarks - Total SQ marks
 * @returns Total possible marks
 */
export function calculateTotalPossibleMarks(
  mcqMarks: number,
  cqMarks: number,
  sqMarks: number
): number {
  return mcqMarks + cqMarks + sqMarks;
}

// Simple test function to verify calculations
export function runTests() {
  console.log('Testing Exam Utils...\n');

  // Test calculateMCQMarks
  console.log('Testing calculateMCQMarks:');
  console.log('Correct answer, 1 mark, 25% negative marking:', calculateMCQMarks(true, 1, 25)); // Should be 1
  console.log('Wrong answer, 1 mark, 25% negative marking:', calculateMCQMarks(false, 1, 25)); // Should be -0.25
  console.log('Wrong answer, 2 marks, 50% negative marking:', calculateMCQMarks(false, 2, 50)); // Should be -1
  console.log('Wrong answer, 1 mark, 0% negative marking:', calculateMCQMarks(false, 1, 0)); // Should be 0
  console.log('Wrong answer, 1 mark, 12.5% negative marking:', calculateMCQMarks(false, 1, 12.5)); // Should be -0.125

  console.log('\nTesting validateQuestionSelection:');
  console.log('Valid: 8 total, 5 required:', validateQuestionSelection(8, 5)); // Should be true
  console.log('Invalid: 5 total, 8 required:', validateQuestionSelection(5, 8)); // Should be false
  console.log('Valid: 10 total, 10 required:', validateQuestionSelection(10, 10)); // Should be true

  console.log('\nTesting getQuestionSelectionSummary:');
  console.log('CQ 5/8, SQ 5/15:', getQuestionSelectionSummary(8, 5, 15, 5));
  console.log('CQ 7/10, SQ 10/20:', getQuestionSelectionSummary(10, 7, 20, 10));

  console.log('\nAll tests completed!');
} 