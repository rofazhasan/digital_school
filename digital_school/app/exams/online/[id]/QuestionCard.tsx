"use client";
import React, { useRef, useState, useMemo, useCallback, memo, useEffect } from "react";
import { useExamContext } from "./ExamContext";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, AlertCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cleanupMath } from "@/lib/utils";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ShieldAlert } from "lucide-react";
import { toBengaliNumerals, toBengaliAlphabets } from '@/utils/numeralConverter';
import { cn } from "@/lib/utils";

// Image Zoom Component
const ZoomableImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={`relative group cursor-zoom-in ${className}`}>
          <img src={src} alt={alt} className="w-full h-full object-contain transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-fit max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
        <DialogTitle className="sr-only">Zoomed Image</DialogTitle>
        <img src={src} alt={alt} className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-background" />
      </DialogContent>
    </Dialog>
  );
};

interface QuestionCardProps {
  disabled?: boolean;
  result?: any;
  submitted?: boolean;
  isMCQOnly?: boolean;
  questionIdx?: number;
  questionOverride?: any;
  hideScore?: boolean;
}

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
};

// Premium MCQ Option Component
const MCQOption = memo(({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  userAnswer,
  disabled,
  submitted,
  onSelect,
  fontSize = 'md'
}: {
  option: any;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  userAnswer: any;
  disabled: boolean;
  submitted: boolean;
  onSelect: (label: string) => void;
  fontSize?: 'md' | 'lg' | 'xl';
}) => {
  const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);

  const textSizeClass = fontSize === 'xl' ? 'text-xl md:text-2xl' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  // Premium State styles
  const getStyles = () => {
    const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

    // Result mode
    if (showResult) {
      if (isCorrect) return `${base} bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-100`;
      if (isSelected && !isCorrect) return `${base} bg-rose-50 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100`;
      return `${base} bg-muted/30 border-border text-muted-foreground opacity-60 grayscale`;
    }

    // Interaction mode
    if (isSelected) return `${base} bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary transform scale-[1.01] z-10 dark:bg-primary/20 dark:ring-primary/40`;

    return `${base} bg-card border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5`;
  };

  return (
    <button
      onClick={() => onSelect(label)}
      disabled={disabled || submitted || !!userAnswer}
      className={getStyles()}
    >
      {/* Option Key Circle */}
      <div className={`
        flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-300 shadow-sm
        ${showResult && isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200' :
          showResult && isSelected && !isCorrect ? 'bg-rose-500 text-white shadow-rose-200' :
            isSelected ? 'bg-primary text-primary-foreground shadow-primary/20 scale-110' :
              'bg-muted text-muted-foreground group-hover:bg-card-foreground/5 group-hover:text-primary group-hover:shadow-md group-hover:scale-110'}
      `}>
        {String.fromCharCode(65 + index)}
      </div>

      {/* Option Text */}
      <div className={`flex-1 pt-1 ${textSizeClass} leading-relaxed font-medium text-foreground group-hover:text-primary transition-colors`}>
        <div className="min-w-0">
          <MathJax inline dynamic>
            <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
          </MathJax>
        </div>
        {/* @ts-ignore */}
        {option?.image && (
          <div className="mt-4">
            {/* @ts-ignore */}
            <ZoomableImage
              src={option.image}
              alt="Option"
              className="max-h-48 w-full rounded-lg border border-border bg-card p-1 shadow-sm group-hover:shadow-md transition-shadow"
            />
          </div>
        )}
      </div>

      {/* Result Icons */}
      {showResult && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-background rounded-full p-1 shadow-sm" />}
          {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-background rounded-full p-1 shadow-sm" />}
        </div>
      )}
    </button>
  );
});

MCQOption.displayName = 'MCQOption';

// Premium Multiple Correct Option Component
const MCOption = memo(({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  disabled,
  submitted,
  onSelect,
  fontSize = 'md'
}: {
  option: any;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  disabled: boolean;
  submitted: boolean;
  onSelect: (index: number) => void;
  fontSize?: 'md' | 'lg' | 'xl';
}) => {
  const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);

  const textSizeClass = fontSize === 'xl' ? 'text-xl md:text-2xl' : fontSize === 'lg' ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  const getStyles = () => {
    const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

    if (showResult) {
      if (isCorrect) return `${base} bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-100`;
      if (isSelected && !isCorrect) return `${base} bg-rose-50 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100`;
      return `${base} bg-muted/30 border-border text-muted-foreground opacity-60 grayscale`;
    }

    if (isSelected) return `${base} bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary transform scale-[1.01] z-10 dark:bg-primary/20 dark:ring-primary/40`;

    return `${base} bg-card border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5`;
  };

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled || submitted}
      className={getStyles()}
    >
      <div className={`
        flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300
        ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-110' : 'bg-card border-border text-transparent group-hover:border-primary/50'}
        ${showResult && isCorrect ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100' : ''}
        ${showResult && isSelected && !isCorrect ? 'bg-rose-600 border-rose-600 text-white shadow-rose-100' : ''}
      `}>
        <Check className={`w-4 h-4 md:w-5 md:h-5 ${isSelected || (showResult && isCorrect) ? 'scale-100' : 'scale-0'} transition-transform duration-200`} />
      </div>
      <div className={`flex-1 pt-0.5 ${textSizeClass} leading-relaxed font-medium text-foreground group-hover:text-primary transition-colors`}>
        <MathJax inline dynamic>
          <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
        </MathJax>
      </div>

      {/* Result Icons */}
      {showResult && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-background rounded-full p-1 shadow-sm" />}
          {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-background rounded-full p-1 shadow-sm" />}
        </div>
      )}
    </button>
  );
});
MCOption.displayName = 'MCOption';

