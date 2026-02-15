export interface MTFMatch {
    leftId: string;
    rightId: string;
}

export interface MTFResult {
    score: number;
    isCorrect: boolean;
    matches: {
        leftId: string;
        correctRightId: string;
        studentRightId: string | null;
        isCorrect: boolean;
    }[];
    feedback: string;
}

export function evaluateMTFQuestion(
    question: any,
    studentMatches: Record<string, string>
): MTFResult {
    const correctMatches = (question.matches || {}) as Record<string, string>;
    const totalLeftItems = question.leftColumn?.length || 0;
    const marksPerMatch = totalLeftItems > 0 ? (question.marks || 1) / totalLeftItems : 0;

    let correctCount = 0;

    // Normalize student matches: Ensure we have a Record<string, string> of IDs
    let normalizedStudentMatches: Record<string, string> = {};
    if (studentMatches && !Array.isArray(studentMatches) && typeof studentMatches === 'object' && studentMatches.matches === undefined) {
        // Direct ID-based map: { "A": "1", "B": "2" }
        normalizedStudentMatches = studentMatches;
    } else if (studentMatches && studentMatches.matches && Array.isArray(studentMatches.matches)) {
        // Index-based matches: { matches: [{ leftIndex: 0, rightIndex: 2 }, ...] }
        studentMatches.matches.forEach((m: any) => {
            const leftItem = question.leftColumn?.[m.leftIndex];
            const rightItem = question.rightColumn?.[m.rightIndex];
            if (leftItem && rightItem) {
                normalizedStudentMatches[leftItem.id] = rightItem.id;
            }
        });
    }

    const matchesDetails = (question.leftColumn || []).map((item: any) => {
        const correctRightId = correctMatches[item.id];
        const studentRightId = normalizedStudentMatches[item.id] || null;
        const isMatchedCorrectly = correctRightId === studentRightId;

        if (isMatchedCorrectly && studentRightId !== null) {
            correctCount++;
        }

        return {
            leftId: item.id,
            correctRightId,
            studentRightId,
            isCorrect: isMatchedCorrectly
        };
    });

    const score = correctCount * marksPerMatch;
    const isCorrect = correctCount === totalLeftItems;

    let feedback = `Correctly matched ${correctCount} out of ${totalLeftItems} pairs.`;
    if (isCorrect) {
        feedback = "Perfect! All items matched correctly.";
    } else if (correctCount === 0) {
        feedback = "No matches were correct.";
    }

    return {
        score: Number(score.toFixed(2)),
        isCorrect,
        matches: matchesDetails,
        feedback
    };
}
