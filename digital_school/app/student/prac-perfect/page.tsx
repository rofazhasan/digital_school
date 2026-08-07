"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Filter, Play, BookOpen, LayoutGrid, List as ListIcon, Clock,
    Sparkles, ArrowRight, Loader2, CheckCircle, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { cleanupMath } from "@/lib/utils";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml", "[tex]/mhchem"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        packages: { '[+]': ['mhchem'] }
    },
};

interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ' | 'DESCRIPTIVE' | 'SMCQ';
    subject: string;
    topic?: string;
    difficulty: string;
    marks: number;
    images?: string[];
}

export default function PracPerfectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filters & Timer
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterTopic, setFilterTopic] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    // Custom Minutes & Seconds Timer Config
    const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
    const [timerMinutesInput, setTimerMinutesInput] = useState<number>(3);
    const [timerSecondsInput, setTimerSecondsInput] = useState<number>(0);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/student/prac-perfect/questions');
                if (res.status === 401 || res.status === 403) {
                    toast.error("Unauthorized Access");
                    router.push('/student/dashboard');
                    return;
                }
                const data = await res.json();
                setQuestions(data.questions || []);
            } catch (error) {
                toast.error("Failed to load your questions");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    // Filter Logic
    const filteredQuestions = questions.filter(q => {
        const matchSubject = filterSubject === "all" || q.subject === filterSubject;
        const matchType = filterType === "all" || q.type === filterType;
        const matchTopic = filterTopic === "all" || q.topic === filterTopic;
        const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.topic?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSubject && matchType && matchTopic && matchSearch;
    });

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAllFiltered = () => {
        const newSet = new Set(selectedIds);
        filteredQuestions.forEach(q => newSet.add(q.id));
        setSelectedIds(newSet);
    };

    const startSession = () => {
        if (selectedIds.size === 0) return;
        const totalSecs = timerEnabled ? (Math.max(0, timerMinutesInput) * 60 + Math.max(0, timerSecondsInput)) : 0;
        localStorage.setItem("prac-perfect-session", JSON.stringify(Array.from(selectedIds)));
        localStorage.setItem("prac-perfect-timer-seconds", totalSecs.toString());
        localStorage.setItem("prac-perfect-timer", timerEnabled ? `${timerMinutesInput}m ${timerSecondsInput}s` : "off");
        router.push("/student/prac-perfect/session");
    };

    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject))).filter(Boolean);
    const uniqueTopics = Array.from(new Set(
        questions
            .filter(q => filterSubject === "all" || q.subject === filterSubject)
            .map(q => q.topic)
    )).filter(Boolean);

    return (
        <MathJaxContext config={mathJaxConfig} version={3}>
            <div className="min-h-screen bg-background font-fancy">
                {/* Header Section */}
                <div className="bg-card border-b sticky top-0 z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/student/dashboard')}>
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                PracPerfect
                            </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push('/student/dashboard')}>
                            Exit
                        </Button>
                    </div>
                </div>

                {/* Hero / Welcome */}
                <div className="bg-card border-b border-border py-8">
                    <div className="max-w-7xl mx-auto px-4">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                            Your Personal <span className="text-indigo-600">Practice Studio</span>
                        </h1>
                        <p className="text-muted-foreground">
                            Select questions from your class curriculum and start a practice session to master your subjects.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* LEFT: Filters & Content */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Filter Bar */}
                            <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center sticky top-20 z-30">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by topic..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Subject" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Subjects</SelectItem>
                                            {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="MCQ">MCQ (Single)</SelectItem>
                                            <SelectItem value="MC">MC (Multiple)</SelectItem>
                                            <SelectItem value="INT">INT (Numeric)</SelectItem>
                                            <SelectItem value="AR">AR (Assertion-Reason)</SelectItem>
                                            <SelectItem value="MTF">MTF (Matching)</SelectItem>
                                            <SelectItem value="CQ">CQ (Creative)</SelectItem>
                                            <SelectItem value="SQ">SQ (Short)</SelectItem>
                                            <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
                                            <SelectItem value="SMCQ">SMCQ (Scenario)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={filterTopic}
                                        onValueChange={setFilterTopic}
                                    >
                                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Topic" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Topics</SelectItem>
                                            {uniqueTopics.map(t => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex bg-muted p-1 rounded-md">
                                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
                                        <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><ListIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Questions Grid */}
                            <div>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <p className="font-semibold text-muted-foreground">Available Questions ({filteredQuestions.length})</p>
                                    {filteredQuestions.length > 0 && (
                                        <div className="flex gap-2">
                                            {selectedIds.size > 0 && (
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-red-500">Clear</Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={selectAllFiltered}>Select All</Button>
                                        </div>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>
                                ) : filteredQuestions.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400">No questions found matching your criteria.</div>
                                ) : (
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
                                        {filteredQuestions.map((q) => {
                                            const isSelected = selectedIds.has(q.id);
                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => toggleSelection(q.id)}
                                                    className={`
                                                        group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                                                        ${isSelected ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-transparent hover:border-primary/20 hover:shadow-lg'}
                                                        ${viewMode === 'list' ? 'p-4 flex gap-4 items-center' : 'p-5 flex flex-col gap-4'}
                                                    `}
                                                >
                                                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>

                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                            <Badge variant="outline">{q.subject}</Badge>
                                                            {q.topic && <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">{q.topic}</Badge>}
                                                            <Badge className={q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{q.difficulty}</Badge>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-800 line-clamp-3">
                                                            <UniversalMathJax inline dynamic>{q.questionText}</UniversalMathJax>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Stats / Action */}
                        <div className="hidden lg:block">
                            <div className="sticky top-28 space-y-4">
                                <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                                    <h3 className="font-bold text-lg mb-1">Your Session</h3>
                                    <p className="text-xs text-muted-foreground mb-4">Ready to practice?</p>

                                    <div className="bg-muted rounded-lg p-4 mb-4 flex justify-between items-center">
                                        <span className="text-foreground font-medium">Questions Selected</span>
                                        <span className="text-2xl font-bold text-primary">{selectedIds.size}</span>
                                    </div>

                                    {/* Custom Per-Question Timer Selector */}
                                    <div className="mb-6 space-y-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Per-Question Timer
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] font-bold ${timerEnabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'}`}>
                                                {timerEnabled ? `${timerMinutesInput}m ${timerSecondsInput}s` : 'Off'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={timerEnabled ? "default" : "outline"}
                                                onClick={() => setTimerEnabled(true)}
                                                className="h-8 text-xs flex-1 font-semibold"
                                            >
                                                Timer On
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={!timerEnabled ? "default" : "outline"}
                                                onClick={() => setTimerEnabled(false)}
                                                className="h-8 text-xs flex-1 font-semibold"
                                            >
                                                Timer Off
                                            </Button>
                                        </div>

                                        {timerEnabled && (
                                            <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-indigo-900/70 dark:text-indigo-300/70 mb-1 block">Minutes</label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={59}
                                                        value={timerMinutesInput}
                                                        onChange={(e) => setTimerMinutesInput(Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="h-9 bg-card border-indigo-200 dark:border-indigo-800 text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-indigo-900/70 dark:text-indigo-300/70 mb-1 block">Seconds</label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={59}
                                                        value={timerSecondsInput}
                                                        onChange={(e) => setTimerSecondsInput(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                                        className="h-9 bg-card border-indigo-200 dark:border-indigo-800 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                                            {timerEnabled
                                                ? `Timer auto-counts down ${timerMinutesInput}m ${timerSecondsInput}s per question & advances automatically.`
                                                : 'Self-paced practice without per-question countdown timer.'}
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold"
                                        size="lg"
                                        disabled={selectedIds.size === 0}
                                        onClick={startSession}
                                    >
                                        Start Practice <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>

                                <div className="bg-gradient-to-br from-primary/80 to-primary rounded-xl p-6 text-primary-foreground shadow-lg">
                                    <GraduationCap className="w-8 h-8 mb-2 opacity-80" />
                                    <h4 className="font-bold text-lg">Pro Tip</h4>
                                    <p className="text-sm opacity-90 mt-1">
                                        Practice makes perfect! Try selecting questions from different topics to challenge yourself.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile Floating Action Button */}
                <div className="lg:hidden fixed bottom-6 left-0 right-0 px-6 z-50">
                    {selectedIds.size > 0 && (
                        <Button
                            className="w-full h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/50 text-lg font-bold"
                            onClick={startSession}
                        >
                            Start ({selectedIds.size}) <Play className="w-5 h-5 ml-2 fill-current" />
                        </Button>
                    )}
                </div>
            </div>
        </MathJaxContext>
    );
}
