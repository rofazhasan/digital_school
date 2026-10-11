import { TestCase } from "@/lib/code-runner";

export interface CodingQuestion {
    id: string;
    marks: number;
    questionText: string;
    options?: any;
    testCases?: TestCase[];
    subQuestions?: any;
    starterCode?: any;
    allowedLanguages?: string[];
}

export interface CodingAnswer {
    code: string;
    language?: string;
    testCasesPassed?: number;
    totalTestCases?: number;
    scoreRatio?: number;
    testCaseResults?: any[];
}

export interface CodingEvaluationResult {
    score: number;
    isCorrect: boolean;
    passedCount: number;
    totalTests: number;
    testCaseResults: any[];
    code: string;
    language: string;
    attempted: boolean;
}

export function evaluateCodingQuestion(
    question: CodingQuestion,
    answer: CodingAnswer | string
): CodingEvaluationResult {
    const qMarks = Number(question.marks) || 10;

    let code = '';
    let language = 'python';
    let passedCount = 0;
    let totalTests = 0;
    let scoreRatio = 0;
    let testCaseResults: any[] = [];
    let isAttempted = false;

    // 1. Normalize student answer
    if (typeof answer === 'string') {
        code = answer.trim();
        isAttempted = Boolean(code && code !== 'No answer provided');
    } else if (typeof answer === 'object' && answer !== null) {
        code = String(answer.code || '').trim();
        language = String(answer.language || 'python').toLowerCase();
        passedCount = Number(answer.testCasesPassed) || 0;
        totalTests = Number(answer.totalTestCases) || 0;
        scoreRatio = typeof answer.scoreRatio === 'number' ? answer.scoreRatio : 0;
        testCaseResults = Array.isArray(answer.testCaseResults) ? answer.testCaseResults : [];
        isAttempted = Boolean(code && code !== 'No answer provided');
    }

    if (!isAttempted) {
        return {
            score: 0,
            isCorrect: false,
            passedCount: 0,
            totalTests: 0,
            testCaseResults: [],
            code: '',
            language,
            attempted: false
        };
    }

    // 2. Discover question test cases from various possible storage locations
    const rawTestCases: TestCase[] = Array.isArray(question.testCases)
        ? question.testCases
        : Array.isArray(question.options?.testCases)
            ? question.options.testCases
            : Array.isArray(question.subQuestions)
                ? question.subQuestions.map((sq: any) => ({
                    id: sq.id,
                    input: sq.input || sq.question || '',
                    expectedOutput: sq.expectedOutput || sq.modelAnswer || sq.output || '',
                    isHidden: Boolean(sq.isHidden),
                    weight: Number(sq.marks || sq.weight) || 1
                }))
                : [];

    const effectiveTotal = totalTests > 0 ? totalTests : rawTestCases.length;

    // 3. Compute score based on passed test cases
    if (scoreRatio > 0) {
        // Already verified by test execution
    } else if (effectiveTotal > 0 && passedCount > 0) {
        scoreRatio = passedCount / effectiveTotal;
    } else if (testCaseResults.length > 0) {
        const passedFromList = testCaseResults.filter(tc => tc.passed || tc.status === 'Passed').length;
        passedCount = passedFromList;
        totalTests = testCaseResults.length;
        scoreRatio = totalTests > 0 ? passedFromList / totalTests : 0;
    }

    let calculatedScore = Math.round(scoreRatio * qMarks * 100) / 100;

    // Precision tolerance: if ratio >= 0.99 or within 0.05 of max marks, give full marks
    if (scoreRatio >= 0.99 || Math.abs(calculatedScore - qMarks) <= 0.05) {
        calculatedScore = qMarks;
    }

    const isCorrect = calculatedScore >= qMarks;

    return {
        score: calculatedScore,
        isCorrect,
        passedCount,
        totalTests: effectiveTotal,
        testCaseResults,
        code,
        language,
        attempted: true
    };
}
