"use client";

import React, { useMemo, useCallback, memo } from "react";
import { useExamContext } from "./ExamContext";
import { Card } from "@/components/ui/card";

// Memoized button color calculation for better performance
const getButtonColor = (q: any, answers: any, navigation: any, idx: number) => {
  if (navigation.current === idx) return "bg-black text-white border-black ring-2 ring-black";
  if (navigation.marked[q.id]) return "bg-purple-400 text-white";
  if (answers[q.id]) return "bg-green-400 text-white";
  return "bg-gray-200 hover:bg-gray-300 transition-colors";
};

// Memoized question button component for better performance
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
  const isAnswered = answers[question.id];
  const isMarked = navigation.marked[question.id];
  const isCurrent = navigation.current === globalIndex;
  
  const getTooltipText = () => {
    const type = (question.type || question.questionType || "").toLowerCase();
    const typeLabel = type === 'mcq' ? 'MCQ' : type === 'cq' ? 'CQ' : 'SQ';
    const status = isCurrent ? 'Current' : isAnswered ? 'Answered' : isMarked ? 'Marked' : 'Not answered';
    return `${typeLabel} ${index + 1} - ${status}`;
  };

  return (
    <button
      onClick={() => onNavigate(globalIndex)}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${buttonColor}`}
      title={getTooltipText()}
      aria-label={getTooltipText()}
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
  const { exam, answers, navigation, navigateToQuestion } = useExamContext();
  const questionList = questions || exam.questions || [];

  // Memoized question categorization for better performance
  const categorizedQuestions = useMemo(() => {
    const mcqQuestions = questionList.filter((q: any) => 
      (q.type || q.questionType || "").toLowerCase() === "mcq"
    );
    const cqQuestions = questionList.filter((q: any) => 
      (q.type || q.questionType || "").toLowerCase() === "cq"
    );
    const sqQuestions = questionList.filter((q: any) => 
      (q.type || q.questionType || "").toLowerCase() === "sq"
    );

    return { mcqQuestions, cqQuestions, sqQuestions };
  }, [questionList]);

  // Memoized navigation handler
  const handleNavigate = useCallback((index: number) => {
    navigateToQuestion(index);
  }, [navigateToQuestion]);

  // Memoized section renderer for better performance
  const renderQuestionSection = useCallback((questions: any[], type: string, color: string, icon: string) => {
    if (questions.length === 0) return null;

    return (
      <div className="mb-4">
        <div className={`text-sm font-semibold ${color} mb-2 flex items-center gap-2`}>
          <span className={`w-4 h-4 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-full flex items-center justify-center text-xs`}>
            {icon}
          </span>
          {type.toUpperCase()} ({questions.length})
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q: any, i: number) => {
            const globalIndex = questionList.findIndex((q2: any) => q2.id === q.id);
            return (
              <QuestionButton
                key={`nav-${type}-${i}-${q.id || 'no-id'}`}
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

  // Memoized question counts for better performance
  const questionCounts = useMemo(() => ({
    mcq: categorizedQuestions.mcqQuestions.length,
    cq: categorizedQuestions.cqQuestions.length,
    sq: categorizedQuestions.sqQuestions.length
  }), [categorizedQuestions]);

  // Only render if there are questions
  if (questionList.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-4 hidden md:block bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <div className="mb-4 font-bold text-base text-gray-800">Question Navigator</div>
      
      {/* MCQ Section */}
      {renderQuestionSection(
        categorizedQuestions.mcqQuestions, 
        'MCQ', 
        'text-blue-600', 
        '✓'
      )}

      {/* CQ Section */}
      {renderQuestionSection(
        categorizedQuestions.cqQuestions, 
        'CQ', 
        'text-green-600', 
        '✏️'
      )}

      {/* SQ Section */}
      {renderQuestionSection(
        categorizedQuestions.sqQuestions, 
        'SQ', 
        'text-yellow-600', 
        '💬'
      )}

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Total Questions: {questionList.length}</div>
          <div>Answered: {Object.keys(answers).filter(id => answers[id]).length}</div>
          <div>Marked: {Object.keys(navigation.marked).filter(id => navigation.marked[id]).length}</div>
          <div>Current: {navigation.current + 1}</div>
        </div>
      </div>
    </Card>
  );
} 