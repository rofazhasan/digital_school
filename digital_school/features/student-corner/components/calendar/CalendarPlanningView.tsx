'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlannedDaySummary {
  date: string; // YYYY-MM-DD
  count: number;
  totalPlannedMinutes: number;
  completedCount: number;
}

interface CalendarPlanningViewProps {
  initialSummaries?: PlannedDaySummary[];
}

export function CalendarPlanningView({ initialSummaries = [] }: CalendarPlanningViewProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const summaryMap = new Map<string, PlannedDaySummary>();
  initialSummaries.forEach((s) => summaryMap.set(s.date, s));

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Planning Horizon
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-xl h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-xl text-xs font-bold"
          >
            Current Month
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-xl h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const summary = summaryMap.get(dateKey);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            const plannedMinutes = summary?.totalPlannedMinutes || 0;
            const plannedHours = Math.round((plannedMinutes / 60) * 10) / 10;
            const isHeavyWorkload = plannedMinutes >= 480; // >8 hours

            return (
              <div
                key={dateKey}
                onClick={() => router.push(`/student/student-corner/arena?date=${dateKey}`)}
                className={`min-h-[90px] sm:min-h-[110px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth
                    ? 'opacity-30 border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20'
                    : isCurrentDay
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black ${
                      isCurrentDay
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {isHeavyWorkload && (
                    <span title="Heavy workload (>8h planned)">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                </div>

                {summary && summary.count > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      <span>{summary.count} tasks</span>
                      <span>{plannedHours}h</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{
                          width: `${summary.count > 0 ? (summary.completedCount / summary.count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 dark:text-slate-700 font-medium">
                    Rest / Open
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
