'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Brain,
  AlertTriangle,
  Award,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface EcosystemStatusRibbonProps {
  nextExam?: {
    title: string;
    subject: string;
    daysRemaining: number;
  } | null;
  dueRevisionsCount: number;
  dueMistakesCount: number;
  goalsCount: number;
  arenaCompletionRate: number;
  currentStreak: number;
}

export function EcosystemStatusRibbon({
  nextExam,
  dueRevisionsCount,
  dueMistakesCount,
  goalsCount,
  arenaCompletionRate,
  currentStreak,
}: EcosystemStatusRibbonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Upcoming Exam */}
      <Link
        href="/student/student-corner/exams"
        className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Next Exam
          </span>
          <BookOpen className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
        </div>
        {nextExam ? (
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {nextExam.subject}
            </div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {nextExam.daysRemaining === 0 ? 'TODAY!' : `${nextExam.daysRemaining} days left`}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-bold text-slate-400">None Scheduled</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Set Exam Target</div>
          </div>
        )}
      </Link>

      {/* 2. Spaced Revision Due */}
      <Link
        href="/student/student-corner/revision"
        className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Spaced Recall
          </span>
          <Brain className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-base font-black text-slate-900 dark:text-white">
          {dueRevisionsCount}
        </div>
        <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
          {dueRevisionsCount > 0 ? 'Due for active recall' : 'All up to date'}
        </div>
      </Link>

      {/* 3. Mistake Retests Due */}
      <Link
        href="/student/student-corner/mistakes"
        className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mistake Lab
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-base font-black text-slate-900 dark:text-white">
          {dueMistakesCount}
        </div>
        <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          {dueMistakesCount > 0 ? 'Remedial retests due' : 'Zero unaddressed errors'}
        </div>
      </Link>

      {/* 4. Active Goals */}
      <Link
        href="/student/student-corner/goals"
        className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Goals
          </span>
          <Award className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-base font-black text-slate-900 dark:text-white">
          {goalsCount}
        </div>
        <div className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
          Tracking consistency
        </div>
      </Link>

      {/* 5. Today's Arena Progress */}
      <Link
        href="/student/student-corner/arena"
        className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Arena Execution
          </span>
          <Target className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-base font-black text-slate-900 dark:text-white">
          {arenaCompletionRate}%
        </div>
        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          🔥 {currentStreak}-day streak
        </div>
      </Link>
    </div>
  );
}
