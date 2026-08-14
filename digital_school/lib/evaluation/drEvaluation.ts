import { areExpressionsEquivalent } from '../math-parser';

export interface DRReasonOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface DRQuestion {
    id: string;
    marks: number;
    answerType?: 'integer' | 'decimal' | 'text' | 'mcq';
    expectedAnswer: number | string;
    tolerance?: number;
    reasonOptions: DRReasonOption[];
    confidenceTracking?: boolean;
}

export interface DRAnswer {
    answer: number | string;
    reasonId: string;
    confidence?: 'Certain' | 'Probably' | 'Unsure' | string;
}

export type DRDiagnosticTag = 
    | 'MASTERY' 
    | 'FRAGILE_MASTERY' 
    | 'MISCONCEPTION' 
    | 'GUESS' 
    | 'STRONG_MISCONCEPTION' 
    | 'KNOWLEDGE_GAP' 
    | 'EXECUTION_SLIP';

export interface DREvaluationResult {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    diagnosticTag: DRDiagnosticTag;
    answerCorrect: boolean;
    reasonCorrect: boolean;
    confidence?: string;
    feedback: string;
}

/**
 * Evaluates a single Diagnostic Reasoning (DR) question using the Confidence x Reasoning Matrix
 */
export function evaluateDRQuestion(
    question: DRQuestion,
    studentAnswer: DRAnswer
): DREvaluationResult {
    const maxMarks = Number(question.marks) || 1;
    let parsedAns: any = studentAnswer;
    if (typeof parsedAns === 'string') {
        try { parsedAns = JSON.parse(parsedAns); } catch {}
    }
    const studentAnsRaw = parsedAns?.answer ?? parsedAns;
    const studentReasonId = parsedAns?.reasonId;
    const confidenceStr = String(parsedAns?.confidence || 'Certain').toLowerCase();
    const isHighConfidence = confidenceStr === 'certain' || confidenceStr === 'high';

    let isAnswerCorrect = false;
    const expectedStr = String(question.expectedAnswer ?? (question as any).modelAnswer ?? (question as any).answer ?? '').trim();
    const studentStr = String(studentAnsRaw ?? '').trim();

    const tol = Number(question.tolerance) || 0.01;
    isAnswerCorrect = areExpressionsEquivalent(studentStr, expectedStr, tol);

    let rawReasons = question.reasonOptions || (question as any).reasons || (question as any).options || (question as any).reason_options || (question as any).subQuestions || [];
    if (typeof rawReasons === 'string') {
        try { rawReasons = JSON.parse(rawReasons); } catch { rawReasons = []; }
    }
    if (rawReasons && typeof rawReasons === 'object' && !Array.isArray(rawReasons)) {
        rawReasons = (rawReasons as any).options || (rawReasons as any).reasons || (rawReasons as any).reasonOptions || [];
    }
    const reasonOpts: DRReasonOption[] = Array.isArray(rawReasons) ? rawReasons : [];

    const selectedReason = reasonOpts.find(r => r.id === studentReasonId || r.text === studentReasonId || String(r.id).trim() === String(studentReasonId).trim());
    const isReasonCorrect = Boolean(selectedReason?.isCorrect);

    let earned = 0;
    let diagnosticTag: DRDiagnosticTag = 'KNOWLEDGE_GAP';

    if (isAnswerCorrect && isReasonCorrect) {
        earned = maxMarks;
        diagnosticTag = isHighConfidence ? 'MASTERY' : 'FRAGILE_MASTERY';
    } else if (isAnswerCorrect && !isReasonCorrect) {
        earned = maxMarks * 0.25; // 25% credit
        diagnosticTag = isHighConfidence ? 'MISCONCEPTION' : 'GUESS';
    } else if (!isAnswerCorrect && isReasonCorrect) {
        earned = maxMarks * 0.40; // 40% credit for solid methodology
        diagnosticTag = 'EXECUTION_SLIP';
    } else {
        earned = 0;
        diagnosticTag = isHighConfidence ? 'STRONG_MISCONCEPTION' : 'KNOWLEDGE_GAP';
    }

    const finalScore = Math.round(earned * 100) / 100;
    const isCorrect = finalScore >= maxMarks * 0.99;

    let feedback = '';
    switch (diagnosticTag) {
        case 'MASTERY':
            feedback = "Full Mastery! Answer and reasoning are sound, with high confidence.";
            break;
        case 'FRAGILE_MASTERY':
            feedback = "Answer and reasoning are correct, but confidence is low (Fragile Mastery).";
            break;
        case 'MISCONCEPTION':
            feedback = "Answer is correct, but high-confidence selected reasoning is flawed (Misconception).";
            break;
        case 'GUESS':
            feedback = "Answer is correct with wrong reasoning and low confidence (Lucky Guess).";
            break;
        case 'EXECUTION_SLIP':
            feedback = "Reasoning is correct, but answer had a calculation slip (Execution Slip).";
            break;
        case 'STRONG_MISCONCEPTION':
            feedback = "Answer and reasoning are wrong with high confidence (Strong Misconception).";
            break;
        case 'KNOWLEDGE_GAP':
            feedback = "Answer and reasoning are wrong (Knowledge Gap).";
            break;
    }

    return {
        score: finalScore,
        maxScore: maxMarks,
        isCorrect,
        diagnosticTag,
        answerCorrect: isAnswerCorrect,
        reasonCorrect: isReasonCorrect,
        confidence: studentAnswer?.confidence,
        feedback
    };
}
