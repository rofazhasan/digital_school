"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import Navigator from "./Navigator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle } from "lucide-react";

// Mobile-optimized navigation component
const MobileNavigator = memo(({ 
  questions, 
  currentIndex, 
  onNavigate, 
  answers, 
  marked 
}: {
  questions: any[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  answers: any;
  marked: any;
}) => {
  const [showFullNav, setShowFullNav] = useState(false);

  const visibleQuestions = useMemo(() => {
    if (showFullNav) return questions;
    
    // Show current question and 2 on each side
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(questions.length, currentIndex + 3);
    return questions.slice(start, end);
  }, [questions, currentIndex, showFullNav]);

  const getQuestionStatus = useCallback((question: any, index: number) => {
    if (index === currentIndex) return 'current';
    if (answers[question.id]) return 'answered';
    if (marked[question.id]) return 'marked';
    return 'unanswered';
  }, [currentIndex, answers, marked]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'current': return 'bg-black text-white';
      case 'answered': return 'bg-green-500 text-white';
      case 'marked': return 'bg-purple-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  }, []);

  if (questions.length === 0) return null;

  return (
    <Card className="md:hidden p-3 mb-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-800">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullNav(!showFullNav)}
          className="text-xs px-2 py-1"
        >
          {showFullNav ? 'Show Less' : 'Show All'}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {visibleQuestions.map((question, idx) => {
          const globalIndex = questions.findIndex(q => q.id === question.id);
          const status = getQuestionStatus(question, globalIndex);
          const color = getStatusColor(status);
          
          return (
            <button
              key={question.id}
              onClick={() => onNavigate(globalIndex)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${color}`}
              title={`Question ${globalIndex + 1} - ${status}`}
            >
              {globalIndex + 1}
            </button>
          );
        })}
      </div>
      
      {!showFullNav && currentIndex > 2 && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(0)}
            className="text-xs text-gray-600"
          >
            ← Go to start
          </Button>
        </div>
      )}
      
      {!showFullNav && currentIndex < questions.length - 3 && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(questions.length - 1)}
            className="text-xs text-gray-600"
          >
            Go to end →
          </Button>
        </div>
      )}
    </Card>
  );
});

MobileNavigator.displayName = 'MobileNavigator';

export default function ExamLayout() {
  const { 
    exam, 
    navigation, 
    navigateToQuestion, 
    saveStatus, 
    isSyncPending, 
    pendingSaves,
    lastSuccessfulSave 
  } = useExamContext();
  
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = exam.questions || [];
  const currentQuestion = questions[navigation.current];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(exam.answers || {}).filter(id => exam.answers[id]).length;

  // Memoized navigation handlers for better performance
  const handlePrevious = useCallback(() => {
    if (navigation.current > 0) {
      navigateToQuestion(navigation.current - 1);
    }
  }, [navigation.current, navigateToQuestion]);

  const handleNext = useCallback(() => {
    if (navigation.current < totalQuestions - 1) {
      navigateToQuestion(navigation.current + 1);
    }
  }, [navigation.current, totalQuestions, navigateToQuestion]);

  const handleSubmit = useCallback(async () => {
    if (showSubmitConfirm) {
      setIsSubmitting(true);
      try {
        // Use the new Appwrite submission endpoint
        const response = await fetch(`/api/exams/${exam.id}/submit-with-appwrite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: exam.answers }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Exam submitted successfully with Appwrite images:', result);
          
          // Redirect to results page
          window.location.href = `/exams/results/${exam.id}`;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }
      } catch (error) {
        console.error('Submit error:', error);
        alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      } finally {
        setIsSubmitting(false);
        setShowSubmitConfirm(false);
      }
    } else {
      setShowSubmitConfirm(true);
    }
  }, [showSubmitConfirm, exam.id, exam.answers]);

  // Memoized progress calculation
  const progress = useMemo(() => {
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  }, [answeredCount, totalQuestions]);

  // Memoized save status indicator
  const SaveStatusIndicator = useCallback(() => {
    if (isSubmitting) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Submitting...
        </div>
      );
    }

    if (pendingSaves && pendingSaves.length > 0) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          {pendingSaves.length} pending save{pendingSaves.length > 1 ? 's' : ''}
        </div>
      );
    }

    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Saving...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Saved
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Save failed
          </div>
        );
      default:
        return null;
    }
  }, [saveStatus, isSubmitting, pendingSaves]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl text-gray-600 mb-4">No questions found</div>
          <div className="text-gray-500">Please check the exam configuration</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Timer and Progress */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl font-bold text-gray-800 mb-2">{exam.title || 'Online Exam'}</h1>
                  <div className="text-sm text-gray-600">
                    Question {navigation.current + 1} of {totalQuestions} • {answeredCount} answered
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <Timer onTimeUp={handleSubmit} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigator */}
        <MobileNavigator
          questions={questions}
          currentIndex={navigation.current}
          onNavigate={navigateToQuestion}
          answers={exam.answers || {}}
          marked={navigation.marked || {}}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <QuestionCard
              questionIdx={navigation.current}
              questionOverride={currentQuestion}
              disabled={isSubmitting}
            />
            
            {/* Save Status */}
            <div className="mt-4 text-center">
              <SaveStatusIndicator />
            </div>
          </div>

          {/* Desktop Navigator */}
          <div className="lg:col-span-1">
            <Navigator questions={questions} />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrevious}
                disabled={navigation.current === 0 || isSubmitting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="text-sm text-gray-600 px-3">
                {navigation.current + 1} / {totalQuestions}
              </div>
              
              <Button
                onClick={handleNext}
                disabled={navigation.current === totalQuestions - 1 || isSubmitting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {navigation.current === totalQuestions - 1 && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {showSubmitConfirm ? 'Confirm Submit' : 'Submit Exam'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to submit your exam? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 