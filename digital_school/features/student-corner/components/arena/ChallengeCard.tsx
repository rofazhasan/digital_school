'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeWithRelations } from '../../types';
import { CATEGORY_METADATA } from '../../types/categories';
import { DayMode, ChallengeStatus, ChallengePriority } from '@prisma/client';
import {
  CheckCircle2,
  Circle,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { toggleChallengeCompletionAction, deleteChallengeAction } from '../../actions/arena-actions';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';

interface ChallengeCardProps {
  challenge: ChallengeWithRelations;
  dayMode: DayMode;
  isLocked: boolean;
  onRefreshNeeded?: () => void;
}

export function ChallengeCard({
  challenge,
  dayMode,
  isLocked,
  onRefreshNeeded,
}: ChallengeCardProps) {
  const router = useRouter();
  const [showNotes, setShowNotes] = useState(false);
  const [isCompleted, setIsCompleted] = useState(challenge.status === ChallengeStatus.COMPLETED);
  const [isToggling, setIsToggling] = useState(false);

  const categoryMeta = CATEGORY_METADATA[challenge.category] || CATEGORY_METADATA.CUSTOM;

  const handleToggle = async () => {
    triggerHaptic(ImpactStyle.Medium);
    const nextState = !isCompleted;
    setIsCompleted(nextState); // Optimistic UI

    try {
      const res = await toggleChallengeCompletionAction(challenge.id);
      if (res.success) {
        toast.success(nextState ? 'Challenge completed!' : 'Marked incomplete');
        onRefreshNeeded?.();
      } else {
        setIsCompleted(!nextState); // Rollback
        toast.error(res.error || 'Failed to update challenge');
      }
    } catch (err: any) {
      setIsCompleted(!nextState);
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleDelete = async () => {
    if (isLocked) {
      toast.error('Day is locked. Delete is prohibited.');
      return;
    }
    if (dayMode === DayMode.STRICT) {
      toast.error('Strict mode prohibits deleting planned challenges.');
      return;
    }

    try {
      const res = await deleteChallengeAction(challenge.id);
      if (res.success) {
        toast.success('Challenge removed');
        onRefreshNeeded?.();
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting challenge');
    }
  };

  const priorityColors = {
    LOW: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    MEDIUM: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    HIGH: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    URGENT: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-80'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkmark & Title Area */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="mt-0.5 shrink-0 transition-transform active:scale-90"
            title={isCompleted ? 'Mark not completed' : 'Mark completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/50" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Category & Metadata Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                style={{
                  color: categoryMeta.color,
                  backgroundColor: categoryMeta.bgColor,
                  borderColor: categoryMeta.borderColor,
                }}
              >
                {categoryMeta.label}
              </span>

              {challenge.subjects.map(({ subject }) => (
                <span
                  key={subject.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                >
                  {subject.name}
                </span>
              ))}

              {challenge.topics.map(({ topic }) => (
                <span
                  key={topic.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800"
                >
                  {topic.name}
                </span>
              ))}

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityColors[challenge.priority]}`}>
                {challenge.priority}
              </span>
            </div>

            {/* Title */}
            <h3
              className={`font-bold text-sm sm:text-base leading-snug break-words ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {challenge.title}
            </h3>

            {/* Scheduled Time & Duration Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{challenge.durationMinutes} min</span>
              </span>

              {challenge.scheduledTime && (
                <span className="flex items-center gap-1 font-mono">
                  <span>@{challenge.scheduledTime}</span>
                </span>
              )}

              {challenge.actualMinutesSpent > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                  ✓ {challenge.actualMinutesSpent}m focused
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Start Focus & Options */}
        <div className="flex items-center gap-2 shrink-0">
          {!isCompleted && (
            <Button
              size="sm"
              onClick={() => router.push(`/student/student-corner/focus?challengeId=${challenge.id}&arenaId=${challenge.arenaId}`)}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 h-8 px-3"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Start</span>
            </Button>
          )}

          {challenge.notes && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotes(!showNotes)}
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700"
              title="Toggle notes"
            >
              {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}

          {!isLocked && dayMode === DayMode.NORMAL && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Delete challenge"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Notes */}
      {showNotes && challenge.notes && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-xl">
          <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Notes</p>
          <p className="whitespace-pre-line">{challenge.notes}</p>
        </div>
      )}
    </div>
  );
}
