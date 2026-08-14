import { areExpressionsEquivalent } from '../math-parser';

// MPC (Multi-Step Problem Chain) Question Evaluation Logic
// Evaluates sequential problem stages with dependency-aware scoring and Error Propagation Handling.

export interface MPCStage {
    id: string;
    stageTitle: string;
    marks: number;
    expectedAnswer: number | string;
    tolerance?: number;
    dependsOnStageId?: string; // ID of preceding stage required for evaluation
    formula?: string;          // Dynamic formula, e.g. "0.5 * m * (prev)^2" or "prev * 2"
}

export interface MPCQuestion {
    id: string;
    marks: number;
    scenario?: string;
    stages?: MPCStage[];
    mpcStages?: MPCStage[];
}

export type MPCAnswer = Record<string, number | string>;

export interface MPCEvaluationResult {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    stageResults: Record<string, {
        isCorrectDirectly: boolean;
        isCorrectWithPropagatedError: boolean;
        earned: number;
        max: number;
        studentVal: any;
        expectedVal: any;
    }>;
    feedback: string;
}

/**
 * Safely evaluates dynamic formula given a previous student value
 */
function computeDynamicTarget(formula: string | undefined, prevStudentVal: number): number | null {
    if (!formula) return null;
    try {
        const sanitized = formula.replace(/prev|stage\d+_ans/g, String(prevStudentVal));
        // Simple safe numeric evaluator for basic operators (+ - * / ^)
        const func = new Function(`return ${sanitized.replace(/\^/g, '**')}`);
        const result = func();
        return typeof result === 'number' && !isNaN(result) ? result : null;
    } catch {
        return null;
    }
}

/**
 * Evaluates an MPC (Multi-Step Problem Chain) question
 */
export function evaluateMPCQuestion(
    question: MPCQuestion,
    studentAnswer: MPCAnswer
): MPCEvaluationResult {
    let rawStages = question.stages || question.mpcStages || (question as any).subQuestions || (question as any).sub_questions || [];
    if (typeof rawStages === 'string') {
        try { rawStages = JSON.parse(rawStages); } catch { rawStages = []; }
    }
    const stages: MPCStage[] = Array.isArray(rawStages) ? rawStages : [];
    const maxMarks = Number(question.marks) || stages.reduce((acc, s) => acc + (Number(s.marks) || 0), 0) || 1;

    if (stages.length === 0) {
        return {
            score: 0,
            maxScore: maxMarks,
            isCorrect: false,
            stageResults: {},
            feedback: "No stages configured for MPC question."
        };
    }

    let totalEarned = 0;
    const stageResults: Record<string, {
        isCorrectDirectly: boolean;
        isCorrectWithPropagatedError: boolean;
        earned: number;
        max: number;
        studentVal: any;
        expectedVal: any;
    }> = {};

    const totalWeight = stages.reduce((acc, s) => acc + (Number(s.marks) || 1), 0);

    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const stageMax = (Number(stage.marks) || 1) / totalWeight * maxMarks;
        const studentValRaw = studentAnswer ? (studentAnswer[stage.id] ?? studentAnswer[stage.stageTitle] ?? (stage as any).key ?? (stage as any).name ?? studentAnswer[`stage_${i}`]) : undefined;
        const studentNum = parseFloat(String(studentValRaw ?? ''));

        const expectedNum = parseFloat(String(stage.expectedAnswer ?? ''));
        const tol = Number(stage.tolerance) || 0.01;

        let isCorrectDirectly = false;
        let isCorrectWithPropagatedError = false;

        // 1. Direct Evaluation against key
        const expectedStr = String(stage.expectedAnswer ?? '').trim();
        const studentStr = String(studentValRaw ?? '').trim();
        isCorrectDirectly = areExpressionsEquivalent(studentStr, expectedStr, tol);

        // 2. Error Propagation Evaluation if direct check failed & dependency exists
        if (!isCorrectDirectly && stage.dependsOnStageId) {
            const prevStageId = stage.dependsOnStageId;
            const prevStudentVal = parseFloat(String(studentAnswer ? studentAnswer[prevStageId] : ''));
            if (!isNaN(prevStudentVal)) {
                const dynamicTarget = computeDynamicTarget(stage.formula, prevStudentVal);
                if (dynamicTarget !== null && !isNaN(studentNum)) {
                    isCorrectWithPropagatedError = Math.abs(studentNum - dynamicTarget) <= tol;
                }
            }
        }

        const earned = (isCorrectDirectly || isCorrectWithPropagatedError) ? stageMax : 0;
        if (earned > 0) totalEarned += earned;

        stageResults[stage.id] = {
            isCorrectDirectly,
            isCorrectWithPropagatedError,
            earned: Math.round(earned * 100) / 100,
            max: Math.round(stageMax * 100) / 100,
            studentVal: studentValRaw ?? 'N/A',
            expectedVal: stage.expectedAnswer
        };
    }

    const finalScore = Math.round(totalEarned * 100) / 100;
    const isCorrect = finalScore >= maxMarks * 0.99;

    return {
        score: finalScore,
        maxScore: maxMarks,
        isCorrect,
        stageResults,
        feedback: isCorrect
            ? "Multi-step problem chain completed successfully!"
            : `Score: ${finalScore}/${maxMarks}. Includes methodology credit for error propagation.`
    };
}
