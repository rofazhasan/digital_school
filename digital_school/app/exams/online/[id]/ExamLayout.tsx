"use client";

import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useExamContext } from "./ExamContext";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import Navigator from "./Navigator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle, Menu, X, Clock, HelpCircle, ShieldAlert, Maximize2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useProctoring } from "@/hooks/useProctoring";
import { toast } from "sonner";

// ... (imports remain)

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

        let bgClass = "bg-card border-border text-muted-foreground hover:bg-muted";
        if (isCurrent) bgClass = "bg-primary text-primary-foreground border-primary ring-2 ring-offset-1 ring-primary";
        else if (isMarked) bgClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100";
        else if (isAnswered) bgClass = "bg-primary/10 text-primary border-primary/20";

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
    saveStatus,
    isUploading // Get from context
  } = useExamContext();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize instructions visibility based on whether exam has started
  const [showInstructions, setShowInstructions] = useState(!exam.startedAt);
  const [isStarting, setIsStarting] = useState(false);

  const questions = exam.questions || [];
  const currentQuestion = questions[navigation.current];
  const totalQuestions = questions.length;
  // Use live answers for count
  const answeredCount = Object.keys(answers || {}).filter(id => answers[id] && answers[id] !== "No answer provided").length;

  // ------------ PROCTORING INTEGRATION ------------
  const [isExamActive, setIsExamActive] = useState(!!exam.startedAt && !showInstructions);
  const [instituteSettings, setInstituteSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
  }, []);

  const instituteName = instituteSettings?.instituteName || "Digital School";
  const instituteLogo = instituteSettings?.logoUrl || "/logo.png";

  const handleSubmit = useCallback(async (forced: boolean = false) => {
    // ... (submit logic remains same)
    if (showSubmitConfirm || forced) {
      setIsSubmitting(true);
      if (forced) {
        toast.error("Exam auto-submitted due to security violations or time limit.");
      }
      try {
        const response = await fetch(`/api/exams/${exam.id}/submit`, {
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

  // Combined Violation Handler
  const onViolation = useCallback((count: number) => {
    // Limit is 3 for switching tabs
    if (count >= 3) {
      handleSubmit(true);
    }
  }, [handleSubmit]);

  // Check if exam has CQ or SQ questions (disable proctoring for these)
  const hasCQorSQ = questions.some((q: any) => {
    const type = (q.type || q.questionType || '').toLowerCase();
    return type === 'cq' || type === 'sq';
  });

  // Browser/Tab Proctoring - DISABLED for exams with CQ/SQ questions
  const { isFullscreen, warnings, enterFullscreen, isTabActive } = useProctoring({
    onViolation,
    maxWarnings: 3,
    isExamActive: isExamActive && !hasCQorSQ, // Disable proctoring if exam has CQ/SQ
    isUploading: isUploading // Pass context state
  });

  // Check initial start state
  useEffect(() => {
    if (exam.startedAt) {
      setIsExamActive(true);
    }
  }, [exam.startedAt]);

  const handleStartExam = async () => {
    try {
      // 1. Enter Fullscreen FIRST
      await enterFullscreen();

      setIsStarting(true);

      // 2. Add ?action=start to the URL
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('action', 'start');

      // 3. Force reload to trigger the server-side start logic
      window.location.href = currentUrl.toString();

    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam. Please try again.");
      setIsStarting(false);
    }
  };

  const handlePrevious = useCallback(() => {
    if (navigation.current > 0) navigateToQuestion(navigation.current - 1);
  }, [navigation.current, navigateToQuestion]);

  const handleNext = useCallback(() => {
    if (navigation.current < totalQuestions - 1) navigateToQuestion(navigation.current + 1);
  }, [navigation.current, totalQuestions, navigateToQuestion]);

  const progress = useMemo(() => {
    return totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  }, [answeredCount, totalQuestions]);

  // --------------- BLOCKING MODAL FOR PROCTORING (Overlay) ---------------
  const isBlocked = isExamActive && (!isFullscreen || !isTabActive);

  if (showInstructions) {
    const mcqQuestions = questions.filter((q: any) => q.type === 'MCQ');
    const cqQuestions = questions.filter((q: any) => q.type === 'CQ');
    const sqQuestions = questions.filter((q: any) => q.type === 'SQ');

    const mcqMarks = mcqQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    const cqMarks = cqQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
    const sqMarks = sqQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);

    // Determine pass mark (default to 33% if not set, or show N/A)
    // Assuming passMarks might be in exam object, otherwise 33% of total
    const passMark = exam.passMarks || Math.ceil((exam.totalMarks || (mcqMarks + cqMarks + sqMarks)) * 0.33);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
        <Card className="max-w-3xl w-full p-6 md:p-10 shadow-2xl rounded-3xl bg-card border-border">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={instituteLogo} alt={instituteName} className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">{exam.title || exam.name || 'অনলাইন পরীক্ষা'}</h1>
            <p className="text-lg text-muted-foreground">আপনি কি পরীক্ষা শুরু করতে প্রস্তুত?</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">সময়</h3>
              <p className="text-lg font-bold text-primary">{exam.duration} মিনিট</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <HelpCircle className="w-6 h-6 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">মোট প্রশ্ন</h3>
              <p className="text-lg font-bold text-primary">{totalQuestions} টি</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">পূর্ণমান</h3>
              <p className="text-lg font-bold text-primary">{exam.totalMarks || (mcqMarks + cqMarks + sqMarks)}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">পাস মার্ক</h3>
              <p className="text-lg font-bold text-primary">{passMark}</p>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="mb-8 border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold mb-3 text-center border-b pb-2">প্রশ্ন বিভাজন (Question Breakdown)</h3>
            <div className="grid grid-cols-3 divide-x text-center text-sm">
              <div className="px-2">
                <div className="font-bold text-primary">MCQ</div>
                <div>{mcqQuestions.length} টি</div>
                <div className="text-xs text-muted-foreground">({mcqMarks} নম্বর)</div>
              </div>
              <div className="px-2">
                <div className="font-bold text-primary">Creative (CQ)</div>
                <div>{cqQuestions.length} টি</div>
                <div className="text-xs text-muted-foreground">({cqMarks} নম্বর)</div>
              </div>
              <div className="px-2">
                <div className="font-bold text-primary">Short (SQ)</div>
                <div>{sqQuestions.length} টি</div>
                <div className="text-xs text-muted-foreground">({sqMarks} নম্বর)</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-8 text-sm text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> নির্দেশাবলি (Instructions):</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>পরীক্ষা শুরু করার পর টাইমার থামানো যাবে না।</li>
              <li>নির্দিষ্ট সময়ের মধ্যে উত্তর জমা না দিলে স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।</li>
              <li>প্রতিটি প্রশ্নের জন্য সঠিক উত্তর নির্বাচন করুন বা লিখুন।</li>
              <li>ইন্টারনেট সংযোগ বিচ্ছিন্ন হলে পুনরায় সংযোগের চেষ্টা করুন, আপনার উত্তর সংরক্ষিত থাকবে।</li>
              {exam.mcqNegativeMarking > 0 && (
                <li className="font-bold text-red-600 dark:text-red-400 mt-2">
                  সতর্কতা: প্রতিটি ভুল উত্তরের জন্য {exam.mcqNegativeMarking}% নম্বর কর্তন করা হবে।
                </li>
              )}
              <li className="font-bold text-red-600 dark:text-red-400 mt-2">সতর্কতা: ফুলস্ক্রিন মোড চালু থাকবে।</li>
            </ul>
          </div>

          <Button
            onClick={handleStartExam}
            disabled={isStarting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isStarting ? "লোডিং..." : "পরীক্ষা শুরু করুন (Enter Fullscreen)"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return <div className="flex justify-center items-center h-screen text-muted-foreground">Loading exam...</div>;

  return (
    <div className={`
      min-h-screen bg-gray-50 flex flex-col font-exam-online
      ${isExamActive && (!isFullscreen || !isTabActive) ? 'select-none' : ''}
    `}>  {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg text-foreground">Question Navigator</h2>
                </div>
                <div className="p-4">
                  <Navigator questions={questions} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center space-x-3">
              <img src={instituteLogo} alt={instituteName} className="h-8 w-auto hidden sm:block object-contain" />
              <div className="hidden sm:block">
                <h1 className="font-bold text-foreground truncate max-w-[200px]">{exam.title || exam.name}</h1>
              </div>
            </div>
          </div>

          {/* Timer: Stacked on mobile, Absolute centered on desktop */}
          <div className="relative mt-2 sm:mt-0 sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 flex justify-center order-last sm:order-none w-full sm:w-auto">
            <Timer onTimeUp={() => handleSubmit(true)} />
          </div>

          <div className="flex items-center gap-3">
            {/* Warnings Indicator */}
            {warnings > 0 && (
              <div className="flex gap-2">
                {warnings > 0 && (
                  <Badge variant="destructive" className="animate-pulse hidden sm:flex gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Sys: {warnings}/3
                  </Badge>
                )}
              </div>
            )}

            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
              </div>
            </div>

            <Button
              onClick={() => handleSubmit(false)}
              variant={showSubmitConfirm ? "destructive" : "default"}
              className={`${showSubmitConfirm ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"} text-primary-foreground rounded-full px-6 transition-all`}
            >
              {showSubmitConfirm ? "Confirm" : "Submit"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

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
              className="rounded-full px-8 border-border hover:bg-muted hover:text-foreground text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="text-sm font-medium text-muted-foreground hidden sm:block">
              Question {navigation.current + 1} of {totalQuestions}
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={navigation.current === totalQuestions - 1 || isSubmitting}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      {/* Submit Modal Overlay */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200 border-border">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Submit Assessment?</h3>
            <p className="text-muted-foreground text-sm mb-6">You are about to submit your answers. This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} className="rounded-xl h-12">
                Cancel
              </Button>
              <Button onClick={() => handleSubmit(false)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12">
                Submit Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Security Violation Overlay (Refactored from early return) */}
      {isBlocked && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Exam Paused: Security Violation</h1>
          <p className="text-lg text-muted-foreground max-w-md mb-8">
            You have left fullscreen mode or switched tabs. This is recorded as a violation.
            <br /><br />
            <span className="font-bold text-red-500">Warning {warnings}/3</span>
          </p>
          <Button
            size="lg"
            onClick={enterFullscreen}
            className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded-full shadow-xl"
          >
            <Maximize2 className="w-6 h-6 mr-2" />
            Return to Fullscreen to Continue
          </Button>
        </div>
      )}
    </div>
  );
}