"use client";

import React, { useState } from "react";
import { useExamContext } from "./ExamContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigatorProps {
  questions?: any[];
  onSubmit?: () => void;
}

export default function Navigator({ questions, onSubmit }: NavigatorProps) {
  const { answers, navigation, navigateToQuestion, groupedQuestions, sortedQuestions } = useExamContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const questionList = sortedQuestions || questions || [];
  if (questionList.length === 0) return null;

  // Helper to render a group of questions
  const renderGroup = (title: string, groupQuestions: any[], startIndex: number) => {
    if (!groupQuestions || groupQuestions.length === 0) return null;

    return (
      <div className="mb-6">
        {!isCollapsed && (
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 sticky top-0 bg-white/95 dark:bg-gray-950/95 py-1 z-20 backdrop-blur-sm">
            {title}
          </h4>
        )}
        <div className={`grid gap-2 md:gap-3 transition-all ${isCollapsed ? 'grid-cols-1' : 'grid-cols-5'}`}>
          {groupQuestions.map((q: any, localIdx: number) => {
            // Find the global index of this question in the sorted list
            const globalIdx = sortedQuestions.findIndex((sq: any) => sq.id === q.id);
            if (globalIdx === -1) return null;

            const isCurrent = (navigation.current || 0) === globalIdx;
            const isAnswered = answers[q.id];
            const isMarked = navigation.marked[q.id];

            return (
              <button
                key={q.id}
                onClick={() => navigateToQuestion(globalIdx)}
                className={`
                    relative flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200
                    ${isCollapsed ? 'w-8 h-8 mx-auto' : 'aspect-square w-full'}
                    ${isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-200 dark:ring-blue-900 z-10'
                    : isMarked
                      ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-50 border border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-blue-50 dark:bg-gray-900/50 dark:border-gray-800'
                  }
                  `}
              >
                {localIdx + 1}
                {isMarked && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`
          flex flex-col bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl transition-all duration-300
          ${isCollapsed ? 'w-14 items-center' : 'w-full'}
          h-full max-h-full overflow-hidden
        `}>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-3 pb-20">
          {/* Render CQ Group */}
          {groupedQuestions?.creative?.length > 0 && renderGroup("Creative (CQ)", groupedQuestions.creative, 0)}

          {/* Render SQ Group */}
          {groupedQuestions?.short?.length > 0 && renderGroup("Short (SQ)", groupedQuestions.short, 0)}

          {/* Render Objective Group */}
          {groupedQuestions?.objective?.length > 0 && renderGroup("Objective (MCQ)", groupedQuestions.objective, 0)}

          {/* Fallback if no groups defined (legacy support) */}
          {(!groupedQuestions || (groupedQuestions.creative.length === 0 && groupedQuestions.short.length === 0 && groupedQuestions.objective.length === 0)) &&
            renderGroup("Questions", questionList, 0)
          }
        </div>
      </ScrollArea>

      {/* Footer Legend */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md text-[10px] space-y-2">
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Answered</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Marked</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-200"></span> Remaining</span>
          </div>

          {onSubmit && (
            <Button
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
              size="sm"
              onClick={onSubmit}
            >
              Finish Exam
            </Button>
          )}
        </div>
      )}
    </div>
  );
}