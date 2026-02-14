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
    const base = "w-full text-left p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-200 group relative overflow-hidden";

    // Result mode
    if (showResult) {
      if (isCorrect) return `${base} bg-green-50/80 border-green-500 text-green-900 shadow-sm`;
      if (isSelected && !isCorrect) return `${base} bg-red-50/80 border-red-500 text-red-900 shadow-sm`;
      return `${base} bg-gray-50/50 border-gray-100 text-gray-400 opacity-70 grayscale`;
    }

    // Interaction mode
    if (isSelected) return `${base} bg-indigo-50/90 border-indigo-600 shadow-md ring-1 ring-indigo-600 scale-[1.01] z-10`;
    return `${base} bg-white border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md hover:-translate-y-0.5`;
  };

  return (
    <button
      onClick={() => onSelect(label)}
      disabled={disabled || submitted || !!userAnswer}
      className={getStyles()}
    >
      {/* Option Key Circle */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 shadow-sm
        ${showResult && isCorrect ? 'bg-green-600 text-white shadow-green-200' :
          showResult && isSelected && !isCorrect ? 'bg-red-600 text-white shadow-red-200' :
            isSelected ? 'bg-indigo-600 text-white shadow-indigo-200 scale-110' :
              'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-md group-hover:scale-110'}
      `}>
        {String.fromCharCode(65 + index)}
      </div>

      {/* Option Text */}
      <div className="flex-1 pt-1 text-sm md:text-lg leading-relaxed font-medium text-gray-800 dark:text-gray-100">
        <div className="min-w-0">
          <MathJax inline dynamic>
            <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
          </MathJax>
        </div>
        {/* @ts-ignore */}
        {option?.image && (
          <div className="mt-3">
            {/* @ts-ignore */}
            <img src={option.image} alt="Option" className="max-h-40 rounded-lg border bg-white object-contain shadow-sm" />
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

// Multiple Correct Option Component
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
    const base = "w-full text-left p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-200 group relative overflow-hidden";
    if (showResult) {
      if (isCorrect) return `${base} bg-green-50/80 border-green-500 text-green-900 shadow-sm`;
      if (isSelected && !isCorrect) return `${base} bg-red-50/80 border-red-500 text-red-900 shadow-sm`;
      return `${base} bg-gray-50/50 border-gray-100 text-gray-400 opacity-70 grayscale`;
    }
    if (isSelected) return `${base} bg-indigo-50/90 border-indigo-600 shadow-md ring-1 ring-indigo-600 scale-[1.01] z-10`;
    return `${base} bg-white border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md hover:-translate-y-0.5`;
  };

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled || submitted}
      className={getStyles()}
    >
      <div className={`
        flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200
        ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-gray-300'}
        ${showResult && isCorrect ? 'bg-green-600 border-green-600 shadow-green-100' : ''}
        ${showResult && isSelected && !isCorrect ? 'bg-red-600 border-red-600 shadow-red-100' : ''}
      `}>
        {isSelected && <Check className="w-4 h-4" />}
      </div>
      <div className="flex-1 pt-0.5 text-base md:text-lg leading-relaxed font-medium text-gray-800 dark:text-gray-100">
        <MathJax inline dynamic>
          <UniversalMathJax inline dynamic>{cleanupMath(label || "")}</UniversalMathJax>
        </MathJax>
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
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

      {showResult && (
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
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

  if (!question) return <div className="p-8 text-center text-gray-500">Question not found</div>;

  const text = question.text || question.questionText || "(No text)";
  const type = (question.type || "").toLowerCase();
  const subQuestions = question.subQuestions || question.sub_questions || [];

  const handleAnswerChange = useCallback(async (value: any) => {
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

  const arOptionLabels = [
    "Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A",
    "Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A",
    "Assertion (A) is true, but Reason (R) is false",
    "Assertion (A) is false, but Reason (R) is true",
    "Both Assertion (A) and Reason (R) are false"
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
                                  <img
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
                      {!disabled && !submitted && (() => {
                        const singleImage = answers[`${question.id}_image`];
                        const multipleImages = answers[`${question.id}_images`] || [];
                        const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;
                        return allImages.length < 5;
                      })() && (
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onClick={() => setIsUploading && setIsUploading(true)}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) {
                                  setIsUploading && setIsUploading(false);
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

                                setIsUploading && setIsUploading(false);
                                e.target.value = ''; // Reset input
                              }}
                              className="hidden"
                              id={`q-img-${question.id}`}
                            />
                            <label htmlFor={`q-img-${question.id}`} className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                              <Upload className="w-4 h-4" /> Upload Image Answer (Max 5)
                            </label>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {type === "cq" && (
                  <div className="space-y-6">
                    {subQuestions.map((subQ: any, idx: number) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-100 ml-1">
                        <div className="text-sm md:text-base font-medium text-gray-700 mb-2">
                          {idx + 1}. <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.question || subQ || "")}</UniversalMathJax>
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
                                        <img
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
                            {!disabled && !submitted && (() => {
                              const singleImage = answers[`${question.id}_sub_${idx}_image`];
                              const multipleImages = answers[`${question.id}_sub_${idx}_images`] || [];
                              const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;
                              return allImages.length < 5;
                            })() && (
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onClick={() => setIsUploading && setIsUploading(true)}
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length === 0) {
                                        setIsUploading && setIsUploading(false);
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

                                      setIsUploading && setIsUploading(false);
                                      e.target.value = '';
                                    }}
                                    className="hidden"
                                    id={`q-img-${question.id}-${idx}`}
                                  />
                                  <label htmlFor={`q-img-${question.id}-${idx}`} className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 hover:text-indigo-800">
                                    <Upload className="w-3 h-3" /> Upload Image (Max 5)
                                  </label>
                                </div>
                              )}
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
    </MathJaxContext>
  );
} 