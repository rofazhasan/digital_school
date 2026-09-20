'use client';

import React from 'react';

interface CircularProgressRingProps {
  percentage: number; // 0 to 100
  timeString: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgressRing({
  percentage,
  timeString,
  subLabel,
  size = 320,
  strokeWidth = 12,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/80 dark:text-slate-800/80 fill-none"
        />

        {/* Progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#focusGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-none transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <span className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-slate-900 dark:text-white drop-shadow-sm">
          {timeString}
        </span>
        {subLabel && (
          <span className="mt-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
