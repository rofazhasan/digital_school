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
    studentMatches: MTFAnswer | any
): MTFResult {
    let leftCol: any[] = question.leftColumn || (question as any).leftItems || [];
    if (typeof leftCol === 'string') {
        try { leftCol = JSON.parse(leftCol); } catch { leftCol = []; }
    }
    leftCol = leftCol.map((item: any, idx: number) => typeof item === 'string' ? { id: String(idx + 1), text: item } : item);

    let rightCol: any[] = question.rightColumn || (question as any).rightItems || [];
    if (typeof rightCol === 'string') {
        try { rightCol = JSON.parse(rightCol); } catch { rightCol = []; }
    }
    rightCol = rightCol.map((item: any, idx: number) => typeof item === 'string' ? { id: String(idx + 1), text: item } : item);

    let correctMatches: Record<string, string> = {};
    if (typeof question.matches === 'string') {
        try { correctMatches = JSON.parse(question.matches); } catch { correctMatches = {}; }
    } else if (question.matches && typeof question.matches === 'object') {
        correctMatches = question.matches as Record<string, string>;
    }

    const totalLeftItems = leftCol.length;
    const marksPerMatch = totalLeftItems > 0 ? (Number(question.marks) || 1) / totalLeftItems : 0;

    let normalizedStudentMatches: Record<string, string> = {};
    let rawMatches = studentMatches?.matches ?? (typeof studentMatches === 'object' ? studentMatches : {});
    if (typeof rawMatches === 'string') {
        try { rawMatches = JSON.parse(rawMatches); } catch {}
    }

    if (Array.isArray(rawMatches)) {
        rawMatches.forEach((m: any) => {
            if (m && typeof m === 'object') {
                if (m.leftId !== undefined && m.rightId !== undefined) {
                    normalizedStudentMatches[String(m.leftId)] = String(m.rightId);
                } else if (m.leftIndex !== undefined && m.rightIndex !== undefined) {
                    const leftItem = leftCol[m.leftIndex];
                    const rightItem = rightCol[m.rightIndex];
                    if (leftItem && rightItem) {
                        normalizedStudentMatches[String(leftItem.id)] = String(rightItem.id);
                    }
                }
            }
        });
    } else if (rawMatches && typeof rawMatches === 'object') {
        Object.entries(rawMatches).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                normalizedStudentMatches[String(k)] = String(v);
            }
        });
    }

    const clean = (s: any) => String(s ?? '').trim().toLowerCase();

    let correctCount = 0;

    const matchesDetails = leftCol.map((item: any, idx: number) => {
        let correctRightId: string | null = null;
        if (correctMatches[item.id] !== undefined) {
            correctRightId = String(correctMatches[item.id]);
        } else if (correctMatches[String(idx + 1)] !== undefined) {
            correctRightId = String(correctMatches[String(idx + 1)]);
        } else if (correctMatches[String(idx)] !== undefined) {
            correctRightId = String(correctMatches[String(idx)]);
        }

        let studentRightId: string | null = null;
        if (normalizedStudentMatches[item.id] !== undefined) {
            studentRightId = String(normalizedStudentMatches[item.id]);
        } else if (normalizedStudentMatches[String(idx + 1)] !== undefined) {
            studentRightId = String(normalizedStudentMatches[String(idx + 1)]);
        } else if (normalizedStudentMatches[String(idx)] !== undefined) {
            studentRightId = String(normalizedStudentMatches[String(idx)]);
        }

        const hasAnswered = studentRightId !== null && studentRightId !== '' && studentRightId !== 'No answer provided';

        const resolveRightItem = (val: string | null): any => {
            if (!val) return null;
            const cleanVal = clean(val);
            // 1. Direct ID match
            const byId = rightCol.find((r: any) => String(r.id) === val || clean(r.id) === cleanVal);
            if (byId) return byId;
            // 2. Direct text match
            const byText = rightCol.find((r: any) => clean(r.text) === cleanVal);
            if (byText) return byText;
            // 3. Letter key match (A, B, C...)
            const byLetter = rightCol.find((r: any, rIdx: number) => String.fromCharCode(65 + rIdx).toLowerCase() === cleanVal);
            if (byLetter) return byLetter;
            // 4. Numeric index match only if not matched by ID
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                if (num >= 0 && num < rightCol.length && !rightCol.some((r: any) => String(r.id) === String(num))) {
                    return rightCol[num];
                }
                if (num >= 1 && num <= rightCol.length && !rightCol.some((r: any) => String(r.id) === String(num))) {
                    return rightCol[num - 1];
                }
            }
            return null;
        };

        const studentRightItem = resolveRightItem(studentRightId);
        const correctRightItem = resolveRightItem(correctRightId);

        let isMatchedCorrectly = false;
        if (hasAnswered && (correctRightId || correctRightItem)) {
            if (studentRightId && correctRightId && studentRightId === correctRightId) {
                isMatchedCorrectly = true;
            } else if (studentRightItem && correctRightItem && studentRightItem.id === correctRightItem.id) {
                isMatchedCorrectly = true;
            } else if (
                studentRightItem &&
                correctRightItem &&
                clean(studentRightItem.text) !== '' &&
                clean(studentRightItem.text) === clean(correctRightItem.text)
            ) {
                isMatchedCorrectly = true;
            }
        }

        if (isMatchedCorrectly) {
            correctCount++;
        }

        return {
            leftId: String(item.id),
            correctRightId: correctRightId || (correctRightItem ? String(correctRightItem.id) : ''),
            studentRightId: hasAnswered ? (studentRightId || '') : null,
            isCorrect: isMatchedCorrectly
        };
    });

    const score = Number((correctCount * marksPerMatch).toFixed(2));
    const isCorrect = totalLeftItems > 0 && correctCount === totalLeftItems;

    let feedback = `Correctly matched ${correctCount} out of ${totalLeftItems} pairs.`;
    if (isCorrect) {
        feedback = "Perfect! All items matched correctly.";
    } else if (correctCount === 0) {
        feedback = "No matches were correct.";
    }

    return {
        score,
        isCorrect,
        matches: matchesDetails,
        feedback
    };
}
