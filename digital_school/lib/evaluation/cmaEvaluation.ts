import { areExpressionsEquivalent } from '../math-parser';
import { gradeDRResponse } from '../dr-autograder';

// CMA (Constructed Multi-Answer) Question Evaluation Logic
// Evaluates compound multi-part questions containing child questions of varying types (MCQ, MC, INT, AR, MTF, DR)
// with partial credit support and deterministic offline grading.

export interface CMAPart {
    id: string;
    label?: string;
    prompt?: string;
    question?: string;
    type?: 'integer' | 'decimal' | 'expression' | 'fraction' | 'text' | 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'DR' | string;
    marks: number;
    expectedAnswer?: number | string;
    correctAnswer?: number | string;
    modelAnswer?: number | string;
    tolerance?: number; // E.g. ±0.05
    unit?: string;
    options?: any[];
    matches?: Record<string, string>;
    acceptedAnswers?: string[] | string;
    aliases?: string[] | string;
    drSubtype?: 'TEXT' | 'NUMERIC' | 'SYMBOLIC' | 'SET' | 'LIST';
}

export interface CMAQuestion {
    id: string;
    marks: number;
    parts?: CMAPart[];
    cmaParts?: CMAPart[];
    subQuestions?: CMAPart[];
}

export type CMAAnswer = Record<string, any>;

export interface CMAPartResult {
    isCorrect: boolean;
    isAttempted: boolean;
    status: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNANSWERED';
    earned: number;
    max: number;
    studentVal: any;
    expectedVal: any;
    matchedBy?: string;
    childType?: string;
}

export interface CMAEvaluationResult {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    partResults: Record<string, CMAPartResult>;
    feedback: string;
}

/**
 * Evaluates an individual child sub-question part inside a CMA compound question.
 */
