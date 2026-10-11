"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import {
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Terminal,
    RotateCcw,
    Code2,
    Cpu,
    Check,
    Layers,
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
    Copy
} from "lucide-react";
import { toast } from "sonner";

interface TestCase {
    id: string | number;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    explanation?: string;
    weight?: number;
}

interface CodingSectionProps {
    question: any;
    userAnswer: any;
    disabled?: boolean;
    submitted?: boolean;
    onAnswerChange: (value: any) => void;
    showResult?: boolean;
    result?: any;
}

const DEFAULT_STARTER_CODES: Record<string, string> = {
    python: `# Python 3 Solution
import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your solution here
    print("Hello, World!")

if __name__ == '__main__':
    solve()
`,
    c: `// C Solution
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Read input from stdin
    
    // Write your solution here
    printf("Hello, World!\\n");
    return 0;
}
`,
    cpp: `// C++ 17 Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input from cin
    
    // Write your solution here
    cout << "Hello, World!" << "\\n";
    return 0;
}
`
};

export function CodingSection({
    question,
    userAnswer,
    disabled,
    submitted,
    onAnswerChange,
    showResult,
    result
}: CodingSectionProps) {
    // 1. Language state
    const allowedLanguages = (question.allowedLanguages && Array.isArray(question.allowedLanguages))
        ? question.allowedLanguages
        : ['python', 'c', 'cpp'];

    const initialLang = (typeof userAnswer === 'object' && userAnswer?.language)
        ? userAnswer.language
        : allowedLanguages[0] || 'python';

    const [language, setLanguage] = useState<string>(initialLang);

    // 2. Starter code resolver
    const starterCodes = useMemo(() => {
        const custom = question.starterCode || question.options?.starterCode || {};
        return {
            python: custom.python || custom.py || DEFAULT_STARTER_CODES.python,
            c: custom.c || DEFAULT_STARTER_CODES.c,
            cpp: custom.cpp || custom['c++'] || DEFAULT_STARTER_CODES.cpp
        };
    }, [question]);

    // 3. Current Code state
    const initialCode = (typeof userAnswer === 'object' && userAnswer?.code)
        ? userAnswer.code
        : typeof userAnswer === 'string' && userAnswer !== 'No answer provided'
            ? userAnswer
            : starterCodes[language as keyof typeof starterCodes] || DEFAULT_STARTER_CODES.python;

    const [code, setCode] = useState<string>(initialCode);

    // 4. Test Cases
    const testCases: TestCase[] = useMemo(() => {
        if (Array.isArray(question.testCases)) return question.testCases;
        if (Array.isArray(question.options?.testCases)) return question.options.testCases;
        if (Array.isArray(question.subQuestions)) {
            return question.subQuestions.map((sq: any, i: number) => ({
                id: sq.id || (i + 1),
                input: sq.input || sq.question || '',
                expectedOutput: sq.expectedOutput || sq.modelAnswer || sq.output || '',
                isHidden: Boolean(sq.isHidden),
                explanation: sq.explanation,
                weight: Number(sq.marks || sq.weight) || 1
            }));
        }
        return [
            { id: 1, input: "5\\n1 2 3 4 5", expectedOutput: "15", isHidden: false, explanation: "Sum of array" },
            { id: 2, input: "3\\n10 20 30", expectedOutput: "60", isHidden: false }
        ];
    }, [question]);

    // Execution & testing states
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'tests' | 'custom' | 'console'>('tests');
    const [customInput, setCustomInput] = useState('');
    const [consoleOutput, setConsoleOutput] = useState<{ stdout: string; stderr: string; status: string; time: number } | null>(null);
    const [testResults, setTestResults] = useState<any[]>(() => {
        if (userAnswer && typeof userAnswer === 'object' && Array.isArray(userAnswer.testCaseResults)) {
            return userAnswer.testCaseResults;
        }
        return [];
    });
    const [selectedTestIndex, setSelectedTestIndex] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initial answer registration
    useEffect(() => {
        if (!userAnswer || (typeof userAnswer === 'object' && !userAnswer.code)) {
            syncAnswer(initialCode, initialLang, testResults);
        }
    }, []);

    // Sync answer changes upward
    const syncAnswer = (newCode: string, newLang: string, currentTestResults: any[]) => {
        const passedCount = currentTestResults.filter(t => t.passed).length;
        const total = testCases.length || currentTestResults.length || 1;
        const scoreRatio = total > 0 ? passedCount / total : 0;

        onAnswerChange({
            code: newCode,
            language: newLang,
            testCasesPassed: passedCount,
            totalTestCases: total,
            scoreRatio,
            testCaseResults: currentTestResults
        });
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCode(val);
        syncAnswer(val, language, testResults);
    };

    // Tab key indentation support in textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const spaces = "    "; // 4 spaces

            const newCode = code.substring(0, start) + spaces + code.substring(end);
            setCode(newCode);
            syncAnswer(newCode, language, testResults);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
            }, 0);
        }
    };

    const handleResetCode = () => {
        const starter = starterCodes[language as keyof typeof starterCodes] || DEFAULT_STARTER_CODES.python;
        setCode(starter);
        syncAnswer(starter, language, testResults);
        toast.info("Reset code to starter template.");
    };

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        const starter = starterCodes[newLang as keyof typeof starterCodes] || DEFAULT_STARTER_CODES[newLang] || "";
        setCode(starter);
        syncAnswer(starter, newLang, []);
        setTestResults([]);
        toast.success(`Switched language to ${newLang.toUpperCase()}`);
    };

    // Run Code with Custom / Sample Input
    const handleRunCode = async () => {
        setIsRunning(true);
        setActiveTab('console');
        try {
            const inputToUse = activeTab === 'custom' && customInput.trim()
                ? customInput
                : (testCases[0]?.input || '');

            const res = await fetch('/api/code/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    language,
                    input: inputToUse,
                    mode: 'run'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Execution failed');

            setConsoleOutput({
                stdout: data.stdout || '(No output)',
                stderr: data.stderr || '',
                status: data.status || 'Finished',
                time: data.executionTimeMs || 0
            });

            if (data.status === 'Success') {
                toast.success(`Ran successfully in ${data.executionTimeMs}ms`);
            } else {
                toast.error(`${data.status}: ${data.stderr || 'Check error output'}`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Run failed');
            setConsoleOutput({
                stdout: '',
                stderr: err.message,
                status: 'Error',
                time: 0
            });
        } finally {
            setIsRunning(false);
        }
    };

    // Run All Test Cases & Score
    const handleRunAllTests = async () => {
        setIsRunning(true);
        setActiveTab('tests');
        try {
            const res = await fetch('/api/code/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    language,
                    testCases,
                    mode: 'test'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Test execution failed');

            setTestResults(data.results || []);
            syncAnswer(code, language, data.results || []);

            const passed = data.passedCount || 0;
            const total = data.totalCount || testCases.length;

            if (passed === total) {
                toast.success(`🎉 All ${total} Test Cases Passed! Full marks earned.`);
            } else if (passed > 0) {
                toast.info(`${passed} of ${total} Test Cases Passed (Partial marks)`);
            } else {
                toast.error(`0 of ${total} Test Cases Passed. Check outputs.`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Testing failed');
        } finally {
            setIsRunning(false);
        }
    };

    const passedCount = testResults.filter(t => t.passed).length;
    const totalCount = testCases.length;
    const scoreEarned = totalCount > 0 ? ((passedCount / totalCount) * Number(question.marks || 10)).toFixed(1) : 0;

    return (
        <div className="w-full flex flex-col xl:grid xl:grid-cols-12 gap-5 text-left not-prose my-2">
            {/* ============================================================ */}
            {/* LEFT COLUMN: Problem Description, Constraints & Samples     */}
            {/* ============================================================ */}
            <div className="xl:col-span-5 flex flex-col gap-4 bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-wider">
                                CODING CONTEST
                            </Badge>
                            <Badge variant="outline" className={`text-xs font-bold ${
                                question.difficulty === 'EASY' ? 'text-emerald-600 border-emerald-300' :
                                question.difficulty === 'HARD' ? 'text-rose-600 border-rose-300' :
                                'text-amber-600 border-amber-300'
                            }`}>
                                {question.difficulty || 'MEDIUM'}
                            </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                            {question.topic ? `${question.topic}: ` : ''}{question.questionText?.split('\n')[0] || "Programming Problem"}
                        </h2>
                    </div>
                    <Badge variant="secondary" className="text-sm font-black shrink-0 px-2.5 py-1 bg-primary text-primary-foreground">
                        {question.marks || 10} Pt
                    </Badge>
                </div>

                {/* Problem Statement Body */}
                <div className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                    <UniversalMathJax>
                        {cleanupMath(question.questionText || "Write a program that satisfies the given problem specifications.")}
                    </UniversalMathJax>
                </div>

                {/* Constraints & Specs */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                        <Cpu className="w-3.5 h-3.5 text-primary" />
                        <span>Execution Specs: Time Limit: {question.timeLimit || 2000}ms | Memory Limit: {question.memoryLimit || 256}MB</span>
                    </div>
                    {question.constraints && (
                        <div className="text-muted-foreground font-mono">
                            <span className="font-semibold text-foreground">Constraints:</span> {question.constraints}
                        </div>
                    )}
                </div>

                {/* Sample Test Cases Accordion / Cards */}
                <div className="space-y-3 mt-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-primary" />
                        Sample Test Cases ({testCases.filter(t => !t.isHidden).length})
                    </h3>

                    <div className="space-y-2.5 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
                        {testCases.filter(t => !t.isHidden).map((tc, idx) => (
                            <div key={idx} className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-xs font-mono">
                                <div className="text-[11px] font-sans font-bold text-primary-400 mb-1.5 flex justify-between">
                                    <span>Sample Case {idx + 1}</span>
                                    {tc.weight && <span className="text-slate-400">{tc.weight} Marks</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <div className="text-[10px] text-slate-400 font-sans font-semibold mb-0.5">Input:</div>
                                        <pre className="whitespace-pre-wrap">{tc.input || '(empty)'}</pre>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <div className="text-[10px] text-emerald-400 font-sans font-semibold mb-0.5">Expected Output:</div>
                                        <pre className="whitespace-pre-wrap text-emerald-300">{tc.expectedOutput}</pre>
                                    </div>
                                </div>
                                {tc.explanation && (
                                    <div className="mt-1.5 text-[11px] font-sans text-slate-400 italic">
                                        💡 {tc.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: Code Editor, Language Switcher & Test Console  */}
            {/* ============================================================ */}
            <div className="xl:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg min-h-[550px]">
                {/* Editor Header Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-slate-200">SOLUTION EDITOR</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
                            {allowedLanguages.map((lang: string) => {
                                const isSelected = language === lang;
                                return (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => handleLanguageChange(lang)}
                                        disabled={disabled || submitted}
                                        className={`px-2.5 py-1 rounded-md transition-all font-bold ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {lang === 'cpp' ? 'C++' : lang.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Reset Code */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetCode}
                            disabled={disabled || submitted}
                            title="Reset to starter template"
                            className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                        </Button>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="relative flex-1 bg-slate-950 flex flex-col">
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={handleCodeChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || submitted}
                        placeholder="Write your code here..."
                        spellCheck={false}
                        className="w-full flex-1 min-h-[300px] p-4 bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed resize-y border-none focus:outline-hidden focus:ring-0 selection:bg-primary/30"
                    />
                </div>

                {/* Execution Controls Bottom Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleRunCode}
                            disabled={isRunning || disabled || submitted}
                            className="h-8 px-3 text-xs font-bold gap-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        >
                            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                            Run Code
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleRunAllTests}
                            disabled={isRunning || disabled || submitted}
                            className="h-8 px-3 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Submit & Test ({testCases.length} Tests)
                        </Button>
                    </div>

                    {/* Score Status */}
                    <div className="text-xs font-mono font-bold flex items-center gap-2">
                        {testResults.length > 0 ? (
                            <span className={passedCount === totalCount ? "text-emerald-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                                {passedCount === totalCount ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {passedCount}/{totalCount} Passed ({scoreEarned}/{question.marks || 10} Pt)
                            </span>
                        ) : (
                            <span className="text-slate-500 italic">Not tested yet</span>
                        )}
                    </div>
                </div>

                {/* Test Results & Console Drawer */}
                <div className="bg-slate-900/90 border-t border-slate-800 p-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-1.5 text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setActiveTab('tests')}
                            className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                                activeTab === 'tests' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Test Cases ({testResults.length}/{testCases.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('console')}
                            className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                                activeTab === 'console' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Console Output
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('custom')}
                            className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
                                activeTab === 'custom' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Custom Input
                        </button>
                    </div>

                    {/* TAB 1: Test Cases Pills & Detail */}
                    {activeTab === 'tests' && (
                        <div className="space-y-2">
                            {testResults.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-2">Click &apos;Submit &amp; Test&apos; to run your solution against test cases.</p>
                            ) : (
                                <div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {testResults.map((tr, idx) => {
                                            const isSel = selectedTestIndex === idx;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSelectedTestIndex(idx)}
                                                    className={`px-2 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                                                        tr.passed
                                                            ? (isSel ? 'bg-emerald-950 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800')
                                                            : (isSel ? 'bg-rose-950 text-rose-300 border-rose-500 ring-1 ring-rose-500' : 'bg-rose-950/60 text-rose-400 border-rose-800')
                                                    }`}
                                                >
                                                    {tr.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                                                    Case {idx + 1} {tr.isHidden ? '🔒' : ''}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Selected Test Case Detail */}
                                    {testResults[selectedTestIndex] && (
                                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                                            <div className="flex justify-between items-center text-[11px] text-slate-400">
                                                <span>Case {selectedTestIndex + 1} Status: <strong className={testResults[selectedTestIndex].passed ? "text-emerald-400" : "text-rose-400"}>{testResults[selectedTestIndex].status}</strong></span>
                                                <span>{testResults[selectedTestIndex].executionTimeMs}ms</span>
                                            </div>
                                            {!testResults[selectedTestIndex].isHidden ? (
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500">Expected:</div>
                                                        <pre className="text-emerald-400 bg-slate-900 p-1.5 rounded-md whitespace-pre-wrap">{testResults[selectedTestIndex].expectedOutput}</pre>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500">Actual Output:</div>
                                                        <pre className={`p-1.5 rounded-md whitespace-pre-wrap ${testResults[selectedTestIndex].passed ? 'text-slate-200 bg-slate-900' : 'text-rose-400 bg-rose-950/40'}`}>
                                                            {testResults[selectedTestIndex].actualOutput || '(Empty)'}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 italic py-1">🔒 Hidden test case (Details masked to prevent reverse-engineering).</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: Console Output */}
                    {activeTab === 'console' && (
                        <div className="text-xs font-mono space-y-1">
                            {consoleOutput ? (
                                <>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                        <span>Status: <strong className={consoleOutput.status === 'Success' ? 'text-emerald-400' : 'text-rose-400'}>{consoleOutput.status}</strong></span>
                                        <span>{consoleOutput.time}ms</span>
                                    </div>
                                    <pre className="p-2 bg-slate-950 text-slate-200 rounded-lg whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                                        {consoleOutput.stdout}
                                    </pre>
                                    {consoleOutput.stderr && (
                                        <pre className="p-2 bg-rose-950/50 text-rose-300 rounded-lg whitespace-pre-wrap">
                                            {consoleOutput.stderr}
                                        </pre>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-500 italic py-2">Click &apos;Run Code&apos; to view stdout and execution diagnostics.</p>
                            )}
                        </div>
                    )}

                    {/* TAB 3: Custom Input */}
                    {activeTab === 'custom' && (
                        <div className="text-xs font-mono">
                            <textarea
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Enter custom stdin test input..."
                                className="w-full h-20 p-2 bg-slate-950 text-slate-200 rounded-lg border border-slate-800 text-xs font-mono focus:outline-hidden"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CodingSection;
