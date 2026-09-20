'use client';

import React from 'react';
import { PlanVsRealityItem, EstimationAccuracyData } from '../../types';
import { Scale, Clock, TrendingUp, Info } from 'lucide-react';

interface PlanVsRealityChartProps {
  items: PlanVsRealityItem[];
  estimation: EstimationAccuracyData;
}

export function PlanVsRealityChart({ items, estimation }: PlanVsRealityChartProps) {
  // Find max minutes for relative bar widths
  const maxMinutes = Math.max(
    ...items.map((i) => Math.max(i.plannedMinutes, i.actualMinutes)),
    60
  );

  return (
    <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Plan vs Reality & Estimation Accuracy
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Understanding your actual focus habits against initial plans.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-slate-500">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Actual Focus</span>
          </div>
        </div>
      </div>

      {/* Estimation Bias Insight Box (Item 16) */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-indigo-950 dark:text-indigo-200">
            Estimation Feedback
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {estimation.summaryInsight}
          </p>
        </div>
      </div>

      {/* Bars Comparison per Category */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No completed challenge data available for comparison yet.
          </p>
        ) : (
          items.map((item) => {
            const plannedWidth = Math.round((item.plannedMinutes / maxMinutes) * 100);
            const actualWidth = Math.round((item.actualMinutes / maxMinutes) * 100);
            const diff = item.differenceMinutes;

            return (
              <div key={item.category} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">
                      {Math.round((item.plannedMinutes / 60) * 10) / 10}h planned
                    </span>
                    <span>•</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((item.actualMinutes / 60) * 10) / 10}h actual
                    </span>
                    {diff !== 0 && (
                      <span
                        className={`font-semibold ${
                          diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ({diff > 0 ? `+${diff}m` : `${diff}m`})
                      </span>
                    )}
                  </div>
                </div>

                {/* Dual bar */}
                <div className="space-y-1">
                  {/* Planned bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-300 dark:bg-slate-700 h-full rounded-full transition-all"
                      style={{ width: `${plannedWidth}%` }}
                    />
                  </div>
                  {/* Actual bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${actualWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
