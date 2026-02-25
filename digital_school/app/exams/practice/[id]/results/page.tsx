"use client";

import React, { useEffect, useState, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Loader2, Trophy, Award, Target, TrendingUp, Users,
    ArrowLeft, RefreshCw, CheckCircle, XCircle, FileText,
    Clock, User, BarChart3, Share2, Download, Minus,
    CheckSquare, Camera, GraduationCap, Star, ChevronLeft,
    ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import { nativeShare } from "@/lib/native/interaction";
import { toBengaliNumerals, toBengaliAlphabets } from '@/utils/numeralConverter';

const mathJaxConfig = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
    },
};

const ITEMS_PER_PAGE = 20;

function PracticeResultsContent({ params }: { params: Promise<{ id: string }> }) {
    const { id: examId } = use(params);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNANSWERED'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
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

    const handleShare = async () => {
        if (!result) return;
        const shareTitle = `Practice Result: ${result.exam.name}`;
        const shareText = `I scored ${result.result.total} in ${result.exam.name} practice session!`;
        const shareUrl = window.location.href;
        await nativeShare(shareTitle, shareText, shareUrl);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Analyzing your practice session...</p>
        </div>
    );

    if (error || !result) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground max-w-md mb-6">{error || "Practice result not found"}</p>
            <Button onClick={() => router.push('/exams')}>Back to Exams</Button>
        </div>
    );

    const percentage = Math.round(result.result.percentage);
    const isPassed = percentage >= 40;

    const objectiveQuestions = result.questions.filter((q: any) => {
        const type = (q.type || "").toUpperCase();
        return ['MCQ', 'MC', 'AR', 'MTF', 'INT', 'NUMERIC'].includes(type) || !type;
    });

    const cqQuestions = result.questions.filter((q: any) => (q.type || "").toUpperCase() === 'CQ');
    const sqQuestions = result.questions.filter((q: any) => (q.type || "").toUpperCase() === 'SQ');

    return (
        <MathJaxContext config={mathJaxConfig}>
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors duration-500 overflow-x-hidden p-4 md:p-8">

                {/* Animated Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
                    <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto space-y-12">

                    {/* Top Navigation */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
                            <Button variant="outline" size="sm" onClick={() => router.push('/exams')} className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-md bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 transition-all duration-300">
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
                            </Button>
                            <Button variant="default" size="sm" onClick={() => router.push(`/exams/practice/${result.exam.id}`)} className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-0">
                                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                                Practice Session
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60">
                                <Share2 className="h-4 w-4 mr-2" /> Share
                            </Button>
                        </div>
                    </motion.div>

                    {/* Performance Hero Section */}
                    <div className="text-center relative py-10">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="inline-flex items-center justify-center p-2 mb-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                                <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl shadow-orange-500/20 border-b-4 border-orange-600 active:translate-y-1 transition-all">
                                    <Trophy className="h-12 w-12 text-white" />
                                </div>
                            </div>
                        </motion.div>

                        <div className="max-w-4xl mx-auto space-y-4">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent tracking-tighter break-words">
                                Performance Report
                            </h1>
                            <h2 className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 drop-shadow-sm">
                                {result.exam.name}
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Badge variant="outline" className="rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1">
                                    {result.exam.className}
                                </Badge>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <Badge variant="outline" className="rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1 text-slate-600">
                                    {result.exam.subject}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        <Card className="rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-slate-800/30 shadow-2xl overflow-hidden group hover:bg-white/60 transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="flex items-center gap-4 text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    Overall Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white dark:border-slate-700/30 text-center shadow-inner">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Your Score</label>
                                        <div className="text-4xl font-black text-slate-900 dark:text-white">
                                            {result.result.total}<span className="text-sm opacity-40 ml-1">/{result.submission.score ? result.submission.score : result.exam.totalMarks}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 p-6 rounded-[2rem] bg-emerald-50/80 dark:bg-emerald-950/30 border border-white dark:border-emerald-900/30 text-center shadow-inner">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Accuracy</label>
                                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{percentage}%</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-slate-800/30 shadow-2xl overflow-hidden group hover:bg-white/60 transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="flex items-center justify-between gap-4 text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        Practice Statistics
                                    </div>
                                    <div className="flex items-center gap-2 bg-yellow-400 text-orange-900 px-5 py-2.5 rounded-2xl font-black text-xl rotate-3 shadow-lg">
                                        <Users className="h-5 w-5" /> #{result.result.rank}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-2">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="text-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-white/50 dark:border-slate-700/30">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Average</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{(result.statistics.averageScore || 0).toFixed(1)}</p>
                                    </div>
                                    <div className="text-center p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/30">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500 mb-1">Highest</p>
                                        <p className="text-2xl font-black text-emerald-600">{result.statistics.highestScore}</p>
                                    </div>
                                    <div className="text-center p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-blue-500 mb-1">Peers</p>
                                        <p className="text-2xl font-black text-blue-600">{result.statistics.totalStudents}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Question Breakdown Section */}
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-slate-900 text-white rotate-3 shadow-xl">
                                    <FileText className="h-6 w-6" />
                                </div>
                                Solution & Solution analysis
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 p-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mx-2">Filters:</span>
                                {(['ALL', 'CORRECT', 'WRONG', 'UNANSWERED'] as const).map((status) => (
                                    <Button
                                        key={status}
                                        variant={filterStatus === status ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => { setCurrentPage(1); setFilterStatus(status); }}
                                        className={`rounded-xl px-5 text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Objective Section */}
                        {objectiveQuestions.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                        <CheckSquare className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                        Objective Questions
                                    </h4>
                                    <Badge variant="outline" className="rounded-full px-3">{objectiveQuestions.length}</Badge>
                                </div>

                                <div className="space-y-6">
                                    {objectiveQuestions
                                        .filter((q: any) => {
                                            if (filterStatus === 'ALL') return true;
                                            const hasAnswer = q.studentAnswer !== undefined && q.studentAnswer !== null;
                                            if (filterStatus === 'CORRECT') return q.isCorrect;
                                            if (filterStatus === 'WRONG') return hasAnswer && !q.isCorrect;
                                            if (filterStatus === 'UNANSWERED') return !hasAnswer;
                                            return true;
                                        })
                                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                        .map((q: any, idx: number) => (
                                            <motion.div
                                                key={q.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-6 md:p-10 rounded-[2.5rem] border-2 transition-all duration-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${q.isCorrect
                                                        ? 'border-emerald-500/20 shadow-emerald-500/5 hover:border-emerald-500/40'
                                                        : q.studentAnswer
                                                            ? 'border-rose-500/20 shadow-rose-500/5 hover:border-rose-500/40'
                                                            : 'border-slate-200/50 dark:border-slate-800/50 shadow-inner'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 flex items-center justify-center font-black text-lg">
                                                            {toBengaliNumerals((currentPage - 1) * ITEMS_PER_PAGE + idx + 1)}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={q.isCorrect ? 'bg-emerald-500' : q.studentAnswer ? 'bg-rose-500' : 'bg-slate-400'}>
                                                                    {q.type || 'MCQ'}
                                                                </Badge>
                                                                {q.studentAnswer && (
                                                                    <Badge variant="outline" className={q.isCorrect ? 'border-emerald-200 text-emerald-600' : 'border-rose-200 text-rose-600'}>
                                                                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Marks Earned</div>
                                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                                            {q.awardedMarks}<span className="text-sm opacity-40 ml-1">/{q.marks}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-2xl font-bold mb-10 text-slate-800 dark:text-slate-100 leading-relaxed overflow-x-auto scrollbar-thin">
                                                    <UniversalMathJax dynamic>{cleanupMath(q.questionText || q.q)}</UniversalMathJax>
                                                </div>

                                                {/* Options Logic */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {(q.options || []).map((opt: any, optIdx: number) => {
                                                        const optText = typeof opt === 'string' ? opt : opt.text;
                                                        const isCorrectOpt = opt.isCorrect;
                                                        const isSelected = q.studentAnswer === optText;

                                                        let stateStyles = "border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 opacity-60";
                                                        let icon = null;

                                                        if (isSelected && isCorrectOpt) {
                                                            stateStyles = "border-emerald-500 bg-emerald-500/10 scale-[1.03] shadow-xl ring-2 ring-emerald-500/20 z-10 opacity-100";
                                                            icon = <CheckCircle className="h-6 w-6 text-emerald-600 fill-emerald-500/10" />;
                                                        } else if (isSelected && !isCorrectOpt) {
                                                            stateStyles = "border-rose-500 bg-rose-500/10 scale-[1.03] shadow-xl ring-2 ring-rose-500/20 z-10 opacity-100";
                                                            icon = <XCircle className="h-6 w-6 text-rose-600 fill-rose-500/10" />;
                                                        } else if (!isSelected && isCorrectOpt) {
                                                            stateStyles = "border-emerald-500/40 bg-emerald-500/5 border-dashed scale-[1.01] opacity-100 z-10";
                                                            icon = <CheckCircle className="h-6 w-6 text-emerald-500/40" />;
                                                        }

                                                        return (
                                                            <div key={optIdx} className={`p-5 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-300 ${stateStyles}`}>
                                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${isSelected
                                                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                                        : isCorrectOpt
                                                                            ? 'bg-emerald-500 text-white'
                                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                                                    }`}>
                                                                    {toBengaliAlphabets(optIdx)}
                                                                </div>
                                                                <div className="flex-grow font-semibold text-lg leading-snug">
                                                                    <UniversalMathJax dynamic>{optText}</UniversalMathJax>
                                                                </div>
                                                                <div className="shrink-0">{icon}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation Section */}
                                                {(q.explanation || q.explanationImage) && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-8 rounded-[2rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 flex flex-col md:flex-row gap-6 group hover:bg-indigo-500/10 transition-colors">
                                                        <div className="p-3.5 h-fit rounded-2xl bg-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                                            <Star className="h-6 w-6" />
                                                        </div>
                                                        <div className="space-y-3 flex-grow">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Expert Explanation</p>
                                                            <div className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                                                                <UniversalMathJax dynamic>{cleanupMath(q.explanation)}</UniversalMathJax>
                                                            </div>
                                                            {q.explanationImage && (
                                                                <div className="mt-4 rounded-2xl overflow-hidden border border-indigo-500/20 shadow-lg cursor-zoom-in group/img" onClick={() => { }}>
                                                                    <img src={q.explanationImage} alt="Explanation" className="max-h-96 w-auto object-contain transition-transform group-hover/img:scale-105" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))}
                                </div>

                                {/* Pagination */}
                                {objectiveQuestions.length > ITEMS_PER_PAGE && (
                                    <div className="flex items-center justify-center gap-6 mt-12 py-8">
                                        <Button variant="outline" className="rounded-2xl h-12 px-8" disabled={currentPage === 1} onClick={() => { setCurrentPage(curr => curr - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                            <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                                        </Button>
                                        <div className="font-black text-lg">
                                            Page {currentPage} of {Math.ceil(objectiveQuestions.length / ITEMS_PER_PAGE)}
                                        </div>
                                        <Button variant="outline" className="rounded-2xl h-12 px-8" disabled={currentPage >= Math.ceil(objectiveQuestions.length / ITEMS_PER_PAGE)} onClick={() => { setCurrentPage(curr => curr + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                            Next <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Subjective Section (CQ/SQ) */}
                        {(cqQuestions.length > 0 || sqQuestions.length > 0) && (
                            <div className="space-y-12 pt-12 border-t-2 border-slate-100 dark:border-slate-800">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                            Subjective Review
                                        </h4>
                                        <Badge className="bg-orange-500 text-white font-black px-4 py-1 animate-pulse">REVIEW MODE ONLY</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        {[...cqQuestions, ...sqQuestions].map((q: any, idx: number) => (
                                            <Card key={q.id} className="rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/20 border-2 border-slate-200/50 dark:border-slate-800 overflow-hidden">
                                                <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{q.type}</Badge>
                                                        <span className="font-black text-lg">Question {idx + 1}</span>
                                                    </div>
                                                    <div className="font-black opacity-60 italic text-sm">NOT AUTOGRADED</div>
                                                </div>
                                                <CardContent className="p-8 space-y-8">
                                                    <div className="text-xl font-bold leading-relaxed">
                                                        <UniversalMathJax dynamic>{cleanupMath(q.questionText || q.q)}</UniversalMathJax>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Submission</label>
                                                            <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 min-h-[150px] shadow-inner">
                                                                {q.studentAnswer ? (
                                                                    <div className="font-medium h-full overflow-y-auto whitespace-pre-wrap">
                                                                        {q.studentAnswer}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-400 italic flex items-center justify-center h-full">No answer submitted</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Model Answer</label>
                                                            <div className="p-6 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 min-h-[150px] shadow-inner">
                                                                {q.modelAnswer || q.answer || q.explanation ? (
                                                                    <div className="font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed">
                                                                        <UniversalMathJax dynamic>{cleanupMath(q.modelAnswer || q.answer || q.explanation)}</UniversalMathJax>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-emerald-300 italic flex items-center justify-center h-full">No model answer available</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sub-questions if CQ */}
                                                    {(q.subQuestions || q.sub_questions) && (
                                                        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                                            <h5 className="font-black text-sm uppercase tracking-widest">Question Breakdown</h5>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {(q.subQuestions || q.sub_questions).map((sub: any, sIdx: number) => (
                                                                    <div key={sIdx} className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex gap-4">
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black shrink-0">
                                                                            {toBengaliAlphabets(sIdx)}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <div className="font-bold"><UniversalMathJax dynamic>{sub.text || sub.question}</UniversalMathJax></div>
                                                                            <div className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg border border-emerald-100">
                                                                                <span className="font-black mr-2">ANS:</span> <UniversalMathJax inline dynamic>{sub.modelAnswer || sub.answer || 'Refer to model answer'}</UniversalMathJax>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-10">
                        <Button variant="outline" className="flex-1 h-16 rounded-[1.5rem] text-lg font-bold border-2" onClick={() => router.push('/exams')}>
                            <ArrowLeft className="w-6 h-6 mr-2" /> Back to Dashboard
                        </Button>
                        <Button className="flex-1 h-16 rounded-[1.5rem] text-lg font-black bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 shadow-2xl" onClick={() => router.push(`/exams/practice/${result.exam.id}`)}>
                            <RefreshCw className="w-6 h-6 mr-2" /> Start New Session
                        </Button>
                    </div>
                </div>
            </div>
        </MathJaxContext>
    );
}

export default function PracticeResultsPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Crunching the numbers...</p>
            </div>
        }>
            <PracticeResultsContent params={params} />
        </Suspense>
    );
}
