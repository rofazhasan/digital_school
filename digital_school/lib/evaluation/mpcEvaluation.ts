import { areExpressionsEquivalent, evaluateExpressionAtSample, normalizeBengaliNumeralsAndText } from '../math-parser';

// MPC (Multi-Step Problem Chain) Question Evaluation Logic
// Evaluates sequential problem stages with dependency-aware scoring, Directed Acyclic Graph (DAG) validation,
// and Follow-Through Error Propagation (EPH).

export interface MPCStage {
    id: string;
    stageTitle?: string;
    text?: string;
    question?: string;
    type?: string; // Default NUMERIC, also supports SYMBOLIC, INT, DR, etc.
    marks: number;
    expectedAnswer: number | string;
    tolerance?: number;
    unit?: string;
    dependsOnStageId?: string; // ID of preceding stage required for evaluation
    dependsOn?: string[] | string;
    gradingMode?: 'FOLLOW_THROUGH' | 'EXACT' | string;
    formula?: string;          // Dynamic formula, e.g. "0.5 * 2 * part1^2" or "prev * 4"
    evaluation?: {
        operation?: 'multiply' | 'add' | 'subtract' | 'divide' | 'power' | string;
        operand?: number;
        expression?: string;
    };
    explanation?: string;
}

export interface MPCQuestion {
    id: string;
    marks: number;
    scenario?: string;
    stages?: MPCStage[];
    mpcStages?: MPCStage[];
    subQuestions?: MPCStage[];
}

export type MPCAnswer = Record<string, any>;

export interface MPCStageResult {
    isCorrectDirectly: boolean;
    isCorrectWithPropagatedError: boolean;
    isAttempted: boolean;
    status: 'CORRECT' | 'INCORRECT' | 'FOLLOW_THROUGH_CORRECT' | 'PARTIALLY_CORRECT' | 'UNANSWERED' | 'NOT_ATTEMPTED' | 'REVIEW_REQUIRED';
    earned: number;
    max: number;
    studentVal: any;
    expectedVal: any;
    dependsOn?: string[];
    gradingMode?: string;
}

export interface MPCEvaluationResult {
    score: number;
    maxScore: number;
    isCorrect: boolean;
    stageResults: Record<string, MPCStageResult>;
    feedback: string;
}

/**
 * Validates MPC dependencies to ensure there are no circular dependencies (DAG Check).
 */
export function validateMPCDependencies(stages: MPCStage[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(stages) || stages.length === 0) return { isValid: true };

    const adj: Record<string, string[]> = {};
    const stageIds = new Set(stages.map((s, idx) => s.id || `s${idx + 1}`));

    for (let idx = 0; idx < stages.length; idx++) {
        const stage = stages[idx];
        const u = stage.id || `s${idx + 1}`;
        adj[u] = [];

        const depsRaw = stage.dependsOn || stage.dependsOnStageId;
        const deps = Array.isArray(depsRaw) ? depsRaw : (depsRaw ? [depsRaw] : []);
        for (const dep of deps) {
            if (dep && stageIds.has(dep) && dep !== u) {
                adj[u].push(dep);
            }
        }
    }

    const state: Record<string, number> = {};
    let cyclePathString = '';

    function dfs(node: string, currentPath: string[]): boolean {
        state[node] = 1;
        currentPath.push(node);

        for (const dep of (adj[node] || [])) {
            if (state[dep] === 1) {
                const cycleStartIndex = currentPath.indexOf(dep);
                cyclePathString = [...currentPath.slice(cycleStartIndex), dep].join(' → ');
                return true;
            }
            if (!state[dep] && dfs(dep, currentPath)) {
                return true;
            }
        }

        state[node] = 2;
        currentPath.pop();
        return false;
    }

    for (const node of Object.keys(adj)) {
        if (!state[node]) {
            if (dfs(node, [])) {
                return {
                    isValid: false,
                    error: `Circular dependency detected in MPC stages (${cyclePathString}). MPC dependencies must form a Directed Acyclic Graph (DAG).`
                };
            }
        }
    }

    return { isValid: true };
}

/**
 * Safely evaluates dynamic formula for follow-through grading given predecessor student values.
 */
