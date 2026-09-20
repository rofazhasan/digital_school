'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Maximize, Minimize, ArrowLeft, Clock, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusCastDisplayProps {
  initialTitle?: string;
  initialSubject?: string;
  initialMinutes?: number;
  completedCount?: number;
  totalCount?: number;
  dailyAyahText?: string;
  dailyAyahSource?: string;
}

export function FocusCastDisplay({
  initialTitle = 'Deep Study & Problem Solving',
  initialSubject = 'Mathematics & Science',
  initialMinutes = 45,
  completedCount = 3,
  totalCount = 7,
  dailyAyahText = 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
  dailyAyahSource = 'সূরা ত্ব-হা: ১১৪',
}: FocusCastDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isActive && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, secondsLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.round(((initialMinutes * 60 - secondsLeft) / (initialMinutes * 60)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-8 sm:p-12 md:p-16 select-none overflow-hidden font-sans">
      {/* Top Ambient Bar */}
      <div className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
        <Link
          href="/student/student-corner/arena"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Cast Mode</span>
        </Link>

        <div className="flex items-center gap-4 text-xs tracking-wider uppercase text-slate-400 font-bold">
          <span>Digital School • Student Arena</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white h-8 w-8"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Center Giant Countdown */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-6">
        <div className="space-y-2">
          <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-widest text-indigo-400">
            {initialSubject}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-100">
            {initialTitle}
          </h1>
        </div>

        {/* Huge Display Timer */}
        <div className="text-7xl sm:text-9xl md:text-[13rem] font-mono font-black tracking-tighter text-white leading-none drop-shadow-2xl">
          {timeFormatted}
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full max-w-xl h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Daily Stats */}
        <div className="flex items-center gap-6 text-sm sm:text-base font-bold text-slate-400 uppercase tracking-widest pt-2">
          <span>Today: {completedCount} / {totalCount} Complete</span>
          <span>•</span>
          <span>Progress: {progressPercent}%</span>
        </div>
      </div>

      {/* Bottom Subtle Reflection */}
      <div className="flex flex-col items-center text-center opacity-60 hover:opacity-100 transition-opacity space-y-1">
        <p className="font-arabic text-xl sm:text-2xl text-indigo-200 tracking-wide">
          {dailyAyahText}
        </p>
        <p className="text-[11px] font-medium text-slate-400">
          {dailyAyahSource}
        </p>
      </div>
    </div>
  );
}
