"use client";

import React from "react";
import { useExamContext } from "./ExamContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const getButtonColor = (q: any, answers: any, navigation: any, idx: number) => {
  if (navigation.current === idx) return "bg-black text-white border-black ring-2 ring-black";
  if (navigation.marked[q.id]) return "bg-purple-400 text-white";
  if (answers[q.id]) return "bg-green-400 text-white";
  return "bg-gray-200";
};

interface NavigatorProps {
  questions?: any[];
}

export default function Navigator({ questions }: NavigatorProps) {
  const { exam, answers, navigation } = useExamContext();
  const questionList = questions || [];

  // Categorize questions
  const mcqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq");
  const cqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq");
  const sqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq");

  return (
    <Card className="p-4 mb-4 hidden md:block">
      <div className="mb-4 font-bold text-base">Question Navigator</div>
      
      {/* MCQ Section */}
      {mcqQuestions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs">✓</span>
            MCQ ({mcqQuestions.length})
          </div>
          <div className="grid grid-cols-5 gap-2">
            {mcqQuestions.map((q: any, i: number) => {
              const globalIndex = questionList.findIndex((q2: any) => q2.id === q.id);
              return (
                <div
                  key={`nav-mcq-${i}-${q.id || 'no-id'}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-default ${getButtonColor(q, answers, navigation, globalIndex)}`}
                  title={`MCQ ${i + 1} of ${mcqQuestions.length} - ${navigation.current === globalIndex ? 'Current' : answers[q.id] ? 'Answered' : navigation.marked[q.id] ? 'Marked' : 'Not answered'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CQ Section */}
      {cqQuestions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-xs">✏️</span>
            CQ ({cqQuestions.length})
          </div>
          <div className="grid grid-cols-5 gap-2">
            {cqQuestions.map((q: any, i: number) => {
              const globalIndex = questionList.findIndex((q2: any) => q2.id === q.id);
              return (
                <div
                  key={`nav-cq-${i}-${q.id || 'no-id'}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-default ${getButtonColor(q, answers, navigation, globalIndex)}`}
                  title={`CQ ${i + 1} of ${cqQuestions.length} - ${navigation.current === globalIndex ? 'Current' : answers[q.id] ? 'Answered' : navigation.marked[q.id] ? 'Marked' : 'Not answered'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SQ Section */}
      {sqQuestions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-yellow-600 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center text-xs">💬</span>
            SQ ({sqQuestions.length})
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sqQuestions.map((q: any, i: number) => {
              const globalIndex = questionList.findIndex((q2: any) => q2.id === q.id);
              return (
                <div
                  key={`nav-sq-${i}-${q.id || 'no-id'}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-default ${getButtonColor(q, answers, navigation, globalIndex)}`}
                  title={`SQ ${i + 1} of ${sqQuestions.length} - ${navigation.current === globalIndex ? 'Current' : answers[q.id] ? 'Answered' : navigation.marked[q.id] ? 'Marked' : 'Not answered'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 text-xs space-y-1 border-t pt-2">
        <div><span className="inline-block w-3 h-3 bg-gray-200 mr-1 rounded"></span> Not answered</div>
        <div><span className="inline-block w-3 h-3 bg-green-400 mr-1 rounded"></span> Answered</div>
        <div><span className="inline-block w-3 h-3 bg-purple-400 mr-1 rounded"></span> Marked for review</div>
        <div><span className="inline-block w-3 h-3 bg-black mr-1 rounded"></span> Current question</div>
      </div>
    </Card>
  );
} 