"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Award, CheckCircle, XCircle, ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function PracticeResultsContent() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resultId = searchParams.get('resultId');

    useEffect(() => {
        const loadResult = async () => {
            if (!resultId) {
                setError("Result ID not found");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/exams/practice/results?resultId=${resultId}`);
                if (!res.ok) throw new Error("Failed to load practice result");
                const data = await res.json();
                setResult(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadResult();
    }, [resultId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Calculating your marks...</p>
        </div>
    );

    if (error || !result) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground max-w-md mb-6">{error || "Practice result not found"}</p>
            <Button onClick={() => router.push('/exams')}>Back to Exams</Button>
        </div>
    );

    const percentage = Math.round((result.score / result.totalMarks) * 100);
    const isPassed = percentage >= 40; // Assuming 40% as pass mark for practice

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header Summary */}
                <div className="text-center space-y-4">
                    <div className="inline-block relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-8 ${isPassed ? 'bg-emerald-500/10 ring-emerald-500/5' : 'bg-rose-500/10 ring-rose-500/5'}`}>
                            {isPassed ? (
                                <Award className="w-12 h-12 text-emerald-500" />
                            ) : (
                                <Trophy className="w-12 h-12 text-rose-500 opacity-50" />
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {isPassed ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Practice Completed!</h1>
                        <p className="text-muted-foreground font-medium max-w-md mx-auto">
                            You've completed the practice session for <span className="text-foreground font-bold">{result.exam?.name}</span>.
                        </p>
                    </div>
                </div>

                {/* Score Card */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900">
                    <CardHeader className="text-center pb-2 pt-10">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Your Score</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col items-center">
                            <span className={`text-7xl font-black font-fancy ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {result.score.toFixed(1)}
                            </span>
                            <span className="text-slate-400 font-bold mt-2">
                                Out of {result.totalMarks} Marks
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-black uppercase tracking-widest text-slate-500">Performance</span>
                                <span className={`text-lg font-black ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>{percentage}%</span>
                            </div>
                            <Progress value={percentage} className={`h-4 rounded-full ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-rose-100 dark:bg-rose-950/30'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Overall Result</p>
                                <p className={`text-xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isPassed ? 'KEEP IT UP!' : 'PRACTICE MORE'}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Subject</p>
                                <p className="text-xl font-black text-slate-700 dark:text-slate-200 line-clamp-1">
                                    {result.exam?.subject || 'Academic'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 h-16 rounded-2xl text-lg font-bold border-slate-200"
                        onClick={() => router.push('/exams')}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Exams
                    </Button>
                    <Button
                        className="flex-1 h-16 rounded-2xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                        onClick={() => router.push(`/exams/practice/${result.examId}`)}
                    >
                        <RefreshCw className="w-5 h-5 mr-2" /> Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PracticeResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading results...</p>
            </div>
        }>
            <PracticeResultsContent />
        </Suspense>
    );
}
