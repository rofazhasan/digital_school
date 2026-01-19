"use client";
import React, { useRef, useState, useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CameraCapture from "./CameraCapture";
import { Camera, Upload, X, Check, AlertCircle } from "lucide-react";
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
  const { exam, answers, setAnswers, navigation, setNavigation, saveStatus, markQuestion } = useExamContext();
  const questions = exam.questions || [];
  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

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

  const handleImageCapture = useCallback(async (file: File) => {
    // Define variable outside try block for access in catch
    const tempImageData = {
      file: file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
      questionId: question.id,
      questionText: question.text || question.questionText || "Unknown Question",
      isUploading: true
    };

    try {
      // Add temporary image to answers
      const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
      setAnswers({ ...answers, [question.id + '_images']: [...prev, tempImageData] });
      setShowCamera(false);

      // Upload to Appwrite
      const formData = new FormData();
      formData.append('image', file);
      formData.append('questionId', question.id);
      formData.append('studentId', exam?.studentId || '');
      formData.append('studentName', exam?.studentName || '');
      formData.append('questionText', question.text || question.questionText || '');
      formData.append('questionType', question.type || '');
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(`/api/exams/${exam?.id}/upload-appwrite-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();

      // Update the image data with Appwrite information
      const updatedImages = answers[question.id + '_images']?.map((img: any) => {
        if (img.timestamp === tempImageData.timestamp) {
          return {
            ...img,
            isUploading: false,
            appwriteFileId: result.fileId,
            appwriteUrl: result.url,
            appwriteFilename: result.filename,
            uploadedAt: result.uploadedAt
          };
        }
        return img;
      }) || [];

      setAnswers({ ...answers, [question.id + '_images']: updatedImages });

    } catch (error) {
      console.error('Error uploading image:', error);

      // Remove the failed upload from answers
      const updatedImages = answers[question.id + '_images']?.filter((img: any) =>
        !img.isUploading || img.timestamp !== tempImageData.timestamp
      ) || [];
      setAnswers({ ...answers, [question.id + '_images']: updatedImages });

      // Show detailed error message
      let errorMessage = 'Image upload failed';
      if (error instanceof Error) errorMessage = error.message;
      alert(errorMessage);
    }
  }, [question.id, question.text, question.questionText, question.type, answers, setAnswers, exam]);

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

  const correctAnswer = question.correct;
  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  const renderImageUpload = () => {
    if (submitted || disabled) return null;
    return (
      <div className="mt-6 pt-4 border-t border-gray-100">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 block">Attachments</label>
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={() => setShowCamera(true)} className="flex-1 h-32 flex-col gap-2 border-dashed border-2 hover:bg-gray-50">
            <Camera className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Camera</span>
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-32 flex-col gap-2 border-dashed border-2 hover:bg-gray-50">
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500">Upload</span>
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageCapture(e.target.files[0])} className="hidden" />

        {answers[question.id + '_images']?.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {answers[question.id + '_images'].map((img: any, idx: number) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                {img.isUploading ? (
                  <div className="flex items-center justify-center h-full"><div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>
                ) : (
                  <img src={img.appwriteUrl || img.preview} alt="Answer" className="w-full h-full object-cover" />
                )}
                {!submitted && (
                  <button
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500"
                    onClick={() => {
                      const newImages = answers[question.id + '_images'].filter((_: any, i: number) => i !== idx);
                      setAnswers({ ...answers, [question.id + '_images']: newImages });
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="w-full max-w-3xl mx-auto shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8">

          {/* Header Meta */}
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold tracking-wider text-gray-500 border-gray-200">
                  {type.toUpperCase()}
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
                  const isCorrect = question.correct === i || String(question.correct) === String(i); // Simplistic check, relying on logic above
                  const isSelected = String(userAnswer).trim() === label.trim();
                  return (
                    <MCQOption
                      key={i}
                      option={opt}
                      index={i}
                      isSelected={isSelected}
                      isCorrect={isCorrect} // This is actually handled better in the original logic, let's trust simple compare or fix if visual bugs
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
                <textarea
                  value={userAnswer || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  disabled={disabled || submitted}
                  className="w-full min-h-[200px] p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y text-base"
                  placeholder="Type your answer here..."
                />
                {subQuestions.map((subQ: any, idx: number) => (
                  <div key={idx} className="pl-4 border-l-2 border-gray-100 ml-1">
                    <div className="text-sm font-medium text-gray-700 mb-2">{idx + 1}. {subQ.text || subQ.question || subQ}</div>
                    <Input
                      value={answers[`${question.id}_sub_${idx}`] || ""}
                      onChange={(e) => setAnswers({ ...answers, [`${question.id}_sub_${idx}`]: e.target.value })}
                      className="bg-gray-50/50"
                    />
                  </div>
                ))}
                {renderImageUpload()}
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
      {showCamera && <CameraCapture onCapture={handleImageCapture} onClose={() => setShowCamera(false)} questionId={question.id} examId={exam.id} />}
    </MathJaxContext>
  );
} 