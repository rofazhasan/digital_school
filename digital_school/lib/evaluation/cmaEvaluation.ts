import { areExpressionsEquivalent } from '../math-parser';

// CMA (Constructed Multi-Answer) Question Evaluation Logic
// Evaluates compound multi-part questions containing child questions of varying types (MCQ, MC, INT, AR, MTF)
// with partial credit support and deterministic offline grading.

export interface CMAPart {
    id: string;
    label?: string;
    prompt?: string;
    question?: string;
    type?: 'integer' | 'decimal' | 'expression' | 'fraction' | 'text' | 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | string;
    marks: number;
    expectedAnswer?: number | string;
    correctAnswer?: number | string;
    modelAnswer?: number | string;
    tolerance?: number; // E.g. ±0.05
    unit?: string;
    acceptedAnswers?: string[] | string;
    aliases?: string[] | string;
    options?: any[];
    matches?: Record<string, string>;
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

    const childType = String(part.type || (part as any).fieldType || (part as any).questionType || (part as any).subType || 'numeric').toUpperCase();
    const studentStr = String(rawStudentVal).trim();
    const expectedStr = String(part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? '').trim();
    const tol = typeof part.tolerance === 'number' && !isNaN(part.tolerance) && part.tolerance > 0
        ? part.tolerance
        : (Number(part.tolerance) > 0 ? Number(part.tolerance) : 0.05);

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
    let isEquiv = areExpressionsEquivalent(studentStr, expectedStr, tol);

