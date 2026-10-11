import { NextRequest, NextResponse } from 'next/server';
import { executeCode, evaluateCodeAgainstTestCases, TestCase } from '@/lib/code-runner';

export async function POST(req: NextRequest) {
    try {
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

        const lang = (language || 'python').toLowerCase();
        if (!['python', 'c', 'cpp', 'c++'].includes(lang)) {
            return NextResponse.json({ error: `Language '${language}' is not supported. Use Python, C, or C++.` }, { status: 400 });
        }

        if (mode === 'test' && Array.isArray(testCases) && testCases.length > 0) {
            const evaluation = await evaluateCodeAgainstTestCases(
                code,
                lang === 'c++' ? 'cpp' : lang,
                testCases as TestCase[],
                timeLimitMs
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
            timeLimitMs
        });

        return NextResponse.json({
            success: true,
            mode: 'run',
            ...result
        });
    } catch (error: any) {
        console.error('Code execution error:', error);
        return NextResponse.json({
            error: error.message || 'Execution error'
        }, { status: 500 });
    }
}
