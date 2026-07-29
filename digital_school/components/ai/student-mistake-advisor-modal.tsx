'use client';

import React, { useState } from 'react';

interface MistakeTopic {
  topic: string;
  errorCount: number;
}

interface DiagnosisData {
  summary: string;
  topWeakTopics: string[];
  errorBreakdown: string[];
  recommendedActionPlan: string[];
  rawText?: string;
}

interface AnalysisResult {
  studentName: string;
  examTitle: string;
  score: string;
  accuracyPercentage: string;
  topMistakeTopics: MistakeTopic[];
  diagnosis: DiagnosisData;
}

interface StudentMistakeAdvisorModalProps {
  studentId: string;
  examId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentMistakeAdvisorModal({
  studentId,
  examId,
  isOpen,
  onClose,
}: StudentMistakeAdvisorModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/mistake-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, examId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze mistakes');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing mistakes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Error & Topic Advisor</h3>
              <p className="text-xs text-slate-400">Powered by Local Capable Small Model (SLM)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {!result && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-300">
                Analyze your exam performance to identify your most mistaken topics and get personalized study recommendations.
              </p>
              <button
                onClick={handleAnalyze}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
              >
                🔍 Analyze My Exam Mistakes
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-sm text-slate-400">Analyzing exam errors & loading local SLM insights...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Score Badge Card */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Exam Result
                  </span>
                  <h4 className="text-base font-medium text-white">{result.examTitle}</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-400">{result.score}</span>
                  <span className="ml-2 text-xs font-medium text-purple-300">
                    ({result.accuracyPercentage})
                  </span>
                </div>
              </div>

              {/* Weak Topics */}
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  ⚠️ Most Mistaken Topics
                </h5>
                <div className="flex flex-wrap gap-2">
                  {result.topMistakeTopics.length > 0 ? (
                    result.topMistakeTopics.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300"
                      >
                        {t.topic} ({t.errorCount} {t.errorCount === 1 ? 'error' : 'errors'})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400">No major mistake patterns detected! Great job.</span>
                  )}
                </div>
              </div>

              {/* Error Breakdown */}
              {result.diagnosis.errorBreakdown.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    🔍 Why Errors Occurred
                  </h5>
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
                    {result.diagnosis.errorBreakdown.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-rose-400">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action Plan */}
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  🎯 Action Plan for Next Exam
                </h5>
                <div className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-200">
                  {result.diagnosis.recommendedActionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