    // Unit-resilient fallback: try stripping units if direct check fails
    if (!isEquiv && (part.unit || studentStr.match(/[a-zA-Z\u0980-\u09FF°]/) || expectedStr.match(/[a-zA-Z\u0980-\u09FF°]/))) {
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
                'kg', 'gm', 'g', 'N', 'Pa', 'W', 'V', 'A', 'C', 'J', 'ohm', 'rad/s', 'radians', 'radian', 'rads', 'rad',
                'ডিগ্রি', 'degree', 'degrees', 'deg', '°', '^\\circ', '\\circ'
            ];
            for (const unitStr of commonUnits) {
                res = res.split(unitStr).join('');
            }
            return res.trim();
        };

        const cleanStu = stripUnits(studentStr, part.unit);
        const cleanExp = stripUnits(expectedStr, part.unit);
        if (cleanStu && cleanExp) {
            isEquiv = areExpressionsEquivalent(cleanStu, cleanExp, tol);
        }
    }

    if (!isEquiv && (part.acceptedAnswers || part.aliases)) {
        const aliases = Array.isArray(part.acceptedAnswers || part.aliases)
            ? (part.acceptedAnswers || part.aliases) as string[]
            : String(part.acceptedAnswers || part.aliases).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        
        for (const alias of aliases) {
            if (areExpressionsEquivalent(studentStr, alias, tol)) {
                isEquiv = true;
                break;
            }
        }
    }

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

    // Safely normalize studentAnswer if it is a JSON string or wrapped object
    let parsedStudentAnswer: any = studentAnswer;
    if (typeof parsedStudentAnswer === 'string') {
        const trimmed = parsedStudentAnswer.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') {
                    parsedStudentAnswer = parsed;
                }
            } catch {}
        }
    }

    if (parsedStudentAnswer && typeof parsedStudentAnswer === 'object') {
        const qId = question.id;
        if (qId && parsedStudentAnswer[qId] !== undefined) {
            const inner = parsedStudentAnswer[qId];
            if (typeof inner === 'object' && inner !== null) {
                parsedStudentAnswer = { ...parsedStudentAnswer, ...inner };
            }
        }
    }

    let totalEarned = 0;
    const partResults: Record<string, CMAPartResult> = {};
    const totalPartsWeight = parts.reduce((acc, p) => acc + (Number(p.marks) || 1), 0);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const partId = part.id || (part as any).key || (part as any).name || `part_${i}`;
        const partMax = (Number(part.marks) || 1) / totalPartsWeight * maxMarks;
        
        let rawStudentVal: any = undefined;
        if (parsedStudentAnswer && typeof parsedStudentAnswer === 'object') {
            rawStudentVal = parsedStudentAnswer[partId] ??
                parsedStudentAnswer[part.id || ''] ??
                parsedStudentAnswer[(part as any).key || ''] ??
                parsedStudentAnswer[(part as any).name || ''] ??
                parsedStudentAnswer[part.label || ''] ??
                parsedStudentAnswer[(part.label || '').toLowerCase()] ??
                parsedStudentAnswer[(part.label || '').toUpperCase()] ??
                parsedStudentAnswer[(part as any).prompt || ''] ??
                parsedStudentAnswer[(part as any).text || ''] ??
                parsedStudentAnswer[(part as any).question || ''] ??
                parsedStudentAnswer[(part as any).questionText || ''] ??
                parsedStudentAnswer[`part_${i}`] ??
                parsedStudentAnswer[`part_${i + 1}`] ??
                parsedStudentAnswer[`p${i + 1}`] ??
                parsedStudentAnswer[`p_${i + 1}`] ??
                parsedStudentAnswer[String(i)] ??
                parsedStudentAnswer[String(i + 1)] ??
                parsedStudentAnswer[['ক', 'খ', 'গ', 'ঘ', 'ঙ'][i]] ??
                parsedStudentAnswer[`${question.id}_${partId}`] ??
                parsedStudentAnswer[`${question.id}_part_${i}`] ??
                parsedStudentAnswer[`${question.id}_sub_${i}`] ??
                parsedStudentAnswer[`${question.id}_${i}`];

            if (rawStudentVal === undefined && parts.length === 1) {
                rawStudentVal = parsedStudentAnswer[question.id] ??
                    parsedStudentAnswer.answer ??
                    parsedStudentAnswer.value ??
                    parsedStudentAnswer.text ??
                    (Object.keys(parsedStudentAnswer).length === 1 ? Object.values(parsedStudentAnswer)[0] : undefined);
            }
        } else if (typeof parsedStudentAnswer === 'string' || typeof parsedStudentAnswer === 'number') {
            if (parts.length === 1 || i === 0) {
                rawStudentVal = parsedStudentAnswer;
            }
        }

        if (rawStudentVal && typeof rawStudentVal === 'object') {
            rawStudentVal = rawStudentVal.answer ?? rawStudentVal.value ?? rawStudentVal.text ?? rawStudentVal;
        }

        const evalRes = evaluateCMAChildPart(part, rawStudentVal);
        const earned = Math.round((evalRes.earnedRatio * partMax) * 100) / 100;
        totalEarned += earned;

        const partRes: CMAPartResult = {
            isCorrect: evalRes.isCorrect,
            isAttempted: evalRes.isAttempted,
            status: evalRes.status,
            earned,
            max: Math.round(partMax * 100) / 100,
            studentVal: rawStudentVal ?? 'N/A',
            expectedVal: part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? 'N/A',
            matchedBy: evalRes.matchedBy,
            childType: String(part.type || (part as any).fieldType || 'numeric').toUpperCase()
        };

        partResults[partId] = partRes;
        if (part.id && part.id !== partId) partResults[part.id] = partRes;
        if (part.label && part.label !== partId) partResults[part.label] = partRes;
        if (!partResults[`part_${i}`]) partResults[`part_${i}`] = partRes;
    }

    let finalScore = Math.round(totalEarned * 100) / 100;
    const allPartsCorrect = parts.length > 0 && Object.values(partResults).every(p => p.isCorrect);
    const isCorrect = allPartsCorrect || (maxMarks > 0 && (finalScore >= maxMarks * 0.99 || Math.abs(finalScore - maxMarks) <= 0.02));

    // If all sub-questions are answered correctly or reached .99, award full marks
    if (isCorrect) {
        finalScore = maxMarks;
    }

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
