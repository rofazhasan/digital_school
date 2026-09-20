'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgressRing } from './CircularProgressRing';
import { AmbientAudioControls } from './AmbientAudioControls';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  CheckCircle,
  Maximize,
  Minimize,
  ArrowLeft,
  Flame,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Coffee,
  Clock,
  Zap,
} from 'lucide-react';
import {
  startFocusSessionAction,
  pauseFocusSessionAction,
  resumeFocusSessionAction,
  completeFocusSessionAction,
  getActiveFocusSessionAction,
} from '../../actions/focus-actions';
import { toast } from 'sonner';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export type FocusModeType = 'pomodoro' | 'deep' | 'custom';

interface FocusEngineProps {
  initialChallengeId?: string;
  initialArenaId?: string;
  initialDurationMinutes?: number;
  challengeTitle?: string;
  categoryLabel?: string;
  subjectName?: string;
}

export function FocusEngine({
  initialChallengeId,
  initialArenaId,
  initialDurationMinutes = 25,
  challengeTitle,
  categoryLabel,
  subjectName,
}: FocusEngineProps) {
  const router = useRouter();

  const [focusMode, setFocusMode] = useState<FocusModeType>(
    initialDurationMinutes === 50 ? 'deep' : initialDurationMinutes === 25 ? 'pomodoro' : 'custom'
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plannedEnd, setPlannedEnd] = useState<Date | null>(null);
  const [totalPlannedSeconds, setTotalPlannedSeconds] = useState(initialDurationMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialDurationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  // Break state
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakRemainingSeconds, setBreakRemainingSeconds] = useState(300); // 5 min
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);

  // Screen Wake Lock reference
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Acquire / Release Screen Wake Lock
  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator && (isRunning || isBreakActive)) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          // Wake lock request may fail if battery saver is on or user switches tabs
        }
      }
    }

    if (isRunning || isBreakActive) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isRunning, isBreakActive]);

  // Load existing session on mount
  useEffect(() => {
    async function loadActive() {
      try {
        const res = await getActiveFocusSessionAction();
        if (res.success && res.session) {
          const s = res.session;
          setSessionId(s.id);
          setTotalPlannedSeconds(s.plannedDurationMinutes * 60);

          if (s.status === 'ACTIVE' && s.plannedEnd) {
            const end = new Date(s.plannedEnd);
            setPlannedEnd(end);
            const rem = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
            setRemainingSeconds(rem);
            setIsRunning(rem > 0);
            setIsPaused(false);
          } else if (s.status === 'PAUSED') {
            const rem = Math.max(0, s.plannedDurationMinutes * 60 - s.secondsElapsed);
            setRemainingSeconds(rem);
            setIsRunning(false);
            setIsPaused(true);
          }
        }
      } catch (err) {
        console.error('Failed to load active focus session', err);
      }
    }
    loadActive();
  }, []);

  // Update timer based on real timestamp
  const updateTimerFromTimestamp = useCallback(() => {
    if (!plannedEnd || !isRunning) return;
    const now = Date.now();
    const rem = Math.max(0, Math.floor((plannedEnd.getTime() - now) / 1000));
    setRemainingSeconds(rem);

    if (rem === 0) {
      handleSessionTimerElapsed();
    }
  }, [plannedEnd, isRunning]);

  // High-frequency tick
  useEffect(() => {
    if (!isRunning || !plannedEnd) return;

    const interval = setInterval(updateTimerFromTimestamp, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimerFromTimestamp();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateTimerFromTimestamp);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateTimerFromTimestamp);
    };
  }, [isRunning, plannedEnd, updateTimerFromTimestamp]);

  // Break timer countdown
  useEffect(() => {
    if (!isBreakActive) return;

    const breakInterval = setInterval(() => {
      setBreakRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(breakInterval);
          setIsBreakActive(false);
          toast.success('Break finished! Ready to dive back in.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breakInterval);
  }, [isBreakActive]);

  // Preset Mode Switcher
  const handleSelectMode = (mode: FocusModeType) => {
    if (isRunning || isPaused) {
      toast.info('Session is currently in progress. Reset or finish first.');
      return;
    }
    setFocusMode(mode);
    if (mode === 'pomodoro') {
      setTotalPlannedSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
    } else if (mode === 'deep') {
      setTotalPlannedSeconds(50 * 60);
      setRemainingSeconds(50 * 60);
    }
  };

  // Start or resume focus
  const handleStartOrResume = async () => {
    triggerHaptic(ImpactStyle.Medium);

    if (isPaused && sessionId) {
      const res = await resumeFocusSessionAction(sessionId);
      if (res.success && res.session?.plannedEnd) {
        setPlannedEnd(new Date(res.session.plannedEnd));
        setIsRunning(true);
        setIsPaused(false);
      }
    } else {
      if (!initialArenaId) {
        toast.error('Arena ID required to track session');
        return;
      }

      const res = await startFocusSessionAction({
        arenaId: initialArenaId,
        challengeId: initialChallengeId,
        durationMinutes: Math.round(totalPlannedSeconds / 60),
      });

      if (res.success && res.session) {
        setSessionId(res.session.id);
        setPlannedEnd(new Date(res.session.plannedEnd));
        setIsRunning(true);
        setIsPaused(false);
      } else {
        toast.error(res.error || 'Failed to start focus session');
      }
    }
  };

  // Pause session
  const handlePause = async () => {
    if (!sessionId) return;
    triggerHaptic(ImpactStyle.Light);
    setIsRunning(false);
    setIsPaused(true);

    const elapsed = totalPlannedSeconds - remainingSeconds;
    await pauseFocusSessionAction(sessionId, elapsed);
  };

  // When timer naturally reaches 00:00
  const handleSessionTimerElapsed = async () => {
    setIsRunning(false);
    triggerHaptic(ImpactStyle.Heavy);
    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    if (sessionId) {
      await completeFocusSessionAction(sessionId, totalPlannedSeconds);
    }
    setShowBreakPrompt(true);
  };

  // Explicit complete session
  const handleCompleteSession = async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    triggerHaptic(ImpactStyle.Heavy);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    const elapsed = totalPlannedSeconds - remainingSeconds;
    const res = await completeFocusSessionAction(sessionId, Math.max(elapsed, 60));

    if (res.success) {
      toast.success('Focus session recorded! Consistency points awarded.');
      setShowBreakPrompt(true);
    } else {
      toast.error(res.error || 'Error completing session');
      setIsFinishing(false);
    }
  };

  // Start Smart Break
  const handleStartBreak = (breakMinutes: number = 5) => {
    setShowBreakPrompt(false);
    setIsBreakActive(true);
    setBreakRemainingSeconds(breakMinutes * 60);
    toast.info(`${breakMinutes}-minute recharge break started. Relax your eyes and breathe.`);
  };

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          handlePause();
        } else {
          handleStartOrResume();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setPrivacyMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, sessionId, totalPlannedSeconds, remainingSeconds]);

  // Format MM:SS for focus timer
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentage = totalPlannedSeconds > 0 ? ((totalPlannedSeconds - remainingSeconds) / totalPlannedSeconds) * 100 : 0;

  // Format MM:SS for break timer
  const breakMinutes = Math.floor(breakRemainingSeconds / 60);
  const breakSeconds = breakRemainingSeconds % 60;
  const breakFormatted = `${String(breakMinutes).padStart(2, '0')}:${String(breakSeconds).padStart(2, '0')}`;

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-between py-6 px-4 select-none">
      {/* Top Navigation & Controls */}
      <div className="w-full max-w-3xl flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/student/student-corner/arena')}
          className="rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Arena
        </Button>

        {/* Mode presets switcher (Pomodoro / Deep / Custom) */}
        {!isRunning && !isPaused && !isBreakActive && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => handleSelectMode('pomodoro')}
              className={`px-3 py-1 rounded-full transition-all ${
                focusMode === 'pomodoro'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleSelectMode('deep')}
              className={`px-3 py-1 rounded-full transition-all ${
                focusMode === 'deep'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Deep (50m)
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Privacy Mode Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`h-9 w-9 rounded-full border-slate-200 dark:border-slate-800 ${
              privacyMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : ''
            }`}
            title="Toggle Privacy Mode (Screen share / Projection safe)"
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          <AmbientAudioControls />

          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 rounded-full border-slate-200 dark:border-slate-800"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-8">
        {/* Challenge Context (with Privacy Mode support) */}
        <div className="space-y-1.5 max-w-md">
          {categoryLabel && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              {privacyMode ? 'Protected Session' : categoryLabel}
            </span>
          )}
          <h2
            className={`text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-all ${
              privacyMode ? 'filter blur-xs select-none' : ''
            }`}
          >
            {privacyMode ? 'Confidential Academic Task' : challengeTitle || 'Deep Focus Arena'}
          </h2>
          {subjectName && !privacyMode && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {subjectName}
            </p>
          )}
          {privacyMode && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <EyeOff className="w-3 h-3" /> Privacy Mode Active for Classroom / Projection
            </p>
          )}
        </div>

        {/* Break Mode or Progress Ring */}
        {isBreakActive ? (
          <div className="flex flex-col items-center p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 max-w-sm">
            <Coffee className="w-12 h-12 text-amber-600 dark:text-amber-400 mb-3 animate-bounce" />
            <h3 className="font-extrabold text-lg text-amber-950 dark:text-amber-200">Recharge Break</h3>
            <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 my-2">
              {breakFormatted}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 text-center mb-4">
              Look 20 feet away, stretch your shoulders, or hydrate.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsBreakActive(false);
                toast.success('Break finished! Welcome back.');
              }}
              className="rounded-full text-xs"
            >
              End Break Early
            </Button>
          </div>
        ) : (
          <div className="relative">
            <CircularProgressRing
              percentage={percentage}
              timeString={timeFormatted}
              subLabel={isRunning ? 'Flow Active' : isPaused ? 'Paused' : 'Ready'}
              size={340}
              strokeWidth={14}
            />
          </div>
        )}

        {/* Action Controls */}
        {!isBreakActive && (
          <div className="flex items-center gap-4 pt-2">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={handleStartOrResume}
                className="rounded-full h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{isPaused ? 'Resume Focus' : 'Start Focus'}</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handlePause}
                variant="outline"
                className="rounded-full h-14 px-8 border-slate-300 dark:border-slate-700 font-extrabold text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </Button>
            )}

            {(isRunning || isPaused) && (
              <Button
                size="lg"
                variant="default"
                onClick={handleCompleteSession}
                disabled={isFinishing}
                className="rounded-full h-14 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Done</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Minimalist Guidance */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 max-w-sm">
        <p>
          Press <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Space</kbd> to toggle,{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">F</kbd> for fullscreen,{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">P</kbd> for privacy mode.
        </p>
      </div>

      {/* Post-Session Smart Break Modal */}
      <Dialog open={showBreakPrompt} onOpenChange={setShowBreakPrompt}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black">Focus Block Completed!</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              High-intensity focus depletes cognitive energy. Take a quick structured break before diving into your next task.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-3">
            <button
              onClick={() => handleStartBreak(5)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-center"
            >
              <Coffee className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">5-Min Short Break</span>
              <span className="text-[10px] text-slate-500">Quick recharge</span>
            </button>
            <button
              onClick={() => handleStartBreak(15)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-center"
            >
              <Zap className="w-6 h-6 text-amber-500 mb-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">15-Min Deep Break</span>
              <span className="text-[10px] text-slate-500">Full cognitive rest</span>
            </button>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBreakPrompt(false);
                router.push('/student/student-corner/arena');
              }}
              className="w-full text-xs font-semibold text-slate-600"
            >
              Skip Break & Return to Arena
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
