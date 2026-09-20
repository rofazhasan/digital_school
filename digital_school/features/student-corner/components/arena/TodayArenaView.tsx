'use client';

import React, { useState } from 'react';
import { DailyArenaWithChallenges, TodayScoreDetails } from '../../types';
import { ChallengeCategory, DayMode, ChallengeStatus } from '@prisma/client';
import { ChallengeCard } from './ChallengeCard';
import { DayModeSelector } from './DayModeSelector';
import { DayBuilderModal } from './DayBuilderModal';
import { TodayScoreRing } from './TodayScoreRing';
import { DailyTimelineView } from './DailyTimelineView';
import { RecoveryModeDialog } from './RecoveryModeDialog';
import { ManageCompletedModal } from './ManageCompletedModal';
import { ResetArenaModal } from './ResetArenaModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Target,
  Sparkles,
  Lock,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  List,
  CalendarDays,
  LifeBuoy,
  Copy,
  Archive,
  RotateCcw,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { duplicateDayAction, getRecoveryBacklogAction } from '../../actions/arena-actions';
import { toast } from 'sonner';

interface TodayArenaViewProps {
  initialArena: DailyArenaWithChallenges;
  studentName: string;
  currentStreak: number;
  scoreDetails?: TodayScoreDetails;
  dueRevisions?: any[];
  dueMistakes?: any[];
  isExamDay?: boolean;
  examTodayTitle?: string | null;
  onRefresh?: () => void;
}

