"use client";
import React, { useRef, useState } from "react";
import { useExamContext } from "./ExamContext";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CameraCapture from "./CameraCapture";
import { Camera, Upload, X } from "lucide-react";

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
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
};

export default function QuestionCard({ disabled, result, submitted, isMCQOnly, questionIdx, questionOverride, hideScore }: QuestionCardProps) {
  const { exam, answers, setAnswers, navigation, setNavigation, saveStatus, isSyncPending } = useExamContext();
  const questions = exam.questions || [];
  const currentIdx = typeof questionIdx === 'number' ? questionIdx : (navigation.current || 0);
  const question = questionOverride || questions[currentIdx];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  if (!question) return <Card className="p-4"><CardContent>No question found.</CardContent></Card>;

  // Normalize fields
  const text = question.text || question.questionText || "(No text)";
  const type = (question.type || "").toLowerCase();

  // MCQ auto-save handler
  const handleMCQChange = async (value: string) => {
    if (disabled) return;
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);
    // Immediately save to API
    try {
      await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch (e) {
      // Optionally handle error
      console.error("Autosave failed", e);
    }
  };

  if (!["mcq", "cq", "sq", "numeric"].includes(type)) {
    console.warn("Unsupported question type:", type, question);
    return <Card className="p-4"><CardContent>Unsupported question type: {type}</CardContent></Card>;
  }

  const correctAnswer = question.correct;
  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  // Handle image capture
  const handleImageCapture = (file: File) => {
    // Store file locally with metadata
    const imageData = {
      file: file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
      questionId: question.id,
      questionText: question.text || question.questionText || "Unknown Question"
    };
    const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
    setAnswers({ ...answers, [question.id + '_images']: [...prev, imageData] });
    setShowCamera(false);
  };

  // For the current question (not per option)
  let correctLabel = "";
  if (typeof question.correct === "number") {
    const correctOpt = question.options[question.correct];
    correctLabel = typeof correctOpt === "object" && correctOpt !== null ? (correctOpt.text || String(correctOpt)) : String(correctOpt);
  } else if (typeof question.correct === "object" && question.correct !== null) {
    correctLabel = question.correct.text || String(question.correct);
  } else {
    correctLabel = String(question.correct);
  }
  const normalize = (s: string) => s.trim().toLowerCase().normalize();
  const isSelected = normalize(String(userAnswer)) === normalize(correctLabel);
  const isCorrect = isSelected;
  const showEarnedMark = showResult && isMCQOnly;
  const earnedMark = showEarnedMark ? (isCorrect ? Number(question.marks) || 1 : 0) : undefined;

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="p-2 sm:p-6 max-w-lg w-full mx-auto rounded-3xl shadow-2xl bg-gradient-to-br from-purple-100/80 via-blue-50/80 to-pink-100/70 border-0 backdrop-blur-md h-auto">
        <CardContent className="p-0 flex flex-col gap-3 h-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">
              {(() => {
                const questionType = (question.type || "").toLowerCase();
                const allQuestions = exam.questions || [];
                const typeQuestions = allQuestions.filter((q: any) => (q.type || "").toLowerCase() === questionType);
                const typeIndex = typeQuestions.findIndex((q: any) => q.id === question.id) + 1;
                const typeCount = typeQuestions.length;
                const typeLabel = questionType.toUpperCase();
                return `${typeLabel} ${typeIndex} of ${typeCount}`;
              })()}
            </div>
            <div className="flex items-center gap-2">
              {!submitted && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    navigation.marked[question.id] 
                      ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    const newMarked = { ...navigation.marked };
                    if (newMarked[question.id]) {
                      delete newMarked[question.id];
                    } else {
                      newMarked[question.id] = true;
                    }
                    setNavigation({ ...navigation, marked: newMarked });
                  }}
                  title={navigation.marked[question.id] ? "Unmark for review" : "Mark for review"}
                >
                  {navigation.marked[question.id] ? "✓ Marked" : "Mark for Review"}
                </Button>
              )}
              {question.marks && (
                <div className="text-xs font-bold text-purple-600 bg-purple-100 rounded px-2 py-0.5 shadow-sm">{question.marks} mark{Number(question.marks) > 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
          <div className="mb-4 font-semibold text-base md:text-lg break-words">
            <MathJax dynamic inline>{text || ""}</MathJax>
          </div>
          <div className="mb-2 text-xs text-gray-400">Type: {type}</div>
          {type === "mcq" ? (
            <div className="flex flex-col gap-3 w-full overflow-visible">
              {(question.options || []).map((opt: any, i: number) => {
                const label = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                // Robust correct answer detection
                let correctLabel = "";
                if (typeof question.correct === "number") {
                  const correctOpt = question.options[question.correct];
                  correctLabel = typeof correctOpt === "object" && correctOpt !== null ? (correctOpt.text || String(correctOpt)) : String(correctOpt);
                } else if (typeof question.correct === "object" && question.correct !== null) {
                  correctLabel = question.correct.text || String(question.correct);
                } else {
                  correctLabel = String(question.correct);
                }
                // Normalize for comparison
                const isCorrect = label.trim() === correctLabel.trim();
                const isSelected = String(userAnswer).trim() === label.trim();
                const showAsCorrect = showResult && isCorrect;
                const showAsWrong = showResult && isSelected && !isCorrect;
                const faded = showResult && !isCorrect && !isSelected;
                // --- NEW: Always show correct answer in green, user's wrong in red, others faded ---
                // Color and animation logic
                const base = "w-full justify-start text-sm md:text-base lg:text-lg py-3 px-4 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 h-auto ";
                let color = "bg-white/80 hover:bg-purple-100 border-purple-200 text-purple-900 shadow-sm";
                let icon = null;
                if (showResult) {
                  if (isCorrect && !isSelected && !userAnswer) {
                    color = "bg-blue-50 border-blue-400 text-blue-700";
                  } else if (isCorrect) {
                    color = "bg-green-50 border-green-400 text-green-700 animate-pulse";
                    icon = <span className="ml-2 text-green-500 font-bold flex-shrink-0">✓</span>;
                  } else if (isSelected && !isCorrect) {
                    color = "bg-pink-50 border-pink-400 text-pink-700 animate-shake";
                    icon = <span className="ml-2 text-pink-500 font-bold flex-shrink-0">✗</span>;
                  } else {
                    color = "bg-gray-100 border-gray-200 text-gray-400 opacity-60";
                  }
                } else {
                  if (isSelected) color = "bg-gradient-to-r from-purple-500 to-blue-400 border-purple-600 text-black shadow-lg scale-105 font-semibold";
                }
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className={base + color + " hover:scale-105 active:scale-95 text-left h-auto min-h-[60px] py-4"}
                    onClick={() => handleMCQChange(label)}
                    disabled={disabled || submitted || !!userAnswer}
                  >
                    <span className={`font-bold flex-shrink-0 mt-1 mr-3 ${isSelected ? 'text-black font-extrabold' : 'text-purple-400'}`}>{String.fromCharCode(0x0995 + i)}</span>
                                          <div className={`flex-1 break-words overflow-visible text-left whitespace-normal ${isSelected ? 'font-semibold' : ''}`}>
                    <MathJax dynamic inline>{label || ""}</MathJax>
                      </div>
                    {icon}
                  </Button>
                );
              })}
              {!submitted && (
                <div className="mt-2 text-xs text-right">
                  {saveStatus === "saving" && <span className="text-blue-500 animate-pulse">Saving...</span>}
                  {saveStatus === "saved" && <span className="text-green-600">Saved ✓</span>}
                  {saveStatus === "error" && <span className="text-red-600">Save failed!</span>}
                  {isSyncPending && <span className="text-yellow-600">Syncing...</span>}
                </div>
              )}
              {showEarnedMark && !hideScore && (
                <div className="mt-2 text-xs text-right">
                  {isCorrect ? (
                    <span className="text-green-600 font-bold">+{question.marks || 1} mark</span>
                  ) : (
                    <span className="text-red-600 font-bold">
                      {exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0 
                        ? `-${((question.marks || 1) * exam.mcqNegativeMarking / 100).toFixed(2)} mark (নেগেটিভ মার্কিং)`
                        : "0 mark"
                      }
                    </span>
                  )}
                </div>
              )}

            </div>
          ) : type === "cq" ? (
            <>
              {Array.isArray(question.subQuestions) && question.subQuestions.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {question.subQuestions.map((sub: any, idx: number) => {
                    // Bengali letters: ক, খ, গ, ঘ, ঙ, চ, ছ, জ, ঝ, ঞ, etc.
                    const bengaliLetters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];
                    const letter = bengaliLetters[idx] || (idx + 1);
                    const marks = sub.marks ? `(${sub.marks})` : '';
                    return (
                      <div key={idx} className="bg-white/70 rounded-lg p-2 shadow flex items-start gap-2">
                        <span className="font-bold text-purple-500">{letter}.</span>
                        <span className="flex-1"><MathJax dynamic inline>{sub.text || sub.question || sub.questionText || String(sub) || ""}</MathJax></span>
                        {marks && <span className="ml-2 text-xs text-gray-500 font-semibold">{marks}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <textarea
                className="w-full border rounded p-2 mb-2 text-base md:text-lg"
                rows={5}
                value={answers[question.id] || ""}
                onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Type your answer here..."
                disabled={disabled}
              />
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-700">হাতের লেখা উত্তর আপলোড করুন:</label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCamera(true)}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    ক্যামেরা দিয়ে ছবি তুলুন
                  </Button>
                  
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    multiple
                    onChange={e => {
                      if (disabled) return;
                      const files = Array.from(e.target.files || []);
                      const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
                      const newImages = files.map(file => ({
                        file: file,
                        preview: URL.createObjectURL(file),
                        timestamp: new Date().toISOString(),
                        questionId: question.id,
                        questionText: question.text || question.questionText || "Unknown Question"
                      }));
                      setAnswers({ ...answers, [question.id + '_images']: [...prev, ...newImages] });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={disabled}
                    className="flex-1"
                  />
                </div>
                
                {Array.isArray(answers[question.id + '_images']) && answers[question.id + '_images'].length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">আপলোড করা ছবি ({answers[question.id + '_images'].length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {answers[question.id + '_images'].map((imageData: any, idx: number) => (
                        <div key={imageData.preview + idx} className="relative group">
                          <img
                            src={imageData.preview}
                            alt={`Answer Upload Preview ${idx + 1}`}
                            className="max-w-xs max-h-40 border rounded-lg shadow-sm"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow group-hover:bg-red-100"
                            onClick={() => {
                              const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
                              setAnswers({ ...answers, [question.id + '_images']: prev.filter((img: any) => img.preview !== imageData.preview) });
                            }}
                            disabled={disabled}
                            title="ছবি মুছুন"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : type === "sq" ? (
            <>
              <Input
                type="text"
                className="w-full text-base md:text-lg mb-4"
                value={answers[question.id] || ""}
                onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Short answer..."
                disabled={disabled}
              />
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-gray-700">হাতের লেখা উত্তর আপলোড করুন:</label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCamera(true)}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    ক্যামেরা দিয়ে ছবি তুলুন
                  </Button>
                  
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    multiple
                    onChange={e => {
                      if (disabled) return;
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        // Store file locally with metadata (same as camera capture)
                        const imageData = {
                          file: file,
                          preview: URL.createObjectURL(file),
                          timestamp: new Date().toISOString(),
                          questionId: question.id,
                          questionText: question.text || question.questionText || "Unknown Question"
                        };
                        const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
                        setAnswers({ ...answers, [question.id + '_images']: [...prev, imageData] });
                      }
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={disabled}
                    className="flex-1"
                  />
                </div>
                
                {Array.isArray(answers[question.id + '_images']) && answers[question.id + '_images'].length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">আপলোড করা ছবি:</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {answers[question.id + '_images'].map((imgData: any, idx: number) => {
                        // Handle both old format (string URLs) and new format (image data objects)
                        const imgSrc = typeof imgData === 'string' ? imgData : imgData.preview;
                        const imgKey = typeof imgData === 'string' ? imgData : imgData.timestamp;
                        
                        return (
                          <div key={imgKey} className="relative group">
                            <img
                              src={imgSrc}
                              alt={`Answer Upload Preview ${idx + 1}`}
                              className="max-w-xs max-h-40 border rounded-lg shadow-sm"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow group-hover:bg-red-100"
                              onClick={() => {
                                const prev = Array.isArray(answers[question.id + '_images']) ? answers[question.id + '_images'] : [];
                                setAnswers({ 
                                  ...answers, 
                                  [question.id + '_images']: prev.filter((item: any) => {
                                    const itemKey = typeof item === 'string' ? item : item.timestamp;
                                    return itemKey !== imgKey;
                                  })
                                });
                              }}
                              disabled={disabled}
                              title="ছবি মুছুন"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : type === "numeric" ? (
            <Input
              type="number"
              className="w-full text-base md:text-lg"
              value={answers[question.id] || ""}
              onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder="Enter a number..."
              disabled={disabled}
            />
          ) : null}
        </CardContent>
      </Card>
      
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
          questionId={question.id}
          examId={exam.id}
        />
      )}
    </MathJaxContext>
  );
} 