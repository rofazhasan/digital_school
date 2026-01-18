"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useExamContext } from "./ExamContext";
import { motion, useAnimation } from 'framer-motion';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Optimized useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    const updateMatch = () => setMatches(media.matches);

    // Set initial value
    updateMatch();

    // Use modern event listener
    if (media.addEventListener) {
      media.addEventListener('change', updateMatch);
      return () => media.removeEventListener('change', updateMatch);
    } else {
      // Fallback for older browsers
      media.addListener(updateMatch);
      return () => media.removeListener(updateMatch);
    }
  }, [query]);

  return matches;
}

export default function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { exam, isOnline } = useExamContext();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warned, setWarned] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const controls = useAnimation();
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
    setIsPaused(false);
  }, [exam.duration, exam.startedAt]);

  // Timer tick logic
  useEffect(() => {
    if (secondsLeft <= 0 && exam.startedAt) {
      if (onTimeUp) onTimeUp();
      return;
    }

    // Only run timer when online (visual only - server time is master)
    if (isOnline) {
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
          // Fallback for no startedAt (shouldn't happen with new API)
          return Math.max(0, prev - 1);
        });

        // Trigger animation
        controls.start({
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 0px #a78bfa',
            '0 0 20px #a78bfa',
            '0 0 0px #a78bfa'
          ]
        });
      }, 1000);
    } else {
      setIsPaused(true);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [secondsLeft, onTimeUp, controls, isOnline, exam.startedAt, exam.duration]);

  // Warning effect
  useEffect(() => {
    if (!warned && secondsLeft === 300) {
      // Use a more mobile-friendly alert
      if (isMobile) {
        // For mobile, show a less intrusive notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        notification.textContent = '⚠️ Only 5 minutes left!';
        document.body.appendChild(notification);

        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 5000);
      } else {
        alert("Only 5 minutes left!");
      }
      setWarned(true);
    }
  }, [secondsLeft, warned, isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Memoized styling for better performance
  const timerStyles = useMemo(() => {
    const timerColor = secondsLeft <= 300 ? "text-red-500" : "text-purple-700";
    const glassBg = "bg-gradient-to-br from-white/60 to-purple-100/60 backdrop-blur-md";
    const borderGlow = secondsLeft <= 300
      ? "border-4 border-red-400 shadow-[0_0_32px_4px_rgba(239,68,68,0.3)]"
      : "border-4 border-purple-300 shadow-[0_0_32px_4px_rgba(168,139,250,0.3)]";

    return { timerColor, glassBg, borderGlow };
  }, [secondsLeft]);

  // Network status indicator
  const NetworkIndicator = () => (
    <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'
      } ${isPaused ? 'animate-pulse' : ''}`}
      title={isOnline ? 'Online' : 'Offline - Timer paused'}>
    </div>
  );

  return (
    <motion.div
      animate={controls}
      className={`relative flex items-center justify-center ${timerStyles.glassBg} ${timerStyles.borderGlow} rounded-3xl select-none ${isMobile ? 'w-full sticky top-0 z-30 py-2 my-2' : 'mx-4 my-0 py-4 px-8'
        } transition-all duration-300`}
      style={{ minWidth: isMobile ? 0 : 180 }}
    >
      <NetworkIndicator />

      <span className={`font-extrabold ${timerStyles.timerColor} ${isMobile ? 'text-3xl' : 'text-5xl'
        } tracking-widest drop-shadow-lg`}>
        {formatTime(secondsLeft)}
      </span>

      {isPaused && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium">
          Timer paused (offline)
        </div>
      )}
    </motion.div>
  );
} 