"use client";

import React, { useEffect, useState, useRef } from "react";
import { useExamContext } from "./ExamContext";
import { Clock, WifiOff } from 'lucide-react';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { exam, isOnline } = useExamContext();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial time based on server start time or duration
    const calculateTimeLeft = () => {
      const durationSeconds = exam.duration * 60;

      if (exam.startedAt) {
        const startTime = new Date(exam.startedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);

        // Strict check: if elapsed > duration, time is up
        return Math.max(0, durationSeconds - elapsedSeconds);
      }

      return durationSeconds;
    };

    setSecondsLeft(calculateTimeLeft());
  }, [exam.duration, exam.startedAt]);

  // Reliable Timer Logic
  useEffect(() => {
    const checkTime = () => {
      if (exam.startedAt) {
        const startTime = new Date(exam.startedAt).getTime();
        const now = Date.now();
        const durationSeconds = exam.duration * 60;
        const newTime = Math.max(0, durationSeconds - Math.floor((now - startTime) / 1000));

        if (newTime !== secondsLeft) {
          setSecondsLeft(newTime);
        }

        if (newTime <= 0) {
          if (onTimeUp) onTimeUp();
        }
      } else {
        // Local fallback if startedAt missing (shouldn't happen in live exam)
        setSecondsLeft(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0 && onTimeUp) onTimeUp();
          return next;
        });
      }
    };

    // Run immediately
    checkTime();

    // Then interval
    intervalRef.current = setInterval(checkTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onTimeUp, exam.startedAt, exam.duration]);

  const isLowTime = secondsLeft <= 300; // 5 minutes

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full text-sm md:text-base font-bold transition-all shadow-sm border
      ${isLowTime ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-900 border-gray-200'}
    `}>
      <Clock className="w-4 h-4" />
      <span className="tabular-nums tracking-wide">{formatTime(secondsLeft)}</span>
      {!isOnline && (
        <span className="flex items-center text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 ml-1">
          <WifiOff className="w-3 h-3 mr-1" />
        </span>
      )}
    </div>
  );
} 