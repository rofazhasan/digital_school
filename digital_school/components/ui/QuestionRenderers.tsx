import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { cleanupMath } from '@/lib/utils';
import { Sparkles, CheckCircle, XCircle, AlertCircle, Calculator, BookOpen, Lightbulb } from 'lucide-react';
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
    <div className="space-y-2">
      {!disabled ? (
        <>
          <Input
            type="text"
            placeholder={placeholder}
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`bg-white dark:bg-slate-950 text-sm font-mono ${className}`}
          />

          {/* Quick Math Toolbar & Live LaTeX Preview */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                <Calculator className="w-3 h-3" /> Quick Math:
              </span>
              {[
                { label: 'x²', insert: '^2' },
                { label: 'a/b', insert: '/' },
                { label: 'ⁿCᵣ', insert: '\\binom{n}{r}' },
                { label: 'ⁿPᵣ', insert: 'P(n, r)' },
                { label: 'n!', insert: '!' },
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
        </>
      ) : (
        <div className="p-2.5 rounded-lg border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-0.5 font-medium">Entered Answer:</div>
          <div className="font-semibold text-sm text-foreground">
            {strVal ? (
              <UniversalMathJax inline dynamic>{cleanupMath(formatExpressionToLatex(strVal))}</UniversalMathJax>
            ) : (
              <span className="text-muted-foreground italic">No answer provided</span>
            )}
          </div>
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
    questionText?: string;
    marks?: number;
    parts?: Array<any>;
    cmaParts?: Array<any>;
    subQuestions?: Array<any>;
  };
  value?: Record<string, any>;
  onChange?: (val: Record<string, any>) => void;
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
          No sub-question parts configured for this CMA question.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parts.map((part, idx) => {
            const partId = part.id || part.key || part.name || `part_${idx}`;
            const partVal = value?.[partId] ?? value?.[part.label] ?? value?.[`part_${idx}`] ?? value?.[idx] ?? '';
            const res = evalResult?.partResults?.[partId] || evalResult?.partResults?.[part.label] || evalResult?.partResults?.[`part_${idx}`];
            const partLabel = part.label || part.prompt || part.text || part.question || part.questionText || `Part ${idx + 1}`;
            const expectedAns = part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? part.correct ?? part.answer ?? '';
            const partMarks = part.marks || (part as any)?.mark || 1;
            const explanation = part.explanation || part.solution || (part as any)?.hint || '';

            const isCorrect = res ? res.isCorrect : false;
            const isPartial = res ? res.status === 'PARTIAL' : false;
            const isAttempted = res ? res.isAttempted : Boolean(partVal);

            return (
              <div
                key={partId}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  showFeedback && res
                    ? isCorrect
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isPartial
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : isAttempted
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : 'border-border bg-muted/20'
                    : 'border-border bg-card'
                }`}
              >
                {/* Part Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <Label className="text-sm font-semibold text-foreground leading-snug">
                      <UniversalMathJax inline dynamic>{cleanupMath(partLabel)}</UniversalMathJax>
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {part.unit && (
                      <span className="text-xs text-muted-foreground font-mono">({part.unit})</span>
                    )}
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                      {partMarks}m
                    </Badge>
                  </div>
                </div>

                {/* Input / Display */}
                <LiveExpressionInput
                  placeholder={part.type === 'expression' ? 'e.g. (2x+1)/(x^2+3)' : 'Enter value...'}
                  value={partVal}
                  onChange={(val) => handlePartChange(partId, val)}
                  disabled={disabled}
                />

                {/* Feedback / Model Answer Display */}
                {showFeedback && (
                  <div className="space-y-2 pt-2 border-t border-border/70">
                    {/* Status Result */}
                    <div className="flex items-center justify-between text-xs">
                      {res ? (
                        <div className="flex items-center gap-1.5 font-semibold">
                          {isCorrect ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : isPartial ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Partial Credit
                            </span>
                          ) : isAttempted ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Unanswered</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Evaluation</span>
                      )}

                      {res && (
                        <span className="text-muted-foreground font-mono font-bold text-[11px]">
                          {res.earned ?? (isCorrect ? partMarks : 0)} / {res.max ?? partMarks}m
                        </span>
                      )}
                    </div>

                    {/* Expected Model Answer */}
                    {expectedAns !== '' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <BookOpen className="w-3 h-3" /> Model Answer:
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                          <UniversalMathJax inline dynamic>{cleanupMath(String(expectedAns))}</UniversalMathJax> {part.unit || ''}
                        </span>
                      </div>
                    )}

                    {/* Part Explanation */}
                    {explanation && (
                      <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-0.5">
                          <Lightbulb className="w-3 h-3" /> Explanation:
                        </span>
                        <UniversalMathJax dynamic>{cleanupMath(explanation)}</UniversalMathJax>
                      </div>
                    )}
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
    questionText?: string;
    scenario?: string;
    marks?: number;
    stages?: Array<any>;
    mpcStages?: Array<any>;
    subQuestions?: Array<any>;
  };
  value?: Record<string, any>;
  onChange?: (val: Record<string, any>) => void;
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
      {scenario && (
        <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-sm text-indigo-950 dark:text-indigo-200">
          <p className="font-semibold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Problem Scenario
          </p>
          <div className="leading-relaxed"><UniversalMathJax dynamic>{cleanupMath(scenario)}</UniversalMathJax></div>
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
        <div className="space-y-4">
          {stages.map((stage, idx) => {
            const stageId = stage.id || stage.key || stage.name || `stage_${idx}`;
            const stageVal = value?.[stageId] ?? value?.[stage.stageTitle] ?? value?.[`stage_${idx}`] ?? value?.[idx] ?? '';
            const res = evalResult?.stageResults?.[stageId] || evalResult?.stageResults?.[stage.stageTitle] || evalResult?.stageResults?.[`stage_${idx}`];
            const stageTitle = stage.stageTitle || stage.prompt || stage.text || stage.question || stage.questionText || `Stage ${idx + 1}`;
            const expectedAns = stage.expectedAnswer ?? stage.modelAnswer ?? stage.correctAnswer ?? stage.correct ?? stage.answer ?? '';
            const stageMarks = stage.marks || (stage as any)?.mark || 1;
            const formula = stage.formula || stage.equation || '';
            const explanation = stage.explanation || stage.solution || '';

            const isDirect = res ? res.isCorrectDirectly : false;
            const isPropagated = res ? res.isCorrectWithPropagatedError : false;
            const isAttempted = res ? res.isAttempted : Boolean(stageVal);

            return (
              <div
                key={stageId}
                className={`p-4 rounded-2xl border relative transition-all space-y-3 ${
                  showFeedback && res
                    ? isDirect
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isPropagated
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : isAttempted
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : 'border-border bg-muted/20'
                    : 'border-border bg-card'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      <UniversalMathJax inline dynamic>{cleanupMath(stageTitle)}</UniversalMathJax>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-xs font-bold">
                      {stageMarks} Mark{stageMarks > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Input / Display */}
                <LiveExpressionInput
                  placeholder="Enter stage answer or math expression..."
                  value={stageVal}
                  onChange={(val) => handleStageChange(stageId, val)}
                  disabled={disabled}
                />

                {/* Feedback / Model Answer Display */}
                {showFeedback && (
                  <div className="space-y-2 pt-2 border-t border-border/70">
                    {/* Status Result */}
                    <div className="flex items-center justify-between text-xs">
                      {res ? (
                        <div className="flex items-center gap-1.5 font-semibold">
                          {isDirect ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Exact Correct
                            </span>
                          ) : isPropagated ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Method Credit (Error Propagated)
                            </span>
                          ) : isAttempted ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Unanswered</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Evaluation</span>
                      )}

                      {res && (
                        <span className="text-muted-foreground font-mono font-bold text-[11px]">
                          {res.earned ?? (isDirect ? stageMarks : 0)} / {res.max ?? stageMarks}m
                        </span>
                      )}
                    </div>

                    {/* Expected Model Answer */}
                    {expectedAns !== '' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <BookOpen className="w-3 h-3" /> Model Solution:
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                          <UniversalMathJax inline dynamic>{cleanupMath(String(expectedAns))}</UniversalMathJax>
                        </span>
                      </div>
                    )}

                    {/* Formula if provided */}
                    {formula && (
                      <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50 text-[11px] text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Formula:</span>
                        <UniversalMathJax inline dynamic>{cleanupMath(formula)}</UniversalMathJax>
                      </div>
                    )}

                    {/* Stage Explanation */}
                    {explanation && (
                      <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-0.5">
                          <Lightbulb className="w-3 h-3" /> Explanation:
                        </span>
                        <UniversalMathJax dynamic>{cleanupMath(explanation)}</UniversalMathJax>
                      </div>
                    )}
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



