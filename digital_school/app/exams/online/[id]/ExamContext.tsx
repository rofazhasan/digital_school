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
  children 
}: { 
  exam: any; 
  children: React.ReactNode;
}) {
  const [answers, setAnswers] = useState<any>({});
  const [navigation, setNavigation] = useState<any>({ current: 0, marked: {} });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('md');
  const [highContrast, setHighContrast] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({ cq: 0, sq: 0 });
  
  const localKey = `exam-answers-${exam.id}`;
  const navigationKey = `exam-navigation-${exam.id}`;

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

  // Simple autosave with Appwrite image handling
  const saveAnswers = useCallback(async (answersToSave: any) => {
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
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [exam.id]);

  // Autosave answers (debounced)
  useDebouncedEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveAnswers(answers);
    }
  }, [answers, saveAnswers], 2000); // 2 second debounce

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
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    questionCounts,
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