"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3, Trophy, Award, Sparkles, ArrowLeft,
  Calendar, Search, Filter, CheckCircle2, ChevronRight,
  Download, RefreshCw, BookOpen, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

const RESULTS_CACHE_KEY = "student_results_page_cache_v2";

interface ResultItem {
  id?: string;
  examId: string;
  examTitle: string;
  subject: string;
  type?: 'ONLINE' | 'OFFLINE' | 'MIXED';
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  grade?: string;
  date: string;
  comment?: string;
}

export default function StudentResultsPortalPage() {
  const router = useRouter();

  // Instant SWR Hydration
  const [cached] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(RESULTS_CACHE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  });

  const [results, setResults] = useState<ResultItem[]>(cached?.results || []);
  const [loading, setLoading] = useState(!cached?.results);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchResults = useCallback(async (isSilent = false) => {
    if (!isSilent && results.length === 0) setLoading(true);
    try {
      const res = await fetch("/api/student/results", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const list = data.results || [];
        setResults(list);
        try {
          sessionStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify({ results: list, cachedAt: Date.now() }));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [results.length]);

  useEffect(() => {
    fetchResults(true);
  }, [fetchResults]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => { if (r.subject) set.add(r.subject); });
    return Array.from(set);
  }, [results]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (subjectFilter !== "all" && r.subject?.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = r.examTitle?.toLowerCase().includes(q);
        const mSub = r.subject?.toLowerCase().includes(q);
        if (!mTitle && !mSub) return false;
      }
      return true;
    });
  }, [results, typeFilter, subjectFilter, search]);

  // Overall calculations
  const totalExams = results.length;
  const avgPercentage = totalExams > 0 ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalExams) : 0;
  const highestScore = totalExams > 0 ? Math.max(...results.map((r) => r.percentage || 0)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors">
      <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Bar with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { triggerHaptic(ImpactStyle.Light); router.push('/student/dashboard'); }}
            className="self-start rounded-full font-bold text-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 hover:text-indigo-600 transition-all gap-1.5 px-4 h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Student Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/student/prac-perfect')}
              className="rounded-full text-xs font-bold gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 h-9"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Practice Center
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchResults(false)}
              className="rounded-full text-xs font-bold gap-1.5 text-muted-foreground h-9"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 backdrop-blur-md">
              <BarChart3 className="h-3.5 w-3.5" />
              Comprehensive Academic Transcript
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              My Examination Results 🏆
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Verified scores across Online, Offline, and Mixed evaluation assessments with detailed answer breakdowns.
            </p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Evaluated</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalExams} Exams</div>
            <span className="text-[11px] text-muted-foreground font-medium">Published records</span>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Score</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgPercentage}%</div>
            <span className="text-[11px] text-muted-foreground font-medium">Across all subjects</span>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peak Performance</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{highestScore}%</div>
            <span className="text-[11px] text-muted-foreground font-medium">Highest score attained</span>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Search by exam title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Types" },
                { id: "ONLINE", label: "Online" },
                { id: "OFFLINE", label: "Offline" },
                { id: "MIXED", label: "Mixed" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { triggerHaptic(ImpactStyle.Light); setTypeFilter(t.id); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === t.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {uniqueSubjects.length > 0 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 px-3 py-2 text-foreground"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.length > 0 ? (
            filtered.map((result, i) => (
              <motion.div
                key={result.id || result.examId || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
                  <div className="p-5 sm:p-6 flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {result.type || 'EXAM'}
                      </Badge>
                      {result.rank && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px]">
                          Rank #{result.rank}
                        </Badge>
                      )}
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[10px]">
                        Grade: {result.grade || 'A'}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                        {result.subject || 'General'}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-foreground line-clamp-2">
                        {result.examTitle}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Evaluated on {result.date ? new Date(result.date).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Marks Scored</span>
                        <div className="text-lg font-black text-foreground">
                          {result.score} / {result.totalMarks}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Accuracy</span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {result.percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-auto pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/exams/results/${result.examId}`)}
                        className="flex-1 rounded-2xl font-bold text-xs h-10 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                      >
                        <BarChart3 className="h-4 w-4 mr-1.5" />
                        View Full Details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/exams/practice/${result.examId}`)}
                        className="rounded-2xl font-bold text-xs h-10 px-3 hover:border-indigo-500"
                        title="Practice Again"
                      >
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
              <h4 className="font-bold text-base">No examination results found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No published result records matching your current filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
