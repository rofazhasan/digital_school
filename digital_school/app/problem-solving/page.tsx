"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Filter, PlusCircle, CheckCircle,
    Play, BookOpen, Layers, Target, ArrowRight, Loader2, X
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

// Types (simplified for selector)
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

    const [availableClasses, setAvailableClasses] = useState<any[]>([]);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch questions
                const qRes = await fetch('/api/questions');
                const qData = await qRes.json();
                setQuestions(qData.questions || []);

                // Fetch classes for filter
                const cRes = await fetch('/api/classes');
                const cData = await cRes.json();
                setAvailableClasses(cData.classes || []);
            } catch (error) {
                toast.error("Failed to load data");
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
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAllFiltered = () => {
        const newSet = new Set(selectedIds);
        filteredQuestions.forEach(q => newSet.add(q.id));
        setSelectedIds(newSet);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const startSession = () => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one question");
            return;
        }

        // Save selected IDs to localStorage to pass to session
        // In a real app we might post to create a session ID, but localStorage works for this flow
        localStorage.setItem("problem-solving-session", JSON.stringify(Array.from(selectedIds)));
        router.push("/problem-solving/session");
    };

    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject))).filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Problem Solving Studio
                    </h1>
                    <p className="text-gray-500 mt-1">Select questions to start an interactive solving session</p>
                </div>

                {/* Action Panel */}
                <Card className="border-indigo-100 bg-white shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-500">Selected</p>
                            <p className="text-2xl font-bold text-indigo-600 leading-none">{selectedIds.size}</p>
                        </div>
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all hover:scale-105"
                            onClick={startSession}
                            disabled={selectedIds.size === 0}
                        >
                            Start Session
                            <Play className="ml-2 w-5 h-5 fill-current" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm sticky top-4 z-10 bg-white/80 backdrop-blur-md">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="relative col-span-1 md:col-span-2">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search questions..."
                                className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="bg-gray-50 border-transparent">
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
                            <SelectTrigger className="bg-gray-50 border-transparent">
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {uniqueSubjects.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="bg-gray-50 border-transparent">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="MCQ">MCQ</SelectItem>
                                <SelectItem value="CQ">Creative (CQ)</SelectItem>
                                <SelectItem value="SQ">Short (SQ)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Question List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-gray-400" />
                            Available Questions ({filteredQuestions.length})
                        </h3>
                        <div className="flex gap-2">
                            {selectedIds.size > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <X className="w-4 h-4 mr-1" /> Clear
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Select All
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredQuestions.map((q) => (
                                <div
                                    key={q.id}
                                    onClick={() => toggleSelection(q.id)}
                                    className={`
                           group relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
                           ${selectedIds.has(q.id)
                                            ? 'bg-indigo-50/50 border-indigo-500 shadow-sm'
                                            : 'bg-white border-transparent hover:border-indigo-100'}
                        `}
                                >
                                    <div className="flex items-start gap-4">
                                        <Checkbox
                                            checked={selectedIds.has(q.id)}
                                            className="mt-1 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <div className="flex-1 space-y-2">
                                            {/* Metadata chips */}
                                            <div className="flex flex-wrap gap-2 text-xs font-medium opacity-70">
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">{q.type}</Badge>
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <BookOpen className="w-3 h-3" /> {q.subject}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Target className="w-3 h-3" /> {q.difficulty}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-500">{q.marks} Marks</span>
                                            </div>

                                            {/* Question Snippet */}
                                            <div className="font-medium text-gray-800 line-clamp-2">
                                                {q.questionText}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar / Mini-Cart */}
                <div className="hidden lg:block space-y-6">
                    <Card className="sticky top-28 border-indigo-100 bg-indigo-50/30">
                        <CardContent className="p-4 space-y-4">
                            <h3 className="font-semibold text-indigo-900">Session Plan</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Selected Questions</span>
                                    <span className="font-bold">{selectedIds.size}</span>
                                </div>
                                <div className="h-px bg-indigo-100 my-2" />

                                {/* Type Breakdown */}
                                {['MCQ', 'CQ', 'SQ'].map(type => {
                                    const count = Array.from(selectedIds).filter(id => questions.find(q => q.id === id)?.type === type).length;
                                    if (count === 0) return null;
                                    return (
                                        <div key={type} className="flex justify-between text-xs text-gray-500">
                                            <span>{type}</span>
                                            <span>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={startSession} disabled={selectedIds.size === 0}>
                                Start Session <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
