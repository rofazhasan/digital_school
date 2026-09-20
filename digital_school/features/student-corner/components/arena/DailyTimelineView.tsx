'use client';

import React from 'react';
import { ChallengeWithRelations } from '../../types';
import { Clock, Play, ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DailyTimelineViewProps {
  challenges: ChallengeWithRelations[];
  arenaId: string;
}

export function DailyTimelineView({ challenges, arenaId }: DailyTimelineViewProps) {
  // Sort challenges by scheduled time if available, otherwise orderIndex
  const sorted = [...challenges].sort((a, b) => {
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    if (a.scheduledTime) return -1;
    if (b.scheduledTime) return 1;
    return a.orderIndex - b.orderIndex;
  });

  // Deterministic Next Best Action (Item 30): first incomplete scheduled challenge, or first incomplete challenge
  const nextAction = sorted.find((c) => c.status === 'IN_PROGRESS') || sorted.find((c) => c.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* "Next Best Action" Card (Item 30) */}
      {nextAction && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/80 bg-linear-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                  Next Best Action
                </span>
                {nextAction.scheduledTime && (
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    @{nextAction.scheduledTime}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-500">
                  {nextAction.durationMinutes} min session
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {nextAction.title}
              </h3>

              {nextAction.subjects.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {nextAction.subjects.map((s) => (
                    <span
                      key={s.subject.id}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                      style={{ backgroundColor: s.subject.color }}
                    >
                      {s.subject.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={`/student/student-corner/focus?challengeId=${nextAction.id}&arenaId=${arenaId}`}
            >
              <Button className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-500/20">
                <Play className="w-4 h-4 fill-white" />
                <span>Start Focus Now</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Daily Schedule Timeline (Item 31) */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Today’s Execution Timeline</span>
          </h4>
          <span className="text-xs text-slate-400">
            {challenges.filter((c) => c.status === 'COMPLETED').length} / {challenges.length} Done
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {sorted.map((challenge, idx) => {
            const isCompleted = challenge.status === 'COMPLETED';
            const isNext = challenge.id === nextAction?.id;

            return (
              <div key={challenge.id} className="relative group flex items-start justify-between gap-3">
                {/* Timeline node */}
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-white dark:border-slate-900 ring-2 ring-emerald-500/30'
                      : isNext
                      ? 'bg-indigo-600 border-white dark:border-slate-900 ring-2 ring-indigo-500/40 animate-pulse'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {challenge.scheduledTime ? (
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {challenge.scheduledTime}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        Block #{idx + 1}
                      </span>
                    )}

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {challenge.category}
                    </span>
                  </div>

                  <p
                    className={`text-sm font-bold mt-0.5 ${
                      isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {challenge.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {challenge.durationMinutes}m
                  </span>
                  {!isCompleted && (
                    <Link
                      href={`/student/student-corner/focus?challengeId=${challenge.id}&arenaId=${arenaId}`}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
