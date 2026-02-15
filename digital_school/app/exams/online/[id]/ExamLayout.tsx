"use client";

import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useExamContext } from "./ExamContext";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import Navigator from "./Navigator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Menu, ShieldAlert, Maximize2, Eye, EyeOff, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useProctoring } from "@/hooks/useProctoring";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar pb-2 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md rounded-2xl mb-4 border border-gray-100 dark:border-gray-800">
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex;
        const isAnswered = !!answers[q.id];
        const isMarked = !!marked[q.id];

        let bgClass = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50";
        if (isCurrent) bgClass = "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900 shadow-lg shadow-blue-500/30 scale-110";
        else if (isMarked) bgClass = "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400";
        else if (isAnswered) bgClass = "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400";

        return (
          <button
            key={q.id}
            onClick={() => onNavigate(idx)}
            className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all duration-300
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
    isUploading, // Get from context
    warnings: contextWarnings,
    setWarnings: setContextWarnings,
    sortedQuestions
  } = useExamContext();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize instructions visibility based on whether exam has started
  const [showInstructions, setShowInstructions] = useState(!exam.startedAt);
  const [isStarting, setIsStarting] = useState(false);

  // Illusion Mode State
  const [illusionMode, setIllusionMode] = useState(false);

  const questions = sortedQuestions || [];
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
    // 4 warnings limit for auto-submit
    if (count >= 4) {
      handleSubmit(true);
    }
  }, [handleSubmit]);

  // Check if exam has CQ or SQ questions (disable proctoring for these)
  const hasCQorSQ = questions.some((q: any) => {
    const type = (q.type || q.questionType || '').toLowerCase();
    return type === 'cq' || type === 'sq';
  });

  // Browser/Tab Proctoring - Re-enabled for all exams
  const { isFullscreen, warnings, enterFullscreen, isTabActive } = useProctoring({
    onViolation,
    maxWarnings: 4,
    isExamActive: isExamActive,
    isUploading: isUploading, // Pass context state
    externalWarnings: contextWarnings,
    setExternalWarnings: setContextWarnings
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

  const toggleIllusionMode = () => {
    setIllusionMode(prev => !prev);
    if (!illusionMode) {
      toast.info("Illusion Mode Active: Distractions hidden.", {
        position: "top-center",
        duration: 2000
      });
    }
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans animate-in fade-in duration-500">
        <Card className="max-w-3xl w-full p-6 md:p-10 shadow-2xl rounded-3xl bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={instituteLogo} alt={instituteName} className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">{exam.title || exam.name || 'Assessment'}</h1>
            <p className="text-sm md:text-lg text-muted-foreground">Ready to begin?</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-muted/50 p-4 rounded-xl text-center border hover:border-primary/20 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</div>
              <p className="text-xl font-bold text-primary">{exam.duration}m</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center border hover:border-primary/20 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Questions</div>
              <p className="text-xl font-bold text-primary">{totalQuestions}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center border hover:border-primary/20 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Marks</div>
              <p className="text-xl font-bold text-primary">{exam.totalMarks || (mcqMarks + cqMarks + sqMarks)}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl text-center border hover:border-primary/20 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pass Mark</div>
              <p className="text-xl font-bold text-primary">{passMark}</p>
            </div>
          </div>

          <div className="alert alert-warning mb-6 bg-amber-50/50 border-amber-100 text-amber-900 rounded-xl p-4 text-sm">
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="w-4 h-4" /> Important Instructions
            </div>
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Do not switch tabs or exit fullscreen (Violations are recorded).</li>
              <li>Ensure stable internet connection.</li>
              {exam.mcqNegativeMarking > 0 && <li>Negative Marking: {exam.mcqNegativeMarking}% per wrong MCQ.</li>}
            </ul>
          </div>

          <Button
            onClick={handleStartExam}
            disabled={isStarting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            {isStarting ? "Initializing Assessment..." : "Start Assessment"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return <div className="flex justify-center items-center h-screen text-muted-foreground">Loading exam content...</div>;

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-exam-online transition-colors duration-500 ease-in-out",
      illusionMode ? "illusion-mode" : "bg-gray-50 dark:bg-background",
      isExamActive && (!isFullscreen || !isTabActive) ? 'select-none blur-sm' : ''
    )}>

      {/* --- HEADER (Hidden in Illusion Mode) --- */}
      <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm transition-all duration-500",
        illusionMode ? "-translate-y-full opacity-0 pointer-events-none absolute" : "translate-y-0 opacity-100"
      )}>
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="p-4 border-b bg-muted/30">
                  <h2 className="font-bold text-lg">Navigator</h2>
                </div>
                <div className="p-4">
                  <Navigator questions={questions} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <img src={instituteLogo} alt="Logo" className="h-8 w-auto hidden sm:block rounded" />
              <h1 className="font-bold text-sm md:text-base hidden sm:block truncate max-w-[200px]">{exam.title}</h1>
            </div>
          </div>

          {/* Centered Timer */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="pointer-events-auto">
              <Timer onTimeUp={() => handleSubmit(true)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Illusion Mode Toggle (Desktop Header) */}
            <Button variant="ghost" size="icon" onClick={toggleIllusionMode} title="Enter Focus Mode" className="hidden sm:flex text-muted-foreground hover:text-primary">
              <Eye className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => handleSubmit(false)}
              className={cn("rounded-full px-6 transition-all shadow-md", showSubmitConfirm ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}
            >
              {showSubmitConfirm ? "Confirm" : "Submit"}
            </Button>
          </div>
        </div>
      </header>

      {/* --- PROGRESS BAR (Hidden in Illusion) --- */}
      {!illusionMode && (
        <div className="w-full h-1 bg-muted fixed top-16 z-40">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className={cn(
        "flex-grow mx-auto w-full transition-all duration-500",
        illusionMode ? "max-w-4xl px-4 py-8 md:py-12 flex flex-col justify-center min-h-screen" : "max-w-7xl 2xl:max-w-[95vw] px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8"
      )}>

        {/* --- LEFT SIDEBAR (Desktop Navigator) --- */}
        {!illusionMode && (
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <Card className="p-4 border shadow-sm bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Question Navigator</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">{answeredCount}/{totalQuestions}</Badge>
                </div>
                <Navigator questions={questions} onSubmit={() => handleSubmit(false)} />
              </Card>

              {/* Warnings Widget */}
              {warnings > 0 && (
                <div className="bg-destructive/5 text-destructive border border-destructive/20 p-4 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5" />
                  <div className="text-sm font-semibold">
                    <p>Security Warnings</p>
                    <p className="text-xs opacity-80">{warnings}/4 Recorded</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* --- CENTER CONTENT --- */}
        <div className={cn("flex flex-col gap-6", illusionMode ? "w-full" : "lg:col-span-9")}>

          {/* Mobile Navigator (Normal Mode Only) */}
          {!illusionMode && (
            <div className="lg:hidden mb-2">
              <MobileNavigator
                questions={questions}
                currentIndex={navigation.current}
                onNavigate={navigateToQuestion}
                answers={answers || {}}
                marked={navigation.marked || {}}
              />
            </div>
          )}

          {/* Question Card Container */}
          <div className={cn("transition-all duration-500", illusionMode ? "scale-[1.02]" : "")}>
            <QuestionCard
              questionIdx={navigation.current}
              questionOverride={currentQuestion}
              disabled={isSubmitting}
            />
          </div>

          {/* --- FLOATING CONTROLS (Illusion Mode) --- */}
          {illusionMode && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-md rounded-full px-6 py-3 shadow-2xl z-50 text-white border border-white/10">
              <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={navigation.current === 0} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <span className="text-sm font-mono opacity-80 mx-2">{navigation.current + 1} / {totalQuestions}</span>
              <Button variant="ghost" size="icon" onClick={handleNext} disabled={navigation.current === totalQuestions - 1} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                <ChevronRight className="w-6 h-6" />
              </Button>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <Button variant="ghost" size="icon" onClick={toggleIllusionMode} className="text-white hover:bg-white/20 rounded-full h-10 w-10 text-amber-300">
                <EyeOff className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* --- STANDARD BOTTOM BAR (Normal Mode) --- */}
          {!illusionMode && (
            <div className="flex items-center justify-between gap-4 py-4 mt-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={navigation.current === 0 || isSubmitting}
                className="rounded-full px-6 border-border hover:bg-muted text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>

              <div className="block sm:hidden">
                <Button variant="secondary" size="icon" onClick={toggleIllusionMode} className="rounded-full w-12 h-12 shadow-md">
                  <Eye className="w-5 h-5" />
                </Button>
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
          )}
        </div>
      </main>

      {/* --- OVERLAYS --- */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 text-center shadow-2xl border-border bg-card">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Submit Assessment?</h3>
            <p className="text-muted-foreground text-sm mb-6">You are about to submit your answers. This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} className="rounded-xl h-12">Cancel</Button>
              <Button onClick={() => handleSubmit(false)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12">Submit Now</Button>
            </div>
          </Card>
        </div>
      )}

      {isBlocked && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-red-600 mb-4">Security Violation Detected</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8">
            Please return to fullscreen mode immediately.
            <br />
            <span className="font-bold text-red-500 mt-2 block">Warning Level: {warnings}/4</span>
          </p>
          <Button size="lg" onClick={enterFullscreen} className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded-full shadow-xl">
            <Maximize2 className="w-6 h-6 mr-2" /> Return to Fullscreen
          </Button>
        </div>
      )}
    </div>
  );
}