"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { v4 as uuidv4 } from 'uuid';
import Head from 'next/head';

// --- Component Imports (Assumed to be in these paths) ---
import QuestionPaper from '../../../components/QuestionPaper'; // The layout-only part of the question paper
import AnswerQuestionPaper from '../../../components/Answer_QuestionPaper'; // The answer sheet component
import OMRSheet from '../../../components/OMRSheet'; // Your OMR component
// import { Loader, PrintControls, SecurityFeatures } from './PrintPageComponents'; // Remove this line

import "./print.css"; // Your custom print styles

// --- Constants & Configuration ---
const LANGS = {
  bn: { print: "প্রিন্ট করুন", pdf: "PDF ডাউনলোড করুন", preparing: "প্রস্তুত করা হচ্ছে...", waiting: "ম্যাথ রেন্ডারিং এর জন্য অপেক্ষা করা হচ্ছে..." },
  en: { print: "Print", pdf: "Download PDF", preparing: "Preparing...", waiting: "Waiting for Math to render..." }
};

// --- Main Page Component ---
export default function PrintExamPage() {
  const params = useParams();
  const examId = params.id as string;

  // State Management
  const [examData, setExamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');

  // Print-specific State
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMathJaxReady, setIsMathJaxReady] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [objectiveFontSize, setObjectiveFontSize] = useState(100);
  const [cqSqFontSize, setCqSqFontSize] = useState(100);
  const [forcePageBreak, setForcePageBreak] = useState(false);
  const [showOMR, setShowOMR] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (!examId) {
      setError("Exam ID is missing.");
      setIsLoading(false);
      return;
    };

    const fetchExamData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/print/exam/${examId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch exam data. Status: ${response.status}`);
        }
        const data = await response.json();
        setExamData(data);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamData();
  }, [examId]); // Dependency array is correct

  // Apply page breaks when exam data changes
  useEffect(() => {
    if (examData && printRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
      }, 100);
    }
  }, [examData]);

  // --- THE CORE PRINTING LOGIC ---
  // @ts-ignore: react-to-print typing issue, content is valid
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examData?.examInfo?.title || "exam-print",
    onBeforeGetContent: async () => {
      // This is the key! We wait until MathJax is ready.
      setIsPrinting(true);

      if (isMathJaxReady) {
        return; // Already ready, proceed to print
      }
      // Not ready, so we wait for the pageReady callback to fire
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          // The isMathJaxReady state will be updated by the MathJaxContext callback
          if (printRef.current && (window as any).__IS_MATHJAX_READY) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100); // Check every 100ms
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false); // Reset state after printing
      (window as any).__IS_MATHJAX_READY = false; // Reset global flag
    },
  } as any);

  // --- MathJax Configuration ---
  const mathJaxConfig = {
    loader: { load: ["[tex]/ams"] },
    tex: {
      packages: { '[+]': ['ams'] },
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']]
    },
    startup: {
      // This function runs after MathJax has processed the page.
      pageReady: () => {
        setIsMathJaxReady(true);
        // Use a global flag as a fallback for the promise in handlePrint
        (window as any).__IS_MATHJAX_READY = true;
      }
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <Loader message="লোড হচ্ছে..." />;
  }

  if (error) {
    return <Loader message={`Error: ${error}`} isError />;
  }

  if (!examData) {
    return <Loader message="No exam data found." isError />;
  }

  const t = LANGS[language];
  const { examInfo, sets } = examData;
  const nonEmptySets = sets.filter(
    (set: any) => (
      set.mcq?.length ||
      set.mc?.length ||
      set.int?.length ||
      set.ar?.length ||
      set.cq?.length ||
      set.sq?.length ||
      set.mtf?.length ||
      set.descriptive?.length
    )
  );

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-gray-200 print:bg-white print:text-black" style={{ fontFamily: "'ExamFont', 'Noto Serif Bengali', Georgia, serif" }}>
        <Head>
          <title>প্রিন্ট প্রশ্নপত্র ও OMR</title>
        </Head>

        <PrintControls
          language={language}
          setLanguage={setLanguage}
          onPrint={handlePrint}
          isPrinting={isPrinting}
          isMathJaxReady={isMathJaxReady}
          showAnswers={showAnswers}
          setShowAnswers={setShowAnswers}
          objectiveFontSize={objectiveFontSize}
          setObjectiveFontSize={setObjectiveFontSize}
          cqSqFontSize={cqSqFontSize}
          setCqSqFontSize={setCqSqFontSize}
          forcePageBreak={forcePageBreak}
          setForcePageBreak={setForcePageBreak}
          showOMR={showOMR}
          setShowOMR={setShowOMR}
          showDate={showDate}
          setShowDate={setShowDate}
          t={t}
        />

        {/* Status Indicators */}
        <div className="flex justify-center mt-2 gap-4">
          {isMathJaxReady ? (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold">MathJax Ready</span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">Waiting for MathJax...</span>
          )}
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${showAnswers ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
            {showAnswers ? 'উত্তরপত্র' : 'প্রশ্নপত্র'}
          </span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-[10px] font-bold">
            OBJ: {objectiveFontSize}% | CQ/SQ: {cqSqFontSize}%
          </span>
        </div>

        <div ref={printRef} className="relative z-10">
          {/* Render Question Papers or Answer Sheets based on toggle */}
          {!showAnswers ? (
            // Question Papers
            <>
              {nonEmptySets.map((set: any) => (
                <div key={set.setId} className="print-page-container legal-paper" style={{ pageBreakAfter: 'always' }}>
                  <QuestionPaper
                    examInfo={{ ...examInfo, set: set.setName }}
                    questions={{
                      mcq: set.mcq || [],
                      mc: set.mc || [],
                      int: set.int || [],
                      ar: set.ar || [],
                      cq: set.cq || [],
                      sq: set.sq || [],
                      mtf: set.mtf || [],
                      descriptive: set.descriptive || []
                    }}
                    qrData={set.qrData}
                    fontSize={objectiveFontSize}
                    cqSqFontSize={cqSqFontSize}
                    forcePageBreak={forcePageBreak}
                    language={language}
                    hideOMR={!showOMR}
                    showDate={showDate}
                  />
                </div>
              ))}

              {/* Render OMR Sheets only for question papers if showOMR is true */}
              {showOMR && nonEmptySets.map((set: any) => (
                <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} />
              ))}
            </>
          ) : (
            // Answer Sheets (no OMR sheets)
            nonEmptySets.map((set: any) => (
              <div key={`answer-${set.setId}`} className="print-page-container legal-paper" style={{ pageBreakAfter: 'always' }}>
                <AnswerQuestionPaper
                  examInfo={{ ...examInfo, set: set.setName }}
                  questions={{
                    mcq: set.mcq || [],
                    mc: set.mc || [],
                    int: set.int || [],
                    ar: set.ar || [],
                    cq: set.cq || [],
                    sq: set.sq || [],
                    mtf: set.mtf || [],
                    descriptive: set.descriptive || []
                  }}
                  qrData={set.qrData}
                  fontSize={objectiveFontSize}
                  cqSqFontSize={cqSqFontSize}
                  forcePageBreak={forcePageBreak}
                  language={language}
                  hideOMR={!showOMR}
                  showDate={showDate}
                />
              </div>
            ))
          )}

        </div>
      </div>
    </MathJaxContext >
  );
}

// --- Refactored Sub-Components for Clarity ---

const OMRPage = ({ set, examInfo, language }: { set: any, examInfo: any, language: 'bn' | 'en' }) => {
  const [uniqueCode] = useState(() => uuidv4());

  // Calculate max options count (either 4 or 5) based on actual question data
  const mcqOptionsCount = React.useMemo(() => {
    if (!set.mcq || set.mcq.length === 0) return 4;
    const maxOptions = Math.max(...set.mcq.map((q: any) => q.options?.length || 0));
    return maxOptions > 4 ? 5 : 4;
  }, [set.mcq]);

  return (
    <div className="print-page-container legal-paper omr-sheet-wrapper">
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
      />
    </div>
  );
};

// You would move these into a separate file e.g. `app/print/exam/[id]/PrintPageComponents.tsx`
// For demonstration, they are included here.

const PrintControls = ({
  language, setLanguage, onPrint, isPrinting, isMathJaxReady, showAnswers, setShowAnswers,
  objectiveFontSize, setObjectiveFontSize, cqSqFontSize, setCqSqFontSize,
  forcePageBreak, setForcePageBreak, showOMR, setShowOMR, showDate, setShowDate, t
}: any) => {
  // If page break is off, keep font sizes in sync
  const updateGlobalFontSize = (delta: number) => {
    setObjectiveFontSize((prev: number) => Math.min(200, Math.max(50, prev + delta)));
    setCqSqFontSize((prev: number) => Math.min(200, Math.max(50, prev + delta)));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-col gap-2 bg-white/90 p-3 rounded-lg shadow-xl border border-gray-200 w-56">
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex-1 bg-gray-100 text-gray-800 px-2 py-2 rounded shadow hover:bg-gray-200 transition border border-gray-300 text-[10px] font-bold"
          >
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex-1 px-2 py-2 rounded shadow transition text-[10px] font-bold ${showAnswers ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}
          >
            {showAnswers ? 'প্রশ্নপত্র' : 'উত্তরপত্র'}
          </button>
        </div>

        <div className="border-t border-gray-200 mt-1 pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-600">পেজ ব্রেক (CQ):</span>
            <button
              onClick={() => setForcePageBreak(!forcePageBreak)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${forcePageBreak ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {forcePageBreak ? 'চালু' : 'বন্ধ'}
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'OMR Sheet:' : 'OMR শিট:'}</span>
            <button
              onClick={() => setShowOMR(!showOMR)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${showOMR ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {showOMR ? (language === 'en' ? 'Show' : 'চালু') : (language === 'en' ? 'Hide' : 'বন্ধ')}
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'Show Date:' : 'তারিখ দেখান:'}</span>
            <button
              onClick={() => setShowDate(!showDate)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${showDate ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {showDate ? (language === 'en' ? 'Show' : 'চালু') : (language === 'en' ? 'Hide' : 'বন্ধ')}
            </button>
          </div>

          {!forcePageBreak ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-gray-600 underline">গ্লোবাল ফন্ট:</span>
              <div className="flex gap-1">
                <button onClick={() => updateGlobalFontSize(-1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">-</button>
                <button onClick={() => updateGlobalFontSize(1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">+</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-600">Objective ফন্ট:</span>
                <div className="flex gap-1">
                  <button onClick={() => setObjectiveFontSize((p: number) => Math.max(50, p - 1))} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">-</button>
                  <button onClick={() => setObjectiveFontSize((p: number) => Math.min(200, p + 1))} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-gray-600">CQ/SQ ফন্ট:</span>
                <div className="flex gap-1">
                  <button onClick={() => setCqSqFontSize((p: number) => Math.max(50, p - 1))} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">-</button>
                  <button onClick={() => setCqSqFontSize((p: number) => Math.min(200, p + 1))} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onPrint}
          disabled={isPrinting || !isMathJaxReady}
          className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-wait font-bold"
        >
          {isPrinting ? t.preparing : t.print}
        </button>
      </div>
      {isPrinting && !isMathJaxReady && (
        <div className="text-[10px] text-blue-800 bg-blue-100 p-2 rounded-md shadow border border-blue-200 w-56">
          {t.waiting}
        </div>
      )}
    </div>
  );
};



// Replace Loader, PrintControls, SecurityFeatures with simple placeholders or remove their usage if not critical
// For Loader, use a simple div
const Loader = ({ message, isError = false }: { message: string, isError?: boolean }) => (
  <div className={`flex items-center justify-center min-h-screen text-lg ${isError ? 'text-red-500' : 'text-gray-700'}`}>{message}</div>
);