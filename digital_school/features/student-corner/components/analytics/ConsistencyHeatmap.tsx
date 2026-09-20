'use client';

import React, { useState } from 'react';
import { HeatmapDayData } from '../../types';
import { format, parseISO } from 'date-fns';
import { Table, Eye, EyeOff } from 'lucide-react';

export type HeatmapMetric = 'completion' | 'focus' | 'study' | 'coding' | 'challenges';

interface ConsistencyHeatmapProps {
  data: HeatmapDayData[];
  year?: number;
}

export function ConsistencyHeatmap({ data, year = new Date().getFullYear() }: ConsistencyHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('completion');
  const [hoveredDay, setHoveredDay] = useState<HeatmapDayData | null>(null);
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  // Intensity color maps
  const getCellColor = (day: HeatmapDayData) => {
    if (day.completedCount === 0 && day.count === 0 && day.focusMinutes === 0) {
      return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-800';
    }

    if (selectedMetric === 'completion') {
      if (day.level === 4) return 'bg-emerald-500 border-emerald-600';
      if (day.level === 3) return 'bg-emerald-400 dark:bg-emerald-600 border-emerald-500';
      if (day.level === 2) return 'bg-emerald-300 dark:bg-emerald-700 border-emerald-400';
      return 'bg-emerald-200 dark:bg-emerald-900/80 border-emerald-300';
    }

    if (selectedMetric === 'focus' || selectedMetric === 'study') {
      if (day.focusMinutes >= 180) return 'bg-indigo-600 border-indigo-700';
      if (day.focusMinutes >= 120) return 'bg-indigo-500 border-indigo-600';
      if (day.focusMinutes >= 60) return 'bg-indigo-400 border-indigo-500';
      if (day.focusMinutes > 0) return 'bg-indigo-200 dark:bg-indigo-900 border-indigo-300';
      return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-800';
    }

    if (selectedMetric === 'coding') {
      // Specialized coding color scale (violet/fuchsia)
      if (day.focusMinutes >= 120 || day.completedCount >= 5) return 'bg-fuchsia-600 border-fuchsia-700';
      if (day.focusMinutes >= 60 || day.completedCount >= 3) return 'bg-fuchsia-500 border-fuchsia-600';
      if (day.focusMinutes >= 30 || day.completedCount >= 1) return 'bg-fuchsia-400 border-fuchsia-500';
      if (day.completedCount > 0) return 'bg-fuchsia-200 dark:bg-fuchsia-950 border-fuchsia-300';
      return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-800';
    }

    // Challenges / Count metric (cyan/teal)
    if (day.completedCount >= 8) return 'bg-cyan-500 border-cyan-600';
    if (day.completedCount >= 5) return 'bg-cyan-400 border-cyan-500';
    if (day.completedCount >= 2) return 'bg-cyan-300 border-cyan-400';
    if (day.completedCount > 0) return 'bg-cyan-200 dark:bg-cyan-900 border-cyan-300';
    return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-800';
  };

  // Group into weeks (7 days per column)
  const weeks: HeatmapDayData[][] = [];
  let currentWeek: HeatmapDayData[] = [];

  for (let i = 0; i < data.length; i++) {
    currentWeek.push(data[i]);
    if (currentWeek.length === 7 || i === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Active days summary
  const totalActiveDays = data.filter((d) => d.completedCount > 0 || d.focusMinutes > 0).length;
  const totalFocusHours = Math.round((data.reduce((acc, d) => acc + d.focusMinutes, 0) / 60) * 10) / 10;
  const totalCompletedChallenges = data.reduce((acc, d) => acc + d.completedCount, 0);

  return (
    <section aria-labelledby="heatmap-heading" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="heatmap-heading" className="font-extrabold text-base text-slate-900 dark:text-white">
              365-Day Consistency Heatmap ({year})
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200/60">
              {totalActiveDays} Active Days
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discipline visualized. {totalCompletedChallenges} challenges finished • {totalFocusHours}h focused across {year}.
          </p>
        </div>

        {/* Action controls & Metric selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Accessible Table Toggle */}
          <button
            type="button"
            onClick={() => setShowAccessibleTable(!showAccessibleTable)}
            aria-pressed={showAccessibleTable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle screen-reader accessible table view"
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showAccessibleTable ? 'Grid View' : 'Table View'}</span>
          </button>

          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-semibold" role="tablist" aria-label="Heatmap Metric Switcher">
            {(
              [
                { key: 'completion', label: 'Completion %' },
                { key: 'focus', label: 'Focus Time' },
                { key: 'study', label: 'Study' },
                { key: 'coding', label: 'Coding' },
                { key: 'challenges', label: 'Challenges' },
              ] as const
            ).map((metric) => (
              <button
                key={metric.key}
                role="tab"
                aria-selected={selectedMetric === metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedMetric === metric.key
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAccessibleTable ? (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto max-h-96 pb-2 border rounded-2xl border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-900 dark:text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Challenges Done</th>
                <th className="px-4 py-2.5">Total Challenges</th>
                <th className="px-4 py-2.5">Completion Rate</th>
                <th className="px-4 py-2.5">Focus Minutes</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {data
                .filter((d) => d.completedCount > 0 || d.focusMinutes > 0)
                .slice(-60)
                .reverse()
                .map((day) => (
                  <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2 font-mono text-slate-900 dark:text-white">
                      {format(parseISO(day.date), 'yyyy-MM-dd (EEE)')}
                    </td>
                    <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400 font-bold">{day.completedCount}</td>
                    <td className="px-4 py-2">{day.count}</td>
                    <td className="px-4 py-2">{day.completionRate}%</td>
                    <td className="px-4 py-2 font-mono">{day.focusMinutes}m</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          day.level >= 3
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Level {day.level}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-400 p-3 italic">
            Showing most recent 60 active dates in tabular format for accessibility and screen readers.
          </p>
        </div>
      ) : (
        /* Heatmap Grid */
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="inline-flex gap-1.5 min-w-[720px]" role="grid" aria-label="365 Day Activity Grid">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5" role="row">
                {week.map((day) => {
                  const label = `${format(parseISO(day.date), 'MMM d, yyyy')}: ${day.completedCount}/${day.count} completed, ${day.focusMinutes}m focus`;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      tabIndex={0}
                      role="gridcell"
                      aria-label={label}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onFocus={() => setHoveredDay(day)}
                      onBlur={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 rounded-xs border transition-all hover:scale-125 focus:scale-125 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer ${getCellColor(
                        day
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend & Hover Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div>
          {hoveredDay ? (
            <span className="font-semibold text-slate-900 dark:text-white">
              {format(parseISO(hoveredDay.date), 'MMMM d, yyyy')}:{' '}
              {hoveredDay.completedCount} / {hoveredDay.count} challenges ({hoveredDay.completionRate}%),{' '}
              {Math.round((hoveredDay.focusMinutes / 60) * 10) / 10}h focused
            </span>
          ) : (
            <span>Hover or keyboard tab over any day square to inspect metrics</span>
          )}
        </div>

        <div className="flex items-center gap-2" aria-hidden="true">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200/50" />
            <div className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-700" />
            <div className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
