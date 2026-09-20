'use client';

import React from 'react';
import { ConsistencyHeatmap } from './ConsistencyHeatmap';
import { PlanVsRealityChart } from './PlanVsRealityChart';
import { HeatmapDayData, PlanVsRealityItem, EstimationAccuracyData } from '../../types';
import { CATEGORY_METADATA } from '../../types/categories';
import { ChallengeCategory } from '@prisma/client';
import {
  Flame,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

interface CategoryBreakdownItem {
  category: string;
  totalChallenges: number;
  completedChallenges: number;
  completionRate: number;
  plannedHours: number;
  focusedHours: number;
}

interface AnalyticsDashboardProps {
  heatmapData: HeatmapDayData[];
  overview: {
    totalChallenges: number;
    completedChallenges: number;
    overallCompletionRate: number;
    totalCompletedFocusHours?: number;
    totalFocusHours?: number;
    categoryBreakdown?: CategoryBreakdownItem[];
    categoryStats?: Record<string, { total: number; completed: number; minutes: number }>;
  };
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    completionRateLast30Days: number;
    totalDaysCompleted: number;
  };
  planVsReality?: {
    items: PlanVsRealityItem[];
    estimation: EstimationAccuracyData;
  };
  ecosystemAnalytics?: {
    subjectCorrelations: Array<{
      subjectId: string;
      subjectName: string;
      color: string;
      studyHours: number;
      mistakesTotal: number;
      mistakesResolved: number;
      mistakeResolutionRate: number;
      syllabusCoverageRate: number;
      weakTopicsCount: number;
    }>;
    mistakeLoop: {
      totalMistakes: number;
      resolvedMistakesCount: number;
      mistakeRetentionRate: number;
    };
    revisionLoop: {
      totalRevisions: number;
      highBoxCount: number;
      revisionMasteryRate: number;
    };
    examReadiness: Array<{
      examId: string;
      title: string;
      subject: string;
      examDate: Date;
      readinessPercent: number;
      totalChapters: number;
      coveredChapters: number;
    }>;
  };
  weeklyReview?: {
    period: string;
    focusHours: number;
    revisionsCount: number;
    mistakesResolvedCount: number;
    codingCount: number;
    totalChallengesCompleted: number;
    activeGoalsCount: number;
    completedGoalsCount: number;
    currentStreak: number;
  };
}

export function AnalyticsDashboard({
  heatmapData,
  overview,
  streakInfo,
  planVsReality,
  ecosystemAnalytics,
  weeklyReview,
}: AnalyticsDashboardProps) {
  const focusHours = overview.totalCompletedFocusHours ?? overview.totalFocusHours ?? 0;

  // Normalize category stats list
  const categoryList = overview.categoryBreakdown || (overview.categoryStats ? Object.entries(overview.categoryStats).map(([cat, s]) => ({
    category: cat,
    totalChallenges: s.total,
    completedChallenges: s.completed,
    completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    plannedHours: 0,
    focusedHours: Math.round((s.minutes / 60) * 10) / 10,
  })) : []);

  return (
    <div className="space-y-6">
      {/* Metric Cards Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {streakInfo.currentStreak} <span className="text-sm font-semibold text-slate-400">days</span>
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Personal record: {streakInfo.longestStreak} days
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Total Focus Time</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {focusHours} <span className="text-sm font-semibold text-slate-400">hours</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Across 30 days of active sessions
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {overview.overallCompletionRate}%
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {overview.completedChallenges} of {overview.totalChallenges} challenges
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Consistency (30d)</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {streakInfo.completionRateLast30Days}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {streakInfo.totalDaysCompleted} total active days
          </p>
        </div>
      </div>

      {/* 365-Day Consistency Heatmap */}
      <ConsistencyHeatmap data={heatmapData} />

      {/* Plan vs Reality & Estimation Accuracy (Items 15-17) */}
      {planVsReality && planVsReality.items.length > 0 && (
        <PlanVsRealityChart
          items={planVsReality.items}
          estimation={planVsReality.estimation}
        />
      )}

      {/* Category Time Breakdown */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
          Category Focus Breakdown (Last 30 Days)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Balance your academic, problem solving, spiritual, and physical disciplines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryList.map((stat) => {
            const meta = CATEGORY_METADATA[stat.category as ChallengeCategory] || CATEGORY_METADATA.CUSTOM;

            return (
              <div
                key={stat.category}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                    style={{
                      color: meta.color,
                      backgroundColor: meta.bgColor,
                      borderColor: meta.borderColor,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {stat.focusedHours} hrs
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{stat.completedChallenges} / {stat.totalChallenges} done</span>
                  <span className="font-bold">{stat.completionRate}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stat.completionRate}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Connected Ecosystem Review */}
      {weeklyReview && (
        <div className="p-6 sm:p-7 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/60 bg-linear-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Connected 7-Day Performance
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Weekly Ecosystem Review ({weeklyReview.period})
              </h3>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
              🔥 {weeklyReview.currentStreak}-Day Active Streak
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Focus Hours</span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{weeklyReview.focusHours}h</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tasks Done</span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{weeklyReview.totalChallengesCompleted}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block">Spaced Recall</span>
              <span className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5 block">{weeklyReview.revisionsCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">Errors Solved</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5 block">{weeklyReview.mistakesResolvedCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase block">Coding Done</span>
              <span className="text-lg font-black text-cyan-700 dark:text-cyan-300 mt-0.5 block">{weeklyReview.codingCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Goals Done</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{weeklyReview.completedGoalsCount} / {weeklyReview.activeGoalsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Domain Correlation Hub */}
      {ecosystemAnalytics && ecosystemAnalytics.subjectCorrelations.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Cross-Feature Insights
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Study Time ↔ Mistake Diary ↔ Syllabus Readiness
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Correlations derived from your actual logged hours, recorded mistakes, and syllabus matrix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecosystemAnalytics.subjectCorrelations.map((sc) => (
              <div
                key={sc.subjectId}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {sc.subjectName}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {sc.studyHours}h studied
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Mistakes</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sc.mistakesResolved} / {sc.mistakesTotal} resolved ({sc.mistakeResolutionRate}%)
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Syllabus Solid</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sc.syllabusCoverageRate}% coverage
                    </span>
                  </div>
                </div>

                {sc.weakTopicsCount > 0 && (
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    ⚠️ {sc.weakTopicsCount} weak chapter{sc.weakTopicsCount > 1 ? 's' : ''} flagged for revision
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
