"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Filter, PlusCircle, CheckCircle,
    Play, BookOpen, Layers, Target, ArrowRight, Loader2, X,
    Sparkles, BrainCircuit, LayoutGrid, List as ListIcon, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { cleanupMath } from "@/lib/utils";

const MATHJAX_CONFIG = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    }
};

// Types
interface Question {
    id: string;
    questionText: string;
    type: 'MCQ' | 'CQ' | 'SQ';
    subject: string;
    class: { name: string };
    difficulty: string;
    marks: number;
}

export default function ProblemSolvingSelector() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filters
    const [filterClass, setFilterClass] = useState<string>("all");
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [availableClasses, setAvailableClasses] = useState<any[]>([]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [qRes, cRes] = await Promise.all([
                    fetch('/api/questions'),
                    fetch('/api/classes')
                ]);
                const qData = await qRes.json();
                const cData = await cRes.json();
                setQuestions(qData.questions || []);
                setAvailableClasses(cData.classes || []);
            } catch (error) {
                toast.error("Failed to load content");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    const filteredQuestions = questions.filter(q => {
        const matchClass = filterClass === "all" || q.class?.name === filterClass;
        const matchSubject = filterSubject === "all" || q.subject === filterSubject;
        const matchType = filterType === "all" || q.type === filterType;
        const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
        return matchClass && matchSubject && matchType && matchSearch;
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
        localStorage.setItem("problem-solving-session", JSON.stringify(Array.from(selectedIds)));
        router.push("/problem-solving/session");
    };

    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject))).filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">

            {/* Hero Section */}
            <div className="relative bg-white border-b border-indigo-100/50 pb-8 pt-6 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-2">
                                <Sparkles className="w-3 h-3" /> Interactive Studio
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                                Problem Solving <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Mastery</span>
                            </h1>
                            <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                                Curate a personalized session with our smart interactive whiteboard.
                                Select questions, shuffle options, and start teaching.
                            </p>
                        </div>

                        {/* Stats / Quick Action */}
                        <div className="hidden md:flex gap-8 items-center bg-white/60 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-sm">
                            <div className="text-center px-4 border-r border-slate-200">
                                <div className="text-3xl font-bold text-slate-900">{questions.length}</div>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Items</div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-3xl font-bold text-indigo-600">{availableClasses.length}</div>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Classes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 -mt-8 relative z-20">
                {/* Main Interface Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT: Filters & List */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Search & Filter Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-lg shadow-indigo-100/50 border border-slate-100 flex flex-col md:flex-row gap-4 items-center sticky top-4 z-30 transition-all">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by topic or keyword..."
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger className="w-[140px] h-11 border-slate-200 bg-slate-50 rounded-lg">
                                        <SelectValue placeholder="Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {availableClasses.map((c: any) => (
                                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterSubject} onValueChange={setFilterSubject}>
                                    <SelectTrigger className="w-[140px] h-11 border-slate-200 bg-slate-50 rounded-lg">
                                        <SelectValue placeholder="Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {uniqueSubjects.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <ListIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                                    Available Questions
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">{filteredQuestions.length}</span>
                                </h3>
                                {filteredQuestions.length > 0 && (
                                    <div className="flex gap-2">
                                        {selectedIds.size > 0 && (
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                                Clear
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={selectAllFiltered} className="border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200">
                                            Select All
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-300" />
                                    <p>Loading your library...</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
                                    {filteredQuestions.map((q) => {
                                        const isSelected = selectedIds.has(q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                onClick={() => toggleSelection(q.id)}
                                                className={`
                                     group relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                                     ${isSelected
                                                        ? 'bg-indigo-50/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                                                        : 'bg-white border-transparent hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1'
                                                    }
                                     ${viewMode === 'list' ? 'p-4 flex gap-4 items-center' : 'p-5 flex flex-col gap-4'}
                                  `}
                                            >
                                                {/* Selection Check Circle */}
                                                <div className={`
                                     absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10
                                     ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-200 bg-white group-hover:border-indigo-300'}
                                  `}>
                                                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge className={`${q.difficulty === 'HARD' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                            q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                                                'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                            } px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border-0`}>
                                                            {q.difficulty}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                                                            {q.type} • {q.marks} Marks
                                                        </Badge>
                                                        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" /> {q.subject}
                                                        </div>
                                                    </div>

                                                    <h4 className="text-slate-800 font-medium leading-relaxed pr-6 line-clamp-3">
                                                        {q.questionText}
                                                    </h4>
                                                </div>

                                                {/* Footer (Grid only) */}
                                                {viewMode === 'grid' && (
                                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                                                        <div className="text-xs text-slate-400 font-medium">{q.class?.name}</div>
                                                        <div className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                                                            {isSelected ? 'Selected' : 'Click to select'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Floating Sidebar / Cart */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 p-6 border border-slate-100 relative overflow-hidden">
                                {/* Decorative background blob */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-50 rounded-full blur-2xl"></div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">Your Session</h3>
                                    <p className="text-sm text-slate-500 mb-6">Review your selected questions before starting.</p>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-6 border border-slate-100">
                                        <span className="text-slate-600 font-medium">Questions selected</span>
                                        <span className="text-2xl font-black text-indigo-600">{selectedIds.size}</span>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        {['MCQ', 'CQ', 'SQ'].map(type => {
                                            const count = questions.filter(q => selectedIds.has(q.id) && q.type === type).length;
                                            if (count === 0) return null;
                                            return (
                                                <div key={type} className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">{type}</span>
                                                    <div className="flex-1 border-b border-dotted border-slate-300 mx-2 relative top-1"></div>
                                                    <span className="font-semibold text-slate-700">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                                        onClick={startSession}
                                        disabled={selectedIds.size === 0}
                                    >
                                        Start Class Session <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Tips */}
                            <div className="bg-indigo-900/5 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-start gap-3">
                                    <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                                    <div className="text-sm text-indigo-900/80">
                                        <p className="font-semibold mb-1">Pro Tip:</p>
                                        Use the "List View" to select questions faster. Questions and Options are automatically shuffled per session.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
