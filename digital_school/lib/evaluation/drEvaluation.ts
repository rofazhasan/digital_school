import { gradeDRResponse, DRGradingConfig, DRMatchMethod } from '../dr-autograder';
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
    drSubtype?: 'TEXT' | 'NUMERIC' | 'SYMBOLIC' | 'SET' | 'LIST';
    canonicalAnswer?: string;
    acceptedAnswers?: string[] | string;
    aliases?: string[] | string;
    expectedAnswer?: number | string;
    tolerance?: number;
    toleranceType?: 'ABSOLUTE' | 'RELATIVE' | 'PERCENTAGE';
    toleranceValue?: number;
    expectedUnit?: string;
    unitRequired?: boolean;
    orderSensitive?: boolean;
    caseSensitive?: boolean;
    allowBengali?: boolean;
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
    status?: 'CORRECT' | 'INCORRECT' | 'UNANSWERED' | 'REVIEW_REQUIRED';
    score: number;
    maxScore: number;
    isCorrect: boolean;
    diagnosticTag: DRDiagnosticTag;
    answerCorrect: boolean;
    reasonCorrect: boolean;
    confidence?: string;
    feedback: string;
    matchedBy?: DRMatchMethod;
    canonicalStudentAnswer?: string;
    canonicalExpectedAnswer?: string;
    rawStudentAnswer?: string;
    isAttempted?: boolean;
}

/**
 * Evaluates a single Diagnostic Reasoning (DR) question using the Confidence x Reasoning Matrix
 * powered by the Production-Grade Deterministic DR Autograder Engine.
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

    const studentAnsRaw = parsedAns?.answer ?? (typeof parsedAns !== 'object' ? parsedAns : undefined);
    const studentReasonId = parsedAns?.reasonId;

    const isAttempted = Boolean(
        (studentAnsRaw !== undefined && studentAnsRaw !== null && String(studentAnsRaw).trim() !== '' && String(studentAnsRaw).trim() !== 'No answer provided') ||
        (studentReasonId !== undefined && studentReasonId !== null && String(studentReasonId).trim() !== '')
    );

    const canonicalExp = String(question.canonicalAnswer || question.expectedAnswer || (question as any).modelAnswer || (question as any).answer || '').trim();

    if (!isAttempted) {
        return {
            status: 'UNANSWERED',
            score: 0,
            maxScore: maxMarks,
            isCorrect: false,
            diagnosticTag: 'KNOWLEDGE_GAP',
            answerCorrect: false,
            reasonCorrect: false,
            confidence: parsedAns?.confidence,
            feedback: 'Question unattempted.',
            matchedBy: 'NONE',
            canonicalStudentAnswer: '',
            canonicalExpectedAnswer: canonicalExp,
            rawStudentAnswer: '',
            isAttempted: false
        };
    }

    const confidenceStr = String(parsedAns?.confidence || 'Certain').toLowerCase();
    const isHighConfidence = confidenceStr === 'certain' || confidenceStr === 'high';

    // 1. Grade Part A with Production-Grade DR Autograder Engine
    const drGradingConfig: DRGradingConfig = {
        drSubtype: question.drSubtype || 'TEXT',
        canonicalAnswer: canonicalExp,
        acceptedAnswers: question.acceptedAnswers || question.aliases,
        aliases: question.aliases,
        toleranceType: question.toleranceType || 'ABSOLUTE',
        toleranceValue: question.toleranceValue ?? question.tolerance ?? 0.01,
        expectedUnit: question.expectedUnit,
        unitRequired: question.unitRequired,
        orderSensitive: question.orderSensitive,
        caseSensitive: question.caseSensitive,
        allowBengali: question.allowBengali
    };

    const autograderRes = gradeDRResponse(studentAnsRaw, drGradingConfig, maxMarks);
    const isAnswerCorrect = autograderRes.status === 'CORRECT';

    // 2. Grade Part B Reason Choice
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

    // 3. Compute Matrix Score & Diagnostic Tag
    let earned = 0;
    let diagnosticTag: DRDiagnosticTag = 'KNOWLEDGE_GAP';

    if (isAnswerCorrect && isReasonCorrect) {
        earned = maxMarks;
        diagnosticTag = isHighConfidence ? 'MASTERY' : 'FRAGILE_MASTERY';
    } else if (isAnswerCorrect && !isReasonCorrect) {
        earned = maxMarks * 0.25; // 25% credit
        diagnosticTag = isHighConfidence ? 'MISCONCEPTION' : 'GUESS';
    } else if (!isAnswerCorrect && isReasonCorrect) {
        earned = maxMarks * 0.40; // 40% method credit
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
        status: isCorrect ? 'CORRECT' : (earned > 0 ? 'CORRECT' : 'INCORRECT'),
        score: finalScore,
        maxScore: maxMarks,
        isCorrect,
        diagnosticTag,
        answerCorrect: isAnswerCorrect,
        reasonCorrect: isReasonCorrect,
        confidence: parsedAns?.confidence,
        feedback,
        matchedBy: autograderRes.matchedBy,
        canonicalStudentAnswer: autograderRes.canonicalStudentAnswer,
        canonicalExpectedAnswer: canonicalExp,
        rawStudentAnswer: String(studentAnsRaw || ''),
        isAttempted: true
    };
}
