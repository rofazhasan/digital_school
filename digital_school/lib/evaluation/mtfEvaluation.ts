export interface MTFMatch {
    leftId: string;
    rightId: string;
}

export interface MTFMatchNode {
    id: string;
    text: string;
}

export interface MTFQuestion {
    matches?: Record<string, string>;
    leftColumn?: MTFMatchNode[];
    rightColumn?: MTFMatchNode[];
    marks: number;
}

export interface MTFRawMatch {
    leftId?: string;
    rightId?: string;
    leftIndex?: number;
    rightIndex?: number;
}

export interface MTFAnswer {
    matches?: Record<string, string> | MTFRawMatch[];
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
    question: MTFQuestion,
    studentMatches: MTFAnswer
): MTFResult {
    const leftCol = question.leftColumn || (question as any).leftItems || [];
    const rightCol = question.rightColumn || (question as any).rightItems || [];
    const correctMatches = (question.matches || {}) as Record<string, string>;
    const totalLeftItems = leftCol.length;
    const marksPerMatch = totalLeftItems > 0 ? (Number(question.marks) || 1) / totalLeftItems : 0;

    let correctCount = 0;

    // Normalize student matches: Ensure we have a Record<string, string> of IDs
    let normalizedStudentMatches: Record<string, string> = {};

    const rawMatches = studentMatches?.matches ?? (typeof studentMatches === 'object' ? studentMatches : {});

    if (Array.isArray(rawMatches)) {
        // [{leftId: "1", rightId: "A"}, ...] or [{leftIndex: 0, rightIndex: 2}, ...]
        (rawMatches as MTFRawMatch[]).forEach((m) => {
            if (m && typeof m === 'object' && m.leftId !== undefined && m.rightId !== undefined) {
                normalizedStudentMatches[m.leftId] = m.rightId;
            } else if (m && typeof m === 'object' && m.leftIndex !== undefined && m.rightIndex !== undefined) {
                const leftItem = leftCol[m.leftIndex];
                const rightItem = rightCol[m.rightIndex];
                if (leftItem && rightItem) {
                    normalizedStudentMatches[leftItem.id] = rightItem.id;
                }
            }
        });
    } else if (rawMatches && typeof rawMatches === 'object') {
        // Direct ID-based map: { "A": "1", "B": "2" }
        normalizedStudentMatches = rawMatches as Record<string, string>;
    }

    const matchesDetails = leftCol.map((item: MTFMatchNode, idx: number) => {
        let correctRightId = correctMatches[item.id];
        if (!correctRightId) {
            const leftOrigIdx = (item as any).originalIndex !== undefined ? (item as any).originalIndex : idx;
            if (rightCol.length > 0) {
                const rMatch = rightCol.find((r: any) => r.originalIndex === leftOrigIdx);
                if (rMatch) correctRightId = rMatch.id;
                else if (rightCol[idx]) correctRightId = rightCol[idx].id;
            }
        }

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
