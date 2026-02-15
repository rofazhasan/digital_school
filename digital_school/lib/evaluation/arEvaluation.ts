interface ARQuestion {
    assertion: string;
    reason: string;
    correctOption: number; // 1-5
    marks: number;
}

interface ARAnswer {
    selectedOption: number; // 1-5
}

export function evaluateARQuestion(
    question: ARQuestion,
    studentAnswer: ARAnswer
): { score: number; isCorrect: boolean; feedback: string } {
    const isCorrect = studentAnswer.selectedOption === question.correctOption;
    const score = isCorrect ? question.marks : 0;

    const optionLabels = [
        "Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A",
        "Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A",
        "Assertion (A) is true, but Reason (R) is false",
        "Assertion (A) is false, but Reason (R) is true",
        "Both Assertion (A) and Reason (R) are false"
    ];

    const feedback = isCorrect
        ? `Correct! Option ${question.correctOption}: ${optionLabels[question.correctOption - 1]}`
        : `Incorrect. You selected option ${studentAnswer.selectedOption}, but the correct answer is option ${question.correctOption}: ${optionLabels[question.correctOption - 1]}`;

    return { score, isCorrect, feedback };
}
