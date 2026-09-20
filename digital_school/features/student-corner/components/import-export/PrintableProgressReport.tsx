'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface PrintableProgressReportProps {
  studentName: string;
  registrationNo?: string;
  className?: string;
  weekRange?: string;
  completionRate?: number;
  totalCompleted?: number;
  totalMissed?: number;
  totalPlanned?: number;
  totalFocusHours?: number;
  categoryBreakdown?: { category: string; count: number; hours: number; rate: number }[];
}

export function PrintableProgressReport({
  studentName,
  registrationNo = 'DS-2026-084',
  className = 'Class 12 - Science',
  weekRange = 'Current Week / Month Summary',
  completionRate = 86,
  totalCompleted = 38,
  totalMissed = 6,
  totalPlanned = 44,
  totalFocusHours = 28.5,
  categoryBreakdown = [
    { category: 'Higher Mathematics', count: 12, hours: 10.5, rate: 92 },
    { category: 'Physics 1st & 2nd', count: 10, hours: 8.0, rate: 85 },
    { category: 'Coding & Algorithms', count: 8, hours: 6.0, rate: 88 },
    { category: 'Islamic Daily Routine', count: 14, hours: 4.0, rate: 95 },
  ],
}: PrintableProgressReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = format(new Date(), 'dd MMMM yyyy');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Print Control Bar (Hidden on print) */}
      <div className="no-print flex items-center justify-between p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
        <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
          Ready to export or print. The document uses high-resolution formal report styling.
        </p>
        <Button
          onClick={handlePrint}
          className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </Button>
      </div>

      {/* Formal Printable Document */}
      <div className="p-8 sm:p-12 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Student Corner
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mt-0.5">
              Personal Academic Progress & Discipline Report
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Report Date: {currentDate}</p>
            <p>Period: {weekRange}</p>
          </div>
        </div>

        {/* Student Metadata Table */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-500 block font-medium">Student Name</span>
            <span className="font-extrabold text-sm text-slate-900">{studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Registration No</span>
            <span className="font-bold text-slate-800 font-mono">{registrationNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Academic Class</span>
            <span className="font-bold text-slate-800">{className}</span>
          </div>
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-4 gap-3 text-center mb-8">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <p className="text-2xl font-black text-slate-900">{completionRate}%</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Completion Rate
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <p className="text-2xl font-black text-emerald-700">{totalCompleted}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Completed Tasks
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <p className="text-2xl font-black text-rose-700">{totalMissed}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Missed / Incomplete
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <p className="text-2xl font-black text-indigo-700">{totalFocusHours}h</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Total Focus Time
            </p>
          </div>
        </div>

        {/* Subject & Category Breakdown Table */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b pb-1.5">
            Subject & Discipline Breakdown
          </h3>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-bold">
                <th className="py-2">Category / Subject</th>
                <th className="py-2 text-center">Tasks</th>
                <th className="py-2 text-center">Hours Logged</th>
                <th className="py-2 text-right">Consistency Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categoryBreakdown.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 font-bold text-slate-900">{item.category}</td>
                  <td className="py-2.5 text-center text-slate-700">{item.count}</td>
                  <td className="py-2.5 text-center text-slate-700">{item.hours}h</td>
                  <td className="py-2.5 text-right font-mono font-bold text-indigo-700">
                    {item.rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Affirmation & Sign-off */}
        <div className="mt-12 pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Digital School Academic Management</p>
            <p className="text-[10px]">Verified System-Generated Record</p>
          </div>
          <div className="text-right">
            <div className="w-36 border-b border-slate-400 mb-1" />
            <p className="text-[10px]">Student / Guardian Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
