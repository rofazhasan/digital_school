'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Maximize,
  Minimize,
  ArrowLeft,
  LayoutGrid,
  Focus,
  Milestone,
  BookOpen,
  HelpCircle,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleChallengeCompletionAction } from '@/features/student-corner/actions/arena-actions';
import { QuranReflection } from '@/features/student-corner/types';
import { CastSpiritualHeader } from './CastSpiritualHeader';
import { CastStudentIdentity } from './CastStudentIdentity';
import { CastFloatingTasks } from './CastFloatingTasks';
import { CastActiveMission } from './CastActiveMission';
import { CastDailyTimeline } from './CastDailyTimeline';
import { CastQuranSection } from './CastQuranSection';
import { CastExamBanner } from './CastExamBanner';
import { CastShortcutsModal } from './CastShortcutsModal';

export type CastLayoutMode = 'COMMAND_CENTER' | 'DEEP_FOCUS' | 'DAILY_JOURNEY' | 'QURAN_SPLIT';

interface FocusCastDisplayProps {
  initialArena?: any;
  studentName?: string;
  streakInfo?: any;
  todayScore?: any;
  upcomingExams?: any[];
  quranList?: QuranReflection[];
  hijriDate?: string | null;
  // Fallbacks for legacy props
  initialTitle?: string;
  initialSubject?: string;
  initialMinutes?: number;
  completedCount?: number;
  totalCount?: number;
  dailyAyahText?: string;
  dailyAyahSource?: string;
}

