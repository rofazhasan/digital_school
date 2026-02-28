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
    studentMatches: any
): MTFResult {
    const correctMatches = (question.matches || {}) as Record<string, string>;
    const totalLeftItems = question.leftColumn?.length || 0;
    const marksPerMatch = totalLeftItems > 0 ? (Number(question.marks) || 1) / totalLeftItems : 0;

    let correctCount = 0;

    // Normalize student matches: Ensure we have a Record<string, string> of IDs
    let normalizedStudentMatches: Record<string, string> = {};

    const rawMatches = studentMatches?.matches ?? (typeof studentMatches === 'object' ? studentMatches : {});

    if (Array.isArray(rawMatches)) {
        // [{leftId: "1", rightId: "A"}, ...] or [{leftIndex: 0, rightIndex: 2}, ...]
        rawMatches.forEach((m: any) => {
            if (m.leftId && m.rightId) {
                normalizedStudentMatches[m.leftId] = m.rightId;
            } else if (m.leftIndex !== undefined && m.rightIndex !== undefined) {
                const leftItem = question.leftColumn?.[m.leftIndex];
                const rightItem = question.rightColumn?.[m.rightIndex];
                if (leftItem && rightItem) {
                    normalizedStudentMatches[leftItem.id] = rightItem.id;
                }
            }
        });
    } else if (typeof rawMatches === 'object') {
        // Direct ID-based map: { "A": "1", "B": "2" }
        normalizedStudentMatches = rawMatches;
    }

    const matchesDetails = (question.leftColumn || []).map((item: any) => {
        const correctRightId = correctMatches[item.id];
        const studentRightId = normalizedStudentMatches ? normalizedStudentMatches[item.id] || null : null;
        const isMatchedCorrectly = correctRightId && studentRightId && correctRightId === studentRightId;

        if (isMatchedCorrectly) {
            correctCount++;
        }

        return {
            leftId: item.id,
            correctRightId,
            studentRightId,
            isCorrect: !!isMatchedCorrectly
        };
    });

    const score = correctCount * marksPerMatch;
    const isCorrect = totalLeftItems > 0 && correctCount === totalLeftItems;

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
