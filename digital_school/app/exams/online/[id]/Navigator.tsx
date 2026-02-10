"use client";

import React, { useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import { Card } from "@/components/ui/card";

const getButtonColor = (q: any, answers: any, navigation: any, idx: number) => {
  if (navigation.current === idx) return "bg-black text-white ring-2 ring-offset-1 ring-black shadow-md scale-105";
  if (navigation.marked[q.id]) return "bg-amber-100 text-amber-700 border-amber-200 border";
  if (answers[q.id]) return "bg-indigo-50 text-indigo-700 border-indigo-200 border";
  return "bg-white text-gray-500 border-gray-200 border hover:bg-gray-50 hover:border-gray-300";
};

const QuestionButton = memo(({
  question,
  index,
  globalIndex,
  answers,
  navigation,
  onNavigate
}: {
  question: any;
  index: number;
  globalIndex: number;
  answers: any;
  navigation: any;
  onNavigate: (index: number) => void;
}) => {
  const buttonColor = getButtonColor(question, answers, navigation, globalIndex);

  const getTooltipText = () => {
    const type = (question.type || question.questionType || "").toLowerCase();
    const typeLabel = type === 'mcq' ? 'MCQ' : type === 'cq' ? 'CQ' : 'SQ';
    return `${typeLabel} ${index + 1}`;
  };

  return (
    <button
      onClick={() => onNavigate(globalIndex)}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 active:scale-95 ${buttonColor}`}
      title={getTooltipText()}
    >
      {index + 1}
    </button>
  );
});

QuestionButton.displayName = 'QuestionButton';

interface NavigatorProps {
  questions?: any[];
}

export default function Navigator({ questions }: NavigatorProps) {
  const { exam, answers, navigation, navigateToQuestion, sortedQuestions } = useExamContext();
  const questionList = sortedQuestions || questions || exam.questions || [];

  const categorizedQuestions = useMemo(() => {
    const mcqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "mcq");
    const cqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "cq");
    const sqQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "sq");
    const numericQuestions = questionList.filter((q: any) => (q.type || q.questionType || "").toLowerCase() === "numeric");

    return { mcqQuestions, cqQuestions, sqQuestions, numericQuestions };
  }, [questionList]);

  const handleNavigate = useCallback((index: number) => {
    navigateToQuestion(index);
  }, [navigateToQuestion]);

  const renderQuestionSection = useCallback((questions: any[], type: string, label: string) => {
    if (questions.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">
          {label}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q: any, i: number) => {
            const globalIndex = questionList.findIndex((q2: any) => q2.id === q.id);
            return (
              <QuestionButton
                key={`nav-${type}-${i}`}
                question={q}
                index={i}
                globalIndex={globalIndex}
                answers={answers}
                navigation={navigation}
                onNavigate={handleNavigate}
              />
            );
          })}
        </div>
      </div>
    );
  }, [questionList, answers, navigation, handleNavigate]);

  if (questionList.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-6">Question Navigator</h3>

      {renderQuestionSection(categorizedQuestions.mcqQuestions, 'MCQ', 'Multiple Choice')}
      {renderQuestionSection(categorizedQuestions.cqQuestions, 'CQ', 'Creative Questions')}
      {renderQuestionSection(categorizedQuestions.sqQuestions, 'SQ', 'Short Questions')}
      {renderQuestionSection(categorizedQuestions.numericQuestions, 'Numeric', 'Numeric Questions')}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black rounded-sm"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded-sm"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm"></div>
            <span>Marked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div>
            <span>Not Visited</span>
          </div>
        </div>
      </div>
    </div>
  );
} 