// Match the Following Section
const MTFGrid = ({
  question,
  userAnswer,
  showResult,
  disabled,
  onSelect
}: {
  question: any;
  userAnswer: any;
  showResult: boolean;
  disabled: boolean;
  onSelect: (leftId: string, rightId: string) => void;
}) => {
  const leftColumn = question.leftColumn || [];
  const rightColumn = question.rightColumn || [];
  const matches = userAnswer || {};
  const correctMatches = question.matches || {};

  // Mobile Selection State
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);

  // Helper to get text for right item
  const getRightText = (id: string) => {
    const item = rightColumn.find((r: any) => r.id === id);
    return item ? item.text : id;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* --- DESKTOP VIEW (Row-based Pairing) --- */}
      <div className="hidden md:flex flex-col gap-6">
        {leftColumn.map((lc: any) => {
          const currentMatchId = matches[lc.id];
          const cAns = correctMatches[lc.id];
          const isCorrect = showResult && currentMatchId === cAns;
          const isWrong = showResult && currentMatchId && currentMatchId !== cAns;

          return (
            <div
              key={lc.id}
              className={cn(
                "group relative p-6 rounded-3xl border-2 transition-all duration-500",
                isCorrect ? "bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5" :
                  isWrong ? "bg-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5" :
                    currentMatchId ? "bg-primary/5 border-primary/20 shadow-md shadow-primary/5" :
                      "bg-card border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
              )}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center font-bold text-lg border border-border shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                    {lc.id}
                  </div>
                  <div className="text-xl font-bold text-foreground/90">
                    <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                  </div>
                </div>

                {showResult && (
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 px-3 py-1">
                        <Check className="w-3.5 h-3.5" /> Correct Match
                      </Badge>
                    ) : isWrong ? (
                      <Badge variant="destructive" className="gap-1 px-3 py-1">
                        <X className="w-3.5 h-3.5" /> Wrong Match
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 gap-1 px-3 py-1 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> Missed
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Selection Pills */}
              <div className="flex flex-wrap gap-3">
                {rightColumn.map((rc: any) => {
                  const isSelected = currentMatchId === rc.id;
                  const isItemCorrect = showResult && cAns === rc.id;
                  const isWrongSelection = showResult && isSelected && !isItemCorrect;

                  return (
                    <button
                      key={rc.id}
                      onClick={() => !disabled && !showResult && onSelect(lc.id, rc.id)}
                      disabled={disabled || showResult}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                        isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" :
                          isItemCorrect ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" :
                            isWrongSelection ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-105" :
                              "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <span className="text-base font-semibold leading-snug">
                        <UniversalMathJax inline dynamic>{rc.text}</UniversalMathJax>
                      </span>

                      {(isSelected || isItemCorrect || isWrongSelection) && (
                        <div className="absolute right-2 top-2">
                          {isItemCorrect ? <Check className="w-4 h-4 opacity-70" /> : isWrongSelection ? <X className="w-4 h-4 opacity-70" /> : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Correction Help */}
              {showResult && !isCorrect && (
                <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Correct Answer:</span>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <UniversalMathJax inline dynamic>{getRightText(cAns)}</UniversalMathJax>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- MOBILE VIEW (Card Stack) --- */}
      <div className="md:hidden space-y-3">
        {leftColumn.map((lc: any) => {
          const currentMatchId = matches[lc.id];
          const currentMatchText = currentMatchId ? getRightText(currentMatchId) : null;

          // Result Logic for Mobile
          const uAns = matches[lc.id];
          const cAns = correctMatches[lc.id];
          const isCorrect = showResult && uAns === cAns;
          const isWrong = showResult && uAns && uAns !== cAns;

          return (
            <Dialog key={lc.id} open={activeLeftId === lc.id} onOpenChange={(open) => setActiveLeftId(open ? lc.id : null)}>
              <DialogTrigger asChild>
                <div
                  className={`
                    p-4 rounded-xl border-2 transition-all active:scale-[0.98] cursor-pointer
                    ${isCorrect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : isWrong ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : currentMatchId ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/40' : 'bg-card border-border hover:border-primary/20'}
                  `}
                  onClick={() => !disabled && !showResult && setActiveLeftId(lc.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="w-6 h-6 rounded bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">
                      {lc.id}
                    </span>
                    {currentMatchId && (
                      <Badge variant={isCorrect ? "default" : isWrong ? "destructive" : "secondary"} className={isCorrect ? "bg-green-600" : ""}>
                        Matched: {currentMatchId}
                      </Badge>
                    )}
                  </div>

                  <div className="font-medium text-foreground/90 mb-3">
                    <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                  </div>

                  {/* Connected Right Item Preview */}
                  {currentMatchId ? (
                    <div className="p-2 bg-muted/30 rounded-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      <div className="line-clamp-2 w-full">
                        <UniversalMathJax inline dynamic>{currentMatchText}</UniversalMathJax>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-muted-foreground border-t border-dashed border-border mt-2">
                      Tap to select match
                    </div>
                  )}

                  {/* Correct Answer Display in Result Mode */}
                  {showResult && !isCorrect && (
                    <div className="mt-2 text-xs text-green-600 font-bold bg-green-500/10 p-2 rounded">
                      Correct: {cAns} - {getRightText(cAns)}
                    </div>
                  )}
                </div>
              </DialogTrigger>

              {!disabled && !showResult && (
                <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto rounded-3xl">
                  <DialogTitle>Select Match for {lc.id}</DialogTitle>
                  <div className="py-2 space-y-2">
                    <div className="p-3 bg-muted rounded-lg mb-4 text-sm text-muted-foreground">
                      <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                    </div>
                    <div className="h-px bg-border my-4" />
                    {rightColumn.map((rc: any) => {
                      const isSelected = currentMatchId === rc.id;
                      return (
                        <button
                          key={rc.id}
                          onClick={() => {
                            onSelect(lc.id, rc.id);
                            setActiveLeftId(null);
                          }}
                          className={`
                               w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3
                               ${isSelected ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-card border-border hover:bg-muted'}
                             `}
                        >
                          <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {rc.id}
                          </span>
                          <div className="text-sm font-medium text-foreground">
                            <UniversalMathJax inline dynamic>{rc.text}</UniversalMathJax>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </DialogContent>
              )}
            </Dialog>
          );
        })}
      </div>

      {showResult && (
        <div className="md:hidden bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Detailed Results</p>
          <div className="grid grid-cols-1 gap-2">
            {leftColumn.map((lc: any) => {
              const uAns = matches[lc.id];
              const cAns = correctMatches[lc.id];
              const isCorrect = uAns === cAns;
              return (
                <div key={lc.id} className="flex items-center justify-between p-2 bg-card rounded border border-border text-sm">
                  <span className="font-bold text-muted-foreground">{lc.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                      <UniversalMathJax inline dynamic>{uAns ? getRightText(uAns) : '?'}</UniversalMathJax>
                    </span>
                    <span className="text-muted-foreground/30">→</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      <UniversalMathJax inline dynamic>{getRightText(cAns)}</UniversalMathJax>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showResult && (
        <div className="hidden md:block bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Detailed Results</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {leftColumn.map((lc: any) => {
              const uAns = matches[lc.id];
              const cAns = correctMatches[lc.id];
              const isCorrect = uAns === cAns;
              return (
                <div key={lc.id} className="flex items-center justify-between p-2 bg-card rounded border border-border text-sm">
                  <span className="font-bold text-muted-foreground">{lc.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                      <UniversalMathJax inline dynamic>{uAns ? getRightText(uAns) : '?'}</UniversalMathJax>
                    </span>
                    <span className="text-muted-foreground/30">→</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      <UniversalMathJax inline dynamic>{getRightText(cAns)}</UniversalMathJax>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Debounced Textarea for Subjective Answers
const DebouncedTextarea = memo(({
  value,
  onChange,
  disabled,
  placeholder,
  rows,
  className,
}: {
  value: string,
  onChange: (val: string) => void,
  disabled: boolean,
  placeholder: string,
  rows?: number,
  className?: string,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state if global state changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    // Debounce the global update
    const timeout = setTimeout(() => onChange(newVal), 1000);
    return () => clearTimeout(timeout);
  };

  return (
    <textarea
      value={localValue || ""}
      onChange={handleChange}
      disabled={disabled}
      rows={rows}
      className={className ?? "w-full min-h-[200px] p-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y text-base transition-all"}
      placeholder={placeholder}
    />
  );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';

// Debounced Input for CQ Sub-questions
const DebouncedInput = memo(({
  value,
  onChange,
  disabled,
  placeholder
}: {
  value: string,
  onChange: (val: string) => void,
  disabled: boolean,
  placeholder: string
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    const timeout = setTimeout(() => onChange(newVal), 1000);
    return () => clearTimeout(timeout);
  };

  return (
    <Input
      value={localValue || ""}
      onChange={handleChange}
      disabled={disabled}
      className="bg-gray-50/50 h-12 rounded-xl border-border focus:ring-primary/20"
      placeholder={placeholder}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

function QuestionCard({ disabled, result, submitted, isMCQOnly, questionIdx, questionOverride, hideScore }: QuestionCardProps) {
  const { exam, answers, setAnswers, navigation, setNavigation, saveStatus, markQuestion, setIsUploading, fontSize } = useExamContext();
  const questions = exam.questions || [];

  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];

  // Dynamic Font Size Classes
  const getTextSize = (base: string) => {
    if (fontSize === 'lg') return base === 'text-base' ? 'text-lg' : 'text-xl';
    if (fontSize === 'xl') return base === 'text-base' ? 'text-xl' : 'text-2xl';
    return base; // md (default)
  };

  const text = question?.text || question?.questionText || "(No text)";
  const type = (question?.type || "").toLowerCase();
  const subQuestions = question?.subQuestions || question?.sub_questions || [];

  // Stable handleAnswerChange - no longer depends on answers object
  const handleAnswerChange = useCallback((value: any) => {
    if (disabled || !question) return;
    setAnswers((prev: any) => ({
      ...prev,
      [question.id]: value
    }));
  }, [disabled, question?.id, setAnswers]);

  const handleSubAnswerChange = useCallback((idx: number, value: any) => {
    if (disabled || !question) return;
    setAnswers((prev: any) => ({
      ...prev,
      [`${question.id}_sub_${idx}`]: value
    }));
  }, [disabled, question?.id, setAnswers]);

  // Keyboard Shortcuts for MCQ (A-D / 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || submitted || !question || type !== 'mcq') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      const options = question.options || [];
      let selectedIndex = -1;

      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) {
        selectedIndex = parseInt(key) - 1;
      }
      else if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(key)) {
        selectedIndex = key.charCodeAt(0) - 65;
      }

      if (selectedIndex >= 0 && selectedIndex < options.length) {
        const opt = options[selectedIndex];
        const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
        handleAnswerChange(label);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, submitted, question, type, handleAnswerChange]);

  const handleMarkQuestion = useCallback(() => {
    if (!question) return;
    markQuestion(question.id, !navigation.marked[question.id]);
  }, [question?.id, navigation.marked, markQuestion]);

  if (!question) return <div className="p-8 text-center text-muted-foreground">Question not found</div>;

  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  const arOptionLabels = [
    "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা",
    "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়",
    "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
    "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
    "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
  ];

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="w-full max-w-3xl mx-auto shadow-sm border border-border bg-card rounded-2xl overflow-hidden font-exam-online">
        <CardContent className="p-6 md:p-8">

          {/* Header Meta */}
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold tracking-wider text-muted-foreground border-border">
                  {(type || "").toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                  {question.marks} Point{Number(question.marks) !== 1 && 's'}
                </Badge>
              </div>
            </div>
            {!submitted && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkQuestion}
                className={`gap-2 text-xs font-medium ${navigation.marked[question.id] ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {navigation.marked[question.id] ? (
                  <><Check className="w-3.5 h-3.5" /> Reviewed</>
                ) : (
                  <>Mark for review</>
                )}
              </Button>
            )}
          </div>

          {/* Question Text */}
          <div className={`prose prose-indigo dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed mb-8 ${getTextSize('text-base md:text-xl')}`}>
            {type === "ar" ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 pointer-events-none px-2 py-0 h-5 text-[10px] font-bold uppercase">Assertion (A)</Badge>
                  </div>
                  <div className="text-base md:text-lg text-foreground/90 leading-relaxed font-semibold">
                    <UniversalMathJax inline dynamic>{cleanupMath(question.assertion || text || "")}</UniversalMathJax>
                  </div>
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 pointer-events-none px-2 py-0 h-5 text-[10px] font-bold uppercase">Reason (R)</Badge>
                  </div>
                  <div className="text-base md:text-lg text-foreground/90 leading-relaxed font-semibold">
                    <UniversalMathJax inline dynamic>{cleanupMath(question.reason || "")}</UniversalMathJax>
                  </div>
                </div>
              </div>
            ) : (
              <MathJax dynamic inline>
                <UniversalMathJax inline dynamic>{cleanupMath(text || "")}</UniversalMathJax>
              </MathJax>
            )}
          </div>

          {/* Inputs */}
          <div className="space-y-6">
            {type === "mcq" && (
              <div className="grid grid-cols-1 gap-3">
                {(question.options || []).map((opt: any, i: number) => {
                  const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                  const isCorrect = opt.originalIndex !== undefined
                    ? Number(question.correct) === opt.originalIndex
                    : (question.correct === i || String(question.correct) === String(i));
                  const isSelected = String(userAnswer).trim() === label.trim();
                  return (
                    <MCQOption
                      key={i}
                      option={opt}
                      index={i}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      showResult={showResult}
                      userAnswer={userAnswer}
                      disabled={!!disabled}
                      submitted={!!submitted}
                      onSelect={(val) => handleAnswerChange(val)}
                      fontSize={fontSize} // Pass props
                    />
                  );
                })}
              </div>
            )}

            {type === "mc" && (
              <div className="grid grid-cols-1 gap-3">
                {(question.options || []).map((opt: any, i: number) => {
                  const isCorrect = opt.isCorrect === true;
                  const currentSelected = userAnswer?.selectedOptions || [];
                  const isSelected = currentSelected.includes(i);
                  return (
                    <MCOption
                      key={i}
                      option={opt}
                      index={i}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      showResult={showResult}
                      disabled={!!disabled}
                      submitted={!!submitted}
                      onSelect={(idx) => {
                        const newSelection = isSelected
                          ? currentSelected.filter((item: number) => item !== idx)
                          : [...currentSelected, idx];
                        handleAnswerChange({ selectedOptions: newSelection });
                      }}
                      fontSize={fontSize} // Pass props
                    />
                  );
                })}
              </div>
            )}

            {type === "ar" && (
              <div className="grid grid-cols-1 gap-3">
                {arOptionLabels.map((lbl, i) => {
                  const val = i + 1;
                  const isCorrect = question.correctOption === val;
                  const isSelected = userAnswer?.selectedOption === val;
                  return (
                    <MCQOption
                      key={i}
                      option={lbl}
                      index={i}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      showResult={showResult}
                      userAnswer={userAnswer}
                      disabled={!!disabled}
                      submitted={!!submitted}
                      onSelect={() => handleAnswerChange({ selectedOption: val })}
                      fontSize={fontSize} // Pass props
                    />
                  );
                })}
              </div>
            )}

            {type === "mtf" && (
              <MTFGrid
                question={question}
                userAnswer={userAnswer}
                showResult={showResult}
                disabled={!!disabled}
                onSelect={(leftId, rightId) => {
                  const newMatches = { ...(userAnswer || {}), [leftId]: rightId };
                  handleAnswerChange(newMatches);
                }}
              />
            )}

            {(type === "cq" || type === "sq") && (
              <div className="space-y-4">
                {type === "sq" && (
                  <div className="space-y-2">
                    <DebouncedTextarea
                      value={userAnswer || ""}
                      onChange={handleAnswerChange}
                      disabled={!!(disabled || submitted)}
                      placeholder="Type your answer here..."
                    />
                    <div className="space-y-2">
                      {/* Image Gallery */}
                      {(() => {
                        const singleImage = answers[`${question.id}_image`];
                        const multipleImages = answers[`${question.id}_images`] || [];
                        const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                        return allImages.length > 0 ? (
                          <div className="pt-2">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">Uploaded Images ({allImages.length}/5)</div>
                            <div className="flex flex-wrap gap-2">
                              {allImages.map((imgUrl: string, idx: number) => (
                                <div key={idx} className="relative group">
                                  <ZoomableImage
                                    src={imgUrl}
                                    alt={`Answer ${idx + 1}`}
                                    className="h-20 w-20 object-cover rounded-xl border border-border shadow-sm overflow-hidden"
                                  />
                                  {!disabled && !submitted && (
                                    <button
                                      onClick={() => {
                                        setAnswers((prev: any) => {
                                          const newAnswers = { ...prev };
                                          const updatedImages = allImages.filter((_: string, i: number) => i !== idx);
                                          if (updatedImages.length > 0) {
                                            newAnswers[`${question.id}_images`] = updatedImages;
                                          } else {
                                            delete newAnswers[`${question.id}_images`];
                                          }
                                          delete newAnswers[`${question.id}_image`];
                                          return newAnswers;
                                        });
                                      }}
                                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Upload Button */}
                      {!disabled && !submitted && (
                        ((answers[`${question.id}_image`] ? 1 : 0) + (answers[`${question.id}_images`]?.length || 0)) < 5
                      ) ? (
                        <div className="relative pt-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onClick={() => setIsUploading?.(true)}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) {
                                setIsUploading?.(false);
                                return;
                              }

                              const singleImage = answers[`${question.id}_image`];
                              const multipleImages = answers[`${question.id}_images`] || [];
                              const currentImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                              const remainingSlots = 5 - currentImages.length;
                              const filesToUpload = files.slice(0, remainingSlots);

                              if (files.length > remainingSlots) {
                                toast.warning(`Only uploading ${remainingSlots} image(s). Maximum 5 images per question.`);
                              }

                              const uploadedUrls: string[] = [];

                              for (const file of filesToUpload) {
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                  const data = await res.json();

                                  if (res.ok) {
                                    uploadedUrls.push(data.url);
                                  } else {
                                    console.error('Upload failed:', data);
                                  }
                                } catch (err) { console.error('Upload error:', err); }
                              }

                              if (uploadedUrls.length > 0) {
                                setAnswers((prev: any) => ({
                                  ...prev,
                                  [`${question.id}_images`]: [...currentImages, ...uploadedUrls]
                                }));
                              }

                              setIsUploading?.(false);
                              e.target.value = ''; // Reset input
                            }}
                            className="hidden"
                            id={`q-img-${question.id}`}
                          />
                          <label htmlFor={`q-img-${question.id}`} className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl cursor-pointer text-sm font-medium transition-colors shadow-sm">
                            <Upload className="w-4 h-4 text-primary" /> Upload Images (Max 5)
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {type === "cq" && (
                  <div className="space-y-6">
                    {subQuestions.map((subQ: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="text-base font-bold text-foreground mb-4 flex justify-between items-start gap-4">
                          <span>
                            {toBengaliAlphabets(idx)}. <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.question || subQ || "")}</UniversalMathJax>
                          </span>
                          {subQ.marks && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] font-black uppercase tracking-tighter">
                              {subQ.marks} Point{Number(subQ.marks) !== 1 && 's'}
                            </Badge>
                          )}
                        </div>
                        {subQ.image && (
                          <div className="mb-4">
                            <ZoomableImage src={subQ.image} alt="Sub-question" className="max-h-48 w-full rounded-xl border bg-card p-1" />
                          </div>
                        )}

                        <div className="space-y-4">
                          <DebouncedInput
                            value={answers[`${question.id}_sub_${idx}`] || ""}
                            onChange={(val) => handleSubAnswerChange(idx, val)}
                            disabled={!!(disabled || submitted)}
                            placeholder="Type your answer here..."
                          />

                          {/* Image Gallery for Sub-question */}
                          {(() => {
                            const singleImage = answers[`${question.id}_sub_${idx}_image`];
                            const multipleImages = answers[`${question.id}_sub_${idx}_images`] || [];
                            const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                            return allImages.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {allImages.map((imgUrl: string, imgIdx: number) => (
                                  <div key={imgIdx} className="relative group">
                                    <ZoomableImage
                                      src={imgUrl}
                                      alt={`Sub ${idx + 1} Image ${imgIdx + 1}`}
                                      className="h-16 w-16 object-cover rounded-lg border border-border"
                                    />
                                    {!disabled && !submitted && (
                                      <button
                                        onClick={() => {
                                          setAnswers((prev: any) => {
                                            const newAnswers = { ...prev };
                                            const updatedImages = allImages.filter((_: string, i: number) => i !== imgIdx);
                                            if (updatedImages.length > 0) {
                                              newAnswers[`${question.id}_sub_${idx}_images`] = updatedImages;
                                            } else {
                                              delete newAnswers[`${question.id}_sub_${idx}_images`];
                                            }
                                            delete newAnswers[`${question.id}_sub_${idx}_image`];
                                            return newAnswers;
                                          });
                                        }}
                                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : null;
                          })()}

                          {/* Upload Button */}
                          {!disabled && !submitted && (
                            ((answers[`${question.id}_sub_${idx}_image`] ? 1 : 0) + (answers[`${question.id}_sub_${idx}_images`]?.length || 0)) < 5
                          ) ? (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onClick={() => setIsUploading?.(true)}
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length === 0) {
                                    setIsUploading?.(false);
                                    return;
                                  }

                                  const singleImage = answers[`${question.id}_sub_${idx}_image`];
                                  const multipleImages = answers[`${question.id}_sub_${idx}_images`] || [];
                                  const currentImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                                  const remainingSlots = 5 - currentImages.length;
                                  const filesToUpload = files.slice(0, remainingSlots);

                                  const uploadedUrls: string[] = [];
                                  for (const file of filesToUpload) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                      const data = await res.json();
                                      if (res.ok) uploadedUrls.push(data.url);
                                    } catch (err) { console.error('Upload error:', err); }
                                  }

                                  if (uploadedUrls.length > 0) {
                                    setAnswers((prev: any) => ({
                                      ...prev,
                                      [`${question.id}_sub_${idx}_images`]: [...currentImages, ...uploadedUrls]
                                    }));
                                  }
                                  setIsUploading?.(false);
                                  e.target.value = '';
                                }}
                                className="hidden"
                                id={`q-img-${question.id}-${idx}`}
                              />
                              <label htmlFor={`q-img-${question.id}-${idx}`} className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                                <Upload className="w-3 h-3" /> Upload Photo (Max 5)
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(type === "int" || type === "numeric") && (
              <Input
                type="number"
                value={userAnswer?.answer || ""}
                onChange={(e) => handleAnswerChange({ answer: parseInt(e.target.value) || 0 })}
                disabled={disabled || submitted}
                className="w-full max-w-xs text-xl font-bold p-8 border-2 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Type Number..."
              />
            )}

            {type === "descriptive" && (() => {
              const parts: any[] = question.subQuestions || [];
              return (
                <div className="space-y-8">
                  {parts.map((part: any, pIdx: number) => {
                    const ansKey = (sub: string | number) => `${question.id}_desc_${pIdx}_${sub}`;
                    const getAns = (sub: string | number) => userAnswer?.[ansKey(sub)] ?? '';
                    const setAns = (sub: string | number, val: string) =>
                      handleAnswerChange({ ...userAnswer, [ansKey(sub)]: val });

                    return (
                      <div key={pIdx} className="space-y-3 border rounded-xl p-4 bg-amber-50/40 dark:bg-amber-900/10">
                        {/* Part header */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">{part.label || `Part ${pIdx + 1}`}</span>
                          <span className="text-xs text-muted-foreground">[{part.marks} marks]</span>
                        </div>

                        {/* Instructions */}
                        {part.instructions && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">{part.instructions}</p>
                        )}

                        {/* ── WRITING ── */}
                        {part.subType === 'writing' && (
                          <div className="space-y-4">
                            {/* Source text for translation / summary / rearrangement */}
                            {part.sourceText && (
                              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-base leading-relaxed text-blue-900 dark:text-blue-100 relative group">
                                <div className="absolute top-2 right-4 text-[10px] font-bold text-blue-300 dark:text-blue-700 uppercase tracking-widest pointer-events-none group-hover:text-blue-400 transition-colors">Source Material</div>
                                <UniversalMathJax dynamic>{part.sourceText}</UniversalMathJax>
                              </div>
                            )}
                            <DebouncedTextarea
                              value={getAns('ans') as string}
                              onChange={(val) => setAns('ans', val)}
                              disabled={!!(disabled || submitted)}
                              rows={8}
                              placeholder={
                                part.writingType === 'translation' ? 'Enter the translation in target language…' :
                                  part.writingType === 'summary' ? 'Write your concise summary (সারাংশ) here…' :
                                    part.writingType === 'story' ? 'Continue the narrative based on the prompt…' :
                                      part.writingType === 'dialogue' ? 'Compose the dialogue between characters…' :
                                        'Provide your detailed answer here…'
                              }
                              className="w-full p-5 rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base leading-relaxed resize-none"
                            />
                          </div>
                        )}

                        {/* ── FILL_IN ── */}
                        {part.subType === 'fill_in' && (
                          <div className="space-y-4">
                            {/* Word/Verb Box */}
                            {part.wordBox && part.wordBox.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-2xl shadow-sm">
                                <div className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-300/60 w-full mb-2 uppercase tracking-tight">Available Words:</div>
                                {part.wordBox.map((w: string, wi: number) => (
                                  <span key={wi} className="px-3 py-1 bg-white dark:bg-gray-800 text-indigo-800 dark:text-indigo-200 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">{w}</span>
                                ))}
                              </div>
                            )}

                            {/* Gap passage with inline inputs */}
                            {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (() => {
                              const segments = part.passage.split('___');
                              return (
                                <div className="text-base leading-relaxed p-5 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-border backdrop-blur-sm">
                                  {segments.map((seg: string, si: number) => (
                                    <span key={si}>
                                      <UniversalMathJax inline dynamic>{seg}</UniversalMathJax>
                                      {si < segments.length - 1 && (
                                        <input
                                          type="text"
                                          value={getAns(si) as string}
                                          onChange={(e) => setAns(si, e.target.value)}
                                          disabled={disabled || submitted}
                                          className="inline-block w-28 border-b-2 border-primary/40 bg-transparent text-center text-sm font-bold focus:outline-none focus:border-primary focus:bg-primary/5 transition-all mx-1 h-8 rounded-t-md"
                                          placeholder={`(${si + 1})`}
                                        />
                                      )}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Item-based fill types */}
                            {part.fillType && part.fillType !== 'gap_passage' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(part.items || []).map((item: string, ii: number) => (
                                  <div key={ii} className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-2xl border border-border/50 group hover:border-primary/30 transition-colors">
                                    <div className="flex gap-3 items-start mb-3">
                                      <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">{ii + 1}</span>
                                      <div className="text-sm font-medium text-foreground/80 pt-0.5"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                    </div>
                                    <input
                                      type="text"
                                      value={getAns(ii) as string}
                                      onChange={(e) => setAns(ii, e.target.value)}
                                      disabled={disabled || submitted}
                                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                      placeholder={
                                        part.fillType === 'punctuation' ? 'Rewrite with punctuation…' :
                                          part.fillType === 'sentence_change' ? 'Write the changed sentence…' :
                                            part.fillType === 'tag_question' ? 'Write the tag…' :
                                              'Your answer…'
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── COMPREHENSION ── */}
                        {part.subType === 'comprehension' && (
                          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 mt-4">
                            {/* Left: Passage / Stem */}
                            <div className="space-y-4">
                              <div className="sticky top-4">
                                <div className="p-6 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl shadow-sm">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Passage</span>
                                  </div>
                                  <div className="text-base md:text-lg leading-relaxed text-foreground/90 font-medium max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/10">
                                    <UniversalMathJax dynamic>{part.stemPassage}</UniversalMathJax>
                                  </div>
                                  {part.stemImage && (
                                    <div className="mt-6">
                                      <ZoomableImage src={part.stemImage} alt="Comprehension Image" className="rounded-2xl border border-border bg-card p-1 shadow-md hover:shadow-lg transition-shadow" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Interaction */}
                            <div className="space-y-6">
                              {/* Q&A mode */}
                              {(!part.answerType || part.answerType === 'qa') && (
                                <div className="space-y-6">
                                  {part.requiredCount && (
                                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
                                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                                        Answer any {part.requiredCount} of {(part.questions || []).length} questions
                                      </p>
                                    </div>
                                  )}
                                  {(part.questions || []).map((q: string, qi: number) => (
                                    <div key={qi} className="group p-5 bg-white/30 dark:bg-gray-800/20 border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-300">
                                      <div className="flex items-start gap-3 mb-4">
                                        <span className="shrink-0 w-7 h-7 bg-primary/10 text-primary flex items-center justify-center rounded-xl text-xs font-black">{qi + 1}</span>
                                        <p className="text-sm md:text-base font-bold text-foreground/90 pt-0.5 leading-snug"><UniversalMathJax dynamic>{q}</UniversalMathJax></p>
                                      </div>
                                      <DebouncedTextarea
                                        value={getAns(qi) as string}
                                        onChange={(val) => setAns(qi, val)}
                                        disabled={!!(disabled || submitted)}
                                        rows={3}
                                        placeholder="Formulate your response here…"
                                        className="w-full bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/5 transition-all rounded-2xl py-3 px-4 text-sm md:text-base"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Stem MCQ mode */}
                              {part.answerType === 'stem_mcq' && (
                                <div className="space-y-6">
                                  {(part.stemQuestions || []).map((sq: any, sqi: number) => {
                                    const chosen = getAns(sqi);
                                    return (
                                      <div key={sqi} className="p-5 bg-white/30 dark:bg-gray-800/20 border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-300">
                                        <div className="flex items-start gap-3 mb-4">
                                          <span className="shrink-0 w-7 h-7 bg-indigo-500/10 text-indigo-500 flex items-center justify-center rounded-xl text-xs font-black">{sqi + 1}</span>
                                          <p className="text-sm md:text-base font-bold text-foreground/90 pt-0.5"><UniversalMathJax dynamic>{sq.question}</UniversalMathJax></p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                          {(sq.options || []).map((opt: string, oi: number) => (
                                            <button
                                              key={oi}
                                              type="button"
                                              disabled={disabled || submitted}
                                              onClick={() => setAns(sqi, String(oi))}
                                              className={`flex items-center gap-3 p-3 rounded-2xl border text-sm text-left transition-all duration-300 group/opt ${String(chosen) === String(oi)
                                                ? 'border-primary bg-primary shadow-lg shadow-primary/20 text-primary-foreground scale-[1.02] z-10'
                                                : 'border-border/50 bg-background/50 text-foreground/70 hover:border-primary/40 hover:bg-accent/50'}`}
                                            >
                                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${String(chosen) === String(oi) ? 'bg-white/20 text-white shadow-inner' : 'bg-muted text-muted-foreground'}`}>
                                                {String.fromCharCode(65 + oi)}
                                              </span>
                                              <span className="flex-1 font-medium">{opt}</span>
                                              {String(chosen) === String(oi) && <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── TABLE ── */}
                        {part.subType === 'table' && (
                          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-amber-200">
                            <table className="w-full border-separate border-spacing-0 rounded-2xl overflow-hidden border border-border bg-white/50 dark:bg-gray-900/50">
                              <thead>
                                <tr>
                                  {(part.tableHeaders || []).map((h: string, hi: number) => (
                                    <th key={hi} className="border-b border-r last:border-r-0 border-border p-4 bg-amber-500/10 font-bold text-xs uppercase tracking-widest text-amber-800 dark:text-amber-300 text-left">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(part.tableRows || []).map((row: string[], ri: number) => (
                                  <tr key={ri} className="group hover:bg-amber-500/5 transition-colors">
                                    {(part.tableHeaders || []).map((_: string, ci: number) => {
                                      const isBlank = !row[ci] || row[ci] === '___';
                                      return (
                                        <td key={ci} className="border-b border-r last:border-r-0 border-border/50 p-3">
                                          {isBlank ? (
                                            <input
                                              type="text"
                                              value={getAns(`${ri}_${ci}`) as string}
                                              onChange={(e) => setAns(`${ri}_${ci}`, e.target.value)}
                                              disabled={disabled || submitted}
                                              className="w-full bg-white dark:bg-gray-800 border-b-2 border-amber-400 focus:border-primary focus:bg-amber-50 dark:focus:bg-amber-900/10 transition-all focus:outline-none px-2 py-1.5 text-sm font-medium rounded-t-lg"
                                              placeholder="…"
                                            />
                                          ) : (
                                            <span className="text-sm font-medium text-foreground/80 px-2 py-1.5 inline-block"><UniversalMathJax inline dynamic>{row[ci]}</UniversalMathJax></span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ── MATCHING & REARRANGING ── */}
                        {(part.subType === 'matching' || part.subType === 'mtf') && (
                          <div className="mt-4">
                            <MTFGrid
                              question={part}
                              userAnswer={Object.keys(userAnswer || {}).filter(k => k.startsWith(ansKey(''))).reduce((acc: any, k) => {
                                const subId = k.replace(ansKey(''), '');
                                acc[subId] = userAnswer[k];
                                return acc;
                              }, {})}
                              showResult={showResult}
                              disabled={!!disabled}
                              onSelect={(l, r) => setAns(l, r)}
                            />
                          </div>
                        )}

                        {part.subType === 'rearranging' && (
                          <div className="space-y-6 mt-4">
                            <div className="p-6 bg-gray-50/50 dark:bg-gray-800/10 border border-border rounded-3xl shadow-inner">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Scrambled Elements</span>
                                <span className="text-[10px] font-bold text-primary/60">Tap to select in correct order</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(part.items || []).map((item: string, iIdx: number) => {
                                  const label = String.fromCharCode(65 + iIdx);
                                  const currentOrder: string[] = (getAns('order') as string || "").split(',').filter(Boolean);
                                  const isSelected = currentOrder.includes(label);
                                  return (
                                    <button
                                      key={iIdx}
                                      type="button"
                                      disabled={disabled || submitted || isSelected}
                                      onClick={() => {
                                        const newOrder = [...currentOrder, label].join(',');
                                        setAns('order', newOrder);
                                      }}
                                      className={cn(
                                        "px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold flex items-center gap-2",
                                        isSelected ? "bg-muted border-transparent text-muted-foreground/50 opacity-50 grayscale" : "bg-white dark:bg-gray-800 border-border hover:border-primary hover:shadow-lg hover:-translate-y-0.5"
                                      )}
                                    >
                                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black">{label}</span>
                                      <UniversalMathJax inline dynamic>{item}</UniversalMathJax>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Selection Preview */}
                            <div className="p-6 bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-3xl relative overflow-hidden group">
                              <div className="absolute top-2 right-4 text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] pointer-events-none group-hover:text-primary/50 transition-colors">Your Sequence</div>
                              <div className="flex flex-wrap gap-3 items-center min-h-[50px]">
                                {(() => {
                                  const currentOrder = (getAns('order') as string || "").split(',').filter(Boolean);
                                  if (currentOrder.length === 0) return <div className="text-muted-foreground/40 text-sm font-medium italic">No items selected yet…</div>;
                                  return currentOrder.map((label, oIdx) => (
                                    <React.Fragment key={label}>
                                      <div className="relative group/tag">
                                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/20 flex items-center gap-2 group-hover/tag:scale-105 transition-transform">
                                          <span className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center text-[8px] font-black">{label}</span>
                                          <span>{part.items[label.charCodeAt(0) - 65]}</span>
                                          {!disabled && !submitted && (
                                            <button
                                              onClick={() => {
                                                const newOrder = currentOrder.filter(l => l !== label).join(',');
                                                setAns('order', newOrder);
                                              }}
                                              className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {oIdx < currentOrder.length - 1 && <div className="w-6 h-px bg-primary/20"></div>}
                                    </React.Fragment>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                        {/* ── TRUE / FALSE ── */}
                        {part.subType === 'true_false' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {(part.statements || []).map((stmt: string, sIdx: number) => {
                              const chosen = getAns(sIdx);
                              return (
                                <div key={sIdx} className="p-5 bg-white/30 dark:bg-gray-800/20 border border-border/50 rounded-3xl group hover:border-primary/30 transition-all duration-300">
                                  <div className="flex items-start gap-3 mb-4">
                                    <span className="shrink-0 w-7 h-7 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl text-xs font-black">{sIdx + 1}</span>
                                    <p className="text-sm md:text-base font-bold text-foreground/90 pt-0.5 leading-snug"><UniversalMathJax dynamic>{stmt}</UniversalMathJax></p>
                                  </div>
                                  <div className="flex gap-2">
                                    {['True', 'False'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        disabled={disabled || submitted}
                                        onClick={() => setAns(sIdx, option)}
                                        className={cn(
                                          "flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300",
                                          chosen === option
                                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "bg-background/50 border-border/50 text-foreground/60 hover:border-primary/40"
                                        )}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── LABEL DIAGRAM ── */}
                        {part.subType === 'label_diagram' && (
                          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 mt-4">
                            <div className="flex justify-center">
                              <div className="relative inline-block group">
                                {part.imageUrl ? (
                                  <div className="relative border-2 border-primary/20 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-card">
                                    <img src={part.imageUrl} alt="Diagram" className="max-h-[60vh] object-contain" />
                                    {/* Overlay markers */}
                                    <div className="absolute inset-0">
                                      {(part.labels || []).map((l: any, i: number) => (
                                        <div
                                          key={i}
                                          className="absolute w-8 h-8 -ml-4 -mt-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-lg animate-in zoom-in duration-300"
                                          style={{ top: `${l.y}%`, left: `${l.x}%` }}
                                        >
                                          {i + 1}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full aspect-video bg-muted rounded-3xl flex items-center justify-center text-muted-foreground/40 italic">Diagram Image Missing</div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                              {(part.labels || []).map((_: any, i: number) => (
                                <div key={i} className="p-4 bg-white/30 dark:bg-gray-800/20 border border-border/50 rounded-3xl flex items-center gap-4 group hover:border-primary/30 transition-all">
                                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={getAns(i) as string}
                                      onChange={(e) => setAns(i, e.target.value)}
                                      disabled={disabled || submitted}
                                      placeholder="Identify label…"
                                      className="w-full bg-transparent border-b border-border/50 focus:border-primary transition-all focus:outline-none py-1 text-sm font-bold"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── PART SOLUTION / EXPLANATION ── */}
                        {submitted && (part.modelAnswer || part.explanation) && (
                          <div className="mt-4 pt-4 border-t border-amber-200/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                            {part.modelAnswer && (
                              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Model Answer / Key</div>
                                <div className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium">
                                  <UniversalMathJax dynamic>{part.modelAnswer}</UniversalMathJax>
                                </div>
                              </div>
                            )}
                            {part.explanation && (
                              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Teacher's Explanation</div>
                                <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed italic">
                                  <UniversalMathJax dynamic>{part.explanation}</UniversalMathJax>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* ── GLOBAL QUESTION SOLUTION / EXPLANATION ── */}
          {submitted && question.explanation && (
            <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-100/50 dark:border-indigo-900/30 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                <div className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-[0.2em]">Overall Teacher Note & Solution</div>
              </div>
              <div className="text-base text-indigo-900 dark:text-indigo-100 leading-relaxed font-medium">
                <UniversalMathJax dynamic>{question.explanation}</UniversalMathJax>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="mt-10 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-5 uppercase tracking-widest font-black">
            <div className="opacity-40">Q-REF: {question.id.slice(-8)}</div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && <span className="text-primary flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" /> Synchronizing...</span>}
              {saveStatus === 'saved' && <span className="text-emerald-500">Cloud Sync Verified</span>}
              {saveStatus === 'error' && <span className="text-rose-500">Sync Offline (Local Only)</span>}
            </div>
          </div>

        </CardContent>
      </Card>
    </MathJaxContext >
  );
}

export default memo(QuestionCard);
