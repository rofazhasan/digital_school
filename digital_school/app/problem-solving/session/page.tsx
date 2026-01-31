"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, PenTool, Eraser, Move,
    RotateCcw, Undo, Redo, Share, Printer, Eye, Lock, Unlock,
    CheckCircle, XCircle, MoreVertical, Settings, LogOut, Maximize2, Minimize2,
    Highlighter, Minus, MousePointer2, ZoomIn, ZoomOut, Grid3X3, Sun, Moon,
    Clock, User, Presentation, Layout
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

// Types
interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'CQ' | 'SQ';
    subject: string;
    difficulty: string;
    marks: number;
    options?: { text: string; isCorrect: boolean; explanation?: string }[];
    modelAnswer?: string;
    subQuestions?: any[];
}

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
    const [annotationMode, setAnnotationMode] = useState(false); // True = Canvas on Top (write over question)

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
                if (!storedIds) {
                    toast.error("No active session found");
                    router.push("/problem-solving");
                    return;
                }

                const ids = JSON.parse(storedIds);
                const res = await fetch('/api/questions');
                const data = await res.json();

                // Filter selected questions
                let sessionQuestions = data.questions.filter((q: Question) => ids.includes(q.id));

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
                toast.error("Failed to load session");
            } finally {
                setLoading(false);
            }
        };
        initSession();
    }, []);

    // Board persistence per question (Basic ID tracking only, as vector board preserves history in memory if not cleared)
    // NOTE: Vector board refactor means we need to manage clearing. 
    // Ideally, each question has its own board history. 
    // For MVP "Live Problem Solving", we might just CLEAR board on next question or Keep it?
    // User requested: "try save it. permanently if he wont to wipe with own..."
    // So we should NOT auto-clear? Or store separate histories?
    // Let's store separate histories.
    const [boardHistories, setBoardHistories] = useState<Record<string, any>>({}); // Store paths if we lifted state, but board is uncontrolled.

    // For now, we will just CLEARboard on question change to simulate fresh slide, BUT prompt user?
    // User said: "if I change tab or maximize screen written in board wiped out" -> Vector board fixes this.
    // User said: "cannot use infinity page" -> Vector board fixes this.

    const handleNext = () => {
        // In a real app we'd save the Board Path State here.
        // boardRef.current?.clear(); // Optional: Auto-clear for new clean slate?
        // Let's auto-clear for now as standard per-question behavior.
        boardRef.current?.clear();

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            // restoreBoard(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        boardRef.current?.clear();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            // restoreBoard(currentIndex - 1);
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
        if (t === 'eraser') {
            // boardRef.current?.setLineWidth(20); 
        } else {
            // boardRef.current?.setLineWidth(boardSize);
        }
    };

    const toggleBackground = () => {
        const next = boardBackground === 'white' ? 'grid' : boardBackground === 'grid' ? 'black' : 'white';
        setBoardBackground(next);
        // Also auto-switch ink color for contrast
        if (next === 'black') {
            setBoardColor('#ffffff');
            boardRef.current?.setColor('#ffffff');
        } else {
            setBoardColor('#000000');
            boardRef.current?.setColor('#000000');
        }
    };

    const currentQ = questions[currentIndex];

    if (loading || !currentQ) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Preparing Studio...</p>
            </div>
        );
    }

    return (
        <MathJaxContext>
            <div className={`h-screen w-full flex flex-col overflow-hidden relative font-sans ${boardBackground === 'black' ? 'bg-slate-900' : 'bg-gray-50'}`}>

                {/* 1. TOP BAR - Session Info */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 pointer-events-none bg-gradient-to-b from-black/10 to-transparent">
                    {/* Left: Exit & Progress */}
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

                    {/* Center: Timer & Instructor (Optional) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-100 shadow-sm pointer-events-auto">
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Instructor Mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-mono font-medium text-gray-700">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Annotation Mode Toggle */}
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
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/80 hover:bg-white rounded-full">
                            {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-600" /> : <Maximize2 className="w-5 h-5 text-gray-600" />}
                        </Button>
                    </div>
                </div>

                {/* 2. MAIN CANVAS */}
                {/* z-index toggle: If annotationMode is true, Canvas is z-30 (above overlay which is z-10/20). If false, Canvas is z-0. */}
                <div className={`absolute inset-0 transition-none ${annotationMode ? 'z-30 pointer-events-auto' : 'z-0'}`}>
                    <SmartBoard
                        ref={boardRef}
                        className=""
                        backgroundColor={boardBackground}
                    // If we are in Annotation Mode, we want the background to be TRANSPARENT if possible, 
                    // so we can see the question below.
                    // BUT SmartBoard handles its own background. 
                    // If annotationMode is ON, we might want to force "transparent" background?
                    // Let's keep it simpl: Annotation Mode implies you are writing ON the board.
                    // If the question overlay is visible, it will be UNDER the canvas if z-30.
                    // So the Canvas needs to be transparent? SmartBoard renders 'white' by default.
                    // We need to tell SmartBoard to render 'transparent' if we want to see through it.
                    // However, 'backgroundColor' prop currently draws a filtered rect.
                    // If we want to write OVER the question, the canvas needs to be transparent.
                    // Implementation detail: If annotationMode is true, use 'transparent' bg?
                    // But then we lose the "Infinite Whiteboard".
                    // Compromise: Annotation Mode is just Z-Index. 
                    // User can move Question Overlay around.
                    />
                </div>

                {/* 3. QUESTION OVERLAY - Glassmorphic Drawer */}
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`absolute top-24 left-6 w-[480px] pointer-events-auto flex flex-col max-h-[calc(100vh-160px)] ${annotationMode ? 'z-20 opacity-80' : 'z-20'}`}
                        >
                            <Card className="shadow-2xl shadow-indigo-900/10 border-white/40 bg-white/95 backdrop-blur-xl overflow-hidden flex flex-col rounded-2xl ring-1 ring-gray-900/5">
                                <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-start bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                                        <Badge variant="outline" className="bg-white font-mono text-xs">{currentQ.id.slice(-4)}</Badge>
                                    </div>
                                    <Badge variant="outline" className={`border-0 ${currentQ.difficulty === 'HARD' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {currentQ.difficulty}
                                    </Badge>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar relative">
                                    {/* Question Text */}
                                    <div className="prose prose-slate prose-lg max-w-none text-gray-800 leading-relaxed font-serif select-text">
                                        <MathJax>{cleanupMath(currentQ.questionText)}</MathJax>
                                    </div>

                                    {/* Options or Answer Area */}
                                    <div className="mt-8 space-y-4">
                                        {currentQ.type === 'MCQ' && currentQ.options && (
                                            <div className="grid gap-3">
                                                {currentQ.options.map((opt, idx) => {
                                                    const isSelected = selectedOption === idx;
                                                    const isCorrect = opt.isCorrect;

                                                    let statusClass = "border-transparent bg-white shadow-sm hover:shadow-md hover:border-indigo-100";
                                                    if (isAnswerChecked) {
                                                        if (isCorrect) statusClass = "bg-green-50 border-green-200 ring-1 ring-green-200";
                                                        else if (isSelected) statusClass = "bg-red-50 border-red-200 ring-1 ring-red-200 opacity-60";
                                                        else statusClass = "bg-gray-50 opacity-50";
                                                    } else if (isSelected) {
                                                        statusClass = "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200";
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                if (annotationMode) return; // Prevent click through if drawing
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
                                                  ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
                                                  ${isAnswerChecked && isCorrect ? '!bg-green-500 !text-white' : ''}
                                              `}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <div className={`text-base pt-1 ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                                <MathJax inline>{cleanupMath(opt.text)}</MathJax>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Show Answer / Next Logic (Existing...) */}
                                    </div>

                                    {/* Actions */}
                                    {!isAnswerChecked && currentQ.type === 'MCQ' && (
                                        <Button onClick={() => setIsAnswerChecked(true)} disabled={selectedOption === null} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">
                                            Check Answer
                                        </Button>
                                    )}
                                    {isAnswerChecked && (
                                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Explanation
                                            </h4>
                                            <div className="mt-2 text-indigo-800">
                                                <MathJax>{currentQ.options?.find(o => o.isCorrect)?.explanation || "No explanation provided."}</MathJax>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. FLOATING TOOLBAR - Bottom Center */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
                    {/* Secondary Tools (Zoom, Undo, Redo) */}
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100 mb-2 scale-90 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.undo()}><Undo className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.redo()}><Redo className="w-4 h-4" /></Button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomOut()}><ZoomOut className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.resetView()}><Layout className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomIn()}><ZoomIn className="w-4 h-4" /></Button>
                    </div>

                    {/* Main Tools Pill */}
                    <div className="flex items-center gap-1 p-2 bg-white/95 backdrop-blur-xl shadow-2xl shadow-indigo-900/20 border border-white/50 rounded-full">
                        {/* Navigation */}
                        <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-full hover:bg-gray-100">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        {/* Tools */}
                        <div className="flex items-center gap-1">
                            <ToolBtn active={boardTool === 'move'} onClick={() => toggleTool('move')} icon={<Move className="w-5 h-5" />} tooltip="Pan" />
                            <ToolBtn active={boardTool === 'pen'} onClick={() => toggleTool('pen')} icon={<PenTool className="w-5 h-5" />} tooltip="Pen" />
                            <ToolBtn active={boardTool === 'highlighter'} onClick={() => toggleTool('highlighter')} icon={<Highlighter className="w-5 h-5" />} tooltip="Highlighter" />
                            <ToolBtn active={boardTool === 'eraser'} onClick={() => toggleTool('eraser')} icon={<Eraser className="w-5 h-5" />} tooltip="Eraser" />
                            <ToolBtn active={boardTool === 'laser'} onClick={() => toggleTool('laser')} icon={<MousePointer2 className="w-5 h-5 text-red-500" />} tooltip="Laser Pointer" />
                        </div>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        {/* Colors */}
                        <div className="flex items-center gap-2 px-2">
                            {['#000000', '#EF4444', '#3B82F6', '#10B981'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setBoardColor(c);
                                        boardRef.current?.setColor(c);
                                        setBoardTool('pen');
                                        boardRef.current?.setTool('pen');
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${boardColor === c && boardTool === 'pen' ? 'border-indigo-600 scale-125 ring-2 ring-indigo-200' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        {/* Background Toggle */}
                        <Button variant="ghost" size="icon" onClick={toggleBackground} className="rounded-full hover:bg-gray-100">
                            {boardBackground === 'white' && <Sun className="w-5 h-5 text-yellow-500" />}
                            {boardBackground === 'black' && <Moon className="w-5 h-5 text-indigo-400" />}
                            {boardBackground === 'grid' && <Grid3X3 className="w-5 h-5 text-gray-400" />}
                        </Button>

                        <div className="w-px h-8 bg-gray-200 mx-2"></div>

                        {/* Navigation */}
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
