"use client";

import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import OMRSheet from '@/app/components/OMRSheet';

// Helper to convert Arabic digits (0-9) to Bengali digits (০-৯)
export const toBengaliNumerals = (input: string | number | undefined | null): string => {
  if (input === undefined || input === null) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

// Calculate clean visual character length, normalizing LaTeX / KaTeX math expressions
export const getCleanVisualLength = (text: any): number => {
  if (!text || typeof text !== 'string') return 0;
  let clean = text
    .replace(/\$\$[\s\S]*?\$\$/g, (m: string) => m.slice(2, -2).replace(/\\[a-zA-Z]+/g, 'X').slice(0, 15))
    .replace(/\$([^\$]+)\$/g, (_: string, inner: string) => {
      let math = inner
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\pm/g, '±')
        .replace(/\\le(q)?/g, '≤')
        .replace(/\\ge(q)?/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\infty/g, '∞')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\theta/g, 'θ')
        .replace(/\\pi/g, 'π')
        .replace(/\\mu/g, 'μ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\circ/g, '°')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[{}^_]/g, '');
      return math;
    })
    .replace(/\\\(|\\\)/g, '')
    .trim();

  return clean.length;
};

// --- Booklet Imposition Sheet Representation ---
export interface BookletSheet {
  sheetNumber: number;
  front: {
    leftPageNum: number;
    rightPageNum: number;
  };
  back: {
    leftPageNum: number;
    rightPageNum: number;
  };
}

/**
 * Universal Booklet Imposition Algorithm for N pages (where N is a multiple of 4).
 * Front: right | left
 * Back:  left + 1 | right - 1
 * left += 2, right -= 2
 * Perfect for 4-page, 8-page, 12-page, 16-page, 20-page, etc.
 */
export function computeBookletSheets(totalLogicalPages: number): { sheets: BookletSheet[]; N: number } {
  const N = Math.max(4, Math.ceil(totalLogicalPages / 4) * 4);
  const numSheets = N / 4;
  const sheets: BookletSheet[] = [];
  let left = 1;
  let right = N;

  for (let s = 1; s <= numSheets; s++) {
    sheets.push({
      sheetNumber: s,
      front: {
        leftPageNum: right,
        rightPageNum: left,
      },
      back: {
        leftPageNum: left + 1,
        rightPageNum: right - 1,
      },
    });
    left += 2;
    right -= 2;
  }

  return { sheets, N };
}

/**
 * Calculates optimal page count dynamically based on question volume, layout mode,
 * font scaling, paper size (A3, A4, Legal), and optional user target choice.
 * For booklet mode, guarantees a multiple of 4 pages (4, 8, 12, 16...).
 */
export function getOptimalPageCount(
  set: any,
  examInfo: any,
  layoutMode: string,
  fontSize: number = 100,
  cqSqFontSize: number = 100,
  engineeringExamBoxes: boolean = false,
  engineeringBoxScale: number = 1.0,
  paperSize: string = 'a4',
  bookletPagesChoice?: 'auto' | number
): number {
  if (bookletPagesChoice && bookletPagesChoice !== 'auto') {
    return Math.max(4, Math.ceil(Number(bookletPagesChoice) / 4) * 4);
  }

  const mcqs = set.mcq || [];
  const cqs = set.cq || [];
  const sqs = set.sq || [];

  let estimatedUnits = 0;

  // Header weight on Page 1
  estimatedUnits += 16;

  // MCQ unit estimation
  mcqs.forEach((q: any) => {
    const qLen = getCleanVisualLength(q.questionText || '');
    const maxOptLen = (q.options || []).reduce((max: number, o: any) => {
      const txt = typeof o === 'string' ? o : (o.text || '');
      return Math.max(max, getCleanVisualLength(txt));
    }, 0);

    let qUnits = 1.0;
    if (qLen > 120) qUnits += 0.5;
    if (maxOptLen > 40) qUnits += 1.0;
    else if (maxOptLen > 20) qUnits += 0.5;

    estimatedUnits += qUnits * (fontSize / 100);
  });

  // CQ unit estimation
  cqs.forEach((q: any) => {
    let cqUnits = 7.0;
    const subCount = (q.subQuestions || q.sub_questions || []).length;
    if (subCount > 2) cqUnits += (subCount - 2) * 1.5;
    estimatedUnits += cqUnits * (cqSqFontSize / 100);
  });

  // SQ unit estimation
  sqs.forEach((q: any) => {
    let sqUnits = 3.5;
    if (engineeringExamBoxes) {
      sqUnits += 10.0 * engineeringBoxScale;
    }
    estimatedUnits += sqUnits * (cqSqFontSize / 100);
  });

  const isBooklet = layoutMode === 'booklet_4page' || layoutMode === 'booklet_2up';
  if (isBooklet) {
    const perPageCap = paperSize === 'a3' ? 48 : paperSize === 'legal' ? 38 : 30;
    const totalHalfPagesRaw = Math.ceil(estimatedUnits / perPageCap);
    return Math.max(4, Math.ceil(totalHalfPagesRaw / 4) * 4);
  }

  if (estimatedUnits <= 102) return 4;
  return Math.max(1, Math.ceil((estimatedUnits - 18) / 28) + 1);
}

