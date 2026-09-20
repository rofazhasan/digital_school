'use client';

import React from 'react';
import { StreakHistoryDetails } from '../../types';
import {
  Flame,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Award,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StreakDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streakDetails: StreakHistoryDetails;
}

export function StreakDetailsModal({
  open,
  onOpenChange,
  streakDetails,
}: StreakDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                {streakDetails.currentStreak} Day Streak
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Meaningful daily consistency tracked honestly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 my-3">
          {/* Main 4 Metric Grid (Item 3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Current
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {streakDetails.currentStreak}d
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Longest
              </span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {streakDetails.longestStreak}d
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                This Month
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {streakDetails.daysActiveThisMonth}/{streakDetails.totalDaysThisMonth}d
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                This Year
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {streakDetails.daysActiveThisYear}d
              </span>
            </div>
          </div>

          {/* Grace Day Protection (Item 2) */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950 dark:text-emerald-200">
                Streak Protection: {streakDetails.graceDaysRemaining} Recovery Day Available
              </p>
              <p className="text-emerald-800/80 dark:text-emerald-300/80 text-[11px] mt-0.5 leading-relaxed">
                If an emergency or illness occurs, your streak can be preserved once without artificial manipulation or fake streaks.
              </p>
            </div>
          </div>

          {/* Streak Milestones (Item 4) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Consistency Milestones</span>
            </h4>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {streakDetails.milestones.map((ms) => (
                <div
                  key={ms.days}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    ms.reached
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="text-sm font-black">{ms.days}d</p>
                  <span className="text-[9px] block uppercase font-bold mt-0.5">
                    {ms.reached ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Consistency */}
          {streakDetails.categoryStreaks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Category Consistency (Last 30 Days)
              </h4>
              <div className="flex flex-wrap gap-2">
                {streakDetails.categoryStreaks.map((cs) => (
                  <div
                    key={cs.category}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <span>{cs.category}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {cs.streakDays}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
        >
          Close History
        </Button>
      </DialogContent>
    </Dialog>
  );
}
