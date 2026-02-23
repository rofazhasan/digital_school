"use client";

import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useExamContext } from "./ExamContext";
import QuestionCard from "./QuestionCard";
import Timer from "./Timer";
import Navigator from "./Navigator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Menu, ShieldAlert, Maximize2, Eye, EyeOff, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useProctoring } from "@/hooks/useProctoring";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setKeepAwake, setBrightness } from "@/lib/native/display";
import { nativeConfirm } from "@/lib/native/interaction";
import { speakText, stopSpeech } from "@/lib/native/accessibility";
import { Capacitor } from "@capacitor/core";
import { Volume2, VolumeX } from "lucide-react";


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
    <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar pb-2 bg-background/50 backdrop-blur-md rounded-2xl mb-4 border border-border">
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex;
        const isAnswered = !!answers[q.id];
        const isMarked = !!marked[q.id];

        let bgClass = "bg-card border-border text-muted-foreground hover:bg-accent";
        if (isCurrent) bgClass = "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/30 scale-110";
        else if (isMarked) bgClass = "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800";
        else if (isAnswered) bgClass = "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800";

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

// Premium Section Transition Overlay
const SectionTransitionOverlay = memo(({
  type,
  onAction,
  stats
}: {
  type: 'objective_submitted' | 'cqsq_starting',
  onAction: () => void,
  stats?: { answered: number, total: number }
}) => {
  return (
    <div className="fixed inset-0 z-[120] bg-background/98 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
            {type === 'objective_submitted' ? (
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-in bounce-in" />
            ) : (
              <Eye className="w-12 h-12 text-primary animate-pulse" />
            )}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-4 border-primary/20 rounded-full animate-spin-slow shadow-xl" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            {type === 'objective_submitted' ? "Objective Section Completed" : "Preparing Next Section"}
          </h2>
          <p className="text-muted-foreground font-medium">
            {type === 'objective_submitted'
              ? "Your objective answers have been securely saved."
              : "Synchronizing questions and resetting proctoring safe-guards..."}
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 p-6 bg-muted/30 rounded-[2rem] border border-border/50">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Attempted</p>
              <p className="text-2xl font-black text-foreground">{stats.answered} / {stats.total}</p>
            </div>
            <div className="text-center border-l">
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-bold text-emerald-500 uppercase">Synchronized</p>
            </div>
          </div>
        )}

        <Button
          onClick={onAction}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/20 transition-all active:scale-95"
        >
          {type === 'objective_submitted' ? "Continue to Subjective Section" : "Proceed to Final Section"}
          <ChevronRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
    </div>
  );
});

