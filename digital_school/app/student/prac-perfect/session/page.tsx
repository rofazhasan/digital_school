"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, RotateCcw, Flag, ArrowRight, Eye, Sparkles,
    Check, Square, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation } from "@/lib/utils";
import { evaluateMTFQuestion } from "@/lib/evaluation/mtfEvaluation";

// Dynamic Imports for Canvas
const SmartBoard = dynamic(() => import("@/app/components/SmartBoard"), { ssr: false });
import { SmartBoardRef } from "@/app/components/SmartBoard";

const SmartBoardToolbar = dynamic(() => import("@/app/components/SmartBoardToolbar").then(mod => mod.SmartBoardToolbar), { ssr: false });

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml", "[tex]/mhchem"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        packages: { '[+]': ['mhchem'] }
    },
};

interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ' | 'DESCRIPTIVE' | 'SMCQ';
    subject: string;
    topic?: string;
    difficulty?: string;
    marks?: number;
    options?: { text: string; isCorrect: boolean; explanation?: string; originalIndex?: number }[];
    modelAnswer?: string;
    explanation?: string;
    images?: string[];
    subQuestions?: any[];
    assertion?: string;
    reason?: string;
    correctOption?: number;
    leftColumn?: { id: string; text: string; originalIndex?: number }[];
    rightColumn?: { id: string; text: string; originalIndex?: number }[];
    matches?: Record<string, string>;
}

