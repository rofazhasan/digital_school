import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { cleanupMath } from '@/lib/utils';
import { Sparkles, HelpCircle, Info, Calculator } from 'lucide-react';
import { formatExpressionToLatex } from '@/lib/math-parser';

// ==========================================
// 0. Live Expression Input with LaTeX Preview
// ==========================================
export function LiveExpressionInput({
  value,
  onChange,
  placeholder = "Enter answer or math expression...",
  disabled = false,
  className = ""
}: {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const strVal = String(value ?? '');

  const insertSymbol = (sym: string) => {
    if (disabled) return;
    onChange(strVal + sym);
  };

  return (
    <div className="space-y-1.5">
      <Input
        type="text"
        placeholder={placeholder}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`bg-white dark:bg-slate-950 text-sm font-mono ${className}`}
      />

      {/* Quick Math Toolbar & Live LaTeX Preview */}
      {!disabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <Calculator className="w-3 h-3" /> Quick Math:
            </span>
            {[
              { label: 'x²', insert: '^2' },
              { label: 'a/b', insert: '/' },
              { label: '√x', insert: 'sqrt()' },
              { label: '10ⁿ', insert: '10^' },
              { label: 'π', insert: '\\pi' },
              { label: '±', insert: '\\pm' },
              { label: 'sin', insert: 'sin()' },
              { label: 'cos', insert: 'cos()' },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => insertSymbol(btn.insert)}
                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border text-[11px] font-mono text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {strVal && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">LaTeX Output:</span>
              <span className="font-semibold text-xs"><UniversalMathJax inline dynamic>{cleanupMath(formatExpressionToLatex(strVal))}</UniversalMathJax></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

                <LiveExpressionInput
                  placeholder={part.type === 'expression' ? 'e.g. (2x+1)/(x^2+3)' : 'Enter value...'}
                  value={partVal}
                  onChange={(val) => handlePartChange(partId, val)}
                  disabled={disabled}
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

                <LiveExpressionInput
                  placeholder="Enter stage answer or math expression..."
                  value={stageVal}
                  onChange={(val) => handleStageChange(stageId, val)}
                  disabled={disabled}
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