function computeDynamicTarget(
    stage: MPCStage,
    studentAnswer: MPCAnswer,
    depIds: string[]
): number | null {
    if (depIds.length === 0) return null;

    const sampleVars: Record<string, number> = {};
    let primaryPrevVal: number | null = null;

    for (const depId of depIds) {
        const rawVal = studentAnswer ? studentAnswer[depId] : undefined;
        const normVal = normalizeBengaliNumeralsAndText(String(rawVal ?? '')).replace(/[^0-9.-]/g, '');
        const numVal = parseFloat(normVal);
        if (!isNaN(numVal)) {
            sampleVars[depId] = numVal;
            sampleVars[`stage_${depId}`] = numVal;
            if (primaryPrevVal === null) primaryPrevVal = numVal;
        }
    }

    if (primaryPrevVal !== null) {
        sampleVars['prev'] = primaryPrevVal;
    }

    // 1. Operation object format
    if (stage.evaluation) {
        if (stage.evaluation.expression) {
            return evaluateExpressionAtSample(stage.evaluation.expression, sampleVars);
        }
        if (primaryPrevVal !== null && stage.evaluation.operation && stage.evaluation.operand !== undefined) {
            const op = stage.evaluation.operation.toLowerCase();
            const operand = Number(stage.evaluation.operand);
            if (op === 'multiply') return primaryPrevVal * operand;
            if (op === 'add') return primaryPrevVal + operand;
            if (op === 'subtract') return primaryPrevVal - operand;
            if (op === 'divide' && operand !== 0) return primaryPrevVal / operand;
            if (op === 'power') return Math.pow(primaryPrevVal, operand);
        }
    }

    // 2. Formula string format (e.g. "0.5 * 2 * part1^2" or "prev * 4")
    if (stage.formula) {
        return evaluateExpressionAtSample(stage.formula, sampleVars);
    }

    return null;
}

/**
 * Evaluates an MPC (Multi-Step Problem Chain) question with follow-through error propagation.
 */
