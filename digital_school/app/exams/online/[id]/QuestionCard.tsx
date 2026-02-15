"use client";
import React, { useRef, useState, useMemo, useCallback, memo } from "react";
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
import { ZoomIn } from "lucide-react";

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
        <img src={src} alt={alt} className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white" />
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
  onSelect
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
}) => {
  const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);

  // Premium State styles
  const getStyles = () => {
    const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

    // Result mode
    if (showResult) {
      if (isCorrect) return `${base} bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10`;
      if (isSelected && !isCorrect) return `${base} bg-rose-50/90 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10`;
      return `${base} bg-gray-50/50 border-gray-100/50 text-gray-400 opacity-60 grayscale`;
    }

    // Interaction mode
    if (isSelected) return `${base} bg-blue-50/90 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500 transform scale-[1.01] z-10`;

    return `${base} bg-white/60 dark:bg-gray-900/60 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5`;
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
            isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200 scale-110' :
              'bg-gray-100/80 text-gray-500 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md group-hover:scale-110'}
      `}>
        {String.fromCharCode(65 + index)}
      </div>

      {/* Option Text */}
      <div className="flex-1 pt-1 text-base md:text-lg leading-relaxed font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
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
              className="max-h-48 w-full rounded-lg border border-gray-100 bg-white p-1 shadow-sm group-hover:shadow-md transition-shadow"
            />
          </div>
        )}
      </div>

      {/* Result Icons */}
      {showResult && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-white rounded-full p-1 shadow-sm" />}
          {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-white rounded-full p-1 shadow-sm" />}
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
  onSelect
}: {
  option: any;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  disabled: boolean;
  submitted: boolean;
  onSelect: (index: number) => void;
}) => {
  const label = typeof option === "object" && option !== null ? (option.text || String(option)) : String(option);

  const getStyles = () => {
    const base = "w-full text-left p-4 md:p-5 rounded-2xl border flex items-start gap-4 md:gap-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm";

    if (showResult) {
      if (isCorrect) return `${base} bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10`;
      if (isSelected && !isCorrect) return `${base} bg-rose-50/90 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10`;
      return `${base} bg-gray-50/50 border-gray-100 text-gray-400 opacity-60 grayscale`;
    }

    if (isSelected) return `${base} bg-blue-50/90 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500 transform scale-[1.01] z-10`;

    return `${base} bg-white/60 dark:bg-gray-900/60 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5`;
  };

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled || submitted}
      className={getStyles()}
    >
      <div className={`
        flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300
        ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-110' : 'bg-white border-gray-300 text-transparent group-hover:border-blue-400'}
        ${showResult && isCorrect ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100' : ''}
        ${showResult && isSelected && !isCorrect ? 'bg-rose-600 border-rose-600 text-white shadow-rose-100' : ''}
      `}>
        <Check className={`w-4 h-4 md:w-5 md:h-5 ${isSelected || (showResult && isCorrect) ? 'scale-100' : 'scale-0'} transition-transform duration-200`} />
      </div>
      <div className="flex-1 pt-0.5 text-base md:text-lg leading-relaxed font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        <MathJax inline dynamic>
          <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
        </MathJax>
      </div>

      {/* Result Icons */}
      {showResult && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isCorrect && <Check className="w-6 h-6 text-emerald-600 bg-white rounded-full p-1 shadow-sm" />}
          {isSelected && !isCorrect && <X className="w-6 h-6 text-rose-500 bg-white rounded-full p-1 shadow-sm" />}
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

      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-4 text-left text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Item</th>
              {rightColumn.map((rc: any) => (
                <th key={rc.id} className="p-4 text-center border-b border-gray-100">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-50">
                      {rc.id}
                    </span>
                    <div className="text-[10px] md:text-xs font-medium text-gray-500 max-w-[80px] truncate">
                      <UniversalMathJax inline dynamic>{rc.text}</UniversalMathJax>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leftColumn.map((lc: any) => (
              <tr key={lc.id} className="group hover:bg-indigo-50/20 transition-colors">
                <td className="p-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                      {lc.id}
                    </span>
                    <div className="text-sm md:text-base font-semibold text-gray-800">
                      <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                    </div>
                  </div>
                </td>
                {rightColumn.map((rc: any) => {
                  const isSelected = matches[lc.id] === rc.id;
                  const isCorrect = showResult && correctMatches[lc.id] === rc.id;
                  const isWrongSelection = showResult && isSelected && !isCorrect;
                  const isMissedCorrect = showResult && !isSelected && correctMatches[lc.id] === rc.id;

                  return (
                    <td key={rc.id} className="p-4 text-center border-b border-gray-50">
                      <button
                        onClick={() => onSelect(lc.id, rc.id)}
                        disabled={disabled || showResult}
                        className={`
                          w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                          ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-md' : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}
                          ${showResult && isCorrect ? 'bg-green-600 border-green-600 text-white shadow-green-200' : ''}
                          ${showResult && isWrongSelection ? 'bg-red-600 border-red-600 text-white shadow-red-200' : ''}
                          ${showResult && isMissedCorrect ? 'border-green-500 border-dashed animate-pulse ring-2 ring-green-50' : ''}
                          ${showResult && !isSelected && !isCorrect ? 'opacity-30 grayscale' : ''}
                        `}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {isMissedCorrect && <AlertCircle className="w-4 h-4 text-green-500" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
                    ${isCorrect ? 'bg-green-50 border-green-200' : isWrong ? 'bg-red-50 border-red-200' : currentMatchId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-100'}
                  `}
                  onClick={() => !disabled && !showResult && setActiveLeftId(lc.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="w-6 h-6 rounded bg-black/5 text-gray-600 flex items-center justify-center font-bold text-xs">
                      {lc.id}
                    </span>
                    {currentMatchId && (
                      <Badge variant={isCorrect ? "default" : isWrong ? "destructive" : "secondary"} className={isCorrect ? "bg-green-600" : ""}>
                        Matched: {currentMatchId}
                      </Badge>
                    )}
                  </div>

                  <div className="font-medium text-gray-800 mb-3">
                    <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                  </div>

                  {/* Connected Right Item Preview */}
                  {currentMatchId ? (
                    <div className="p-2 bg-white/50 rounded-lg border border-black/5 text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                      <div className="line-clamp-2 w-full">
                        <UniversalMathJax inline dynamic>{currentMatchText}</UniversalMathJax>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-400 border-t border-dashed border-gray-200 mt-2">
                      Tap to select match
                    </div>
                  )}

                  {/* Correct Answer Display in Result Mode */}
                  {showResult && !isCorrect && (
                    <div className="mt-2 text-xs text-green-600 font-bold bg-green-50 p-2 rounded">
                      Correct: {cAns} - {getRightText(cAns)}
                    </div>
                  )}
                </div>
              </DialogTrigger>

              {!disabled && !showResult && (
                <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto rounded-3xl">
                  <DialogTitle>Select Match for {lc.id}</DialogTitle>
                  <div className="py-2 space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg mb-4 text-sm text-gray-600">
                      <UniversalMathJax inline dynamic>{lc.text}</UniversalMathJax>
                    </div>
                    <div className="h-px bg-gray-100 my-4" />
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
                               ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-100 hover:bg-gray-50'}
                             `}
                        >
                          <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {rc.id}
                          </span>
                          <div className="text-sm font-medium text-gray-700">
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
        <div className="md:hidden bg-blue-50/50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Detailed Results</p>
          <div className="grid grid-cols-1 gap-2">
            {leftColumn.map((lc: any) => {
              const uAns = matches[lc.id];
              const cAns = correctMatches[lc.id];
              const isCorrect = uAns === cAns;
              return (
                <div key={lc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-sm">
                  <span className="font-bold text-gray-500">{lc.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={isCorrect ? 'text-green-600' : 'text-red-500'}>{uAns || '?'}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-green-700 font-bold">{cAns}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showResult && (
        <div className="hidden md:block bg-blue-50/50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Detailed Results</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {leftColumn.map((lc: any) => {
              const uAns = matches[lc.id];
              const cAns = correctMatches[lc.id];
              const isCorrect = uAns === cAns;
              return (
                <div key={lc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-sm">
                  <span className="font-bold text-gray-500">{lc.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={isCorrect ? 'text-green-600' : 'text-red-500'}>{uAns || '?'}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-green-700 font-bold">{cAns}</span>
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

export default function QuestionCard({ disabled, result, submitted, isMCQOnly, questionIdx, questionOverride, hideScore }: QuestionCardProps) {
  const { exam, answers, setAnswers, navigation, setNavigation, saveStatus, markQuestion, setIsUploading } = useExamContext();
  const questions = exam.questions || [];

  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];

  // if (!question) return <div className="p-8 text-center text-gray-500">Question not found</div>;
  // Hook violation fix: Moved check to render time

  const text = question?.text || question?.questionText || "(No text)";
  const type = (question?.type || "").toLowerCase();
  const subQuestions = question?.subQuestions || question?.sub_questions || [];

  const handleAnswerChange = useCallback(async (value: any) => {
    if (disabled || !question) return;
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);

    try {
      await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch (e) { console.error("Autosave failed", e); }
  }, [disabled, answers, question?.id, setAnswers, exam.id]);

  const handleMarkQuestion = useCallback(() => {
    if (!question) return;
    if (markQuestion) {
      markQuestion(question.id, !navigation.marked[question.id]);
    } else {
      const newMarked = { ...navigation.marked };
      if (newMarked[question.id]) delete newMarked[question.id];
      else newMarked[question.id] = true;
      setNavigation({ ...navigation, marked: newMarked });
    }
  }, [question?.id, navigation.marked, markQuestion, setNavigation, navigation]);

  if (!question) return <div className="p-8 text-center text-gray-500">Question not found</div>;

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
      <Card className="w-full max-w-3xl mx-auto shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden font-exam-online">
        <CardContent className="p-6 md:p-8">

          {/* Header Meta */}
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold tracking-wider text-gray-500 border-gray-200">
                  {(type || "").toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-transparent">
                  {question.marks} Point{Number(question.marks) !== 1 && 's'}
                </Badge>
              </div>
            </div>
            {!submitted && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkQuestion}
                className={`gap-2 text-xs font-medium ${navigation.marked[question.id] ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
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
          <div className="prose prose-indigo max-w-none text-gray-800 text-base md:text-xl font-medium leading-relaxed mb-8">
            {type === "ar" ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 pointer-events-none px-2 py-0 h-5 text-[10px] font-bold uppercase">Assertion (A)</Badge>
                  </div>
                  <div className="text-base md:text-lg text-gray-800 leading-relaxed font-semibold">
                    <UniversalMathJax inline dynamic>{cleanupMath(question.assertion || text || "")}</UniversalMathJax>
                  </div>
                </div>
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 pointer-events-none px-2 py-0 h-5 text-[10px] font-bold uppercase">Reason (R)</Badge>
                  </div>
                  <div className="text-base md:text-lg text-gray-800 leading-relaxed font-semibold">
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
                  const isCorrect = question.correct === i || String(question.correct) === String(i);
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
                    <textarea
                      value={userAnswer || ""}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      disabled={disabled || submitted}
                      className="w-full min-h-[200px] p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y text-base"
                      placeholder="Type your answer here..."
                    />
                    <div className="space-y-2">
                      {/* Image Gallery */}
                      {(() => {
                        // Support both old single image and new multiple images format
                        const singleImage = answers[`${question.id}_image`];
                        const multipleImages = answers[`${question.id}_images`] || [];
                        const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                        return allImages.length > 0 ? (
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-2">Uploaded Images ({allImages.length}/5)</div>
                            <div className="flex flex-wrap gap-2">
                              {allImages.map((imgUrl: string, idx: number) => (
                                <div key={idx} className="relative group">
                                  <ZoomableImage
                                    src={imgUrl}
                                    alt={`Answer ${idx + 1}`}
                                    className="h-20 w-20 object-cover rounded border border-gray-300"
                                  />
                                  {!disabled && !submitted && (
                                    <button
                                      onClick={() => {
                                        const newAnswers = { ...answers };
                                        const updatedImages = allImages.filter((_: string, i: number) => i !== idx);
                                        if (updatedImages.length > 0) {
                                          newAnswers[`${question.id}_images`] = updatedImages;
                                        } else {
                                          delete newAnswers[`${question.id}_images`];
                                        }
                                        delete newAnswers[`${question.id}_image`]; // Remove old format
                                        setAnswers(newAnswers);
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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

                      {/* Upload Button - Show if less than 5 images */}
                      {/* Upload Button - Show if less than 5 images */}
                      {!disabled && !submitted && (
                        ((answers[`${question.id}_image`] ? 1 : 0) + (answers[`${question.id}_images`]?.length || 0)) < 5
                      ) ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onClick={() => setIsUploading && setIsUploading(true)}
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
                                    toast.success(`Image ${uploadedUrls.length}/${filesToUpload.length} uploaded!`);
                                  } else {
                                    console.error('Upload failed:', data);
                                    toast.error(`Upload failed: ${data.error || 'Unknown error'}`);
                                  }
                                } catch (err) {
                                  console.error('Upload error:', err);
                                  toast.error('Failed to upload image. Please try again.');
                                }
                              }

                              if (uploadedUrls.length > 0) {
                                const newAnswers = { ...answers };
                                delete newAnswers[`${question.id}_image`]; // Remove old single image format
                                newAnswers[`${question.id}_images`] = [...currentImages, ...uploadedUrls];
                                setAnswers(newAnswers);
                              }

                              setIsUploading?.(false);
                              e.target.value = ''; // Reset input
                            }}
                            className="hidden"
                            id={`q-img-${question.id}`}
                          />
                          <label htmlFor={`q-img-${question.id}`} className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                            <Upload className="w-4 h-4" /> Upload Image Answer (Max 5)
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {type === "cq" && (
                  <div className="space-y-6">
                    {subQuestions.map((subQ: any, idx: number) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-100 ml-1">
                        <div className="text-sm md:text-base font-medium text-gray-700 mb-2 flex justify-between items-start gap-4">
                          <span>
                            {idx + 1}. <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.question || subQ || "")}</UniversalMathJax>
                          </span>
                          {subQ.marks && (
                            <Badge variant="outline" className="shrink-0 text-[10px] sm:text-xs">
                              {subQ.marks} Mark{Number(subQ.marks) !== 1 && 's'}
                            </Badge>
                          )}
                        </div>
                        {subQ.image && (
                          <div className="mt-2">
                            <ZoomableImage src={subQ.image} alt="Sub-question" className="max-h-32 w-full rounded border bg-white object-contain" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Input
                            value={answers[`${question.id}_sub_${idx}`] || ""}
                            onChange={(e) => setAnswers({ ...answers, [`${question.id}_sub_${idx}`]: e.target.value })}
                            className="bg-gray-50/50"
                            disabled={disabled || submitted}
                            placeholder="Type answer..."
                          />
                          <div className="space-y-2">
                            {/* Image Gallery for Sub-question */}
                            {(() => {
                              const singleImage = answers[`${question.id}_sub_${idx}_image`];
                              const multipleImages = answers[`${question.id}_sub_${idx}_images`] || [];
                              const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                              return allImages.length > 0 ? (
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 mb-2">Uploaded Images ({allImages.length}/5)</div>
                                  <div className="flex flex-wrap gap-2">
                                    {allImages.map((imgUrl: string, imgIdx: number) => (
                                      <div key={imgIdx} className="relative group">
                                        <ZoomableImage
                                          src={imgUrl}
                                          alt={`Sub ${idx + 1} Image ${imgIdx + 1}`}
                                          className="h-20 w-20 object-cover rounded border border-gray-300"
                                        />
                                        {!disabled && !submitted && (
                                          <button
                                            onClick={() => {
                                              const newAnswers = { ...answers };
                                              const updatedImages = allImages.filter((_: string, i: number) => i !== imgIdx);
                                              if (updatedImages.length > 0) {
                                                newAnswers[`${question.id}_sub_${idx}_images`] = updatedImages;
                                              } else {
                                                delete newAnswers[`${question.id}_sub_${idx}_images`];
                                              }
                                              delete newAnswers[`${question.id}_sub_${idx}_image`];
                                              setAnswers(newAnswers);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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

                                    if (files.length > remainingSlots) {
                                      toast.warning(`Only uploading ${remainingSlots} image(s). Maximum 5 images per sub-question.`);
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
                                          toast.success(`Image ${uploadedUrls.length}/${filesToUpload.length} uploaded!`);
                                        } else {
                                          console.error('Upload failed:', data);
                                          toast.error(`Upload failed: ${data.error || 'Unknown error'}`);
                                        }
                                      } catch (err) {
                                        console.error('Upload error:', err);
                                        toast.error('Failed to upload image. Please try again.');
                                      }
                                    }

                                    if (uploadedUrls.length > 0) {
                                      const newAnswers = { ...answers };
                                      delete newAnswers[`${question.id}_sub_${idx}_image`];
                                      newAnswers[`${question.id}_sub_${idx}_images`] = [...currentImages, ...uploadedUrls];
                                      setAnswers(newAnswers);
                                    }

                                    setIsUploading?.(false);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                  id={`q-img-${question.id}-${idx}`}
                                />
                                <label htmlFor={`q-img-${question.id}-${idx}`} className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 hover:text-indigo-800">
                                  <Upload className="w-3 h-3" /> Upload Image (Max 5)
                                </label>
                              </div>
                            ) : null}
                          </div>
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
                className="w-full max-w-xs text-lg p-6 border-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Enter integer answer..."
              />
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-8 flex items-center justify-between text-xs text-gray-400 border-t pt-4">
            <div>Question ID: {question.id.slice(-6)}</div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && <span className="text-indigo-500">Running autosave...</span>}
              {saveStatus === 'saved' && <span className="text-green-500">Changes saved</span>}
              {saveStatus === 'error' && <span className="text-red-500">Save failed (working offline)</span>}
            </div>
          </div>

        </CardContent>
      </Card>
    </MathJaxContext >
  );
} 