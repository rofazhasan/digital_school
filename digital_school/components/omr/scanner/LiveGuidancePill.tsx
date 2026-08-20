"use client";

import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Sun,
  Camera,
  Layers,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LiveGuidancePillProps {
  status: string;
  message: string;
  qualityScore?: number; // 0..100
}

export const LiveGuidancePill: React.FC<LiveGuidancePillProps> = ({
  status,
  message,
  qualityScore
}) => {
  const getIcon = () => {
    switch (status) {
      case 'READY_TO_CAPTURE':
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />;
      case 'CHECKING_ALIGNMENT':
      case 'ALIGNING':
        return <Scan className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'TOO_DARK':
      case 'TOO_BRIGHT':
      case 'GLARE_DETECTED':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'PAPER_TOO_SKEWED':
      case 'MOVE_CLOSER':
        return <ArrowDown className="w-4 h-4 text-amber-400" />;
      case 'ERROR':
      case 'REVIEW_REQUIRED':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBadgeStyle = () => {
    switch (status) {
      case 'READY_TO_CAPTURE':
      case 'SUCCESS':
        return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50';
      case 'CHECKING_ALIGNMENT':
      case 'ALIGNING':
        return 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200 shadow-cyan-950/50';
      case 'ERROR':
      case 'REVIEW_REQUIRED':
        return 'bg-rose-950/80 border-rose-500/40 text-rose-200 shadow-rose-950/50';
      case 'TOO_DARK':
      case 'GLARE_DETECTED':
      case 'MOVE_CLOSER':
        return 'bg-amber-950/80 border-amber-500/40 text-amber-200 shadow-amber-950/50';
      default:
        return 'bg-black/70 border-white/20 text-white/90 shadow-black/60';
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-xl shadow-lg transition-all duration-300 font-medium text-xs sm:text-sm select-none",
        getBadgeStyle()
      )}
    >
      {getIcon()}
      <span>{message}</span>
      {qualityScore !== undefined && qualityScore > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono tracking-wider">
          {qualityScore}%
        </span>
      )}
    </div>
  );
};
