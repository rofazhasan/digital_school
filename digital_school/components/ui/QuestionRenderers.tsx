import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { cleanupMath } from '@/lib/utils';
import { Sparkles, HelpCircle, Info } from 'lucide-react';

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
  let rawParts = question?.parts || (question as any)?.cmaParts || (question as any)?.subQuestions || (question as any)?.sub_questions || [];
  if (typeof rawParts === 'string') {
    try { rawParts = JSON.parse(rawParts); } catch { rawParts = []; }
  }
  const parts: any[] = Array.isArray(rawParts) ? rawParts : [];

  const handlePartChange = (partId: string, val: string) => {
    if (disabled || !onChange) return;
    onChange({
      ...(value || {}),
      [partId]: val
    });
  };

  return (
    <div className="space-y-4">
      {/* Student Expression Syntax Helper */}
      {!disabled && !showFeedback && (
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> How to enter your answers:
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Fill in each answer field below. For mathematical expressions, powers, or fractions:
            use <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold text-indigo-700 dark:text-indigo-300">^</code> for powers (e.g. <code className="font-mono">x^2</code> or <code className="font-mono">10^5</code>), <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold text-indigo-700 dark:text-indigo-300">/</code> for fractions (e.g. <code className="font-mono">(2x+1)/(x-3)</code>), and <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold text-indigo-700 dark:text-indigo-300">*</code> for multiplication.
          </p>
        </div>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
          No input parts configured for this CMA question.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parts.map((part, idx) => {
            const partId = part.id || part.key || part.name || `part_${idx}`;
            const partVal = value?.[partId] ?? value?.[part.label] ?? '';
            const res = evalResult?.partResults?.[partId] || evalResult?.partResults?.[part.label];
            const partLabel = part.label || part.prompt || part.text || part.question || `Part ${idx + 1}`;
            
            return (
              <div
                key={partId}
                className={`p-3.5 rounded-xl border transition-all ${
                  showFeedback && res
                    ? res.isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    <UniversalMathJax inline dynamic>{cleanupMath(partLabel)}</UniversalMathJax>
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
                  type={part.type === 'integer' || part.type === 'decimal' || part.type === 'number' ? 'number' : 'text'}
                  step={part.type === 'decimal' ? 'any' : '1'}
                  placeholder={part.type === 'expression' ? 'e.g. (2x+1)/(x^2+3)' : 'Enter value...'}
                  value={partVal}
                  onChange={(e) => handlePartChange(partId, e.target.value)}
                  disabled={disabled}
                  className="bg-white dark:bg-slate-950 text-sm rounded-lg"
                />

                {showFeedback && res && (
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span className={res.isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                      {res.isCorrect ? '✓ Correct' : `✗ Incorrect (Expected: ${part.expectedAnswer || part.modelAnswer})`}
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
  let rawStages = question?.stages || (question as any)?.mpcStages || (question as any)?.subQuestions || (question as any)?.sub_questions || [];
  if (typeof rawStages === 'string') {
    try { rawStages = JSON.parse(rawStages); } catch { rawStages = []; }
  }
  const stages: any[] = Array.isArray(rawStages) ? rawStages : [];
  const scenario = question.scenario || (question as any).text || (question as any).questionText || '';

  const handleStageChange = (stageId: string, val: string) => {
    if (disabled || !onChange) return;
    onChange({
      ...(value || {}),
      [stageId]: val
    });
  };

  return (
    <div className="space-y-4">
      {scenario && question.scenario && (
        <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-sm text-indigo-950 dark:text-indigo-200">
          <p className="font-semibold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Problem Scenario
          </p>
          <div><UniversalMathJax inline dynamic>{cleanupMath(scenario)}</UniversalMathJax></div>
        </Card>
      )}

      {/* Student Expression Syntax Helper */}
      {!disabled && !showFeedback && (
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Step Problem Guide:
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Answer each step in order. If you make a calculation error in Stage 1, continue calculating Stage 2 based on your Stage 1 result — you will still receive method credit! Use <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold">^</code> for powers (e.g. <code className="font-mono">10^3</code>).
          </p>
        </div>
      )}

      {stages.length === 0 ? (
        <p className="text-sm text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
          No stages configured for this MPC problem.
        </p>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const stageId = stage.id || stage.key || stage.name || `stage_${idx}`;
            const stageVal = value?.[stageId] ?? value?.[stage.stageTitle] ?? '';
            const res = evalResult?.stageResults?.[stageId] || evalResult?.stageResults?.[stage.stageTitle];
            const stageTitle = stage.stageTitle || stage.prompt || stage.text || stage.question || `Stage ${idx + 1}`;

            return (
              <div
                key={stageId}
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
                      <UniversalMathJax inline dynamic>{cleanupMath(stageTitle)}</UniversalMathJax>
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
                  onChange={(e) => handleStageChange(stageId, e.target.value)}
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
                        ✗ Incorrect (Expected: {stage.expectedAnswer || stage.modelAnswer})
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
      )}
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
  let rawReasons = question?.reasonOptions || (question as any)?.reasons || (question as any)?.options || (question as any)?.reason_options || (question as any)?.subQuestions || (question as any)?.sub_questions || [];
  if (typeof rawReasons === 'string') {
    try { rawReasons = JSON.parse(rawReasons); } catch { rawReasons = []; }
  }
  if (rawReasons && typeof rawReasons === 'object' && !Array.isArray(rawReasons)) {
    rawReasons = (rawReasons as any).options || (rawReasons as any).reasons || (rawReasons as any).reasonOptions || [];
  }
  const reasonOpts: any[] = Array.isArray(rawReasons) ? rawReasons : [];

  const handleAnswerChange = (ans: string) => {
    if (disabled || !onChange) return;
    onChange({ ...(value || {}), answer: ans });
  };

  const handleReasonSelect = (reasonId: string) => {
    if (disabled || !onChange) return;
    onChange({ ...(value || {}), reasonId });
  };

  const handleConfidenceSelect = (conf: 'Certain' | 'Probably' | 'Unsure') => {
    if (disabled || !onChange) return;
    onChange({ ...(value || {}), confidence: conf });
  };

  const partAOptions: any[] = (question as any).partAOptions || (question as any).mainOptions || [];

  return (
    <div className="space-y-5">
      {/* Student Answering Instruction Banner */}
      {!disabled && !showFeedback && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
          <div className="font-bold text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" /> How to Answer Diagnostic Reasoning (DR) Questions:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            <li><strong>Part A (Answer Construction):</strong> Enter your calculated numerical value, mathematical expression, or option choice. Use <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold">^</code> for powers (e.g., <code className="font-mono">x^2</code>) and <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded font-mono font-bold">/</code> for fractions.</li>
            <li><strong>Part B (Principle & Justification):</strong> Select the scientific or mathematical principle that justifies your Part A answer.</li>
            <li><strong>Part C (Confidence Level):</strong> Select your confidence level (Certain, Probably, or Unsure).</li>
          </ol>
        </div>
      )}

      {/* Part A: Main Answer */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Part A — Answer Construction
        </Label>

        {partAOptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {partAOptions.map((opt, idx) => {
              const optVal = typeof opt === 'object' ? (opt.text || opt.label || opt.value) : String(opt);
              const optId = typeof opt === 'object' ? (opt.id || optVal) : optVal;
              const isSelected = String(value?.answer || '').trim() === String(optId).trim() || String(value?.answer || '').trim() === String(optVal).trim();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerChange(optId)}
                  disabled={disabled}
                  className={`p-2.5 rounded-lg border text-sm text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-semibold text-indigo-950 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UniversalMathJax inline dynamic>{cleanupMath(optVal)}</UniversalMathJax>
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            type={question.answerType === 'decimal' || question.answerType === 'integer' || (question as any).type === 'number' ? 'number' : 'text'}
            placeholder="Enter your final answer (e.g. 15, x^2+3, 4.5)..."
            value={value?.answer ?? ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={disabled}
            className="bg-white dark:bg-slate-950 text-sm"
          />
        )}
      </div>

      {/* Part B: Conceptual Reasoning */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Part B — Principle & Justification
        </Label>
        <p className="text-xs text-slate-500">Select the principle/reasoning that supports your answer above:</p>

        {reasonOpts.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
            No reasoning options configured for this DR question.
          </p>
        ) : (
          <div className="space-y-2">
            {reasonOpts.map((opt, idx) => {
              const optId = opt.id || opt.key || opt.text || `reason_${idx}`;
              const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || opt.question || opt.prompt || `Reason ${idx + 1}`);
              const isSelected = value?.reasonId === optId || value?.reasonId === optText || String(value?.reasonId || '').trim() === String(optId).trim();
              return (
                <button
                  key={optId}
                  type="button"
                  onClick={() => handleReasonSelect(optId)}
                  disabled={disabled}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-medium text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
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
                  <span><UniversalMathJax inline dynamic>{cleanupMath(optText)}</UniversalMathJax></span>
                </button>
              );
            })}
          </div>
        )}
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
                value?.confidence === conf
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
