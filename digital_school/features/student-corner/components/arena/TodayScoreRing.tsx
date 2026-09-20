'use client';

import React, { useState } from 'react';
import { TodayScoreDetails } from '../../types';
import { HelpCircle, CheckCircle2, Clock, AlertCircle, Target, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TodayScoreRingProps {
  scoreDetails: TodayScoreDetails;
}

export function TodayScoreRing({ scoreDetails }: TodayScoreRingProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreDetails.score / 100) * circumference;

  // Color token according to performance
  const ringColor =
    scoreDetails.score >= 80
      ? 'text-emerald-500 stroke-emerald-500'
      : scoreDetails.score >= 50
      ? 'text-indigo-500 stroke-indigo-500'
      : 'text-amber-500 stroke-amber-500';

  return (
    <>
      <div
        onClick={() => setShowExplanation(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowExplanation(true)}
        className="group relative flex items-center gap-4 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-pointer select-none"
      >
        {/* Animated Progress Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Filled Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`${ringColor} transition-all duration-700 ease-out`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Centered Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {scoreDetails.score}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Score
            </span>
          </div>
        </div>

        {/* Text Metrics & Breakdown Trigger */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Today’s Performance
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
            {scoreDetails.completedChallenges} / {scoreDetails.totalChallenges} Challenges Done
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-indigo-500" />
              {scoreDetails.focusMinutesLogged}m / {scoreDetails.focusTargetMinutes}m target
            </span>
            {scoreDetails.criticalTasksTotal > 0 && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                <Target className="w-3 h-3" />
                {scoreDetails.criticalTasksCompleted}/{scoreDetails.criticalTasksTotal} Priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transparent Calculation Breakdown Dialog (Item 8) */}
      <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>How Your Today Score is Calculated</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              A transparent, deterministic formula designed to measure real productivity, not fake vanity metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Component 1: Challenge Completion (50%) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between font-bold mb-1">
                <span>1. Challenge Completion (50% weight)</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  +{scoreDetails.calculationBreakdown.completionComponent} pts
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                You completed {scoreDetails.completedChallenges} out of {scoreDetails.totalChallenges} planned challenges ({scoreDetails.completionPercentage}%).
              </p>
            </div>

            {/* Component 2: Focus Target (30%) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between font-bold mb-1">
                <span>2. Focus Target Adherence (30% weight)</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  +{scoreDetails.calculationBreakdown.focusComponent} pts
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                You logged {scoreDetails.focusMinutesLogged} minutes of deep focus out of your {scoreDetails.focusTargetMinutes}m goal.
              </p>
            </div>

            {/* Component 3: Critical/High Priority Tasks (20%) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between font-bold mb-1">
                <span>3. High-Priority Execution (20% weight)</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  +{scoreDetails.calculationBreakdown.criticalComponent} pts
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                {scoreDetails.criticalTasksTotal > 0
                  ? `Completed ${scoreDetails.criticalTasksCompleted} of ${scoreDetails.criticalTasksTotal} high-priority milestones.`
                  : 'No high-priority tasks scheduled today (full points awarded).'}
              </p>
            </div>

            {/* Final Sum */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold">
              <span>Total Calculated Score</span>
              <span className="text-base font-black">{scoreDetails.score}%</span>
            </div>

            {/* 4-Pillar Core Standard (Workbook 105D Challenge Rule) */}
            {scoreDetails.coreStandardScore !== undefined && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-500">
                  <span>105D Challenge Daily Standard</span>
                  <span className="font-mono text-sm">{scoreDetails.coreStandardScore.toFixed(2)} / 1.00 pt</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${scoreDetails.coreStandardPillars?.study ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                    <span>{scoreDetails.coreStandardPillars?.study ? '✓' : '○'}</span> Morning/Subject Study
                  </div>
                  <div className={`flex items-center gap-1.5 ${scoreDetails.coreStandardPillars?.recall ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                    <span>{scoreDetails.coreStandardPillars?.recall ? '✓' : '○'}</span> Active Recall / Revision
                  </div>
                  <div className={`flex items-center gap-1.5 ${scoreDetails.coreStandardPillars?.exam ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                    <span>{scoreDetails.coreStandardPillars?.exam ? '✓' : '○'}</span> Exam / QB Practice
                  </div>
                  <div className={`flex items-center gap-1.5 ${scoreDetails.coreStandardPillars?.lifestyle ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                    <span>{scoreDetails.coreStandardPillars?.lifestyle ? '✓' : '○'}</span> 5 Salat & Lifestyle
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowExplanation(false)}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            Understood
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
