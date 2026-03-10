/**
 * exam-result-utils.ts
 * 
 * Bulletproof utilities strictly designed for the EXAM RESULTS PAGE display logic.
 * These functions safely evaluate whether a student answered a question and if 
 * the earned marks equate to a correct answer, preventing string/float mismatches
 * and integer `0` falsy bugs.
 * 
 * IMPORTANT: Because these are strictly used for UI mapping on the results page,
 * they WILL NOT interfere with online exam taking, the Question Bank (QB), or 
 * the core auto-evaluation engine.
 */

/**
 * Safely checks if a generic answer is considered "answered"
 * Accounts for 0 indexes being falsy, empty strings, and 'No answer provided'.
 */
const isAnswerValueValid = (val: any): boolean => {
    return val !== undefined && val !== null && val !== '' && val !== 'No answer provided';
};

/**
 * Determines if a student's answer is present.
 * Uses robust checks to ensure numeric 0s (like in MCQ options) are caught correctly.
 * 
 * @param questionType The type of the question (e.g., 'MCQ', 'SMCQ', 'CQ', 'SQ')
 * @param studentAnswer The student's recorded answer
 * @param subQuestions (Optional) Array of sub-questions for SMCQ types
 * @returns boolean true if an answer exists, false otherwise
 */
export const hasStudentAnswered = (
    questionType: string | undefined,
    studentAnswer: any,
    subQuestions?: any[]
): boolean => {
    const type = (questionType || '').toUpperCase();

    if (type === 'SMCQ') {
        // For SMCQ, we check if ANY of the sub-questions have a valid answer
        const sqs = subQuestions || [];
        return sqs.some((sq: any) => isAnswerValueValid(sq.studentAnswer));
    }

    // For all other types
    return isAnswerValueValid(studentAnswer);
};

/**
 * Determines if a question is considered marked "Correct" by comparing awarded marks.
 * Safely casts to Numbers to prevent string/float strict equality failures (e.g. "1.00" === 1).
 * 
 * @param awardedMarks Marks given to the student
 * @param totalMarks Total marks possible for the question
 * @returns boolean true if the marks strictly match numerically and are greater than 0
 */
export const isAnswerCorrect = (awardedMarks: any, totalMarks: any): boolean => {
    const awarded = Number(awardedMarks);
    const total = Number(totalMarks);

    if (isNaN(awarded) || isNaN(total)) return false;

    return awarded === total && total > 0;
};
