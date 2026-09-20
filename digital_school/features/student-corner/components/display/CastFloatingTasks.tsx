'use client';

import React from 'react';
import { ArenaChallenge, DayMode } from '@prisma/client';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Play,
  Lock,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  getChallengeUrgency,
  formatDurationHoursMinutes,
  getCategoryMeta,
  playGentleCompletionTone,
} from '@/features/student-corner/utils/cast-utils';

interface CastFloatingTasksProps {
  challenges: any[];
  activeChallengeId: string | null;
  onSelectChallenge: (challengeId: string) => void;
  onToggleComplete: (challengeId: string) => void;
  dayMode: DayMode;
  isLocked: boolean;
  className?: string;
}

export const CastFloatingTasks: React.FC<CastFloatingTasksProps> = ({
  challenges,
  activeChallengeId,
  onSelectChallenge,
  onToggleComplete,
  dayMode,
  isLocked,
  className = '',
}) => {
  const now = new Date();

  // Sort challenges: Active first, then by urgency / orderIndex, completed last
  const sortedChallenges = [...challenges].sort((a, b) => {
    if (a.id === activeChallengeId) return -1;
    if (b.id === activeChallengeId) return 1;

    const aUrgency = getChallengeUrgency(a.scheduledTime, a.status, now);
    const bUrgency = getChallengeUrgency(b.scheduledTime, b.status, now);

    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1;

    if (aUrgency.orderWeight !== bUrgency.orderWeight) {
      return aUrgency.orderWeight - bUrgency.orderWeight;
    }

    return (a.orderIndex || 0) - (b.orderIndex || 0);
  });

  return (
    <div className={`flex flex-col h-full ${className}`} aria-label="Today's Arena Floating Tasks">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300">
            Today's Arena ({challenges.length} Missions)
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Click any card to activate
        </span>
      </div>

      {/* Spatial Scrollable Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 pb-4 max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-white/10">
        {sortedChallenges.map((task) => {
          const isActive = task.id === activeChallengeId;
          const isCompleted = task.status === 'COMPLETED';
          const urgency = getChallengeUrgency(task.scheduledTime, task.status, now);
          const categoryMeta = getCategoryMeta(task.category, task.customCategoryName);

          return (
            <div
              key={task.id}
              onClick={() => onSelectChallenge(task.id)}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-300 cursor-pointer select-none text-left backdrop-blur-xl border ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/70 shadow-[0_0_30px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50 scale-[1.01]'
                  : isCompleted
                  ? 'bg-white/[0.02] border-emerald-500/20 opacity-70 hover:opacity-90'
                  : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.07] shadow-lg'
              }`}
            >
              {/* Top Row: Category Pill + Urgency Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryMeta.bgSubtle} ${categoryMeta.textColor} border ${categoryMeta.borderColor}`}
                >
                  <span>{categoryMeta.emoji}</span>
                  <span className="truncate max-w-[110px]">{categoryMeta.label}</span>
                </span>

                {/* Urgency Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${urgency.badgeBg} ${urgency.badgeText} ${urgency.badgeBorder} ${
                    urgency.pulse ? 'animate-pulse' : ''
                  }`}
                >
                  {urgency.level === 'OVERDUE' || urgency.level === 'CRITICAL' ? (
                    <AlertCircle className="w-2.5 h-2.5" />
                  ) : null}
                  <span>{urgency.label}</span>
                </span>
              </div>

              {/* Task Title & Topic Details */}
              <div className="my-1">
                <h4
                  className={`text-sm sm:text-base font-bold tracking-tight line-clamp-2 transition-colors ${
                    isCompleted
                      ? 'line-through text-slate-400 decoration-slate-600'
                      : isActive
                      ? 'text-white'
                      : 'text-slate-100 group-hover:text-indigo-200'
                  }`}
                >
                  {task.title}
                </h4>

                {/* Subject or Topic subline */}
                {task.subjects && task.subjects.length > 0 && (
                  <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                    {task.subjects.map((s: any) => s.subject?.name || s.name).join(' • ')}
                  </p>
                )}
              </div>

              {/* Bottom Metadata & Execution Controls */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px] font-mono">
                {/* Duration & Due Time */}
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDurationHoursMinutes(task.durationMinutes)}</span>
                  </span>
                  {task.scheduledTime && (
                    <>
                      <span>•</span>
                      <span className={urgency.isUrgent ? urgency.badgeText : 'text-slate-400'}>
                        {urgency.remainingText}
                      </span>
                    </>
                  )}
                </div>

                {/* Interactive Action: Complete Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked && dayMode !== 'LOCKED') {
                      if (!isCompleted) playGentleCompletionTone();
                      onToggleComplete(task.id);
                    }
                  }}
                  disabled={isLocked || dayMode === 'LOCKED'}
                  title={
                    isLocked || dayMode === 'LOCKED'
                      ? 'Locked in DND Mode'
                      : isCompleted
                      ? 'Mark Incomplete'
                      : 'Mark Completed'
                  }
                  className={`p-1.5 rounded-lg transition-all ${
                    isCompleted
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 group-hover:text-indigo-300" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
