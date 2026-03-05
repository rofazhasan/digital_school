"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, Activity, ArrowRight, User, CheckCircle, Clock, AlertTriangle, LayoutGrid, Layers, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export interface ActivitySubmission {
    id: string;
    examId: string;
    studentId: string;
    examName: string;
    studentName: string;
    roll: string;
    className: string;
    avatar: string | null;
    status: string;
    progress: number;
    answered: number;
    totalQuestions: number;
    score: number;
    maxScore: number;
    updatedAt: string;
    isIdle?: boolean;
}

export function ActivityTab() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivitySubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Historical data for sparklines
    const [historicalActiveCount, setHistoricalActiveCount] = useState<number[]>(Array(10).fill(0));

    // Controls
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");

    const fetchActivity = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setSyncing(true);

        try {
            const url = new URL("/api/exams/evaluations/activity", window.location.origin);
            url.searchParams.append("limit", "100");
            if (statusFilter !== "ALL") {
                url.searchParams.append("status", statusFilter);
            }

            const res = await fetch(url.toString(), { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const incoming = data.activity || [];
                setActivities(incoming);

                // Update sparkline data
                const currentActive = incoming.filter((a: ActivitySubmission) => a.status === 'IN_PROGRESS').length;
                setHistoricalActiveCount(prev => [...prev.slice(1), currentActive]);
            } else {
                if (!isSilent) toast.error("Failed to load activity feed");
            }
        } catch (e) {
            console.error(e);
            if (!isSilent) toast.error("Error loading activity feed");
        } finally {
            setLoading(false);
            setTimeout(() => setSyncing(false), 500);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(() => fetchActivity(true), 10000);
        return () => clearInterval(interval);
    }, [fetchActivity]);

    // Derived Metrics & Filtering
    const processedData = useMemo(() => {
        let filtered = activities.filter(a => {
            const query = searchQuery.toLowerCase();
            return (
                a.studentName.toLowerCase().includes(query) ||
                a.examName.toLowerCase().includes(query) ||
                a.roll.toLowerCase().includes(query) ||
                a.className.toLowerCase().includes(query)
            );
        });

        filtered = filtered.sort((a, b) => {
            if (sortBy === 'progress') return b.progress - a.progress;
            if (sortBy === 'lowest_progress') return a.progress - b.progress;
            if (sortBy === 'score') return b.score - a.score;
            if (sortBy === 'idle') return (b.isIdle ? 1 : 0) - (a.isIdle ? 1 : 0);
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); // newest
        });

        return filtered;
    }, [activities, searchQuery, sortBy]);

    const activeExams = activities.filter(a => a.status === 'IN_PROGRESS');
    const activeCount = activeExams.length;
    const completedCount = activities.filter(a => a.status === 'COMPLETED' || a.status === 'SUBMITTED').length;
    const avgClassProgress = activeCount > 0 ? Math.round(activeExams.reduce((acc, a) => acc + a.progress, 0) / activeCount) : 0;
    const idleCount = activeExams.filter(a => a.isIdle).length;

    const groupedByExam = useMemo(() => {
        if (viewMode !== 'grouped') return {};
        return processedData.reduce((acc, curr) => {
            if (!acc[curr.examName]) acc[curr.examName] = [];
            acc[curr.examName].push(curr);
            return acc;
        }, {} as Record<string, ActivitySubmission[]>);
    }, [processedData, viewMode]);

    // Sparkline Component
    const Sparkline = ({ data }: { data: number[] }) => {
        const max = Math.max(...data, 10); // Ensure some baseline height
        return (
            <div className="flex items-end gap-[2px] h-8 w-16 opacity-60">
                {data.map((val, i) => (
                    <div
                        key={i}
                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-300"
                        style={{ height: `${(val / max) * 100}%` }}
                    />
                ))}
            </div>
        );
    };

    const StudentCard = ({ sub, i }: { sub: ActivitySubmission, i: number }) => {
        const isLive = sub.status === 'IN_PROGRESS';
        const isIdle = sub.isIdle;

        return (
            <div
                className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                style={{ animationDelay: `${(i % 10) * 50}ms` }}
            >
                <Card
                    className={`group relative overflow-hidden transition-all duration-500 cursor-pointer border-none shadow-sm hover:shadow-2xl hover:-translate-y-2
          ${isLive
                            ? isIdle
                                ? 'bg-gradient-to-br from-white to-amber-50/60 dark:from-slate-900 dark:to-slate-900 ring-2 ring-amber-400/50 shadow-amber-500/10' // Focus Mode Alert
                                : 'bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-slate-900'
                            : 'bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-800'}`}
                    onClick={() => router.push(`/exams/evaluations/${sub.examId}?studentId=${sub.studentId}`)}
                >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 w-full h-1 
            ${isLive ? isIdle ? 'bg-amber-500' : 'bg-blue-500' : 'bg-emerald-500'}`} />

                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black white shadow-xl text-white
                    ${isLive ? isIdle ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
                                        {sub.studentName?.substring(0, 1)?.toUpperCase() || 'S'}
                                    </div>
                                    {isLive && (
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center
                      ${isIdle ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full bg-white ${isIdle ? 'animate-none opacity-50' : 'animate-ping'}`} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base leading-tight truncate w-[160px] sm:w-[180px]" title={sub.studentName}>
                                        {sub.studentName}
                                    </h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                        Roll {sub.roll} • {sub.className}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Exam</p>
                            <p className="font-bold text-sm truncate" title={sub.examName}>{sub.examName}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Completion ({sub.answered}/{sub.totalQuestions})
                                </span>
                                <span className={`text-xs font-black ${sub.progress === 100 ? 'text-emerald-500' : isLive ? 'text-blue-500' : 'text-slate-500'}`}>
                                    {sub.progress}%
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-in-out relative
                    ${sub.progress === 100 ? 'bg-emerald-500 shadow-emerald-500/50' : isIdle ? 'bg-amber-500 shadow-amber-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}
                                    style={{ width: `${Math.max(5, sub.progress)}%` }}
                                >
                                    {isLive && !isIdle && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isIdle ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                                <span className={`text-[10px] font-bold uppercase ${isIdle ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                    {isIdle ? 'Idle for > 5m' : formatDistanceToNow(new Date(sub.updatedAt), { addSuffix: true })}
                                </span>
                            </div>

                            <div className="flex items-center text-[11px] font-bold text-primary group-hover:underline">
                                Evaluate
                                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Top World-Class Metric Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Card className="relative bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20 shadow-xl h-full">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Live Exams</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-4xl font-black tracking-tight">{activeCount}</h3>
                                        {activeCount > 0 && <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Online</span>}
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-2 flex items-center gap-1">
                                        Heartbeat Activity Tracker
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <Sparkline data={historicalActiveCount} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Card className="relative bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20 shadow-xl h-full">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status Alerts</p>
                                    <h3 className={`text-3xl font-black tracking-tight ${idleCount > 0 ? 'text-amber-600' : ''}`}>{idleCount}</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                        Students idle &gt; 5 mins
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${idleCount > 0 ? 'bg-amber-500/10 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Card className="relative bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20 shadow-xl h-full">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Completion Rate</p>
                                    <h3 className="text-3xl font-black tracking-tight">{avgClassProgress}%</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                        Average class progress
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <Trophy className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative group overflow-hidden rounded-2xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Card className="relative bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20 shadow-xl h-full">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Submissions</p>
                                    <h3 className="text-3xl font-black tracking-tight">{completedCount}</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                        Awaiting evaluation
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Extreme Control Action Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search user, roll, exam..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full bg-slate-100/50 dark:bg-slate-800/50 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl"
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] shrink-0 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl font-medium">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="IN_PROGRESS">Live / Active</SelectItem>
                                <SelectItem value="SUBMITTED">Done</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[160px] shrink-0 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl font-medium">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="newest">Latest Pulse</SelectItem>
                                <SelectItem value="progress">Highest Progress</SelectItem>
                                <SelectItem value="lowest_progress">Lowest Progress</SelectItem>
                                <SelectItem value="idle">Needs Attention</SelectItem>
                                <SelectItem value="score">Top Score</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`w-9 h-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`w-9 h-9 rounded-lg transition-all ${viewMode === 'grouped' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setViewMode('grouped')}
                            title="Group by Exam (Swimlanes)"
                        >
                            <Layers className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => fetchActivity(false)}
                        disabled={syncing}
                        className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all h-10 px-5 font-bold shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Live Sync'}
                    </Button>
                </div>
            </div>

            {/* Main Activity Feed */}
            {loading && activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Activity className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Initializing Global Monitor...</p>
                </div>
            ) : processedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold">No tracking data found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mt-2">Adjust your filters or wait for students to pulse.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {processedData.map((sub, i) => (
                                <StudentCard key={sub.id} sub={sub} i={i} />
                            ))}
                        </div>
                    )}

                    {viewMode === 'grouped' && (
                        <div className="space-y-12">
                            {Object.keys(groupedByExam).map((examName) => (
                                <div key={examName} className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-border pb-2">
                                        <h3 className="text-2xl font-black">{examName}</h3>
                                        <div className="bg-muted px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground">
                                            {groupedByExam[examName].length} Tracked
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {groupedByExam[examName].map((sub, i) => (
                                            <StudentCard key={sub.id} sub={sub} i={i} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