export default function PracPerfectSessionPage() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);
    const questionContainerRef = useRef<HTMLDivElement>(null);

    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Board State
    const [boardBackground, setBoardBackground] = useState<'white' | 'grid' | 'black'>('white');

    // Per-question answer state: userAnswers[currentIndex]
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});

    // Status State for current question
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Result Tracking
    const [sessionResults, setSessionResults] = useState<Record<number, 'correct' | 'wrong' | 'unanswered'>>({});
    const [score, setScore] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    // Overlay State
    const [showQuestion, setShowQuestion] = useState(true);

    // Per-Question Timer State (Student Mode: Auto-starts, Non-pausable, Auto-advances)
    const [timerSetting, setTimerSetting] = useState<string>("off");
    const [timerDurationSeconds, setTimerDurationSeconds] = useState<number>(0);
    const [questionTimerSeconds, setQuestionTimerSeconds] = useState<number>(0);

    // Initialize
    useEffect(() => {
        const loadSession = async () => {
            document.title = "Practice Session || Student | Digital School";

            const storedIds = localStorage.getItem("prac-perfect-session");
            const savedTimerSecsStr = localStorage.getItem("prac-perfect-timer-seconds");
            const savedTimerStr = localStorage.getItem("prac-perfect-timer") || "off";
            let customSecs = 0;
            if (savedTimerSecsStr && !isNaN(parseInt(savedTimerSecsStr))) {
                customSecs = parseInt(savedTimerSecsStr);
            } else if (savedTimerStr !== "off" && !isNaN(parseInt(savedTimerStr))) {
                customSecs = parseInt(savedTimerStr) * 60;
            }

            if (customSecs > 0) {
                setTimerSetting(`${customSecs}s`);
                setTimerDurationSeconds(customSecs);
                setQuestionTimerSeconds(customSecs);
            } else {
                setTimerSetting("off");
                setTimerDurationSeconds(0);
            }

            if (!storedIds) {
                toast.error("No active session found");
                router.push("/student/prac-perfect");
                return;
            }

            try {
                const ids = JSON.parse(storedIds);
                const res = await fetch(`/api/student/prac-perfect/questions?ids=${ids.join(',')}`);
                const data = await res.json();

                if (data.questions && data.questions.length > 0) {
                    const shuffle = (array: any[]) => {
                        for (let i = array.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [array[i], array[j]] = [array[j], array[i]];
                        }
                        return array;
                    };

                    const rawQuestions = [...data.questions];
                    shuffle(rawQuestions);

                    const processedQuestions = rawQuestions.map(q => {
                        let updatedQ = { ...q };

                        // 1. Resolve correctness and map options for MCQ, MC, SMCQ, AR BEFORE shuffling
                        if ((q.type === 'MCQ' || q.type === 'MC' || q.type === 'SMCQ' || q.type === 'AR') && Array.isArray(q.options) && q.options.length > 0) {
                            let dbCorrectIdx = -1;
                            const foundIdx = q.options.findIndex((o: any) => o.isCorrect === true || String(o.isCorrect) === 'true');
                            if (foundIdx !== -1) {
                                dbCorrectIdx = foundIdx;
                            } else if ((q as any).correctOption !== undefined && (q as any).correctOption !== null) {
                                const num = Number((q as any).correctOption);
                                dbCorrectIdx = num > 0 && num <= q.options.length ? num - 1 : num;
                            } else if (q.correctAnswer || q.modelAnswer) {
                                const str = (q.correctAnswer || q.modelAnswer || "").trim().toUpperCase();
                                const letterMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 };
                                if (letterMap[str] !== undefined) {
                                    dbCorrectIdx = letterMap[str];
                                } else {
                                    const num = parseInt(str);
                                    if (!isNaN(num)) dbCorrectIdx = num;
                                }
                            }

                            const optionsWithIndex = q.options.map((opt: any, idx: number) => {
                                const optObj = typeof opt === 'string' ? { text: opt } : { ...opt };
                                const isOptCorrect = optObj.isCorrect !== undefined
                                    ? (optObj.isCorrect === true || String(optObj.isCorrect) === 'true')
                                    : (dbCorrectIdx >= 0 ? idx === dbCorrectIdx : false);
                                return {
                                    ...optObj,
                                    originalIndex: idx,
                                    isCorrect: isOptCorrect
                                };
                            });

                            const shuffledOptions = shuffle(optionsWithIndex);
                            updatedQ.options = shuffledOptions;

                            // Recalculate correctAnswer string (e.g. A, B, C...) based on new shuffled order
                            const correctIndices = shuffledOptions.reduce((acc: number[], opt: any, idx: number) => {
                                if (opt.isCorrect === true) acc.push(idx);
                                return acc;
                            }, []);
                            if (correctIndices.length > 0) {
                                updatedQ.correctAnswer = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
                            }
                        }

                        // 2. AR Questions: Ensure 4 options exist with correctness mapping if empty
                        if (q.type === 'AR' && (!Array.isArray(updatedQ.options) || updatedQ.options.length === 0)) {
                            const defaultAROptions = [
                                { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা", isCorrect: false },
                                { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়", isCorrect: false },
                                { text: "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা", isCorrect: false },
                                { text: "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক", isCorrect: false }
                            ];

                            let correctIdx = -1;
                            if ((q as any).correctOption) {
                                correctIdx = Number((q as any).correctOption) - 1;
                            }

                            updatedQ.options = defaultAROptions.map((opt: any, idx: number) => ({
                                ...opt,
                                originalIndex: idx,
                                isCorrect: correctIdx >= 0 ? idx === correctIdx : false
                            }));
                        }

                        // 3. MTF Column Shuffling
                        if (q.type === 'MTF' && Array.isArray(q.rightColumn)) {
                            const rightWithIndex = q.rightColumn.map((item: any, idx: number) => ({ ...item, originalIndex: idx }));
                            shuffle(rightWithIndex);
                            updatedQ.rightColumn = rightWithIndex;
                        }

                        return updatedQ;
                    });

                    setQuestions(processedQuestions);
                } else {
                    toast.error("Failed to load questions");
                    router.push("/student/prac-perfect");
                }
            } catch (e) {
                console.error(e);
                toast.error("Error loading session");
            } finally {
                setLoading(false);
            }
        };
        loadSession();

        const timer = setInterval(() => setElapsedTime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, [router]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                // If timer is enabled, student CANNOT go backward! Only forward navigation allowed.
                if (timerSetting === "off" && currentIndex > 0) setCurrentIndex(c => c - 1);
            } else if (e.key === 'Enter') {
                if (!isChecked && canCheckAnswer()) {
                    handleCheckAnswer();
                } else if (isChecked) {
                    handleNext();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isChecked, userAnswers, questions, timerSetting]);

    // Reset check state on question index change
    useEffect(() => {
        setIsChecked(false);
        setIsCorrect(false);

        if (timerSetting !== "off" && timerDurationSeconds > 0) {
            setQuestionTimerSeconds(timerDurationSeconds);
        }

        if (questionContainerRef.current) {
            questionContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentIndex, timerSetting, timerDurationSeconds]);

    // Student Per-Question Timer Countdown (Auto-starts, Non-pausable, Auto-advances)
    useEffect(() => {
        if (timerSetting === "off" || loading || showSummary) return;

        const interval = setInterval(() => {
            setQuestionTimerSeconds(prev => {
                if (prev <= 1) {
                    toast.error("Time's Up! Moving to next question...");
                    setTimeout(() => {
                        handleNext();
                    }, 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerSetting, loading, currentIndex, showSummary]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Helper: can check answer
    const canCheckAnswer = (): boolean => {
        const currentQ = questions[currentIndex];
        if (!currentQ) return false;

        const currentAns = userAnswers[currentIndex];
        if (['MCQ', 'SMCQ', 'AR'].includes(currentQ.type)) {
            return typeof currentAns === 'number';
        }
        if (currentQ.type === 'MC') {
            return Array.isArray(currentAns) && currentAns.length > 0;
        }
        if (currentQ.type === 'INT') {
            return typeof currentAns === 'string' && currentAns.trim().length > 0;
        }
        if (currentQ.type === 'MTF') {
            return typeof currentAns === 'object' && currentAns !== null && Object.keys(currentAns).length > 0;
        }
        return true; // CQ / SQ / DESCRIPTIVE always allowed
    };

    const handleCheckAnswer = async () => {
        const currentQ = questions[currentIndex];
        if (!currentQ) return;

        let isRight = false;
        const currentAns = userAnswers[currentIndex];

        if (['MCQ', 'SMCQ', 'AR'].includes(currentQ.type)) {
            isRight = !!(currentQ.options && currentQ.options[currentAns]?.isCorrect);
        } else if (currentQ.type === 'MC') {
            const selectedIndices: number[] = Array.isArray(currentAns) ? currentAns : [];
            const correctIndices = (currentQ.options || [])
                .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
                .filter((i: number) => i !== -1);

            isRight = selectedIndices.length === correctIndices.length &&
                selectedIndices.every(idx => correctIndices.includes(idx));
        } else if (currentQ.type === 'INT') {
            const userStr = String(currentAns || "").trim();
            const modelStr = String(currentQ.modelAnswer || "").trim();
            const userNum = parseFloat(userStr);
            const modelNum = parseFloat(modelStr);

            if (!isNaN(userNum) && !isNaN(modelNum)) {
                isRight = Math.abs(userNum - modelNum) < 0.01;
            } else {
                isRight = userStr.toLowerCase() === modelStr.toLowerCase();
            }
        } else if (currentQ.type === 'MTF') {
            const result = evaluateMTFQuestion(currentQ, { matches: currentAns || {} });
            isRight = result.isCorrect;
        } else {
            // CQ / SQ / DESCRIPTIVE
            isRight = true;
        }

        setIsCorrect(isRight);
        setIsChecked(true);

        const newResults = { ...sessionResults };
        if (isRight) {
            newResults[currentIndex] = 'correct';
            setScore(s => s + 1);
            const confetti = (await import("canvas-confetti")).default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4f46e5', '#818cf8', '#6366f1']
            });
            toast.success("Correct Answer! 🎉");
        } else {
            newResults[currentIndex] = 'wrong';
            setWrongCount(w => w + 1);
            toast.error("Incorrect. Let's review the explanation!");
        }
        setSessionResults(newResults);
    };

    const handleNext = () => {
        if (!isChecked && !sessionResults[currentIndex]) {
            setSessionResults(prev => ({ ...prev, [currentIndex]: 'unanswered' }));
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setShowSummary(true);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-background"><div className="animate-pulse">Loading Practice Session...</div></div>;
    if (!questions[currentIndex]) return null;

    const currentQ = questions[currentIndex];
    const isDark = boardBackground === 'black';
    const result = sessionResults[currentIndex];
    const currentAns = userAnswers[currentIndex];

    return (
        <MathJaxContext config={mathJaxConfig} version={3}>
            <div className={`h-screen w-full flex flex-col overflow-hidden relative font-fancy ${isDark ? 'bg-background' : 'bg-background'}`}>

                {/* 1. TOP BAR */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2 bg-card/90 backdrop-blur shadow-sm p-2 rounded-full border border-border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push('/student/prac-perfect')}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-bold px-2 text-foreground">
                            Q{currentIndex + 1} / {questions.length}
                        </span>
                    </div>

                    <div className="pointer-events-auto bg-card/90 backdrop-blur shadow-sm px-4 py-2 rounded-full border border-border flex items-center gap-4 text-sm font-medium tabular-nums text-foreground">
                        {timerSetting !== "off" ? (
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold shadow-inner transition-colors ${questionTimerSeconds <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(questionTimerSeconds)}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-card text-indigo-600 dark:text-indigo-300 font-bold border-indigo-200 dark:border-indigo-800">
                                    Auto Next
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                {formatTime(elapsedTime)}
                            </div>
                        )}
                        <div className="w-px h-4 bg-border"></div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {score}
                        </div>
                    </div>
                </div>

                {/* 2. MAIN SMARTBOARD CANVAS */}
                <div className={`absolute inset-0 z-0`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={boardBackground}
                    />
                </div>

                {/* 3. QUESTION CARD OVERLAY */}
                {showQuestion && (
                    <div
                        ref={questionContainerRef}
                        className="absolute top-20 left-4 md:left-10 w-[95vw] md:w-[600px] lg:w-[900px] xl:w-[1100px] 2xl:w-[1200px] max-h-[calc(100vh-160px)] z-40 overflow-y-auto custom-scrollbar transition-all duration-300 scroll-smooth"
                    >
                        <Card className={`prac-perfect-glass shadow-2xl border-0 ring-1 ring-border ${isDark ? 'bg-background/80 text-foreground' : 'bg-card/80 text-foreground'} transition-all duration-500`}>
                            <div className="p-6 space-y-6 font-exam-paper">
                                {/* Header / Tags */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className={`font-fancy font-bold px-3 py-1 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                            {currentQ.subject}
                                        </Badge>
                                        <Badge variant="secondary" className="font-fancy bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-3 py-1 font-bold">
                                            {currentQ.type}
                                        </Badge>
                                        {currentQ.topic && (
                                            <Badge variant="secondary" className="font-fancy bg-primary/10 text-primary border-primary/10 px-3 py-1 font-bold">
                                                {currentQ.topic}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity" onClick={() => setShowQuestion(false)}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Assertion-Reason Special Layout */}
                                {currentQ.type === 'AR' && (
                                    <div className="p-4 rounded-xl border-2 bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 space-y-3">
                                        <div>
                                            <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Assertion (A)</div>
                                            <div className="text-base font-medium">
                                                <UniversalMathJax dynamic>{currentQ.assertion || currentQ.questionText}</UniversalMathJax>
                                            </div>
                                        </div>
                                        {currentQ.reason && (
                                            <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40">
                                                <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Reason (R)</div>
                                                <div className="text-base font-medium">
                                                    <UniversalMathJax dynamic>{currentQ.reason}</UniversalMathJax>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Question Text (Stem) */}
                                {currentQ.type !== 'AR' && (
                                    <div className={`text-question font-fancy font-medium leading-relaxed tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                        <UniversalMathJax dynamic>{currentQ.questionText}</UniversalMathJax>
                                    </div>
                                )}

                                {/* Diagram Images */}
                                {Array.isArray(currentQ.images) && currentQ.images.length > 0 && (
                                    <div className="space-y-4 mt-2">
                                        {currentQ.images.map((img: string, i: number) => (
                                            <img key={i} src={img} alt="Question Diagram" className="rounded-xl border border-slate-200/50 max-w-full h-auto shadow-md mx-auto" />
                                        ))}
                                    </div>
                                )}

                                {/* CQ / SQ Sub Questions */}
                                {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) && Array.isArray(currentQ.subQuestions) && currentQ.subQuestions.length > 0 && (
                                    <div className="space-y-6 mt-4">
                                        {currentQ.subQuestions.map((sub: any, idx: number) => (
                                            <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${isDark ? 'bg-muted/40 border-border' : 'bg-muted/30 border-border'}`}>
                                                <div className="flex gap-3 items-start">
                                                    <span className="font-bold text-indigo-600 flex-shrink-0">({String.fromCharCode(97 + idx)})</span>
                                                    <div className="flex-1 text-sm font-medium leading-relaxed">
                                                        <UniversalMathJax inline dynamic>{sub.question || sub.text}</UniversalMathJax>
                                                    </div>
                                                </div>

                                                {isChecked && (sub.answer || sub.modelAnswer) && (
                                                    <div className="mt-3 pt-3 border-t border-indigo-500/10 animate-in fade-in slide-in-from-top-1">
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">Model Answer</div>
                                                        <div className="text-sm font-fancy text-emerald-600 dark:text-emerald-400 italic">
                                                            <UniversalMathJax dynamic>{sub.answer || sub.modelAnswer}</UniversalMathJax>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* CONTROLS BY QUESTION TYPE */}

                                {/* Type 1: Single Choice Options (MCQ, SMCQ, AR) */}
                                {['MCQ', 'SMCQ', 'AR'].includes(currentQ.type) && Array.isArray(currentQ.options) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                                        {currentQ.options.map((opt: any, idx: number) => {
                                            const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
                                            const isThisCorrect = opt.isCorrect;
                                            const selectedOption = currentAns;

                                            let stateClass = "";
                                            if (isChecked) {
                                                if (idx === selectedOption && isThisCorrect) {
                                                    stateClass = "bg-green-600 border-green-600 text-white ring-4 ring-green-500/30 shadow-lg scale-[1.02]";
                                                } else if (idx === selectedOption && !isThisCorrect) {
                                                    stateClass = "bg-red-600 border-red-600 text-white ring-4 ring-red-500/30 shadow-lg scale-[1.02]";
                                                } else if (isThisCorrect) {
                                                    stateClass = "bg-green-500/20 border-green-500 text-green-900 dark:text-green-300 ring-2 ring-green-500/10 shadow-md";
                                                } else {
                                                    stateClass = "opacity-40 grayscale-[0.3]";
                                                }
                                            } else if (result === 'unanswered') {
                                                if (isThisCorrect) stateClass = "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/10 shadow-md";
                                                else stateClass = "opacity-50";
                                            } else {
                                                if (idx === selectedOption) stateClass = "bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-lg -translate-y-0.5";
                                                else stateClass = "hover:bg-muted/50 border-border text-foreground";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (!isChecked) setUserAnswers({ ...userAnswers, [currentIndex]: idx });
                                                    }}
                                                    disabled={isChecked}
                                                    className={`premium-option w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 shadow-sm ${stateClass}`}
                                                >
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-black transition-colors 
                                                        ${isChecked && (idx === selectedOption || isThisCorrect) ? 'bg-card text-foreground border-border' :
                                                            idx === selectedOption ? 'bg-primary border-primary text-primary-foreground' :
                                                                'bg-muted/50 dark:bg-muted border-border'}`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <div className="text-option font-fancy font-medium pt-1">
                                                        <UniversalMathJax inline dynamic>{optText}</UniversalMathJax>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Type 2: Multiple Choice Options (MC) */}
                                {currentQ.type === 'MC' && Array.isArray(currentQ.options) && (
                                    <div className="space-y-3 mt-6">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                            Select all correct options:
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {currentQ.options.map((opt: any, idx: number) => {
                                                const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
                                                const selectedIndices: number[] = Array.isArray(currentAns) ? currentAns : [];
                                                const isSelected = selectedIndices.includes(idx);
                                                const isThisCorrect = opt.isCorrect;

                                                let stateClass = "";
                                                if (isChecked) {
                                                    if (isSelected && isThisCorrect) {
                                                        stateClass = "bg-green-600 border-green-600 text-white ring-4 ring-green-500/30 shadow-lg";
                                                    } else if (isSelected && !isThisCorrect) {
                                                        stateClass = "bg-red-600 border-red-600 text-white ring-4 ring-red-500/30 shadow-lg";
                                                    } else if (isThisCorrect) {
                                                        stateClass = "bg-green-500/20 border-green-500 text-green-900 dark:text-green-300 ring-2 ring-green-500/10";
                                                    } else {
                                                        stateClass = "opacity-40 grayscale-[0.3]";
                                                    }
                                                } else {
                                                    if (isSelected) stateClass = "bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-lg";
                                                    else stateClass = "hover:bg-muted/50 border-border text-foreground";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (isChecked) return;
                                                            const newSet = new Set(selectedIndices);
                                                            if (newSet.has(idx)) newSet.delete(idx);
                                                            else newSet.add(idx);
                                                            setUserAnswers({ ...userAnswers, [currentIndex]: Array.from(newSet) });
                                                        }}
                                                        disabled={isChecked}
                                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 shadow-sm ${stateClass}`}
                                                    >
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-black transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/50 border-border'}`}>
                                                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                                                        </div>
                                                        <div className="text-option font-fancy font-medium pt-1">
                                                            <UniversalMathJax inline dynamic>{optText}</UniversalMathJax>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Type 3: Numerical Input (INT) */}
                                {currentQ.type === 'INT' && (
                                    <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4 mt-6">
                                        <label className="block text-sm font-bold text-foreground">
                                            Enter your numerical answer:
                                        </label>
                                        <div className="flex gap-4 items-center">
                                            <Input
                                                type="text"
                                                value={currentAns || ""}
                                                onChange={(e) => !isChecked && setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value })}
                                                placeholder="e.g. 42 or 3.14"
                                                disabled={isChecked}
                                                className="text-lg font-bold h-12 max-w-md bg-card border-border"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Type 4: Match The Following (MTF) */}
                                {currentQ.type === 'MTF' && Array.isArray(currentQ.leftColumn) && Array.isArray(currentQ.rightColumn) && (
                                    <div className="space-y-4 mt-6">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                            Match each item in Column A with Column B:
                                        </div>
                                        <div className="space-y-3">
                                            {currentQ.leftColumn.map((leftItem: any, idx: number) => {
                                                const matchesMap: Record<string, string> = currentAns || {};
                                                const selectedRightId = matchesMap[leftItem.id] || "";
                                                const correctRightId = currentQ.matches?.[leftItem.id];
                                                const isMatchCorrect = selectedRightId && correctRightId && selectedRightId === correctRightId;

                                                return (
                                                    <div key={leftItem.id} className={`p-4 rounded-xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isChecked ? (isMatchCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500') : 'bg-card border-border'}`}>
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="font-medium text-sm">
                                                                <UniversalMathJax inline dynamic>{leftItem.text}</UniversalMathJax>
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-64">
                                                            <Select
                                                                value={selectedRightId}
                                                                onValueChange={(val) => {
                                                                    if (!isChecked) {
                                                                        setUserAnswers({
                                                                            ...userAnswers,
                                                                            [currentIndex]: { ...matchesMap, [leftItem.id]: val }
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={isChecked}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select Match..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {currentQ.rightColumn.map((rightItem: any, rIdx: number) => (
                                                                        <SelectItem key={rightItem.id} value={rightItem.id}>
                                                                            {String.fromCharCode(65 + rIdx)}. {rightItem.text}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Type 5: Creative / Short / Descriptive Notes Space */}
                                {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) && (
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 mt-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Your Working / Notes (Optional):
                                        </label>
                                        <textarea
                                            value={currentAns || ""}
                                            onChange={(e) => !isChecked && setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value })}
                                            placeholder="Write your answer or steps here to practice..."
                                            disabled={isChecked}
                                            rows={4}
                                            className="w-full p-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary font-fancy"
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 flex gap-3">
                                    {!isChecked ? (
                                        <Button
                                            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all font-fancy"
                                            disabled={!canCheckAnswer()}
                                            onClick={handleCheckAnswer}
                                        >
                                            {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? 'Show Model Answer & Explanation' : 'Check Answer'}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full h-12 text-base font-bold rounded-xl shadow-md transition-all font-fancy"
                                            variant={currentIndex === questions.length - 1 ? "default" : "outline"}
                                            onClick={handleNext}
                                        >
                                            {currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"} <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    )}
                                </div>

                                {/* EXPLANATION REVEAL SECTION */}
                                {(isChecked || result === 'unanswered') && (() => {
                                    const explanationText = currentQ.explanation
                                        || currentQ.options?.find((o: any) => o.isCorrect)?.explanation
                                        || (['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? currentQ.modelAnswer : undefined);

                                    return (
                                        <div className={`p-5 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 shadow-xl 
                                            ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-300' :
                                                ['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-300' :
                                                    result === 'unanswered' ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300' :
                                                        'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-300'}`}>

                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center 
                                                        ${isCorrect ? 'bg-green-100 text-green-600' :
                                                            ['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? 'bg-indigo-100 text-indigo-600' :
                                                                result === 'unanswered' ? 'bg-amber-100 text-amber-600' :
                                                                    'bg-red-100 text-red-600'}`}>
                                                        {isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                            ['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? <Sparkles className="w-5 h-5" /> :
                                                                result === 'unanswered' ? <AlertCircle className="w-5 h-5" /> :
                                                                    <XCircle className="w-5 h-5" />}
                                                    </div>
                                                    <span className="font-fancy font-black text-base">
                                                        {isCorrect ? 'Excellent! Correct Answer.' :
                                                            ['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) ? 'Model Answer Revealed' :
                                                                result === 'unanswered' ? 'Question Skipped' :
                                                                    'Not quite right...'}
                                                    </span>
                                                </div>

                                            </div>

                                            {/* CORRECT ANSWER BOX FOR ALL QUESTION TYPES */}
                                            <div className="mb-3 p-3.5 rounded-xl bg-background/80 border border-primary/20 shadow-sm font-fancy">
                                                <div className="text-xs font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Correct Answer:
                                                </div>

                                                {/* MCQ / SMCQ / AR */}
                                                {['MCQ', 'SMCQ', 'AR'].includes(currentQ.type) && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className="bg-emerald-600 text-white font-black px-3.5 py-1 text-sm shadow">
                                                            Option {(() => {
                                                                const correctIdx = currentQ.options?.findIndex((o: any) => o.isCorrect) ?? -1;
                                                                return correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "?";
                                                            })()}
                                                        </Badge>
                                                        {(() => {
                                                            const correctOpt = currentQ.options?.find((o: any) => o.isCorrect);
                                                            return correctOpt?.text ? (
                                                                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                                                    <UniversalMathJax inline dynamic>{cleanupMath(correctOpt.text)}</UniversalMathJax>
                                                                </span>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                )}

                                                {/* MC (Multiple Choice Checkboxes) */}
                                                {currentQ.type === 'MC' && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className="bg-emerald-600 text-white font-black px-3 py-1 text-sm shadow">
                                                            Options: {(() => {
                                                                const correctIndices = currentQ.options
                                                                    ?.map((o: any, idx: number) => o.isCorrect ? String.fromCharCode(65 + idx) : null)
                                                                    .filter(Boolean) ?? [];
                                                                return correctIndices.length > 0 ? correctIndices.join(', ') : "All Selected";
                                                            })()}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* INT (Numerical Answer) */}
                                                {currentQ.type === 'INT' && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-600 text-white font-black px-3.5 py-1 text-sm shadow">
                                                            Numerical Answer: {String((currentQ as any).integerAnswer ?? currentQ.correctAnswer ?? currentQ.modelAnswer ?? (currentQ as any).correct ?? (currentQ as any).answer ?? (currentQ as any).solution ?? "See explanation")}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* MTF (Matching Column Pairs) */}
                                                {currentQ.type === 'MTF' && currentQ.leftColumn && (
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {currentQ.leftColumn.map((leftItem: any, i: number) => {
                                                            let rightLabel = '?';
                                                            let rightText = '';

                                                            if (currentQ.matches && currentQ.matches[leftItem.id]) {
                                                                const rId = currentQ.matches[leftItem.id];
                                                                const rIdx = currentQ.rightColumn?.findIndex((r: any) => r.id === rId);
                                                                if (rIdx !== undefined && rIdx !== -1) {
                                                                    rightLabel = String.fromCharCode(65 + rIdx);
                                                                    rightText = currentQ.rightColumn[rIdx]?.text || '';
                                                                }
                                                            } else if (leftItem.originalIndex !== undefined && currentQ.rightColumn) {
                                                                const rIdx = currentQ.rightColumn.findIndex((r: any) => r.originalIndex === leftItem.originalIndex);
                                                                if (rIdx !== -1) {
                                                                    rightLabel = String.fromCharCode(65 + rIdx);
                                                                    rightText = currentQ.rightColumn[rIdx]?.text || '';
                                                                }
                                                            } else if (currentQ.rightColumn && currentQ.rightColumn[i]) {
                                                                rightLabel = String.fromCharCode(65 + i);
                                                                rightText = currentQ.rightColumn[i]?.text || '';
                                                            }

                                                            return (
                                                                <Badge key={leftItem.id || i} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold py-1 px-2.5">
                                                                    ({i + 1}) → ({rightLabel}){rightText ? `: ${rightText}` : ''}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* CQ / SQ / DESCRIPTIVE Model Answer */}
                                                {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) && currentQ.modelAnswer && (
                                                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                                        <UniversalMathJax dynamic>{cleanupMath(currentQ.modelAnswer)}</UniversalMathJax>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Explanation Text */}
                                            {explanationText ? (
                                                <div className="mt-3 pt-4 border-t border-current/10 font-fancy">
                                                    <div className="font-fancy font-black mb-2 text-xs opacity-70 uppercase tracking-[0.1em]">Explanation Details</div>
                                                    <div className="leading-relaxed opacity-90 italic">
                                                        <UniversalMathJax dynamic>
                                                            {cleanupMath(renderDynamicExplanation(
                                                                explanationText,
                                                                currentQ.options,
                                                                currentQ.type,
                                                                currentQ.rightColumn
                                                            ))}
                                                        </UniversalMathJax>
                                                    </div>
                                                </div>
                                            ) : (
                                                !isCorrect && ['MCQ', 'MC', 'AR', 'SMCQ'].includes(currentQ.type) && (
                                                    <p className="opacity-80 italic mt-2">Review the core concepts and try again!</p>
                                                )
                                            )}

                                            {/* Model Answer for CQ/SQ if separate */}
                                            {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) && currentQ.modelAnswer && explanationText !== currentQ.modelAnswer && (
                                                <div className="mt-3 pt-4 border-t border-current/10">
                                                    <div className="font-fancy font-black mb-2 text-xs opacity-70 uppercase tracking-[0.1em]">Full Model Answer</div>
                                                    <div className="leading-relaxed opacity-90 italic">
                                                        <UniversalMathJax dynamic>{currentQ.modelAnswer}</UniversalMathJax>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </Card>
                    </div>
                )}

                {/* 4. SUMMARY MODAL */}
                {showSummary && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md p-6 font-fancy">
                        <Card className="w-full max-w-md bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-4">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-black">Practice Session Complete!</h2>
                                <p className="opacity-80 mt-2 font-medium">You've finished all questions in this set.</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                                        <div className="text-green-600 dark:text-green-400 font-black text-3xl mb-1">
                                            {Object.values(sessionResults).filter(v => v === 'correct').length}
                                        </div>
                                        <div className="text-xs font-bold text-green-700 dark:text-green-500 uppercase tracking-widest">Correct</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                        <div className="text-red-600 dark:text-red-400 font-black text-3xl mb-1">
                                            {Object.values(sessionResults).filter(v => v === 'wrong').length}
                                        </div>
                                        <div className="text-xs font-bold text-red-700 dark:text-red-500 uppercase tracking-widest">Wrong</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted border border-border text-center">
                                        <div className="text-muted-foreground font-black text-3xl mb-1">
                                            {questions.length - Object.values(sessionResults).length}
                                        </div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Not Answered</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                                        <div className="text-primary font-black text-3xl mb-1">{questions.length}</div>
                                        <div className="text-xs font-bold text-primary uppercase tracking-widest">Total Q</div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => router.push('/student/prac-perfect')}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                                    >
                                        Back to Practice Hub <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Show Question Button if hidden */}
                {!showQuestion && !showSummary && (
                    <div className="absolute top-20 left-4 z-40">
                        <Button onClick={() => setShowQuestion(true)} className="shadow-lg rounded-full px-4" size="sm">
                            <Eye className="w-4 h-4 mr-2" /> Show Question
                        </Button>
                    </div>
                )}

                {/* 5. TOOLBAR */}
                <SmartBoardToolbar
                    boardRef={boardRef}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    onPrev={() => timerSetting === "off" && currentIndex > 0 && setCurrentIndex(c => c - 1)}
                    onNext={handleNext}
                    bgMode={boardBackground}
                    onNavigateBg={() => {
                        if (boardBackground === 'white') setBoardBackground('grid');
                        else if (boardBackground === 'grid') setBoardBackground('black');
                        else setBoardBackground('white');
                    }}
                />
            </div>
        </MathJaxContext>
    );
}
