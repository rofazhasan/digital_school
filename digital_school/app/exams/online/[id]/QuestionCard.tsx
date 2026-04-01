"use client";

import React, { useState, useMemo, useCallback, memo, useEffect, lazy, Suspense } from "react";
import { MathJaxContext } from "better-react-mathjax";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cleanupMath } from "@/lib/utils";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { Check, Upload, X, Camera as CameraIcon } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Context & Utils
import { useExamContext } from "./ExamContext";
import { toBengaliAlphabets } from '@/utils/numeralConverter';
import { cn } from "@/lib/utils";

// Sub-components
import { ZoomableImage, mathJaxConfig, QuestionImageGallery } from "./question-types/shared";
import { MCQOption, MCOption } from "./question-types/MCQSection";
import { MTFGrid } from "./question-types/MTFSection";
import { DebouncedTextarea, DebouncedInput } from "./question-types/SubjectiveSection";
import { DescriptiveSection } from "./question-types/DescriptiveSection";
import { IntNumericSection } from "./question-types/IntNumericSection";

// Lazy components
const CameraCapture = lazy(() => import("./CameraCapture"));

interface QuestionCardProps {
  disabled?: boolean;
  result?: any;
  submitted?: boolean;
  isMCQOnly?: boolean;
  questionIdx?: number;
  questionOverride?: any;
  hideScore?: boolean;
}

