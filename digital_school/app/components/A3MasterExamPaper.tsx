"use client";

import React, { forwardRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import { toBengaliNumerals, formatBengaliDuration } from "@/utils/numeralConverter";

export interface A3MasterExamPaperProps {
  examInfo: {
    id?: string;
    examId?: string;
    schoolName: string;
    schoolAddress?: string;
    title: string;
    subject?: string;
    class?: string;
    date?: string;
    set?: string;
    setId?: string;
    duration?: string;
    totalMarks?: string | number;
    mcqNegativeMarking?: number;
    objectiveTime?: number;
    qrData?: any;
  };
  questions: any[];
  fontSize?: number;
  hideInstitute?: boolean;
  duplexFlip?: 'short_edge' | 'long_edge';
  watermarkText?: string;
  showWatermark?: boolean;
}

// Helper to calculate balanced OMR columns for exact question count
function computeOmrColumns(total: number) {
  const safeTotal = Math.max(1, total);
  let numCols = 5;
  if (safeTotal <= 20) numCols = 2;
  else if (safeTotal <= 35) numCols = 3;
  else if (safeTotal <= 50) numCols = safeTotal === 50 ? 5 : 4;
  else numCols = 5;

  const baseRows = Math.floor(safeTotal / numCols);
  const remainder = safeTotal % numCols;

  const cols: { start: number; end: number; count: number }[] = [];
  let currentStart = 1;

  for (let c = 0; c < numCols; c++) {
    const colCount = baseRows + (c < remainder ? 1 : 0);
    if (colCount > 0) {
      cols.push({
        start: currentStart,
        end: currentStart + colCount - 1,
        count: colCount,
      });
      currentStart += colCount;
    }
  }

  const maxRows = Math.max(...cols.map(c => c.count), 1);
  return { numCols: cols.length, columns: cols, maxRows };
}

// Helper to normalize Bengali text and remove duplicate vowel diacritics / broken conjuncts
const cleanBengaliText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/([ািীুূৃেৈোৌ্ঁংঃ])\1+/g, "$1")
    .replace(/িি/g, "ি")
    .replace(/াা/g, "া")
    .replace(/েে/g, "ে")
    .replace(/ুু/g, "ু");
};

