import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { cleanupMath } from '@/lib/utils';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calculator,
  BookOpen,
  Lightbulb,
  Hash,
  Languages,
  Type,
  ArrowLeftRight,
  ChevronDown,
  Wand2,
  Loader2
} from 'lucide-react';
import { formatExpressionToLatex, areExpressionsEquivalent } from '@/lib/math-parser';
import { evaluateCMAChildPart } from '@/lib/evaluation/cmaEvaluation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  detectAnswerFormat,
  toggleNumerals,
  toBengaliNumerals,
  toEnglishNumerals,
  translateEnglishToBangla,
  translateBanglaToEnglish,
  convertEnglishToBanglaPhonetic,
  convertBanglaToEnglishPhonetic,
  smartConvert,
  smartConvertAsync,
  translateOnline,
  FORMAT_HINT_CONFIGS,
  type AnswerFormatHint,
  type ConversionMode
} from '@/utils/banglaConverter';

// ==========================================
// 0. Live Expression Input with LaTeX Preview & Bangla Converter
// ==========================================
export function LiveExpressionInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  formatHint
}: {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  formatHint?: AnswerFormatHint;
}) {
  const strVal = String(value ?? '');
  const [livePhonetic, setLivePhonetic] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const insertSymbol = (sym: string) => {
    if (disabled) return;
    onChange(strVal + sym);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (livePhonetic) {
      const converted = convertEnglishToBanglaPhonetic(rawVal);
      onChange(converted);
    } else {
      onChange(rawVal);
    }
  };

  const handleSmartTranslate = async (mode: ConversionMode = 'smart_toggle') => {
    if (disabled || !strVal.trim()) return;

    // Fast path: pure numerals short-circuit (0ms instant)
    const trimmed = strVal.trim();
    const hasBnDigits = /^[\u09E6-\u09EF\s\.\,\+\-\*\/\^\(\)]+$/.test(trimmed);
    const hasEnDigits = /^[0-9\s\.\,\+\-\*\/\^\(\)]+$/.test(trimmed);
    if (hasBnDigits || hasEnDigits || mode === 'toggle_numerals' || mode === 'en_to_bn_digits' || mode === 'bn_to_en_digits') {
      onChange(smartConvert(strVal, mode));
      return;
    }

    try {
      setIsTranslating(true);
      const translated = await smartConvertAsync(strVal, mode);
      if (translated) {
        onChange(translated);
      }
    } catch (err) {
      onChange(smartConvert(strVal, mode));
    } finally {
      setIsTranslating(false);
    }
  };

  const defaultPlaceholder = formatHint === 'numeric'
    ? 'সংখ্যা বা সমীকরণ লিখুন (e.g. 123, 3.14, 10^5)...'
    : formatHint === 'bangla'
    ? 'বাংলায় উত্তর লিখুন (যেমন: নেফ্রন, মাইটোকন্ড্রিয়া)...'
    : formatHint === 'english'
    ? 'Enter answer in English (e.g. Nephron, Mitochondria)...'
    : formatHint === 'mix'
    ? 'Enter answer or expression (e.g. 20 N, 2x+1, H2O)...'
    : 'Enter answer or math expression...';

  const effectivePlaceholder = placeholder || defaultPlaceholder;

  return (
    <div className="space-y-2">
      {!disabled ? (
        <>
          <Input
            type="text"
            placeholder={effectivePlaceholder}
            value={strVal}
            onChange={handleInputChange}
            disabled={disabled}
            className={`bg-white dark:bg-slate-950 text-sm font-mono ${className}`}
          />

          {/* Quick Math & Bangla-English Converter Toolbar */}
          <div className="flex flex-col gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {/* Top row: Toolbar buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              {/* Math symbols */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Math:
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

              {/* Converter buttons */}
              <div className="flex items-center gap-1 shrink-0 py-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                  <Languages className="w-3 h-3" /> Convert:
                </span>

                {/* 1-Click Numeral Toggle: ১২৩ ⇄ 123 */}
                <button
                  type="button"
                  onClick={() => onChange(toggleNumerals(strVal))}
                  title="সংখ্যা রূপান্তর (English ⇄ বাংলা সংখ্যা)"
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  <ArrowLeftRight className="w-2.5 h-2.5" />
                  <span>১২৩ ⇄ 123</span>
                </button>

                {/* 1-Click Smart Text / Neural Translate Toggle: বাং ⇄ EN */}
                <button
                  type="button"
                  onClick={() => handleSmartTranslate('smart_toggle')}
                  disabled={isTranslating}
                  title="স্মার্ট অনুবাদ (বাংলা ⇄ English)"
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 transition-colors shrink-0 shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isTranslating ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-600" />
                  ) : (
                    <Wand2 className="w-2.5 h-2.5" />
                  )}
                  <span>{isTranslating ? 'অনুবাদ...' : 'বাং ⇄ EN'}</span>
                </button>

                {/* Dropdown for explicit conversion modes & live typing */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0 flex items-center cursor-pointer"
                      title="More conversion options"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 text-xs font-sans">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      অনুবাদ (Neural Translation)
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSmartTranslate('en_to_bn_translate')}>
                      English → বাংলা অনুবাদ (Smart Neural)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSmartTranslate('bn_to_en_translate')}>
                      বাংলা → English অনুবাদ (Smart Neural)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      সংখ্যা রূপান্তর (Numerals)
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onChange(toBengaliNumerals(strVal))}>
                      123 → ১২৩৪৫ (English to বাংলা)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChange(toEnglishNumerals(strVal))}>
                      ১২৩ → 12345 (বাংলা to English)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      উচ্চারণগত রূপান্তর (Phonetic)
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onChange(convertEnglishToBanglaPhonetic(strVal))}>
                      EN → বাংলা (e.g. nephron → নেফ্রন)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChange(convertBanglaToEnglishPhonetic(strVal))}>
                      বাংলা → EN (e.g. নেফ্রন → nephron)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setLivePhonetic(!livePhonetic)}
                      className="flex items-center justify-between font-semibold cursor-pointer"
                    >
                      <span>বাং টাইপ (Live Phonetic)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${livePhonetic ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {livePhonetic ? 'ON' : 'OFF'}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Bottom row: Active format badge or LaTeX output */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              {formatHint ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${FORMAT_HINT_CONFIGS[formatHint].badgeClass}`}>
                    {formatHint === 'numeric' && <Hash className="w-2.5 h-2.5" />}
                    {formatHint === 'bangla' && <Languages className="w-2.5 h-2.5" />}
                    {formatHint === 'english' && <Type className="w-2.5 h-2.5" />}
                    {formatHint === 'mix' && <Sparkles className="w-2.5 h-2.5" />}
                    <span>প্রত্যাশিত উত্তর: {FORMAT_HINT_CONFIGS[formatHint].labelBn} ({FORMAT_HINT_CONFIGS[formatHint].labelEn})</span>
                  </span>
                  {livePhonetic && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 animate-pulse">
                      বাং টাইপ সক্রিয় (Live)
                    </span>
                  )}
                </div>
              ) : (
                <div />
              )}

              {strVal && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">LaTeX:</span>
                  <span className="font-semibold text-xs"><UniversalMathJax inline dynamic>{cleanupMath(formatExpressionToLatex(strVal))}</UniversalMathJax></span>
                </div>
              )}
            </div>
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
            let partVal = value?.[partId] ?? value?.[part.id] ?? value?.[part.key] ?? value?.[part.name] ?? value?.[part.label] ?? value?.[`part_${idx}`] ?? value?.[`p${idx + 1}`] ?? value?.[idx];
            if ((partVal === undefined || partVal === null || partVal === '') && parts.length === 1) {
              if (typeof value === 'string' || typeof value === 'number') {
                partVal = value;
              } else if (value && typeof value === 'object') {
                partVal = value[question?.id] ?? value.answer ?? value.value ?? (Object.keys(value).length === 1 ? Object.values(value)[0] : '');
              }
            }
            if (partVal && typeof partVal === 'object') {
              partVal = partVal.answer ?? partVal.value ?? partVal.text ?? partVal;
            }
            partVal = partVal ?? '';

            let res = evalResult?.partResults?.[partId] ??
              evalResult?.partResults?.[part.id] ??
              evalResult?.partResults?.[part.key] ??
              evalResult?.partResults?.[part.label] ??
              evalResult?.partResults?.[`part_${idx}`] ??
              evalResult?.partResults?.[`p${idx + 1}`] ??
              evalResult?.partResults?.[idx];

            const partLabel = part.label || part.prompt || part.text || part.question || part.questionText || `Part ${idx + 1}`;
            const expectedAns = part.expectedAnswer ?? part.modelAnswer ?? part.correctAnswer ?? part.correct ?? part.answer ?? '';
            const partMarks = part.marks || (part as any)?.mark || 1;
            const explanation = part.explanation || part.solution || (part as any)?.hint || '';
            const formatHint = detectAnswerFormat(expectedAns, part.type);
            const formatConfig = FORMAT_HINT_CONFIGS[formatHint];

            if (!res && showFeedback) {
              const fallbackEval = evaluateCMAChildPart(part, partVal);
              res = {
                isCorrect: fallbackEval.isCorrect,
                isAttempted: fallbackEval.isAttempted,
                status: fallbackEval.status,
                earned: fallbackEval.isCorrect ? partMarks : (fallbackEval.earnedRatio * partMarks),
                max: partMarks,
                studentVal: partVal,
                expectedVal: expectedAns
              };
            }

            const isCorrect = res ? res.isCorrect : false;
            const isPartial = res ? res.status === 'PARTIAL' : false;
            const isAttempted = res ? res.isAttempted : Boolean(partVal && String(partVal).trim() !== '');

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
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {!showFeedback && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${formatConfig.badgeClass}`}
                        title={`উত্তর ফরম্যাট: ${formatConfig.labelBn} (${formatConfig.labelEn}) - ${formatConfig.example}`}
                      >
                        {formatHint === 'numeric' && <Hash className="w-2.5 h-2.5" />}
                        {formatHint === 'bangla' && <Languages className="w-2.5 h-2.5" />}
                        {formatHint === 'english' && <Type className="w-2.5 h-2.5" />}
                        {formatHint === 'mix' && <Sparkles className="w-2.5 h-2.5" />}
                        <span>{formatConfig.labelBn}</span>
                      </span>
                    )}
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
                  placeholder={part.type === 'expression' ? 'e.g. (2x+1)/(x^2+3)' : undefined}
                  value={partVal}
                  onChange={(val) => handlePartChange(partId, val)}
                  disabled={disabled}
                  formatHint={formatHint}
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
            let stageVal = value?.[stageId] ?? value?.[stage.id] ?? value?.[stage.key] ?? value?.[stage.name] ?? value?.[stage.stageTitle] ?? value?.[`stage_${idx}`] ?? value?.[`s${idx + 1}`] ?? value?.[idx];
            if ((stageVal === undefined || stageVal === null || stageVal === '') && stages.length === 1) {
              if (typeof value === 'string' || typeof value === 'number') {
                stageVal = value;
              } else if (value && typeof value === 'object') {
                stageVal = value[question?.id] ?? value.answer ?? value.value ?? (Object.keys(value).length === 1 ? Object.values(value)[0] : '');
              }
            }
            if (stageVal && typeof stageVal === 'object') {
              stageVal = stageVal.answer ?? stageVal.value ?? stageVal.text ?? stageVal;
            }
            stageVal = stageVal ?? '';

            let res = evalResult?.stageResults?.[stageId] ??
              evalResult?.stageResults?.[stage.id] ??
              evalResult?.stageResults?.[stage.key] ??
              evalResult?.stageResults?.[stage.stageTitle] ??
              evalResult?.stageResults?.[`stage_${idx}`] ??
              evalResult?.stageResults?.[`s${idx + 1}`] ??
              evalResult?.stageResults?.[idx];

            const stageTitle = stage.stageTitle || stage.prompt || stage.text || stage.question || stage.questionText || `Stage ${idx + 1}`;
            const expectedAns = stage.expectedAnswer ?? stage.modelAnswer ?? stage.correctAnswer ?? stage.correct ?? stage.answer ?? '';
            const stageMarks = stage.marks || (stage as any)?.mark || 1;
            const formula = stage.formula || stage.equation || '';
            const explanation = stage.explanation || stage.solution || '';
            const formatHint = detectAnswerFormat(expectedAns, stage.stageType);
            const formatConfig = FORMAT_HINT_CONFIGS[formatHint];

            if (!res && showFeedback) {
              const isDirect = areExpressionsEquivalent(String(stageVal), String(expectedAns), Number(stage.tolerance) || 0.05);
              res = {
                isCorrectDirectly: isDirect,
                isCorrectWithPropagatedError: false,
                isAttempted: Boolean(stageVal && String(stageVal).trim() !== ''),
                status: isDirect ? 'CORRECT' : 'INCORRECT',
                earned: isDirect ? stageMarks : 0,
                max: stageMarks
              };
            }

            const isDirect = res ? res.isCorrectDirectly : false;
            const isPropagated = res ? res.isCorrectWithPropagatedError : false;
            const isAttempted = res ? res.isAttempted : Boolean(stageVal && String(stageVal).trim() !== '');

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
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {!showFeedback && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${formatConfig.badgeClass}`}
                        title={`উত্তর ফরম্যাট: ${formatConfig.labelBn} (${formatConfig.labelEn}) - ${formatConfig.example}`}
                      >
                        {formatHint === 'numeric' && <Hash className="w-2.5 h-2.5" />}
                        {formatHint === 'bangla' && <Languages className="w-2.5 h-2.5" />}
                        {formatHint === 'english' && <Type className="w-2.5 h-2.5" />}
                        {formatHint === 'mix' && <Sparkles className="w-2.5 h-2.5" />}
                        <span>{formatConfig.labelBn}</span>
                      </span>
                    )}
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
                  formatHint={formatHint}
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