export function FocusCastDisplay({
  initialArena,
  studentName = 'Student',
  streakInfo,
  todayScore,
  upcomingExams = [],
  quranList = [],
  hijriDate,
  initialTitle,
  initialSubject,
  initialMinutes = 45,
}: FocusCastDisplayProps) {
  const router = useRouter();

  // Arena & Challenges State
  const [arena, setArena] = useState<any>(initialArena || {
    challenges: [
      {
        id: 'legacy-1',
        title: initialTitle || 'Deep Study & Problem Solving',
        category: 'STUDY',
        durationMinutes: initialMinutes,
        status: 'PENDING',
        scheduledTime: '18:00',
      },
    ],
    mode: 'NORMAL',
    isLocked: false,
  });

  const challenges = (arena?.challenges || []).filter((c: any) => !c.isArchived);

  // Active Challenge Selection
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(() => {
    const inProgress = challenges.find((c: any) => c.status === 'IN_PROGRESS');
    if (inProgress) return inProgress.id;
    const firstPending = challenges.find((c: any) => c.status !== 'COMPLETED');
    return firstPending?.id || challenges[0]?.id || null;
  });

  const activeTask = challenges.find((c: any) => c.id === activeChallengeId) || challenges[0] || null;

  // Client-Side Timer Engine (Zero Per-Second Server Polling)
  const targetDurationSeconds = (activeTask?.durationMinutes || 45) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(targetDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // References for timestamp-based drift-free countdown
  const timerEndTimeRef = useRef<number | null>(null);
  const timerRemainingAtPauseRef = useRef<number>(targetDurationSeconds);

  // Update timer target when activeTask changes
  useEffect(() => {
    if (activeTask) {
      const secs = (activeTask.durationMinutes || 45) * 60;
      setSecondsRemaining(secs);
      timerRemainingAtPauseRef.current = secs;
      timerEndTimeRef.current = null;
      setIsTimerRunning(false);
    }
  }, [activeChallengeId, activeTask?.durationMinutes]);

  // Timestamp countdown loop
  useEffect(() => {
    let animationFrameId: number;

    if (isTimerRunning) {
      if (!timerEndTimeRef.current) {
        timerEndTimeRef.current = Date.now() + timerRemainingAtPauseRef.current * 1000;
      }

      const tick = () => {
        if (!timerEndTimeRef.current) return;
        const diffMs = timerEndTimeRef.current - Date.now();
        const nextSeconds = Math.max(0, Math.round(diffMs / 1000));
        setSecondsRemaining(nextSeconds);

        if (nextSeconds <= 0) {
          setIsTimerRunning(false);
          timerEndTimeRef.current = null;
          timerRemainingAtPauseRef.current = 0;
        } else {
          animationFrameId = requestAnimationFrame(tick);
        }
      };

      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isTimerRunning]);

  const handleToggleTimer = useCallback(() => {
    setIsTimerRunning((prev) => {
      if (!prev) {
        // Resuming or starting
        timerEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      } else {
        // Pausing
        timerRemainingAtPauseRef.current = secondsRemaining;
        timerEndTimeRef.current = null;
      }
      return !prev;
    });
  }, [secondsRemaining]);

  const handleResetTimer = useCallback(() => {
    setIsTimerRunning(false);
    timerEndTimeRef.current = null;
    timerRemainingAtPauseRef.current = targetDurationSeconds;
    setSecondsRemaining(targetDurationSeconds);
  }, [targetDurationSeconds]);

  // Presentation Layout Modes
  const [layoutMode, setLayoutMode] = useState<CastLayoutMode>('COMMAND_CENTER');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shortcuts Dialog
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Cinematic Entry Sequence (approx 1.1s)
  const [isCinematicEntry, setIsCinematicEntry] = useState(true);

  useEffect(() => {
    const entryTimer = setTimeout(() => {
      setIsCinematicEntry(false);
    }, 1100);
    return () => clearTimeout(entryTimer);
  }, []);

  // Ambient Mode (Fades controls after 45s of no interaction)
  const [isAmbientIdle, setIsAmbientIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsAmbientIdle(false);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsAmbientIdle(true);
    }, 45000); // 45 seconds
  }, []);

  useEffect(() => {
    const handleUserActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [resetIdleTimer]);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Fallback gracefully if permission denied
      }
    };
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Challenge Completion Action
  const handleToggleComplete = async (challengeId: string) => {
    // Optimistic client update
    setArena((prev: any) => {
      const updated = prev.challenges.map((c: any) => {
        if (c.id === challengeId) {
          const isNowCompleted = c.status !== 'COMPLETED';
          return {
            ...c,
            status: isNowCompleted ? 'COMPLETED' : 'PENDING',
            completedAt: isNowCompleted ? new Date() : null,
          };
        }
        return c;
      });
      return { ...prev, challenges: updated };
    });

    // Discrete Server Action
    try {
      await toggleChallengeCompletionAction(challengeId);
    } catch {
      // Revert if server action failed
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is in input/modal
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (activeChallengeId) handleToggleComplete(activeChallengeId);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setLayoutMode((prev) => {
          if (prev === 'COMMAND_CENTER') return 'DEEP_FOCUS';
          if (prev === 'DEEP_FOCUS') return 'DAILY_JOURNEY';
          if (prev === 'DAILY_JOURNEY') return 'QURAN_SPLIT';
          return 'COMMAND_CENTER';
        });
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        // Select next challenge
        const currIdx = challenges.findIndex((c: any) => c.id === activeChallengeId);
        if (currIdx !== -1 && currIdx < challenges.length - 1) {
          setActiveChallengeId(challenges[currIdx + 1].id);
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        // Select previous challenge
        const currIdx = challenges.findIndex((c: any) => c.id === activeChallengeId);
        if (currIdx > 0) {
          setActiveChallengeId(challenges[currIdx - 1].id);
        }
      } else if (e.code === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
          setIsFullscreen(false);
        } else {
          router.push('/student/student-corner/arena');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChallengeId, challenges, handleToggleTimer, isShortcutsOpen, router]);

  // Derived Metrics
  const completedCount = challenges.filter((c: any) => c.status === 'COMPLETED').length;
  const totalCount = challenges.length;
  const streakDays = streakInfo?.currentStreak ?? 14;
  const todayScoreVal = todayScore?.overallScore ?? 84;
  const upcomingExam = upcomingExams && upcomingExams.length > 0 ? upcomingExams[0] : null;

  // Cinematic Splash Transition
  if (isCinematicEntry) {
    return (
      <div
        onClick={() => setIsCinematicEntry(false)}
        className="fixed inset-0 z-50 bg-[#030712] text-white flex flex-col items-center justify-center cursor-pointer select-none"
      >
        <div className="font-arabic text-6xl sm:text-8xl md:text-9xl text-white font-bold drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] animate-pulse">
          اللَّه
        </div>
        <p className="text-sm sm:text-base font-bold tracking-widest uppercase text-indigo-300 mt-6 animate-pulse">
          PREPARING TODAY'S ARENA...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-y-auto font-sans">
      {/* Subtle Atmospheric Gradient Field */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      {/* Floating Control Ribbon (Auto-fades on idle) */}
      <nav
        className={`relative z-20 flex items-center justify-between gap-4 transition-all duration-500 mb-3 ${
          isAmbientIdle ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100'
        }`}
        aria-label="Cast Display Navigation"
      >
        {/* Exit link back to Arena */}
        <Link
          href="/student/student-corner/arena"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Cast Mode (Esc)</span>
        </Link>

        {/* Layout Mode Switcher Bar */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg">
          <button
            type="button"
            onClick={() => setLayoutMode('COMMAND_CENTER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              layoutMode === 'COMMAND_CENTER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('DEEP_FOCUS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              layoutMode === 'DEEP_FOCUS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Focus className="w-3.5 h-3.5" />
            <span>Deep Focus</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('DAILY_JOURNEY')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              layoutMode === 'DAILY_JOURNEY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>Daily Journey</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('QURAN_SPLIT')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              layoutMode === 'QURAN_SPLIT'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Quran Split</span>
          </button>
        </div>

        {/* Right Actions: Fullscreen + Shortcuts Help */}
        <div className="flex items-center gap-2">
          {upcomingExam && <CastExamBanner upcomingExam={upcomingExam} className="hidden lg:inline-flex" />}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </nav>

      {/* Main Cast Viewport by Active Mode */}
      <main className="relative z-10 flex-1 flex flex-col justify-between gap-6 max-w-7xl mx-auto w-full my-auto">
        {/* ========================================================================= */}
        {/* MODE A: COMMAND CENTER (Default Cockpit)                                  */}
        {/* ========================================================================= */}
        {layoutMode === 'COMMAND_CENTER' && (
          <div className="flex flex-col gap-5 w-full">
            {/* Spiritual & Gratitude Header */}
            <CastSpiritualHeader hijriDate={hijriDate} />

            {/* Student Identity & Metric Badges */}
            <CastStudentIdentity
              studentName={studentName}
              completedCount={completedCount}
              totalCount={totalCount}
              streakDays={streakDays}
              todayScore={todayScoreVal}
              dayMode={arena?.mode || 'NORMAL'}
              isLocked={arena?.isLocked || false}
            />

            {/* Challenges Grid or Fresh Start Empty State */}
            {challenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 sm:p-14 my-auto text-center rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl max-w-xl mx-auto select-none space-y-3">
                <div className="font-arabic text-5xl text-white font-bold drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  اللَّه
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
                    FRESH START
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    NEW DAY • NEW MISSION
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Your Arena is clear. Today is yours to design. Build your focus missions, prayers, and habits.
                  </p>
                </div>
                <Link
                  href="/student/student-corner/arena"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Build Today's Arena</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Split Arena: Left Active Mission (Huge Timer) • Right Floating Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-6 xl:col-span-7 flex flex-col">
                    <CastActiveMission
                      task={activeTask}
                      secondsRemaining={secondsRemaining}
                      totalTargetSeconds={targetDurationSeconds}
                      isRunning={isTimerRunning}
                      onToggleTimer={handleToggleTimer}
                      onResetTimer={handleResetTimer}
                      onCompleteTask={handleToggleComplete}
                      isLocked={arena?.isLocked || false}
                      className="h-full"
                    />
                  </div>
                  <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
                    <CastFloatingTasks
                      challenges={challenges}
                      activeChallengeId={activeChallengeId}
                      onSelectChallenge={(id) => setActiveChallengeId(id)}
                      onToggleComplete={handleToggleComplete}
                      dayMode={arena?.mode || 'NORMAL'}
                      isLocked={arena?.isLocked || false}
                      className="h-full"
                    />
                  </div>
                </div>

                {/* Full-Day Spatial Timeline */}
                <CastDailyTimeline
                  challenges={challenges}
                  activeChallengeId={activeChallengeId}
                  onSelectChallenge={(id) => setActiveChallengeId(id)}
                />
              </>
            )}

            {/* Quran Ayah Bar */}
            <CastQuranSection quranList={quranList} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE B: DEEP FOCUS (Ultra-Minimalist Giant Timer)                         */}
        {/* ========================================================================= */}
        {layoutMode === 'DEEP_FOCUS' && (
          <div className="flex flex-col items-center justify-center my-auto w-full max-w-4xl mx-auto space-y-6 text-center">
            {/* Minimal Spiritual Header */}
            <div className="font-arabic text-4xl sm:text-6xl text-white font-bold drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-2">
              اللَّه
            </div>

            {/* Giant Active Mission Card */}
            <div className="w-full">
              <CastActiveMission
                task={activeTask}
                secondsRemaining={secondsRemaining}
                totalTargetSeconds={targetDurationSeconds}
                isRunning={isTimerRunning}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onCompleteTask={handleToggleComplete}
                isLocked={arena?.isLocked || false}
                className="w-full"
              />
            </div>

            {/* Minimal Reflection at bottom */}
            <div className="w-full max-w-2xl">
              <CastQuranSection quranList={quranList} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE C: DAILY JOURNEY (Whole Day Progression View)                         */}
        {/* ========================================================================= */}
        {layoutMode === 'DAILY_JOURNEY' && (
          <div className="flex flex-col gap-6 w-full">
            <CastStudentIdentity
              studentName={studentName}
              completedCount={completedCount}
              totalCount={totalCount}
              streakDays={streakDays}
              todayScore={todayScoreVal}
              dayMode={arena?.mode || 'NORMAL'}
              isLocked={arena?.isLocked || false}
            />

            <CastDailyTimeline
              challenges={challenges}
              activeChallengeId={activeChallengeId}
              onSelectChallenge={(id) => setActiveChallengeId(id)}
            />

            <div className="w-full">
              <CastFloatingTasks
                challenges={challenges}
                activeChallengeId={activeChallengeId}
                onSelectChallenge={(id) => setActiveChallengeId(id)}
                onToggleComplete={handleToggleComplete}
                dayMode={arena?.mode || 'NORMAL'}
                isLocked={arena?.isLocked || false}
              />
            </div>

            <CastQuranSection quranList={quranList} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE D: QURAN + STUDY SPLIT (Balanced Split Screen)                       */}
        {/* ========================================================================= */}
        {layoutMode === 'QURAN_SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
            {/* Left Column: Student Identity + Active Task + Tasks */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <CastStudentIdentity
                studentName={studentName}
                completedCount={completedCount}
                totalCount={totalCount}
                streakDays={streakDays}
                todayScore={todayScoreVal}
                dayMode={arena?.mode || 'NORMAL'}
                isLocked={arena?.isLocked || false}
              />

              <CastActiveMission
                task={activeTask}
                secondsRemaining={secondsRemaining}
                totalTargetSeconds={targetDurationSeconds}
                isRunning={isTimerRunning}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onCompleteTask={handleToggleComplete}
                isLocked={arena?.isLocked || false}
              />

              <CastFloatingTasks
                challenges={challenges}
                activeChallengeId={activeChallengeId}
                onSelectChallenge={(id) => setActiveChallengeId(id)}
                onToggleComplete={handleToggleComplete}
                dayMode={arena?.mode || 'NORMAL'}
                isLocked={arena?.isLocked || false}
              />
            </div>

            {/* Right Column: Deep Quran Sanctuary */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center text-center mb-4">
                <div className="font-arabic text-5xl text-white font-bold drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              </div>
              <CastQuranSection quranList={quranList} isSplitMode={true} className="h-full" />
            </div>
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <CastShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
