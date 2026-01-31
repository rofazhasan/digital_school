"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, PenTool, Eraser, Move,
    RotateCcw, Undo, Redo, Share, Printer, Eye, Lock, Unlock,
    CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import SmartBoard, { SmartBoardRef } from "@/app/components/SmartBoard";
import { toast } from "sonner";
import { cleanupMath } from "@/lib/utils";

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

    // Interaction State
    const [showAnswer, setShowAnswer] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

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
                // In real app: fetch only these IDs via new API endpoint. 
                // For MVP: fetch all and filter (inefficient but works with existing API)
                const res = await fetch('/api/questions');
                const data = await res.json();

                const sessionQuestions = data.questions.filter((q: Question) => ids.includes(q.id));
                setQuestions(sessionQuestions);

                if (sessionQuestions.length === 0) {
                    toast.error("Questions not found");
                    router.push("/problem-solving");
                }
            } catch (err) {
                toast.error("Failed to load session");
            } finally {
                setLoading(false);
            }
        };
        initSession();
    }, []);

    // Board persistence per question (Simple in-memory map for MVP)
    // Real implementation: Store DataURL strings in a state map.
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
        // Requires SmartBoard to accept initialData or loadFromURL
        // For MVP phase 3 task: We'll implement this properly later. 
        // Just clearing for now to simulate fresh page.
        boardRef.current?.clear();
    };

    const handleNext = () => {
        saveCurrentBoard();
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Reset interaction states
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
            // Reset interaction states
            setShowAnswer(false);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            restoreBoard(currentIndex - 1);
        }
    };

    const currentQ = questions[currentIndex];

    if (loading || !currentQ) {
        return <div className="h-screen flex items-center justify-center">Loading Session...</div>;
    }

    return (
        <MathJaxContext>
            <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">

                {/* TOP TOOLBAR */}
                <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/problem-solving')}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Exit
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <Button
                                size="icon" variant={boardTool === 'pen' ? 'secondary' : 'ghost'} className="h-8 w-8"
                                onClick={() => { setBoardTool('pen'); boardRef.current?.setTool('pen'); }}
                            >
                                <PenTool className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon" variant={boardTool === 'eraser' ? 'secondary' : 'ghost'} className="h-8 w-8"
                                onClick={() => { setBoardTool('eraser'); boardRef.current?.setTool('eraser'); }}
                            >
                                <Eraser className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon" variant={boardTool === 'move' ? 'secondary' : 'ghost'} className="h-8 w-8"
                                onClick={() => { setBoardTool('move'); boardRef.current?.setTool('move'); }}
                            >
                                <Move className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Color Picker */}
                        <div className="flex items-center gap-2 ml-2">
                            {['#000000', '#ef4444', '#22c55e', '#3b82f6'].map(c => (
                                <button
                                    key={c}
                                    className={`w-6 h-6 rounded-full border-2 ${boardColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => { setBoardColor(c); boardRef.current?.setColor(c); }}
                                />
                            ))}
                        </div>

                        {/* Size Slider */}
                        <div className="w-24 ml-2">
                            <Slider
                                value={[boardSize]}
                                min={1} max={10} step={1}
                                onValueChange={(v) => { setBoardSize(v[0]); boardRef.current?.setLineWidth(v[0]); }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium mr-4 text-gray-500">
                            Question {currentIndex + 1} / {questions.length}
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => boardRef.current?.undo()}><Undo className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => boardRef.current?.redo()}><Redo className="w-4 h-4" /></Button>
                        <div className="h-6 w-px bg-gray-200 mx-2" />
                        <Button size="icon" variant="ghost" onClick={() => setShowOverlay(!showOverlay)}>
                            {showOverlay ? <Eye className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* MAIN WORKSPACE */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Smart Board Background */}
                    <div className="absolute inset-0 z-0">
                        <SmartBoard ref={boardRef} className="bg-white" />
                    </div>

                    {/* Question Overlay (Draggable/Fixed) */}
                    {showOverlay && (
                        <div className="absolute top-4 left-4 w-[450px] max-h-[calc(100vh-100px)] z-10 flex flex-col">
                            <Card className="shadow-xl bg-white/95 backdrop-blur border-indigo-100 overflow-hidden flex flex-col">
                                <CardContent className="p-0 flex flex-col">
                                    {/* Header */}
                                    <div className="p-4 bg-indigo-50/50 border-b flex justify-between items-start cursor-move">
                                        <div>
                                            <Badge variant="outline" className="bg-white mb-2">{currentQ.type} • {currentQ.marks} Marks</Badge>
                                            <h3 className="text-sm font-medium text-gray-500">{currentQ.subject}</h3>
                                        </div>
                                        <Badge variant={currentQ.difficulty === 'HARD' ? 'destructive' : 'secondary'}>
                                            {currentQ.difficulty}
                                        </Badge>
                                    </div>

                                    {/* Question Body - Scrollable */}
                                    <div className="p-5 overflow-y-auto max-h-[400px]">
                                        <div className="prose prose-sm max-w-none text-gray-800 text-lg">
                                            <MathJax>{cleanupMath(currentQ.questionText)}</MathJax>
                                        </div>

                                        {/* MCQ Options */}
                                        {currentQ.type === 'MCQ' && currentQ.options && (
                                            <div className="mt-6 space-y-2">
                                                {currentQ.options.map((opt, idx) => {
                                                    const isSelected = selectedOption === idx;
                                                    const isCorrect = opt.isCorrect;

                                                    let style = "border-gray-200 hover:bg-gray-50";
                                                    if (isAnswerChecked) {
                                                        if (isCorrect) style = "bg-green-50 border-green-500 text-green-900";
                                                        else if (isSelected) style = "bg-red-50 border-red-500 text-red-900";
                                                        else style = "border-gray-200 opacity-60";
                                                    } else if (isSelected) {
                                                        style = "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500";
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => !isAnswerChecked && setSelectedOption(idx)}
                                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${style}`}
                                                        >
                                                            <div className="shrink-0 w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs font-bold">
                                                                {String.fromCharCode(65 + idx)}
                                                            </div>
                                                            <div className="text-sm pt-0.5">
                                                                <MathJax inline>{cleanupMath(opt.text)}</MathJax>
                                                            </div>
                                                            {isAnswerChecked && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
                                                            {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 ml-auto" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* SubQuestions (CQ) */}
                                        {currentQ.type === 'CQ' && currentQ.subQuestions && (
                                            <div className="mt-6 space-y-4">
                                                {currentQ.subQuestions.map((sq: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>Part {String.fromCharCode(97 + i)}</span>
                                                            <span>{sq.marks} marks</span>
                                                        </div>
                                                        <div className="text-sm font-medium">
                                                            <MathJax inline>{cleanupMath(sq.question)}</MathJax>
                                                        </div>
                                                        {showAnswer && sq.modelAnswer && (
                                                            <div className="mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                                                                {sq.modelAnswer}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-4 border-t bg-gray-50 flex gap-2">
                                        {currentQ.type === 'MCQ' ? (
                                            !isAnswerChecked ? (
                                                <Button className="w-full" onClick={() => setIsAnswerChecked(true)} disabled={selectedOption === null}>
                                                    Check Answer
                                                </Button>
                                            ) : (
                                                <Button variant="outline" className="w-full" onClick={() => setShowAnswer(!showAnswer)}>
                                                    {showAnswer ? 'Hide Explanation' : 'Show Explanation'}
                                                </Button>
                                            )
                                        ) : (
                                            <Button variant="outline" className="w-full" onClick={() => setShowAnswer(!showAnswer)}>
                                                {showAnswer ? 'Hide Solution' : 'Reveal Solution'}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Explanation Reveal */}
                                    {showAnswer && (
                                        <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-sm text-yellow-900 animate-in slide-in-from-bottom-5">
                                            <div className="font-semibold mb-1 flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Teacher's Explanation
                                            </div>
                                            <div>
                                                {currentQ.type === 'MCQ' && currentQ.options?.find(o => o.isCorrect)?.explanation}
                                                {currentQ.type === 'SQ' && currentQ.modelAnswer}
                                                {currentQ.type === 'CQ' && "See detailed breakdown above."}
                                                {!currentQ.options && !currentQ.modelAnswer && "No explanation provided."}
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>

                            {/* Navigation Buttons (Overlay) */}
                            <div className="flex justify-between mt-4">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="shadow-md bg-white hover:bg-gray-100"
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    size="sm"
                                    className="shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={handleNext}
                                    disabled={currentIndex === questions.length - 1}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </MathJaxContext>
    );
}