export function TodayArenaView({
  initialArena,
  studentName,
  currentStreak,
  scoreDetails,
  dueRevisions = [],
  dueMistakes = [],
  isExamDay = false,
  examTodayTitle = null,
  onRefresh,
}: TodayArenaViewProps) {
  const [arena, setArena] = useState<DailyArenaWithChallenges>(initialArena);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [dayBuilderOpen, setDayBuilderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Recovery dialog
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [manageCompletedOpen, setManageCompletedOpen] = useState(false);
  const [resetArenaOpen, setResetArenaOpen] = useState(false);
  const [backlogItems, setBacklogItems] = useState<any[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const formattedDate = format(new Date(arena.date), 'EEEE, d MMMM yyyy');

  const totalCount = arena.challenges.length;
  const completedCount = arena.challenges.filter((c) => c.status === ChallengeStatus.COMPLETED).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalPlannedHours = Math.round((arena.totalPlannedMinutes / 60) * 10) / 10;
  const totalCompletedHours = Math.round((arena.totalCompletedMinutes / 60) * 10) / 10;

  // Derive score if not provided
  const derivedScoreDetails: TodayScoreDetails = scoreDetails || {
    score: completionPercentage,
    totalChallenges: totalCount,
    completedChallenges: completedCount,
    completionPercentage,
    focusMinutesLogged: arena.totalCompletedMinutes,
    focusTargetMinutes: arena.totalPlannedMinutes,
    criticalTasksTotal: totalCount,
    criticalTasksCompleted: completedCount,
    calculationBreakdown: {
      completionComponent: Math.round(completionPercentage * 0.5),
      focusComponent: Math.round((arena.totalPlannedMinutes > 0 ? Math.min(100, (arena.totalCompletedMinutes / arena.totalPlannedMinutes) * 100) : 0) * 0.3),
      criticalComponent: Math.round((totalCount > 0 ? (completedCount / totalCount) * 100 : 0) * 0.2),
    },
  };

  // Filter challenges by category
  const filteredChallenges = arena.challenges.filter((c) => {
    if (activeCategoryFilter === 'ALL') return true;
    return c.category === activeCategoryFilter;
  });

  const availableCategories = Array.from(new Set(arena.challenges.map((c) => c.category)));

  // Handle Recovery Triage Open
  const handleOpenRecovery = async () => {
    const res = await getRecoveryBacklogAction();
    if (res.success && res.backlog) {
      setBacklogItems(res.backlog);
      setRecoveryOpen(true);
    } else {
      toast.info('No overdue challenges in backlog! You are on track.');
    }
  };

  // Duplicate Yesterday's Routine
  const handleDuplicateYesterday = async () => {
    setIsDuplicating(true);
    try {
      const yesterdayStr = format(subDays(new Date(arena.date), 1), 'yyyy-MM-dd');
      const todayStr = format(new Date(arena.date), 'yyyy-MM-dd');
      const res = await duplicateDayAction(yesterdayStr, todayStr);
      if (res.success && res.arena) {
        toast.success("Yesterday's routine duplicated successfully!");
        setArena(res.arena as any);
        onRefresh?.();
      } else {
        toast.error(res.error || 'No routine found on previous day to duplicate');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error duplicating routine');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exam Day Mode Banner */}
      {isExamDay && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 shadow-lg shadow-amber-500/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Target className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Exam Day Mode Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                  Priority Execution
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {examTodayTitle || 'Exam Scheduled Today'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Today&apos;s Arena is adapted for peak exam performance: Rest, light active recall, exam sprint, and calm recovery.
              </p>
            </div>
          </div>
          <Link href="/student/student-corner/exams">
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold whitespace-nowrap">
              View Exam Details →
            </Button>
          </Link>
        </div>
      )}

      {/* High Workload Overload Warning Banner */}
      {arena.totalPlannedMinutes >= 480 && (
        <div className="rounded-2xl p-3.5 bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>High Workload Alert:</strong> You have planned <strong>{totalPlannedHours} hours</strong> today. Factor in recovery, nutrition, and 5 prayer intervals to maintain sustainable mental endurance.
          </span>
        </div>
      )}

      {/* Due Spaced Revisions & Retests Alert Strip */}
      {((dueRevisions && dueRevisions.length > 0) || (dueMistakes && dueMistakes.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dueRevisions && dueRevisions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Brain className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-indigo-300">
                    {dueRevisions.length} Spaced Revisions Due
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {dueRevisions.map((r) => r.title).join(', ')}
                  </p>
                </div>
              </div>
              <Link href="/student/student-corner/revision">
                <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3">
                  Recall Vault →
                </Button>
              </Link>
            </div>
          )}

          {dueMistakes && dueMistakes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-rose-300">
                    {dueMistakes.length} Error Retests Due
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {dueMistakes.map((m) => m.errorNumber).join(', ')} in Mistake Lab
                  </p>
                </div>
              </div>
              <Link href="/student/student-corner/mistakes">
                <Button size="sm" className="h-7 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3">
                  Retest Lab →
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Above the Fold Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-indigo-900/10 via-slate-900/5 to-transparent p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Daily Arena
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Build today’s version of yourself, {studentName}.
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Your personal arena. Lock in discipline, master your syllabus, and track real focus hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <DayModeSelector
              arenaId={arena.id}
              currentMode={arena.mode}
              isLocked={arena.isLocked}
              onModeChanged={(newMode) => {
                setArena({
                  ...arena,
                  mode: newMode,
                  isLocked: newMode === DayMode.LOCKED,
                });
                onRefresh?.();
              }}
            />

            {!arena.isLocked && arena.mode !== DayMode.LOCKED && (
              <>
                {arena.challenges.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDuplicating}
                    onClick={handleDuplicateYesterday}
                    className="rounded-full text-xs font-semibold border-slate-200 dark:border-slate-800"
                    title="Duplicate challenges from previous day"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Duplicate Yesterday</span>
                  </Button>
                )}

                <Button
                  onClick={() => setDayBuilderOpen(true)}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 h-9 shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Challenge</span>
                </Button>
              </>
            )}

            {/* Recovery Mode Trigger */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenRecovery}
              title="Recovery Mode & Backlog Triage"
              className="rounded-full h-9 w-9 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600"
            >
              <LifeBuoy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dynamic Dual Strip: Animated Today Score Ring + Metric Cards */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          {/* Animated Today Score Ring (Item 10) */}
          <div className="shrink-0">
            <TodayScoreRing scoreDetails={derivedScoreDetails} />
          </div>

          {/* Progress & Stat Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Completion</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {completionPercentage}%
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Tasks Done</span>
                <Target className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {completedCount} <span className="text-xs font-medium text-slate-400">/ {totalCount}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {totalCount - completedCount} remaining
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Focus Hours</span>
                <Clock className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {totalCompletedHours}h <span className="text-xs font-medium text-slate-400">/ {totalPlannedHours}h</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {arena.totalCompletedMinutes}m logged
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Discipline</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentStreak} <span className="text-xs font-medium text-slate-400">Days</span>
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                Consistency is power
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strict / Locked Mode Warning Banner */}
      {arena.isLocked && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 shadow-xs animate-in fade-in">
          <div className="p-2 rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider">Day Locked (DND Mode)</p>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Your plan is sealed for the day. Execute with focus. Modifications are locked out to preserve integrity.
            </p>
          </div>
        </div>
      )}

      {/* Controls Bar: Category Filters & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeCategoryFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({totalCount})
          </button>
          {availableCategories.map((cat) => {
            const count = arena.challenges.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (List vs Chronological Timeline) & Completed Cleanup */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {completedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManageCompletedOpen(true)}
              className="rounded-full text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 px-3"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>Clean Completed ({completedCount})</span>
            </Button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Timeline View or List View */}
      {viewMode === 'timeline' ? (
        <DailyTimelineView
          challenges={arena.challenges as any}
          arenaId={arena.id}
        />
      ) : (
        <div className="space-y-3">
          {filteredChallenges.length > 0 ? (
            filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                dayMode={arena.mode}
                isLocked={arena.isLocked}
                onRefreshNeeded={onRefresh}
              />
            ))
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 select-none">
              <div className="font-arabic text-3xl text-indigo-400 font-bold mb-1">
                اللَّه
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                NEW DAY • NEW MISSION
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your Arena is clear. Today is yours to design with study goals, coding practice, prayers, and habits.
              </p>
              {!arena.isLocked && (
                <Button
                  onClick={() => setDayBuilderOpen(true)}
                  className="mt-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-md shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Plan Today’s Arena
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone: Reset Arena Trigger */}
      {!arena.isLocked && arena.mode !== 'LOCKED' && totalCount > 0 && (
        <div className="pt-8 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            <p className="font-bold text-slate-600 dark:text-slate-400">Want a clean slate for today?</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Restart planning from zero without affecting your streak or historical achievement.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetArenaOpen(true)}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset Arena</span>
          </Button>
        </div>
      )}

      {/* Day Builder Modal */}
      <DayBuilderModal
        open={dayBuilderOpen}
        onOpenChange={setDayBuilderOpen}
        currentDate={format(new Date(arena.date), 'yyyy-MM-dd')}
        onChallengeAdded={onRefresh}
      />

      {/* Recovery Mode Dialog */}
      <RecoveryModeDialog
        open={recoveryOpen}
        onOpenChange={setRecoveryOpen}
        backlogItems={backlogItems}
        onResolved={() => {
          setRecoveryOpen(false);
          onRefresh?.();
        }}
      />

      {/* Manage Completed Modal */}
      <ManageCompletedModal
        open={manageCompletedOpen}
        onOpenChange={setManageCompletedOpen}
        arenaId={arena.id}
        completedChallenges={arena.challenges.filter((c) => c.status === ChallengeStatus.COMPLETED)}
        activeCount={arena.challenges.filter((c) => c.status !== ChallengeStatus.COMPLETED).length}
        onSuccess={onRefresh}
      />

      {/* Reset Arena Modal */}
      <ResetArenaModal
        open={resetArenaOpen}
        onOpenChange={setResetArenaOpen}
        arenaId={arena.id}
        onSuccess={onRefresh}
      />
    </div>
  );
}
