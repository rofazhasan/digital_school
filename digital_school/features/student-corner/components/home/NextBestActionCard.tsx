'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Flame,
  AlertTriangle,
  Brain,
  BookOpen,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Play,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NextBestActionItem } from '../../services/cross-feature-service';
import {
  quickAddRetestToArenaAction,
  quickAddRevisionToArenaAction,
} from '../../actions/cross-feature-actions';

interface NextBestActionCardProps {
  actions: NextBestActionItem[];
}

export function NextBestActionCard({ actions }: NextBestActionCardProps) {
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!actions || actions.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
              All Critical Missions Up to Date
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              No urgent exams within 72h, no overdue mistake retests, and all spaced recall is on schedule.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push('/student/student-corner/arena')}
          className="rounded-xl text-xs font-bold border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
        >
          View Today's Arena
        </Button>
      </div>
    );
  }

  const primaryAction = actions[0];

  const handleExecute = async (action: NextBestActionItem) => {
    setLoadingActionId(action.id);
    try {
      if (action.category === 'MISTAKE_RETEST' && action.payload?.mistakeId) {
        const res = await quickAddRetestToArenaAction(action.payload.mistakeId);
        if (res.success) {
          setSuccessMsg(`Retest added to Today's Arena!`);
          router.refresh();
        }
      } else if (action.category === 'REVISION' && action.payload?.revisionId) {
        const res = await quickAddRevisionToArenaAction(action.payload.revisionId);
        if (res.success) {
          setSuccessMsg(`Revision added to Today's Arena!`);
          router.refresh();
        }
      } else {
        router.push(action.actionUrl);
      }
    } catch {
      router.push(action.actionUrl);
    } finally {
      setLoadingActionId(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'EXAM_PREP':
        return {
          icon: BookOpen,
          bg: 'from-rose-500/10 via-amber-500/10 to-orange-500/10 border-rose-500/30 dark:border-rose-500/40',
          badge: 'bg-rose-600 text-white',
          accentText: 'text-rose-600 dark:text-rose-400',
        };
      case 'MISTAKE_RETEST':
        return {
          icon: AlertTriangle,
          bg: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-amber-500/30 dark:border-amber-500/40',
          badge: 'bg-amber-600 text-white',
          accentText: 'text-amber-600 dark:text-amber-400',
        };
      case 'REVISION':
        return {
          icon: Brain,
          bg: 'from-indigo-500/10 via-purple-500/10 to-blue-500/10 border-indigo-500/30 dark:border-indigo-500/40',
          badge: 'bg-indigo-600 text-white',
          accentText: 'text-indigo-600 dark:text-indigo-400',
        };
      case 'GOAL_DEFICIT':
        return {
          icon: Award,
          bg: 'from-cyan-500/10 via-teal-500/10 to-emerald-500/10 border-cyan-500/30 dark:border-cyan-500/40',
          badge: 'bg-cyan-600 text-white',
          accentText: 'text-cyan-600 dark:text-cyan-400',
        };
      default:
        return {
          icon: Zap,
          bg: 'from-violet-500/10 via-indigo-500/10 to-slate-500/10 border-violet-500/30 dark:border-violet-500/40',
          badge: 'bg-violet-600 text-white',
          accentText: 'text-violet-600 dark:text-violet-400',
        };
    }
  };

  const theme = getCategoryTheme(primaryAction.category);
  const Icon = theme.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-linear-to-r ${theme.bg} p-6 shadow-sm transition-all duration-300`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          {/* Header Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${theme.badge} shadow-xs`}
            >
              <Zap className="w-3 h-3" />
              <span>Next Best Action</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="w-3 h-3" />
              <span>~{primaryAction.estimatedMinutes} min</span>
            </span>

            {primaryAction.priority === 'URGENT' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 animate-pulse">
                HIGH URGENCY
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {primaryAction.title}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {primaryAction.subtitle}
            </p>
          </div>

          {/* Reason / Context Callout */}
          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-white/60 dark:border-slate-800/60">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-indigo-500 shrink-0" />
            <span>{primaryAction.reason}</span>
          </div>

          {successMsg && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
              ✓ {successMsg}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
          <Button
            onClick={() => handleExecute(primaryAction)}
            disabled={loadingActionId === primaryAction.id}
            className="rounded-2xl px-6 py-5 font-black text-xs uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            {loadingActionId === primaryAction.id ? (
              <span>Dispatching...</span>
            ) : primaryAction.actionType === 'ADD_TO_ARENA' ? (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Arena</span>
              </>
            ) : primaryAction.actionType === 'START_FOCUS' ? (
              <>
                <Play className="w-4 h-4" />
                <span>Start Focus Timer</span>
              </>
            ) : (
              <>
                <span>Review & Execute</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {actions.length > 1 && (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center lg:text-right">
              +{actions.length - 1} more pending priority action{actions.length > 2 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
