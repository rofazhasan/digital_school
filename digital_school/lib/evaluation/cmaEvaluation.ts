import { areExpressionsEquivalent } from '../math-parser';

// CMA (Constructed Multi-Answer) Question Evaluation Logic
// Evaluates multi-field constructed answers (integer, decimal with tolerance, symbolic math, text) with partial credit support.

export interface CMAPart {
    id: string;
    label: string;
    type?: 'integer' | 'decimal' | 'expression' | 'fraction' | 'text' | string;
    marks: number;
    expectedAnswer: number | string;
    tolerance?: number; // E.g. ±0.05
    unit?: string;
}

export interface CMAQuestion {
    id: string;
    marks: number;
    parts?: CMAPart[];
    cmaParts?: CMAPart[];
}

export type CMAAnswer = Record<string, number | string>;

export interface CMAEvaluationResult {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    partResults: Record<string, { isCorrect: boolean; earned: number; max: number; studentVal: any; expectedVal: any }>;
    feedback: string;
}

/**
 * Normalizes expressions for basic algebraic equivalence checks
 */
function normalizeExpr(str: string): string {
    return String(str || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\^/g, '**')
        .replace(/\*/g, '');
}

/**
 * Evaluates a single CMA (Constructed Multi-Answer) question
 */
export function evaluateCMAQuestion(
    question: CMAQuestion,
    studentAnswer: CMAAnswer
): CMAEvaluationResult {
    let rawParts = question.parts || question.cmaParts || (question as any).subQuestions || (question as any).sub_questions || [];
    if (typeof rawParts === 'string') {
        try { rawParts = JSON.parse(rawParts); } catch { rawParts = []; }
    }
    const parts: CMAPart[] = Array.isArray(rawParts) ? rawParts : [];
    const maxMarks = Number(question.marks) || parts.reduce((acc, p) => acc + (Number(p.marks) || 0), 0) || 1;
    
    if (parts.length === 0) {
        return {
            score: 0,
            maxScore: maxMarks,
            isCorrect: false,
            partResults: {},
            feedback: "No parts configured for CMA question."
        };
    }

    let totalEarned = 0;
    const partResults: Record<string, { isCorrect: boolean; earned: number; max: number; studentVal: any; expectedVal: any }> = {};
    
    // Total marks configured across parts
    const totalPartsWeight = parts.reduce((acc, p) => acc + (Number(p.marks) || 1), 0);

    for (const part of parts) {
        const partMax = (Number(part.marks) || 1) / totalPartsWeight * maxMarks;
        const rawStudentVal = studentAnswer ? (studentAnswer[part.id] ?? studentAnswer[part.label] ?? (part as any).name ?? (part as any).prompt ?? studentAnswer[`part_${parts.indexOf(part)}`]) : undefined;
        const isAttempted = rawStudentVal !== undefined && rawStudentVal !== null && String(rawStudentVal).trim() !== '' && String(rawStudentVal).trim() !== 'No answer provided';
        let isCorrect = false;
        
        const expectedStr = String(part.expectedAnswer ?? (part as any).modelAnswer ?? '').trim();
        const studentStr = String(rawStudentVal ?? '').trim();

        if (isAttempted) {
            const tol = Number(part.tolerance) || 0.01;
            isCorrect = areExpressionsEquivalent(studentStr, expectedStr, tol);
        }

        const earned = isCorrect ? partMax : 0;
        if (isCorrect) totalEarned += earned;

        partResults[part.id] = {
            isCorrect,
            isAttempted,
            status: isAttempted ? (isCorrect ? 'CORRECT' : 'INCORRECT') : 'UNANSWERED',
            earned: Math.round(earned * 100) / 100,
            max: Math.round(partMax * 100) / 100,
            studentVal: rawStudentVal ?? 'N/A',
            expectedVal: part.expectedAnswer || (part as any).modelAnswer
        } as any;
    }

    const finalScore = Math.round(totalEarned * 100) / 100;
    const isCorrect = finalScore >= maxMarks * 0.99;

    return {
        score: finalScore,
        maxScore: maxMarks,
        isCorrect,
        partResults,
        feedback: isCorrect
            ? "All constructed answers are correct!"
            : `Score: ${finalScore}/${maxMarks}. Some parts were incorrect.`
    };
}
