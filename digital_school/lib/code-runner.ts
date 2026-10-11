import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CodeExecutionOptions {
    code: string;
    language: 'python' | 'c' | 'cpp' | 'c++';
    input?: string;
    timeLimitMs?: number; // Default 3000ms
    memoryLimitMb?: number;
}

export interface CodeExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    status: 'Success' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error' | 'Internal Error';
    executionTimeMs: number;
}

export interface TestCase {
    id?: string | number;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    explanation?: string;
    weight?: number;
}

export interface TestCaseEvaluationResult {
    testCaseId: string | number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: 'Passed' | 'Failed' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
    passed: boolean;
    executionTimeMs: number;
    isHidden: boolean;
    error?: string;
    weight: number;
}

/**
 * Normalizes output strings by trimming trailing spaces and unifying line breaks
 */
export function normalizeOutput(str: string): string {
    if (!str) return '';
    return str
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
}

/**
 * Execute code in Python, C, or C++ with timeout and input
 */
export async function executeCode(options: CodeExecutionOptions): Promise<CodeExecutionResult> {
    const { code, input = '', timeLimitMs = 3000 } = options;
    const lang = options.language.toLowerCase() === 'c++' ? 'cpp' : options.language.toLowerCase() as 'python' | 'c' | 'cpp';

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds_runner_'));
    const startTime = Date.now();

    try {
        if (lang === 'python') {
            const scriptPath = path.join(tempDir, 'solution.py');
            fs.writeFileSync(scriptPath, code, 'utf-8');

            return await runProcess('python3', [scriptPath], input, timeLimitMs, tempDir, startTime);
        } else if (lang === 'c') {
            const sourcePath = path.join(tempDir, 'solution.c');
            const binaryPath = path.join(tempDir, 'solution.out');
            fs.writeFileSync(sourcePath, code, 'utf-8');

            // Compile C
            const compileResult = await runProcess('gcc', [sourcePath, '-o', binaryPath, '-O2', '-lm'], '', 5000, tempDir, startTime);
            if (compileResult.exitCode !== 0) {
                return {
                    stdout: '',
                    stderr: compileResult.stderr || 'Compilation failed',
                    exitCode: compileResult.exitCode,
                    status: 'Compilation Error',
                    executionTimeMs: Date.now() - startTime
                };
            }

            return await runProcess(binaryPath, [], input, timeLimitMs, tempDir, Date.now());
        } else if (lang === 'cpp') {
            const sourcePath = path.join(tempDir, 'solution.cpp');
            const binaryPath = path.join(tempDir, 'solution.out');
            fs.writeFileSync(sourcePath, code, 'utf-8');

            // Compile C++
            const compileResult = await runProcess('g++', [sourcePath, '-o', binaryPath, '-O2', '-std=c++17'], '', 7000, tempDir, startTime);
            if (compileResult.exitCode !== 0) {
                return {
                    stdout: '',
                    stderr: compileResult.stderr || 'Compilation failed',
                    exitCode: compileResult.exitCode,
                    status: 'Compilation Error',
                    executionTimeMs: Date.now() - startTime
                };
            }

            return await runProcess(binaryPath, [], input, timeLimitMs, tempDir, Date.now());
        } else {
            return {
                stdout: '',
                stderr: `Unsupported language: ${lang}`,
                exitCode: 1,
                status: 'Internal Error',
                executionTimeMs: 0
            };
        }
    } finally {
        // Clean up temporary files
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.warn('Failed to clean up runner tempDir:', cleanupErr);
        }
    }
}

