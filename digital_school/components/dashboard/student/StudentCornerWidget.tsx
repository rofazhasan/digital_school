'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Flame,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  Lock,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTodayArenaAction } from '@/features/student-corner/actions/arena-actions';
import { DailyArenaWithChallenges } from '@/features/student-corner/types';

export function StudentCornerWidget() {
  const router = useRouter();
  const [arenaData, setArenaData] = useState<DailyArenaWithChallenges | null>(null);
  const [streak, setStreak] = useState(0);
  const [hijriDate, setHijriDate] = useState<{ hijriFormatted: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArena() {
      try {
        const res = await getTodayArenaAction();
        if (res.success && res.arena) {
          setArenaData(res.arena as any);
          setStreak(res.streakInfo?.currentStreak || 0);
          if (res.hijriDate) setHijriDate(res.hijriDate);
        }
      } catch (err) {
        console.error('Failed to load arena summary in dashboard widget', err);
      } finally {
        setLoading(false);
      }
    }
    loadArena();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3 mb-4" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  const total = arenaData?.challenges?.length || 0;
  const completed = arenaData?.challenges?.filter((c) => c.status === 'COMPLETED').length || 0;
  const compPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextChallenge = arenaData?.challenges?.find((c) => c.status !== 'COMPLETED');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-900/40 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Student Corner: Today’s Arena
              </h3>
              {arenaData?.isLocked && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal operating system & daily challenge arena
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hijri date pill */}
          {hijriDate && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 font-medium text-xs">
              <Moon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{hijriDate.hijriFormatted}</span>
            </div>
          )}

          {/* Streak pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>{streak}d Streak</span>
          </div>

          <Link href="/student/student-corner">
            <Button
              size="sm"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5"
            >
              <span>Enter Corner</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Arena Content Summary */}
      {total > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Today’s Progress</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {completed} / {total} Done ({compPercent}%)
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${compPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Focus Logged</span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {Math.round((arenaData?.totalCompletedMinutes || 0) / 60 * 10) / 10}h <span className="text-xs font-normal text-slate-400">/ {Math.round((arenaData?.totalPlannedMinutes || 0) / 60 * 10) / 10}h planned</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {arenaData?.totalCompletedMinutes || 0} minutes executed
            </p>
          </div>

          {nextChallenge ? (
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Up Next</span>
                <span className="text-[10px] font-mono">{nextChallenge.durationMinutes}m</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {nextChallenge.title}
              </p>
              <Button
                size="sm"
                onClick={() => router.push(`/student/student-corner/focus?challengeId=${nextChallenge.id}&arenaId=${arenaData?.id}`)}
                className="mt-2 h-7 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Start Focus</span>
              </Button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/70 flex flex-col justify-center text-center">
              <Sparkles className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                All challenges completed!
              </p>
              <p className="text-[10px] text-slate-400">Rest & reflect</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Your arena is open today
            </p>
            <p className="text-[11px] text-slate-500">
              Plan study subjects, coding practice, or habits for today.
            </p>
          </div>
          <Link href="/student/student-corner/arena">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold">
              Plan Challenges
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
