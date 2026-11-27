import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { executeCode, evaluateCodeAgainstTestCases, TestCase } from '@/lib/code-runner';

const MAX_CODE_LENGTH = 50_000;
const MAX_INPUT_LENGTH = 20_000;
const MAX_TEST_CASES = 25;

export async function POST(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth?.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const {
            code,
            language,
            input = '',
            testCases,
            timeLimitMs = 3000,
            mode = 'run' // 'run' (single input) or 'test' (run against testCases)
        } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }
        if (code.length > MAX_CODE_LENGTH) {
            return NextResponse.json({ error: 'Code exceeds maximum allowed length' }, { status: 413 });
        }
        if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) {
            return NextResponse.json({ error: 'Input exceeds maximum allowed length' }, { status: 413 });
        }
        const safeTimeLimitMs = Math.max(500, Math.min(5000, Number(timeLimitMs) || 3000));

        const lang = (language || 'python').toLowerCase();
        if (!['python', 'c', 'cpp', 'c++'].includes(lang)) {
            return NextResponse.json({ error: `Language '${language}' is not supported. Use Python, C, or C++.` }, { status: 400 });
        }

        if (mode === 'test' && Array.isArray(testCases) && testCases.length > 0) {
            const evaluation = await evaluateCodeAgainstTestCases(
                code,
                lang === 'c++' ? 'cpp' : lang,
                (testCases as TestCase[]).slice(0, MAX_TEST_CASES),
                safeTimeLimitMs
            );
            return NextResponse.json({
                success: true,
                mode: 'test',
                ...evaluation
            });
        }

        // Default: Run with provided input
        const result = await executeCode({
            code,
            language: lang === 'c++' ? 'cpp' : lang,
            input,
            timeLimitMs: safeTimeLimitMs
        });

        return NextResponse.json({
            success: true,
            mode: 'run',
            ...result
        });
    } catch (error: any) {
        console.error('Code execution error:', error);
        return NextResponse.json({
            error: 'Execution failed'
        }, { status: 500 });
    }
}