// --- Helper: Split an Exam Set into Logical Pages for Booklet Printing ---
export function splitExamSetForBooklet(
  set: any,
  examInfo?: any,
  targetPages: number = 4,
  options?: {
    fontSize?: number;
    cqSqFontSize?: number;
    layoutMode?: string;
    hideInstitute?: boolean;
    engineeringExamBoxes?: boolean;
    engineeringBoxScale?: number;
    paperSize?: 'legal' | 'a4' | 'letter' | 'a3';
  }
) {
  const cqs = [...(set.cq || [])];
  const sqs = [...(set.sq || [])];
  const mcqs = [...(set.mcq || [])];

  const pages: any[] = Array.from({ length: targetPages }, () => ({
    mcq: [],
    cq: [],
    sq: [],
  }));

  // Distribute items across target logical pages
  const totalItems = mcqs.length + cqs.length + sqs.length;
  if (totalItems === 0) return pages;

  // Simple and clean distribution
  const allQuestions = [...mcqs, ...cqs, ...sqs];
  const itemsPerPage = Math.ceil(allQuestions.length / targetPages);

  allQuestions.forEach((q, idx) => {
    const pageIndex = Math.min(targetPages - 1, Math.floor(idx / itemsPerPage));
    if (q.type === 'MCQ' || q.options) {
      pages[pageIndex].mcq.push(q);
    } else if (q.type === 'CQ' || q.subQuestions) {
      pages[pageIndex].cq.push(q);
    } else {
      pages[pageIndex].sq.push(q);
    }
  });

  return pages;
}

