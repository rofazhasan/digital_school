"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useExamContext } from "./ExamContext";
import { Clock, WifiOff } from 'lucide-react';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { exam, isOnline } = useExamContext();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warned, setWarned] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial time based on server start time
    const calculateTimeLeft = () => {
      const durationSeconds = exam.duration * 60;

      if (exam.startedAt) {
        const startTime = new Date(exam.startedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        return Math.max(0, durationSeconds - elapsedSeconds);
      }

      return durationSeconds;
    };

    setSecondsLeft(calculateTimeLeft());
    setWarned(false);
  }, [exam.duration, exam.startedAt]);

  // Timer tick logic
  useEffect(() => {
    // Prevent immediate trigger on mount if time is already 0 (safety)
    // Only trigger if we were running and hit 0
    if (secondsLeft <= 0 && exam.startedAt) {
      // If time is really up (double check with calculation)
      const durationSeconds = exam.duration * 60;
      const startTime = new Date(exam.startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const realTimeLeft = Math.max(0, durationSeconds - elapsedSeconds);

      if (realTimeLeft <= 0) {
        if (onTimeUp) onTimeUp();
      }
      return;
    }

    // Only run timer when online (visual only - server time is master)

    // Run timer regardless of online status - rely on system time
    // if (isOnline) {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        // Re-calculate from absolute start time to prevent drift
        if (exam.startedAt) {
          const startTime = new Date(exam.startedAt).getTime();
          const now = Date.now();
          const durationSeconds = exam.duration * 60;
          const newTime = Math.max(0, durationSeconds - Math.floor((now - startTime) / 1000));

          if (newTime <= 0) {
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return newTime;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);
    // }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [secondsLeft, onTimeUp, isOnline, exam.startedAt, exam.duration]);

  // Warning effect
  useEffect(() => {
    if (!warned && secondsLeft === 300) {
      // Simple toast or alert can go here, restricting to console for now to avoid intrusive alerts during dev
      console.log("5 minutes left");
      setWarned(true);
    }
  }, [secondsLeft, warned]);

  const isLowTime = secondsLeft <= 300; // 5 minutes

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-2xl font-bold transition-all shadow-sm
      ${isLowTime ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-900 border border-gray-200'}
    `}>
      <Clock className={`w-5 h-5 ${isLowTime ? 'animate-pulse' : ''}`} />
      <span>{formatTime(secondsLeft)}</span>
      {!isOnline && (
        <span className="ml-2 flex items-center text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          <WifiOff className="w-3 h-3 mr-1" /> Offline
        </span>
      )}
    </div>
  );
} 