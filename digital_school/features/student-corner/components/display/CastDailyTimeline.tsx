'use client';

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { getCategoryMeta } from '@/features/student-corner/utils/cast-utils';

interface CastDailyTimelineProps {
  challenges: any[];
  activeChallengeId: string | null;
  onSelectChallenge: (challengeId: string) => void;
  className?: string;
}

export const CastDailyTimeline: React.FC<CastDailyTimelineProps> = ({
  challenges,
  activeChallengeId,
  onSelectChallenge,
  className = '',
}) => {
  const now = new Date();
  const currentTimeStr = format(now, 'HH:mm');

  // Sort by scheduled time or order index
  const chronological = [...challenges].sort((a, b) => {
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    if (a.scheduledTime) return -1;
    if (b.scheduledTime) return 1;
    return (a.orderIndex || 0) - (b.orderIndex || 0);
  });

  return (
    <div
      className={`relative flex flex-col p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl select-none ${className}`}
      aria-label="Today's Spatial Journey Timeline"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
            Today's Spatial Journey
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300/90 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>NOW: {currentTimeStr}</span>
        </div>
      </div>

      {/* Horizontal Scrollable Sequence */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
        {chronological.map((task, idx) => {
          const isActive = task.id === activeChallengeId;
          const isCompleted = task.status === 'COMPLETED';
          const categoryMeta = getCategoryMeta(task.category, task.customCategoryName);

          return (
            <React.Fragment key={task.id}>
              {/* Timeline Card Node */}
              <button
                type="button"
                onClick={() => onSelectChallenge(task.id)}
                className={`group relative shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300 hover:border-emerald-400'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                {/* Status Icon */}
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isActive ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-indigo-300" />
                )}

                {/* Content */}
                <div className="flex flex-col min-w-[100px] max-w-[160px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{categoryMeta.emoji}</span>
                    {task.scheduledTime && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {task.scheduledTime}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold truncate ${
                      isCompleted
                        ? 'line-through text-slate-400'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
              </button>

              {/* Connecting Dashed Line */}
              {idx < chronological.length - 1 && (
                <div className="shrink-0 w-4 h-px border-t border-dashed border-white/20" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
