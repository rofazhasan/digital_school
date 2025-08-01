"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExamLayout from "./ExamLayout";
import { ExamContextProvider } from "./ExamContext";

const fetchExamData = async (id: string) => {
  // Add cache-busting parameter
  const timestamp = Date.now();
  const res = await fetch(`/api/exams/online/${id}?t=${timestamp}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    credentials: 'include'
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Failed to fetch exam data");
  }
  
  const data = await res.json();
  
  if (data.questions && Array.isArray(data.questions)) {
    // Filter out questions without valid IDs
    const validQuestions = data.questions.filter((q: any) => q && q.id && q.id.trim() !== '');
    
    // Return data with only valid questions
    return {
      ...data,
      questions: validQuestions
    };
  }
  
  return data;
};

export default function OnlineExamPage({ params }: { params: Promise<{ id: string }> }) {
  const [exam, setExam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadExam = async () => {
      try {
        const { id } = await params;
        setLoading(true);
        setError(null);
        
        // Clear any cached data
        if (typeof window !== 'undefined') {
          // Clear localStorage for this exam
          const examKey = `exam-answers-${id}`;
          const navigationKey = `exam-navigation-${id}`;
          localStorage.removeItem(examKey);
          localStorage.removeItem(navigationKey);
        }
        
        const examData = await fetchExamData(id);
        
        // Check if student has already submitted and exam doesn't allow retake
        if (examData.hasSubmitted && !examData.allowRetake) {
          // Redirect to results page
          router.push(`/exams/results/${id}`);
          return;
        }
        
        setExam(examData);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    loadExam();
  }, [params]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading exam...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-600">{error}</div>;
  if (!exam) return <div className="flex items-center justify-center h-screen">No exam found.</div>;

  return (
    <ExamContextProvider exam={exam}>
      <ExamLayout />
    </ExamContextProvider>
  );
}
