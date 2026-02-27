interface ARQuestion {
    assertion: string;
    reason: string;
    correctOption?: number; // 1-5
    correct?: number; // 1-5
    marks: number;
}

interface ARAnswer {
    selectedOption: number; // 1-5
}

export function evaluateARQuestion(
    question: ARQuestion,
    studentAnswer: ARAnswer
): { score: number; isCorrect: boolean; feedback: string } {
    const correctOption = Number(question.correctOption ?? question.correct ?? 0);
    const studentOption = Number(studentAnswer?.selectedOption ?? (typeof studentAnswer === 'number' ? studentAnswer : 0));

    const isCorrect = studentOption === correctOption && correctOption > 0;
    const score = isCorrect ? (Number(question.marks) || 0) : 0;

    const optionLabels = [
        "Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A",
        "Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A",
        "Assertion (A) is true, but Reason (R) is false",
        "Assertion (A) is false, but Reason (R) is true",
        "Both Assertion (A) and Reason (R) are false"
    ];

    const feedback = isCorrect
        ? `Correct! Option ${correctOption}: ${optionLabels[correctOption - 1]}`
        : `Incorrect. You selected option ${studentOption}, but the correct answer is option ${correctOption}: ${optionLabels[correctOption - 1] || 'Unknown'}`;

    return { score, isCorrect, feedback };
}