export function evaluateMPCQuestion(
    question: MPCQuestion,
    studentAnswer: MPCAnswer
): MPCEvaluationResult {
    let rawStages = question.stages || question.mpcStages || question.subQuestions || (question as any).sub_questions || [];
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
    const stageResults: Record<string, MPCStageResult> = {};
    const totalWeight = stages.reduce((acc, s) => acc + (Number(s.marks) || 1), 0);

    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const stageId = stage.id || `s${i + 1}`;
        const stageMax = (Number(stage.marks) || 1) / totalWeight * maxMarks;
        
        let studentValRaw: any = undefined;
        if (studentAnswer && typeof studentAnswer === 'object') {
            studentValRaw = studentAnswer[stageId] ??
                studentAnswer[stage.id || ''] ??
                studentAnswer[stage.stageTitle || ''] ??
                studentAnswer[stage.text || ''] ??
                studentAnswer[`stage_${i}`] ??
                studentAnswer[`stage_${i + 1}`] ??
                studentAnswer[`s${i + 1}`] ??
                studentAnswer[`s_${i + 1}`] ??
                studentAnswer[String(i)] ??
                studentAnswer[String(i + 1)] ??
                studentAnswer[`Stage ${i + 1}`] ??
                studentAnswer[`stage ${i + 1}`] ??
                studentAnswer[['ধাপ ১', 'ধাপ ২', 'ধাপ ৩', 'ধাপ ৪', 'ধাপ ৫'][i]];
        } else if (typeof studentAnswer === 'string' && stages.length === 1) {
            studentValRaw = studentAnswer;
        }

        const isAttempted = studentValRaw !== undefined &&
            studentValRaw !== null &&
            String(studentValRaw).trim() !== '' &&
            String(studentValRaw).trim() !== 'No answer provided';

        const expectedStr = String(stage.expectedAnswer ?? '').trim();
        const studentStr = String(studentValRaw ?? '').trim();
        const tol = Number(stage.tolerance) || 0.05;

        let isCorrectDirectly = false;
        let isCorrectWithPropagatedError = false;

        const depsRaw = stage.dependsOn || stage.dependsOnStageId;
        const depIds = Array.isArray(depsRaw) ? depsRaw : (depsRaw ? [depsRaw] : (i > 0 ? [`s${i}`] : []));
        const gradingMode = stage.gradingMode || 'FOLLOW_THROUGH';

        if (isAttempted) {
            // 1. Direct Evaluation against official answer key
            isCorrectDirectly = areExpressionsEquivalent(studentStr, expectedStr, tol);

            // Unit-resilient fallback
            if (!isCorrectDirectly && (stage.unit || studentStr.match(/[a-zA-Z\u0980-\u09FF°]/) || expectedStr.match(/[a-zA-Z\u0980-\u09FF°]/))) {
                const stripUnits = (s: string, u?: string) => {
                    let res = String(s).trim();
                    if (u) {
                        res = res.replace(new RegExp(`\\b${u}\\b`, 'gi'), '');
                        res = res.split(u).join('');
                    }
                    const commonUnits = [
                        'মিটার/সেকেন্ড^২', 'মি/সে^২', 'মি/সে২', 'মিটার/সেকেন্ড', 'মি/সে',
                        'm/s^2', 'ms^-2', 'ms^{-2}', 'm/s', 'ms^-1', 'ms^{-1}',
                        'কিলোগ্রাম', 'কেজি', 'গ্রাম', 'নিউটন', 'প্যাসকেল', 'ওয়াট', 'ওয়াট', 'ভোল্ট', 'অ্যাম্পিয়ার', 'কুলম্ব', 'জুল',
                        'kg', 'gm', 'g', 'N', 'Pa', 'W', 'V', 'A', 'C', 'J', 'ohm', 'rad/s', 'rad',
                        'ডিগ্রি', 'degree', 'degrees', 'deg', '°', '^\\circ', '\\circ'
                    ];
                    for (const unitStr of commonUnits) {
                        res = res.split(unitStr).join('');
                    }
                    return res.trim();
                };

                const cleanStu = stripUnits(studentStr, stage.unit);
                const cleanExp = stripUnits(expectedStr, stage.unit);
                if (cleanStu && cleanExp) {
                    isCorrectDirectly = areExpressionsEquivalent(cleanStu, cleanExp, tol);
                }
            }

            // 2. Follow-Through Evaluation if direct check failed and gradingMode allows follow-through
            if (!isCorrectDirectly && gradingMode !== 'EXACT' && depIds.length > 0) {
                const dynamicTarget = computeDynamicTarget(stage, studentAnswer, depIds);
                if (dynamicTarget !== null && !isNaN(dynamicTarget)) {
                    const studentNum = parseFloat(studentStr);
                    if (!isNaN(studentNum)) {
                        isCorrectWithPropagatedError = Math.abs(studentNum - dynamicTarget) <= tol + 1e-9;
                    } else {
                        isCorrectWithPropagatedError = areExpressionsEquivalent(studentStr, String(dynamicTarget), tol);
                    }
                }
            }
        }

        const isEarned = isCorrectDirectly || isCorrectWithPropagatedError;
        const earned = isEarned ? Math.round(stageMax * 100) / 100 : 0;
        if (earned > 0) totalEarned += earned;

        let status: 'CORRECT' | 'INCORRECT' | 'FOLLOW_THROUGH_CORRECT' | 'PARTIALLY_CORRECT' | 'UNANSWERED' | 'NOT_ATTEMPTED' | 'REVIEW_REQUIRED';
        if (!isAttempted) {
            status = 'UNANSWERED';
        } else if (isCorrectDirectly) {
            status = 'CORRECT';
        } else if (isCorrectWithPropagatedError) {
            status = 'FOLLOW_THROUGH_CORRECT';
        } else {
            status = 'INCORRECT';
        }

        stageResults[stageId] = {
            isCorrectDirectly,
            isCorrectWithPropagatedError,
            isAttempted,
            status,
            earned,
            max: Math.round(stageMax * 100) / 100,
            studentVal: studentValRaw ?? 'N/A',
            expectedVal: stage.expectedAnswer,
            dependsOn: depIds,
            gradingMode
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
            : `Score: ${finalScore}/${maxMarks}. Includes follow-through method credit.`
    };
}