export function evaluateCMAChildPart(
    part: CMAPart,
    rawStudentVal: any
): { isCorrect: boolean; isAttempted: boolean; status: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNANSWERED'; matchedBy?: string; earnedRatio: number } {
    const isAttempted = rawStudentVal !== undefined &&
        rawStudentVal !== null &&
        String(rawStudentVal).trim() !== '' &&
        String(rawStudentVal).trim() !== 'No answer provided';

    if (!isAttempted) {
        return { isCorrect: false, isAttempted: false, status: 'UNANSWERED', earnedRatio: 0 };
    }

    const childType = String(part.type || (part as any).questionType || (part as any).subType || 'numeric').toUpperCase();
    const studentStr = String(rawStudentVal).trim();
    const expectedStr = String(part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? '').trim();
    const tol = Number(part.tolerance) || 0.01;

    // 1. MCQ Child
    if (childType === 'MCQ') {
        const isMatch = studentStr.toLowerCase() === expectedStr.toLowerCase() ||
            (part.options || []).some((opt: any) => opt.isCorrect && (String(opt.text).trim().toLowerCase() === studentStr.toLowerCase() || String(opt.id) === studentStr));
        return { isCorrect: isMatch, isAttempted: true, status: isMatch ? 'CORRECT' : 'INCORRECT', earnedRatio: isMatch ? 1 : 0 };
    }

    // 2. MC (Multiple Correct) Child
    if (childType === 'MC') {
        const stuOpts: string[] = Array.isArray(rawStudentVal)
            ? rawStudentVal.map(String)
            : studentStr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
        const correctOpts: string[] = (part.options || [])
            .filter((o: any) => o.isCorrect)
            .map((o: any) => String(o.text || o.id).trim());

        if (correctOpts.length === 0 && expectedStr) {
            correctOpts.push(expectedStr);
        }

        const correctHits = stuOpts.filter(o => correctOpts.some(c => c.toLowerCase() === o.toLowerCase())).length;
        const wrongHits = stuOpts.filter(o => !correctOpts.some(c => c.toLowerCase() === o.toLowerCase())).length;

        if (wrongHits === 0 && correctHits === correctOpts.length) {
            return { isCorrect: true, isAttempted: true, status: 'CORRECT', earnedRatio: 1 };
        } else if (correctHits > 0 && wrongHits === 0) {
            return { isCorrect: false, isAttempted: true, status: 'PARTIAL', earnedRatio: correctHits / (correctOpts.length || 1) };
        }
        return { isCorrect: false, isAttempted: true, status: 'INCORRECT', earnedRatio: 0 };
    }

    // 3. DR Child
    if (childType === 'DR') {
        const drRes = gradeDRResponse(studentStr, {
            canonicalAnswer: expectedStr,
            acceptedAnswers: part.acceptedAnswers || part.aliases,
            drSubtype: part.drSubtype || 'TEXT',
            toleranceValue: tol
        });
        const isMatch = drRes.status === 'CORRECT';
        return {
            isCorrect: isMatch,
            isAttempted: true,
            status: isMatch ? 'CORRECT' : 'INCORRECT',
            matchedBy: drRes.matchedBy,
            earnedRatio: isMatch ? 1 : 0
        };
    }

    // 4. AR (Assertion-Reason) Child
    if (childType === 'AR') {
        const correctOpt = Number((part as any).correctOption || (part as any).correct || 0);
        const stuOpt = Number(studentStr);
        const isMatch = !isNaN(stuOpt) && stuOpt === correctOpt;
        return { isCorrect: isMatch, isAttempted: true, status: isMatch ? 'CORRECT' : 'INCORRECT', earnedRatio: isMatch ? 1 : 0 };
    }

    // 5. MTF (Match the Following) Child
    if (childType === 'MTF') {
        const matches = part.matches || {};
        const stuMatches = typeof rawStudentVal === 'object' && rawStudentVal !== null ? rawStudentVal : {};
        let matchCount = 0;
        const totalPairs = Object.keys(matches).length || 1;
        for (const [k, v] of Object.entries(matches)) {
            if (String(stuMatches[k]).trim().toUpperCase() === String(v).trim().toUpperCase()) {
                matchCount++;
            }
        }
        const isMatch = matchCount === totalPairs;
        return {
            isCorrect: isMatch,
            isAttempted: true,
            status: isMatch ? 'CORRECT' : (matchCount > 0 ? 'PARTIAL' : 'INCORRECT'),
            earnedRatio: matchCount / totalPairs
        };
    }

    // 6. Default INT / NUMERIC / EXPRESSION / TEXT Child
    const isEquiv = areExpressionsEquivalent(studentStr, expectedStr, tol);
    return { isCorrect: isEquiv, isAttempted: true, status: isEquiv ? 'CORRECT' : 'INCORRECT', earnedRatio: isEquiv ? 1 : 0 };
}

/**
 * Evaluates a compound CMA (Constructed Multi-Answer) question containing sub-questions of varying types.
 */
export function evaluateCMAQuestion(
    question: CMAQuestion,
    studentAnswer: CMAAnswer
): CMAEvaluationResult {
    let rawParts = question.parts || question.cmaParts || question.subQuestions || (question as any).sub_questions || [];
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
            feedback: "No subquestions configured for CMA question."
        };
    }

    let totalEarned = 0;
    const partResults: Record<string, CMAPartResult> = {};
    const totalPartsWeight = parts.reduce((acc, p) => acc + (Number(p.marks) || 1), 0);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partId = part.id || `part_${i}`;
        const partMax = (Number(part.marks) || 1) / totalPartsWeight * maxMarks;
        
        const rawStudentVal = studentAnswer
            ? (studentAnswer[partId] ?? studentAnswer[part.label || ''] ?? studentAnswer[(part as any).prompt || ''] ?? studentAnswer[`part_${i}`])
            : undefined;

        const evalRes = evaluateCMAChildPart(part, rawStudentVal);
        const earned = Math.round((evalRes.earnedRatio * partMax) * 100) / 100;
        totalEarned += earned;

        partResults[partId] = {
            isCorrect: evalRes.isCorrect,
            isAttempted: evalRes.isAttempted,
            status: evalRes.status,
            earned,
            max: Math.round(partMax * 100) / 100,
            studentVal: rawStudentVal ?? 'N/A',
            expectedVal: part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? 'N/A',
            matchedBy: evalRes.matchedBy,
            childType: String(part.type || 'numeric').toUpperCase()
        };
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
            : `Score: ${finalScore}/${maxMarks}. Partial credit calculated across sub-questions.`
    };
}
