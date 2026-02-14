// MC Question Evaluation Logic with Partial Marking
// This implements the partial marking algorithm for Multiple Correct questions

export interface MCQuestion {
    options: { text: string; isCorrect: boolean }[];
    marks: number;
}

export interface MCAnswer {
    selectedOptions: number[]; // indices of selected options
}

export interface MCEvaluationSettings {
    negativeMarking: number; // percentage (0-100)
    partialMarking: boolean; // whether to allow partial marks
    hasAttempted?: boolean; // whether the student has attempted the question
}

/**
 * Evaluates an MC question answer with partial marking support
 * 
 * Algorithm:
 * - If all correct options are selected and no wrong options: full marks
 * - If partial marking enabled:
 *   - Calculate correctRatio = (correct selected) / (total correct)
 *   - Calculate wrongPenalty = (wrong selected) * (negativeMarking / 100) * marks
 *   - Final score = max(0, (correctRatio * marks) - wrongPenalty)
 * - If partial marking disabled:
 *   - Only full marks if all correct and no wrong, else 0
 * 
 * Example: 2 correct out of 5 options, 5 marks, 25% negative marking
 * - Both correct selected: 5 marks
 * - 1 correct selected: 2.5 marks
 * - 1 correct + 1 wrong selected: 2.5 - 1.25 = 1.25 marks
 * - 2 wrong selected: 0 marks (can't go negative)
 */
export function evaluateMCQuestion(
    question: MCQuestion,
    answer: MCAnswer,
    settings: MCEvaluationSettings
): number {
    const correctIndices = question.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter(idx => idx !== -1);

    // If not attempted and setting is passed, return 0 immediately
    if (settings.hasAttempted === false) {
        return 0;
    }

    const selectedSet = new Set(answer.selectedOptions);
    const correctSet = new Set(correctIndices);

    // Count correct and wrong selections
    let correctSelected = 0;
    let wrongSelected = 0;

    for (const idx of answer.selectedOptions) {
        if (correctSet.has(idx)) {
            correctSelected++;
        } else {
            wrongSelected++;
        }
    }

    const totalCorrect = correctIndices.length;

    // Full marks if all correct and no wrong
    if (correctSelected === totalCorrect && wrongSelected === 0) {
        return question.marks;
    }

    // No partial marking - all or nothing
    if (!settings.partialMarking) {
        return 0;
    }

    // Partial marking calculation
    const correctRatio = correctSelected / totalCorrect;
    const partialMarks = correctRatio * question.marks;

    // Apply negative marking for wrong selections
    const wrongPenalty = wrongSelected * (settings.negativeMarking / 100) * question.marks;

    const finalScore = Math.max(0, partialMarks - wrongPenalty);

    // Round to 2 decimal places
    return Math.round(finalScore * 100) / 100;
}

/**
 * Batch evaluate multiple MC questions
 */
export function evaluateMCQuestions(
    questions: MCQuestion[],
    answers: MCAnswer[],
    settings: MCEvaluationSettings
): { scores: number[]; totalScore: number } {
    const scores = questions.map((q, idx) =>
        evaluateMCQuestion(q, answers[idx] || { selectedOptions: [] }, settings)
    );

    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    return { scores, totalScore };
}

/**
 * Get detailed feedback for an MC answer
 */
export function getMCFeedback(
    question: MCQuestion,
    answer: MCAnswer,
    score: number
): {
    isFullyCorrect: boolean;
    isPartiallyCorrect: boolean;
    missedCorrect: number[];
    wronglySelected: number[];
    feedback: string;
} {
    const correctIndices = question.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter(idx => idx !== -1);

    const selectedSet = new Set(answer.selectedOptions);
    const correctSet = new Set(correctIndices);

    const missedCorrect = correctIndices.filter(idx => !selectedSet.has(idx));
    const wronglySelected = answer.selectedOptions.filter(idx => !correctSet.has(idx));

    const isFullyCorrect = score === question.marks;
    const isPartiallyCorrect = score > 0 && score < question.marks;

    let feedback = '';
    if (isFullyCorrect) {
        feedback = 'Perfect! All correct options selected.';
    } else if (isPartiallyCorrect) {
        feedback = `Partial credit: ${score}/${question.marks} marks. `;
        if (missedCorrect.length > 0) {
            feedback += `Missed ${missedCorrect.length} correct option(s). `;
        }
        if (wronglySelected.length > 0) {
            feedback += `Selected ${wronglySelected.length} incorrect option(s).`;
        }
    } else {
        feedback = 'Incorrect. ';
        if (missedCorrect.length === correctIndices.length) {
            feedback += 'No correct options selected.';
        } else {
            feedback += `Missed correct options and/or selected incorrect ones.`;
        }
    }

    return {
        isFullyCorrect,
        isPartiallyCorrect,
        missedCorrect,
        wronglySelected,
        feedback
    };
}