function runProcess(
    command: string,
    args: string[],
    stdinInput: string,
    timeoutMs: number,
    cwd: string,
    timerStart: number
): Promise<CodeExecutionResult> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let isTimedOut = false;
        const maxOutputLength = 500 * 1024; // 500 KB

        const proc = spawn(command, args, {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PATH: process.env.PATH || '/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin'
            }
        });

        const timer = setTimeout(() => {
            isTimedOut = true;
            try {
                proc.kill('SIGKILL');
            } catch {}
        }, timeoutMs);

        if (stdinInput && proc.stdin) {
            try {
                proc.stdin.write(stdinInput);
                proc.stdin.end();
            } catch (err) {
                console.warn('Error writing to stdin:', err);
            }
        } else if (proc.stdin) {
            proc.stdin.end();
        }

        proc.stdout.on('data', (data) => {
            if (stdout.length < maxOutputLength) {
                stdout += data.toString();
            }
        });

        proc.stderr.on('data', (data) => {
            if (stderr.length < maxOutputLength) {
                stderr += data.toString();
            }
        });

        proc.on('close', (code) => {
            clearTimeout(timer);
            const executionTimeMs = Date.now() - timerStart;

            if (isTimedOut) {
                resolve({
                    stdout,
                    stderr: stderr || 'Execution timed out',
                    exitCode: null,
                    status: 'Time Limit Exceeded',
                    executionTimeMs
                });
            } else if (code !== 0) {
                resolve({
                    stdout,
                    stderr,
                    exitCode: code,
                    status: 'Runtime Error',
                    executionTimeMs
                });
            } else {
                resolve({
                    stdout,
                    stderr,
                    exitCode: 0,
                    status: 'Success',
                    executionTimeMs
                });
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            resolve({
                stdout,
                stderr: err.message,
                exitCode: 1,
                status: 'Internal Error',
                executionTimeMs: Date.now() - timerStart
            });
        });
    });
}

/**
 * Run code against a list of test cases and calculate scores
 */
export async function evaluateCodeAgainstTestCases(
    code: string,
    language: 'python' | 'c' | 'cpp',
    testCases: TestCase[],
    timeLimitMs: number = 3000
): Promise<{
    results: TestCaseEvaluationResult[];
    passedCount: number;
    totalCount: number;
    scoreRatio: number;
    status: 'All Passed' | 'Partial' | 'Failed' | 'Compilation Error';
}> {
    if (!testCases || testCases.length === 0) {
        return {
            results: [],
            passedCount: 0,
            totalCount: 0,
            scoreRatio: 0,
            status: 'Failed'
        };
    }

    const results: TestCaseEvaluationResult[] = [];
    let passedWeights = 0;
    let totalWeights = 0;
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const weight = Number(tc.weight) || 1;
        totalWeights += weight;

        const execResult = await executeCode({
            code,
            language,
            input: tc.input || '',
            timeLimitMs
        });

        if (execResult.status === 'Compilation Error') {
            // Short-circuit on compilation error
            results.push({
                testCaseId: tc.id || (i + 1),
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: '',
                status: 'Compilation Error',
                passed: false,
                executionTimeMs: execResult.executionTimeMs,
                isHidden: Boolean(tc.isHidden),
                error: execResult.stderr,
                weight
            });
            return {
                results,
                passedCount: 0,
                totalCount: testCases.length,
                scoreRatio: 0,
                status: 'Compilation Error'
            };
        }

        const normalizedActual = normalizeOutput(execResult.stdout);
        const normalizedExpected = normalizeOutput(tc.expectedOutput);
        const isPassed = execResult.status === 'Success' && normalizedActual === normalizedExpected;

        if (isPassed) {
            passedCount++;
            passedWeights += weight;
        }

        results.push({
            testCaseId: tc.id || (i + 1),
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: normalizedActual,
            status: isPassed ? 'Passed' : execResult.status,
            passed: isPassed,
            executionTimeMs: execResult.executionTimeMs,
            isHidden: Boolean(tc.isHidden),
            error: execResult.stderr,
            weight
        });
    }

    const scoreRatio = totalWeights > 0 ? passedWeights / totalWeights : 0;
    const status = passedCount === testCases.length ? 'All Passed' : passedCount > 0 ? 'Partial' : 'Failed';

    return {
        results,
        passedCount,
        totalCount: testCases.length,
        scoreRatio,
        status
    };
}
