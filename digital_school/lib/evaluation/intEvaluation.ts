/**
 * INT (Integer Type) Question Evaluation Logic
 * Evaluates integer answer questions with exact match
 */

interface INTQuestion {
    modelAnswer?: string;
    marks: number;
}

interface INTAnswer {
    answer: number;
}

interface INTEvaluationResult {
    score: number;
    isCorrect: boolean;
    feedback: string;
}

/**
 * Evaluate a single INT question
 * @param question - The INT question with correct answer
 * @param studentAnswer - The student's integer answer
 * @returns Evaluation result with score and feedback
 */
export function evaluateINTQuestion(
    question: INTQuestion,
    studentAnswer: INTAnswer
): INTEvaluationResult {
    // Check multiple possible fields for correct answer due to schema inconsistencies
    const correctVal = question.modelAnswer || (question as any).correctAnswer || (question as any).answer;
    const correctAnswer = parseInt(String(correctVal || '0'));
    const studentAns = parseInt(String(studentAnswer.answer || '0'));
    const marks = question.marks;

    // Check if answer is correct (exact match)
    const isCorrect = studentAns === correctAnswer;
    const score = isCorrect ? marks : 0;

    const feedback = isCorrect
        ? `Correct! The answer is ${correctAnswer}.`
        : `Incorrect. Your answer: ${studentAns}, Correct answer: ${correctAnswer}`;

    return {
        score,
        isCorrect,
        feedback
    };
}

/**
 * Evaluate multiple INT questions
 * @param questions - Array of INT questions
 * @param answers - Array of student answers
 * @returns Array of evaluation results
 */
export function evaluateINTQuestions(
    questions: INTQuestion[],
    answers: INTAnswer[]
): INTEvaluationResult[] {
    return questions.map((question, index) => {
        const studentAnswer = answers[index] || { answer: 0 };
        return evaluateINTQuestion(question, studentAnswer);
    });
}

/**
 * Get detailed feedback for INT question
 * @param question - The INT question
 * @param studentAnswer - The student's answer
 * @param score - The score obtained
 * @returns Detailed feedback object
 */
export function getINTFeedback(
    question: INTQuestion,
    studentAnswer: INTAnswer,
    score: number
) {
    const correctAnswer = parseInt(question.modelAnswer || '0');
    const isCorrect = studentAnswer.answer === correctAnswer;

    return {
        isCorrect,
        score,
        maxScore: question.marks,
        correctAnswer,
        studentAnswer: studentAnswer.answer,
        feedback: isCorrect
            ? 'Your answer is correct!'
            : `Your answer (${studentAnswer.answer}) is incorrect. The correct answer is ${correctAnswer}.`
    };
}
