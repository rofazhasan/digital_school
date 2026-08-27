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

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function shuffleArrayWithSeed<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ExamContextProvider({
  exam: examProp,
  children
}: {
  exam: any;
  children: React.ReactNode;
}) {
  // Keep exam as state so we can patch timestamps after start API returns
  const [exam, setExamState] = useState<any>(() => {
    const origQuestions = examProp.questions || [];
    const seed = examProp.studentId || examProp.submissionId || examProp.id || 'default_seed';
    const shuffledQuestions = examProp.shuffleQuestions !== false 
      ? shuffleArrayWithSeed(origQuestions, seed) 
      : origQuestions;

    return {
      ...examProp,
      questions: shuffledQuestions
    };
  });
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
    const objectiveTypes = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric', 'smcq', 'cma', 'mpc'];
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

  const [activeSection, setActiveSection] = useState<'objective' | 'cqsq'>(() => {
    // If explicitly submitted or no objective section, always cqsq
    if (exam.objectiveStatus === 'SUBMITTED' || !hasObjective) return 'cqsq';

    // Fairness (insaf) check: if objective section was started and time has elapsed
    // even if it wasn't marked as SUBMITTED yet (e.g. user closed tab),
    // we should treat it as expired if the objectiveTime has passed.
    if (exam.objectiveStartedAt && (exam.objectiveTime || exam.duration)) {
      const objTime = exam.objectiveTime || exam.duration;
      const startTime = new Date(exam.objectiveStartedAt).getTime();
      const now = Date.now();
      const limitMs = objTime * 60 * 1000;

      if (now > startTime + limitMs) {
        return 'cqsq';
      }
    }

    return 'objective';
  });
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

    const types = ['mcq', 'mc', 'ar', 'mtf', 'cq', 'sq', 'int', 'numeric', 'descriptive', 'smcq', 'cma', 'mpc'];
    const grouped: any = { mcq: [], mc: [], ar: [], mtf: [], cq: [], sq: [], int: [], numeric: [], descriptive: [], smcq: [], cma: [], mpc: [], other: [] };

    exam.questions.forEach((q: any) => {
      let type = (q.type || q.questionType || '').toLowerCase();
      if (type === 'constructed_multi_answer' || type === 'constructed-multi-answer') type = 'cma';
      if (type === 'multi_step_chain' || type === 'multi-step-chain' || type === 'multi_step_problem_chain') type = 'mpc';
      if (grouped[type]) grouped[type].push(q);
      else grouped.other.push(q);
    });

    return [
      ...grouped.mcq,
      ...grouped.mc,
      ...grouped.ar,
      ...grouped.mtf,
      ...grouped.smcq,
      ...grouped.cma,
      ...grouped.mpc,
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
        return ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric', 'smcq', 'cma', 'mpc', 'other'].includes(type) && !['cq', 'sq', 'descriptive'].includes(type);
      });
    } else {
      return fullSortedQuestions.filter((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        return ['cq', 'sq', 'descriptive'].includes(type);
      });
    }
  }, [fullSortedQuestions, activeSection]);

  // Exact generated set sequence (preserving original question order of the physical/generated set)
  const setOrderedQuestions = useMemo(() => {
    const raw = exam.questions || [];
    if (activeSection === 'objective') {
      return raw.filter((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        return !['cq', 'sq', 'descriptive'].includes(type);
      });
    } else {
      return raw.filter((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        return ['cq', 'sq', 'descriptive'].includes(type);
      });
    }
  }, [exam.questions, activeSection]);

  // Switch active exam set (e.g. from OMR Set selector)
  const switchExamSet = useCallback((setNameOrCode: string) => {
    if (!exam.allSets || exam.allSets.length === 0) return;
    const cleanTarget = String(setNameOrCode).replace(/^(set|সেট)\s*[-:]?\s*/i, "").trim().toUpperCase();
    
    const matchedSet = exam.allSets.find((s: any) => {
      const cleanName = String(s.name).replace(/^(set|সেট)\s*[-:]?\s*/i, "").trim().toUpperCase();
      if (cleanName === cleanTarget) return true;
      if (s.id === setNameOrCode) return true;
      if ((cleanTarget === 'A' || cleanTarget === 'ক' || cleanTarget === '1') && (cleanName === 'A' || cleanName === 'ক' || cleanName === '1')) return true;
      if ((cleanTarget === 'B' || cleanTarget === 'খ' || cleanTarget === '2') && (cleanName === 'B' || cleanName === 'খ' || cleanName === '2')) return true;
      if ((cleanTarget === 'C' || cleanTarget === 'গ' || cleanTarget === '3') && (cleanName === 'C' || cleanName === 'গ' || cleanName === '3')) return true;
      if ((cleanTarget === 'D' || cleanTarget === 'ঘ' || cleanTarget === '4') && (cleanName === 'D' || cleanName === 'ঘ' || cleanName === '4')) return true;
      return false;
    });

    if (matchedSet && matchedSet.questions && matchedSet.questions.length > 0) {
      patchExam({
        setName: matchedSet.name,
        assignedExamSetId: matchedSet.id,
        questions: matchedSet.questions,
        assignedSet: { id: matchedSet.id, name: matchedSet.name }
      });
    }
  }, [exam.allSets, patchExam]);

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
    const g: any = { mcq: [], mc: [], ar: [], mtf: [], int: [], numeric: [], smcq: [], cma: [], mpc: [], dr: [], cq: [], sq: [], descriptive: [], other: [] };
    exam.questions.forEach((q: any) => {
      const type = (q.type || q.questionType || '').toLowerCase();
      if (g[type]) g[type].push(q);
      else g.other.push(q);
    });
    return {
      creative: [...g.cq, ...g.descriptive],
      short: [...g.sq],
      objective: [...g.mcq, ...g.mc, ...g.ar, ...g.mtf, ...g.int, ...g.numeric, ...g.smcq, ...g.cma, ...g.mpc, ...g.dr, ...g.other]
    };
  }, [exam.questions]);

  // --- Multiple Subject (MS) Logic ---
  const isMS = exam.subjectType === 'MS' || (exam.subjectsConfig && ((exam.subjectsConfig as any)?.subjects || []).length > 0);
  const msSubjects = useMemo(() => {
    if (!isMS) return [];
    const configured: any[] = (exam.subjectsConfig as any)?.subjects || [];
    if (configured.length > 0) return configured;
    const questionSubjects = Array.from(new Set((exam.questions || []).map((q: any) => q.subject).filter(Boolean)));
    return questionSubjects.map(s => ({ name: s, isMandatory: true, totalMarks: 0 }));
  }, [isMS, exam.subjectsConfig, exam.questions]);

  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Track attempted optional subjects
  const { attemptedOptionalSubjects, attemptedSubjects, isExceedingOptional } = useMemo(() => {
    if (!isMS) {
      return { attemptedOptionalSubjects: new Set<string>(), attemptedSubjects: new Set<string>(), isExceedingOptional: false };
    }
    const attemptedSubjs = new Set<string>();
    const attemptedOptSubjs = new Set<string>();

    const qMap = new Map<string, any>();
    (exam.questions || []).forEach((q: any) => {
      if (q.id) qMap.set(q.id, q);
    });

    Object.keys(answers).forEach((k) => {
      if (k.endsWith('_marks') || k.endsWith('_images') || k.startsWith('_')) return;
      const val = answers[k];
      const hasAnswer = val !== undefined && val !== null && val !== '' && val !== 'No answer provided' && (typeof val !== 'object' || Object.keys(val).length > 0);
      if (hasAnswer) {
        const rawId = k.split('_')[0];
        const q = qMap.get(k) || qMap.get(rawId);
        if (q && q.subject) {
          attemptedSubjs.add(q.subject);
          const subConfig = msSubjects.find(s => s.name?.toLowerCase().trim() === q.subject?.toLowerCase().trim());
          if (subConfig && !subConfig.isMandatory) {
            attemptedOptSubjs.add(q.subject);
          }
        }
      }
    });

    const maxAllowedOptional = Number((exam.subjectsConfig as any)?.requiredOptionalCount) || 1;
    const isExceeding = attemptedOptSubjs.size > maxAllowedOptional;

    return {
      attemptedOptionalSubjects: attemptedOptSubjs,
      attemptedSubjects: attemptedSubjs,
      isExceedingOptional: isExceeding
    };
  }, [isMS, answers, exam.questions, msSubjects, exam.subjectsConfig]);

  // Filtered sorted questions based on selectedSubject
  const filteredSortedQuestions = useMemo(() => {
    if (!isMS || selectedSubject === 'ALL') {
      return sortedQuestions;
    }
    return sortedQuestions.filter((q: any) => (q.subject || '').toLowerCase().trim() === selectedSubject.toLowerCase().trim());
  }, [isMS, selectedSubject, sortedQuestions]);

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
    filteredSortedQuestions,
    setOrderedQuestions,
    switchExamSet,
    fullSortedQuestions,
    groupedQuestions,
    isMS,
    msSubjects,
    selectedSubject,
    setSelectedSubject,
    attemptedOptionalSubjects,
    attemptedSubjects,
    isExceedingOptional
  }), [
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
    filteredSortedQuestions,
    setOrderedQuestions,
    switchExamSet,
    fullSortedQuestions,
    groupedQuestions,
    isMS,
    msSubjects,
    selectedSubject,
    setSelectedSubject,
    attemptedOptionalSubjects,
    attemptedSubjects,
    isExceedingOptional
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