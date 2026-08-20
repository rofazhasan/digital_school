"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Award,
  Trophy,
  ArrowLeft,
  Sparkles,
  Calendar,
  BookOpen,
  Users,
  Brain,
  ChevronRight,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Layers,
  HelpCircle,
  ExternalLink,
  Zap,
  Activity
} from "lucide-react";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

// Chart Components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ANALYTICS_CACHE_KEY = "student_analytics_page_cache_v3";

export default function UnifiedStudentLearningAnalyticsPage() {
  const router = useRouter();

  // Instant SWR Hydration
  const [cached] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(ANALYTICS_CACHE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  });

  const [analytics, setAnalytics] = useState<any>(cached?.analytics || null);
  const [loading, setLoading] = useState(!cached?.analytics);
  const [activeHistoryFilter, setActiveHistoryFilter] = useState<'ALL' | 'OMR' | 'ONLINE'>('ALL');
  const [savedNotebookMistakes, setSavedNotebookMistakes] = useState<string[]>([]);

  // Load Saved Mistake Notebook IDs from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ro_mistake_notebook');
        if (raw) setSavedNotebookMistakes(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent && !analytics) setLoading(true);
    try {
      const res = await fetch('/api/student/analytics', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || data);
        try {
          sessionStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify({
            analytics: data.analytics || data,
            cachedAt: Date.now()
          }));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Filter Timeline by Source (Online / Physical OMR / All)
  const filteredTimeline = useMemo(() => {
    const rawList = analytics?.timeline || [];
    if (activeHistoryFilter === 'OMR') {
      return rawList.filter((item: any) => item.source === 'PHYSICAL_OMR');
    }
    if (activeHistoryFilter === 'ONLINE') {
      return rawList.filter((item: any) => item.source === 'ONLINE_EXAM');
    }
    return rawList;
  }, [analytics?.timeline, activeHistoryFilter]);

  // Chart Setup for Continuous Timeline
  const chartData = useMemo(() => {
    const labels = filteredTimeline.map((item: any) => item.examTitle || `Exam ${item.sequence}`);
    const scores = filteredTimeline.map((item: any) => item.pct);

    return {
      labels,
      datasets: [
        {
          label: 'Your Score %',
          data: scores,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Benchmark (75%)',
          data: labels.map(() => 75),
          borderColor: 'rgba(148, 163, 184, 0.4)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [filteredTimeline]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' as const } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => `Score: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl border border-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Long-Term Learning Analytics
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                  Physical + Online Unified
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic performance trends, topic mastery diagnostics, and mistake patterns.
              </p>
            </div>
          </div>

          <Button
            onClick={() => fetchAnalytics(false)}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
        </div>

        {/* Real Improvement Signal Banner */}
        {analytics?.improvementSignal && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-indigo-500/30 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="text-2xl">{analytics.improvementSignal.icon}</div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Performance Trajectory Signal
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {analytics.improvementSignal.text}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              {analytics.improvementSignal.delta > 0 ? `+${analytics.improvementSignal.delta}% Growth` : 'Steady'}
            </span>
          </div>
        )}

        {/* 4 Core Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Average Mastery</span>
            <p className="text-2xl sm:text-3xl font-black text-white">{analytics?.performance?.averagePercentage || 0}%</p>
            <span className="text-[11px] font-bold text-indigo-400">Grade {analytics?.performance?.grade || 'A'} • GPA {analytics?.performance?.gpa || '4.00'}</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Unified Exam History</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">{analytics?.totalExamsEvaluated || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">{analytics?.omrExamsCount || 0} Physical OMR + {analytics?.onlineExamsCount || 0} Online</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Repeated Weaknesses</span>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">{analytics?.repeatedWeaknesses?.length || 0}</p>
            <span className="text-[11px] text-rose-400/80 font-medium">Topic mistake clusters</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Verified Strengths</span>
            <p className="text-2xl sm:text-3xl font-black text-yellow-400">{analytics?.verifiedStrengths?.length || 0}</p>
            <span className="text-[11px] text-yellow-400/80 font-medium">≥75% mastery topics</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. CONTINUOUS PERFORMANCE TIMELINE */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-slate-900/60 border border-slate-800/80 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Score Progression Timeline
              </h2>
              <p className="text-xs text-slate-400">
                Continuous performance curve across physical OMR and digital examination milestones
              </p>
            </div>

            {/* Source Filter Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveHistoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeHistoryFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Exams ({analytics?.timeline?.length || 0})
              </button>
              <button
                onClick={() => setActiveHistoryFilter('OMR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeHistoryFilter === 'OMR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Physical OMR ({analytics?.omrExamsCount || 0})
              </button>
              <button
                onClick={() => setActiveHistoryFilter('ONLINE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeHistoryFilter === 'ONLINE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Online ({analytics?.onlineExamsCount || 0})
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* 2-Column Diagnostics Grid: Repeated Weaknesses & Verified Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repeated Weaknesses */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Repeated Weakness Clusters
              </h3>
              <span className="text-xs font-bold text-rose-400">{analytics?.repeatedWeaknesses?.length || 0} Detected</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Topics where mistakes occurred across 2 or more distinct exams. Target these concepts for focused revision.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {analytics?.repeatedWeaknesses?.length > 0 ? (
                analytics.repeatedWeaknesses.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{item.topic}</span>
                      <span className="text-[10px] text-slate-400">{item.subject} • Failed in {item.examCount} exams</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-rose-400">{item.accuracy}% Accuracy</span>
                      <span className="text-[10px] text-slate-500 block">{item.wrongAttempts} wrong of {item.totalAttempts}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400/50 mb-1" />
                  No repeated weakness clusters detected.
                </div>
              )}
            </div>
          </div>

          {/* Verified Strengths */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Verified Topic Strengths
              </h3>
              <span className="text-xs font-bold text-yellow-400">{analytics?.verifiedStrengths?.length || 0} Mastered</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Topics where your accuracy consistently exceeds 75% across repeated examinations.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {analytics?.verifiedStrengths?.length > 0 ? (
                analytics.verifiedStrengths.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{item.topic}</span>
                      <span className="text-[10px] text-slate-400">{item.subject} • Consistent High Accuracy</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400">{item.accuracy}% Mastery</span>
                      <span className="text-[10px] text-slate-500 block">{item.correctAttempts} of {item.totalAttempts} correct</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Complete more exams to verify topic strengths.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Type Performance Breakdown */}
        {analytics?.questionTypePerformance?.length > 0 && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Question Type Mastery Breakdown
              </h3>
              <span className="text-xs text-slate-400">Evaluated across all objective question formats</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {analytics.questionTypePerformance.map((t: any) => (
                <div key={t.type} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-indigo-400">{t.type}</span>
                    <span className="font-bold text-white">{t.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t.accuracy >= 75 ? 'bg-emerald-500' : t.accuracy >= 60 ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">{t.correct} / {t.total} questions answered correctly</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mistake History & Notebook Review */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                Mistake Notebook & Question Review
              </h3>
              <p className="text-xs text-slate-400">
                Review past incorrect answers across physical and online exams to reinforce comprehension.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.mistakeHistory?.length > 0 ? (
              analytics.mistakeHistory.slice(0, 6).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-black text-[10px] border border-rose-500/20">
                        {m.source === 'PHYSICAL_OMR' ? 'OMR Exam' : 'Online Exam'}
                      </span>
                      <span className="font-bold text-white">{m.examTitle}</span>
                      <span className="text-slate-500">• {m.topic}</span>
                    </div>
                    <Link
                      href={`/exams/results/${m.examId}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      View in Report <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <p className="text-xs text-slate-200 font-medium">{m.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40">
                      <span className="text-[10px] text-rose-400 font-bold uppercase block">Your Answer:</span>
                      <span className="font-mono text-white font-bold">{String(m.studentAnswer)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">Official Correct Answer:</span>
                      <span className="font-mono text-white font-bold">{String(m.correctAnswer)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No mistakes recorded in recent exam history. Keep up the high score!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
