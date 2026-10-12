"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    LogOut, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Clock, CheckCircle, XCircle, Star, Play, Pause, RotateCcw,
    CheckSquare, Square, Eye, EyeOff, Layout, Columns2, PanelsTopLeft,
    Sparkles, User, GraduationCap, ArrowRight, ShieldCheck, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MathJaxContext } from "better-react-mathjax";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cleanupMath, renderDynamicExplanation } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic Imports
import { SmartBoardRef, exportPathsToImage, Stroke } from "@/app/components/SmartBoard";
const SmartBoard = dynamic(() => import("@/app/components/SmartBoard"), { ssr: false });
const SmartBoardToolbar = dynamic(
    () => import("@/app/components/SmartBoardToolbar").then(mod => mod.SmartBoardToolbar),
    { ssr: false }
);
import { UniversalMathJax } from "@/app/components/UniversalMathJax";

// Types
interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ' | 'DESCRIPTIVE' | 'SMCQ';
    subject: string;
    topic?: string;
    difficulty: string;
    marks: number;
    options?: { text: string; isCorrect: boolean; explanation?: string; originalIndex?: number }[];
    modelAnswer?: string;
    explanation?: string;
    images?: string[];
    subQuestions?: any[];
    assertion?: string;
    reason?: string;
    leftColumn?: { id: string; text: string; originalIndex?: number }[];
    rightColumn?: { id: string; text: string; originalIndex?: number }[];
    matches?: Record<string, string>;
    status?: 'correct' | 'wrong' | 'unanswered';
    userAnswer?: any;
    studentAnswer?: any;
}

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml", "[tex]/mhchem"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        packages: { '[+]': ['mhchem'] }
    },
};

