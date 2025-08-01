"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

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

export function ExamContextProvider({ exam, children }: { exam: any; children: React.ReactNode }) {
  const [answers, setAnswers] = useState<any>({});
  const [navigation, setNavigation] = useState<any>({ current: 0, marked: {} });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [isSyncPending, setIsSyncPending] = useState(false);
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('md');
  const [highContrast, setHighContrast] = useState(false);
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

  // Autosave answers (debounced)
  useDebouncedEffect(() => {
    if (Object.keys(answers).length > 0) {
      if (!isOnline) {
        setIsSyncPending(true);
        setSaveStatus("idle");
        return;
      }
      setSaveStatus("saving");
      fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save");
          setSaveStatus("saved");
          setIsSyncPending(false);
          setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch(() => {
          setSaveStatus("error");
          setIsSyncPending(true);
        });
    }
  }, [answers, isOnline], 2000);

  // When back online, sync pending answers
  useEffect(() => {
    if (isOnline && isSyncPending && Object.keys(answers).length > 0) {
      setSaveStatus("saving");
      fetch(`/api/exams/${exam.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save");
          setSaveStatus("saved");
          setIsSyncPending(false);
          setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch(() => {
          setSaveStatus("error");
          setIsSyncPending(true);
        });
    }
  }, [isOnline]);

  return (
    <ExamContext.Provider value={{ exam, answers, setAnswers, navigation, setNavigation, saveStatus, isOnline, isSyncPending, fontSize, setFontSize, highContrast, setHighContrast }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExamContext() {
  return useContext(ExamContext);
} 