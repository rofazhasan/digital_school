"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const ExamContext = createContext<any>(null);

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
  exam, 
  children, 
  networkStatus 
}: { 
  exam: any; 
  children: React.ReactNode;
  networkStatus?: {
    isOnline: boolean;
    connectionQuality: 'good' | 'poor' | 'offline';
    lastPing: number;
  };
}) {
  const [answers, setAnswers] = useState<any>({});
  const [navigation, setNavigation] = useState<any>({ current: 0, marked: {} });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [isSyncPending, setIsSyncPending] = useState(false);
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('md');
  const [highContrast, setHighContrast] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({ cq: 0, sq: 0 });
  const [pendingSaves, setPendingSaves] = useState<Array<{ answers: any; timestamp: number }>>([]);
  const [lastSuccessfulSave, setLastSuccessfulSave] = useState<number>(Date.now());
  
  const localKey = `exam-answers-${exam.id}`;
  const navigationKey = `exam-navigation-${exam.id}`;

  // Use network status from parent if provided
  useEffect(() => {
    if (networkStatus) {
      setIsOnline(networkStatus.isOnline);
    }
  }, [networkStatus]);

  // Load answers and navigation from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Load answers
    const savedAnswers = localStorage.getItem(localKey);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch {}
    }
    
    // Load navigation state
    const savedNavigation = localStorage.getItem(navigationKey);
    if (savedNavigation) {
      try {
        const parsedNavigation = JSON.parse(savedNavigation);
        setNavigation(parsedNavigation);
      } catch {}
    }
  }, [localKey, navigationKey]);

  // Save answers to localStorage on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(localKey, JSON.stringify(answers));
  }, [answers, localKey]);

  // Save navigation state to localStorage on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(navigationKey, JSON.stringify(navigation));
  }, [navigation, navigationKey]);

  // Track online/offline state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Enhanced autosave with offline queue and Appwrite image handling
  const saveAnswers = useCallback(async (answersToSave: any, force = false) => {
    if (!isOnline && !force) {
      // Queue for later when online
      setPendingSaves(prev => [...prev, { answers: answersToSave, timestamp: Date.now() }]);
      setIsSyncPending(true);
      return;
    }

    try {
      setSaveStatus("saving");
      
      // Process answers to include Appwrite image information
      const processedAnswers = { ...answersToSave };
      
      // Extract Appwrite image data for questions with images
      Object.keys(processedAnswers).forEach(key => {
        if (key.endsWith('_images') && Array.isArray(processedAnswers[key])) {
          processedAnswers[key] = processedAnswers[key].map((img: any) => ({
            appwriteFileId: img.appwriteFileId,
            appwriteUrl: img.appwriteUrl,
            appwriteFilename: img.appwriteFilename,
            timestamp: img.timestamp,
            questionId: img.questionId,
            questionText: img.questionText,
            uploadedAt: img.uploadedAt,
            // Keep preview for fallback if needed
            preview: img.preview
          }));
        }
      });
      
      const response = await fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: processedAnswers }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      setSaveStatus("saved");
      setIsSyncPending(false);
      setLastSuccessfulSave(Date.now());
      
      // Clear pending saves on successful save
      setPendingSaves([]);
      
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
      setIsSyncPending(true);
      
      // Add to pending saves if not already there
      setPendingSaves(prev => {
        const exists = prev.some(p => JSON.stringify(p.answers) === JSON.stringify(answersToSave));
        if (!exists) {
          return [...prev, { answers: answersToSave, timestamp: Date.now() }];
        }
        return prev;
      });
    }
  }, [exam.id, isOnline]);

  // Process pending saves when coming back online
  useEffect(() => {
    if (isOnline && pendingSaves.length > 0) {
      const processPendingSaves = async () => {
        for (const pending of pendingSaves) {
          try {
            await saveAnswers(pending.answers, true);
            // Small delay between saves to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error("Failed to process pending save:", error);
          }
        }
      };
      
      processPendingSaves();
    }
  }, [isOnline, pendingSaves, saveAnswers]);

  // Autosave answers (debounced)
  useDebouncedEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveAnswers(answers);
    }
  }, [answers, saveAnswers], 2000); // Increased debounce for better performance

  // Enhanced navigation with performance optimizations
  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < (exam.questions?.length || 0)) {
      setNavigation(prev => ({ ...prev, current: index }));
    }
  }, [exam.questions?.length]);

  const markQuestion = useCallback((questionId: string, marked: boolean) => {
    setNavigation(prev => ({
      ...prev,
      marked: {
        ...prev.marked,
        [questionId]: marked
      }
    }));
  }, []);

  // Performance-optimized question filtering
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

  const contextValue = {
    exam,
    answers,
    setAnswers,
    navigation,
    setNavigation,
    saveStatus,
    isSyncPending,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    questionCounts,
    isOnline,
    pendingSaves,
    lastSuccessfulSave,
    navigateToQuestion,
    markQuestion,
    getQuestionsByType,
    saveAnswers
  };

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