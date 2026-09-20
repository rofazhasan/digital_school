'use client';

import React from 'react';
import { DayMode } from '@prisma/client';
import { Flame, Target, Award, Lock, ShieldCheck } from 'lucide-react';

interface CastStudentIdentityProps {
  studentName: string;
  completedCount: number;
  totalCount: number;
  streakDays: number;
  todayScore?: number;
  dayMode: DayMode;
  isLocked: boolean;
  className?: string;
}

export const CastStudentIdentity: React.FC<CastStudentIdentityProps> = ({
  studentName,
  completedCount,
  totalCount,
  streakDays,
  todayScore,
  dayMode,
  isLocked,
  className = '',
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine greeting based on current local hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'GOOD MORNING' : currentHour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-between gap-4 py-3 px-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl ${className}`}
      aria-label="Student Identity & Today Progress Bar"
    >
      {/* Student Greeting & Motto */}
      <div className="flex items-center gap-4 text-center md:text-left">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
          {studentName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wider text-slate-100">
              {greeting}, {studentName}
            </h2>
            {/* Challenge Mode Pill */}
            {isLocked || dayMode === 'LOCKED' ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <Lock className="w-3 h-3" />
                <span>Locked (DND)</span>
              </span>
            ) : dayMode === 'STRICT' ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-3 h-3" />
                <span>Strict Arena</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                <span>Normal Mode</span>
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-indigo-300/80 uppercase mt-0.5">
            Mission: BUILD • LEARN • PRAY • IMPROVE
          </p>
        </div>
      </div>

      {/* Metrics Row: Progress Ring + Streak + Today Score */}
      <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6">
        {/* Today's Arena Progress */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-800"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - percentage / 100)}
                className="text-indigo-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[11px] font-mono font-bold text-white">
              {percentage}%
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
              Today's Arena
            </span>
            <span className="text-sm font-black text-white font-mono">
              {completedCount} <span className="text-slate-500">/</span> {totalCount} Done
            </span>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <div className="text-left">
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400/80 block leading-tight">
              Streak
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-200 font-mono">
              {streakDays} Days
            </span>
          </div>
        </div>

        {/* Today's Score (if available) */}
        {typeof todayScore === 'number' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm">
            <Award className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400/80 block leading-tight">
                Score
              </span>
              <span className="text-xs sm:text-sm font-black text-cyan-200 font-mono">
                {todayScore} <span className="text-cyan-500/70 text-[10px]">/ 100</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