export default function ProblemSolvingSession() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);

    // Session State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examName, setExamName] = useState<string>("");
    const [studentName, setStudentName] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Studio Layout Mode:
    // 'split' = Side-by-side (Question Panel on Left, Whiteboard on Right with 100% unobstructed pen writing)
    // 'full' = Question hidden, 100% canvas
    // 'annotation' = Live pen annotation directly over question overlay
    const [layoutMode, setLayoutMode] = useState<'split' | 'full' | 'annotation'>('split');
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

    // Board Settings
    const [boardBackground, setBoardBackground] = useState<'white' | 'black' | 'grid'>('white');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hiddenPDFContainerRef = useRef<HTMLDivElement>(null);

    // Whiteboard Persistence Per Question
    const [boardHistories, setBoardHistories] = useState<Record<string, Stroke[]>>({});

    // Question Interaction State
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // Teacher Per-Question Timer State
    const [timerSetting, setTimerSetting] = useState<string>("off");
    const [timerDurationSeconds, setTimerDurationSeconds] = useState<number>(0);
    const [questionTimerSeconds, setQuestionTimerSeconds] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Shuffle helper
    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // Timer Countdown Effect
    useEffect(() => {
        if (timerSetting === "off" || !isTimerRunning) return;
        const interval = setInterval(() => {
            setQuestionTimerSeconds(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    setIsTimerExpired(true);
                    toast.error("Time's Up for this question!");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSetting]);

    // Reset question timer state on index or setting change
    useEffect(() => {
        if (timerSetting !== "off" && timerDurationSeconds > 0) {
            setQuestionTimerSeconds(timerDurationSeconds);
            setIsTimerRunning(false);
            setIsTimerExpired(false);
        }
    }, [currentIndex, timerSetting, timerDurationSeconds]);

    // Process question formatting
    const processQuestionItem = useCallback((q: Question, isReview = false): Question => {
        const updatedQ: Question = { ...q };

        // 1. Resolve correctness and map options for MCQ, MC, SMCQ, AR BEFORE shuffling
        if ((q.type === 'MCQ' || q.type === 'MC' || q.type === 'SMCQ' || q.type === 'AR') && Array.isArray(q.options) && q.options.length > 0) {
            let dbCorrectIdx = -1;
            const foundIdx = q.options.findIndex((o: any) => o.isCorrect === true || String(o.isCorrect) === 'true');
            if (foundIdx !== -1) {
                dbCorrectIdx = foundIdx;
            } else if ((q as any).correctOption !== undefined && (q as any).correctOption !== null) {
                const num = Number((q as any).correctOption);
                dbCorrectIdx = num > 0 && num <= q.options.length ? num - 1 : num;
            } else if ((q as any).correctAnswer || q.modelAnswer) {
                const str = ((q as any).correctAnswer || q.modelAnswer || "").trim().toUpperCase();
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
                const isOptCorrect = foundIdx !== -1
                    ? idx === foundIdx
                    : (dbCorrectIdx >= 0 ? idx === dbCorrectIdx : (optObj.isCorrect === true || String(optObj.isCorrect) === 'true'));
                return {
                    ...optObj,
                    originalIndex: idx,
                    isCorrect: isOptCorrect
                };
            });

            const finalOptions = isReview ? optionsWithIndex : shuffleArray(optionsWithIndex);
            updatedQ.options = finalOptions;

            const correctIndices = finalOptions.reduce((acc: number[], opt: any, idx: number) => {
                if (opt.isCorrect === true) acc.push(idx);
                return acc;
            }, []);
            if (correctIndices.length > 0) {
                (updatedQ as any).correctAnswer = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
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
        if (q.type === 'MTF' && Array.isArray(q.rightColumn) && q.rightColumn.length > 0) {
            const rightWithIndex = q.rightColumn.map((item, idx) => ({ ...item, originalIndex: idx }));
            updatedQ.rightColumn = isReview ? rightWithIndex : shuffleArray(rightWithIndex);
        }

        return updatedQ;
    }, []);

    // Initialize Session (With Robust Cloud Fallback for Direct URLs)
    useEffect(() => {
        const initSession = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(window.location.search);
                const isReview = params.get('mode') === 'review';
                const examId = params.get('id');
                const studentId = params.get('studentId');

                // Read Timer Preferences
                const savedTimerSecsStr = localStorage.getItem("problem-solving-timer-seconds");
                const savedTimerStr = localStorage.getItem("problem-solving-timer") || "off";
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

                let sessionQuestions: Question[] = [];

                // 1. Check LocalStorage Cache
                const storedCache = localStorage.getItem(isReview ? "review-session-data" : "problem-solving-session");
                if (storedCache) {
                    try {
                        const parsed = JSON.parse(storedCache);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            if (typeof parsed[0] === 'string') {
                                // Question ID array -> Fetch question bodies
                                const res = await fetch('/api/questions');
                                const allQ = await res.json();
                                sessionQuestions = (allQ.questions || []).filter((q: Question) => parsed.includes(q.id));
                                sessionQuestions = sessionQuestions.map(q => processQuestionItem(q, isReview));
                            } else {
                                sessionQuestions = (parsed as Question[]).map(q => processQuestionItem(q, isReview));
                            }
                        } else if (parsed.questions && Array.isArray(parsed.questions)) {
                            sessionQuestions = parsed.questions.map((q: any) => processQuestionItem(q, isReview));
                            if (parsed.examName) setExamName(parsed.examName);
                        }
                    } catch {
                        // Ignore parse error and proceed to cloud fetch
                    }
                }

                // 2. Cloud Fetch if Cache is empty AND examId is provided (e.g. direct link)
                if (sessionQuestions.length === 0 && examId) {
                    try {
                        const evalUrl = `/api/exams/evaluations/${examId}${studentId ? `?studentId=${studentId}` : ''}`;
                        const evalRes = await fetch(evalUrl);

                        if (evalRes.ok) {
                            const evalData = await evalRes.json();
                            const sub = studentId
                                ? evalData.submissions?.find((s: any) => s.studentId === studentId) || evalData.submissions?.[0]
                                : evalData.submissions?.[0];

                            const answers = sub?.answers || {};
                            if (evalData.exam?.name) setExamName(evalData.exam.name);
                            if (sub?.student?.name) setStudentName(sub.student.name);

                            if (evalData.questions && Array.isArray(evalData.questions)) {
                                sessionQuestions = evalData.questions.map((q: any) => {
                                    const qText = q.text || q.questionText || "Question text missing";
                                    const userAnsText = answers[q.id];
                                    let userAnsIndex: number | null = null;

                                    if (userAnsText !== undefined && userAnsText !== null && q.options) {
                                        const norm = (s: any) => String(s).trim().toLowerCase();
                                        userAnsIndex = q.options.findIndex((opt: any) => norm(opt.text) === norm(userAnsText));
                                        if (userAnsIndex === -1 && !isNaN(Number(userAnsText))) {
                                            const n = Number(userAnsText);
                                            if (n >= 0 && n < q.options.length) userAnsIndex = n;
                                        }
                                    }

                                    let status: 'correct' | 'wrong' | 'unanswered' = 'unanswered';
                                    if (userAnsIndex !== null && userAnsIndex >= 0) {
                                        const sel = q.options?.[userAnsIndex];
                                        status = sel?.isCorrect ? 'correct' : 'wrong';
                                    }

                                    const mappedQ: Question = {
                                        ...q,
                                        questionText: qText,
                                        userAnswer: userAnsIndex !== null ? userAnsIndex : userAnsText,
                                        studentAnswer: userAnsText,
                                        status
                                    };
                                    return processQuestionItem(mappedQ, true);
                                });
                            }
                        } else {
                            // Fallback to basic exam API
                            const examRes = await fetch(`/api/exams/${examId}`);
                            if (examRes.ok) {
                                const examData = await examRes.json();
                                if (examData.name) setExamName(examData.name);
                                if (examData.questions) {
                                    sessionQuestions = examData.questions.map((q: any) => processQuestionItem(q, isReview));
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("Direct cloud exam fetch warning:", e);
                    }
                }

                // 3. Fallback to general questions repository
                if (sessionQuestions.length === 0) {
                    const res = await fetch('/api/questions');
                    const allData = await res.json();
                    sessionQuestions = allData.questions || [];
                    if (!isReview) sessionQuestions = shuffleArray(sessionQuestions);
                    sessionQuestions = sessionQuestions.map((q: any) => processQuestionItem(q, isReview));
                }

                if (sessionQuestions.length === 0) {
                    toast.error("No questions found for this session");
                    router.push("/problem-solving");
                    return;
                }

                setQuestions(sessionQuestions);
            } catch (err) {
                console.error("Session initialization failed:", err);
                toast.error("Failed to load problem-solving session");
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [processQuestionItem, router]);

    // Save current question board state
    const saveCurrentBoardState = useCallback(() => {
        if (boardRef.current && questions[currentIndex]) {
            const currentPaths = boardRef.current.getPaths();
            setBoardHistories(prev => ({
                ...prev,
                [questions[currentIndex].id]: currentPaths
            }));
        }
    }, [currentIndex, questions]);

    // Restore board state for question
    const restoreBoardState = useCallback((targetIndex: number) => {
        if (boardRef.current && questions[targetIndex]) {
            const saved = boardHistories[questions[targetIndex].id] || [];
            boardRef.current.loadPaths(saved);
        }
    }, [boardHistories, questions]);

    // Sync Question State (Answer check & Selection)
    useEffect(() => {
        const q = questions[currentIndex];
        if (!q) return;

        if (q.status) {
            setSelectedOption(typeof q.userAnswer === 'number' ? q.userAnswer : null);
            setIsAnswerChecked(q.status === 'correct');
        } else {
            setSelectedOption(null);
            setIsAnswerChecked(false);
        }
    }, [currentIndex, questions]);

    const handleNext = () => {
        saveCurrentBoardState();
        if (currentIndex < questions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setTimeout(() => restoreBoardState(nextIdx), 20);
        }
    };

    const handlePrev = () => {
        saveCurrentBoardState();
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            setTimeout(() => restoreBoardState(prevIdx), 20);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    const handleToggleBackground = () => {
        const next = boardBackground === 'white' ? 'grid' : boardBackground === 'grid' ? 'black' : 'white';
        setBoardBackground(next);
    };

    const handleExportPDF = async () => {
        const input = document.getElementById('session-workspace');
        if (!input) return;

        const toastId = toast.loading("Generating High-Resolution PDF...");
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                ignoreElements: (el) => el.classList.contains('no-print')
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`ProblemSolving_Session_${Date.now()}.pdf`);
            toast.dismiss(toastId);
            toast.success("PDF Downloaded Successfully!");
        } catch (e) {
            console.error("PDF generation error:", e);
            toast.dismiss(toastId);
            toast.error("Failed to generate PDF");
        }
    };

    const isDark = boardBackground === 'black';
    const currentQ = questions[currentIndex];

    if (loading || !currentQ) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-gray-500 font-bold tracking-wide">Preparing World-Class Studio...</p>
            </div>
        );
    }

    return (
        <MathJaxContext config={mathJaxConfig} version={3}>
            <div
                id="session-workspace"
                className={`h-screen w-full flex flex-col overflow-hidden relative font-sans select-none ${
                    isDark ? 'bg-slate-950 text-slate-100' : 'bg-background text-foreground'
                }`}
            >
                {/* 1. TOP HEADER STUDIO BAR */}
                <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between z-40 border-b border-border/60 bg-card/90 backdrop-blur-xl shrink-0 no-print">
                    {/* Left: Exit & Question Index */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push('/problem-solving')}
                            className="rounded-full pl-3 pr-4 h-9 font-bold bg-muted hover:bg-muted/80 text-foreground border border-border shadow-sm"
                        >
                            <LogOut className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span>Exit</span>
                        </Button>

                        <div className="bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full flex items-center gap-1.5">
                            <span className="text-xs font-black text-primary">
                                Q {currentIndex + 1}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                                / {questions.length}
                            </span>
                        </div>

                        {/* Toggle Question Panel Button (In Split Mode) */}
                        {layoutMode === 'split' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                                className="h-9 px-3 rounded-full text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                title={isPanelCollapsed ? "Show Question Panel" : "Hide Question for Fullscreen Board"}
                            >
                                <Columns2 className="w-4 h-4 mr-1.5 text-indigo-600" />
                                <span className="hidden sm:inline">
                                    {isPanelCollapsed ? "Show Question" : "Hide Question"}
                                </span>
                            </Button>
                        )}
                    </div>

                    {/* Center: Exam & Student Info + Live Timer */}
                    <div className="hidden md:flex items-center gap-4 bg-muted/60 px-4 py-1.5 rounded-full border border-border shadow-sm">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-bold truncate max-w-[220px]">
                                {examName || "Problem Solving Studio"}
                            </span>
                            {studentName && (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 font-bold ml-1">
                                    {studentName}
                                </Badge>
                            )}
                        </div>

                        <div className="w-px h-4 bg-border"></div>

                        {/* Question Timer */}
                        {timerSetting !== "off" ? (
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full font-mono text-xs font-black ${
                                    isTimerExpired
                                        ? 'bg-rose-500 text-white animate-pulse'
                                        : isTimerRunning
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{isTimerExpired ? "Time's Up!" : formatTime(questionTimerSeconds)}</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className="h-7 text-xs px-2 rounded-full font-bold hover:bg-muted"
                                >
                                    {isTimerRunning ? (
                                        <Pause className="w-3.5 h-3.5 text-indigo-600" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <LiveClock />
                            </div>
                        )}
                    </div>

                    {/* Right: Studio Layout Switcher & Fullscreen */}
                    <div className="flex items-center gap-2">
                        {/* Layout Selector */}
                        <div className="flex items-center bg-muted/60 p-0.5 rounded-full border border-border">
                            <Button
                                variant={layoutMode === 'split' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setLayoutMode('split');
                                    setIsPanelCollapsed(false);
                                }}
                                className={`h-8 px-2.5 rounded-full text-xs font-bold transition-all ${
                                    layoutMode === 'split'
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Studio Split Mode (Unobstructed side-by-side whiteboard)"
                            >
                                <Columns2 className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Split</span>
                            </Button>

                            <Button
                                variant={layoutMode === 'annotation' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setLayoutMode('annotation')}
                                className={`h-8 px-2.5 rounded-full text-xs font-bold transition-all ${
                                    layoutMode === 'annotation'
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Annotation Mode (Direct pen drawing over the question)"
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Annotate</span>
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="rounded-full w-9 h-9 hover:bg-muted"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </header>

                {/* 2. MAIN WORKSPACE CONTAINER */}
                <main className="flex-1 flex overflow-hidden relative">

                    {/* A. STUDIO SPLIT MODE: Dedicated Left Question Studio */}
                    {layoutMode === 'split' && (
                        <aside
                            className={`border-r border-border transition-all duration-300 ease-in-out flex flex-col z-20 shrink-0 ${
                                isDark ? 'bg-slate-900/90' : 'bg-card/95'
                            } ${
                                isPanelCollapsed
                                    ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
                                    : 'w-full md:w-[440px] lg:w-[480px] xl:w-[520px]'
                            }`}
                        >
                            {/* Question Panel Inner Container */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar font-exam-paper">
                                {/* Header Badges */}
                                <div className="flex items-center justify-between pb-3 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                            {currentQ.subject}
                                        </span>
                                        {currentQ.topic && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                • {currentQ.topic}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {currentQ.status === 'correct' && (
                                            <Badge className="bg-emerald-600 text-white font-bold text-xs shadow-sm">
                                                Correct
                                            </Badge>
                                        )}
                                        {currentQ.status === 'wrong' && (
                                            <Badge variant="destructive" className="font-bold text-xs shadow-sm">
                                                Wrong
                                            </Badge>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={`text-xs font-bold ${
                                                currentQ.difficulty === 'HARD'
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-200'
                                                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                            }`}
                                        >
                                            {currentQ.difficulty} • {currentQ.marks}M
                                        </Badge>
                                    </div>
                                </div>

                                {/* Question Content Render */}
                                {renderQuestionContent()}
                            </div>
                        </aside>
                    )}

                    {/* B. ANNOTATION MODE: Floating Question Backdrop Overlay */}
                    {layoutMode === 'annotation' && (
                        <div className="absolute top-4 left-4 z-10 w-full sm:w-[480px] max-h-[calc(100vh-140px)] pointer-events-auto flex flex-col">
                            <Card className={`overflow-hidden flex flex-col rounded-2xl shadow-2xl backdrop-blur-xl border-2 ${
                                isDark ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-card/95 border-indigo-200/80 shadow-indigo-950/10'
                            }`}>
                                <div className="p-4 overflow-y-auto max-h-[calc(100vh-160px)] space-y-4 custom-scrollbar">
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <Badge className="bg-indigo-600 text-white font-bold text-xs">
                                            {currentQ.subject} {currentQ.topic ? `• ${currentQ.topic}` : ''}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-bold">
                                            {currentQ.type} • {currentQ.marks} Marks
                                        </Badge>
                                    </div>
                                    {renderQuestionContent()}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* C. THE INFINITE WHITEBOARD CANVAS */}
                    {/* In Split mode: flex-1 ensures 100% of the canvas has ZERO overlapping elements, so pen writes in every single pixel */}
                    {/* In Annotation mode: absolute inset-0 with z-30 transparent overlay allows drawing on top of questions */}
                    <div
                        className={`transition-all duration-300 ${
                            layoutMode === 'annotation'
                                ? 'absolute inset-0 z-30 pointer-events-auto'
                                : 'flex-1 h-full relative z-10 overflow-hidden'
                        }`}
                    >
                        <SmartBoard
                            ref={boardRef}
                            className="w-full h-full"
                            backgroundColor={layoutMode === 'annotation' ? 'transparent' : boardBackground}
                        />
                    </div>
                </main>

                {/* 3. TEACHER SMARTBOARD TOOLBAR */}
                <SmartBoardToolbar
                    boardRef={boardRef}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onExport={handleExportPDF}
                    bgMode={boardBackground}
                    onNavigateBg={handleToggleBackground}
                    isAnnotationMode={layoutMode === 'annotation'}
                    onToggleAnnotation={() => {
                        setLayoutMode(prev => prev === 'annotation' ? 'split' : 'annotation');
                    }}
                />

                {/* Hidden Container for PDF Reports */}
                <div ref={hiddenPDFContainerRef} className="absolute top-0 left-[-9999px] w-[794px] opacity-0 pointer-events-none -z-50 bg-white" />
            </div>
        </MathJaxContext>
    );

    // Render Question Body and Interaction Controls
    function renderQuestionContent() {
        return (
            <div className="space-y-6">
                {/* 1. AR (Assertion & Reason) Special Box */}
                {currentQ.type === 'AR' && (
                    <div className="p-4 rounded-2xl border-2 bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 space-y-3 shadow-sm">
                        <div>
                            <div className="font-black text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> Assertion (A)
                            </div>
                            <div className="text-base font-semibold leading-relaxed">
                                <UniversalMathJax dynamic>{currentQ.assertion || currentQ.questionText}</UniversalMathJax>
                            </div>
                        </div>
                        {currentQ.reason && (
                            <div className="pt-2.5 border-t border-indigo-200/60 dark:border-indigo-800/60">
                                <div className="font-black text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Reason (R)
                                </div>
                                <div className="text-base font-semibold leading-relaxed">
                                    <UniversalMathJax dynamic>{currentQ.reason}</UniversalMathJax>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Standard Question Text */}
                {currentQ.type !== 'AR' && (
                    <h3 className={`text-lg sm:text-xl font-bold leading-relaxed ${
                        isDark ? 'text-indigo-50' : 'text-slate-900'
                    }`}>
                        <UniversalMathJax inline dynamic>
                            {cleanupMath(currentQ.questionText)}
                        </UniversalMathJax>
                    </h3>
                )}

                {/* 3. MCQ / SMCQ / AR Options */}
                {['MCQ', 'SMCQ', 'AR'].includes(currentQ.type) && currentQ.options && (
                    <div className="grid gap-3 pt-2">
                        {currentQ.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = opt.isCorrect;
                            const isUserSelected = currentQ.userAnswer === idx;
                            const shouldReveal = isAnswerChecked || currentQ.status === 'correct';

                            let optionStyle = isDark
                                ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80"
                                : "border-border bg-card shadow-sm hover:shadow hover:border-primary/30";

                            if (isSelected) {
                                optionStyle = isDark
                                    ? "bg-indigo-950/60 border-indigo-500/60 ring-2 ring-indigo-500/40"
                                    : "bg-indigo-50 border-indigo-500/60 ring-2 ring-indigo-500/30";
                            }

                            if (shouldReveal) {
                                if (isCorrect) {
                                    optionStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/30";
                                } else if (isSelected) {
                                    optionStyle = "bg-rose-500/15 border-rose-500 text-rose-950 dark:text-rose-100 opacity-70";
                                } else {
                                    optionStyle = "opacity-45 bg-muted/30 border-transparent";
                                }
                            } else if (currentQ.status === 'wrong' && isUserSelected) {
                                optionStyle = "bg-rose-500/15 border-rose-400 ring-2 ring-rose-400";
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (!shouldReveal && !currentQ.status) {
                                            setSelectedOption(idx);
                                            setUserAnswers({ ...userAnswers, [currentIndex]: idx });
                                        }
                                    }}
                                    className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${optionStyle}`}
                                >
                                    <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                                        shouldReveal && isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : shouldReveal && isSelected && !isCorrect
                                            ? 'bg-rose-600 text-white'
                                            : isSelected || (currentQ.status && isUserSelected)
                                            ? 'bg-indigo-600 text-white'
                                            : isDark ? 'bg-slate-800 text-slate-300' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="flex-1 pt-0.5 text-sm sm:text-base font-medium">
                                        <UniversalMathJax inline dynamic>
                                            {cleanupMath(opt.text)}
                                        </UniversalMathJax>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 4. MC (Multiple Correct Checkboxes) */}
                {currentQ.type === 'MC' && currentQ.options && (
                    <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Select all correct options:
                        </div>
                        <div className="grid gap-3">
                            {currentQ.options.map((opt, idx) => {
                                const currentAns = userAnswers[currentIndex];
                                const selectedIndices: number[] = Array.isArray(currentAns) ? currentAns : [];
                                const isSelected = selectedIndices.includes(idx);
                                const isCorrect = opt.isCorrect;

                                let optClass = isDark
                                    ? "border-slate-800 bg-slate-900/60"
                                    : "border-border bg-card shadow-sm";

                                if (isAnswerChecked) {
                                    if (isSelected && isCorrect) optClass = "bg-emerald-500/20 border-emerald-500 font-bold";
                                    else if (isSelected && !isCorrect) optClass = "bg-rose-500/20 border-rose-500 opacity-60";
                                    else if (isCorrect) optClass = "bg-emerald-500/10 border-emerald-400 font-semibold";
                                    else optClass = "opacity-40";
                                } else if (isSelected) {
                                    optClass = "bg-indigo-50 border-indigo-500 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200";
                                }

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (isAnswerChecked) return;
                                            const newSet = new Set(selectedIndices);
                                            if (newSet.has(idx)) newSet.delete(idx);
                                            else newSet.add(idx);
                                            setUserAnswers({ ...userAnswers, [currentIndex]: Array.from(newSet) });
                                        }}
                                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${optClass}`}
                                    >
                                        <div className={`shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-muted border-border'
                                        }`}>
                                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                        <div className="flex-1 text-sm sm:text-base font-medium pt-0.5">
                                            <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 5. INT (Numerical Input) */}
                {currentQ.type === 'INT' && (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Numerical Answer:
                        </label>
                        <Input
                            type="text"
                            value={userAnswers[currentIndex] || ""}
                            onChange={(e) => !isAnswerChecked && setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value })}
                            placeholder="Enter numerical answer"
                            disabled={isAnswerChecked}
                            className="text-lg font-black h-12 bg-card border-2 border-border rounded-xl"
                        />
                        {isAnswerChecked && currentQ.modelAnswer && (
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Correct Value: {currentQ.modelAnswer}
                            </div>
                        )}
                    </div>
                )}

                {/* 6. CQ / SQ Subquestions */}
                {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type) && currentQ.subQuestions && Array.isArray(currentQ.subQuestions) && (
                    <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Sub-Questions:
                        </div>
                        {currentQ.subQuestions.map((sub: any, idx: number) => (
                            <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                                <div className="flex items-start gap-2">
                                    <span className="font-black text-indigo-600 text-sm">({String.fromCharCode(97 + idx)})</span>
                                    <div className="flex-1 text-sm font-medium">
                                        <UniversalMathJax inline dynamic>{sub.question || sub.text}</UniversalMathJax>
                                    </div>
                                </div>
                                {isAnswerChecked && (sub.answer || sub.modelAnswer) && (
                                    <div className="pt-2 border-t border-border/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        Solution: <UniversalMathJax dynamic>{sub.answer || sub.modelAnswer}</UniversalMathJax>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 7. Check Answer / Reveal Solution Button */}
                {!isAnswerChecked && currentQ.status !== 'correct' && (
                    <Button
                        onClick={() => setIsAnswerChecked(true)}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01]"
                    >
                        {['CQ', 'SQ', 'DESCRIPTIVE'].includes(currentQ.type)
                            ? "Reveal Model Answer & Explanation"
                            : "Check Answer & Reveal Explanation"}
                    </Button>
                )}

                {/* 8. Detailed Answer & Explanation Reveal Block */}
                {(isAnswerChecked || currentQ.status === 'correct') && (
                    <div className={`mt-5 p-5 rounded-2xl border-2 shadow-xl animate-in fade-in slide-in-from-top-2 ${
                        isDark ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-100' : 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
                    }`}>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="font-black text-base">Answer & Explanation Details</span>
                        </div>

                        {/* MCQ / AR Correct Option */}
                        {['MCQ', 'SMCQ', 'AR'].includes(currentQ.type) && currentQ.options && (() => {
                            const correctOpt = currentQ.options.find(o => o.isCorrect);
                            const correctIdx = currentQ.options.findIndex(o => o.isCorrect);
                            return (
                                <div className="mb-3">
                                    <Badge className="bg-emerald-600 text-white font-black px-3.5 py-1 text-sm shadow">
                                        Correct Answer: Option {correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : 'A'}
                                    </Badge>
                                    {correctOpt?.text && (
                                        <div className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                            <UniversalMathJax inline dynamic>{cleanupMath(correctOpt.text)}</UniversalMathJax>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Model Answer (CQ/SQ/INT) */}
                        {currentQ.modelAnswer && (
                            <div className="mb-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Model Answer / Solution:</div>
                                <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                                    <UniversalMathJax dynamic>{cleanupMath(currentQ.modelAnswer)}</UniversalMathJax>
                                </div>
                            </div>
                        )}

                        {/* Explanation Text */}
                        {(() => {
                            const expText = currentQ.explanation
                                || currentQ.options?.find(o => o.isCorrect && o.explanation)?.explanation
                                || currentQ.modelAnswer;

                            if (!expText) return null;

                            return (
                                <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60">
                                    <h4 className="font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Teacher Explanation / Notes
                                    </h4>
                                    <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                                        <UniversalMathJax dynamic>
                                            {cleanupMath(renderDynamicExplanation(
                                                expText,
                                                currentQ.options,
                                                currentQ.type,
                                                currentQ.rightColumn
                                            ))}
                                        </UniversalMathJax>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    }
}

// Live Clock Component
function LiveClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return <span>00:00:00</span>;
    return <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
}