SectionTransitionOverlay.displayName = 'SectionTransitionOverlay';

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
    sortedQuestions,
    fontSize,
    setFontSize,
    activeSection,
    setActiveSection,
    hasObjective,
    hasCqSq,
    fullSortedQuestions
  } = useExamContext();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitionState, setTransitionState] = useState<'objective_submitted' | 'cqsq_starting' | null>(null);
  // Initialize instructions visibility based on whether exam has started
  const hasStartedAny = (exam.objectiveStatus !== 'PENDING' || exam.cqSqStatus !== 'PENDING');
  const [showInstructions, setShowInstructions] = useState(!hasStartedAny);
  const [isStarting, setIsStarting] = useState(false);

  const inProgress = (exam.objectiveStatus === 'IN_PROGRESS' || exam.cqSqStatus === 'IN_PROGRESS');
  const isActuallyResuming = hasStartedAny && !exam.hasSubmitted;

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
    let confirmed = false;
    if (forced) {
      confirmed = true;
    } else {
      confirmed = await nativeConfirm(
        "Submit Assessment?",
        "You are about to submit your answers. This action cannot be undone."
      );
    }

    if (confirmed) {
      setIsSubmitting(true);
      if (forced) {
        toast.error(`${activeSection === 'objective' ? 'Objective' : 'Exam'} auto-submitted due to time limit.`);
      }
      try {
        const response = await fetch(`/api/exams/${exam.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answers,
            section: activeSection
          }),
        });

        if (response.ok) {
          const resData = await response.json();

          if (activeSection === 'objective' && hasCqSq) {
            // Objective submitted, now show transition overlay
            setTransitionState('objective_submitted');
            toast.success("Objective answers saved. Proceed to Subjective section.");
          } else {
            // Re-allow sleep after exam
            setKeepAwake(false);
            window.location.href = `/exams/results/${exam.id}`;
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }
      } catch (error) {
        console.error('Submit error:', error);
        const errorMessage = (error as Error).message;

        if (forced || errorMessage.includes('time limit') || errorMessage.includes('submitted')) {
          toast.warning("Time limit processed. Redirecting...");
          setKeepAwake(false);
          if (activeSection === 'objective' && hasCqSq) {
            window.location.reload();
          } else {
            window.location.href = `/exams/results/${exam.id}`;
          }
          return;
        }

        toast.error(`Submission failed: ${errorMessage}. Please try again.`);
      } finally {
        setIsSubmitting(false);
        setShowSubmitConfirm(false);
      }
    }
  }, [exam, answers, activeSection, hasCqSq]);


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
    isExamActive: isExamActive && activeSection !== 'cqsq',
    isUploading: isUploading, // Pass context state
    externalWarnings: contextWarnings,
    setExternalWarnings: setContextWarnings
  });

  // Grace period state to prevent immediate blocking on start
  const [gracePeriod, setGracePeriod] = useState(false);

  // Check initial start state
  useEffect(() => {
    if (exam.startedAt) {
      setIsExamActive(true);
      setKeepAwake(true);
      setBrightness(1.0);
    }
    return () => {
      setKeepAwake(false);
      stopSpeech();
    };
  }, [exam.objectiveStartedAt, exam.cqSqStartedAt]);


  const handleStartExam = async (sectionToStart: 'objective' | 'cqsq') => {
    try {
      setIsStarting(true);
      setGracePeriod(true); // Enable grace period

      // 1. Enter Fullscreen FIRST (with timeout to prevent hanging)
      try {
        await Promise.race([
          enterFullscreen(),
          new Promise((resolve) => setTimeout(() => resolve("timeout"), 1000))
        ]);
      } catch (e) {
        console.warn("Fullscreen attempt timed out or failed, proceeding anyway.");
      }

      // Just in case Promise.race doesn't behave as expected in all envs (e.g. resolve vs reject logic above)
      // actually enterFullscreen inside useProctoring catches errors, so it resolves. 
      // The timeout ensures we don't wait forever if the browser prompt hangs.

      // 2. Call API to start exam on server
      const res = await fetch(`/api/exams/${exam.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionToStart })
      });

      if (!res.ok) throw new Error("Failed to start exam session");

      // 3. Update local state to show exam
      // Reset navigation index to 0 BEFORE showing exam to prevent out-of-bounds loading state
      navigateToQuestion(0);

      setIsExamActive(true);
      setShowInstructions(false);
      setTransitionState(null); // Clear any transition overlays
      setActiveSection(sectionToStart); // Set active section
      setIsStarting(false); // Reset starting state on success

      setKeepAwake(true);
      setBrightness(1.0);

      toast.success("Exam Started Successfully", { position: "top-center" });

      // Disable grace period after 3 seconds (enough time for fullscreen to settle)
      setTimeout(() => setGracePeriod(false), 3000);


    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam. Please try again.");
      setIsStarting(false);
      setGracePeriod(false);
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
  // Moved up to be available for keyboard navigation useEffect
  // Added gracePeriod check to prevent instant block on start
  const isBlocked = isExamActive && !gracePeriod && (!isFullscreen || !isTabActive) && !transitionState;

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlocked || !isExamActive) return;

      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBlocked, isExamActive, handleNext, handlePrevious]);


  if (showInstructions) {
    const questionsForDist = fullSortedQuestions || [];
    const mcqQuestions = questionsForDist.filter((q: any) => q.type?.toLowerCase() === 'mcq' || q.questionType?.toLowerCase() === 'mcq');
    const creativeQuestions = questionsForDist.filter((q: any) => q.type?.toLowerCase() === 'cq' || q.questionType?.toLowerCase() === 'cq');
    const shortQuestions = questionsForDist.filter((q: any) => q.type?.toLowerCase() === 'sq' || q.questionType?.toLowerCase() === 'sq');
    const otherQuestions = questionsForDist.filter((q: any) => {
      const t = (q.type || q.questionType || '').toLowerCase();
      return !['mcq', 'cq', 'sq'].includes(t);
    });

    const mcqMarks = mcqQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);

    // Dynamic Marks Calculation
    const cqMarkPerQuestion = creativeQuestions[0]?.marks || 10;
    const sqMarkPerQuestion = shortQuestions[0]?.marks || 2; // Keep default 2 if not found, but user says 10 in their case

    const cqRequired = exam.cqRequiredQuestions || creativeQuestions.length;
    const sqRequired = exam.sqRequiredQuestions || shortQuestions.length;

    const creativeMarks = cqRequired * cqMarkPerQuestion;
    const shortMarks = sqRequired * sqMarkPerQuestion;

    const passMark = exam.passMarks || Math.ceil((exam.totalMarks || (mcqMarks + creativeMarks + shortMarks)) * 0.33);

    const requiredTotalQuestions = mcqQuestions.length + cqRequired + sqRequired + otherQuestions.length;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start md:justify-center p-2 sm:p-4 font-sans animate-in fade-in duration-500 overflow-y-auto">
        <Card className="max-w-3xl w-full p-5 md:p-10 my-4 shadow-2xl rounded-3xl bg-card border-border relative overflow-hidden flex flex-col shrink-0">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src={instituteLogo} alt={instituteName} className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1 tracking-tight">{exam.title || exam.name || 'Assessment'}</h1>
            <p className="text-sm md:text-lg text-muted-foreground">শ্রেণি (Class): {exam.className || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl text-center border border-blue-100/50 dark:border-blue-900/30">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Time (সময়)</div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {exam.objectiveTime && exam.cqSqTime ? (
                  <div className="text-left">
                    <div className="flex justify-between gap-4">
                      <span>Objective:</span>
                      <span>{exam.objectiveTime}m</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-blue-200 mt-1 pt-1">
                      <span>CQ/SQ:</span>
                      <span>{exam.cqSqTime}m</span>
                    </div>
                  </div>
                ) : (
                  <span>{Math.floor(exam.duration / 60) > 0 ? `${Math.floor(exam.duration / 60)}h ` : ''}{exam.duration % 60}m</span>
                )}
              </p>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl text-center border border-purple-100/50 dark:border-purple-900/30">
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mb-1">মোট প্রশ্ন (Total Questions)</div>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{requiredTotalQuestions}</p>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl text-center border border-emerald-100/50 dark:border-emerald-900/30">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">মোট নম্বর (Total Marks)</div>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{exam.totalMarks}</p>
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl text-center border border-rose-100/50 dark:border-rose-900/30">
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-1">পাস নম্বর (Pass Mark)</div>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{passMark}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Question Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Menu className="w-4 h-4 text-primary" /> প্রশ্নের ধরন ও বণ্টন (Question Distribution)
              </h3>
              <div className="space-y-2">
                {mcqQuestions.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <span className="text-sm font-medium">MCQ (বহুনির্বাচনী)</span>
                    <Badge variant="secondary" className="font-bold">{mcqQuestions.length} ({mcqMarks} Marks)</Badge>
                  </div>
                )}
                {creativeQuestions.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Creative (সৃজনশীল)</span>
                      <span className="text-[10px] text-muted-foreground">{creativeQuestions.length} টি প্রশ্নের মধ্যে {cqRequired} টির উত্তর দাও</span>
                    </div>
                    <Badge variant="secondary" className="font-bold">CQ: {cqRequired}/{creativeQuestions.length} ({cqRequired}*{cqMarkPerQuestion}={creativeMarks} Marks)</Badge>
                  </div>
                )}
                {shortQuestions.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Short (সংক্ষিপ্ত)</span>
                      <span className="text-[10px] text-muted-foreground">{shortQuestions.length} টি প্রশ্নের মধ্যে {sqRequired} টির উত্তর দাও</span>
                    </div>
                    <Badge variant="secondary" className="font-bold">SQ: {sqRequired}/{shortQuestions.length} ({sqRequired}*{sqMarkPerQuestion}={shortMarks} Marks)</Badge>
                  </div>
                )}
                {otherQuestions.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <span className="text-sm font-medium">অন্যান্য (Others)</span>
                    <Badge variant="secondary" className="font-bold">{otherQuestions.length}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* General Instructions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> পরীক্ষার্থীদের জন্য নির্দেশাবলি (Instructions)
              </h3>
              <ul className="space-y-2 text-xs font-medium text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>ফুলস্ক্রিন মোড বজায় রাখো। অবজেক্টিভ অংশে ট্যাব পরিবর্তন করলে বা অন্য উইন্ডোতে গেলে সিকিউরিটি ওয়ার্নিং দেওয়া হবে।</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>অবজেক্টিভ অংশে ৪ বার সিকিউরিটি ওয়ার্নিং দিলে পরীক্ষা অটো-সাবমিট হয়ে যাবে।</span>
                </li>
                <li className="flex items-start gap-2">
                  {exam.mcqNegativeMarking > 0 ? (
                    <>
                      <X className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-red-600 dark:text-red-400 font-bold">ভুল উত্তরের জন্য নেগেটিভ মার্কিং: {exam.mcqNegativeMarking}% কাটা হবে।</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span>ভুল উত্তরের জন্য কোনো নেগেটিভ মার্কিং নেই। (No negative marking)</span>
                    </>
                  )}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>অটো-সেভ সফল হওয়ার জন্য স্থিতিশীল ইন্টারনেট সংযোগ নিশ্চিত করো।</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4">
            {hasObjective && (exam.objectiveStatus === 'PENDING' || exam.objectiveStatus === 'IN_PROGRESS') ? (
              <Button
                onClick={() => handleStartExam('objective')}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-8 text-xl rounded-2xl shadow-xl shadow-blue-500/25 border-0 transition-all active:scale-[0.98] group mb-4"
              >
                {isStarting ? "প্রস্তুত করা হচ্ছে..." : isActuallyResuming ? "পরীক্ষা পুনরায় শুরু করো (Resume Exam)" : "পরীক্ষা শুরু করো (Start Exam)"}
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            ) : hasCqSq && (exam.cqSqStatus === 'PENDING' || exam.cqSqStatus === 'IN_PROGRESS') ? (
              <Button
                onClick={() => handleStartExam('cqsq')}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-8 text-xl rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
              >
                {isStarting ? "প্রস্তুত করা হচ্ছে..." : (exam.cqSqStatus === 'IN_PROGRESS' ? "সৃজনশীল/সংক্ষিপ্ত অংশ পুনরায় শুরু করো (Resume CQ/SQ)" : "সৃজনশীল/সংক্ষিপ্ত অংশ শুরু করো (Start CQ/SQ)")}
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            ) : null}
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold opacity-50">কর্তৃক অনুমোদিত {instituteName}</p>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return <div className="flex justify-center items-center h-screen text-muted-foreground">Loading exam content...</div>;

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-exam-online transition-colors duration-500 ease-in-out",
      illusionMode ? "illusion-mode" : "bg-background",
      isBlocked ? "select-none overflow-hidden" : ""
    )}>
      <div className={cn(
        "flex flex-col flex-1"
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
                <SheetContent side="left" className="w-[300px] p-0 flex flex-col h-full bg-background border-r outline-none">
                  <div className="p-4 border-b bg-muted/30 shrink-0">
                    <h2 className="font-bold text-lg">Navigator</h2>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden relative">
                    <Navigator questions={questions} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-3">
                <img src={instituteLogo} alt="Logo" className="h-8 w-auto hidden sm:block rounded" />
                <div className="flex flex-col">
                  <h1 className="font-bold text-sm md:text-base hidden sm:block truncate max-w-[200px]">{exam.title}</h1>
                  <Badge variant="outline" className={cn(
                    "text-[10px] h-4 py-0 px-1 border-primary/30 w-fit",
                    activeSection === 'objective' ? "text-indigo-600 border-indigo-200 bg-indigo-50/50" : "text-emerald-600 border-emerald-200 bg-emerald-50/50"
                  )}>
                    {activeSection === 'objective' ? 'Objective Section' : 'Subjective Section'}
                  </Badge>
                </div>
                {/* TTS Accessibility Control */}
                {Capacitor.isNativePlatform() && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => speakText(currentQuestion?.questionText || '')}
                    >
                      <Volume2 className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={stopSpeech}
                    >
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>

            </div>

            {/* Centered Timer */}
            <div className="absolute left-1/2 top-1 lg:top-1/2 transform -translate-x-1/2 lg:-translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 scale-90 lg:scale-100">
              <div className="pointer-events-auto">
                <Timer onTimeUp={() => handleSubmit(true)} />
              </div>
              {/* Conditional Proctor Warning in Header */}
              {warnings > 0 && activeSection !== 'cqsq' && (
                <div className="pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-300">
                  <Badge variant="destructive" className="flex items-center gap-1 text-[10px] px-2 h-5 bg-red-600 hover:bg-red-700 animate-pulse">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Warning: {warnings}/4</span>
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Font Size Toggle - Desktop Only */}
              <div className="hidden md:flex items-center bg-muted/50 rounded-lg p-0.5 border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize((prev: string) => prev === 'xl' ? 'lg' : 'md')}
                  className={cn("h-8 w-8 p-0", fontSize === 'md' ? "text-muted-foreground" : "")}
                  title="Decrease Font Size"
                  disabled={fontSize === 'md'}
                >
                  <span className="text-xs font-bold">A-</span>
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize((prev: string) => prev === 'md' ? 'lg' : 'xl')}
                  className={cn("h-8 w-8 p-0", fontSize === 'xl' ? "text-muted-foreground" : "")}
                  title="Increase Font Size"
                  disabled={fontSize === 'xl'}
                >
                  <span className="text-sm font-bold">A+</span>
                </Button>
              </div>

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
          "flex-grow mx-auto w-full transition-all duration-500 pb-24 md:pb-10", // Added pb-24 for mobile sticky footer
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
                {warnings > 0 && activeSection !== 'cqsq' && (
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
              <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 py-4 px-4 -mx-4 md:mx-0 md:px-0 bg-background/80 backdrop-blur-lg border-t md:border-t-0 md:bg-transparent md:backdrop-blur-none md:static mt-auto transition-all">
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

        {/* Submission Loader */}
        {isSubmitting && (
          <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">উত্তরপত্র জমা দেওয়া হচ্ছে...</h2>
                <p className="text-muted-foreground font-medium">অনুগ্রহ করে অপেক্ষা করুন (Processing Result...)</p>
              </div>
            </div>
          </div>
        )}

        {isBlocked && !isSubmitting && !transitionState && (
          <div className="fixed inset-0 z-[140] bg-background/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 select-none">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-16 h-16 text-destructive" />
              </div>
              <div className="absolute inset-0 border-4 border-destructive/20 rounded-full animate-ping opacity-25" />
            </div>

            <div className="space-y-4 max-w-lg">
              <h1 className="text-4xl font-black text-foreground tracking-tight">Access Suspended</h1>
              <p className="text-xl font-medium text-muted-foreground">
                Proctoring shields detected a security violation (Tab switch or Window resize).
              </p>

              <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20 inline-block">
                <span className="text-destructive font-black text-2xl">WARNING LEVEL: {warnings}/4</span>
              </div>

              <div className="pt-8 w-full flex flex-col items-center gap-4">
                <Button size="lg" onClick={enterFullscreen} className="bg-destructive hover:bg-destructive/90 text-white text-xl px-12 py-8 rounded-3xl shadow-2xl shadow-destructive/20 group w-full">
                  <Maximize2 className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Restore Fullscreen Protocol
                </Button>
                <p className="text-sm font-bold text-muted-foreground opacity-50 uppercase tracking-widest underline underline-offset-4">Auto-Submit at level 4</p>
              </div>
            </div>
          </div>
        )}

        {/* Transition Overlay */}
        {transitionState === 'objective_submitted' && (
          <SectionTransitionOverlay
            type="objective_submitted"
            stats={{ answered: answeredCount, total: totalQuestions }}
            onAction={() => window.location.reload()} // Still reload for now to cleanly switch context, but with better UI first
          />
        )}
      </div>
    </div>
  );
}