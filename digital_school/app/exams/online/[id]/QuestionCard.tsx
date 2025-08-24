"use client";
import React, { useRef, useState, useMemo, useCallback, memo } from "react";
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

// Memoized MCQ option component for better performance
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
  const showAsCorrect = showResult && isCorrect;
  const showAsWrong = showResult && isSelected && !isCorrect;
  const faded = showResult && !isCorrect && !isSelected;

  // Memoized styling for better performance
  const buttonStyles = useMemo(() => {
    const base = "w-full justify-start text-sm md:text-base lg:text-lg py-3 px-4 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 h-auto min-h-[60px] py-4";
    
    if (showResult) {
      if (isCorrect && !isSelected && !userAnswer) {
        return base + "bg-blue-50 border-blue-400 text-blue-700";
      } else if (isCorrect) {
        return base + "bg-green-50 border-green-400 text-green-700 animate-pulse";
      } else if (isSelected && !isCorrect) {
        return base + "bg-pink-50 border-pink-400 text-pink-700 animate-shake";
      } else {
        return base + "bg-gray-100 border-gray-200 text-gray-400 opacity-60";
      }
    } else {
      if (isSelected) {
        return base + "bg-gradient-to-r from-purple-500 to-blue-400 border-purple-600 text-black shadow-lg scale-105 font-semibold";
      }
      return base + "bg-white/80 hover:bg-purple-100 border-purple-200 text-purple-900 shadow-sm";
    }
  }, [showResult, isCorrect, isSelected, userAnswer]);

  const icon = useMemo(() => {
    if (showResult) {
      if (isCorrect) {
        return <span className="ml-2 text-green-500 font-bold flex-shrink-0">✓</span>;
      } else if (isSelected && !isCorrect) {
        return <span className="ml-2 text-pink-500 font-bold flex-shrink-0">✗</span>;
      }
    }
    return null;
  }, [showResult, isCorrect, isSelected]);

  return (
    <Button
      variant="ghost"
      className={buttonStyles}
      onClick={() => onSelect(label)}
      disabled={disabled || submitted || !!userAnswer}
    >
      <span className={`font-bold flex-shrink-0 mt-1 mr-3 ${isSelected ? 'text-black font-extrabold' : 'text-purple-400'}`}>
        {String.fromCharCode(0x0995 + index)}
      </span>
      <div className={`flex-1 break-words overflow-visible text-left whitespace-normal ${isSelected ? 'font-semibold' : ''}`}>
        <MathJax dynamic inline>{label || ""}</MathJax>
      </div>
      {icon}
    </Button>
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

  if (!question) return <Card className="p-4"><CardContent>No question found.</CardContent></Card>;

  // Normalize fields
  const text = question.text || question.questionText || "(No text)";
  const type = (question.type || "").toLowerCase();
  const subQuestions = question.subQuestions || question.sub_questions || [];

  // Memoized MCQ change handler for better performance
  const handleMCQChange = useCallback(async (value: string) => {
    if (disabled) return;
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);
    
    // Immediately save to API with error handling
    try {
      await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch (e) {
      console.error("Autosave failed", e);
      // Continue with local state even if API save fails
    }
  }, [disabled, answers, question.id, setAnswers, exam.id]);

  // Memoized question type info for better performance
  const questionTypeInfo = useMemo(() => {
    const questionType = (question.type || "").toLowerCase();
    const allQuestions = exam.questions || [];
    const typeQuestions = allQuestions.filter((q: any) => (q.type || "").toLowerCase() === questionType);
    const typeIndex = typeQuestions.findIndex((q: any) => q.id === question.id) + 1;
    const typeCount = typeQuestions.length;
    const typeLabel = questionType.toUpperCase();
    return { typeLabel, typeIndex, typeCount };
  }, [question, exam.questions]);

  // Memoized mark question handler
  const handleMarkQuestion = useCallback(() => {
    if (markQuestion) {
      markQuestion(question.id, !navigation.marked[question.id]);
    } else {
      // Fallback to old method
      const newMarked = { ...navigation.marked };
      if (newMarked[question.id]) {
        delete newMarked[question.id];
      } else {
        newMarked[question.id] = true;
      }
      setNavigation({ ...navigation, marked: newMarked });
    }
  }, [question.id, navigation.marked, markQuestion, setNavigation, navigation]);

  if (!["mcq", "cq", "sq", "numeric"].includes(type)) {
    console.warn("Unsupported question type:", type, question);
    return <Card className="p-4"><CardContent>Unsupported question type: {type}</CardContent></Card>;
  }

  const correctAnswer = question.correct;
  const userAnswer = answers[question.id];
  const showResult = submitted && result;

  // Handle image capture with Appwrite upload
  const handleImageCapture = useCallback(async (file: File) => {
    try {
      // Show loading state
      const tempImageData = {
        file: file,
        preview: URL.createObjectURL(file),
        timestamp: new Date().toISOString(),
        questionId: question.id,
        questionText: question.text || question.questionText || "Unknown Question",
        isUploading: true
      };
      
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
      let errorMessage = 'ছবি আপলোড করতে সমস্যা হয়েছে।';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to upload image')) {
          errorMessage = 'ছবি আপলোড করতে ব্যর্থ। নেটওয়ার্ক সংযোগ পরীক্ষা করুন।';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'অননুমোদিত। আবার লগইন করুন।';
        } else if (error.message.includes('File must be an image')) {
          errorMessage = 'শুধুমাত্র ছবি ফাইল আপলোড করা যাবে।';
        } else if (error.message.includes('File size must be less than 10MB')) {
          errorMessage = 'ফাইল সাইজ 10MB এর কম হতে হবে।';
        } else {
          errorMessage = `ত্রুটি: ${error.message}`;
        }
      }
      
      alert(errorMessage + '\n\nআবার চেষ্টা করুন।');
    }
  }, [question.id, question.text, question.questionText, question.type, answers, setAnswers, exam]);

  // Memoized correct answer detection
  const correctAnswerInfo = useMemo(() => {
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
    
    return { correctLabel, isSelected, isCorrect };
  }, [question.correct, question.options, userAnswer]);

  const showEarnedMark = showResult && isMCQOnly;
  const earnedMark = showEarnedMark ? (correctAnswerInfo.isCorrect ? Number(question.marks) || 1 : 0) : undefined;

  // Render sub-questions for CQ type
  const renderSubQuestions = () => {
    if (subQuestions.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-semibold text-gray-700">Sub-questions:</h4>
        {subQuestions.map((subQ: any, idx: number) => (
          <div key={idx} className="pl-4 border-l-2 border-purple-200">
            <div className="text-sm text-gray-600 mb-2">
              {idx + 1}. {subQ.text || subQ.question || subQ}
            </div>
            <textarea
              value={answers[`${question.id}_sub_${idx}`] || ""}
              onChange={(e) => setAnswers({ 
                ...answers, 
                [`${question.id}_sub_${idx}`]: e.target.value 
              })}
              disabled={disabled || submitted}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Write your answer here..."
            />
          </div>
        ))}
      </div>
    );
  };

  // Render image upload section
  const renderImageUpload = (questionType: string) => {
    if (submitted || disabled) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageCapture(file);
          }}
          className="hidden"
        />
        
        {answers[question.id + '_images'] && answers[question.id + '_images'].length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Attached Images:</label>
            <div className="grid grid-cols-2 gap-2">
              {answers[question.id + '_images'].map((img: any, idx: number) => (
                <div key={idx} className="relative">
                  {img.isUploading ? (
                    <div className="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <div className="text-xs text-gray-600">Uploading...</div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={img.appwriteUrl || img.preview}
                      alt={`Answer image ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                      onError={(e) => {
                        // Fallback to preview if Appwrite URL fails
                        const target = e.target as HTMLImageElement;
                        if (img.preview && target.src !== img.preview) {
                          target.src = img.preview;
                        }
                      }}
                    />
                  )}
                  
                  {!submitted && !disabled && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0"
                      onClick={() => {
                        const newImages = answers[question.id + '_images'].filter((_: any, i: number) => i !== idx);
                        setAnswers({ ...answers, [question.id + '_images']: newImages });
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {img.appwriteFileId && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                      ✓ Uploaded
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Card className="p-2 sm:p-6 max-w-lg w-full mx-auto rounded-3xl shadow-2xl bg-gradient-to-br from-purple-100/80 via-blue-50/80 to-pink-100/70 border-0 backdrop-blur-md h-auto">
        <CardContent className="p-0 flex flex-col gap-3 h-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">
              {questionTypeInfo.typeLabel} {questionTypeInfo.typeIndex} of {questionTypeInfo.typeCount}
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
                  onClick={handleMarkQuestion}
                  title={navigation.marked[question.id] ? "Unmark for review" : "Mark for review"}
                >
                  {navigation.marked[question.id] ? "✓ Marked" : "Mark for Review"}
                </Button>
              )}
              {question.marks && (
                <div className="text-xs font-bold text-purple-600 bg-purple-100 rounded px-2 py-0.5 shadow-sm">
                  {question.marks} mark{Number(question.marks) > 1 ? 's' : ''}
                </div>
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
                const isCorrect = label.trim() === correctAnswerInfo.correctLabel.trim();
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
                    disabled={disabled}
                    submitted={submitted}
                    onSelect={handleMCQChange}
                  />
                );
              })}
            </div>
          ) : type === "cq" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                <textarea
                  value={userAnswer || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  disabled={disabled || submitted}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={6}
                  placeholder="Write your answer here..."
                />
              </div>
              
              {/* Render sub-questions for CQ */}
              {renderSubQuestions()}
              
              {/* Image upload for CQ */}
              {renderImageUpload('cq')}
            </div>
          ) : type === "sq" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                <textarea
                  value={userAnswer || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  disabled={disabled || submitted}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Write your answer here..."
                />
              </div>
              
              {/* Image upload for SQ */}
              {renderImageUpload('sq')}
            </div>
          ) : type === "numeric" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                <Input
                  type="number"
                  value={userAnswer || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  disabled={disabled || submitted}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your answer..."
                />
              </div>
            </div>
          ) : null}
          
          {showResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-2">Results:</div>
                <div>Your Answer: {userAnswer || "No answer"}</div>
                <div>Correct Answer: {correctAnswerInfo.correctLabel}</div>
                {earnedMark !== undefined && (
                  <div className={`font-bold ${earnedMark > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Marks: {earnedMark}/{question.marks || 1}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {saveStatus === "saving" && (
            <div className="text-xs text-blue-600 text-center">Saving...</div>
          )}
          {saveStatus === "saved" && (
            <div className="text-xs text-green-600 text-center">Saved!</div>
          )}
          {saveStatus === "error" && (
            <div className="text-xs text-red-600 text-center">Save failed. Will retry when online.</div>
          )}

        </CardContent>
      </Card>
      
      {/* Camera Capture Modal */}
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