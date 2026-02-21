"use client";

import React, { useEffect, useState, useRef } from "react";
import { useExamContext } from "./ExamContext";
import { Clock, WifiOff } from 'lucide-react';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { exam, isOnline, activeSection } = useExamContext();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isObjective = activeSection === 'objective';
    const sectionTime = (isObjective ? exam.objectiveTime : exam.cqSqTime) || exam.duration;
    const durationSeconds = sectionTime * 60;
    setTotalDuration(durationSeconds);

    const calculateTimeLeft = () => {
      const sectionStartedAt = isObjective ? exam.objectiveStartedAt : exam.cqSqStartedAt;

      if (sectionStartedAt) {
        const startTime = new Date(sectionStartedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        return Math.max(0, durationSeconds - elapsedSeconds);
      }
      return durationSeconds;
    };

    setSecondsLeft(calculateTimeLeft());
  }, [exam.duration, exam.objectiveTime, exam.cqSqTime, exam.objectiveStartedAt, exam.cqSqStartedAt, activeSection]);

  useEffect(() => {
    const checkTime = () => {
      const isObjective = activeSection === 'objective';
      const sectionStartedAt = isObjective ? exam.objectiveStartedAt : exam.cqSqStartedAt;
      const sectionTime = (isObjective ? exam.objectiveTime : exam.cqSqTime) || exam.duration;

      if (sectionStartedAt) {
        const startTime = new Date(sectionStartedAt).getTime();
        const now = Date.now();
        const durationSeconds = sectionTime * 60;
        const newTime = Math.max(0, durationSeconds - Math.floor((now - startTime) / 1000));

        if (newTime !== secondsLeft) {
          setSecondsLeft(newTime);
        }

        if (newTime <= 0) {
          if (onTimeUp) onTimeUp();
        }
      } else {
        setSecondsLeft(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0 && onTimeUp) onTimeUp();
          return next;
        });
      }
    };

    checkTime();
    intervalRef.current = setInterval(checkTime, 1000);

    // Visibility Listener: Recalculate immediately when returning to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onTimeUp, exam.startedAt, exam.duration, activeSection, exam.objectiveStartedAt, exam.cqSqStartedAt, exam.objectiveTime, exam.cqSqTime]);

  const percentage = totalDuration > 0 ? (secondsLeft / totalDuration) * 100 : 0;
  const isUrgent = secondsLeft <= 60; // 1 minute
  const isWarning = secondsLeft <= 300; // 5 minutes

  // SVG Progress Ring calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let timerColor = "text-emerald-500";
  let ringColor = "stroke-emerald-500";
  let bgColor = "bg-emerald-50/50 dark:bg-emerald-500/10";
  let borderColor = "border-emerald-200/50 dark:border-emerald-500/20";

  if (isUrgent) {
    timerColor = "text-rose-500";
    ringColor = "stroke-rose-500";
    bgColor = "bg-rose-50/80 dark:bg-rose-500/20";
    borderColor = "border-rose-300 dark:border-rose-500/40 animate-pulse ring-4 ring-rose-500/20";
  } else if (isWarning) {
    timerColor = "text-amber-500";
    ringColor = "stroke-amber-500";
    bgColor = "bg-amber-50/50 dark:bg-amber-500/10";
    borderColor = "border-amber-200 dark:border-amber-500/20";
  }

  return (
    <div className={`
      relative group flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-500 border backdrop-blur-md
      ${bgColor} ${borderColor} ${isUrgent ? 'animate-bounce-subtle shadow-lg shadow-rose-500/20' : 'shadow-sm'}
    `}>
      {/* Circular Progress SVG */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
        <svg className="w-full h-full -rotate-90 transform">
          {/* Background Ring */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700/50"
          />
          {/* Progress Ring */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease'
            }}
            strokeLinecap="round"
            fill="transparent"
            className={ringColor}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${timerColor}`}>
          <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin-slow' : ''}`} />
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 ${timerColor}`}>
          Time Remaining
        </span>
        <span className={`text-base sm:text-xl font-black tabular-nums tracking-tight leading-none ${timerColor}`}>
          {formatTime(secondsLeft)}
        </span>
      </div>

      {!isOnline && (
        <div className="flex items-center text-[10px] text-rose-600 bg-rose-100 dark:bg-rose-900/40 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 ml-1 animate-pulse">
          <WifiOff className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline font-bold">Offline</span>
        </div>
      )}
    </div>
  );
}
