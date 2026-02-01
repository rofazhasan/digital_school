"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    LogOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, MousePointer2, Eraser, Move, Palette, Save, Undo, Redo, Share2, FileDown, Layers, Layout, Video, Mic, Share, Settings, PenTool, User, X, Eye, Square, Circle, Triangle, Minus, Sun, Moon, Grid3X3, ArrowRight, Printer, Clock, CheckCircle, XCircle, ZoomIn, ZoomOut, Highlighter, Ruler, Box, BarChart2, CircleDashed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cleanupMath } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";


// Dynamic Imports
import { SmartBoardRef, exportPathsToImage } from "@/app/components/SmartBoard";
const SmartBoard = dynamic(() => import("@/app/components/SmartBoard"), { ssr: false });
const SmartBoardToolbar = dynamic(() => import("@/app/components/SmartBoardToolbar").then(mod => mod.SmartBoardToolbar), { ssr: false });
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";

// Types
interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'CQ' | 'SQ';
    subject: string;
    topic?: string;
    difficulty: string;
    marks: number;
    options?: { text: string; isCorrect: boolean; explanation?: string }[];
    modelAnswer?: string;
    subQuestions?: any[];
    // Review Mode Fields
    status?: 'correct' | 'wrong' | 'unanswered';
    userAnswer?: number | null; // Index of selected option
}

const MATHJAX_CONFIG = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    }
};

