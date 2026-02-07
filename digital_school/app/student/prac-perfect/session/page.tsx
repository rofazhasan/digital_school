"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, RotateCcw, Flag, ArrowRight, Eye
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
}

export default function PracPerfectSessionPage() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);

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
    const [score, setScore] = useState(0);

    // Overlay State
    const [showQuestion, setShowQuestion] = useState(true);

    // Initialize
    useEffect(() => {
        const loadSession = async () => {
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
                    setQuestions(data.questions);
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

    // Reset state on question change
    useEffect(() => {
        setSelectedOption(null);
        setIsChecked(false);
        setIsCorrect(false);
        // Clear board? Optional. Maybe keep scratchpad? 
        // Usually students want a fresh board.
        // boardRef.current?.clear(); 
        // Let's clear it for now to avoid confusion.
        if (boardRef.current) {
            // boardRef.current.clear(); // Need to implement clear or just leave it
        }
    }, [currentIndex]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (idx: number) => {
        if (isChecked) return; // Prevent changing after check
        setSelectedOption(idx);
    };

    const handleCheckAnswer = async () => {
        if (selectedOption === null) return;

        const currentQ = questions[currentIndex];
        // Parse options if they are stored as JSON string in some legacy cases, but mostly they are JSON object
        // The API returns them as is.
        // Assuming modelAnswer holds the correct index or letter ("A", "B"... or "0", "1"...)
        // Let's assume modelAnswer is "0", "1", etc or "A", "B".

        // Logic to normalize answer checking
        let correctIdx = -1;
        if (currentQ.modelAnswer) {
            // Try to parse if it's a number
            const num = parseInt(currentQ.modelAnswer);
            if (!isNaN(num)) correctIdx = num;
            else {
                // Map A->0, B->1 etc
                const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                if (map[currentQ.modelAnswer] !== undefined) correctIdx = map[currentQ.modelAnswer];
            }
        }

        const isRight = selectedOption === correctIdx;
        setIsCorrect(isRight);
        setIsChecked(true);

        if (isRight) {
            setScore(s => s + 1);
            const confetti = (await import("canvas-confetti")).default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast.success("Correct Answer! 🎉");
        } else {
            toast.error("Incorrect. Try to learn from this!");
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            // Finish
            toast.success(`Session Complete! Score: ${score}/${questions.length}`);
            router.push("/student/prac-perfect");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse">Loading Session...</div></div>;

    const currentQ = questions[currentIndex];
    const isDark = boardBackground === 'black';

    return (
        <MathJaxContext config={MATHJAX_CONFIG} version={3}>
            <div className={`h-screen w-full flex flex-col overflow-hidden relative font-sans ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>

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
                    <div className="absolute top-20 left-4 md:left-8 w-[90vw] md:w-[450px] max-h-[calc(100vh-160px)] z-40 overflow-y-auto">
                        <Card className={`shadow-2xl border-0 ring-1 ring-slate-900/5 ${isDark ? 'bg-slate-800/90 text-white' : 'bg-white/95 backdrop-blur'}`}>
                            <div className="p-5 space-y-4">
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <Badge variant="outline" className={`${isDark ? 'border-slate-600 text-slate-300' : ''}`}>
                                        {currentQ.subject}
                                    </Badge>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={() => setShowQuestion(false)}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Question Text */}
                                <div className={`text-base font-medium leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                    <UniversalMathJax>{cleanupMath(currentQ.questionText)}</UniversalMathJax>
                                </div>

                                {/* Options (MCQ) */}
                                {currentQ.type === 'MCQ' && Array.isArray(currentQ.options) && (
                                    <div className="space-y-2 mt-4">
                                        {currentQ.options.map((opt: any, idx: number) => {
                                            const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));

                                            let stateClass = "";
                                            if (isChecked) {
                                                if (idx === selectedOption && isCorrect) stateClass = "bg-green-100 border-green-500 text-green-900"; // Selected & Correct
                                                else if (idx === selectedOption && !isCorrect) stateClass = "bg-red-100 border-red-500 text-red-900"; // Selected & Wrong
                                                else if (currentQ.modelAnswer && (idx === parseInt(currentQ.modelAnswer) || (['A', 'B', 'C', 'D'][idx] === currentQ.modelAnswer))) {
                                                    stateClass = "bg-green-50 border-green-300 text-green-800 ring-2 ring-green-500/20"; // Reveal Correct
                                                }
                                            } else {
                                                if (idx === selectedOption) stateClass = "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500";
                                                else stateClass = "hover:bg-slate-50 border-slate-200 text-slate-700";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={isChecked}
                                                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${stateClass}`}
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold opacity-70">
                                                        {['A', 'B', 'C', 'D'][idx]}
                                                    </div>
                                                    <div className="text-sm pt-0.5">
                                                        <UniversalMathJax inline>{cleanupMath(optText)}</UniversalMathJax>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-4 flex gap-3">
                                    {!isChecked ? (
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={selectedOption === null}
                                            onClick={handleCheckAnswer}
                                        >
                                            Check Answer
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            variant={currentIndex === questions.length - 1 ? "default" : "outline"}
                                            onClick={handleNext}
                                        >
                                            {currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"} <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>

                                {/* Explanation Reveal */}
                                {isChecked && !isCorrect && (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Incorrect.</span> Try solving it on the canvas!
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Toggle Question Visibility Button (if hidden) */}
                {!showQuestion && (
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
