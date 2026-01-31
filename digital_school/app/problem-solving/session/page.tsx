"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, PenTool, Eraser, Move,
    RotateCcw, Undo, Redo, Share, Printer, Eye, Lock, Unlock,
    CheckCircle, XCircle, MoreVertical, Settings, LogOut, Maximize2, Minimize2,
    Highlighter, Minus, MousePointer2, ZoomIn, ZoomOut, Grid3X3, Sun, Moon,
    Clock, User, Presentation, Layout, Download, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import SmartBoard, { SmartBoardRef, ToolType } from "@/app/components/SmartBoard";
import { toast } from "sonner";
import { cleanupMath } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Board State
    const [boardTool, setBoardTool] = useState<ToolType>('pen');
    const [boardColor, setBoardColor] = useState('#000000');
    const [boardSize, setBoardSize] = useState(2);
    const [boardBackground, setBoardBackground] = useState<'white' | 'black' | 'grid'>('white');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [annotationMode, setAnnotationMode] = useState(false);

    // Persistence
    const [boardHistories, setBoardHistories] = useState<Record<string, any[]>>({});

    // Interaction State
    const [showAnswer, setShowAnswer] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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
                const storedIds = localStorage.getItem("problem-solving-session");

                const res = await fetch('/api/questions');
                const data = await res.json();

                let sessionQuestions: Question[] = [];
                // If ids exist, can filter. For now just load all or check logic.
                const ids = storedIds ? JSON.parse(storedIds) : [];
                if (ids.length > 0) {
                    sessionQuestions = data.questions.filter((q: Question) => ids.includes(q.id));
                } else {
                    sessionQuestions = data.questions || [];
                }

                if (sessionQuestions.length === 0) {
                    toast.error("Questions not found");
                    router.push("/problem-solving");
                    return;
                }

                // 1. Shuffle Questions Order
                sessionQuestions = shuffleArray(sessionQuestions);

                // 2. Shuffle Options for each MCQ
                sessionQuestions = sessionQuestions.map((q: Question) => {
                    if (q.type === 'MCQ' && q.options && q.options.length > 0) {
                        return {
                            ...q,
                            options: shuffleArray(q.options)
                        };
                    }
                    return q;
                });

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
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            setTimeout(() => restoreBoardState(nextIndex), 0);
        }
    };

    const handlePrev = () => {
        saveCurrentBoardState();
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
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

    const toggleTool = (t: ToolType) => {
        setBoardTool(t);
        boardRef.current?.setTool(t);
    };

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
                            className="bg-white/90 backdrop-blur shadow-sm hover:bg-white border border-gray-100 rounded-full pl-3 pr-4"
                        >
                            <LogOut className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-700">Exit</span>
                        </Button>
                        <div className="bg-white/90 backdrop-blur shadow-sm border border-gray-100 px-4 py-1.5 rounded-full flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-800">Q {currentIndex + 1} / {questions.length}</span>
                        </div>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-100 shadow-sm pointer-events-auto">
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Instructor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-mono font-medium text-gray-700">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button
                            variant={annotationMode ? "default" : "secondary"}
                            size="sm"
                            onClick={() => setAnnotationMode(!annotationMode)}
                            className={`rounded-full shadow-sm transition-all ${annotationMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white/90 text-gray-600'}`}
                        >
                            {annotationMode ? <PenTool className="w-4 h-4 mr-2" /> : <MousePointer2 className="w-4 h-4 mr-2" />}
                            {annotationMode ? "Annotating Over" : "Interact"}
                        </Button>

                        <div className="h-6 w-px bg-gray-300/50 mx-1"></div>

                        <Button variant="ghost" size="icon" onClick={() => setShowOverlay(!showOverlay)} className="bg-white/80 hover:bg-white rounded-full">
                            {showOverlay ? <Eye className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleExportPDF} className="bg-white/80 hover:bg-white rounded-full">
                            <FileDown className="w-5 h-5 text-gray-600" />
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
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`absolute top-24 left-6 w-[480px] pointer-events-auto flex flex-col max-h-[calc(100vh-160px)] ${annotationMode ? 'z-20 opacity-90' : 'z-20'}`}
                        >
                            <Card className={`shadow-2xl shadow-black/20 overflow-hidden flex flex-col rounded-2xl ring-1 ring-white/10 backdrop-blur-xl ${isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-white/40 text-gray-900'}`}>
                                <div className={`px-6 py-4 flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-b border-slate-700' : 'bg-gray-50/50 border-b border-gray-100/50'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{currentQ.subject}</span>
                                        </div>
                                        {currentQ.topic && (
                                            <span className={`text-xs truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{currentQ.topic}</span>
                                        )}
                                    </div>
                                    <Badge variant="outline" className={`border-0 ${currentQ.difficulty === 'HARD' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {currentQ.difficulty}
                                    </Badge>
                                </div>

                                <div className={`p-6 relative custom-scrollbar ${annotationMode ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                    <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                                        <MathJax dynamic inline>{cleanupMath(currentQ.questionText)}</MathJax>
                                    </h2>

                                    <div className="mt-8 space-y-4">
                                        {currentQ.type === 'MCQ' && currentQ.options && (
                                            <div className="grid gap-3">
                                                {currentQ.options.map((opt, idx) => {
                                                    const isSelected = selectedOption === idx;
                                                    const isCorrect = opt.isCorrect;

                                                    let statusClass = isDark
                                                        ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                                                        : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-indigo-100";

                                                    if (isSelected) {
                                                        statusClass = isDark
                                                            ? "bg-indigo-900/40 border-indigo-500/30 ring-1 ring-indigo-500/30"
                                                            : "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200";
                                                    }

                                                    if (isAnswerChecked) {
                                                        if (isCorrect) statusClass = isDark ? "bg-green-900/30 border-green-500/30" : "bg-green-50 border-green-200 ring-1 ring-green-200";
                                                        else if (isSelected) statusClass = isDark ? "bg-red-900/30 border-red-500/30 opacity-60" : "bg-red-50 border-red-200 ring-1 ring-red-200 opacity-60";
                                                        else statusClass = isDark ? "bg-slate-800/20 opacity-50" : "bg-gray-50 opacity-50";
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                if (annotationMode) return;
                                                                if (!isAnswerChecked) setSelectedOption(idx);
                                                            }}
                                                            className={`
                                                  p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                                                  ${annotationMode ? 'cursor-crosshair' : 'cursor-pointer'}
                                                  ${statusClass}
                                              `}
                                                        >
                                                            <div className={`
                                                  shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                  ${isSelected ? 'bg-indigo-600 text-white' : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-500')}
                                                  ${isAnswerChecked && isCorrect ? '!bg-green-500 !text-white' : ''}
                                              `}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <span className="font-medium text-foreground text-lg w-full">
                                                                <MathJax dynamic inline>{cleanupMath(opt.text)}</MathJax>
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {!isAnswerChecked && currentQ.type === 'MCQ' && (
                                        <Button onClick={() => setIsAnswerChecked(true)} disabled={selectedOption === null} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">
                                            Check Answer
                                        </Button>
                                    )}
                                    {isAnswerChecked && (
                                        <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                            <h4 className="font-bold text-indigo-500 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Explanation
                                            </h4>
                                            <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm">
                                                <MathJax dynamic>{currentQ.options?.find(o => o.isCorrect)?.explanation || "No explanation provided."}</MathJax>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. FLOATING TOOLBAR */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 no-print">

                    {/* Size Slider Popover (Always visible if pen/eraser selected) */}
                    {(boardTool === 'pen' || boardTool === 'eraser' || boardTool === 'highlighter') && (
                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-100 mb-2 w-48 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full bg-black`} style={{ width: Math.max(2, boardSize / 2), height: Math.max(2, boardSize / 2), backgroundColor: boardTool === 'eraser' ? '#000' : boardColor }}></div>
                            <Slider
                                value={[boardSize]}
                                min={1} max={20} step={1}
                                onValueChange={(vals) => updateSize(vals[0])}
                                className="flex-1"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100 scale-90 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.undo()}><Undo className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.redo()}><Redo className="w-4 h-4" /></Button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomOut()}><ZoomOut className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.resetView()}><Layout className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomIn()}><ZoomIn className="w-4 h-4" /></Button>
                    </div>

                    <div className="flex items-center gap-1 p-2 bg-white/95 backdrop-blur-xl shadow-2xl shadow-indigo-900/20 border border-white/50 rounded-full">
                        <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-full hover:bg-gray-100">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-1">
                            <ToolBtn active={boardTool === 'move'} onClick={() => toggleTool('move')} icon={<Move className="w-5 h-5" />} tooltip="Pan" />
                            <ToolBtn active={boardTool === 'pen'} onClick={() => toggleTool('pen')} icon={<PenTool className="w-5 h-5" />} tooltip="Pen" />
                            <ToolBtn active={boardTool === 'highlighter'} onClick={() => toggleTool('highlighter')} icon={<Highlighter className="w-5 h-5" />} tooltip="Highlighter" />
                            <ToolBtn active={boardTool === 'eraser'} onClick={() => toggleTool('eraser')} icon={<Eraser className="w-5 h-5" />} tooltip="Eraser" />
                            <ToolBtn active={boardTool === 'laser'} onClick={() => toggleTool('laser')} icon={<MousePointer2 className="w-5 h-5 text-red-500" />} tooltip="Laser Pointer" />
                        </div>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-2 px-2">
                            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setBoardColor(c);
                                        boardRef.current?.setColor(c);
                                        setBoardTool('pen');
                                        boardRef.current?.setTool('pen');
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${boardColor === c && boardTool === 'pen' ? 'border-indigo-600 scale-125 ring-2 ring-indigo-200' : 'border-gray-200 hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        <Button variant="ghost" size="icon" onClick={toggleBackground} className="rounded-full hover:bg-gray-100">
                            {boardBackground === 'white' && <Sun className="w-5 h-5 text-yellow-500" />}
                            {boardBackground === 'black' && <Moon className="w-5 h-5 text-indigo-400" />}
                            {boardBackground === 'grid' && <Grid3X3 className="w-5 h-5 text-gray-400" />}
                        </Button>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentIndex === questions.length - 1} className="rounded-full hover:bg-gray-100">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

            </div>
        </MathJaxContext>
    );
}

const ToolBtn = ({ active, onClick, icon, tooltip }: { active: boolean, onClick: () => void, icon: React.ReactNode, tooltip: string }) => (
    <Button
        variant={active ? "default" : "ghost"}
        size="icon"
        onClick={onClick}
        className={`rounded-full transition-all ${active ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md scale-110' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
        title={tooltip}
    >
        {icon}
    </Button>
);
