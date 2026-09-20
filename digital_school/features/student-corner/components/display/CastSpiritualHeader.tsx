'use client';

import React from 'react';
import { format } from 'date-fns';

interface CastSpiritualHeaderProps {
  hijriDate?: string | null;
  quote?: string;
  className?: string;
}

export const CastSpiritualHeader: React.FC<CastSpiritualHeaderProps> = ({
  hijriDate,
  quote = 'Alhamdulillāh for another day to learn, work and improve.',
  className = '',
}) => {
  const today = new Date();
  const gregorianDate = format(today, 'EEEE • dd MMM yyyy');

  return (
    <header
      className={`flex flex-col items-center justify-center text-center select-none ${className}`}
      aria-label="Spiritual & Gratitude Header"
    >
      {/* Basmala Calligraphy */}
      <div className="font-arabic text-2xl sm:text-3xl md:text-4xl text-slate-400/80 tracking-wide mb-1 transition-opacity duration-700">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </div>

      {/* Majestic Allah Typography with Serene Subtle Glow */}
      <div className="relative my-0.5 group">
        <div
          className="font-arabic text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.22)] transition-all duration-1000"
          style={{ letterSpacing: '0.04em' }}
        >
          اللَّه
        </div>
      </div>

      {/* Daily Gratitude & Mindset Reminder */}
      <p className="text-xs sm:text-sm md:text-base font-medium tracking-wide text-slate-300/90 italic max-w-xl mx-auto px-4 mt-1">
        “{quote}”
      </p>

      {/* Date Pill: Gregorian • Hijri */}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
        <span>{gregorianDate}</span>
        {hijriDate && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-300/90">{hijriDate}</span>
          </>
        )}
      </div>
    </header>
  );
};
