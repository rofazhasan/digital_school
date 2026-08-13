'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { cleanupMath } from '@/lib/utils';

// ==========================================
// 1. CMA (Constructed Multi-Answer) Renderer
// ==========================================
export interface CMARendererProps {
  question: {
    id: string;
    text?: string;
    marks?: number;
    parts?: Array<{
      id: string;
      label: string;
      type?: string;
      marks?: number;
      expectedAnswer?: string | number;
      tolerance?: number;
      unit?: string;
    }>;
  };
  value?: Record<string, string | number>;
  onChange?: (val: Record<string, string | number>) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  evalResult?: any;
}

export function CMARenderer({
  question,
  value = {},
  onChange,
  disabled = false,
  showFeedback = false,
  evalResult
}: CMARendererProps) {
  const parts = question.parts || [];

  const handlePartChange = (partId: string, val: string) => {
    if (disabled || !onChange) return;
    onChange({
      ...value,
      [partId]: val
    });
  };

  return (
    <div className="space-y-4">
      {parts.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No answer fields configured for this question.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parts.map((part) => {
            const partVal = value[part.id] ?? '';
            const res = evalResult?.partResults?.[part.id];
            
            return (
              <div
                key={part.id}
                className={`p-3 rounded-xl border transition-all ${
                  showFeedback && res
                    ? res.isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    <UniversalMathJax inline dynamic>{cleanupMath(part.label || (part as any).prompt || (part as any).text || '')}</UniversalMathJax>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    {part.unit && (
                      <span className="text-xs text-slate-400 font-mono">({part.unit})</span>
                    )}
                    {part.marks && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {part.marks}m
                      </Badge>
                    )}
                  </div>
                </div>

                <Input
                  type={part.type === 'integer' || part.type === 'decimal' ? 'number' : 'text'}
                  step={part.type === 'decimal' ? 'any' : '1'}
                  placeholder={part.type === 'expression' ? 'e.g. (2x+1)/(x^2+3)' : 'Enter value...'}
                  value={partVal}
                  onChange={(e) => handlePartChange(part.id, e.target.value)}
                  disabled={disabled}
                  className="bg-white dark:bg-slate-950 text-sm rounded-lg"
                />

                {showFeedback && res && (
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span className={res.isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                      {res.isCorrect ? '✓ Correct' : `✗ Incorrect (Expected: ${part.expectedAnswer})`}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {res.earned} / {res.max}m
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. MPC (Multi-Step Problem Chain) Renderer
// ==========================================
export interface MPCRendererProps {
  question: {
    id: string;
    text?: string;
    scenario?: string;
    stages?: Array<{
      id: string;
      stageTitle: string;
      marks?: number;
      expectedAnswer?: string | number;
      tolerance?: number;
    }>;
  };
  value?: Record<string, string | number>;
  onChange?: (val: Record<string, string | number>) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  evalResult?: any;
}

export function MPCRenderer({
  question,
  value = {},
  onChange,
  disabled = false,
  showFeedback = false,
  evalResult
}: MPCRendererProps) {
  const stages = question.stages || [];

  const handleStageChange = (stageId: string, val: string) => {
    if (disabled || !onChange) return;
    onChange({
      ...value,
      [stageId]: val
    });
  };

  return (
    <div className="space-y-4">
      {question.scenario && (
        <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-sm text-indigo-950 dark:text-indigo-200">
          <p className="font-semibold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Problem Scenario
          </p>
          <div><UniversalMathJax inline dynamic>{cleanupMath(question.scenario)}</UniversalMathJax></div>
        </Card>
      )}

      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const stageVal = value[stage.id] ?? '';
          const res = evalResult?.stageResults?.[stage.id];

          return (
            <div
              key={stage.id}
              className={`p-4 rounded-xl border relative transition-all ${
                showFeedback && res
                  ? res.isCorrectDirectly
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : res.isCorrectWithPropagatedError
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-rose-500/50 bg-rose-500/5'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <UniversalMathJax inline dynamic>{cleanupMath(stage.stageTitle || (stage as any).prompt || (stage as any).text || (stage as any).question || '')}</UniversalMathJax>
                  </span>
                </div>
                {stage.marks && (
                  <Badge variant="outline" className="text-xs">
                    {stage.marks} Marks
                  </Badge>
                )}
              </div>

              <Input
                type="text"
                placeholder="Enter stage answer..."
                value={stageVal}
                onChange={(e) => handleStageChange(stage.id, e.target.value)}
                disabled={disabled}
                className="bg-slate-50 dark:bg-slate-950 text-sm rounded-lg"
              />

              {showFeedback && res && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {res.isCorrectDirectly ? (
                    <span className="text-emerald-600 font-semibold">✓ Exact Correct</span>
                  ) : res.isCorrectWithPropagatedError ? (
                    <span className="text-amber-600 font-semibold">
                      ⚠ Correct methodology (error propagated from previous stage)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      ✗ Incorrect (Expected: {stage.expectedAnswer})
                    </span>
                  )}
                  <span className="text-slate-400 font-mono">
                    {res.earned} / {res.max}m
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. DR (Diagnostic Reasoning) Renderer
// ==========================================
export interface DRRendererProps {
  question: {
    id: string;
    text?: string;
    expectedAnswer?: string | number;
    answerType?: string;
    reasonOptions?: Array<{
      id: string;
      text: string;
      isCorrect?: boolean;
    }>;
  };
  value?: {
    answer?: string | number;
    reasonId?: string;
    confidence?: 'Certain' | 'Probably' | 'Unsure';
  };
  onChange?: (val: { answer?: string | number; reasonId?: string; confidence?: 'Certain' | 'Probably' | 'Unsure' }) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  evalResult?: any;
}

export function DRRenderer({
  question,
  value = {},
  onChange,
  disabled = false,
  showFeedback = false,
  evalResult
}: DRRendererProps) {
  const reasonOpts = question.reasonOptions || [];

  const handleAnswerChange = (ans: string) => {
    if (disabled || !onChange) return;
    onChange({ ...value, answer: ans });
  };

  const handleReasonSelect = (reasonId: string) => {
    if (disabled || !onChange) return;
    onChange({ ...value, reasonId });
  };

  const handleConfidenceSelect = (conf: 'Certain' | 'Probably' | 'Unsure') => {
    if (disabled || !onChange) return;
    onChange({ ...value, confidence: conf });
  };

  return (
    <div className="space-y-5">
      {/* Part A: Main Answer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Part A — Answer Construction
        </Label>
        <Input
          type={question.answerType === 'decimal' || question.answerType === 'integer' ? 'number' : 'text'}
          placeholder="Enter your final answer..."
          value={value.answer ?? ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
          disabled={disabled}
          className="bg-white dark:bg-slate-950 text-sm"
        />
      </div>

      {/* Part B: Conceptual Reasoning */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Part B — Principle & Justification
        </Label>
        <p className="text-xs text-slate-500">Select the principle/reasoning that supports your answer above:</p>

        <div className="space-y-2">
          {reasonOpts.map((opt) => {
            const isSelected = value.reasonId === opt.id || value.reasonId === opt.text;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleReasonSelect(opt.id)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-medium text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span><UniversalMathJax inline dynamic>{cleanupMath(opt.text || '')}</UniversalMathJax></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Part C: Confidence Level Tracking */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Confidence Level:
        </span>
        <div className="flex items-center gap-2">
          {(['Certain', 'Probably', 'Unsure'] as const).map((conf) => (
            <button
              key={conf}
              type="button"
              onClick={() => handleConfidenceSelect(conf)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                value.confidence === conf
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {conf}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Overlay */}
      {showFeedback && evalResult && (
        <Card className="p-3.5 border text-xs space-y-1 bg-slate-900 text-white dark:bg-slate-950">
          <div className="flex items-center justify-between font-bold">
            <span>Diagnostic Tag: {evalResult.diagnosticTag}</span>
            <span>Score: {evalResult.score} / {evalResult.maxScore}m</span>
          </div>
          <p className="text-slate-300">{evalResult.feedback}</p>
        </Card>
      )}
    </div>
  );
}
