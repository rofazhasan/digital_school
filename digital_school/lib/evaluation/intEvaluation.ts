// INT (Integer Type) Question Evaluation Logic
// Evaluates integer answer questions with exact match

interface INTQuestion {
    modelAnswer?: string | number;
    correctAnswer?: string | number;
    correct?: string | number;
    answer?: string | number;
    marks: number;
}

interface INTAnswer {
    answer: number | string;
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
    // Try to find correct answer in various possible fields
    const rawCorrect = question.modelAnswer ?? question.correctAnswer ?? question.correct ?? question.answer ?? '0';
    const correctAnswer = parseInt(String(rawCorrect).trim()) || 0;

    const studentAnsRaw = studentAnswer?.answer ?? studentAnswer;
    const studentAns = typeof studentAnsRaw === 'object' ? 0 : (parseInt(String(studentAnsRaw).trim()) || 0);

    const marks = Number(question.marks) || 0;


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
 * Evaluate multiple INT questions (Legacy or batch support)
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
 */
export function getINTFeedback(
    question: INTQuestion,
    studentAnswer: INTAnswer,
    score: number
) {
    const rawCorrect = question.modelAnswer ?? question.correctAnswer ?? question.correct ?? question.answer ?? '0';
    const correctAnswer = parseInt(String(rawCorrect).trim()) || 0;

    const studentAnsRaw = studentAnswer?.answer ?? studentAnswer;
    const studentAns = typeof studentAnsRaw === 'object' ? 0 : (parseInt(String(studentAnsRaw).trim()) || 0);

    const isCorrect = studentAns === correctAnswer;

    return {
        isCorrect,
        score,
        maxScore: question.marks,
        correctAnswer,
        studentAnswer: studentAns,
        feedback: isCorrect
            ? 'Your answer is correct!'
            : `Your answer (${studentAns}) is incorrect. The correct answer is ${correctAnswer}.`
    };
}