const QuestionCard = memo(({ disabled, result, submitted, isMCQOnly, questionIdx, questionOverride, hideScore }: QuestionCardProps) => {
  const {
    exam,
    answers,
    setAnswers,
    navigation,
    markQuestion,
    setIsUploading,
    fontSize
  } = useExamContext();

  const questions = exam.questions || [];
  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];
  const [cameraTarget, setCameraTarget] = useState<{ qId: string, idx?: number } | null>(null);

  const handleCapture = async (file: File, qId: string, subIdx?: number) => {
    setIsUploading?.(true);
    setCameraTarget(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setAnswers((prev: any) => {
          const key = typeof subIdx === 'number' ? `${qId}_sub_${subIdx}_images` : `${qId}_images`;
          const current = prev[key] || [];
          return {
            ...prev,
            [key]: [...current, data.url]
          };
        });
        toast.success("Photo captured and uploaded successfully");
      }
    } catch (err) {
      console.error('Capture upload error:', err);
      toast.error("Failed to upload captured photo");
    } finally {
      setIsUploading?.(false);
    }
  };

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

  const handleMarkQuestion = useCallback(() => {
    if (!question) return;
    markQuestion(question.id, !navigation.marked[question.id]);
  }, [question?.id, navigation.marked, markQuestion]);

  // Keyboard Shortcuts for MCQ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const type = (question?.type || "").toLowerCase();
      if (disabled || submitted || !question || type !== 'mcq') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      const options = question.options || [];
      let selectedIndex = -1;

      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) selectedIndex = parseInt(key) - 1;
      else if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(key)) selectedIndex = key.charCodeAt(0) - 65;

      if (selectedIndex >= 0 && selectedIndex < options.length) {
        const opt = options[selectedIndex];
        const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
        handleAnswerChange(label);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, submitted, question, handleAnswerChange]);

  if (!question) return <div className="p-8 text-center text-muted-foreground">Question not found</div>;

  const type = (question.type || "").toLowerCase();
  const text = question.text || question.questionText || "(No text)";
  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  const getTextSize = (base: string) => {
    if (fontSize === 'lg') return base === 'text-base' ? 'text-lg' : 'text-xl';
    if (fontSize === 'xl') return base === 'text-base' ? 'text-xl' : 'text-2xl';
    return base;
  };

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="w-full max-w-3xl mx-auto shadow-sm border border-border bg-card rounded-2xl overflow-hidden font-exam-online">
        <CardContent className="p-6 md:p-8">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold tracking-wider text-muted-foreground border-border uppercase">
                {type}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                {question.marks} Point{Number(question.marks) !== 1 && 's'}
              </Badge>
            </div>
            {!submitted && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkQuestion}
                className={`gap-2 text-xs font-medium ${navigation.marked[question.id] ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {navigation.marked[question.id] ? <><Check className="w-3.5 h-3.5" /> Reviewed</> : <>Mark for review</>}
              </Button>
            )}
          </div>

          {/* Question Text */}
          <div className={`prose prose-indigo dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed mb-8 text-left ${getTextSize('text-base md:text-xl')}`}>
            {type === "ar" ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex flex-col gap-2">
                  <Badge className="bg-primary text-primary-foreground w-fit px-2 py-0 h-5 text-[10px] font-bold uppercase">Assertion (A)</Badge>
                  <div className="text-base md:text-lg font-semibold"><UniversalMathJax inline dynamic>{cleanupMath(question.assertion || text || "")}</UniversalMathJax></div>
                </div>
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 flex flex-col gap-2">
                  <Badge className="bg-purple-600 dark:bg-purple-500 text-white w-fit px-2 py-0 h-5 text-[10px] font-bold uppercase">Reason (R)</Badge>
                  <div className="text-base md:text-lg font-semibold"><UniversalMathJax inline dynamic>{cleanupMath(question.reason || "")}</UniversalMathJax></div>
                </div>
              </div>
            ) : (
              <UniversalMathJax inline dynamic>{cleanupMath(text || "")}</UniversalMathJax>
            )}
            {question.image && (
              <div className="mt-4">
                <ZoomableImage src={question.image} alt="Question" className="max-h-64 w-full rounded-2xl border bg-card p-1 shadow-md" />
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="space-y-6">
            {type === "mcq" && (
              <div className="grid grid-cols-1 gap-3">
                {(question.options || []).map((opt: any, i: number) => {
                  const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                  const correctVal = question.correctAnswer || question.correct;
                  const isCorrect = opt.originalIndex !== undefined
                    ? Number(correctVal) === opt.originalIndex
                    : (correctVal === i || String(correctVal) === String(i) || (typeof opt === 'object' && opt.isCorrect));
                  const isSelected = String(userAnswer).trim() === label.trim();
                  return (
                    <MCQOption
                      key={i} index={i} option={opt} isSelected={isSelected} isCorrect={isCorrect}
                      showResult={showResult} userAnswer={userAnswer} disabled={!!disabled}
                      submitted={!!submitted} onSelect={handleAnswerChange} fontSize={fontSize}
                    />
                  );
                })}
              </div>
            )}

            {type === "mc" && (
              <div className="grid grid-cols-1 gap-3">
                {(question.options || []).map((opt: any, i: number) => {
                  const currentSelected = userAnswer?.selectedOptions || [];
                  const isSelected = currentSelected.includes(i);
                  const isCorrect = opt.isCorrect === true;
                  return (
                    <MCOption
                      key={i} index={i} option={opt} isSelected={isSelected} isCorrect={isCorrect}
                      showResult={showResult} disabled={!!disabled} submitted={!!submitted}
                      fontSize={fontSize}
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
                {[
                  "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা",
                  "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়",
                  "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                  "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                  "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                ].map((lbl, i) => {
                  const val = i + 1;
                  const isCorrect = Number(question.correctOption || question.correct) === val;
                  const isSelected = (userAnswer?.selectedOption || userAnswer) === val;
                  return (
                    <MCQOption
                      key={i} index={i} option={lbl} isSelected={isSelected} isCorrect={isCorrect}
                      showResult={showResult} userAnswer={userAnswer} disabled={!!disabled}
                      submitted={!!submitted} onSelect={() => handleAnswerChange({ selectedOption: val })}
                      fontSize={fontSize}
                    />
                  );
                })}
              </div>
            )}

            {type === "mtf" && (
              <MTFGrid
                question={question} userAnswer={userAnswer} showResult={showResult} disabled={!!disabled}
                onSelect={(l, r) => handleAnswerChange({ ...(userAnswer || {}), [l]: r })}
              />
            )}

            {(type === "cq" || type === "sq") && (
              <div className="space-y-6">
                {type === "sq" && (
                  <div className="space-y-4 text-left">
                    <DebouncedTextarea
                      value={userAnswer || ""}
                      onChange={handleAnswerChange}
                      disabled={!!disabled || !!submitted}
                      placeholder="Type your answer here..."
                    />
                    <QuestionImageGallery
                      qId={question.id} answers={answers} setAnswers={setAnswers}
                      disabled={disabled} submitted={submitted} setIsUploading={setIsUploading}
                      onCaptureClick={() => setCameraTarget({ qId: question.id })}
                    />
                  </div>
                )}
                {type === "cq" && (
                  <div className="space-y-6">
                    {(question.subQuestions || question.sub_questions || []).map((subQ: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-left">
                        <div className="text-base font-bold text-foreground mb-4 flex justify-between items-start gap-4">
                          <span>{toBengaliAlphabets(idx)}. <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.question || subQ || "")}</UniversalMathJax></span>
                          {subQ.marks && <Badge variant="secondary" className="shrink-0 text-[10px] font-black uppercase">{subQ.marks} Pt</Badge>}
                        </div>
                        {subQ.image && <div className="mb-4 text-left"><ZoomableImage src={subQ.image} alt="Sub" className="max-h-48 w-full rounded-xl border bg-card p-1" /></div>}
                        <DebouncedInput
                          value={answers[`${question.id}_sub_${idx}`] || ""}
                          onChange={(val) => handleSubAnswerChange(idx, val)}
                          disabled={!!disabled || !!submitted}
                          placeholder="Short answer..."
                        />
                        <div className="mt-4">
                          <QuestionImageGallery
                            qId={question.id} subIdx={idx} answers={answers} setAnswers={setAnswers}
                            disabled={disabled} submitted={submitted} setIsUploading={setIsUploading}
                            onCaptureClick={() => setCameraTarget({ qId: question.id, idx })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {type === "smcq" && (
              <div className="space-y-10 mt-6">
                {(question.subQuestions || []).map((subQ: any, idx: number) => {
                  const subUserAnswer = answers[`${question.id}_sub_${idx}`];
                  return (
                    <div key={idx} className="space-y-6 text-left">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20">{idx + 1}</div>
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className={`font-bold text-foreground/95 leading-relaxed ${getTextSize('text-lg')}`}>
                              <UniversalMathJax inline dynamic>{cleanupMath(subQ.question || subQ.text || "")}</UniversalMathJax>
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-[10px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-lg">{subQ.marks} Pt</Badge>
                          </div>
                          {subQ.image && <div className="mt-2 text-left"><ZoomableImage src={subQ.image} alt="Sub" className="max-h-48 w-full rounded-2xl border bg-card p-1" /></div>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 ml-0 md:ml-12">
                        {(subQ.options || []).map((opt: any, oi: number) => {
                          const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                          const isSelected = String(subUserAnswer).trim() === label.trim();
                          let isCorrect = false;
                          if (showResult) {
                            if (typeof opt === 'object' && opt.isCorrect !== undefined) isCorrect = opt.isCorrect;
                            else if (subQ.correctAnswer !== undefined) {
                              const c = subQ.correctAnswer;
                              isCorrect = (c === oi || String(c) === String(oi) || (typeof c === 'string' && (c === String.fromCharCode(65 + oi) || c === toBengaliAlphabets(oi))));
                            }
                          }
                          return (
                            <MCQOption
                              key={oi} index={oi} option={opt} isSelected={isSelected} isCorrect={isCorrect}
                              showResult={showResult} userAnswer={subUserAnswer} disabled={!!disabled}
                              submitted={!!submitted} onSelect={(val) => handleSubAnswerChange(idx, val)} fontSize={fontSize}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(type === "int" || type === "numeric") && (
              <IntNumericSection
                question={question} userAnswer={userAnswer}
                disabled={!!disabled} submitted={!!submitted} onAnswerChange={handleAnswerChange}
              />
            )}

            {type === "descriptive" && (
              <DescriptiveSection
                question={question} userAnswer={userAnswer}
                answers={answers} setAnswers={setAnswers}
                setIsUploading={setIsUploading}
                onCaptureClick={(target: any) => setCameraTarget(target)}
                disabled={!!disabled} submitted={!!submitted} onAnswerChange={handleAnswerChange}
              />
            )}
          </div>

          {/* Practice Solution Overlay */}
          {showResult && question.explanation && (
            <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl text-left">
              <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-3">Explanation</h4>
              <div className="text-foreground/80 leading-relaxed italic">
                <UniversalMathJax dynamic>{cleanupMath(question.explanation)}</UniversalMathJax>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <Suspense fallback={null}>
        {cameraTarget && (
          <CameraCapture
            onCapture={(file) => handleCapture(file, cameraTarget.qId, cameraTarget.idx)}
            onClose={() => setCameraTarget(null)}
            questionId={cameraTarget.qId}
            examId={exam.id}
          />
        )}
      </Suspense>
    </MathJaxContext>
  );
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard;