export const A3MasterExamPaper = forwardRef<HTMLDivElement, A3MasterExamPaperProps>(
  ({
    examInfo,
    questions = [],
    fontSize = 100,
    hideInstitute = false,
    duplexFlip = 'short_edge',
    watermarkText = '',
    showWatermark = false,
  }, ref) => {
    const rawSet = examInfo.set || 'A';
    const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
    const totalCount = questions.length;
    const totalMarks = examInfo.totalMarks || (totalCount > 0 ? totalCount : 100);
    const duration = examInfo.objectiveTime 
      ? formatBengaliDuration(examInfo.objectiveTime)
      : (examInfo.duration || '৬০ মিনিট');
    const negMarking = examInfo.mcqNegativeMarking !== undefined ? examInfo.mcqNegativeMarking : 0.25;

    // Dynamic OMR Column & Row Matrix Calculator
    const omrLayout = useMemo(() => computeOmrColumns(totalCount), [totalCount]);

    // Strict Dynamic Half-Split: Exactly half on front, remaining half on back
    const halfCount = Math.ceil(totalCount / 2);
    const part1Questions = questions.slice(0, halfCount);
    const part2Questions = questions.slice(halfCount);

    const perPage = Math.max(part1Questions.length, part2Questions.length, 1);
    const userScale = Math.max(0.65, Math.min(1.5, (fontSize || 100) / 100));

    // Dynamic Auto Font Scaling: Automatically scales larger if fewer questions, tighter if up to 50 questions
    const autoScale = useMemo(() => {
      if (perPage <= 15) return 1.25 * userScale;
      if (perPage <= 25) return 1.12 * userScale;
      if (perPage <= 35) return 1.02 * userScale;
      if (perPage <= 45) return 0.92 * userScale;
      return 0.84 * userScale;
    }, [perPage, userScale]);

    const qCardPaddingClass = perPage <= 20 ? 'py-1.5' : perPage <= 30 ? 'py-1' : 'py-0.5';

    const renderQuestionCard = (q: any, displayIndex: number) => {
      const qNum = displayIndex + 1;
      const qText = cleanBengaliText(q.q || q.questionText || q.text || '');
      const opts = q.options || [];

      // Determine option column layout based on text lengths
      const maxLen = opts.reduce((max: number, o: any) => {
        const text = typeof o === 'string' ? o : (o.text || '');
        return Math.max(max, text.length);
      }, 0);

      const optLayoutClass = maxLen <= 14 ? "grid-cols-4" : maxLen <= 32 ? "grid-cols-2" : "grid-cols-1";

      return (
        <div
          key={q.id || displayIndex}
          className={`break-inside-avoid ${qCardPaddingClass} border-b border-dotted border-slate-300 relative group`}
          style={{ fontSize: `${Math.round(11 * autoScale * 10) / 10}px`, lineHeight: 1.35 }}
        >
          <div className="flex items-start gap-1 font-semibold text-black">
            <span
              className="font-bold shrink-0 text-slate-900 select-none font-nikosh"
              style={{ fontSize: `${Math.round(11 * autoScale * 10) / 10}px` }}
            >
              {toBengaliNumerals(String(qNum).padStart(2, '0'))}.
            </span>
            <div
              className="flex-1 font-nikosh font-serif text-slate-950 font-medium leading-tight"
              style={{ fontSize: `${Math.round(11 * autoScale * 10) / 10}px` }}
            >
              <UniversalMathJax inline dynamic>{cleanupMath(qText)}</UniversalMathJax>
            </div>
          </div>

          {opts.length > 0 && (
            <div
              className={`grid ${optLayoutClass} gap-x-2 gap-y-0.5 mt-0.5 ml-3 font-nikosh font-serif`}
              style={{ fontSize: `${Math.round(10.2 * autoScale * 10) / 10}px` }}
            >
              {opts.map((opt: any, optIdx: number) => {
                const optLetter = String.fromCharCode(65 + optIdx);
                const optText = cleanBengaliText(typeof opt === 'string' ? opt : (opt.text || ''));
                return (
                  <div key={optIdx} className="flex items-start gap-1 leading-tight text-slate-900">
                    <span
                      className="font-bold text-black shrink-0"
                      style={{ fontSize: `${Math.round(9.5 * autoScale * 10) / 10}px` }}
                    >
                      {optLetter}.
                    </span>
                    <span className="text-black">
                      <UniversalMathJax inline dynamic>{cleanupMath(optText)}</UniversalMathJax>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    // --- REUSABLE COMPONENT: Detachable OMR Sheet (Front Left - 425pt) ---
    const renderOmrSection = () => {
      const qrPayload = examInfo.qrData || {
        v: 1,
        examId: examInfo.id || examInfo.examId || '',
        setId: examInfo.setId || cleanSet,
        setName: cleanSet,
        template: 'a3_master',
        title: cleanBengaliText(examInfo.title || '')
      };
      const qrString = typeof qrPayload === 'string' ? qrPayload : JSON.stringify(qrPayload);

      const { numCols, columns, maxRows } = omrLayout;
      const gridColsClass = numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : numCols === 4 ? 'grid-cols-4' : 'grid-cols-5';

      // Dynamic bubble sizing & spacing according to question density
      const isLarge = maxRows <= 10;
      const isMedium = maxRows > 10 && maxRows <= 15;

      const bubbleSizeClass = isLarge 
        ? 'w-[19px] h-[19px] text-[10px]' 
        : isMedium 
          ? 'w-[15.5px] h-[15.5px] text-[8px]' 
          : 'w-[13px] h-[13px] text-[7px]';

      const rowPaddingClass = isLarge ? 'py-[3px]' : isMedium ? 'py-[1.5px]' : 'py-[0.5px]';
      const qNumTextClass = isLarge ? 'text-[9.5px] w-5' : isMedium ? 'text-[8.5px] w-4' : 'text-[7.5px] w-3.5';
      const bubbleGapClass = isLarge ? 'gap-[3px]' : isMedium ? 'gap-[2px]' : 'gap-[1.5px]';

      return (
        <div className="w-[425pt] h-full p-2.5 pr-2 flex flex-col justify-between shrink-0 bg-white relative">
          {/* Corner Optical Fiducial Marks for Scanner Alignment */}
          <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-black" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-black" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 bg-black" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-black" />

          {/* Full-Height Card Boundary mirroring back side Instructions Card */}
          <div className="border-2 border-black p-2.5 h-full flex flex-col justify-between bg-white font-nikosh">
            {/* Top Section */}
            <div className="space-y-1">
              {/* OMR Header Banner with Embedded Auto-Scan QR Code */}
              <div className="border-2 border-black p-1 text-center bg-slate-50 relative pr-14">
                {/* Secured OMR QR Code for Instant Scanner Ingestion */}
                <div className="absolute right-1 top-1 bg-white p-0.5 border border-black/40 rounded shadow-xs select-none">
                  <QRCodeSVG value={qrString} size={42} level="M" />
                </div>
                {!hideInstitute && (
                  <h1 className="font-bold text-[13px] tracking-wider uppercase text-black leading-none font-nikosh">
                    {cleanBengaliText(examInfo.schoolName || 'ROFAZ ACADEMY')}
                  </h1>
                )}
                <div className="text-[8.5px] font-semibold text-slate-700 mt-0.5 font-nikosh">
                  {cleanBengaliText(examInfo.schoolAddress || 'Medical & Dental Admission Coaching')}
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold mt-1 px-1 border-t border-slate-300 pt-0.5 font-nikosh">
                  <span>পূর্ণমান: {toBengaliNumerals(totalMarks)}</span>
                  <span>সময়: {duration}</span>
                  <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8.5px] font-mono tracking-wider">
                    সেট: {cleanSet}
                  </span>
                </div>
                <div className="text-[9.5px] font-bold mt-0.5 text-slate-900 border-t border-slate-200 pt-0.5 truncate font-nikosh">
                  {cleanBengaliText(examInfo.title)}
                </div>
              </div>

              {/* Student Metadata Box & Grids */}
              <div className="flex gap-1.5">
                {/* Roll Number Bubble Grid (7 Digits) */}
                <div className="border border-black p-1 text-center shrink-0 bg-white">
                  <div className="font-bold text-[8px] tracking-wider uppercase mb-0.5 bg-black text-white px-1 py-0.5">
                    ROLL NUMBER
                  </div>
                  <div className="flex gap-0.5 justify-center mb-0.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="w-3.5 h-3.5 border border-black text-[8px] font-bold flex items-center justify-center bg-slate-50"></div>
                    ))}
                  </div>
                  <div className="flex gap-0.5 justify-center">
                    {Array.from({ length: 7 }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-[1.5px]">
                        {Array.from({ length: 10 }).map((_, digit) => (
                          <div
                            key={digit}
                            className="w-3.5 h-3 rounded-full border border-slate-900 text-[7px] font-bold flex items-center justify-center select-none"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Serial Number Bubble Grid (6 Digits) */}
                <div className="border border-black p-1 text-center shrink-0 bg-white">
                  <div className="font-bold text-[8px] tracking-wider uppercase mb-0.5 bg-black text-white px-1 py-0.5">
                    SERIAL NO
                  </div>
                  <div className="flex gap-0.5 justify-center mb-0.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-3.5 h-3.5 border border-black text-[8px] font-bold flex items-center justify-center bg-slate-50"></div>
                    ))}
                  </div>
                  <div className="flex gap-0.5 justify-center">
                    {Array.from({ length: 6 }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-[1.5px]">
                        {Array.from({ length: 10 }).map((_, digit) => (
                          <div
                            key={digit}
                            className="w-3.5 h-3 rounded-full border border-slate-900 text-[7px] font-bold flex items-center justify-center select-none"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate Info Input Fields + Set Code Bubble */}
                <div className="border border-black p-1 flex-1 flex flex-col justify-between text-[8.5px] bg-slate-50/50 font-nikosh">
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-10 text-slate-800">নাম:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-10 text-slate-800">ব্যাচ:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-10 text-slate-800">শাখা:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-10 text-slate-800">তারিখ:</span>
                    <span className="flex-1 border-b border-dotted border-black text-slate-800 font-bold">{examInfo.date || ''}</span>
                  </div>
                  {/* Set Code Bubbling for Candidates */}
                  <div className="flex items-center justify-between border-t border-slate-300 pt-0.5">
                    <span className="font-bold text-[8px] text-slate-900">সেট কোড:</span>
                    <div className="flex gap-1">
                      {['A', 'B', 'C', 'D'].map((s) => (
                        <div
                          key={s}
                          className={`w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center font-bold text-[7.5px] select-none ${
                            cleanSet === s ? 'bg-black text-white' : 'bg-white text-black'
                          }`}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quranic Verse / Inspirational Motto Banner */}
              <div className="bg-black text-white text-center py-0.5 font-bold text-[8px] tracking-wider uppercase">
                BE COLOURED BY THE COLOUR OF ALLAH (AL QURAN)
              </div>
            </div>

            {/* Dynamic Adaptive Full-Height OMR Bubble Matrix */}
            <div className="flex-1 flex flex-col justify-between border border-black p-1.5 my-1 bg-white">
              {/* Matrix Header Banner */}
              <div className="bg-slate-200 text-black font-bold text-[9px] px-1.5 py-0.5 flex justify-between items-center mb-1">
                <span>OMR ANSWER SHEET : QUESTIONS ০১ – {toBengaliNumerals(String(totalCount).padStart(2, '0'))}</span>
                <span className="tracking-wider">(A) (B) (C) (D)</span>
              </div>

              {/* Columns Grid spanning full vertical height */}
              <div className={`grid ${gridColsClass} gap-1 flex-1 items-stretch`}>
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col justify-between border border-slate-300 rounded-xs p-1 bg-white h-full">
                    {/* Column Header */}
                    <div className="flex justify-between items-center border-b border-black pb-0.5 mb-0.5 text-[8px] font-bold text-slate-800">
                      <span>প্রশ্ন</span>
                      <div className={`flex ${bubbleGapClass} pr-0.5 text-[7px]`}>
                        <span>A</span><span>B</span><span>C</span><span>D</span>
                      </div>
                    </div>

                    {/* Question Rows in this Column */}
                    <div className="flex-1 flex flex-col justify-between">
                      {Array.from({ length: col.count }).map((_, r) => {
                        const qNum = col.start + r;
                        return (
                          <div
                            key={qNum}
                            className={`flex items-center justify-between px-0.5 ${rowPaddingClass} rounded ${
                              r % 2 === 1 ? 'bg-slate-100/70' : 'bg-white'
                            }`}
                          >
                            <span className={`font-bold font-nikosh text-slate-900 select-none ${qNumTextClass}`}>
                              {toBengaliNumerals(String(qNum).padStart(2, '0'))}
                            </span>
                            <div className={`flex ${bubbleGapClass}`}>
                              {['A', 'B', 'C', 'D'].map((opt) => (
                                <div
                                  key={opt}
                                  className={`${bubbleSizeClass} rounded-full border border-black flex items-center justify-center font-bold bg-white select-none shadow-[0_0_0_0.2px_rgba(0,0,0,0.8)]`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Guidance */}
              <div className="mt-1 pt-0.5 border-t border-slate-300 text-[7.5px] text-slate-700 flex justify-between font-nikosh font-medium">
                <span>• শুধুমাত্র কালো বলপয়েন্ট কলম দিয়ে সম্পূর্ণ বৃত্ত ভরাট করুন</span>
                <span>• বৃত্তের বাইরে কোনো দাগ দেওয়া সম্পূর্ণ নিষিদ্ধ</span>
              </div>
            </div>

            {/* Official Examiner Score Strip */}
            <div className="border-2 border-black p-1 flex justify-between items-center text-[9px] font-bold bg-slate-50 font-nikosh">
              <span>সঠিক: ______</span>
              <span>ভুল: ______</span>
              <span>কর্তন ({toBengaliNumerals(negMarking)}): ______</span>
              <span>প্রাপ্ত নম্বর: ______ / {toBengaliNumerals(totalMarks)}</span>
            </div>
          </div>
        </div>
      );
    };

    // --- REUSABLE COMPONENT: General Instructions & Code of Conduct (Back Right - 425pt) ---
    const renderInstructionsSection = (isRightAligned = true) => (
      <div
        className={`w-[425pt] h-full p-2.5 ${isRightAligned ? 'pl-2' : 'pr-2'} flex flex-col justify-between shrink-0 bg-white relative`}
      >
        {/* Corner Optical Fiducial Marks for Scanner Alignment */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-black" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-black" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 bg-black" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-black" />

        <div className="border-2 border-black p-2.5 h-full flex flex-col justify-between bg-white font-nikosh">
          <div>
            {/* Government & Admission Directive Header */}
            <div className="text-center border-b border-black pb-1 mb-1.5 bg-slate-50 p-1.5">
              <div className="text-[9px] font-bold text-slate-700 tracking-wide">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার / স্বাস্থ্য শিক্ষা অধিদপ্তর অনুমোদিত মানদণ্ড
              </div>
              <h2 className="text-[12.5px] font-bold text-black mt-0.5 leading-tight">
                পরীক্ষার্থীদের জন্য সাধারণ নির্দেশাবলী ও আচরণবিধি
              </h2>
              <div className="text-[8px] font-bold tracking-wider uppercase text-slate-600 mt-0.5">
                GENERAL INSTRUCTIONS & CODE OF CONDUCT FOR CANDIDATES
              </div>
            </div>

            {/* Exam Key Metrics Table */}
            <table className="w-full text-center border-collapse border border-black text-[9px] mb-2 font-bold bg-white">
              <thead>
                <tr className="bg-slate-200 text-black">
                  <th className="border border-black p-0.5">মোট প্রশ্ন</th>
                  <th className="border border-black p-0.5">সময়</th>
                  <th className="border border-black p-0.5">সঠিক উত্তর</th>
                  <th className="border border-black p-0.5">ভুল উত্তর (নেগেটিভ)</th>
                  <th className="border border-black p-0.5">পাস নম্বর</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-0.5">{toBengaliNumerals(totalMarks)} টি MCQ</td>
                  <td className="border border-black p-0.5">{duration}</td>
                  <td className="border border-black p-0.5 text-emerald-800">+ ১.০০ নম্বর</td>
                  <td className="border border-black p-0.5 text-rose-800">- {toBengaliNumerals(negMarking)} নম্বর</td>
                  <td className="border border-black p-0.5">৪০.০০ নম্বর</td>
                </tr>
              </tbody>
            </table>

            {/* 12 Golden Rules of Conduct (Cleaned Bengali Typography) */}
            <div className="space-y-0.5 text-[8.5px] leading-tight text-slate-900 pr-1">
              <div>
                <span className="font-bold">১. বলপয়েন্ট কালো কলম:</span> কেবল কালো কালির স্বচ্ছ বলপয়েন্ট কলম দিয়ে OMR উত্তরপত্রের বৃত্ত সম্পূর্ণ কালো করে ভরাট করতে হবে। জেল পেন বা পেন্সিল সম্পূর্ণ নিষিদ্ধ।
              </div>
              <div>
                <span className="font-bold">২. রোল ও সিরিয়াল নম্বর:</span> OMR উত্তরপত্রের নির্ধারিত ঘরে রোল ও সিরিয়াল নম্বর লিখে সংশ্লিষ্ট বৃত্তগুলো সম্পূর্ণ ভরাট করুন।
              </div>
              <div>
                <span className="font-bold">৩. নেগেটিভ মার্কিং সতর্কতা:</span> প্রতিটি ভুল উত্তরের জন্য {toBengaliNumerals(negMarking)} নম্বর কাটা যাবে। তাই অনুমানের ওপর ভিত্তি করে দাগানো পরিহার করুন।
              </div>
              <div>
                <span className="font-bold">৪. এক বৃত্ত নিয়ম:</span> কোনো প্রশ্নে একাধিক বৃত্ত ভরাট করলে বা ফ্লুইড, রাবার, ব্লেড দিয়ে ঘষাঘষি করলে কম্পিউটার স্ক্যানারে উত্তরটি স্বয়ংক্রিয়ভাবে বাতিল হবে।
              </div>
              <div>
                <span className="font-bold">৫. OMR সুরক্ষা:</span> OMR উত্তরপত্র ভাঁজ করা, কাটাকুটি, স্ট্যাপল করা বা ড্রয়িং করা যাবে না। বারকোড ও টাইমিং ট্র্যাক সম্পূর্ণ অক্ষত রাখতে হবে।
              </div>
              <div>
                <span className="font-bold">৬. প্রশ্ন ও উত্তরপত্র মেলানো:</span> প্রশ্নপত্র পাওয়ার পর দেখে নিন কোনো পৃষ্ঠা ছেঁড়া বা অস্পষ্ট প্রিন্ট আছে কিনা। ত্রুটি থাকলে সাথে সাথে কক্ষ পরিদর্শককে জানান।
              </div>
              <div>
                <span className="font-bold">৭. সময় সচেতনতা:</span> পরীক্ষার সময়কাল ঠিক {duration}। শেষ সংকেতের সাথে সাথে লেখা বন্ধ করে ওএমআর জমা দেওয়ার জন্য প্রস্তুত হতে হবে।
              </div>
              <div>
                <span className="font-bold">৮. ডিভাইস ও বই সম্পূর্ণ নিষিদ্ধ:</span> মোবাইল ফোন, ডিজিটাল বা স্মার্টওয়াচ, সায়েন্টিফিক ক্যালকুলেটর বা ব্লুটুথ ডিভাইস বহন করা সম্পূর্ণ নিষিদ্ধ ও দণ্ডনীয়।
              </div>
              <div>
                <span className="font-bold">৯. পারফোরেশন বা পৃথকীকরণ:</span> পরীক্ষা শেষে ডটেড পারফোরেশন রেখা বরাবর সাবধানে আলতো চাপে OMR শিটটি আলাদা করে পরিদর্শকের নিকট হস্তান্তর করুন।
              </div>
              <div>
                <span className="font-bold">১০. প্রশ্নপত্র সংরক্ষণ:</span> মূল প্রশ্নপত্রটি শিক্ষার্থী পরীক্ষার পর নিজের প্রস্তুতি ও আত্মমূল্যায়নের জন্য সাথে নিয়ে যেতে পারবে।
              </div>
              <div>
                <span className="font-bold">১১. পরীক্ষা হলের শৃঙ্খলা:</span> অন্য কোনো পরীক্ষার্থীর সাথে কথা বলা বা উত্তর আদান-প্রদান প্রমাণিত হলে তাৎক্ষণিকভাবে বহিষ্কার করা হবে।
              </div>
              <div>
                <span className="font-bold">১২. নৈতিকতা ও আন্তরিকতা:</span> সততা ও নৈতিকতার সাথে সম্পূর্ণ পরীক্ষাটি দিন। মহান আল্লাহ আপনার মেধা ও পরিশ্রমের উত্তম প্রতিদান দিন।
              </div>
            </div>

            {/* Bubble Filling Guide */}
            <div className="border border-black p-1 my-1.5 text-[8.5px] bg-slate-50 flex items-center justify-between">
              <span className="font-bold">OMR বৃত্ত ভরাটের নিয়ম:</span>
              <div className="flex items-center gap-1">
                <span className="text-emerald-800 font-bold">সঠিক পদ্ধতি:</span>
                <span className="w-3.5 h-3.5 rounded-full bg-black text-white text-[7px] flex items-center justify-center font-bold">A</span>
              </div>
              <div className="flex items-center gap-1 text-rose-700">
                <span className="font-bold">ভুল পদ্ধতি:</span>
                <span className="text-[8.5px] font-bold">✔ ✖ ● ◐</span>
              </div>
            </div>
          </div>

          {/* Candidate Declaration & Signatures */}
          <div className="border-t border-black pt-1 bg-slate-50/50 p-1">
            <div className="text-[8px] italic text-center mb-2 text-slate-800">
              &ldquo;আমি প্রত্যয়ন করছি যে, পরীক্ষার সকল নিয়মাবলী পড়ে বুঝেছি এবং কোনো অনৈতিক পন্থা অবলম্বন করিনি।&rdquo;
            </div>
            <div className="flex justify-between items-end text-[8.5px] font-bold px-3">
              <div className="text-center">
                <div className="w-28 border-b border-black mb-0.5"></div>
                <span>পরীক্ষার্থীর স্বাক্ষর ও তারিখ</span>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-black mb-0.5"></div>
                <span>কক্ষ পরিদর্শকের স্বাক্ষর</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // --- REUSABLE COMPONENT: Perforation Cut Bar (18pt) ---
    const renderPerforationSeparator = (borderSide: 'left' | 'right' = 'right') => (
      <div
        className={`w-[18pt] h-full flex flex-col items-center justify-between py-3 ${
          borderSide === 'right' ? 'border-r-2' : 'border-l-2'
        } border-dashed border-black relative select-none bg-white shrink-0`}
      >
        <span className="text-[11px] font-bold">✂</span>
        <div className="rotate-90 origin-center whitespace-nowrap text-[8.5px] font-bold tracking-widest text-slate-800 uppercase font-nikosh">
          CUT ALONG LINE TO DETACH OMR • এখান দিয়ে কেটে OMR আলাদা করুন
        </div>
        <span className="text-[11px] font-bold">✂</span>
      </div>
    );

    // --- REUSABLE COMPONENT: Questions Part 1 (Front Side) ---
    const renderQuestionsPart1 = () => {
      const startNum = 1;
      const endNum = part1Questions.length;
      const nextStartNum = endNum + 1;

      return (
        <div className="flex-1 h-full p-2.5 pl-3 flex flex-col justify-between bg-white relative">
          {/* Top Banner Strip */}
          <div className="border-b-2 border-black pb-1 mb-1 flex justify-between items-center text-[10px] font-nikosh">
            <span className="font-bold text-black text-[10.5px]">
              প্রশ্নপত্র (প্রথম অংশ : প্রশ্ন {toBengaliNumerals(String(startNum).padStart(2, '0'))} হতে {toBengaliNumerals(String(endNum).padStart(2, '0'))})
            </span>
            <span className="text-[9px] text-slate-700 font-medium">
              প্রতিটি প্রশ্নের মান সমান ১ নম্বর • প্রতিটি ভুল উত্তরের জন্য -{toBengaliNumerals(negMarking)} নম্বর কাটা যাবে
            </span>
            <span className="font-bold uppercase bg-black text-white px-2 py-0.5 rounded text-[9.5px] tracking-wider font-mono">
              সেট: {cleanSet}
            </span>
          </div>

          {/* 3 Balanced Columns for Questions Part 1 */}
          <div className="flex-1 columns-3 gap-3 overflow-hidden">
            {part1Questions.map((q, idx) => renderQuestionCard(q, idx))}
          </div>

          {/* Page 1 Footer */}
          <div className="border-t border-black pt-1 mt-0.5 flex justify-between items-center text-[8.5px] text-slate-800 font-semibold font-nikosh">
            <span>{cleanBengaliText(examInfo.schoolName || 'ROFAZ ACADEMY')} • {cleanBengaliText(examInfo.title)}</span>
            <span className="font-bold text-black">
              পৃষ্ঠা - ১ (প্রশ্ন {toBengaliNumerals(String(startNum).padStart(2, '0'))} হতে {toBengaliNumerals(String(endNum).padStart(2, '0'))})
            </span>
            <span className="font-bold text-black">
              [পরবর্তী পৃষ্ঠায় প্রশ্ন {toBengaliNumerals(String(nextStartNum).padStart(2, '0'))} হতে {toBengaliNumerals(totalCount)} দ্রষ্টব্য] ➔
            </span>
          </div>
        </div>
      );
    };

    // --- REUSABLE COMPONENT: Questions Part 2 (Back Side) ---
    const renderQuestionsPart2 = (isLeftAligned = true) => {
      const startNum = part1Questions.length + 1;
      const endNum = totalCount;

      return (
        <div
          className={`flex-1 h-full p-2.5 ${isLeftAligned ? 'pr-3' : 'pl-3'} flex flex-col justify-between bg-white relative`}
        >
          {/* Top Banner Strip */}
          <div className="border-b-2 border-black pb-1 mb-1 flex justify-between items-center text-[10px] font-nikosh">
            <span className="font-bold text-black text-[10.5px]">
              প্রশ্নপত্র (দ্বিতীয় অংশ : প্রশ্ন {toBengaliNumerals(String(startNum).padStart(2, '0'))} হতে {toBengaliNumerals(endNum)})
            </span>
            <span className="text-[9px] text-slate-700 font-medium">
              প্রতিটি প্রশ্নের মান সমান ১ নম্বর • প্রতিটি ভুল উত্তরের জন্য -{toBengaliNumerals(negMarking)} নম্বর কাটা যাবে
            </span>
            <span className="font-bold uppercase bg-black text-white px-2 py-0.5 rounded text-[9.5px] tracking-wider font-mono">
              সেট: {cleanSet}
            </span>
          </div>

          {/* 3 Balanced Columns for Questions Part 2 */}
          <div className="flex-1 columns-3 gap-3 overflow-hidden">
            {part2Questions.map((q, idx) => renderQuestionCard(q, halfCount + idx))}
          </div>

          {/* Page 2 Footer */}
          <div className="border-t border-black pt-1 mt-0.5 flex justify-between items-center text-[8.5px] text-slate-800 font-semibold font-nikosh">
            <span>{cleanBengaliText(examInfo.schoolName || 'ROFAZ ACADEMY')} • {cleanBengaliText(examInfo.title)}</span>
            <span className="font-bold text-black">
              পৃষ্ঠা - ২ (প্রশ্ন {toBengaliNumerals(String(startNum).padStart(2, '0'))} হতে {toBengaliNumerals(endNum)})
            </span>
            <span className="font-bold text-black">
              [সর্বমোট {toBengaliNumerals(totalCount)}টি প্রশ্নের উত্তর ওএমআর শিটে পূরণ করুন] — সমাপ্ত
            </span>
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className="a3-master-container font-nikosh font-serif text-black bg-white select-none relative">
        {/* Optional Watermark */}
        {showWatermark && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.035] select-none z-0">
            <span className="text-[90pt] font-black uppercase tracking-[0.25em] -rotate-30 whitespace-nowrap text-black font-nikosh">
              {watermarkText || examInfo.schoolName || 'CONFIDENTIAL'}
            </span>
          </div>
        )}

        {/* =========================================================================
            SHEET 1 (FRONT SPREAD / PAGE 1): STRICT ISO A3 LANDSCAPE
            Layout: [ LEFT: Detachable OMR (425pt) ] | [ Cut Bar (18pt) ] | [ RIGHT: Questions Part 1 ]
            ========================================================================= */}
        <div className="a3-master-sheet flex flex-row w-full border-b-2 border-black relative bg-white">
          {renderOmrSection()}
          {renderPerforationSeparator('right')}
          {renderQuestionsPart1()}
        </div>

        {/* =========================================================================
            SHEET 2 (BACK SPREAD / PAGE 2): STRICT ISO A3 LANDSCAPE
            PHYSICAL DUPLEX PRINTING ALIGNMENT (Flip on Short Edge / Booklet):
            In standard duplex printing, flipping the landscape sheet horizontally aligns:
              - Front LEFT (OMR) <------> Back RIGHT (Instructions)
              - Front RIGHT (Q Part 1) <-> Back LEFT (Q Part 2)
            This guarantees:
              1. The question paper retains half questions on front (1 to half) and half on back (half+1 to end).
              2. When the OMR is detached along the perforation, the detached sheet has OMR on the front
                 and Instructions & Conduct Code on the back. Zero questions are severed!
              3. Strictly NO trailing page-break so document prints as EXACTLY 2 physical pages!
            ========================================================================= */}
        <div className="a3-master-sheet flex flex-row w-full relative bg-white">
          {duplexFlip === 'short_edge' ? (
            <>
              {/* Short-Edge Flip (Standard / Recommended): Questions Part 2 on Left, Instructions on Right */}
              {renderQuestionsPart2(true)}
              {renderPerforationSeparator('left')}
              {renderInstructionsSection(true)}
            </>
          ) : (
            <>
              {/* Long-Edge Flip / One-Sided Preview: Instructions on Left, Questions Part 2 on Right */}
              {renderInstructionsSection(false)}
              {renderPerforationSeparator('right')}
              {renderQuestionsPart2(false)}
            </>
          )}
        </div>
      </div>
    );
  }
);

A3MasterExamPaper.displayName = "A3MasterExamPaper";
