"use client";

import React, { forwardRef } from "react";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import { toBengaliNumerals, formatBengaliDuration } from "@/utils/numeralConverter";

interface A3MasterExamPaperProps {
  examInfo: {
    schoolName: string;
    schoolAddress?: string;
    title: string;
    subject?: string;
    class?: string;
    date?: string;
    set?: string;
    duration?: string;
    totalMarks?: string | number;
    mcqNegativeMarking?: number;
    objectiveTime?: number;
  };
  questions: any[];
  fontSize?: number;
  hideInstitute?: boolean;
}

export const A3MasterExamPaper = forwardRef<HTMLDivElement, A3MasterExamPaperProps>(
  ({ examInfo, questions = [], fontSize = 100, hideInstitute = false }, ref) => {
    const rawSet = examInfo.set || 'A';
    const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
    const totalMarks = examInfo.totalMarks || (questions.length > 0 ? questions.length : 100);
    const duration = examInfo.objectiveTime 
      ? formatBengaliDuration(examInfo.objectiveTime)
      : (examInfo.duration || '৬০ মিনিট');
    const negMarking = examInfo.mcqNegativeMarking !== undefined ? examInfo.mcqNegativeMarking : 0.25;

    // Split questions into Part 1 (1-50) and Part 2 (51-100)
    const midPoint = Math.min(50, Math.ceil(questions.length / 2));
    const part1Questions = questions.slice(0, 50);
    const part2Questions = questions.slice(50, 100);

    const renderQuestionCard = (q: any, displayIndex: number) => {
      const qNum = displayIndex + 1;
      const qText = q.q || q.questionText || q.text || '';
      const opts = q.options || [];

      // Determine option column layout based on text lengths
      const maxLen = opts.reduce((max: number, o: any) => {
        const text = typeof o === 'string' ? o : (o.text || '');
        return Math.max(max, text.length);
      }, 0);

      const optLayoutClass = maxLen <= 14 ? "grid-cols-4" : maxLen <= 32 ? "grid-cols-2" : "grid-cols-1";

      return (
        <div key={q.id || displayIndex} className="break-inside-avoid text-[11px] leading-[1.35] py-1 border-b border-dotted border-slate-200">
          <div className="flex items-start gap-1 font-semibold text-black">
            <span className="font-bold shrink-0">{toBengaliNumerals(qNum)}.</span>
            <div className="flex-1 font-serif text-[11px] leading-tight">
              <UniversalMathJax inline dynamic>{cleanupMath(qText)}</UniversalMathJax>
            </div>
          </div>

          {opts.length > 0 && (
            <div className={`grid ${optLayoutClass} gap-x-1.5 gap-y-0.5 mt-0.5 ml-3 font-serif text-[10.5px]`}>
              {opts.map((opt: any, optIdx: number) => {
                const optLetter = String.fromCharCode(65 + optIdx);
                const optText = typeof opt === 'string' ? opt : (opt.text || '');
                return (
                  <div key={optIdx} className="flex items-start gap-1 leading-tight">
                    <span className="font-bold text-[10px] text-slate-800 shrink-0">{optLetter}.</span>
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

    return (
      <div ref={ref} className="a3-master-container font-serif text-black bg-white select-none">
        {/* =========================================================================
            SHEET 1 (FRONT SPREAD / PAGE 1): A3 LANDSCAPE (Left: OMR, Right: Q1..Q50)
            ========================================================================= */}
        <div className="a3-master-sheet flex flex-row w-full h-[976pt] border-b-2 border-black page-break-after-always">
          {/* --- LEFT SECTION: DETACHABLE OMR ANSWER SHEET (~35.5% width) --- */}
          <div className="w-[510pt] h-full p-3.5 pr-2 flex flex-col justify-between shrink-0 bg-white">
            <div>
              {/* OMR Header Banner */}
              <div className="border border-black p-2 mb-2 text-center bg-slate-50">
                {!hideInstitute && (
                  <h1 className="font-bold text-[15px] tracking-wide uppercase text-black">
                    {examInfo.schoolName || 'ROFAZ ACADEMY'}
                  </h1>
                )}
                <div className="text-[10px] font-medium text-slate-700">
                  {examInfo.schoolAddress || 'Medical & Dental Admission Coaching'}
                </div>
                <div className="flex justify-between items-center text-[10.5px] font-bold mt-1 px-2 border-t border-slate-300 pt-1">
                  <span>পূর্ণমান: {toBengaliNumerals(totalMarks)}</span>
                  <span>সময়: {duration}</span>
                  <span className="bg-black text-white px-2 py-0.5 rounded text-[10px]">সেট: {cleanSet}</span>
                </div>
                <div className="text-[11px] font-bold mt-0.5 text-slate-900 border-t border-slate-200 pt-0.5">
                  {examInfo.title}
                </div>
              </div>

              {/* Student Metadata Box & Grids */}
              <div className="flex gap-2 mb-2">
                {/* Roll Number Bubble Grid */}
                <div className="border border-black p-1 text-center shrink-0">
                  <div className="font-bold text-[9px] tracking-wider uppercase mb-0.5 bg-black text-white px-1">
                    ROLL NUMBER
                  </div>
                  <div className="flex gap-1 justify-center mb-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="w-3.5 h-4 border border-black text-[9px] font-bold flex items-center justify-center"></div>
                    ))}
                  </div>
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: 7 }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-[2px]">
                        {Array.from({ length: 10 }).map((_, digit) => (
                          <div key={digit} className="w-3.5 h-3.5 rounded-full border border-slate-800 text-[8px] font-bold flex items-center justify-center">
                            {digit}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Serial Number Bubble Grid */}
                <div className="border border-black p-1 text-center shrink-0">
                  <div className="font-bold text-[9px] tracking-wider uppercase mb-0.5 bg-black text-white px-1">
                    SERIAL NO
                  </div>
                  <div className="flex gap-1 justify-center mb-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-3.5 h-4 border border-black text-[9px] font-bold flex items-center justify-center"></div>
                    ))}
                  </div>
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: 6 }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-[2px]">
                        {Array.from({ length: 10 }).map((_, digit) => (
                          <div key={digit} className="w-3.5 h-3.5 rounded-full border border-slate-800 text-[8px] font-bold flex items-center justify-center">
                            {digit}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate Info Input Fields */}
                <div className="border border-black p-1.5 flex-1 flex flex-col justify-between text-[9.5px]">
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-12">NAME:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-12">BATCH:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-12">BRANCH:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-12">DATE:</span>
                    <span className="flex-1 border-b border-dotted border-black">{examInfo.date || ''}</span>
                  </div>
                  <div className="flex items-center gap-1 border-b border-slate-300 pb-0.5">
                    <span className="font-bold w-12">MARKS:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold w-12">SIGN:</span>
                    <span className="flex-1 border-b border-dotted border-black"></span>
                  </div>
                </div>
              </div>

              {/* Quranic Verse / Inspirational Motto */}
              <div className="bg-slate-900 text-white text-center py-0.5 font-bold text-[9px] tracking-wider mb-2">
                BE COLOURED BY THE COLOUR OF ALLAH (AL QURAN)
              </div>

              {/* OMR 1-50 BUBBLE MATRIX (5 Columns of 10 Rows) */}
              <div className="border border-black p-1 mb-2">
                <div className="bg-slate-200 text-black font-bold text-[9.5px] px-1 py-0.5 flex justify-between mb-1">
                  <span>OMR ANSWER SHEET : QUESTIONS 01 – 50</span>
                  <span>(A) (B) (C) (D)</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[8.5px]">
                  {[0, 10, 20, 30, 40].map((start) => (
                    <div key={start} className="space-y-[3px]">
                      {Array.from({ length: 10 }).map((_, r) => {
                        const qNum = start + r + 1;
                        return (
                          <div key={qNum} className="flex items-center justify-between px-0.5">
                            <span className="font-bold w-4 text-[8px]">{String(qNum).padStart(2, '0')}</span>
                            <div className="flex gap-[2px]">
                              {['A', 'B', 'C', 'D'].map((opt) => (
                                <div key={opt} className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center font-bold text-[7.5px]">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* OMR 51-100 BUBBLE MATRIX (5 Columns of 10 Rows) */}
              <div className="border border-black p-1 mb-2">
                <div className="bg-slate-200 text-black font-bold text-[9.5px] px-1 py-0.5 flex justify-between mb-1">
                  <span>OMR ANSWER SHEET : QUESTIONS 51 – 100</span>
                  <span>(A) (B) (C) (D)</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[8.5px]">
                  {[50, 60, 70, 80, 90].map((start) => (
                    <div key={start} className="space-y-[3px]">
                      {Array.from({ length: 10 }).map((_, r) => {
                        const qNum = start + r + 1;
                        return (
                          <div key={qNum} className="flex items-center justify-between px-0.5">
                            <span className="font-bold w-4 text-[8px]">{qNum}</span>
                            <div className="flex gap-[2px]">
                              {['A', 'B', 'C', 'D'].map((opt) => (
                                <div key={opt} className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center font-bold text-[7.5px]">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Official Examiner Score Strip */}
            <div className="border-2 border-black p-1.5 flex justify-between items-center text-[10px] font-bold bg-slate-50">
              <span>CORRECT: ______</span>
              <span>WRONG: ______</span>
              <span>CUT ({toBengaliNumerals(negMarking)}): ______</span>
              <span>TOTAL: ______ / {toBengaliNumerals(totalMarks)}</span>
            </div>
          </div>

          {/* --- VERTICAL PERFORATION SEPARATOR WITH CUT LINE (x ~ 515pt) --- */}
          <div className="w-[20pt] h-full flex flex-col items-center justify-between py-4 border-r-2 border-dashed border-black relative">
            <span className="text-[12px]">✂</span>
            <div className="rotate-90 origin-center whitespace-nowrap text-[9px] font-bold tracking-widest text-slate-800">
              CUT ALONG LINE TO DETACH OMR • এখান দিয়ে কেটে OMR আলাদা করুন
            </div>
            <span className="text-[12px]">✂</span>
          </div>

          {/* --- RIGHT SECTION: QUESTION PAPER PART 1 (QUESTIONS 01 TO 50) (~62% width) --- */}
          <div className="flex-1 h-full p-3 pl-3 flex flex-col justify-between">
            {/* Top Banner Strip */}
            <div className="border-b-2 border-black pb-1 mb-1.5 flex justify-between items-center text-[10.5px]">
              <span className="font-bold">
                প্রশ্নপত্র (অংশ-১ : প্রশ্ন ০১ হতে ৫০)
              </span>
              <span className="text-[9.5px] text-slate-700">
                প্রতিটি প্রশ্নের মান সমান ১ নম্বর • প্রতিটি ভুল উত্তরের জন্য {toBengaliNumerals(negMarking)} নম্বর কাটা যাবে
              </span>
              <span className="font-bold uppercase bg-slate-100 px-1.5 py-0.5 border border-black text-[9.5px]">
                সেট: {cleanSet}
              </span>
            </div>

            {/* 3 Balanced Columns for Questions 1-50 */}
            <div className="flex-1 columns-3 gap-3 overflow-hidden text-[10.5px]">
              {part1Questions.map((q, idx) => renderQuestionCard(q, idx))}
            </div>

            {/* Page 1 Footer */}
            <div className="border-t border-black pt-1 mt-1 flex justify-between items-center text-[9px] text-slate-800">
              <span>{examInfo.schoolName || 'ROFAZ ACADEMY'} • {examInfo.title}</span>
              <span className="font-bold">পৃষ্ঠা - ১ (প্রশ্ন ০১ হতে ৫০)</span>
              <span className="font-bold text-black">
                [পরবর্তী পৃষ্ঠায় নির্দেশাবলী ও প্রশ্ন ৫১-১০০ দ্রষ্টব্য] ➔
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SHEET 2 (BACK SPREAD / PAGE 2): A3 LANDSCAPE (Left: Rules, Right: Q51..Q100)
            ========================================================================= */}
        <div className="a3-master-sheet flex flex-row w-full h-[976pt] page-break-after-always">
          {/* --- LEFT SECTION: GENERAL INSTRUCTIONS & CODE OF CONDUCT (~35.5% width) --- */}
          <div className="w-[510pt] h-full p-3.5 pr-2 flex flex-col justify-between shrink-0 bg-white">
            <div className="border-2 border-black p-3 h-full flex flex-col justify-between">
              <div>
                {/* Government & Admission Directive Header */}
                <div className="text-center border-b border-black pb-2 mb-2">
                  <div className="text-[9.5px] font-bold text-slate-700">
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার / স্বাস্থ্য শিক্ষা অধিদপ্তর অনুমোদিত মানদণ্ড
                  </div>
                  <h2 className="text-[13px] font-bold text-black mt-0.5">
                    পরীক্ষার্থীদের জন্য সাধারণ নির্দেশাবলী ও আচরণবিধি
                  </h2>
                  <div className="text-[8.5px] font-bold tracking-wider uppercase text-slate-600 mt-0.5">
                    GENERAL INSTRUCTIONS & CODE OF CONDUCT FOR CANDIDATES
                  </div>
                </div>

                {/* Exam Key Metrics Table */}
                <table className="w-full text-center border-collapse border border-black text-[9.5px] mb-2 font-bold">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-1">মোট প্রশ্ন</th>
                      <th className="border border-black p-1">সময়</th>
                      <th className="border border-black p-1">সঠিক উত্তর</th>
                      <th className="border border-black p-1">ভুল উত্তর (নেগেটিভ)</th>
                      <th className="border border-black p-1">পাস মার্কস</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1">{toBengaliNumerals(totalMarks)} টি MCQ</td>
                      <td className="border border-black p-1">{duration}</td>
                      <td className="border border-black p-1">+ ১.০০ নম্বর</td>
                      <td className="border border-black p-1">- {toBengaliNumerals(negMarking)} নম্বর</td>
                      <td className="border border-black p-1">৪০.০০ নম্বর</td>
                    </tr>
                  </tbody>
                </table>

                {/* 12 Rules of Conduct */}
                <div className="space-y-1 text-[8.8px] leading-tight text-slate-900 pr-1">
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
                <div className="border border-black p-1.5 my-2 text-[9px] bg-slate-50 flex items-center justify-between">
                  <span className="font-bold">OMR বৃত্ত ভরাটের নিয়ম:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-800 font-bold">সঠিক:</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-black text-white text-[7.5px] flex items-center justify-center font-bold">A</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <span className="font-bold">ভুল পদ্ধতি:</span>
                    <span className="text-[9px]">✔ ✖ ● ◐</span>
                  </div>
                </div>
              </div>

              {/* Candidate Declaration & Signatures */}
              <div className="border-t border-black pt-2">
                <div className="text-[8.5px] italic text-center mb-3">
                  &ldquo;আমি প্রত্যয়ন করছি যে, পরীক্ষার সকল নিয়মাবলী পড়ে বুঝেছি এবং কোনো অনৈতিক পন্থা অবলম্বন করিনি।&rdquo;
                </div>
                <div className="flex justify-between items-end text-[9px] font-bold px-4">
                  <div className="text-center">
                    <div className="w-32 border-b border-black mb-1"></div>
                    <span>পরীক্ষার্থীর স্বাক্ষর ও তারিখ</span>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-black mb-1"></div>
                    <span>কক্ষ পরিদর্শকের স্বাক্ষর</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- VERTICAL PERFORATION SEPARATOR WITH CUT LINE (x ~ 515pt) --- */}
          <div className="w-[20pt] h-full flex flex-col items-center justify-between py-4 border-r-2 border-dashed border-black relative">
            <span className="text-[12px]">✂</span>
            <div className="rotate-90 origin-center whitespace-nowrap text-[9px] font-bold tracking-widest text-slate-800">
              CUT ALONG LINE TO DETACH OMR • এখান দিয়ে কেটে OMR আলাদা করুন
            </div>
            <span className="text-[12px]">✂</span>
          </div>

          {/* --- RIGHT SECTION: QUESTION PAPER PART 2 (QUESTIONS 51 TO 100) (~62% width) --- */}
          <div className="flex-1 h-full p-3 pl-3 flex flex-col justify-between">
            {/* Top Banner Strip */}
            <div className="border-b-2 border-black pb-1 mb-1.5 flex justify-between items-center text-[10.5px]">
              <span className="font-bold">
                প্রশ্নপত্র (অংশ-২ : প্রশ্ন ৫১ হতে ১০০)
              </span>
              <span className="text-[9.5px] text-slate-700">
                প্রতিটি প্রশ্নের মান সমান ১ নম্বর • প্রতিটি ভুল উত্তরের জন্য {toBengaliNumerals(negMarking)} নম্বর কাটা যাবে
              </span>
              <span className="font-bold uppercase bg-slate-100 px-1.5 py-0.5 border border-black text-[9.5px]">
                সেট: {cleanSet}
              </span>
            </div>

            {/* 3 Balanced Columns for Questions 51-100 */}
            <div className="flex-1 columns-3 gap-3 overflow-hidden text-[10.5px]">
              {part2Questions.map((q, idx) => renderQuestionCard(q, 50 + idx))}
            </div>

            {/* Page 2 Footer */}
            <div className="border-t border-black pt-1 mt-1 flex justify-between items-center text-[9px] text-slate-800">
              <span>{examInfo.schoolName || 'ROFAZ ACADEMY'} • {examInfo.title}</span>
              <span className="font-bold">পৃষ্ঠা - ২ (প্রশ্ন ৫১ হতে ১০০)</span>
              <span className="font-bold text-black">
                [সব মোট ১০০টি প্রশ্নের উত্তর ওএমআর শিটে পূরণ করুন] — সমাপ্ত
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

A3MasterExamPaper.displayName = "A3MasterExamPaper";
