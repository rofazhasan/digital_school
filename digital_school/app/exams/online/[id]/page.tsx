"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExamLayout from "./ExamLayout";
import { ExamContextProvider } from "./ExamContext";

// Network stability monitoring
const useNetworkStability = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastPing, setLastPing] = useState<number>(Date.now());

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;
    let qualityCheckInterval: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        const start = performance.now();
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const end = performance.now();
        const latency = end - start;
        
        setLastPing(Date.now());
        
        if (latency < 100) {
          setConnectionQuality('good');
        } else if (latency < 1000) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        setConnectionQuality('offline');
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Initial check
    checkConnection();

    // Set up intervals
    pingInterval = setInterval(checkConnection, 10000); // Check every 10 seconds
    qualityCheckInterval = setInterval(() => {
      if (isOnline) checkConnection();
    }, 30000); // Quality check every 30 seconds

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(pingInterval);
      clearInterval(qualityCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, connectionQuality, lastPing };
};

// Optimized exam data fetching with retry logic
const fetchExamData = async (id: string, retryCount = 0): Promise<any> => {
  const maxRetries = 3;
  const baseDelay = 1000;

  try {
    const timestamp = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const res = await fetch(`/api/exams/online/${id}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      credentials: 'include',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (data.questions && Array.isArray(data.questions)) {
      // Filter out questions without valid IDs and optimize data structure
      const validQuestions = data.questions
        .filter((q: any) => q && q.id && q.id.trim() !== '')
        .map((q: any) => ({
          ...q,
          // Pre-compute normalized text for better performance
          normalizedText: (q.text || q.questionText || '').toLowerCase().trim(),
          // Pre-compute option hashes for faster comparison
          optionHashes: q.options ? q.options.map((opt: any) => 
            typeof opt === 'object' ? opt.text || String(opt) : String(opt)
          ) : []
        }));
      
      return {
        ...data,
        questions: validQuestions,
        // Add metadata for performance optimization
        questionCounts: {
          mcq: validQuestions.filter((q: any) => (q.type || '').toLowerCase() === 'mcq').length,
          cq: validQuestions.filter((q: any) => (q.type || '').toLowerCase() === 'cq').length,
          sq: validQuestions.filter((q: any) => (q.type || '').toLowerCase() === 'sq').length
        }
      };
    }
    
    return data;
  } catch (error: any) {
    if (retryCount < maxRetries && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchExamData(id, retryCount + 1);
    }
    throw error;
  }
};

export default function OnlineExamPage({ params }: { params: Promise<{ id: string }> }) {
  const [exam, setExam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  
  const { isOnline, connectionQuality, lastPing } = useNetworkStability();

  // Memoized exam loading function
  const loadExam = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        const examKey = `exam-answers-${id}`;
        const navigationKey = `exam-navigation-${id}`;
        localStorage.removeItem(examKey);
        localStorage.removeItem(navigationKey);
      }
      
      const examData = await fetchExamData(id);
      
      // Check if student has already submitted and exam doesn't allow retake
      if (examData.hasSubmitted && !examData.allowRetake) {
        router.push(`/exams/results/${id}`);
        return;
      }
      
      setExam(examData);
      setRetryCount(0);
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error";
      setError(errorMessage);
      
      // Auto-retry on network errors
      if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Auto-retry logic
  useEffect(() => {
    if (error && retryCount < 3 && isOnline) {
      const timer = setTimeout(() => {
        if (exam?.id) {
          loadExam(exam.id);
        }
      }, 2000 * (retryCount + 1)); // Progressive delay
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, isOnline, exam?.id, loadExam]);

  useEffect(() => {
    const initializeExam = async () => {
      const { id } = await params;
      await loadExam(id);
    };
    
    initializeExam();
  }, [params, loadExam]);

  // Network status indicator
  const NetworkStatus = () => (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
      connectionQuality === 'good' ? 'bg-green-500 text-white' :
      connectionQuality === 'poor' ? 'bg-yellow-500 text-black' :
      'bg-red-500 text-white'
    }`}>
      {connectionQuality === 'good' ? '🟢 Good Connection' :
       connectionQuality === 'poor' ? '🟡 Poor Connection' :
       '🔴 Offline'}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
        <div className="text-lg text-gray-700 mb-2">Loading exam...</div>
        {!isOnline && (
          <div className="text-sm text-red-600">Network connection lost. Retrying...</div>
        )}
        {retryCount > 0 && (
          <div className="text-sm text-yellow-600">Retry attempt {retryCount}/3</div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-2xl text-red-600 mb-4">⚠️ Error Loading Exam</div>
        <div className="text-gray-700 mb-4 text-center max-w-md">{error}</div>
        {isOnline && (
          <button
            onClick={() => exam?.id && loadExam(exam.id)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        )}
        {!isOnline && (
          <div className="text-sm text-red-600">Please check your internet connection and try again.</div>
        )}
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No exam found.
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
      <ExamContextProvider exam={exam} networkStatus={{ isOnline, connectionQuality, lastPing }}>
        <ExamLayout />
      </ExamContextProvider>
    </>
  );
}
