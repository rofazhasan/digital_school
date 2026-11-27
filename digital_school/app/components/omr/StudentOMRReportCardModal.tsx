"use client";

import React from 'react';
import { X, Printer, Award, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { StudentScoreCard } from '@/lib/omr/types';
import { toBengaliNumerals } from '@/utils/numeralConverter';

interface StudentOMRReportCardModalProps {
  scoreCard: StudentScoreCard;
  examName?: string;
  onClose: () => void;
}

export function StudentOMRReportCardModal({
  scoreCard,
  examName = 'OMR মূল্যায়ন ফলাফল পত্র',
  onClose,
}: StudentOMRReportCardModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const verdicts = Object.entries(scoreCard.questionVerdicts || {});

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar (Hidden when printing) */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>অফিসিয়াল শিক্ষার্থী OMR স্কোরকার্ড</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট / PDF সেভ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                OFFICIAL OMR ASSESSMENT TRANSCRIPT
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{examName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                তারিখ: {new Date().toLocaleDateString('bn-BD')} • শিট আইডি: {scoreCard.sheetId}
              </p>
            </div>
            <div className="text-right bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">প্রাপ্ত নম্বর</div>
              <div className="text-2xl font-black text-emerald-700">
                {toBengaliNumerals(scoreCard.totalScore)} / {toBengaliNumerals(scoreCard.maxScore || 100)}
              </div>
              <div className="text-[11px] font-bold text-slate-600">{scoreCard.percentage}%</div>
            </div>
          </div>

          {/* Candidate Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">পরীক্ষার্থীর নাম</div>
              <div className="font-bold text-slate-900 mt-0.5 truncate">
                {scoreCard.studentName || `Roll ${scoreCard.rollNumber}`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">রোল ও রেজিস্ট্রেশন</div>
              <div className="font-bold font-mono text-slate-900 mt-0.5">
                {scoreCard.rollNumber} {scoreCard.registrationNo ? `(${scoreCard.registrationNo})` : ''}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">প্রশ্ন সেট</div>
              <div className="font-bold text-indigo-700 mt-0.5">সেট {scoreCard.examSet || 'A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">মেধা ক্রম ও পার্সেন্টাইল</div>
              <div className="font-bold text-slate-900 mt-0.5">
                #{scoreCard.rank || '-'} {scoreCard.percentile !== undefined ? `(${scoreCard.percentile}%)` : ''}
              </div>
            </div>
          </div>

          {/* Accuracy Strip */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-800">সঠিক: {toBengaliNumerals(scoreCard.correctCount)}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-rose-800">ভুল: {toBengaliNumerals(scoreCard.incorrectCount)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center gap-2">
              <MinusCircle className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-700">অনুত্তরিত: {toBengaliNumerals(scoreCard.unmarkedCount)}</span>
            </div>
          </div>

          {/* Question-by-Question Matrix */}
          {verdicts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">প্রশ্নভিত্তিক উত্তর বিবরণী:</h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-[10px]">
                {verdicts.map(([qKey, v], idx) => {
                  const ok = v.verdict === 'correct' || v.verdict === 'bonus';
                  const bad = Boolean(v.studentAnswer) && !ok;
                  return (
                    <div
                      key={qKey}
                      className={`p-1.5 rounded border text-center ${
                        ok
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : bad
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="font-mono font-bold">Q{idx + 1}</div>
                      <div className="font-black text-xs">{v.studentAnswer || '-'}</div>
                      <div className="text-[9px] opacity-75">
                        ({Array.isArray(v.correctAnswer) ? v.correctAnswer[0] : v.correctAnswer})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Generated by Rofaz Academy OMR v3 Engine</span>
            <span>পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর: ___________________</span>
          </div>
        </div>
      </div>
    </div>
  );
}
