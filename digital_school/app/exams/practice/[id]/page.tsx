"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, Send, BookOpen, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MathJaxContext } from "better-react-mathjax";
import QuestionCard from "../../online/[id]/QuestionCard";
import { ExamContextProvider } from "../../online/[id]/ExamContext";

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
    },
};

export default function PracticeExamPage({ params }: { params: Promise<{ id: string }> }) {
    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadPracticeData = async () => {
            try {
                const { id } = await params;
                const res = await fetch(`/api/exams/${id}/practice/questions`);

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to load practice exam");
                }

                const data = await res.json();
                setExam(data.exam);
                setQuestions(data.questions);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPracticeData();
    }, [params]);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const { id } = await params;
            const res = await fetch(`/api/exams/${id}/practice/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });

            if (!res.ok) throw new Error("Failed to submit practice exam");

            const data = await res.json();
            toast.success("Practice exam submitted successfully!");
            router.push(`/exams/practice/${id}/results?resultId=${data.resultId}`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Loading practice environment...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Practice Unavailable</h2>
            <p className="text-muted-foreground max-w-md mb-6">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    const currentQuestion = questions[currentIdx];
    const type = (currentQuestion?.type || "").toLowerCase();
    const isObjective = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(type) || !['cq', 'sq', 'descriptive'].includes(type);

    // Mock context for QuestionCard
    const mockContextValue = {
        exam: { ...exam, questions },
        answers,
        setAnswers,
        navigation: { current: currentIdx, marked: {} },
        setNavigation: () => { },
        markQuestion: () => { },
        fontSize: 'md',
        saveStatus: 'idle',
        isUploading: false,
        setIsUploading: () => { },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Practice Mode</Badge>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                {exam?.subject}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">{exam?.name}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()} className="rounded-xl border-slate-200">
                            Exit
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Submit Practice
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {!isObjective && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 items-start">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900 dark:text-amber-100 italic">Review Mode</h3>
                                    <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                                        This is a Subjective question. Read the question below and check your understanding. The model answer is provided for your review.
                                    </p>
                                </div>
                            </div>
                        )}

                        <ExamContextProvider exam={{ ...exam, questions }}>
                            <QuestionCard
                                questionIdx={currentIdx}
                                disabled={!isObjective}
                                submitted={!isObjective} // Shows model answers if submitted=true
                                result={!isObjective ? { isCorrect: true } : null} // Dummy result for objective styling in review
                            />
                        </ExamContextProvider>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(prev => prev - 1)}
                                className="rounded-xl"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" /> Previous
                            </Button>
                            <div className="text-sm font-bold text-muted-foreground">
                                Question {currentIdx + 1} of {questions.length}
                            </div>
                            <Button
                                variant="ghost"
                                disabled={currentIdx === questions.length - 1}
                                onClick={() => setCurrentIdx(prev => prev + 1)}
                                className="rounded-xl"
                            >
                                Next <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar - Navigator */}
                    <div className="space-y-6">
                        <Card className="rounded-[2rem] shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Navigator</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-4 gap-2">
                                    {questions.map((q, idx) => {
                                        const isCurrent = idx === currentIdx;
                                        const isAnswered = !!answers[q.id];
                                        const qType = (q.type || "").toLowerCase();
                                        const isReview = !['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(qType) && ['cq', 'sq', 'descriptive'].includes(qType);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setCurrentIdx(idx)}
                                                className={`
                          h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold border transition-all
                          ${isCurrent ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/20 scale-105' :
                                                        isAnswered ? 'bg-emerald-500 text-white border-emerald-500' :
                                                            isReview ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50'}
                        `}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> Answered
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="w-3 h-3 rounded-full bg-amber-400" /> Review Required
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" /> Unanswered
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
