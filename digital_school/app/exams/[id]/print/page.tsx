"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { v4 as uuidv4 } from 'uuid';
import { mathJaxConfig as globalMathJaxConfig } from '@/app/components/MathJaxConfig';
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

  // Institute customization State
  const [hideInstitute, setHideInstitute] = useState(false);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [customSchoolAddress, setCustomSchoolAddress] = useState('');
  const [showEditInstituteModal, setShowEditInstituteModal] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState('');
  const [tempSchoolAddress, setTempSchoolAddress] = useState('');

  // Persist institute customization in localStorage
  useEffect(() => {
    if (!examId || typeof window === 'undefined') return;
    try {
      const savedHide = localStorage.getItem(`print_hide_institute_${examId}`);
      if (savedHide !== null) setHideInstitute(savedHide === 'true');
      const savedName = localStorage.getItem(`print_custom_name_${examId}`);
      if (savedName !== null) setCustomSchoolName(savedName);
      const savedAddress = localStorage.getItem(`print_custom_address_${examId}`);
      if (savedAddress !== null) setCustomSchoolAddress(savedAddress);
    } catch (e) {
      console.error(e);
    }
  }, [examId]);

  const toggleHideInstitute = () => {
    setHideInstitute((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem(`print_hide_institute_${examId}`, String(nextVal));
      } catch (e) {}
      return nextVal;
    });
  };

  const openEditInstituteModal = () => {
    setTempSchoolName(customSchoolName !== '' ? customSchoolName : (examData?.examInfo?.schoolName || ''));
    setTempSchoolAddress(customSchoolAddress !== '' ? customSchoolAddress : (examData?.examInfo?.schoolAddress || ''));
    setShowEditInstituteModal(true);
  };

  const handleSaveInstitute = (name: string, address: string) => {
    setCustomSchoolName(name);
    setCustomSchoolAddress(address);
    try {
      localStorage.setItem(`print_custom_name_${examId}`, name);
      localStorage.setItem(`print_custom_address_${examId}`, address);
    } catch (e) {}
    setShowEditInstituteModal(false);
  };

  const handleResetInstitute = () => {
    setCustomSchoolName('');
    setCustomSchoolAddress('');
    try {
      localStorage.removeItem(`print_custom_name_${examId}`);
      localStorage.removeItem(`print_custom_address_${examId}`);
    } catch (e) {}
    setShowEditInstituteModal(false);
  };

  const effectiveExamInfo = React.useMemo(() => {
    if (!examData?.examInfo) return null;
    return {
      ...examData.examInfo,
      schoolName: customSchoolName !== '' ? customSchoolName : examData.examInfo.schoolName,
      schoolAddress: customSchoolAddress !== '' ? customSchoolAddress : examData.examInfo.schoolAddress,
    };
  }, [examData?.examInfo, customSchoolName, customSchoolAddress]);

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

  // Check if MathJax is already loaded in parent context
  useEffect(() => {
    const checkMathJax = () => {
      if (typeof window !== 'undefined' && (window as any).MathJax && typeof (window as any).MathJax.typesetPromise === 'function') {
        setIsMathJaxReady(true);
        (window as any).__IS_MATHJAX_READY = true;
        return true;
      }
      return false;
    };

    if (checkMathJax()) return;

    const interval = setInterval(() => {
      if (checkMathJax()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
    ...globalMathJaxConfig,
    startup: {
      ready: () => {
        setIsMathJaxReady(true);
        (window as any).__IS_MATHJAX_READY = true;
        // @ts-ignore
        return (window as any).MathJax.startup.defaultReady();
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
  const { sets } = examData;
  const examInfo = effectiveExamInfo || examData.examInfo;
  const nonEmptySets = sets.filter(
    (set: any) => (
      set.mcq?.length ||
      set.mc?.length ||
      set.int?.length ||
      set.ar?.length ||
      set.cq?.length ||
      set.sq?.length ||
      set.mtf?.length ||
      set.descriptive?.length ||
      set.smcq?.length ||
      set.cma?.length ||
      set.mpc?.length ||
      set.dr?.length ||
      set.orderedObjective?.length
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
          hideInstitute={hideInstitute}
          toggleHideInstitute={toggleHideInstitute}
          openEditInstituteModal={openEditInstituteModal}
          showEditInstituteModal={showEditInstituteModal}
          setShowEditInstituteModal={setShowEditInstituteModal}
          tempSchoolName={tempSchoolName}
          setTempSchoolName={setTempSchoolName}
          tempSchoolAddress={tempSchoolAddress}
          setTempSchoolAddress={setTempSchoolAddress}
          handleSaveInstitute={handleSaveInstitute}
          handleResetInstitute={handleResetInstitute}
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
                      descriptive: set.descriptive || [],
                      smcq: set.smcq || [],
                      cma: set.cma || [],
                      mpc: set.mpc || [],
                      dr: set.dr || [],
                      allObjective: set.orderedObjective || []
                    }}
                    qrData={set.qrData}
                    fontSize={objectiveFontSize}
                    cqSqFontSize={cqSqFontSize}
                    forcePageBreak={forcePageBreak}
                    language={language}
                    hideOMR={!showOMR}
                    showDate={showDate}
                    hideInstitute={hideInstitute}
                  />
                </div>
              ))}

              {/* Render OMR Sheets only for question papers if showOMR is true */}
              {showOMR && nonEmptySets.map((set: any) => (
                <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} hideInstitute={hideInstitute} />
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
                    descriptive: set.descriptive || [],
                    smcq: set.smcq || [],
                    cma: set.cma || [],
                    mpc: set.mpc || [],
                    dr: set.dr || [],
                    allObjective: set.orderedObjective || []
                  }}
                  qrData={set.qrData}
                  fontSize={objectiveFontSize}
                  cqSqFontSize={cqSqFontSize}
                  forcePageBreak={forcePageBreak}
                  language={language}
                  hideOMR={!showOMR}
                  showDate={showDate}
                  hideInstitute={hideInstitute}
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

const OMRPage = ({ set, examInfo, language, hideInstitute }: { set: any, examInfo: any, language: 'bn' | 'en', hideInstitute?: boolean }) => {
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
        hideInstitute={hideInstitute}
      />
    </div>
  );
};

// You would move these into a separate file e.g. `app/print/exam/[id]/PrintPageComponents.tsx`
// For demonstration, they are included here.

const PrintControls = ({
  language, setLanguage, onPrint, isPrinting, isMathJaxReady, showAnswers, setShowAnswers,
  objectiveFontSize, setObjectiveFontSize, cqSqFontSize, setCqSqFontSize,
  forcePageBreak, setForcePageBreak, showOMR, setShowOMR, showDate, setShowDate,
  hideInstitute, toggleHideInstitute, openEditInstituteModal,
  showEditInstituteModal, setShowEditInstituteModal,
  tempSchoolName, setTempSchoolName, tempSchoolAddress, setTempSchoolAddress,
  handleSaveInstitute, handleResetInstitute, t
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

          {/* Institute Customization Controls */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'Institute:' : 'প্রতিষ্ঠান:'}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openEditInstituteModal}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 shadow-sm"
                title={language === 'en' ? 'Edit Institute Name & Address' : 'প্রতিষ্ঠানের নাম ও ঠিকানা এডিট করুন'}
              >
                ✏️ {language === 'en' ? 'Edit' : 'এডিট'}
              </button>
              <button
                type="button"
                onClick={toggleHideInstitute}
                className={`px-2 py-1 rounded text-[10px] font-bold transition shadow-sm ${hideInstitute ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
              >
                {hideInstitute ? (language === 'en' ? 'Hidden' : 'লুকানো') : (language === 'en' ? 'Visible' : 'দৃশ্যমান')}
              </button>
            </div>
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

        {/* Floating Institute Edit Popover Window */}
        {showEditInstituteModal && (
          <div className="mt-2 p-2.5 bg-gray-50 border border-amber-300 rounded-lg shadow-md text-left">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-200">
              <h4 className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                ✏️ {language === 'en' ? 'Edit Institution' : 'প্রতিষ্ঠান এডিট'}
              </h4>
              <button
                type="button"
                onClick={() => setShowEditInstituteModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[10px]">
              <div>
                <label className="block text-gray-600 font-semibold mb-0.5">
                  {language === 'en' ? 'Institution Name:' : 'প্রতিষ্ঠানের নাম:'}
                </label>
                <input
                  type="text"
                  value={tempSchoolName}
                  onChange={(e) => setTempSchoolName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter school name...' : 'প্রতিষ্ঠানের নাম লিখুন...'}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-0.5">
                  {language === 'en' ? 'Address:' : 'প্রতিষ্ঠানের ঠিকানা:'}
                </label>
                <input
                  type="text"
                  value={tempSchoolAddress}
                  onChange={(e) => setTempSchoolAddress(e.target.value)}
                  placeholder={language === 'en' ? 'Enter address...' : 'প্রতিষ্ঠানের ঠিকানা লিখুন...'}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-black"
                />
              </div>

              <div className="flex items-center justify-between pt-1 gap-1">
                <button
                  type="button"
                  onClick={handleResetInstitute}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-semibold transition"
                >
                  {language === 'en' ? 'Reset' : 'রিসেট'}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowEditInstituteModal(false)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] transition"
                  >
                    {language === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInstitute(tempSchoolName, tempSchoolAddress)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition"
                  >
                    {language === 'en' ? 'Save' : 'সংরক্ষণ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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