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
import { areExpressionsEquivalent } from './math-parser';

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

    if (studentAnswer && typeof studentAnswer === 'object' && !Array.isArray(studentAnswer)) {
        return Object.values(studentAnswer).some(v => isAnswerValueValid(v));
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

/**
 * Evaluates the precise result status of a question:
 * - 'UNANSWERED': Question was not attempted by student.
 * - 'CORRECT': Student answered all parts/options correctly and earned full marks.
 * - 'PARTIAL': Student attempted the question and got at least ONE component/part/option correct, but not full marks.
 * - 'WRONG': Student attempted the question, but got ALL components/parts/options wrong (0 correct choices/parts).
 */
export const evaluateQuestionResultStatus = (question: any): 'CORRECT' | 'PARTIAL' | 'WRONG' | 'UNANSWERED' => {
    if (!question) return 'UNANSWERED';

    const type = (question.type || '').toUpperCase();
    const studentAnswer = question.studentAnswer;
    const subQuestions = question.subQuestions || question.sub_questions;

    const hasAns = hasStudentAnswered(type, studentAnswer, subQuestions);
    if (!hasAns) return 'UNANSWERED';

    const isCorrect = isAnswerCorrect(question.awardedMarks, question.marks);
    if (isCorrect) return 'CORRECT';

    // Check if at least 1 component/part/option is correct for partial credit classification
    let hasAtLeastOneCorrect = false;

    if (type === 'MC') {
        const options = question.options || [];
        const selected = Array.isArray(studentAnswer?.selectedOptions)
            ? studentAnswer.selectedOptions
            : (Array.isArray(studentAnswer) ? studentAnswer : []);

        hasAtLeastOneCorrect = selected.some((idx: number) => Boolean(options[idx]?.isCorrect));
    } else if (type === 'CMA') {
        const parts = question.parts || question.cmaParts || question.subQuestions || question.sub_questions || [];
        if (question.partResults && typeof question.partResults === 'object') {
            hasAtLeastOneCorrect = Object.values(question.partResults).some((p: any) => Boolean(p?.isCorrect));
        } else if (studentAnswer && typeof studentAnswer === 'object') {
            hasAtLeastOneCorrect = parts.some((p: any) => {
                const pId = p.id || p.key || p.name || p.label;
                const sVal = studentAnswer[pId] ?? studentAnswer[p.label] ?? '';
                const eVal = p.expectedAnswer ?? p.modelAnswer ?? p.correctAnswer ?? '';
                if (!sVal || !eVal) return false;
                const tol = Number(p.tolerance) || 0.01;
                return areExpressionsEquivalent(String(sVal), String(eVal), tol);
            });
        }
    } else if (type === 'MPC') {
        const stages = question.stages || question.mpcStages || question.subQuestions || question.sub_questions || [];
        if (question.stageResults && typeof question.stageResults === 'object') {
            hasAtLeastOneCorrect = Object.values(question.stageResults).some((s: any) => Boolean(s?.isCorrectDirectly || s?.isCorrectWithPropagatedError));
        } else if (studentAnswer && typeof studentAnswer === 'object') {
            hasAtLeastOneCorrect = stages.some((s: any) => {
                const sId = s.id || s.key || s.name || s.stageTitle;
                const sVal = studentAnswer[sId] ?? studentAnswer[s.stageTitle] ?? '';
                const eVal = s.expectedAnswer ?? s.modelAnswer ?? s.correctAnswer ?? '';
                if (!sVal || !eVal) return false;
                const tol = Number(s.tolerance) || 0.01;
                return areExpressionsEquivalent(String(sVal), String(eVal), tol);
            });
        }
    } else if (type === 'SMCQ') {
        const sqs = subQuestions || [];
        hasAtLeastOneCorrect = sqs.some((sq: any) => Number(sq.awardedMarks) > 0 || isAnswerCorrect(sq.awardedMarks, sq.marks));
    } else if (type === 'MTF') {
        if (question.matchesResults && typeof question.matchesResults === 'object') {
            hasAtLeastOneCorrect = Object.values(question.matchesResults).some((m: any) => Boolean(m?.isCorrect));
        }
    }

    // Fallback if type didn't match specialized multi-part logic
    if (!hasAtLeastOneCorrect && Number(question.awardedMarks) > 0) {
        hasAtLeastOneCorrect = true;
    }

    return hasAtLeastOneCorrect ? 'PARTIAL' : 'WRONG';
};
