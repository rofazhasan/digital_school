"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    LogOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, MousePointer2, Eraser, Move, Palette, Save, Undo, Redo, Share2, FileDown, Layers, Layout, Video, Mic, Share, Settings, PenTool, User, X, Eye, Square, Circle, Triangle, Minus, Sun, Moon, Grid3X3, ArrowRight, Printer, Clock, CheckCircle, XCircle, ZoomIn, ZoomOut, Highlighter, Ruler, Box, BarChart2, CircleDashed, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { cleanupMath, renderDynamicExplanation } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";


// Dynamic Imports
import { SmartBoardRef, exportPathsToImage } from "@/app/components/SmartBoard";
const SmartBoard = dynamic(() => import("@/app/components/SmartBoard"), { ssr: false });
const SmartBoardToolbar = dynamic(() => import("@/app/components/SmartBoardToolbar").then(mod => mod.SmartBoardToolbar), { ssr: false });
// Removed top-level imports for optimization
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
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
    options?: { text: string; isCorrect: boolean; explanation?: string; originalIndex?: number }[];
    modelAnswer?: string;
    subQuestions?: any[];
    rightColumn?: { id: string; text: string; originalIndex?: number }[];
    matches?: Record<string, string>;
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

export default function ProblemSolvingSession() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);
    // Force Rebuild Check


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
    const [showAnswer, setShowAnswer] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);



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

    // Initialize
    useEffect(() => {
        const initSession = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(window.location.search);
                const isReview = params.get('mode') === 'review';
                const storedIds = localStorage.getItem(isReview ? "review-session-data" : "problem-solving-session");

                const res = await fetch('/api/questions');
                const data = await res.json();

                let sessionQuestions: Question[] = [];
                // Check if stored data is IDs (legacy/selector) or Full Objects (Review Mode)
                const storedData = storedIds ? JSON.parse(storedIds) : [];

                if (Array.isArray(storedData) && storedData.length > 0) {
                    if (typeof storedData[0] === 'string') {
                        // IDs only (Selector Mode)
                        // If ids exist, can filter. For now just load all or check logic.
                        const ids = storedData as string[];
                        sessionQuestions = data.questions.filter((q: Question) => ids.includes(q.id));

                        // Shuffle for fresh session (only if not review)
                        if (!isReview) sessionQuestions = shuffleArray(sessionQuestions);
                        sessionQuestions = sessionQuestions.map((q: Question) => {
                            if (q.type === 'MCQ' && q.options && q.options.length > 0) {
                                // Add originalIndex before shuffling
                                const optionsWithIndex = q.options.map((opt, idx) => ({ ...opt, originalIndex: idx }));
                                return {
                                    ...q,
                                    options: isReview ? optionsWithIndex : shuffleArray(optionsWithIndex)
                                };
                            }
                            return q;
                        });

                    } else {
                        // Full Objects (Review/Export Mode)
                        // Verify they match our schema or merge with API data if needed
                        sessionQuestions = storedData as Question[];

                        // Extract Exam Name if available
                        if ((storedData as any).examName) {
                            setExamName((storedData as any).examName);
                        } else if ((storedData as any).questions) {
                            // Handle new object structure { questions: [], examName: "" }
                            sessionQuestions = (storedData as any).questions;
                            if ((storedData as any).examName) setExamName((storedData as any).examName);
                        }

                        // Do NOT shuffle in review mode - keep exam order
                    }
                } else {
                    sessionQuestions = data.questions || [];
                    if (!isReview) sessionQuestions = shuffleArray(sessionQuestions);
                }

                if (sessionQuestions.length === 0) {
                    toast.error("Questions not found");
                    router.push("/problem-solving");
                    return;
                }

                setQuestions(sessionQuestions);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load session");
            } finally {
                setLoading(false);
            }
        };
        initSession();
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

            // State Sync happens in useEffect below now
            setTimeout(() => restoreBoardState(nextIndex), 0);
        }
    };

    // Sync State with Question (Review Mode or Fresh)
    useEffect(() => {
        const q = questions[currentIndex];
        if (!q) return;

        if (q.status) {
            // Review Mode
            // Set user's selected option if it exists
            setSelectedOption(typeof q.userAnswer === 'number' ? q.userAnswer : null);

            // If they were correct, we auto-reveal (show Green).
            // If wrong or unanswered, we keep it unchecked (hidden) until they click "Show Correct Answer"
            setIsAnswerChecked(q.status === 'correct');
        } else {
            // Fresh Mode
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
        }
    }, [currentIndex, questions]);

    const handlePrev = () => {
        saveCurrentBoardState();
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            // State Sync happens in useEffect
            setTimeout(() => restoreBoardState(prevIndex), 0);
        }
    };

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
        // We rely on Toolbar to react to this prop change for color contrast
    };


    // updateSize removed - handled by Toolbar
    // toggleBackground removed - handled by Toolbar locally or via ref



    // Workaround: I will fix Toolbar in next step. For now, let's keep this file valid.
    /*
    const updateSize = (val: number) => {
        setBoardSize(val);
        boardRef.current?.setLineWidth(val);
    };

    const toggleBackground = () => {
        const next = boardBackground === 'white' ? 'grid' : boardBackground === 'grid' ? 'black' : 'white';
        setBoardBackground(next);
        if (next === 'black') {
            setBoardColor('#ffffff');
            boardRef.current?.setColor('#ffffff');
            setBoardTool('pen');
            boardRef.current?.setTool('pen');
        } else {
            setBoardColor('#000000');
            boardRef.current?.setColor('#000000');
            setBoardTool('pen');
            boardRef.current?.setTool('pen');
        }
    };
    */

    const handleExportPDF = async () => {
        const input = document.getElementById('session-workspace');
        if (input) {
            const toastId = toast.loading("Generating PDF...");
            try {
                // Dynamic import
                const html2canvas = (await import('html2canvas')).default;
                const { jsPDF } = await import('jspdf');

                const canvas = await html2canvas(input, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    ignoreElements: (element) => element.classList.contains('no-print')
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`LiveSession_${new Date().getTime()}.pdf`);
                toast.dismiss(toastId);
                toast.success("PDF Downloaded!");
            } catch (e) {
                console.error(e);
                toast.dismiss(toastId);
                toast.error("Failed to generate PDF");
            }
        }
    };

    // --- PDF Generation ---
    const generateSessionReport = async () => {
        if (!hiddenPDFContainerRef.current) return;

        const toastId = toast.loading('Generating PDF Report... (This may take a moment)');

        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let currentY = 10; // Top margin

            // Title Page
            pdf.setFontSize(24);
            pdf.text("Problem Solving Session", pageWidth / 2, 40, { align: 'center' });
            pdf.setFontSize(14);
            pdf.text(new Date().toLocaleDateString(), pageWidth / 2, 50, { align: 'center' });
            pdf.text(`Total Questions: ${questions.length}`, pageWidth / 2, 60, { align: 'center' });

            pdf.addPage();
            currentY = 10;

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const paths = boardHistories[q.id] || [];
                const isCorrectlyAnswered = q.type === 'MCQ' && selectedOption !== null && q.options?.[selectedOption]?.isCorrect; // Note: Logic might need to track per-question answer state if not persisted

                // 1. Prepare DOM for Question Text & Options
                const container = hiddenPDFContainerRef.current;
                if (!container) continue;

                container.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = "p-8 bg-white text-black font-sans";
                wrapper.style.width = "794px"; // A4 Pixel Width

                // Using UniversalMathJax logic effectively means standard text for now,
                // but we rely on the global MathJax/TikZ scripts to process the injected HTML.
                // We wrap TikZ in script tags manually for the report if needed, or just let UniversalMathJax process it if we could mount it.
                // Since we are inserting raw string HTML, we assume cleanupMath helps.

                let htmlContent = `
                    <div class="mb-6 border-b pb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-gray-400">Question ${i + 1}</span>
                            <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">${q.type} • ${q.marks} Marks</span>
                        </div>
                        <div class="text-xl font-bold text-gray-900 mb-4 leading-relaxed">${cleanupMath(q.questionText)}</div>
                `;

                // Options (if MCQ)
                if (q.type === 'MCQ' && q.options) {
                    htmlContent += `<div class="grid grid-cols-1 gap-2">`;
                    q.options.forEach((opt, idx) => {
                        const isCorrect = opt.isCorrect;
                        // const isSelected = ... (We would need to track user selection per question to show Red marks properly in history)
                        // For now highlighting Correct Answer only as per request "right answer clicked than only green mark"
                        // Assuming report shows ideal state or we need "user state". user said "if right answer clicked than only green mark".

                        const bgClass = isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-200 text-gray-600';
                        const label = String.fromCharCode(65 + idx);
                        htmlContent += `
                            <div class="flex items-center p-3 rounded border ${bgClass}">
                                <span class="font-bold mr-3">${label}</span>
                                <span>${cleanupMath(opt.text)}</span>
                                ${isCorrect ? '<span class="ml-auto text-green-600 font-bold">✓</span>' : ''}
                            </div>
                        `;
                    });
                    htmlContent += `</div>`;
                }

                // Explanation
                const correctOpt = q.options?.find(o => o.isCorrect);
                if (correctOpt?.explanation) {
                    htmlContent += `
                        <div class="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-indigo-900">
                            <strong>Explanation:</strong>
                            <div class="mt-1">${cleanupMath(correctOpt.explanation)}</div>
                        </div>
                    `;
                }

                htmlContent += `</div>`; // Close Wrapper
                wrapper.innerHTML = htmlContent;
                container.appendChild(wrapper);

                // 2. Render MathJax & TikZ in Hidden DOM
                // Wait for scripts to process.
                if ((window as any).MathJax) {
                    await (window as any).MathJax.typesetPromise([wrapper]);
                }

                // Wait for TikZJax (it observes DOM, give it a moment)
                await new Promise(r => setTimeout(r, 1000)); // 1s buffer for TikZ/MathJax to fully paint

                // 3. Capture Question Image
                // Strategy: Clone the wrapper, append to body (visible but off-screen), capture, then remove.
                // This circumvents issues with hidden containers.

                const clone = wrapper.cloneNode(true) as HTMLElement;
                clone.style.position = 'fixed';
                clone.style.top = '0';
                clone.style.left = '0';
                clone.style.zIndex = '-100'; // Behind everything
                clone.style.visibility = 'visible'; // Must be visible for html2canvas
                clone.style.opacity = '1';
                clone.style.background = 'white';
                clone.style.pointerEvents = 'none'; // Prevent blocking clicks

                document.body.appendChild(clone);

                let qCanvas;
                try {
                    // Wait for clone to render (images/fonts)
                    await new Promise(r => setTimeout(r, 500));

                    qCanvas = await html2canvas(clone, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        height: clone.scrollHeight,
                        windowWidth: 1920
                    });
                } finally {
                    document.body.removeChild(clone); // Ensure Cleanup happens!
                }

                container.innerHTML = ''; // Clear hidden container too

                const qImgData = qCanvas.toDataURL('image/jpeg', 0.9);
                const qImgProps = pdf.getImageProperties(qImgData);
                const qImgHeight = (qImgProps.height * pageWidth) / qImgProps.width;

                // Check Page Break
                if (currentY + qImgHeight > pageHeight - 10) {
                    pdf.addPage();
                    currentY = 10;
                }

                pdf.addImage(qImgData, 'JPEG', 0, currentY, pageWidth, qImgHeight);
                currentY += qImgHeight + 5;

                // 4. Capture Drawing (Space Optimized + Inverted Colors)
                // Pass 'isDark' (derived from current board state, ideally should capture board state per question, but assuming consistent)
                const drawingImgData = await exportPathsToImage(paths, 20, isDark); // Invert if Dark Mode

                if (drawingImgData) {
                    const dImgProps = pdf.getImageProperties(drawingImgData);
                    let dWidth = pageWidth - 20; // 10mm margin
                    let dHeight = (dImgProps.height * dWidth) / dImgProps.width;

                    // If drawing is larger than remaining space, add page
                    if (currentY + 50 > pageHeight) {
                        pdf.addPage();
                        currentY = 10;
                    }

                    if (currentY + dHeight > pageHeight - 10) {
                        if (dHeight > pageHeight - 20) {
                            // Too big for one page, scale to fit height
                            const ratio = (pageHeight - 20) / dHeight;
                            dWidth = dWidth * ratio;
                            dHeight = pageHeight - 20;
                            pdf.addPage();
                            currentY = 10;
                        } else {
                            pdf.addPage();
                            currentY = 10;
                        }
                    }

                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    pdf.text("Drawing / Notes:", 10, currentY);
                    currentY += 5;

                    pdf.addImage(drawingImgData, 'PNG', 10, currentY, dWidth, dHeight);
                    currentY += dHeight + 10;
                } else {
                    currentY += 10;
                }

                // Separator
                pdf.setDrawColor(200);
                pdf.line(10, currentY, pageWidth - 10, currentY);
                currentY += 10;
            }

            pdf.save(`Session_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.dismiss(toastId);
            toast.success("Report Generated Successfully!");

        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Failed to generate report.");
        }
    };

    const currentQ = questions[currentIndex];
    const isDark = boardBackground === 'black';

    if (loading || !currentQ) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Preparing Studio...</p>
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
                            onClick={() => router.push('/problem-solving')}
                            className="bg-card/90 backdrop-blur shadow-sm hover:bg-card border border-border rounded-full pl-3 pr-4"
                        >
                            <LogOut className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-foreground">Exit</span>
                        </Button>
                        <div className="bg-card/90 backdrop-blur shadow-sm border border-border px-4 py-1.5 rounded-full flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">Q {currentIndex + 1} / {questions.length}</span>
                        </div>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-100 shadow-sm pointer-events-auto">
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Instructor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-sm font-bold text-green-800">{examName || "Session Mode"}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            {/* Clock Component */}
                            <div className="flex items-center gap-2 text-gray-600 font-medium font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                                <Clock className="w-3.5 h-3.5" />
                                <LiveClock />
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                    {currentIndex + 1} <span className="text-gray-400">/</span> {questions.length}
                                </span>
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
                {/* We rely on checking background via REF or just use default. 
                    Wait, if I don't pass backgroundColor prop, it won't update.
                    I need to Fix Toolbar to accept props for BG. 
                    For this step, I will replace the logic to use a ref-based approach or just re-add the state line I deleted? 
                    I deleted line 58-68. I will restore `boardBackground` next.
                */}
                <div className={`absolute inset-0 transition-none ${annotationMode ? 'z-30 pointer-events-auto' : 'z-0'}`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={annotationMode ? 'transparent' : boardBackground}
                    />
                </div>

                {/* 3. QUESTION OVERLAY */}
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`absolute top-24 left-0 sm:left-6 w-full sm:w-[500px] px-4 sm:px-0 pointer-events-auto flex flex-col max-h-[calc(100vh-160px)] ${annotationMode ? 'z-20 opacity-90' : 'z-20'}`}
                        >
                            <Card className={`shadow-none overflow-hidden flex flex-col rounded-2xl backdrop-blur-none ${isDark ? 'bg-transparent border-none text-white' : 'bg-card/95 border-border ring-1 ring-border shadow-2xl'}`}>
                                <div className={`px-6 py-4 flex justify-between items-start ${isDark ? 'bg-transparent border-b border-slate-700/50' : 'bg-muted/50 border-b border-border'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">{currentQ.subject}</span>
                                        </div>
                                        {currentQ.topic && (
                                            <span className={`text-xs truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>{currentQ.topic}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {currentQ.status === 'correct' && <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Correct</Badge>}
                                        {currentQ.status === 'wrong' && <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Wrong</Badge>}
                                        {currentQ.status === 'unanswered' && <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">Not Answered</Badge>}
                                        <Badge variant="outline" className={`border-0 ${currentQ.difficulty === 'HARD' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {currentQ.difficulty}
                                        </Badge>
                                    </div>
                                </div>

                                <div className={`p-6 relative custom-scrollbar ${annotationMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                    <h3 className={`text-xl font-medium leading-relaxed max-w-3xl ${isDark ? 'text-indigo-50 font-semibold' : 'text-slate-800'}`}>
                                        <UniversalMathJax inline dynamic>
                                            {cleanupMath(currentQ.questionText)}
                                        </UniversalMathJax>
                                    </h3>

                                    <div className="mt-8 space-y-4">
                                        {currentQ.type === 'MCQ' && currentQ.options && (
                                            <div className="grid gap-3">
                                                {currentQ.options.map((opt, idx) => {
                                                    const isSelected = selectedOption === idx;
                                                    const isCorrect = opt.isCorrect;

                                                    // Review Mode Logic
                                                    const reviewStatus = currentQ.status; // 'correct' | 'wrong' | 'unanswered'
                                                    const isUserSelected = currentQ.userAnswer === idx; // Use loose equality just in case string/number mixup, but strictly typed here

                                                    // Base Style
                                                    let statusClass = isDark
                                                        ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                                                        : "border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20";

                                                    // Interaction State (Standard)
                                                    if (isSelected) {
                                                        statusClass = isDark
                                                            ? "bg-indigo-900/40 border-indigo-500/30 ring-1 ring-indigo-500/30"
                                                            : "bg-primary/10 border-primary/20 ring-1 ring-primary/20";
                                                    }

                                                    // REVEAL LOGIC (Standard or Review)
                                                    // Show solution if: 
                                                    // 1. isAnswerChecked is true (User clicked Check Answer)
                                                    // 2. OR Review Mode AND The *User's Choice* was Correct (Auto-reveal if they got it right)
                                                    const shouldReveal = isAnswerChecked || (reviewStatus === 'correct');

                                                    if (shouldReveal) {
                                                        if (isCorrect) statusClass = isDark ? "bg-green-900/30 border-green-500/30" : "bg-green-500/10 border-green-500/20 ring-1 ring-green-500/20";
                                                        else if (isSelected) statusClass = isDark ? "bg-red-900/30 border-red-500/30 opacity-60" : "bg-red-500/10 border-red-500/20 ring-1 ring-red-500/20 opacity-60";
                                                        else statusClass = isDark ? "bg-slate-800/20 opacity-50" : "bg-muted/30 opacity-50";
                                                    }
                                                    // Review Mode: WRONG Answer State (Before Reveal)
                                                    // If user got it wrong, show their WRONG selection in RED immediately, but keep Correct hidden.
                                                    else if (reviewStatus === 'wrong' && isUserSelected) {
                                                        statusClass = isDark ? "bg-red-900/40 border-red-500/50 ring-1 ring-red-500/50" : "bg-red-100 border-red-400 ring-1 ring-red-400";
                                                    }
                                                    // Review Mode: Unselected or 'Hidden Correct' options
                                                    else if (reviewStatus) {
                                                        statusClass = isDark ? "opacity-60" : "opacity-60 grayscale";
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                if (annotationMode || reviewStatus) return; // Disable changing answer
                                                                if (!shouldReveal) setSelectedOption(idx);
                                                            }}
                                                            className={`
                                                  p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                                                  ${annotationMode || reviewStatus ? '' : 'cursor-pointer'}
                                                  ${annotationMode ? 'cursor-crosshair' : ''}
                                                  ${statusClass}
                                              `}
                                                        >
                                                            <div className={`
                                                  shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                  ${isSelected || (reviewStatus && isUserSelected) ? 'bg-primary text-white' : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-muted text-muted-foreground')}
                                                  ${shouldReveal && isCorrect ? '!bg-green-500 !text-white' : ''}
                                                  ${shouldReveal && isSelected && !isCorrect ? '!bg-red-500 !text-white' : ''}
                                                  ${(!shouldReveal && reviewStatus === 'wrong' && isUserSelected) ? '!bg-red-500 !text-white' : ''}
                                              `}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className={`text-lg w-full ${isDark ? 'text-gray-100' : 'text-foreground'}`}>
                                                                    <UniversalMathJax inline dynamic>
                                                                        {cleanupMath(opt.text)}
                                                                    </UniversalMathJax>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {currentQ.type === 'CQ' && Array.isArray(currentQ.subQuestions) && (
                                            <div className="space-y-6 mt-4">
                                                {currentQ.subQuestions.map((sub: any, idx: number) => (
                                                    <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                                        <div className="flex gap-3 items-start">
                                                            <span className="font-bold text-indigo-600 flex-shrink-0">({String.fromCharCode(97 + idx)})</span>
                                                            <div className="flex-1 text-sm font-medium leading-relaxed">
                                                                <UniversalMathJax inline dynamic>{sub.question || sub.text}</UniversalMathJax>
                                                            </div>
                                                        </div>

                                                        {(isAnswerChecked || currentQ.status === 'correct') && (sub.answer || sub.modelAnswer) && (
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
                                    </div>

                                    {/* Check Answer Button: Show if NOT revealed yet */}
                                    {(!isAnswerChecked && currentQ.status !== 'correct') && (currentQ.type === 'MCQ' || currentQ.type === 'CQ' || currentQ.type === 'SQ') && (
                                        <Button
                                            onClick={() => setIsAnswerChecked(true)}
                                            disabled={currentQ.type === 'MCQ' && selectedOption === null && !currentQ.status}
                                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {currentQ.type === 'CQ' || currentQ.type === 'SQ' ? "Reveal Model Answer" : (currentQ.status ? "Show Correct Answer" : "Check Answer")}
                                        </Button>
                                    )}

                                    {(isAnswerChecked || currentQ.status === 'correct') && (currentQ.options?.some(o => o.isCorrect && o.explanation) || currentQ.modelAnswer) && (
                                        <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                            <h4 className="font-bold text-indigo-500 flex items-center gap-2">
                                                <Star className="w-4 h-4" /> {currentQ.type === 'CQ' || currentQ.type === 'SQ' ? 'Model Answer' : 'Explanation'}
                                            </h4>
                                            <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm">
                                                <UniversalMathJax dynamic>
                                                    {cleanupMath(renderDynamicExplanation(
                                                        currentQ.type === 'MCQ'
                                                            ? (currentQ.options?.find(o => o.isCorrect)?.explanation || "No explanation provided.")
                                                            : (currentQ.modelAnswer || "No model answer provided."),
                                                        currentQ.options,
                                                        currentQ.type,
                                                        currentQ.rightColumn
                                                    ))}
                                                </UniversalMathJax>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

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



// Live Clock Component (Client Only)
function LiveClock() {
    const [time, setTime] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!isMounted || !time) return <span className="opacity-0">00:00:00</span>;

    return <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
}
