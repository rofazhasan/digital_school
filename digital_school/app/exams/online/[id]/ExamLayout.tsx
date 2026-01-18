"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import Navigator from "./Navigator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle, Menu, X, Clock, HelpCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar pb-2">
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex;
        const isAnswered = !!answers[q.id];
        const isMarked = !!marked[q.id];

        let bgClass = "bg-white border-gray-200 text-gray-500 hover:bg-gray-50";
        if (isCurrent) bgClass = "bg-black text-white border-black ring-2 ring-offset-1 ring-black";
        else if (isMarked) bgClass = "bg-amber-100 text-amber-700 border-amber-200";
        else if (isAnswered) bgClass = "bg-indigo-50 text-indigo-600 border-indigo-200";

        return (
          <button
            key={q.id}
            onClick={() => onNavigate(idx)}
            className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold border transition-all duration-200
                ${bgClass}
             `}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
});

MobileNavigator.displayName = 'MobileNavigator';

export default function ExamLayout() {
  const {
    exam,
    answers, // Use live answers state
    navigation,
    navigateToQuestion,
    saveStatus
  } = useExamContext();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const questions = exam.questions || [];
  const currentQuestion = questions[navigation.current];
  const totalQuestions = questions.length;
  // Use live answers for count
  const answeredCount = Object.keys(answers || {}).filter(id => answers[id] && answers[id] !== "No answer provided").length;

  const handlePrevious = useCallback(() => {
    if (navigation.current > 0) navigateToQuestion(navigation.current - 1);
  }, [navigation.current, navigateToQuestion]);

  const handleNext = useCallback(() => {
    if (navigation.current < totalQuestions - 1) navigateToQuestion(navigation.current + 1);
  }, [navigation.current, totalQuestions, navigateToQuestion]);

  const handleSubmit = useCallback(async () => {
    if (showSubmitConfirm) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/exams/${exam.id}/submit-with-appwrite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answers }), // Use live answers
        });

        if (response.ok) {
          window.location.href = `/exams/results/${exam.id}`;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }
      } catch (error) {
        console.error('Submit error:', error);
        alert(`Submission failed: ${(error as Error).message}. Please try again.`);
      } finally {
        setIsSubmitting(false);
        setShowSubmitConfirm(false);
      }
    } else {
      setShowSubmitConfirm(true);
    }
  }, [showSubmitConfirm, exam.id, answers]);

  const progress = useMemo(() => {
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  }, [answeredCount, totalQuestions]);

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full p-8 md:p-12 shadow-2xl rounded-3xl bg-white border-0">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">{exam.title || exam.name || 'Online Exam'}</h1>
            <p className="text-xl text-gray-500">Ready to start?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <Clock className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Time Limit</h3>
              <p className="text-sm text-gray-500">{exam.duration} Minutes</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <HelpCircle className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Questions</h3>
              <p className="text-sm text-gray-500">{totalQuestions} Total</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Pass Mark</h3>
              <p className="text-sm text-gray-500">Auto-submit on timeout</p>
            </div>
          </div>

          <Button
            onClick={() => setShowInstructions(false)}
            className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            Start Assessment
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return <div className="flex justify-center items-center h-screen text-gray-500">Loading exam...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg">Question Navigator</h2>
                </div>
                <div className="p-4">
                  <Navigator questions={questions} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900 truncate max-w-[200px]">{exam.title || exam.name}</h1>
            </div>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Timer onTimeUp={handleSubmit} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              variant={showSubmitConfirm ? "destructive" : "default"}
              className={`${showSubmitConfirm ? "bg-red-500 hover:bg-red-600" : "bg-black hover:bg-gray-800"} text-white rounded-full px-6 transition-all`}
            >
              {showSubmitConfirm ? "Confirm" : "Submit"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Col: Navigator (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">
            <Navigator questions={questions} />
          </div>
        </aside>

        {/* Center: Question */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="lg:hidden">
            <MobileNavigator
              questions={questions}
              currentIndex={navigation.current}
              onNavigate={navigateToQuestion}
              answers={answers || {}}
              marked={navigation.marked || {}}
            />
          </div>

          <QuestionCard
            questionIdx={navigation.current}
            questionOverride={currentQuestion}
            disabled={isSubmitting}
          />

          {/* Navigation Bottom Bar */}
          <div className="flex items-center justify-between gap-4 py-4 mt-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={navigation.current === 0 || isSubmitting}
              className="rounded-full px-8 border-gray-200 hover:bg-gray-100 hover:text-black"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="text-sm font-medium text-gray-400 hidden sm:block">
              Question {navigation.current + 1} of {totalQuestions}
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={navigation.current === totalQuestions - 1 || isSubmitting}
              className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      {/* Submit Modal Overlay */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Assessment?</h3>
            <p className="text-gray-500 text-sm mb-6">You are about to submit your answers. This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} className="rounded-xl h-12">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 shadow-red-200 shadow-lg">
                Submit Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 