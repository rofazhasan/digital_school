"use client";

import React from 'react';
import {
  CheckCircle2,
  Trophy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ScanExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanNext: () => void;
  data: {
    studentRoll: string;
    studentReg: string;
    examName?: string;
    examSet?: string;
    detectedAnswersCount: number;
    confidentAnswersCount: number;
    scoreSummary?: string;
    qualityScore: number;
    resultId?: string;
    examId?: string;
  };
}

export const ScanExplanationModal: React.FC<ScanExplanationModalProps> = ({
  isOpen,
  onClose,
  onScanNext,
  data
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-bold text-lg">Paper Verified & Digitized</h3>
              <p className="text-xs text-zinc-400">
                {data.examName || 'Examination'} • Set {data.examSet || 'A'}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-xs">
            100% Confident
          </Badge>
        </div>

        {/* Identity & Quality Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 text-center font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-sans">Roll</span>
            <span className="text-base font-bold text-white mt-0.5">{data.studentRoll}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-sans">Reg</span>
            <span className="text-base font-bold text-white mt-0.5">{data.studentReg}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-sans">Answers</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5">
              {data.confidentAnswersCount}/{data.detectedAnswersCount}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-sans">Quality</span>
            <span className="text-base font-bold text-cyan-400 mt-0.5">{data.qualityScore}%</span>
          </div>
        </div>

        {/* Physical -> Digital Trace Details */}
        <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80 flex flex-col gap-2 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Deterministic Physical-to-Digital Trace:</span>
          </div>
          <p className="leading-relaxed">
            All marked physical bubbles were mapped directly to the authoritative online exam set questions and evaluated with zero guessing.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={onScanNext}
            className="w-full sm:flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Scan Next Paper</span>
          </Button>

          {data.resultId ? (
            <Link
              href={`/exams/results/${data.resultId}`}
              className="w-full sm:w-auto px-5 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold border border-zinc-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>View Full Result</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </Link>
          ) : (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto h-12 rounded-2xl bg-zinc-800/60 border-zinc-700 text-zinc-300"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
