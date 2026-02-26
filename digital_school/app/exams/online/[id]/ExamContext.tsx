import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";

const ExamContext = createContext<any>(null);

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  const callback = useRef(effect);
  useEffect(() => { callback.current = effect; }, [effect]);
  useEffect(() => {
    const handler = setTimeout(() => callback.current(), delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [...deps, delay]);
}

export function ExamContextProvider({
  exam: examProp,
  children
}: {
  exam: any;
  children: React.ReactNode;
}) {
  // Keep exam as state so we can patch timestamps after start API returns
  const [exam, setExamState] = useState<any>(examProp);
  const patchExam = useCallback((patch: Partial<any>) => {
    setExamState((prev: any) => ({ ...prev, ...patch }));
  }, []);

  const [answers, setAnswers] = useState<any>(examProp.savedAnswers || {});
  const [navigation, setNavigation] = useState<any>({ current: 0, marked: {} });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('md');
  const [highContrast, setHighContrast] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({ cq: 0, sq: 0 });
  const [isUploading, setIsUploading] = useState(false); // New Internal State
  const [warnings, setWarnings] = useState(0); // Lifted state

  // --- Section Detection Logic ---
  const { hasObjective, hasCqSq } = useMemo(() => {
    if (!exam.questions) return { hasObjective: false, hasCqSq: false };
    const objectiveTypes = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'];
    const questions = exam.questions || [];

    const obj = questions.some((q: any) => {
      const type = (q.type || q.questionType || '').toLowerCase();
      // DESCRIPTIVE is now part of CQ/SQ section
      return objectiveTypes.includes(type) || !['cq', 'sq', 'descriptive'].includes(type);
    });

    const sub = questions.some((q: any) => {
      const type = (q.type || q.questionType || '').toLowerCase();
      return ['cq', 'sq', 'descriptive'].includes(type);
    });

    return { hasObjective: obj, hasCqSq: sub };
  }, [exam.questions]);

  const [activeSection, setActiveSection] = useState<'objective' | 'cqsq'>(
    exam.objectiveStatus === 'SUBMITTED' || !hasObjective ? 'cqsq' : 'objective'
  );
  const isOnline = useOnlineStatus();

  // Scope to specific submission to prevent retake bleed-over
  const submissionId = exam.submissionId || 'new';
  const localKey = `exam-answers-${exam.id}-${submissionId}`;
  const navigationKey = `exam-navigation-${exam.id}-${submissionId}`;
  const warningsKey = `exam-warnings-${exam.id}-${submissionId}`;

  // Load answers and navigation from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load answers and merge with server-saved ones
    const localAnswersStr = localStorage.getItem(localKey);
    if (localAnswersStr) {
      try {
        const localAnswers = JSON.parse(localAnswersStr);
        setAnswers((prev: any) => ({
          ...prev,
          ...localAnswers
        }));
      } catch { }
    }

    // Load navigation state
    const savedNavigation = localStorage.getItem(navigationKey);
    if (savedNavigation) {
      try {
        const parsedNavigation = JSON.parse(savedNavigation);
        setNavigation(parsedNavigation);
      } catch { }
    }

    // Load warnings
    const savedWarnings = localStorage.getItem(warningsKey);
    if (savedWarnings) {
      setWarnings(parseInt(savedWarnings) || 0);
    }
  }, [localKey, navigationKey, warningsKey]);

  // Save answers to localStorage (debounced to avoid blocking the main thread during typing)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = setTimeout(() => {
      localStorage.setItem(localKey, JSON.stringify(answers));
    }, 1000); // 1s debounce for local storage
    return () => clearTimeout(handler);
  }, [answers, localKey]);

  // Save navigation state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(navigationKey, JSON.stringify(navigation));
  }, [navigation, navigationKey]);

  // Save warnings to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(warningsKey, warnings.toString());
  }, [warnings, warningsKey]);

  // CONSISTENT QUESTION SORTING
  const fullSortedQuestions = useMemo(() => {
    if (!exam.questions) return [];

    const types = ['mcq', 'mc', 'ar', 'mtf', 'cq', 'sq', 'int', 'numeric', 'descriptive'];
    const grouped: any = { mcq: [], mc: [], ar: [], mtf: [], cq: [], sq: [], int: [], numeric: [], descriptive: [], other: [] };

    exam.questions.forEach((q: any) => {
      const type = (q.type || q.questionType || '').toLowerCase();
      if (grouped[type]) grouped[type].push(q);
      else grouped.other.push(q);
    });

    return [
      ...grouped.mcq,
      ...grouped.mc,
      ...grouped.ar,
      ...grouped.mtf,
      ...grouped.cq,
      ...grouped.sq,
      ...grouped.int,
      ...grouped.numeric,
      ...grouped.descriptive,
      ...grouped.other
    ];
  }, [exam.questions]);

  const sortedQuestions = useMemo(() => {
    if (activeSection === 'objective') {
      return fullSortedQuestions.filter((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        return ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric', 'other'].includes(type) && !['cq', 'sq', 'descriptive'].includes(type);
      });
    } else {
      return fullSortedQuestions.filter((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        return ['cq', 'sq', 'descriptive'].includes(type);
      });
    }
  }, [fullSortedQuestions, activeSection]);

  // Server perspective: only sync periodically
  const saveAnswers = useCallback(async (answersToSave: any) => {
    if (Object.keys(answersToSave).length === 0) return;
    if (exam.status === 'SUBMITTED' || exam.isPractice) return; // Don't save if already submitted or in practice

    try {
      setSaveStatus("saving");
      const response = await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersToSave }),
      });

      if (response.status === 403) {
        // likely already submitted or time up
        setSaveStatus("error");
        return;
      }

      if (!response.ok) throw new Error("Failed to save");

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [exam.id, exam.status]);

  // Autosave answers to API (debounced)
  useDebouncedEffect(() => {
    saveAnswers(answers);
  }, [answers, saveAnswers], 10000); // 10s debounce for API to handle scale

  // Stable navigation handler
  const navigateToQuestion = useCallback((index: number) => {
    setNavigation((prev: any) => {
      if (index >= 0 && index < (sortedQuestions.length || 0)) {
        return { ...prev, current: index };
      }
      return prev;
    });
  }, [sortedQuestions.length]);

  const markQuestion = useCallback((questionId: string, marked: boolean) => {
    setNavigation((prev: any) => ({
      ...prev,
      marked: {
        ...prev.marked,
        [questionId]: marked
      }
    }));
  }, []);

  const getQuestionsByType = useCallback((type: string) => {
    if (!exam.questions) return [];
    return exam.questions.filter((q: any) =>
      (q.type || q.questionType || "").toLowerCase() === type.toLowerCase()
    );
  }, [exam.questions]);

  // Memoized question counts
  useEffect(() => {
    if (exam.questions) {
      const counts = {
        cq: getQuestionsByType('cq').length,
        sq: getQuestionsByType('sq').length
      };
      setQuestionCounts(counts);
    }
  }, [exam.questions, getQuestionsByType]);

  const groupedQuestions = useMemo(() => {
    if (!exam.questions) return {};
    const g: any = { mcq: [], mc: [], ar: [], mtf: [], int: [], numeric: [], cq: [], sq: [], descriptive: [], other: [] };
    exam.questions.forEach((q: any) => {
      const type = (q.type || q.questionType || '').toLowerCase();
      if (g[type]) g[type].push(q);
      else g.other.push(q);
    });
    return {
      creative: [...g.cq, ...g.descriptive],
      short: [...g.sq],
      objective: [...g.mcq, ...g.mc, ...g.ar, ...g.mtf, ...g.int, ...g.numeric, ...g.other]
    };
  }, [exam.questions]);

  // Optimized Context Value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(() => ({
    exam,
    patchExam,
    answers,
    setAnswers,
    navigation,
    setNavigation,
    saveStatus,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    questionCounts,
    navigateToQuestion,
    markQuestion,
    getQuestionsByType,
    saveAnswers,
    isOnline,
    isUploading,
    setIsUploading,
    warnings,
    setWarnings,
    activeSection,
    setActiveSection,
    hasObjective,
    hasCqSq,
    sortedQuestions,
    fullSortedQuestions,
    groupedQuestions
  }), [
    exam,
    patchExam,
    answers,
    navigation,
    saveStatus,
    fontSize,
    highContrast,
    questionCounts,
    navigateToQuestion,
    markQuestion,
    getQuestionsByType,
    saveAnswers,
    isOnline,
    isUploading,
    warnings,
    activeSection,
    hasObjective,
    hasCqSq,
    sortedQuestions,
    fullSortedQuestions,
    groupedQuestions
  ]);

  return (
    <ExamContext.Provider value={contextValue}>
      {children}
    </ExamContext.Provider>
  );
}

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExamContext must be used within an ExamContextProvider");
  }
  return context;
}; 