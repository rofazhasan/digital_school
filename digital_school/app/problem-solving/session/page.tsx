"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, PenTool, Eraser, Move,
    RotateCcw, Undo, Redo, Share, Printer, Eye, Lock, Unlock,
    CheckCircle, XCircle, MoreVertical, Settings, LogOut, Maximize2, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import SmartBoard, { SmartBoardRef } from "@/app/components/SmartBoard";
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

    // Board State
    const [boardTool, setBoardTool] = useState<'pen' | 'eraser' | 'move'>('pen');
    const [boardColor, setBoardColor] = useState('#000000');
    const [boardSize, setBoardSize] = useState(2);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Interaction State
    const [showAnswer, setShowAnswer] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

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

    // Board persistence per question
    const [boardSavedStates, setBoardSavedStates] = useState<Record<string, string>>({});

    const saveCurrentBoard = () => {
        if (boardRef.current && questions[currentIndex]) {
            const dataUrl = boardRef.current.toDataURL();
            setBoardSavedStates(prev => ({
                ...prev,
                [questions[currentIndex].id]: dataUrl
            }));
        }
    };

    const restoreBoard = (idx: number) => {
        boardRef.current?.clear();
        // Logic to restore 'dataUrl' would go here if SmartBoard supported 'loadFromURL'
        // For now, we clear to simulate fresh page or "infinite" scroll effect
    };

    const handleNext = () => {
        saveCurrentBoard();
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            restoreBoard(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        saveCurrentBoard();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            restoreBoard(currentIndex - 1);
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
            <div className="h-screen w-full flex flex-col bg-white overflow-hidden relative font-sans">

                {/* 1. TOP BAR - Minimalist */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pointer-events-none">
                    {/* Left: Back & Info */}
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
                            <span className="text-sm font-semibold text-gray-800">Question {currentIndex + 1}</span>
                            <span className="text-xs text-gray-400">/ {questions.length}</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button variant="ghost" size="icon" onClick={() => setShowOverlay(!showOverlay)} className="bg-white/80 hover:bg-white rounded-full">
                            {showOverlay ? <Eye className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/80 hover:bg-white rounded-full">
                            {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-600" /> : <Maximize2 className="w-5 h-5 text-gray-600" />}
                        </Button>
                    </div>
                </div>

                {/* 2. MAIN CANVAS */}
                <div className="absolute inset-0 z-0">
                    <SmartBoard ref={boardRef} className="bg-white cursor-crosshair" />
                </div>

                {/* 3. QUESTION OVERLAY - Glassmorphic Drawer */}
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute top-20 left-6 w-[480px] z-10 pointer-events-auto flex flex-col max-h-[calc(100vh-140px)]"
                        >
                            <Card className="shadow-2xl shadow-indigo-900/10 border-white/40 bg-white/90 backdrop-blur-xl overflow-hidden flex flex-col rounded-2xl ring-1 ring-gray-900/5">
                                <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-start bg-white/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-indigo-600 hover:bg-indigo-700">{currentQ.type}</Badge>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentQ.subject}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`border-0 ${currentQ.difficulty === 'HARD' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {currentQ.difficulty}
                                    </Badge>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    {/* Question Text */}
                                    <div className="prose prose-slate prose-lg max-w-none text-gray-800 leading-relaxed font-serif">
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
                                                            onClick={() => !isAnswerChecked && setSelectedOption(idx)}
                                                            className={`
                                                  p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 group
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

                                        {/* SubQuestions */}
                                        {currentQ.type === 'CQ' && currentQ.subQuestions && (
                                            <div className="space-y-4">
                                                {currentQ.subQuestions.map((sq: any, i: number) => (
                                                    <div key={i} className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                                            <span>Part {String.fromCharCode(97 + i)}</span>
                                                            <span>{sq.marks} MARKS</span>
                                                        </div>
                                                        <div className="text-gray-800 font-medium">
                                                            <MathJax inline>{cleanupMath(sq.question)}</MathJax>
                                                        </div>
                                                        {showAnswer && sq.modelAnswer && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                className="mt-3 text-sm text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100"
                                                            >
                                                                {sq.modelAnswer}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Explanation Footer */}
                                <AnimatePresence>
                                    {showAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="bg-amber-50/80 backdrop-blur border-t border-amber-200/50 p-5"
                                        >
                                            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2 uppercase tracking-wide">
                                                <Lock className="w-3 h-3" /> Teacher's Explanation
                                            </div>
                                            <div className="text-amber-900 text-sm leading-relaxed">
                                                {currentQ.type === 'MCQ' && currentQ.options?.find(o => o.isCorrect)?.explanation}
                                                {currentQ.type === 'SQ' && currentQ.modelAnswer}
                                                {(!currentQ.options && !currentQ.modelAnswer) && "No detailed explanation available."}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Actions */}
                                <div className="p-4 bg-white/50 backdrop-blur border-t border-gray-100 flex gap-3">
                                    {currentQ.type === 'MCQ' ? (
                                        !isAnswerChecked ? (
                                            <Button
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                                                onClick={() => setIsAnswerChecked(true)}
                                                disabled={selectedOption === null}
                                            >
                                                Check Answer
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                                onClick={() => setShowAnswer(!showAnswer)}
                                            >
                                                {showAnswer ? 'Hide Details' : 'View Explanation'}
                                            </Button>
                                        )
                                    ) : (
                                        <Button
                                            className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                            onClick={() => setShowAnswer(!showAnswer)}
                                        >
                                            {showAnswer ? 'Hide Solution' : 'Reveal Solution'}
                                        </Button>
                                    )}
                                </div>
                            </Card>

                            {/* Navigation Pills */}
                            <div className="flex justify-between mt-4 px-2">
                                <Button
                                    variant="ghost"
                                    className="bg-white/80 hover:bg-white text-gray-600 shadow-sm backdrop-blur rounded-full px-6"
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                </Button>
                                <Button
                                    className="bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/20 rounded-full px-6"
                                    onClick={handleNext}
                                    disabled={currentIndex === questions.length - 1}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. FLOATING TOOLBAR - iOS Style */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-900/20 border border-white/50 p-2 rounded-full flex items-center gap-2 ring-1 ring-black/5 scale-110">
                        {/* Undo/Redo Group */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            <Button variant="ghost" size="icon" onClick={() => boardRef.current?.undo()} className="hover:bg-gray-100 rounded-full w-10 h-10">
                                <Undo className="w-5 h-5 text-gray-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => boardRef.current?.redo()} className="hover:bg-gray-100 rounded-full w-10 h-10">
                                <Redo className="w-5 h-5 text-gray-600" />
                            </Button>
                        </div>

                        {/* Tools Group */}
                        <div className="flex items-center gap-1 px-2">
                            <Button
                                variant={boardTool === 'pen' ? 'default' : 'ghost'}
                                size="icon"
                                onClick={() => { setBoardTool('pen'); boardRef.current?.setTool('pen'); }}
                                className={`w-12 h-12 rounded-full transition-all ${boardTool === 'pen' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-110' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <PenTool className="w-5 h-5" />
                            </Button>
                            <Button
                                variant={boardTool === 'eraser' ? 'default' : 'ghost'}
                                size="icon"
                                onClick={() => { setBoardTool('eraser'); boardRef.current?.setTool('eraser'); }}
                                className={`w-12 h-12 rounded-full transition-all ${boardTool === 'eraser' ? 'bg-slate-800 text-white shadow-lg scale-110' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Eraser className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Color Palette */}
                        <div className="flex items-center gap-2 px-2 border-l border-gray-200">
                            {['#000000', '#ef4444', '#22c55e', '#3b82f6'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setBoardColor(c); boardRef.current?.setColor(c); }}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${boardColor === c ? 'border-gray-900 scale-125' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </MathJaxContext>
    );
}
