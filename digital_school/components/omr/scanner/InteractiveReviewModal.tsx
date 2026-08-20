"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AmbiguousQuestionItem {
  questionNo: number;
  questionId?: string;
  detectedOption: string | null;
  detectedOptions?: string[];
  status: 'AMBIGUOUS' | 'MULTIPLE' | 'BLANK';
  confidence: number;
  bubbleDetails?: Array<{
    optionLabel: string;
    score: number;
    confidence: number;
  }>;
}

export interface InteractiveReviewModalProps {
  isOpen: boolean;
  ambiguousItems: AmbiguousQuestionItem[];
  onResolve: (resolvedAnswers: Record<number, string | null>) => void;
  onCancel: () => void;
}

export const InteractiveReviewModal: React.FC<InteractiveReviewModalProps> = ({
  isOpen,
  ambiguousItems,
  onResolve,
  onCancel
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [resolvedMap, setResolvedMap] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setResolvedMap({});
    }
  }, [isOpen]);

  if (!isOpen || ambiguousItems.length === 0) return null;

  const current = ambiguousItems[currentIndex];
  const optionChoices = ['A', 'B', 'C', 'D'];

  const handleSelectOption = (option: string | null) => {
    const updated = { ...resolvedMap, [current.questionNo]: option };
    setResolvedMap(updated);

    if (currentIndex + 1 < ambiguousItems.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed all review items
      onResolve(updated);
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase();
    if (key === '1' || key === 'A') handleSelectOption('A');
    else if (key === '2' || key === 'B') handleSelectOption('B');
    else if (key === '3' || key === 'C') handleSelectOption('C');
    else if (key === '4' || key === 'D') handleSelectOption('D');
    else if (key === ' ' || key === '0') handleSelectOption(null); // Blank
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Uncertain Answer Review</h3>
              <p className="text-xs text-zinc-400">
                Item {currentIndex + 1} of {ambiguousItems.length} needs teacher confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question & Crop Card */}
        <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center gap-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 font-mono text-sm font-semibold">
            Question #{current.questionNo}
          </div>

          <p className="text-xs text-zinc-400">
            {current.status === 'AMBIGUOUS' && 'Close scores detected (e.g. erasure smudge). Select the intended bubble:'}
            {current.status === 'MULTIPLE' && 'Multiple marks detected. Confirm single intended option:'}
            {current.status === 'BLANK' && 'Unanswered or extremely light mark. Confirm selection:'}
          </p>

          {/* Bubble Score Heatmap / Diagnostic Representation */}
          {current.bubbleDetails && current.bubbleDetails.length > 0 && (
            <div className="grid grid-cols-4 gap-2 w-full pt-2">
              {current.bubbleDetails.map(b => (
                <div
                  key={b.optionLabel}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl border text-xs font-mono transition-all",
                    b.score >= 0.35
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                  )}
                >
                  <span className="font-bold text-sm">{b.optionLabel}</span>
                  <span>{Math.round(b.score * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Option Selection Actions */}
        <div className="grid grid-cols-4 gap-2">
          {optionChoices.map(opt => (
            <Button
              key={opt}
              onClick={() => handleSelectOption(opt)}
              variant="outline"
              className="h-14 text-xl font-bold rounded-2xl bg-zinc-800/80 border-zinc-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 active:scale-95 transition-all"
            >
              {opt}
            </Button>
          ))}
        </div>

        {/* Blank / Skip Choice */}
        <Button
          onClick={() => handleSelectOption(null)}
          variant="ghost"
          className="w-full py-2.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
        >
          Mark Blank / Unanswered
        </Button>
      </div>
    </div>
  );
};
