'use client';

import React from 'react';
import { Play, Pause, CheckCircle2, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatTimerClock,
  formatDurationHoursMinutes,
  getCategoryMeta,
  getChallengeUrgency,
  playGentleCompletionTone,
} from '@/features/student-corner/utils/cast-utils';

interface CastActiveMissionProps {
  task: any | null;
  secondsRemaining: number;
  totalTargetSeconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onCompleteTask: (taskId: string) => void;
  isLocked: boolean;
  className?: string;
}

export const CastActiveMission: React.FC<CastActiveMissionProps> = ({
  task,
  secondsRemaining,
  totalTargetSeconds,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onCompleteTask,
  isLocked,
  className = '',
}) => {
  if (!task) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl ${className}`}
      >
        <span className="text-4xl mb-3">🎯</span>
        <h3 className="text-xl font-bold text-white mb-1">No Active Mission</h3>
        <p className="text-sm text-slate-400">Select any challenge from Today's Arena to begin focus.</p>
      </div>
    );
  }

  const isCompleted = task.status === 'COMPLETED';
  const categoryMeta = getCategoryMeta(task.category, task.customCategoryName);
  const urgency = getChallengeUrgency(task.scheduledTime, task.status);

  // Time formatting
  const { main: clockDisplay } = formatTimerClock(secondsRemaining);

  // Progress percentage (elapsed / total)
  const elapsed = Math.max(0, totalTargetSeconds - secondsRemaining);
  const progressPercent =
    totalTargetSeconds > 0
      ? Math.min(100, Math.round((elapsed / totalTargetSeconds) * 100))
      : 0;

  return (
    <div
      className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none text-center ${className}`}
      aria-label="Active Mission Focus Cockpit"
    >
      {/* Top Tagline */}
      <div className="flex items-center justify-between gap-3 w-full mb-4">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${categoryMeta.bgSubtle} ${categoryMeta.textColor} border ${categoryMeta.borderColor}`}
        >
          <span>{categoryMeta.emoji}</span>
          <span>{categoryMeta.label}</span>
        </span>

        {task.scheduledTime && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${urgency.badgeBg} ${urgency.badgeText} ${urgency.badgeBorder}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due {task.scheduledTime}</span>
          </span>
        )}
      </div>

      {/* Task Heading */}
      <div className="space-y-1 mb-3">
        <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase text-indigo-400">
          ACTIVE MISSION
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white line-clamp-2 drop-shadow-md">
          {task.title}
        </h2>
        {task.notes && (
          <p className="text-xs sm:text-sm text-slate-400 font-medium line-clamp-1 italic max-w-lg mx-auto">
            {task.notes}
          </p>
        )}
      </div>

      {/* HUGE 3–5 Meter Legible Timer */}
      <div className="my-3 sm:my-5 flex flex-col items-center justify-center">
        <div
          className={`text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-mono font-black tracking-tighter text-white leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300 ${
            isRunning ? 'text-white' : 'text-slate-300/80'
          }`}
        >
          {clockDisplay}
        </div>

        {/* Minimal Session Progress Bar */}
        <div className="w-full max-w-md sm:max-w-xl h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-white/10 mt-4 sm:mt-6">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Progress Meta */}
        <div className="flex items-center justify-between w-full max-w-md sm:max-w-xl text-[11px] sm:text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mt-2 px-1">
          <span>{progressPercent}% Session Progress</span>
          <span>Target: {formatDurationHoursMinutes(task.durationMinutes)}</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-2">
        {/* Toggle Play / Pause */}
        <Button
          size="lg"
          onClick={onToggleTimer}
          className={`h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase transition-all shadow-xl ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-1 ring-indigo-400/50'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-2 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2 fill-current" />
              <span>START FOCUS</span>
            </>
          )}
        </Button>

        {/* Complete Task */}
        <Button
          size="lg"
          variant="outline"
          disabled={isLocked}
          onClick={() => {
            playGentleCompletionTone();
            onCompleteTask(task.id);
          }}
          className={`h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase border transition-all ${
            isCompleted
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border-white/20 bg-white/5 hover:bg-white/15 text-white shadow-lg'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
          <span>{isCompleted ? 'EXECUTED ✓' : 'COMPLETE'}</span>
        </Button>

        {/* Reset Session */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onResetTimer}
          title="Reset timer to target duration"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
