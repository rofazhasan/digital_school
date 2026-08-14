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

// ==========================================
// 3. SRA (Structured Reasoning Assembly) Renderer
// ==========================================
export interface SRARendererProps {
  question: {
    id: string;
    text?: string;
    questionText?: string;
    stem?: string;
    marks?: number;
    components?: any[];
    sraComponents?: any[];
    reasoningGraph?: any;
    reasonOptions?: any[]; // legacy fallback
    expectedAnswer?: any; // legacy fallback
  };
  value?: Record<string, any>;
  onChange?: (val: Record<string, any>) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  evalResult?: any;
}

export function SRARenderer({
  question,
  value = {},
  onChange,
  disabled = false,
  showFeedback = false,
  evalResult
}: SRARendererProps) {
  // Extract components or adapt legacy DR question
  let rawComponents = question?.components || (question as any)?.sraComponents || (question as any)?.subQuestions || [];
  if (typeof rawComponents === 'string') {
    try { rawComponents = JSON.parse(rawComponents); } catch { rawComponents = []; }
  }

  // If no components array exists, synthesize from legacy DR structure
  if (!Array.isArray(rawComponents) || rawComponents.length === 0) {
    const rawReasons = question?.reasonOptions || (question as any)?.reasons || (question as any)?.options || [];
    const reasons = Array.isArray(rawReasons) ? rawReasons : [];
    rawComponents = [
      {
        id: 'answer',
        kind: 'CONSTRUCT',
        label: 'Step 1: Construct Solution',
        expectedAnswer: question?.expectedAnswer,
        marks: 2
      },
      {
        id: 'evidence',
        kind: 'EVIDENCE_SELECT',
        label: 'Step 2: Select Conceptual Justification',
        selectMode: 'SINGLE',
        evidenceOptions: reasons.map((r: any, idx: number) => ({
          id: r.id || `r_${idx}`,
          text: typeof r === 'string' ? r : (r.text || r.question || r.label || `Reason ${idx + 1}`),
          isCorrect: Boolean(r.isCorrect || r.correct)
        })),
        marks: 1
      }
    ];
  }

  const components: any[] = Array.isArray(rawComponents) ? rawComponents : [];

  const handleComponentChange = (compId: string, compVal: any) => {
    if (disabled || !onChange) return;
    onChange({ ...(value || {}), [compId]: compVal });
  };

  const moveOrderItem = (compId: string, currentOrder: string[], fromIndex: number, toIndex: number) => {
    if (disabled || !onChange) return;
    if (toIndex < 0 || toIndex >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    handleComponentChange(compId, newOrder);
  };

  return (
    <div className="space-y-6">
      {/* Student Answering Instruction Banner */}
      {!disabled && !showFeedback && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 shadow-xs">
          <div className="font-bold text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" /> Structured Reasoning Assembly (SRA)
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Construct your answer logically by assembling machine-checkable steps (calculation, evidence selection, logical relations, and procedural ordering).
          </p>
        </div>
      )}

      {/* Render SRA Components in sequence */}
      <div className="space-y-5">
        {components.map((comp: any, cIdx: number) => {
          const compId = comp.id || `comp_${cIdx}`;
          const kind = String(comp.kind || comp.type || 'CONSTRUCT').toUpperCase();
          const compVal = value?.[compId] ?? (typeof value === 'object' ? value?.[compId] : undefined);
          const compMarks = comp.marks || 1;
          const compResult = evalResult?.componentResults?.[compId];

          return (
            <div
              key={compId}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs transition-all"
            >
              {/* Component Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {cIdx + 1}
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    <UniversalMathJax inline dynamic>{cleanupMath(comp.label || comp.prompt || `Step ${cIdx + 1}: ${kind}`)}</UniversalMathJax>
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-slate-500">
                  [{compMarks} Marks]
                </Badge>
              </div>

              {/* A. CONSTRUCT, INTERMEDIATE_CONSTRUCT, CONCLUSION */}
              {(kind === 'CONSTRUCT' || kind === 'INTERMEDIATE_CONSTRUCT' || kind === 'CONCLUSION') && (
                <div className="space-y-2">
                  {comp.prompt && comp.prompt !== comp.label && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <UniversalMathJax inline dynamic>{cleanupMath(comp.prompt)}</UniversalMathJax>
                    </p>
                  )}
                  {comp.allowedAnswers && Array.isArray(comp.allowedAnswers) && comp.allowedAnswers.length > 0 && comp.fieldType === 'text_from_allowed_set' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comp.allowedAnswers.map((token: string, tIdx: number) => {
                        const isSelected = String(typeof compVal === 'object' && compVal !== null ? compVal.value : compVal).trim() === token.trim();
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => handleComponentChange(compId, token)}
                            disabled={disabled}
                            className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-semibold text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <UniversalMathJax inline dynamic>{cleanupMath(token)}</UniversalMathJax>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <LiveExpressionInput
                          placeholder={`Enter ${comp.label || 'constructed value'} (e.g. 15, x^2, 4.5)...`}
                          value={typeof compVal === 'object' && compVal !== null ? (compVal.value ?? '') : (compVal ?? '')}
                          onChange={(val) => handleComponentChange(compId, val)}
                          disabled={disabled}
                        />
                      </div>
                      {comp.unit && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          {comp.unit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* B. EVIDENCE_SELECT */}
              {kind === 'EVIDENCE_SELECT' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    {comp.selectMode === 'SINGLE' ? 'Select the single most relevant statement:' : 'Select all relevant statements:'}
                  </p>
                  <div className="space-y-1.5">
                    {(comp.evidenceOptions || []).map((opt: any, oIdx: number) => {
                      const optId = String(opt.id || `opt_${oIdx}`);
                      const isSingle = comp.selectMode === 'SINGLE';
                      const selectedIds: string[] = Array.isArray(compVal)
                        ? compVal.map(String)
                        : (compVal && typeof compVal === 'object' && Array.isArray(compVal.selectedEvidenceIds)
                          ? compVal.selectedEvidenceIds.map(String)
                          : (compVal ? [String(compVal.selectedId || compVal)] : []));

                      const isSelected = selectedIds.includes(optId);

                      const toggleSelect = () => {
                        if (disabled) return;
                        if (isSingle) {
                          handleComponentChange(compId, [optId]);
                        } else {
                          const updated = isSelected
                            ? selectedIds.filter(id => id !== optId)
                            : [...selectedIds, optId];
                          handleComponentChange(compId, updated);
                        }
                      };

                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={toggleSelect}
                          disabled={disabled}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-medium text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 ${isSingle ? 'rounded-full' : 'rounded'} border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && (isSingle ? <div className="w-1.5 h-1.5 rounded-full bg-white" /> : <span className="text-[10px] leading-none">✓</span>)}
                          </div>
                          <span className="flex-1"><UniversalMathJax inline dynamic>{cleanupMath(opt.text || `Option ${oIdx + 1}`)}</UniversalMathJax></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* C. RELATION (Source -> Relation -> Target) */}
              {kind === 'RELATION' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Build or select the logical relationship:</p>
                  <div className="space-y-2">
                    {(comp.relationOptions || comp.expectedRelations || [{ source: 'Fact A', target: 'Fact B', relation: 'IMPLIES' }]).map((rel: any, rIdx: number) => {
                      const relationsList = comp.allowedRelations || ['IMPLIES', 'CAUSES', 'EQUIVALENT_TO', 'LEADS_TO', 'REQUIRES'];
                      const currentRelations: any[] = Array.isArray(compVal) ? compVal : (compVal?.relations || []);
                      const selectedRel = currentRelations[rIdx]?.relation || currentRelations[0]?.relation || 'IMPLIES';

                      return (
                        <div key={rIdx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-1 bg-white dark:bg-slate-900 border rounded">
                            <UniversalMathJax inline dynamic>{cleanupMath(rel.source || 'Premise')}</UniversalMathJax>
                          </span>
                          <select
                            disabled={disabled}
                            value={selectedRel}
                            onChange={(e) => {
                              const updated = [{ source: rel.source, target: rel.target, relation: e.target.value }];
                              handleComponentChange(compId, updated);
                            }}
                            className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold px-2 py-1 rounded text-xs"
                          >
                            {relationsList.map((op: string) => (
                              <option key={op} value={op}>
                                ── {op} ──▶
                              </option>
                            ))}
                          </select>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-1 bg-white dark:bg-slate-900 border rounded">
                            <UniversalMathJax inline dynamic>{cleanupMath(rel.target || 'Conclusion')}</UniversalMathJax>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* D. ORDER (Step-by-step reasoning sequence) */}
              {kind === 'ORDER' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Arrange the reasoning steps in logical chronological sequence (use arrows to reorder):</p>
                  {(() => {
                    const defaultOrder = (comp.sequenceItems || comp.items || []).map((it: any) => it.id);
                    const currentOrder: any[] = Array.isArray(compVal) ? compVal : (compVal?.order || defaultOrder);
                    const itemMap = new Map((comp.sequenceItems || comp.items || []).map((it: any) => [it.id, it.text]));

                    return (
                      <div className="space-y-1.5">
                        {currentOrder.map((itemVal, posIdx) => {
                          const itemId = typeof itemVal === 'string' ? itemVal : (itemVal?.id || String(itemVal));
                          const itemText = itemMap.get(itemId) || (typeof itemVal === 'object' && itemVal !== null ? itemVal.text : itemId);

                          return (
                            <div
                              key={itemId || posIdx}
                              className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {posIdx + 1}
                              </span>
                              <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                                <UniversalMathJax inline dynamic>{cleanupMath(String(itemText || ''))}</UniversalMathJax>
                              </span>
                            {!disabled && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={posIdx === 0}
                                  onClick={() => moveOrderItem(compId, currentOrder, posIdx, posIdx - 1)}
                                  className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-100"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={posIdx === currentOrder.length - 1}
                                  onClick={() => moveOrderItem(compId, currentOrder, posIdx, posIdx + 1)}
                                  className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-100"
                                >
                                  ▼
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                </div>
              )}

              {/* Component Feedback */}
              {showFeedback && compResult && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  compResult.status === 'CORRECT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : (compResult.status === 'PARTIAL'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200')
                }`}>
                  <span className="font-semibold">{compResult.feedback}</span>
                  <span className="font-mono font-bold">[{compResult.earnedMarks} / {compResult.maxMarks}m]</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Feedback */}
      {showFeedback && evalResult && (
        <Card className="p-3.5 border text-xs space-y-1 bg-slate-900 text-white dark:bg-slate-950">
          <div className="flex items-center justify-between font-bold">
            <span>Diagnostics: {evalResult.diagnosticTags?.join(', ') || 'Evaluated'}</span>
            <span>Total: {evalResult.score} / {evalResult.maxScore}m</span>
          </div>
          <p className="text-slate-300">{evalResult.feedback}</p>
        </Card>
      )}
    </div>
  );
}

// Backward-compatible alias for any legacy DR or SDR references
export const SDRRenderer = SRARenderer;
export type SDRRendererProps = SRARendererProps;
export const DRRenderer = SRARenderer;
export type DRRendererProps = SRARendererProps;

