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
  const { answers, navigation, navigateToQuestion, sortedQuestions } = useExamContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const questionList = sortedQuestions || questions || [];

  if (questionList.length === 0) return null;

  return (
    <Card className={`
          border-l border-gray-200/50 dark:border-gray-800/50 h-full flex flex-col bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-72 lg:w-80'}
          fixed right-0 top-0 bottom-0 z-30
        `}>
      {/* Navigator Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-white/50 dark:bg-gray-950/50 backdrop-blur-md">
        {!isCollapsed && (
          <div className="flex flex-col">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight">Question Navigator</h3>
            <span className="text-xs text-gray-500 font-medium">
              {Object.keys(answers).length}/{questionList.length} Attempted
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-500"
        >
          {isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Question Grid */}
      <ScrollArea className="flex-1 p-3 md:p-4">
        <div className={`grid gap-2 md:gap-3 transition-all ${isCollapsed ? 'grid-cols-1' : 'grid-cols-4 md:grid-cols-5'}`}>
          {questionList.map((q: any, i: number) => {
            const isCurrent = (navigation.current || 0) === i;
            const isAnswered = answers[q.id];
            const isMarked = navigation.marked[q.id];
            const isVisited = navigation.visited?.[q.id];

            return (
              <button
                key={q.id}
                onClick={() => navigateToQuestion(i)}
                className={`
                    relative flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300
                    ${isCollapsed ? 'w-10 h-10 mx-auto' : 'aspect-square w-full'}
                    ${isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110 ring-2 ring-blue-200 dark:ring-blue-900 z-10'
                    : isMarked
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-400 dark:bg-amber-900/30 dark:text-amber-400'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : isVisited
                          ? 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                          : 'bg-gray-50 border border-gray-100 text-gray-400 hover:border-gray-300 dark:bg-gray-900/50 dark:border-gray-800'
                  }
                  `}
              >
                {i + 1}

                {/* Status Indicator Dot */}
                {isMarked && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Legend & Action Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md space-y-4">
          <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Current
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-300"></div> Answered
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-400"></div> Marked
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-50 border border-gray-200"></div> Not Visited
            </div>
          </div>

          {onSubmit && (
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={onSubmit}
            >
              Finish Exam
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}