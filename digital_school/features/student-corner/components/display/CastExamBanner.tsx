'use client';

import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CastExamBannerProps {
  upcomingExam: any | null;
  className?: string;
}

export const CastExamBanner: React.FC<CastExamBannerProps> = ({ upcomingExam, className = '' }) => {
  if (!upcomingExam) return null;

  const examDate = new Date(upcomingExam.date || upcomingExam.examDate);
  const formattedDate = format(examDate, 'EEEE • hh:mm a');
  const daysLeft = upcomingExam.daysRemaining ?? Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-rose-500/20 backdrop-blur-xl shadow-lg select-none text-left ${className}`}
    >
      <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300">
        <Calendar className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-400">
            NEXT ACADEMIC MILESTONE
          </span>
          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {daysLeft <= 0 ? 'Today' : `${daysLeft} DAYS LEFT`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white mt-0.5">
          <span>{upcomingExam.title || upcomingExam.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-normal">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