export default function ReviewToSessionPort() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);

    // Session State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examName, setExamName] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [boardBackground, setBoardBackground] = useState<'white' | 'black' | 'grid'>('white');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [annotationMode, setAnnotationMode] = useState(false);
    const hiddenPDFContainerRef = useRef<HTMLDivElement>(null);

    // Persistence
    const [boardHistories, setBoardHistories] = useState<Record<string, any[]>>({});

    // Interaction State
    const [showOverlay, setShowOverlay] = useState(true);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // Initialize
    useEffect(() => {
        const initReviewSession = async () => {
            try {
                setLoading(true);
                // FORCE REVIEW MODE logic
                // 1. Check for ID provided in URL (e.g. ?id=...) which allows viewing specific evaluation
                // 2. Fallback to localStorage

                const params = new URLSearchParams(window.location.search);
                const queryId = params.get('id');
                const storedIds = localStorage.getItem("review-session-data");

                let sessionQuestions: Question[] = [];

                if (queryId) {
                    // --- CLOUD FETCH MODE ---
                    try {
                        // Attempt to fetch specific evaluation
                        const res = await fetch(`/api/exams/evaluations/${queryId}`);
                        if (!res.ok) throw new Error("Failed to fetch evaluation");

                        const data = await res.json();
                        // Data structure expected: { questions: [], submissions: [ { answers: {}, result: {} } ] }

                        const submission = data.submissions?.[0]; // Take first submission
                        const answers = submission?.answers || {};

                        if (data.questions && Array.isArray(data.questions)) {
                            sessionQuestions = data.questions.map((q: any) => {
                                // Map API Question to Local Question
                                // 1. Map 'text' to 'questionText' (API returns 'text')
                                // Added strict check for text sources
                                const qText = q.text || q.questionText || "Question text missing";

                                // 2. Determine userAnswer INDEX from Answer TEXT
                                const userAnsText = answers[q.id];
                                let userAnsIndex: number | null = null;

                                if (userAnsText !== undefined && userAnsText !== null && q.options) {
                                    // Robust Matching: Normalize both
                                    const normalize = (s: any) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
                                    const normalizedUserAns = normalize(userAnsText);

                                    // Find index of option matching the text
                                    userAnsIndex = q.options.findIndex((opt: any) => normalize(opt.text) === normalizedUserAns);

                                    if (userAnsIndex === -1) {
                                        // Fallback: Check if it matches 'text' property directly in case opt is object
                                        // or if userAnsText is actually an index
                                        if (!isNaN(Number(userAnsText))) {
                                            const idx = Number(userAnsText);
                                            if (idx >= 0 && idx < q.options.length) userAnsIndex = idx;
                                        }
                                    }
                                }

                                // 3. Determine Status
                                let status: 'correct' | 'wrong' | 'unanswered' = 'unanswered';
                                if (userAnsIndex !== null && userAnsIndex !== undefined) {
                                    // Assuming options have { text, isCorrect }
                                    const selectedOpt = q.options?.[userAnsIndex];
                                    if (selectedOpt?.isCorrect) status = 'correct';
                                    else status = 'wrong';
                                }

                                return {
                                    ...q,
                                    questionText: qText,
                                    userAnswer: userAnsIndex,
                                    status: status
                                };
                            });
                        }

                        if (data.exam?.name || data.name) {
                            setExamName(data.exam?.name || data.name);
                        }
                    } catch (e) {
                        console.error("Cloud fetch failed", e);
                        toast.error("Could not load evaluation from Server");
                        setLoading(false);
                        return;
                    }

                } else if (storedIds) {
                    // --- LOCAL STORAGE MODE ---
                    const storedData = JSON.parse(storedIds);

                    if (Array.isArray(storedData) && storedData.length > 0) {
                        sessionQuestions = storedData as Question[];
                        if ((storedData as any).examName) setExamName((storedData as any).examName);
                        else if ((storedData as any).questions) {
                            sessionQuestions = (storedData as any).questions;
                            if ((storedData as any).examName) setExamName((storedData as any).examName);
                        }
                    }
                } else {
                    toast.error("No review data found");
                    setLoading(false);
                    return;
                }

                if (sessionQuestions.length === 0) {
                    toast.error("Questions not found");
                    // Do not redirect, just show empty or error
                    setLoading(false);
                    return;
                }

                setQuestions(sessionQuestions);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load review session");
            } finally {
                setLoading(false);
            }
        };
        initReviewSession();
    }, []);

    // Board Persistence
    const saveCurrentBoardState = () => {
        if (boardRef.current && questions[currentIndex]) {
            const paths = boardRef.current.getPaths();
            setBoardHistories(prev => ({
                ...prev,
                [questions[currentIndex].id]: paths
            }));
        }
    };

    const restoreBoardState = (index: number) => {
        if (boardRef.current && questions[index]) {
            const savedPaths = boardHistories[questions[index].id];
            boardRef.current.loadPaths(savedPaths || []);
        }
    };

    const handleNext = () => {
        saveCurrentBoardState();
        if (currentIndex < questions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setTimeout(() => restoreBoardState(nextIndex), 0);
        }
    };

    const handlePrev = () => {
        saveCurrentBoardState();
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setTimeout(() => restoreBoardState(prevIndex), 0);
        }
    };

    // Sync State with Question (Review Mode Logic Only)
    useEffect(() => {
        const q = questions[currentIndex];
        if (!q) return;

        // Reset for new question
        setIsAnswerChecked(false);

        if (q.status) {
            // Review Mode
            // Set user's selected option if it exists
            setSelectedOption(typeof q.userAnswer === 'number' ? q.userAnswer : null);

            // REMOVED AUTO-REVEAL: User wants manual check only
            // setIsAnswerChecked(q.status === 'correct'); 
        } else {
            // Fallback if status missing
            setSelectedOption(null);
        }
    }, [currentIndex, questions]);


    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
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
        if (input) {
            const toastId = toast.loading("Generating PDF...");
            try {
                const canvas = await html2canvas(input, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    ignoreElements: (element) => element.classList.contains('no-print')
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`Review_Session_${new Date().getTime()}.pdf`);
                toast.dismiss(toastId);
                toast.success("PDF Downloaded!");
            } catch (e) {
                console.error(e);
                toast.dismiss(toastId);
                toast.error("Failed to generate PDF");
            }
        }
    };


    const currentQ = questions[currentIndex];
    const isDark = boardBackground === 'black';

    if (loading || !currentQ) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading Review...</p>
                {/* No Data Fallback UI */}
                {!loading && (
                    <div className="mt-4 text-center">
                        <p className="text-red-500 mb-4">No review data found.</p>
                        <Button onClick={() => router.push('/problem-solving')}>Go Back</Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <MathJaxContext config={MATHJAX_CONFIG} version={3}>
            <div id="session-workspace" className={`h-screen w-full flex flex-col overflow-hidden relative font-sans ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>

                {/* 1. TOP BAR */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 pointer-events-none bg-gradient-to-b from-black/10 to-transparent no-print">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <Button
                            variant="secondary" size="sm"
                            onClick={() => router.push('/problem-solving')} // Or window.close()
                            className="bg-white/90 backdrop-blur shadow-sm hover:bg-white border border-gray-100 rounded-full pl-3 pr-4"
                        >
                            <LogOut className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-700">Close Review</span>
                        </Button>
                        <div className="bg-white/90 backdrop-blur shadow-sm border border-gray-100 px-4 py-1.5 rounded-full flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-800">Q {currentIndex + 1} / {questions.length}</span>
                        </div>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-100 shadow-sm pointer-events-auto">
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Review Mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-sm font-bold text-blue-800">{examName || "Exam Review"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-100 shadow-sm pointer-events-auto">
                        <Button variant="ghost" size="icon" onClick={() => setShowOverlay(!showOverlay)} className="bg-white/80 hover:bg-white rounded-full">
                            {showOverlay ? <Eye className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/80 hover:bg-white rounded-full">
                            {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-600" /> : <Maximize2 className="w-5 h-5 text-gray-600" />}
                        </Button>
                    </div>
                </div>

                {/* 2. MAIN CANVAS */}
                <div className={`absolute inset-0 transition-none ${annotationMode ? 'z-30 pointer-events-auto' : 'z-0'}`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={annotationMode ? 'transparent' : boardBackground}
                    />
                </div>

                {/* 3. QUESTION OVERLAY */}
                {/* REMOVED ANIMATEPRESENCE TO GUARANTEE VISIBILITY (Fix for blank screen) */}
                {showOverlay && (
                    <div className={`absolute top-24 left-6 w-[520px] flex flex-col max-h-[calc(100vh-160px)] transition-all duration-300 ${annotationMode ? 'z-10 pointer-events-none opacity-40 translate-x-[-20px]' : 'z-20 pointer-events-auto'}`}>
                        <Card className={`shadow-xl border-0 overflow-hidden flex flex-col rounded-3xl backdrop-blur-md ${isDark ? 'bg-slate-900/90 ring-1 ring-slate-700/50 text-white' : 'bg-white/95 ring-1 ring-black/5 text-gray-900'}`}>

                            {/* Header / Meta */}
                            <div className={`px-8 py-5 flex justify-between items-center ${isDark ? 'border-b border-slate-800' : 'border-b border-gray-100'}`}>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{currentQ.subject}</span>
                                    </div>
                                    {currentQ.topic && (
                                        <span className={`text-xs truncate max-w-[200px] font-medium pl-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentQ.topic}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    {currentQ.status === 'correct' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/20">Correct</Badge>
                                    )}
                                    {currentQ.status === 'wrong' && (
                                        <Badge className="bg-rose-500/10 text-rose-600 border-0 hover:bg-rose-500/20">Wrong</Badge>
                                    )}
                                    {currentQ.status === 'unanswered' && (
                                        <Badge className="bg-slate-500/10 text-slate-500 border-0 hover:bg-slate-500/20">Unanswered</Badge>
                                    )}

                                    <Badge variant="outline" className={`border-0 px-2.5 py-1 ${currentQ.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {currentQ.difficulty}
                                    </Badge>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className={`p-8 relative custom-scrollbar ${annotationMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                <h3 className={`text-2xl font-semibold leading-relaxed max-w-4xl tracking-tight ${isDark ? 'text-indigo-50' : 'text-slate-900'}`}>
                                    <UniversalMathJax inline dynamic>{cleanupMath(currentQ.questionText)}</UniversalMathJax>
                                </h3>

                                <div className="mt-10 space-y-4">
                                    {currentQ.type?.toUpperCase() === 'MCQ' && currentQ.options && (
                                        <div className="grid gap-4">
                                            {currentQ.options.map((opt, idx) => {
                                                const isSelected = selectedOption === idx;
                                                const isCorrect = opt.isCorrect;

                                                // Student's original submission (Persistent)
                                                const isStudentAnswer = currentQ.userAnswer === idx;

                                                // REVEAL LOGIC: STRICTLY MANUAL
                                                // Only show colors if the "Check Answer" button was clicked.
                                                const shouldReveal = isAnswerChecked;

                                                // Base Style
                                                let statusClass = isDark
                                                    ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800/60"
                                                    : "border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200";

                                                // INTERACTION STATE: Highlight selected option (Blue border/bg) before reveal
                                                if (isSelected) {
                                                    statusClass = isDark
                                                        ? "bg-indigo-900/30 border-indigo-500/40 ring-1 ring-indigo-500/20"
                                                        : "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-100 shadow-sm";
                                                }

                                                // REVEAL STATE: Colors override selection styles
                                                if (shouldReveal) {
                                                    if (isCorrect) {
                                                        // Always show CORRECT answer in GREEN
                                                        statusClass = isDark ? "bg-emerald-950/30 border-emerald-500/40" : "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100";
                                                    }
                                                    else if (isSelected) {
                                                        // Show SELECTED WRONG answer in RED
                                                        statusClass = isDark ? "bg-rose-950/30 border-rose-500/40 opacity-90" : "bg-rose-50 border-rose-200 ring-1 ring-rose-100 opacity-90";
                                                    }
                                                    else {
                                                        // Dim others
                                                        statusClass = isDark ? "bg-slate-800/20 opacity-40 grayscale" : "bg-slate-50 opacity-40 grayscale";
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={(e) => {
                                                            if (annotationMode) return;
                                                            // Teacher Interaction
                                                            setSelectedOption(idx);
                                                            setIsAnswerChecked(false);
                                                        }}
                                                        className={`
                                                  p-5 rounded-2xl border transition-all duration-300 flex items-start gap-5 group cursor-pointer relative overflow-hidden
                                                  ${annotationMode ? 'cursor-crosshair' : ''}
                                                  ${statusClass}
                                              `}
                                                    >
                                                        {/* Option Label (A, B, C...) */}
                                                        <div className={`
                                                  shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 border
                                                  ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:bg-slate-50')}
                                                  ${shouldReveal && isCorrect ? '!bg-emerald-500 !border-emerald-400 !text-white !shadow-emerald-500/30' : ''}
                                                  ${shouldReveal && isSelected && !isCorrect ? '!bg-rose-500 !border-rose-400 !text-white !shadow-rose-500/30' : ''}
                                              `}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>

                                                        <div className="flex-1 flex flex-col z-10">
                                                            <span className={`text-lg leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700 font-medium'}`}>
                                                                <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                                            </span>

                                                            {/* Student Answer Indicator (Persistent) */}
                                                            {isStudentAnswer && (
                                                                <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-indigo-950/50 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                                                        <User className="w-3 h-3" />
                                                                        Student Pick
                                                                    </div>

                                                                    {/* Status Badges (Only after Reveal) */}
                                                                    {shouldReveal && currentQ.status === 'correct' && (
                                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Correct</span>
                                                                    )}
                                                                    {shouldReveal && currentQ.status === 'wrong' && (
                                                                        <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Wrong</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Check Answer Button: Show if NOT revealed yet */}
                                {(!isAnswerChecked) && currentQ.type?.toUpperCase() === 'MCQ' && (
                                    <Button
                                        onClick={() => setIsAnswerChecked(true)}
                                        // Disabled only if nothing selected, UNLESS we just want to see the answer
                                        // disabled={selectedOption === null}
                                        className="w-full mt-8 h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] rounded-xl"
                                    >
                                        Check Answer & Explanation
                                    </Button>
                                )}

                                {isAnswerChecked && (
                                    <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-slate-50 border-slate-100'}`}>
                                        <h4 className="font-bold text-indigo-600 flex items-center gap-2 mb-3">
                                            <CheckCircle className="w-5 h-5" /> Explanation
                                        </h4>
                                        <div className="prose dark:prose-invert max-w-none text-slate-600 leading-relaxed">
                                            <MathJax dynamic>{currentQ.options?.find(o => o.isCorrect)?.explanation || "No explanation provided."}</MathJax>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* 4. FLOATING TOOLBAR */}
                <SmartBoardToolbar
                    boardRef={boardRef}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onExport={handleExportPDF}
                    bgMode={boardBackground}
                    onNavigateBg={handleToggleBackground}
                    isAnnotationMode={annotationMode}
                    onToggleAnnotation={() => setAnnotationMode(!annotationMode)}
                />

                {/* Hidden Container for PDF Generation */}
                <div ref={hiddenPDFContainerRef} className="absolute top-0 left-[-9999px] w-[794px] opacity-0 pointer-events-none -z-50 bg-white"></div>
            </div>

        </MathJaxContext>
    );
}
