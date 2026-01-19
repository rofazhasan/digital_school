"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExamLayout from "./ExamLayout";
import { ExamContextProvider } from "./ExamContext";

export default function OnlineExamPage({ params }: { params: Promise<{ id: string }> }) {
  const [exam, setExam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        setError(null);

        const { id } = await params;
        const res = await fetch(`/api/exams/online/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(`Failed to load exam: ${res.status}`);
        }

        const examData = await res.json();

        // Check for server-side redirect directive
        if (examData.redirect) {
          router.replace(examData.redirect);
          return;
        }

        // Check if student has already submitted (fallback)
        if (examData.hasSubmitted && !examData.allowRetake) {
          router.push(`/exams/results/${id}`);
          return;
        }

        setExam(examData);
      } catch (err: any) {
        setError(err.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
        <div className="text-lg text-gray-700">Loading exam...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-2xl text-red-600 mb-4">⚠️ Error Loading Exam</div>
        <div className="text-gray-700 mb-4 text-center max-w-md">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
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
    <ExamContextProvider exam={exam}>
      <ExamLayout />
    </ExamContextProvider>
  );
}
