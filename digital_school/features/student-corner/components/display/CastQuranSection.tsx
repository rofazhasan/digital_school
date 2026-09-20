'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, BookOpen } from 'lucide-react';
import { QuranReflection } from '@/features/student-corner/types';

interface CastQuranSectionProps {
  quranList: QuranReflection[];
  initialDay?: number;
  className?: string;
  isSplitMode?: boolean;
}

export const CastQuranSection: React.FC<CastQuranSectionProps> = ({
  quranList,
  initialDay = 1,
  className = '',
  isSplitMode = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = quranList.findIndex((q) => q.dayNumber === initialDay);
    return idx !== -1 ? idx : 0;
  });
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Peaceful rotation every 60 seconds
  useEffect(() => {
    if (!isAutoRotating || quranList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quranList.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoRotating, quranList.length]);

  const currentAyah = quranList[currentIndex] || quranList[0];
  if (!currentAyah) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quranList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quranList.length) % quranList.length);
  };

  return (
    <section
      className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-2xl shadow-2xl select-none ${className}`}
      aria-label="Quranic Ayah Reflection"
    >
      {/* Top Bar: Surah Name in Arabic + Bangla, Ayah Number, Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-arabic text-lg sm:text-xl font-bold text-indigo-300">
                سُورَةُ {currentAyah.surahNameArabic}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                • {currentAyah.surahNameBangla}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              আয়াত: {currentAyah.ayahNumber} {currentAyah.theme ? `• ${currentAyah.theme}` : ''}
            </span>
          </div>
        </div>

        {/* Minimal Controls (hover/visible) */}
        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handlePrev}
            title="Previous Ayah"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotating((prev) => !prev)}
            title={isAutoRotating ? 'Pause rotation' : 'Resume auto-rotation'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleNext}
            title="Next Ayah"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Quran Content */}
      <div className="flex flex-col items-center justify-center text-center my-4 space-y-4">
        {/* Arabic Calligraphy */}
        <p
          className={`font-arabic text-white font-bold leading-loose tracking-wide drop-shadow-md max-w-4xl px-2 ${
            isSplitMode
              ? 'text-2xl sm:text-3xl md:text-4xl'
              : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
          }`}
          style={{ lineHeight: '2.1' }}
        >
          {currentAyah.arabicText}
        </p>

        {/* Bangla Pronunciation (উচ্চারণ) */}
        {currentAyah.banglaPronunciation && (
          <p className="text-xs sm:text-sm md:text-base font-medium text-indigo-200/80 italic max-w-2xl px-4">
            উচ্চারণ: {currentAyah.banglaPronunciation}
          </p>
        )}

        {/* Bangla Meaning (অর্থ) */}
        <p
          className={`text-slate-200 font-semibold tracking-wide max-w-3xl px-4 ${
            isSplitMode
              ? 'text-sm sm:text-base md:text-lg'
              : 'text-sm sm:text-base md:text-xl'
          }`}
        >
          “{currentAyah.banglaMeaning}”
        </p>
      </div>

      {/* Bottom Subtle Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-500 pt-2 border-t border-white/5">
        <span>365-DAY AUTHENTIC QURAN CYCLE</span>
        <span>
          AYAH {currentIndex + 1} OF {quranList.length}
        </span>
      </div>
    </section>
  );
};
