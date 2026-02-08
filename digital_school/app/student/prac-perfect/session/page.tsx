"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, RotateCcw, Flag, ArrowRight, Eye, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
// @ts-ignore
// import confetti from "canvas-confetti"; // Dynamic import used instead


// Dynamic Imports for Canvas
const SmartBoard = dynamic(() => import("@/app/components/SmartBoard"), { ssr: false });
import { SmartBoardRef } from "@/app/components/SmartBoard";

// Reuse existing toolbar or create a simpler one? 
// The existing one is quite tied to the other page, let's try to reuse it but pass specific props if needed.
// Actually, for a "Perfect" UI, let's make a custom minimal toolbar or just use the existing one if it looks good.
// The existing toolbar is in `app/components/SmartBoardToolbar`.
const SmartBoardToolbar = dynamic(() => import("@/app/components/SmartBoardToolbar").then(mod => mod.SmartBoardToolbar), { ssr: false });

const MATHJAX_CONFIG = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    }
};

interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'CQ' | 'SQ';
    subject: string;
    topic?: string;
    options?: any[]; // Array of strings or objects depending on parsing
    modelAnswer?: string; // Correct option index/value
    images?: string[];
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
    const [annotationMode, setAnnotationMode] = useState(true); // Default to drawing mode for practice

    // Answer State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Result Tracking
    const [sessionResults, setSessionResults] = useState<Record<number, 'correct' | 'wrong' | 'unanswered'>>({});
    const [score, setScore] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    // Overlay State
    const [showQuestion, setShowQuestion] = useState(true);

    // Initialize
    useEffect(() => {
        const loadSession = async () => {
            // Set Page Title
            document.title = "Practise Session || Student | Digital School";

            const storedIds = localStorage.getItem("prac-perfect-session");
            if (!storedIds) {
                toast.error("No active session found");
                router.push("/student/prac-perfect");
                return;
            }

            try {
                const ids = JSON.parse(storedIds);
                // Fetch details
                const res = await fetch(`/api/student/prac-perfect/questions?ids=${ids.join(',')}`);
                const data = await res.json();

                if (data.questions && data.questions.length > 0) {
                    // Fisher-Yates Shuffle
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
                        if (q.type === 'MCQ' && Array.isArray(q.options)) {
                            // 1. Determine Correct Index from various possible sources
                            let correctIdx = -1;

                            // Check if any option already has isCorrect: true (from DB/Bulk Upload)
                            const dbCorrectIdx = q.options.findIndex((o: any) => o.isCorrect === true);

                            if (dbCorrectIdx !== -1) {
                                correctIdx = dbCorrectIdx;
                            } else if (q.modelAnswer) {
                                // Fallback to modelAnswer parsing
                                const num = parseInt(q.modelAnswer);
                                if (!isNaN(num)) correctIdx = num;
                                else {
                                    const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
                                    const normalizedAnswer = q.modelAnswer.trim().toUpperCase();
                                    if (map[normalizedAnswer] !== undefined) correctIdx = map[normalizedAnswer];
                                }
                            }

                            // 2. Map and identify correctly
                            const processedOptions = q.options.map((opt: any, idx: number) => {
                                const optObj = typeof opt === 'string' ? { text: opt } : { ...opt };
                                return {
                                    ...optObj,
                                    isCorrect: idx === correctIdx
                                };
                            });

                            // 3. Shuffle Options
                            shuffle(processedOptions);
                            return { ...q, options: processedOptions };
                        }
                        return q;
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

        // Timer
        const timer = setInterval(() => setElapsedTime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, [router]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if not typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) setCurrentIndex(c => c - 1);
            } else if (e.key === 'Enter') {
                if (!isChecked && selectedOption !== null) {
                    handleCheckAnswer();
                } else if (isChecked) {
                    handleNext();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isChecked, selectedOption, questions.length]);

    // Reset state and scroll on question change
    useEffect(() => {
        setSelectedOption(null);
        setIsChecked(false);
        setIsCorrect(false);

        // Auto-scroll question container to top
        if (questionContainerRef.current) {
            questionContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentIndex]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (idx: number) => {
        if (isChecked) return; // Prevent changing after check
        setSelectedOption(idx);
    };

    const handleCheckAnswer = async () => {
        if (selectedOption === null) return;

        const currentQ = questions[currentIndex];
        const isRight = currentQ.options && currentQ.options[selectedOption]?.isCorrect;

        setIsCorrect(!!isRight);
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
            toast.error("Incorrect. Let's learn from the explanation!");
        }
        setSessionResults(newResults);
    };

    const handleNext = () => {
        // If not checked, mark as unanswered
        if (!isChecked && !sessionResults[currentIndex]) {
            setSessionResults(prev => ({ ...prev, [currentIndex]: 'unanswered' }));
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setShowSummary(true);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse">Loading Session...</div></div>;
    if (!questions[currentIndex]) return null;

    const currentQ = questions[currentIndex];
    const isDark = boardBackground === 'black';
    const result = sessionResults[currentIndex];

    return (
        <MathJaxContext config={MATHJAX_CONFIG} version={3}>
            <div className={`h-screen w-full flex flex-col overflow-hidden relative font-fancy ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>

                {/* 1. TOP BAR (Floating) */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm p-2 rounded-full border border-slate-200">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push('/student/prac-perfect')}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-bold px-2 text-slate-700">
                            Q{currentIndex + 1} / {questions.length}
                        </span>
                    </div>

                    <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm px-4 py-2 rounded-full border border-slate-200 flex items-center gap-4 text-sm font-medium tabular-nums text-slate-700">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            {formatTime(elapsedTime)}
                        </div>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {score}
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CANVAS */}
                <div className={`absolute inset-0 z-0`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={boardBackground}
                    // We need to pass tool state if customized, but SmartBoard handles its own internal state usually 
                    // unless controlled. The toolbar controls it via ref.
                    />
                </div>

                {/* 3. QUESTION CARD (Draggable/Fixed Overlay) */}
                {showQuestion && (
                    <div
                        ref={questionContainerRef}
                        className="absolute top-20 left-4 md:left-10 w-[95vw] md:w-[600px] lg:w-[900px] xl:w-[1100px] 2xl:w-[1200px] max-h-[calc(100vh-160px)] z-40 overflow-y-auto custom-scrollbar transition-all duration-300 scroll-smooth"
                    >
                        <Card className={`prac-perfect-glass shadow-2xl border-0 ring-1 ring-slate-900/5 ${isDark ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-slate-900'} transition-all duration-500`}>
                            <div className="p-6 space-y-6">
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className={`font-fancy font-bold px-3 py-1 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'bg-indigo-50/50 text-indigo-700 border-indigo-100'}`}>
                                            {currentQ.subject}
                                        </Badge>
                                        {currentQ.topic && (
                                            <Badge variant="secondary" className="font-fancy bg-indigo-500/10 text-indigo-700 border-indigo-100/50 px-3 py-1 font-bold">
                                                {currentQ.topic}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity" onClick={() => setShowQuestion(false)}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Question Text */}
                                <div className={`text-question font-fancy font-medium leading-relaxed tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                    <UniversalMathJax dynamic>{currentQ.questionText}</UniversalMathJax>
                                </div>

                                {/* Diagram Images */}
                                {Array.isArray(currentQ.images) && currentQ.images.length > 0 && (
                                    <div className="space-y-4 mt-2">
                                        {currentQ.images.map((img: string, i: number) => (
                                            <img key={i} src={img} alt="Question Diagram" className="rounded-xl border border-slate-200/50 max-w-full h-auto shadow-md mx-auto" />
                                        ))}
                                    </div>
                                )}

                                {/* Options (MCQ) */}
                                {currentQ.type === 'MCQ' && Array.isArray(currentQ.options) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                                        {currentQ.options.map((opt: any, idx: number) => {
                                            const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));

                                            let stateClass = "";
                                            const isThisCorrect = opt.isCorrect;
                                            const result = sessionResults[currentIndex];

                                            if (isChecked) {
                                                if (idx === selectedOption && isThisCorrect) {
                                                    // User correctly selected this
                                                    stateClass = "bg-green-600 border-green-600 text-white ring-4 ring-green-500/30 shadow-lg scale-[1.02]";
                                                } else if (idx === selectedOption && !isThisCorrect) {
                                                    // User wrongly selected this
                                                    stateClass = "bg-red-600 border-red-600 text-white ring-4 ring-red-500/30 shadow-lg scale-[1.02]";
                                                } else if (isThisCorrect) {
                                                    // Reveal the correct option (vibrant green)
                                                    stateClass = "bg-green-500/20 border-green-500 text-green-900 dark:text-green-300 ring-2 ring-green-500/10 shadow-md";
                                                } else {
                                                    stateClass = "opacity-40 grayscale-[0.3]";
                                                }
                                            } else if (result === 'unanswered') {
                                                // If we came back to an unanswered question that we want to show answers for
                                                if (isThisCorrect) {
                                                    stateClass = "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/10 shadow-md";
                                                } else {
                                                    stateClass = "opacity-50";
                                                }
                                            } else {
                                                if (idx === selectedOption) stateClass = "bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-4 ring-indigo-500/20 shadow-lg -translate-y-0.5";
                                                else stateClass = "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={isChecked}
                                                    className={`premium-option w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 shadow-sm ${stateClass}`}
                                                >
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-black transition-colors 
                                                        ${isChecked && (idx === selectedOption || isThisCorrect) ? 'bg-white text-indigo-900 border-white' :
                                                            idx === selectedOption ? 'bg-indigo-600 border-indigo-600 text-white' :
                                                                'bg-slate-100/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
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

                                {/* Actions */}
                                <div className="pt-6 flex gap-3">
                                    {!isChecked ? (
                                        <Button
                                            className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-fancy"
                                            disabled={selectedOption === null}
                                            onClick={handleCheckAnswer}
                                        >
                                            Check Answer
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

                                {/* Explanation Reveal */}
                                {(isChecked || result === 'unanswered') && (
                                    <div className={`p-5 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 shadow-xl 
                                        ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-300' :
                                            result === 'unanswered' ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300' :
                                                'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-300'}`}>

                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center 
                                                    ${isCorrect ? 'bg-green-100 text-green-600' :
                                                        result === 'unanswered' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-red-100 text-red-600'}`}>
                                                    {isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                        result === 'unanswered' ? <AlertCircle className="w-5 h-5" /> :
                                                            <XCircle className="w-5 h-5" />}
                                                </div>
                                                <span className="font-fancy font-black text-base">
                                                    {isCorrect ? 'Excellent! Correct Answer.' :
                                                        result === 'unanswered' ? 'Question Skipped' :
                                                            'Not quite right...'}
                                                </span>
                                            </div>
                                            {(!isCorrect || result === 'unanswered') && (
                                                <Badge className="bg-green-600 text-white border-white border-2 font-black px-4 py-1.5 shadow-md">
                                                    Correct Answer: {(() => {
                                                        const correctOpt = currentQ.options?.find((o: any) => o.isCorrect);
                                                        const correctIdx = currentQ.options?.indexOf(correctOpt) ?? -1;
                                                        return correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "?";
                                                    })()}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Get explanation from the correct option if available */}
                                        {Array.isArray(currentQ.options) && (
                                            <div className="text-explanation font-fancy">
                                                {(() => {
                                                    const correctOpt = currentQ.options.find((o: any) => o.isCorrect);

                                                    if (correctOpt?.explanation) {
                                                        return (
                                                            <div className="mt-3 pt-4 border-t border-current/10">
                                                                <div className="font-fancy font-black mb-2 text-xs opacity-70 uppercase tracking-[0.1em]">Explanation Details</div>
                                                                <div className="leading-relaxed opacity-90 italic decoration-indigo-500/30 underline-offset-4">
                                                                    <UniversalMathJax dynamic>{correctOpt.explanation}</UniversalMathJax>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return !isCorrect ? <p className="opacity-80 italic">Review the core concepts and try again!</p> : null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* 5. SESSION SUMMARY MODAL */}
                {showSummary && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 font-fancy">
                        <Card className="w-full max-w-md bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-black">Practice Session Complete!</h2>
                                <p className="opacity-80 mt-2 font-medium">You've finished all questions in this set.</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-center">
                                        <div className="text-green-600 font-black text-3xl mb-1">
                                            {Object.values(sessionResults).filter(v => v === 'correct').length}
                                        </div>
                                        <div className="text-xs font-bold text-green-700 uppercase tracking-widest">Correct</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-center">
                                        <div className="text-red-600 font-black text-3xl mb-1">
                                            {Object.values(sessionResults).filter(v => v === 'wrong').length}
                                        </div>
                                        <div className="text-xs font-bold text-red-700 uppercase tracking-widest">Wrong</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                        <div className="text-slate-600 font-black text-3xl mb-1">
                                            {questions.length - Object.values(sessionResults).length}
                                        </div>
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">Not Answered</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                                        <div className="text-indigo-600 font-black text-3xl mb-1">{questions.length}</div>
                                        <div className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Total Q</div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => router.push('/student/prac-perfect')}
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02]"
                                    >
                                        Back to Practice Hub <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Toggle Question Visibility Button (if hidden) */}
                {!showQuestion && !showSummary && (
                    <div className="absolute top-20 left-4 z-40">
                        <Button onClick={() => setShowQuestion(true)} className="shadow-lg rounded-full px-4" size="sm">
                            <Eye className="w-4 h-4 mr-2" /> Show Question
                        </Button>
                    </div>
                )}

                {/* 4. TOOLBAR (Bottom Fixed) */}
                <SmartBoardToolbar
                    boardRef={boardRef}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    onPrev={() => currentIndex > 0 && setCurrentIndex(c => c - 1)}
                    onNext={handleNext}
                    bgMode={boardBackground}
                    onNavigateBg={() => {
                        const next = boardBackground === 'white' ? 'grid' : boardBackground === 'grid' ? 'black' : 'white';
                        setBoardBackground(next);
                    }}
                    isAnnotationMode={annotationMode}
                    onToggleAnnotation={() => setAnnotationMode(!annotationMode)}
                // Hide export/complex features if we pass props to hide them (need to check toolbar impl)
                // Assuming default toolbar is fine for now
                />
            </div>
        </MathJaxContext>
    );
}
