export interface ARQuestion {
    assertion: string;
    reason: string;
    correctOption?: number | string; // 1-5
    correct?: number | string; // 1-5
    correctAnswer?: number | string; // 1-5
    marks: number;
}

export interface ARAnswer {
    selectedOption?: number | string; // 1-5
    answer?: number | string;
    option?: number | string;
}

export function evaluateARQuestion(
    question: ARQuestion,
    studentAnswer: ARAnswer | number | string | any
): { score: number; isCorrect: boolean; isAttempted: boolean; studentOption: number; correctOption: number; feedback: string } {
    const rawCorrect = question?.correctOption ?? question?.correct ?? question?.correctAnswer ?? 0;
    const correctOption = typeof rawCorrect === 'string' && !isNaN(Number(rawCorrect.trim()))
        ? Number(rawCorrect.trim())
        : (typeof rawCorrect === 'number' ? rawCorrect : 0);

    let studentOption = 0;
    let isAttempted = false;

    if (studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '' && studentAnswer !== 'No answer provided') {
        if (typeof studentAnswer === 'number') {
            studentOption = studentAnswer;
            isAttempted = studentOption > 0;
        } else if (typeof studentAnswer === 'string') {
            const trimmed = studentAnswer.trim();
            if (trimmed !== '' && !isNaN(Number(trimmed))) {
                studentOption = Number(trimmed);
                isAttempted = studentOption > 0;
            }
        } else if (typeof studentAnswer === 'object') {
            const rawVal = studentAnswer.selectedOption ?? studentAnswer.answer ?? studentAnswer.option ?? studentAnswer.value;
            if (rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal))) {
                studentOption = Number(rawVal);
                isAttempted = studentOption > 0;
            }
        }
    }

    const isCorrect = isAttempted && correctOption > 0 && studentOption === correctOption;
    const marks = Number(question?.marks) || 1;
    const score = isCorrect ? marks : 0;

    const optionLabels = [
        "Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A",
        "Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A",
        "Assertion (A) is true, but Reason (R) is false",
        "Assertion (A) is false, but Reason (R) is true",
        "Both Assertion (A) and Reason (R) are false"
    ];

    const feedback = isCorrect
        ? `Correct! Option ${correctOption}: ${optionLabels[correctOption - 1] || ''}`
        : isAttempted
            ? `Incorrect. You selected option ${studentOption}, but the correct answer is option ${correctOption}: ${optionLabels[correctOption - 1] || 'Unknown'}`
            : `Unanswered. Correct answer is option ${correctOption}: ${optionLabels[correctOption - 1] || 'Unknown'}`;

    return { score, isCorrect, isAttempted, studentOption, correctOption, feedback };
}