// --- Sub-Component: OMR Page ---
export const OMRPage = ({
  set,
  examInfo,
  language,
  hideInstitute,
  paperClass = 'a4-paper',
}: {
  set: any;
  examInfo: any;
  language: 'bn' | 'en';
  hideInstitute?: boolean;
  paperClass?: string;
}) => {
  const [uniqueCode] = useState(() => uuidv4());

  const mcqOptionsCount = useMemo(() => {
    if (!set.mcq || set.mcq.length === 0) return 4;
    const maxOptions = Math.max(...set.mcq.map((q: any) => q.options?.length || 0));
    return maxOptions > 4 ? 5 : 4;
  }, [set.mcq]);

  return (
    <div
      className={`print-page-container ${paperClass} omr-sheet-wrapper`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      <OMRSheet
        questions={set}
        qrData={set.qrData}
        rollDigits={6}
        fontFamily={language === 'bn' ? 'SolaimanLipi, serif' : 'Times New Roman, serif'}
        mcqOptionLabels={language === 'bn' ? ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'] : ['A', 'B', 'C', 'D', 'E', 'F']}
        mcqOptionsCount={mcqOptionsCount}
        setName={set.setName}
        bubbleSize={16}
        logoUrl={examInfo.schoolLogo}
        instituteName={examInfo.schoolName}
        schoolAddress={examInfo.schoolAddress}
        examTitle={examInfo.title}
        examDate={examInfo.date}
        subjectName={examInfo.subject}
        uniqueCode={uniqueCode}
        objectiveTime={examInfo.objectiveTime}
        cqSqTime={examInfo.cqSqTime}
        hideInstitute={hideInstitute}
      />
    </div>
  );
};

// --- Sub-Component: Comprehensive Booklet & Paper Size Advisory Modal ---
export const BookletGuideModal = ({
  language,
  paperSize,
  setPaperSize,
  layoutMode,
  setLayoutMode,
  activeTab,
  setActiveTab,
  onClose,
}: any) => {
  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isEn ? 'Booklet Print & Paper Size Guide' : 'বুকলেট প্রিন্টিং ও পেপার সাইজ নির্দেশিকা'}
              </h3>
              <p className="text-xs text-indigo-100">
                {isEn ? 'How to print 4-page exams seamlessly without needing staples' : 'কোনো স্ট্যাপলার ছাড়াই সহজে ৪ পৃষ্ঠার ভর্তি ও মডেল টেস্ট বুকলেট তৈরির নিয়ম'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('paper_comparison')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'paper_comparison'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            🌟 {isEn ? 'Which Paper Size is Best?' : 'কোন পেপার সাইজটি সেরা?'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('print_steps')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'print_steps'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            🖨️ {isEn ? 'Duplex Print & Folding Steps' : 'ডুপ্লেক্স প্রিন্ট ও ভাঁজ করার ধাপ'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 flex-1">
          {activeTab === 'paper_comparison' ? (
            <div className="space-y-4">
              {/* Option A: A3 (Recommended) */}
              <div
                className={`p-4 rounded-xl border-2 transition ${
                  paperSize === 'a3' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🏆 {isEn ? 'Gold Standard for Admission' : 'ভর্তি পরীক্ষার জন্য সেরা (রেকমেন্ডেড)'}
                    </span>
                    <h4 className="text-sm font-extrabold text-gray-900 mt-1">
                      A3 Paper (২৯৭ × ৪২০ মিমি - ল্যান্ডস্কেপ ফোল্ড)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPaperSize('a3');
                      setLayoutMode('booklet_4page');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      paperSize === 'a3' && layoutMode === 'booklet_4page'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border'
                    }`}
                  >
                    {paperSize === 'a3' && layoutMode === 'booklet_4page' ? '✓ নির্বাচিত' : 'A3 বুকলেট নির্বাচন করুন'}
                  </button>
                </div>
                <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-gray-600 text-[11px] leading-relaxed">
                  <li><strong>ভাঁজের পর সঠিক সাইজ:</strong> A3 পেপারকে মাঝে ভাঁজ করলে তৈরি হয় <strong>দুটি সম্পূর্ণ পূর্ণাঙ্গ A4 (২১০ × ২৯৭ মিমি) পৃষ্ঠা</strong>!</li>
                  <li><strong>কেন সেরা:</strong> বুয়েট (BUET), ঢাকা বিশ্ববিদ্যালয় (DU), মেডিকেল ভর্তি পরীক্ষা ও শীর্ষ ক্যাডেট কলেজের ৪ পৃষ্ঠার প্রশ্নপত্র এই A3 পেপারেই মুদ্রিত হয়।</li>
                  <li><strong>স্ট্যাপলার মুক্ত:</strong> একটি মাত্র শিটের এপিঠ-ওপিঠ প্রিন্ট হয়ে মাঝের রেখা বরাবর ভাঁজ করলেই চমৎকার ৪ পৃষ্ঠার প্রশ্ন বুকলেট হয়—কোনো স্ট্যাপলার লাগবে না।</li>
                </ul>
              </div>

              {/* Option B: A4 */}
              <div
                className={`p-4 rounded-xl border-2 transition ${
                  paperSize === 'a4' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      📄 {isEn ? 'Most Accessible' : 'সর্বাধিক সহজলভ্য (সাধারণ প্রিন্টার)'}
                    </span>
                    <h4 className="text-sm font-extrabold text-gray-900 mt-1">
                      A4 Paper (২১০ × ২৯৭ মিমি - ল্যান্ডস্কেপ ফোল্ড)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPaperSize('a4');
                      setLayoutMode('booklet_4page');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      paperSize === 'a4' && layoutMode === 'booklet_4page'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border'
                    }`}
                  >
                    {paperSize === 'a4' && layoutMode === 'booklet_4page' ? '✓ নির্বাচিত' : 'A4 বুকলেট নির্বাচন করুন'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <h5 className="font-bold text-indigo-950 mb-1">ধাপ ১: ব্রাউজার প্রিন্ট ডায়ালগ কনফিগারেশন</h5>
                <p>কীবোর্ডে Ctrl+P (বা Mac-এ Cmd+P) চাপুন। Destination-এ আপনার প্রিন্টার বা "Save as PDF" নির্বাচন করুন।</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <h5 className="font-bold text-indigo-950 mb-1">ধাপ ২: ডুপ্লেক্স সেটিং</h5>
                <p>Two-Sided প্রিন্ট অন করে <strong>"Flip on Short Edge"</strong> নির্বাচন করুন।</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
