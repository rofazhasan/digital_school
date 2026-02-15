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
      set.mtf?.length
    )
  );

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-gray-200 print:bg-white print:text-black" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=SolaimanLipi:wght@400;700&display=swap" rel="stylesheet" />
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
          t={t}
        />

        {/* MathJax Ready Indicator */}
        <div className="flex justify-center mt-2 gap-4">
          {isMathJaxReady ? (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">MathJax Ready</span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Waiting for MathJax...</span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${showAnswers
            ? 'bg-orange-100 text-orange-800'
            : 'bg-blue-100 text-blue-800'
            }`}>
            {showAnswers ? 'উত্তরপত্র মোড' : 'প্রশ্নপত্র মোড'}
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
                      mtf: set.mtf || []
                    }}
                    qrData={set.qrData}
                  />
                </div>
              ))}

              {/* Render OMR Sheets only for question papers */}
              {nonEmptySets.map((set: any) => (
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
                    mtf: set.mtf || []
                  }}
                  qrData={set.qrData}
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
        instituteName={examInfo.schoolName}
        examTitle={examInfo.title}
        examDate={examInfo.date}
        subjectName={examInfo.subject}
        uniqueCode={uniqueCode}
      />
    </div>
  );
};

// You would move these into a separate file e.g. `app/print/exam/[id]/PrintPageComponents.tsx`
// For demonstration, they are included here.

const PrintControls = ({ language, setLanguage, onPrint, isPrinting, isMathJaxReady, showAnswers, setShowAnswers, t }: any) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
    <div className="flex gap-2">
      <button
        onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
        className="bg-gray-200 text-gray-800 px-3 py-2 rounded shadow hover:bg-gray-300 transition border border-gray-300"
      >
        {language === 'bn' ? 'English' : 'বাংলা'}
      </button>
      <button
        onClick={() => setShowAnswers(!showAnswers)}
        className={`px-4 py-2 rounded shadow-lg transition ${showAnswers
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
      >
        {showAnswers ? 'প্রশ্নপত্র দেখুন' : 'উত্তরপত্র দেখুন'}
      </button>
      <button
        onClick={onPrint}
        disabled={isPrinting || !isMathJaxReady}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-wait"
      >
        {isPrinting ? t.preparing : t.print}
      </button>
    </div>
    {isPrinting && !isMathJaxReady && (
      <div className="text-sm text-blue-800 bg-blue-100 p-2 rounded-md shadow">
        {t.waiting}
      </div>
    )}
  </div>
);



// Replace Loader, PrintControls, SecurityFeatures with simple placeholders or remove their usage if not critical
// For Loader, use a simple div
const Loader = ({ message, isError = false }: { message: string, isError?: boolean }) => (
  <div className={`flex items-center justify-center min-h-screen text-lg ${isError ? 'text-red-500' : 'text-gray-700'}`}>{message}</div>
);