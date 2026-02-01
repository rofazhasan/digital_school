"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { LogOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, MousePointer2, Eraser, Move, Palette, Save, Undo, Redo, Share2, FileDown, Layers, Layout, Video, Mic, Share, Settings, PenTool, User, X, Eye, Square, Circle, Triangle, Minus, Sun, Moon, Grid3X3, ArrowRight, Printer, Clock, Highlighter, Ruler, Box, BarChart2, CheckCircle, XCircle, Presentation, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import SmartBoard, { SmartBoardRef, ToolType, Stroke, getPathBoundingBox, exportPathsToImage } from "@/app/components/SmartBoard";
import { toast } from "sonner";

import { cleanupMath } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { SmartBoardToolbar } from "@/app/components/SmartBoardToolbar";


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

export default function ProblemSolvingSession() {
    const router = useRouter();
    const boardRef = useRef<SmartBoardRef>(null);

    // Session State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examName, setExamName] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showOverlay, setShowOverlay] = useState(true);
    const [annotationMode, setAnnotationMode] = useState(false); // Controls z-index of board vs overlay

    // --- Export Logic (react-to-print) ---
    const printRef = useRef<HTMLDivElement>(null);
    const handleExport = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Review_Session_${new Date().toISOString().slice(0, 10)}`,
    });

    const handleToggleAnnotation = () => {
        setAnnotationMode(prev => !prev);
    };
    const [boardBackground, setBoardBackground] = useState<'white' | 'black' | 'grid'>('white');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hiddenPDFContainerRef = useRef<HTMLDivElement>(null);

    // Persistence
    const [boardHistories, setBoardHistories] = useState<Record<string, any[]>>({});

    // Interaction State
    const [showAnswer, setShowAnswer] = useState(false);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // Timer (No Timer in Review)
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
    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         setElapsedTime(prev => prev + 1);
    //     }, 1000);
    //     return () => clearInterval(timer);
    // }, []);

    // Initialize (Review Only)
    useEffect(() => {
        const initSession = async () => {
            try {
                setLoading(true);
                // Load Review Data directly
                const storedIds = localStorage.getItem("review-session-data");

                if (!storedIds) {
                    toast.error("No review data found");
                    window.close(); // Or router.push
                    return;
                }

                // Handle new Object structure vs Legacy Array
                let sessionQuestions: Question[] = [];
                try {
                    const parsed = JSON.parse(storedIds);
                    if (Array.isArray(parsed)) {
                        sessionQuestions = parsed;
                    } else if (parsed && parsed.questions) {
                        sessionQuestions = parsed.questions;
                        if (parsed.examName) setExamName(parsed.examName);
                    }
                } catch (e) {
                    console.error("Data parse error", e);
                    localStorage.removeItem("review-session-data"); // Clear bad data
                    toast.error("Review data corrupted. Please start again.");
                    window.close();
                    return;
                }

                if (!sessionQuestions || sessionQuestions.length === 0) {
                    toast.error("Questions not found reviews");
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
        initSession();
    }, []);

    // Sync State with Question
    useEffect(() => {
        const q = questions[currentIndex];
        if (!q) return;

        // In Review Mode:
        // 1. Reset 'isChecked' (User must explicitly check for each question unless we want persistence)
        // 2. We do NOT pre-select based on their answer to avoid confusion with "Active Selection".
        //    Instead, we show "Your Answer" visually in the options list.

        setIsAnswerChecked(false);
        setSelectedOption(null); // Reset manual selection

        // Note: We don't need 'setShowAnswer' logic here as 'isAnswerChecked' controls the reveal.
    }, [currentIndex, questions]);

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
                // Dynamic import to avoid SSR crash
                const html2canvas = (await import('html2canvas')).default;
                const jsPDF = (await import('jspdf')).default;

                const canvas = await html2canvas(input, {
                    scale: 1.5, // Reduced from 2 to avoid memory crash
                    useCORS: true,
                    logging: false,
                    ignoreElements: (element) => element.classList.contains('no-print')
                });

                const imgData = canvas.toDataURL('image/png');
                // Calculate dimensions (Landscape)
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const pdf = new jsPDF('l', 'px', [imgWidth, imgHeight]);
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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

    // --- PDF Generation ---
    const generateSessionReport = async () => {
        if (!hiddenPDFContainerRef.current) return;

        const toastId = toast.loading('Generating PDF Report...');

        try {
            // Dynamic import to avoid SSR crash
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let currentY = 10; // Top margin

            // Title Page
            pdf.setFontSize(24);
            pdf.text("Review Session Report", pageWidth / 2, 40, { align: 'center' });
            pdf.setFontSize(14);
            pdf.text(new Date().toLocaleDateString(), pageWidth / 2, 50, { align: 'center' });
            pdf.text(`Total Questions: ${questions.length}`, pageWidth / 2, 60, { align: 'center' });

            pdf.addPage();
            currentY = 10;

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const paths = boardHistories[q.id] || [];

                // 1. Prepare DOM for Question Text & Options
                const container = hiddenPDFContainerRef.current;
                if (!container) continue;

                container.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = "p-8 bg-white text-black font-sans";
                wrapper.style.width = "794px"; // A4 Pixel Width

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
                        const label = String.fromCharCode(65 + idx);
                        const bgClass = isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-white border-gray-200 text-gray-600';

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

                htmlContent += `</div>`; // Close Wrapper
                wrapper.innerHTML = htmlContent;
                container.appendChild(wrapper);

                // 2. Render MathJax & TikZ
                if ((window as any).MathJax) {
                    try {
                        await (window as any).MathJax.typesetPromise([wrapper]);
                    } catch (e) { console.warn("MathJax typeset failed", e); }
                }

                // 3. Capture Question Image
                // Wait for MathJax
                await new Promise(resolve => setTimeout(resolve, 500)); // Give a tick for rendering

                const clone = wrapper.cloneNode(true) as HTMLElement;
                clone.style.position = 'fixed';
                clone.style.top = '0';
                clone.style.left = '0';
                clone.style.zIndex = '-100'; // Behind everything
                clone.style.visibility = 'visible'; // Must be visible for html2canvas
                clone.style.opacity = '1';
                clone.style.background = 'white';

                clone.style.pointerEvents = 'none'; // Prevent blocking clicks if leaked

                document.body.appendChild(clone);

                let qCanvas;
                try {
                    // Wait for clone to render 
                    await new Promise(r => setTimeout(r, 500));

                    qCanvas = await html2canvas(clone, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        height: clone.scrollHeight,
                        windowWidth: 1920
                    });
                } finally {
                    document.body.removeChild(clone); // Cleanup
                    container.innerHTML = ''; // Clear hidden container too
                }

                const qImgData = qCanvas.toDataURL('image/jpeg', 0.9);
                const qImgProps = pdf.getImageProperties(qImgData);
                const qImgHeight = (qImgProps.height * pageWidth) / qImgProps.width;

                if (currentY + qImgHeight > pageHeight - 10) {
                    pdf.addPage();
                    currentY = 10;
                }

                pdf.addImage(qImgData, 'JPEG', 0, currentY, pageWidth, qImgHeight);
                currentY += qImgHeight + 5;

                // 4. Capture Drawing
                // Assuming exportPathsToImage is imported from SmartBoard
                try {
                    const drawingImgData = await exportPathsToImage(paths, 20, false); // Always white background for PDF
                    if (drawingImgData) {
                        const dImgProps = pdf.getImageProperties(drawingImgData);
                        let dWidth = pageWidth - 20;
                        let dHeight = (dImgProps.height * dWidth) / dImgProps.width;

                        if (currentY + dHeight > pageHeight - 10) {
                            pdf.addPage();
                            currentY = 10;
                        }
                        pdf.text("Notes:", 10, currentY);
                        currentY += 5;
                        pdf.addImage(drawingImgData, 'PNG', 10, currentY, dWidth, dHeight);
                        currentY += dHeight + 10;
                    }
                } catch (e) { console.warn("Drawing export failed", e); }

                // Separator
                pdf.setDrawColor(200);
                pdf.line(10, currentY, pageWidth - 10, currentY);
                currentY += 10;
            }

            pdf.save(`Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.dismiss(toastId);
            toast.success("Report Generated!");

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
            <div className={`h-screen flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="font-medium">Loading Review...</p>
            </div>
        );
    }

    return (
        <MathJaxContext config={MATHJAX_CONFIG} version={3}>
            <div id="session-workspace" className={`h-screen w-full flex flex-col overflow-hidden relative font-sans ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>

                {/* 1. TOP BAR */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 pointer-events-none no-print">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <Button
                            variant="secondary" size="sm"
                            onClick={() => window.close()} // Close Tab
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
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-sm font-bold text-indigo-800 max-w-[200px] truncate">
                                {examName || "Review Mode"}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        {/* Clock Component */}
                        <div className="flex items-center gap-2 text-gray-600 font-medium font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                            <Clock className="w-3.5 h-3.5" />
                            <LiveClock />
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                Result: <span className={
                                    currentQ.status === 'correct' ? 'text-green-600 font-bold' :
                                        currentQ.status === 'wrong' ? 'text-red-600 font-bold' : 'text-violet-600 font-bold'
                                }>
                                    {currentQ.status ? currentQ.status.toUpperCase() : 'UNKNOWN'}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Right tools (Annotate, View, Export) */}
                        <Button variant="ghost" size="icon" onClick={() => setShowOverlay(!showOverlay)} className="bg-white/80 hover:bg-white rounded-full">
                            {showOverlay ? <Eye className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/80 hover:bg-white rounded-full">
                            {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-600" /> : <Maximize2 className="w-5 h-5 text-gray-600" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CANVAS (Unchanged) */}
            <div className="relative w-full h-full overflow-hidden" ref={printRef}>
                {/* 2. MAIN BOARD - Z-Index Flipped based on Annotation Mode */}
                <div className={`absolute inset-0 transition-all duration-300 ${annotationMode ? 'z-30 pointer-events-auto bg-transparent' : 'z-0'}`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={annotationMode ? 'transparent' : boardBackground}
                    />
                </div>

                {/* 3. QUESTION OVERLAY (Review Logic) */}
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`absolute top-24 left-6 w-[480px] flex flex-col max-h-[calc(100vh-160px)] ${annotationMode ? 'z-10 pointer-events-none opacity-50' : 'z-20 pointer-events-auto'}`}
                        >
                            <Card className={`shadow-2xl shadow-black/20 overflow-hidden flex flex-col rounded-2xl ring-1 ring-white/10 backdrop-blur-xl ${isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-white/40 text-gray-900'}`}>
                                <div className={`px-6 py-4 flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-b border-slate-700' : 'bg-gray-50/50 border-b border-gray-100/50'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{currentQ.subject}</span>
                                        </div>
                                        {currentQ.topic && (
                                            <span className={`text-xs truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{currentQ.topic}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Review Status Badge replacing Difficulty */}
                                        {currentQ.status === 'correct' && (
                                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 px-3 py-1 font-bold">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Correct
                                            </Badge>
                                        )}
                                        {currentQ.status === 'wrong' && (
                                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 px-3 py-1 font-bold">
                                                <XCircle className="w-3 h-3 mr-1" /> Wrong
                                            </Badge>
                                        )}
                                        {currentQ.status === 'unanswered' && (
                                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100 px-3 py-1 font-bold">
                                                Not Answered
                                            </Badge>
                                        )}
                                        {/* Optional: Keep Difficulty as tertiary info or remove if strictly replacing */}
                                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-100">
                                            {currentQ.marks} Marks
                                        </Badge>
                                    </div>
                                </div>

                                <div className={`p-6 relative custom-scrollbar ${annotationMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                    <h3 className={`text-xl font-medium leading-relaxed max-w-3xl ${isDark ? 'text-indigo-50 font-semibold' : 'text-slate-800'}`}>
                                        <UniversalMathJax inline dynamic>{cleanupMath(currentQ.questionText)}</UniversalMathJax>
                                    </h3>

                                    <div className="mt-8 space-y-4">
                                        {currentQ.type === 'MCQ' && currentQ.options && (
                                            <div className="grid gap-3">
                                                {currentQ.options.map((opt, idx) => {
                                                    const isCorrect = opt.isCorrect;
                                                    const isUserSelected = currentQ.userAnswer === idx;
                                                    const isSelected = selectedOption === idx; // Define Teacher Selection

                                                    // Visual State Logic for Review
                                                    // 1. Base: Neutral
                                                    // 2. UserSelected (Student): Blue Border "Your Answer"
                                                    // 3. CurrentSelection (Teacher): Highlighted Background

                                                    let statusClass = isDark
                                                        ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                                                        : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-indigo-100";

                                                    // Student Answer Indication (Always visible)
                                                    if (isUserSelected) {
                                                        statusClass = "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50";
                                                    }

                                                    // Teacher Selection Indication (Interactive)
                                                    if (isSelected) {
                                                        statusClass = isDark
                                                            ? "bg-indigo-900/60 border-indigo-500"
                                                            : "bg-indigo-50 border-indigo-300";
                                                    }

                                                    // REVEAL LOGIC
                                                    // Show solution if "Check Answer" is clicked
                                                    const shouldReveal = isAnswerChecked;

                                                    if (shouldReveal) {
                                                        // 1. Correct Answer: Always Green
                                                        if (isCorrect) {
                                                            statusClass = isDark ? "bg-green-900/30 border-green-500/50" : "bg-green-50 border-green-300 ring-1 ring-green-300";
                                                        }
                                                        // 2. Wrong Selection (Teacher or Student): Red
                                                        // Show Red if this specific option is selected AND wrong
                                                        else if ((isSelected || isUserSelected) && !isCorrect) {
                                                            statusClass = isDark ? "bg-red-900/30 border-red-500/50" : "bg-red-50 border-red-300 ring-1 ring-red-300 opacity-80";
                                                        }
                                                        else {
                                                            statusClass = isDark ? "bg-slate-800/20 opacity-50" : "bg-gray-50 opacity-50";
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                if (annotationMode || isAnswerChecked) return; // Only lock after check
                                                                setSelectedOption(idx); // Allow teacher to choose
                                                            }}
                                                            className={`
                                                                p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group cursor-pointer
                                                                ${statusClass}
                                                            `}
                                                        >
                                                            <div className={`
                                                                shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                                ${isSelected ? 'bg-indigo-600 text-white' : (isUserSelected ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-500')}
                                                                ${shouldReveal && isCorrect ? '!bg-green-600 !text-white !border-green-600' : ''}
                                                                ${shouldReveal && (isSelected || isUserSelected) && !isCorrect ? '!bg-red-600 !text-white !border-red-600' : ''}
                                                            `}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className={`text-lg w-full ${isDark ? 'text-gray-100' : 'text-foreground'}`}>
                                                                    <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                                                </span>
                                                                {isUserSelected && (
                                                                    <div className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1">
                                                                        <User className="w-3 h-3" /> Student Answer
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {shouldReveal && isCorrect && <CheckCircle className="w-6 h-6 text-green-600 drop-shadow-sm" />}
                                                            {shouldReveal && (isSelected || isUserSelected) && !isCorrect && <XCircle className="w-6 h-6 text-red-600 drop-shadow-sm" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons: Always allow check if not checked */}
                                    <div className="mt-6 flex gap-3 relative z-10">
                                        {!isAnswerChecked && currentQ.type === 'MCQ' && (
                                            <Button
                                                onClick={() => setIsAnswerChecked(true)}
                                                // Enable even if nothing selected (just to see answer)
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 py-6 text-lg tracking-wide font-semibold transform active:scale-95 transition-all"
                                            >
                                                {selectedOption !== null ? "Check My Selection" : "Show Correct Answer"}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Explanation */}
                                    <AnimatePresence>
                                        {isAnswerChecked && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className={`mt-4 overflow-hidden rounded-xl border ${isDark ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}
                                            >
                                                <div className="p-4">
                                                    <h4 className="font-bold text-indigo-500 flex items-center gap-2 mb-2">
                                                        <Presentation className="w-4 h-4" /> Explanation
                                                    </h4>
                                                    <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm leading-relaxed">
                                                        <UniversalMathJax dynamic>{currentQ.options?.find(o => o.isCorrect)?.explanation || "No explanation provided."}</UniversalMathJax>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                    bgMode={boardBackground}
                    onNavigateBg={handleToggleBackground}
                    isAnnotationMode={annotationMode}
                    onToggleAnnotation={handleToggleAnnotation}
                    onExport={() => handleExport()}
                />


                {/* Hidden Container for PDF Generation */}
                <div ref={hiddenPDFContainerRef} className="absolute top-0 left-[-9999px] w-[794px] opacity-0 pointer-events-none -z-50 bg-white"></div>
            </div>

        </MathJaxContext >
    );
}
