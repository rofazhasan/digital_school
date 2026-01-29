"use client";
import React, { useRef, useState, useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, AlertCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

// Clean MCQ Option Component
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

  // State styles
  const getStyles = () => {
    const base = "w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 group relative overflow-hidden";

    // Result mode
    if (showResult) {
      if (isCorrect) return `${base} bg-green-50/50 border-green-500/30 text-green-900`;
      if (isSelected && !isCorrect) return `${base} bg-red-50/50 border-red-500/30 text-red-900`;
      return `${base} bg-gray-50 border-gray-100 text-gray-400 opacity-60`;
    }

    // Interaction mode
    if (isSelected) return `${base} bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm z-10`;
    return `${base} bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50`;
  };

  return (
    <button
      onClick={() => onSelect(label)}
      disabled={disabled || submitted || !!userAnswer}
      className={getStyles()}
    >
      {/* Option Key Circle */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
        ${showResult && isCorrect ? 'bg-green-500 text-white' :
          showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' :
            isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}
      `}>
        {String.fromCharCode(65 + index)}
      </div>

      {/* Option Text */}
      <div className="flex-1 pt-1.5 text-sm md:text-base leading-relaxed break-words font-medium">
        <MathJax dynamic>{label || ""}</MathJax>
        {/* @ts-ignore */}
        {option?.image && (
          <div className="mt-2">
            {/* @ts-ignore */}
            <img src={option.image} alt="Option" className="max-h-32 rounded border bg-white object-contain" />
          </div>
        )}
      </div>

      {/* Result Icons */}
      {showResult && (
        <div className="absolute right-3 top-4">
          {isCorrect && <Check className="w-5 h-5 text-green-600" />}
          {isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
        </div>
      )}
    </button>
  );
});

MCQOption.displayName = 'MCQOption';

export default function QuestionCard({ disabled, result, submitted, isMCQOnly, questionIdx, questionOverride, hideScore }: QuestionCardProps) {
  const { exam, answers, setAnswers, navigation, setNavigation, saveStatus, markQuestion, setIsUploading } = useExamContext();
  const questions = exam.questions || [];
  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];

  if (!question) return <div className="p-8 text-center text-gray-500">Question not found</div>;

  const text = question.text || question.questionText || "(No text)";
  const type = (question.type || "").toLowerCase();
  const subQuestions = question.subQuestions || question.sub_questions || [];

  const handleMCQChange = useCallback(async (value: string) => {
    if (disabled) return;
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);

    try {
      await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch (e) { console.error("Autosave failed", e); }
  }, [disabled, answers, question.id, setAnswers, exam.id]);

  const handleMarkQuestion = useCallback(() => {
    if (markQuestion) {
      markQuestion(question.id, !navigation.marked[question.id]);
    } else {
      const newMarked = { ...navigation.marked };
      if (newMarked[question.id]) delete newMarked[question.id];
      else newMarked[question.id] = true;
      setNavigation({ ...navigation, marked: newMarked });
    }
  }, [question.id, navigation.marked, markQuestion, setNavigation, navigation]);

  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="w-full max-w-3xl mx-auto shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden">
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
          <div className="prose prose-indigo max-w-none text-gray-800 text-lg md:text-xl font-medium leading-relaxed mb-8">
            <MathJax dynamic>{text || ""}</MathJax>
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
                      onSelect={handleMCQChange}
                    />
                  );
                })}
              </div>
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
                    <div className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      {answers[`${question.id}_image`] ? (
                        <div className="relative group">
                          {/* @ts-ignore */}
                          <img src={answers[`${question.id}_image`]} alt="Answer attachment" className="h-20 w-auto rounded border" />
                          {!disabled && !submitted && (
                            <button
                              onClick={() => {
                                const newAnswers = { ...answers };
                                delete newAnswers[`${question.id}_image`];
                                setAnswers(newAnswers);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        !disabled && !submitted && (
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onClick={() => setIsUploading && setIsUploading(true)} // Bylass proctoring
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setAnswers({ ...answers, [`${question.id}_image`]: data.url });
                                    }
                                  } catch (err) { console.error(err); }
                                }
                              }}
                              className="hidden"
                              id={`q-img-${question.id}`}
                            />
                            <label htmlFor={`q-img-${question.id}`} className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                              <Upload className="w-4 h-4" /> Upload Image Answer
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {type === "cq" && (
                  <div className="space-y-6">
                    {subQuestions.map((subQ: any, idx: number) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-100 ml-1">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {idx + 1}. {subQ.text || subQ.question || subQ}
                          {subQ.image && (
                            <div className="mt-2">
                              <img src={subQ.image} alt="Sub-question" className="max-h-32 rounded border bg-white object-contain" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={answers[`${question.id}_sub_${idx}`] || ""}
                            onChange={(e) => setAnswers({ ...answers, [`${question.id}_sub_${idx}`]: e.target.value })}
                            className="bg-gray-50/50"
                            disabled={disabled || submitted}
                            placeholder="Type answer..."
                          />
                          <div className="flex items-center gap-2">
                            {/* @ts-ignore */}
                            {answers[`${question.id}_sub_${idx}_image`] ? (
                              <div className="relative group">
                                {/* @ts-ignore */}
                                <img src={answers[`${question.id}_sub_${idx}_image`]} alt="Answer attachment" className="h-20 w-auto rounded border" />
                                {!disabled && !submitted && (
                                  <button
                                    onClick={() => {
                                      const newAnswers = { ...answers };
                                      delete newAnswers[`${question.id}_sub_${idx}_image`];
                                      setAnswers(newAnswers);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              !disabled && !submitted && (
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onClick={() => setIsUploading && setIsUploading(true)} // Bypass proctoring
                                    onChange={async (e) => {
                                      if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                          if (res.ok) {
                                            const data = await res.json();
                                            setAnswers({ ...answers, [`${question.id}_sub_${idx}_image`]: data.url });
                                          }
                                        } catch (err) { console.error(err); }
                                      }
                                    }}
                                    className="hidden"
                                    id={`q-img-${question.id}-${idx}`}
                                  />
                                  <label htmlFor={`q-img-${question.id}-${idx}`} className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 hover:text-indigo-800">
                                    <Upload className="w-3 h-3" /> Upload Image
                                  </label>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {type === "numeric" && (
              <Input
                type="number"
                value={userAnswer || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                disabled={disabled || submitted}
                className="w-full max-w-xs text-lg p-6"
                placeholder="Enter number..."
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
    </MathJaxContext>
  );
} 