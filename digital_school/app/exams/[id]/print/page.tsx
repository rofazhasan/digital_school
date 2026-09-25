"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { v4 as uuidv4 } from 'uuid';
import { mathJaxConfig as globalMathJaxConfig } from '@/app/components/MathJaxConfig';
import Head from 'next/head';

// --- Component Imports ---
import QuestionPaper from '../../../components/QuestionPaper';
import AnswerQuestionPaper from '../../../components/Answer_QuestionPaper';
import OMRSheet from '../../../components/OMRSheet';

import "./print.css";

// --- Constants & Configuration ---
const LANGS = {
  bn: { print: "প্রিন্ট করুন", pdf: "PDF ডাউনলোড করুন", preparing: "প্রস্তুত করা হচ্ছে...", waiting: "ম্যাথ রেন্ডারিং এর জন্য অপেক্ষা করা হচ্ছে..." },
  en: { print: "Print", pdf: "Download PDF", preparing: "Preparing...", waiting: "Waiting for Math to render..." }
};

// --- Helper: Split an Exam Set into Logical Pages for Booklet Printing (4-page or 6-page) ---
function splitExamSetForBooklet(set: any, examInfo?: any, targetPages: number = 4) {
  const cqs = [...(set.cq || [])];
  const sqs = [...(set.sq || [])];
  const descriptives = [...(set.descriptive || [])];
  const mtfs = [...(set.mtf || [])];

  const emptyQuestions = {
    mcq: [], mc: [], int: [], ar: [], cq: [], sq: [], mtf: [], descriptive: [],
    smcq: [], cma: [], mpc: [], dr: [], allObjective: []
  };

  // Helper to package objective array into question format
  const makeObjQuestions = (arr: any[]) => ({
    mcq: arr.filter((q: any) => !q.type || q.type?.toUpperCase() === 'MCQ'),
    mc: arr.filter((q: any) => q.type?.toUpperCase() === 'MC'),
    int: arr.filter((q: any) => q.type?.toUpperCase() === 'INT' || q.type?.toUpperCase() === 'NUMERIC'),
    ar: arr.filter((q: any) => q.type?.toUpperCase() === 'AR'),
    cq: [],
    sq: [],
    mtf: [],
    descriptive: [],
    smcq: arr.filter((q: any) => q.type?.toUpperCase() === 'SMCQ'),
    cma: arr.filter((q: any) => q.type?.toUpperCase() === 'CMA'),
    mpc: arr.filter((q: any) => q.type?.toUpperCase() === 'MPC'),
    dr: arr.filter((q: any) => q.type?.toUpperCase() === 'DR'),
    allObjective: arr
  });

  // Check if Multi-Subject (MS) exam with subjects
  let parsedConfig: any = null;
  if (examInfo?.subjectsConfig) {
    if (typeof examInfo.subjectsConfig === 'string') {
      try { parsedConfig = JSON.parse(examInfo.subjectsConfig); } catch { parsedConfig = null; }
    } else {
      parsedConfig = examInfo.subjectsConfig;
    }
  }

  // Raw objective array
  const rawObj = (set.orderedObjective && set.orderedObjective.length > 0)
    ? [...set.orderedObjective]
    : [
        ...(set.mcq || []),
        ...(set.mc || []),
        ...(set.int || []),
        ...(set.ar || []),
        ...(set.smcq || []),
        ...(set.cma || []),
        ...(set.mpc || []),
        ...(set.dr || [])
      ];

  // Helper to extract clean subject name
  const getSubject = (q: any) => (q.subject || q.subjectName || q._canonicalSubject || '').trim();

  // Order questions strictly by configured subjects (compulsory first, then optional)
  let allObj: any[] = [];
  const configuredSubs: string[] = parsedConfig?.subjects?.map((s: any) => s.name) || [];

  if (configuredSubs.length > 0) {
    const assignedIds = new Set<string>();
    configuredSubs.forEach(subName => {
      const qs = rawObj.filter(q => {
        const qId = q.id || `${q.type}_${q.q || q.questionText}`;
        if (assignedIds.has(qId)) return false;
        const qSub = getSubject(q).toLowerCase();
        return qSub === subName.trim().toLowerCase() || (qSub && subName.toLowerCase().includes(qSub));
      });
      qs.forEach(q => {
        const qId = q.id || `${q.type}_${q.q || q.questionText}`;
        assignedIds.add(qId);
        allObj.push({ ...q, _canonicalSubject: subName });
      });
    });
    // Add any remaining unassigned questions
    rawObj.forEach(q => {
      const qId = q.id || `${q.type}_${q.q || q.questionText}`;
      if (!assignedIds.has(qId)) {
        allObj.push(q);
      }
    });
  } else {
    allObj = rawObj;
  }

  const totalObj = allObj.length;
  const totalWritten = cqs.length + sqs.length + descriptives.length + mtfs.length;

  if (totalObj === 0 && totalWritten === 0) {
    const emptyPages = [];
    for (let i = 0; i < targetPages; i++) {
      emptyPages.push({ questions: { ...emptyQuestions }, startIndex: 1, cqStartIndex: 1, sqStartIndex: 1, subjectName: '' });
    }
    return emptyPages;
  }

  // =========================================================================
  // PURE OBJECTIVE EXAM (Admission Standard: Krishi Guchho, BUET, DU, Medical)
  // Dynamic weight-based pagination across targetPages pages
  // =========================================================================
  if (totalWritten === 0) {
    const computeQuestionWeight = (q: any): number => {
      let w = 1.0;
      const textLen = (q.q || q.questionText || '').length;
      if (textLen > 140) w += 0.35;
      else if (textLen > 70) w += 0.15;

      const opts = q.options || [];
      const lengths = opts.map((o: any) => (typeof o === 'string' ? o : o.text || o || '').length);
      const maxOpt = Math.max(...lengths, 0);
      const totOpt = lengths.reduce((sum: number, l: number) => sum + l, 0);

      if (opts.length <= 2) {
        w += 0.25;
      } else if (opts.length === 4) {
        if (maxOpt <= 12 && totOpt <= 45) {
          w += 0.25; // 1 horizontal row
        } else if (maxOpt <= 32 && totOpt <= 120) {
          w += 0.65; // 2 rows
        } else {
          w += 1.35; // 4 rows
        }
      } else {
        w += 0.7;
      }

      if (q.image || q.imageUrl) {
        w += 2.0;
      }
      return w;
    };

    const weights = allObj.map(computeQuestionWeight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    // Page 1 has cover header (Title, Institute, Time, Marks, Guidelines),
    // taking ~16-18% height, so its capacity factor is ~0.86 (4-page) or ~0.82 (6-page).
    // Subsequent pages have full capacity (1.0).
    const capFactor1 = targetPages === 6 ? 0.82 : 0.86;
    const capFactors = [capFactor1];
    for (let i = 1; i < targetPages; i++) capFactors.push(1.0);
    const sumFactors = capFactors.reduce((a, b) => a + b, 0);
    const targetWeights = capFactors.map(f => (f / sumFactors) * totalWeight);

    const cumTargets: number[] = [];
    let curT = 0;
    for (let i = 0; i < targetPages - 1; i++) {
      curT += targetWeights[i];
      cumTargets.push(curT);
    }

    // Find subject boundaries (1-based indices where a subject ends)
    const subjectEndIndices: number[] = [];
    for (let i = 0; i < allObj.length; i++) {
      const curSub = getSubject(allObj[i]).toLowerCase();
      const nextSub = i + 1 < allObj.length ? getSubject(allObj[i + 1]).toLowerCase() : null;
      if (curSub !== nextSub) {
        subjectEndIndices.push(i + 1);
      }
    }

    // Compute split points
    let cumW = 0;
    let tIdx = 0;
    const splitPoints: number[] = [];
    for (let i = 0; i < allObj.length; i++) {
      cumW += weights[i];
      if (tIdx < cumTargets.length && cumW >= cumTargets[tIdx]) {
        let best = i + 1;
        // Snap to subject boundary ONLY if it is extremely close (+- 1 question)
        for (const sb of subjectEndIndices) {
          if (Math.abs(sb - best) <= 1) {
            best = sb;
            break;
          }
        }
        splitPoints.push(best);
        tIdx++;
      }
    }
    while (splitPoints.length < targetPages - 1) {
      splitPoints.push(Math.round(((splitPoints.length + 1) / targetPages) * totalObj));
    }

    const slices: any[][] = [];
    let prev = 0;
    for (let i = 0; i < targetPages; i++) {
      const end = i === targetPages - 1 ? totalObj : splitPoints[i];
      slices.push(allObj.slice(prev, end));
      prev = end;
    }

    return slices.map((pageQs, pIdx) => {
      const prevQs = allObj.slice(0, pIdx === 0 ? 0 : splitPoints[pIdx - 1]);
      const firstQ = pageQs[0];
      const firstSub = firstQ ? getSubject(firstQ) : '';

      // Count how many questions of firstSub were rendered before this page
      const countBefore = firstSub
        ? prevQs.filter(q => getSubject(q).toLowerCase() === firstSub.toLowerCase()).length
        : 0;
      const startIndex = countBefore + 1;

      // Extract unique subjects on this page for the running header tag
      const subs = [...new Set(pageQs.map(q => getSubject(q)).filter(Boolean))];
      if (countBefore > 0 && subs.length > 0) {
        subs[0] = `${subs[0]} (চলমান)`;
      }

      return {
        questions: makeObjQuestions(pageQs),
        startIndex,
        cqStartIndex: 1,
        sqStartIndex: 1,
        subjectName: subs.join(' | ')
      };
    });
  }

  // =========================================================================
  // SCENARIO 2: Mixed Objective + Written (CQ / SQ / Descriptive)
  // =========================================================================
  if (totalObj > 0 && totalWritten > 0) {
    const halfPages = Math.floor(targetPages / 2);
    const objPagesCount = halfPages;
    const wrtPagesCount = targetPages - halfPages;

    const objChunkSize = Math.ceil(totalObj / objPagesCount);
    const objPages: any[] = [];
    for (let i = 0; i < objPagesCount; i++) {
      const pageQs = allObj.slice(i * objChunkSize, (i + 1) * objChunkSize);
      objPages.push({
        questions: makeObjQuestions(pageQs),
        startIndex: (i * objChunkSize) + 1,
        cqStartIndex: 1,
        sqStartIndex: 1,
        subjectName: ''
      });
    }

    const allWritten: any[] = [];
    cqs.forEach(q => allWritten.push({ ...q, _kind: 'cq' }));
    sqs.forEach(q => allWritten.push({ ...q, _kind: 'sq' }));
    descriptives.forEach(q => allWritten.push({ ...q, _kind: 'desc' }));
    mtfs.forEach(q => allWritten.push({ ...q, _kind: 'mtf' }));

    const wrtChunkSize = Math.ceil(allWritten.length / wrtPagesCount);
    const wrtPages: any[] = [];
    for (let i = 0; i < wrtPagesCount; i++) {
      const pageW = allWritten.slice(i * wrtChunkSize, (i + 1) * wrtChunkSize);
      wrtPages.push({
        questions: {
          mcq: [], mc: [], int: [], ar: [], smcq: [], cma: [], mpc: [], dr: [], allObjective: [],
          cq: pageW.filter(q => q._kind === 'cq'),
          sq: pageW.filter(q => q._kind === 'sq'),
          descriptive: pageW.filter(q => q._kind === 'desc'),
          mtf: pageW.filter(q => q._kind === 'mtf')
        },
        startIndex: totalObj + 1,
        cqStartIndex: (i * wrtChunkSize) + 1,
        sqStartIndex: 1,
        subjectName: ''
      });
    }

    return [...objPages, ...wrtPages];
  }

  // =========================================================================
  // SCENARIO 3: Pure Written Exam (CQ / SQ Only)
  // =========================================================================
  const allWritten: any[] = [];
  cqs.forEach(q => allWritten.push({ ...q, _kind: 'cq' }));
  sqs.forEach(q => allWritten.push({ ...q, _kind: 'sq' }));
  descriptives.forEach(q => allWritten.push({ ...q, _kind: 'desc' }));
  mtfs.forEach(q => allWritten.push({ ...q, _kind: 'mtf' }));

  const wTotal = allWritten.length;
  const p1WCount = Math.max(1, Math.round(wTotal * (targetPages === 6 ? 0.14 : 0.20)));
  const wRem = wTotal - p1WCount;
  const otherPages = targetPages - 1;
  const otherCount = Math.ceil(wRem / otherPages);

  const writtenPages: any[] = [];
  let wPrev = 0;
  for (let i = 0; i < targetPages; i++) {
    const end = i === 0 ? p1WCount : (i === targetPages - 1 ? wTotal : Math.min(wTotal, p1WCount + i * otherCount));
    const sliceW = allWritten.slice(wPrev, end);
    wPrev = end;
    writtenPages.push({
      questions: {
        mcq: [], mc: [], int: [], ar: [], smcq: [], cma: [], mpc: [], dr: [], allObjective: [],
        cq: sliceW.filter(q => q._kind === 'cq'),
        sq: sliceW.filter(q => q._kind === 'sq'),
        descriptive: sliceW.filter(q => q._kind === 'desc'),
        mtf: sliceW.filter(q => q._kind === 'mtf')
      },
      startIndex: 1,
      cqStartIndex: (i === 0 ? 1 : writtenPages[i-1].cqStartIndex + writtenPages[i-1].questions.cq.length),
      sqStartIndex: 1,
      subjectName: ''
    });
  }

  return writtenPages;
}

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

  // Paper Size & Booklet Options State
  const [paperSize, setPaperSize] = useState<'legal' | 'a4' | 'a3' | 'letter'>('a4');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'booklet_4page' | 'booklet_6page' | 'booklet_2up'>('standard');
  const [showFoldGuide, setShowFoldGuide] = useState(true);
  const [showBookletGuideModal, setShowBookletGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'paper_comparison' | 'print_steps'>('paper_comparison');

  // Institute customization State
  const [hideInstitute, setHideInstitute] = useState(false);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [customSchoolAddress, setCustomSchoolAddress] = useState('');
  const [showEditInstituteModal, setShowEditInstituteModal] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState('');
  const [tempSchoolAddress, setTempSchoolAddress] = useState('');

  // Persist print setup & institute customization in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPaper = localStorage.getItem('print_paper_size');
      if (savedPaper) setPaperSize(savedPaper as any);
      const savedLayout = localStorage.getItem('print_layout_mode');
      if (savedLayout) setLayoutMode(savedLayout as any);
      const savedFold = localStorage.getItem('print_show_fold_guide');
      if (savedFold !== null) setShowFoldGuide(savedFold === 'true');

      if (examId) {
        const savedHide = localStorage.getItem(`print_hide_institute_${examId}`);
        if (savedHide !== null) setHideInstitute(savedHide === 'true');
        const savedName = localStorage.getItem(`print_custom_name_${examId}`);
        if (savedName !== null) setCustomSchoolName(savedName);
        const savedAddress = localStorage.getItem(`print_custom_address_${examId}`);
        if (savedAddress !== null) setCustomSchoolAddress(savedAddress);
      }
    } catch (e) {
      console.error(e);
    }
  }, [examId]);

  const handlePaperSizeChange = (val: 'legal' | 'a4' | 'a3' | 'letter') => {
    setPaperSize(val);
    try { localStorage.setItem('print_paper_size', val); } catch (e) {}
  };

  const handleLayoutModeChange = (val: 'standard' | 'booklet_4page' | 'booklet_2up') => {
    setLayoutMode(val);
    try { localStorage.setItem('print_layout_mode', val); } catch (e) {}
  };

  const toggleFoldGuide = () => {
    setShowFoldGuide((prev) => {
      const next = !prev;
      try { localStorage.setItem('print_show_fold_guide', String(next)); } catch (e) {}
      return next;
    });
  };

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

  const effectiveExamInfo = useMemo(() => {
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
    }

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
  }, [examId]);

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

  // --- THE CORE PRINTING LOGIC ---
  // @ts-ignore: react-to-print typing issue, content is valid
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examData?.examInfo?.title || "exam-print",
    onBeforeGetContent: async () => {
      setIsPrinting(true);
      if (isMathJaxReady) {
        return;
      }
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (printRef.current && (window as any).__IS_MATHJAX_READY) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      (window as any).__IS_MATHJAX_READY = false;
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

  const paperClass = paperSize === 'legal' ? 'legal-paper' : paperSize === 'a3' ? 'a3-paper' : paperSize === 'letter' ? 'letter-paper' : 'a4-paper';
  const isBooklet = layoutMode === 'booklet_4page' || layoutMode === 'booklet_6page' || layoutMode === 'booklet_2up';

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-gray-200 print:bg-white print:text-black" style={{ fontFamily: "'ExamFont', 'Noto Serif Bengali', Georgia, serif" }}>
        <Head>
          <title>প্রিন্ট প্রশ্নপত্র ও OMR</title>
        </Head>

        {/* Dynamic @page configuration for print */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${
                isBooklet
                  ? (paperSize === 'a3' ? 'A3 landscape' : paperSize === 'a4' ? 'A4 landscape' : paperSize === 'legal' ? 'legal landscape' : 'letter landscape')
                  : (paperSize === 'a3' ? 'A3 portrait' : paperSize === 'a4' ? 'A4 portrait' : paperSize === 'legal' ? 'legal portrait' : 'letter portrait')
              };
              margin: ${
                isBooklet
                  ? (paperSize === 'a3' ? '8mm' : '5mm')
                  : (paperSize === 'a3' ? '12mm' : paperSize === 'legal' ? '12mm' : '8mm')
              };
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` }} />

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
          paperSize={paperSize}
          setPaperSize={handlePaperSizeChange}
          layoutMode={layoutMode}
          setLayoutMode={handleLayoutModeChange}
          showFoldGuide={showFoldGuide}
          toggleFoldGuide={toggleFoldGuide}
          openBookletGuide={() => setShowBookletGuideModal(true)}
          t={t}
        />

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center items-center mt-3 gap-2 px-4 print:hidden">
          {isMathJaxReady ? (
            <span className="bg-green-100 text-green-800 border border-green-300 px-3 py-0.5 rounded-full text-[10px] font-bold">
              ✓ MathJax Ready
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              ⏳ Waiting for MathJax...
            </span>
          )}

          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${showAnswers ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
            {showAnswers ? 'উত্তরপত্র ও সমাধান' : 'প্রশ্নপত্র'}
          </span>

          <span className="bg-purple-100 text-purple-800 border border-purple-300 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase">
            সাইজ: {paperSize.toUpperCase()} {isBooklet ? '(বুকলেট ল্যান্ডস্কেপ)' : '(খাড়া পেপার)'}
          </span>

          {paperSize === 'a3' && isBooklet && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
              🌟 ভর্তি পরীক্ষার গোল্ড স্ট্যান্ডার্ড (ভাঁজ করলে পূর্ণাঙ্গ A4 বুকলেট)
            </span>
          )}

          <span className="bg-gray-100 text-gray-800 border border-gray-300 px-3 py-0.5 rounded-full text-[10px] font-bold">
            ফন্ট: OBJ {objectiveFontSize}% | CQ/SQ {cqSqFontSize}%
          </span>
        </div>

        {/* Main Printable Content Container */}
        <div ref={printRef} className="relative z-10 my-4">
          
          {/* ==============================================================
              CASE 1: STANDARD 1-PAGE VERTICAL CONTINUOUS PRINTING
             ============================================================== */}
          {layoutMode === 'standard' && (
            <>
              {!showAnswers ? (
                // Question Papers (Standard)
                <>
                  {nonEmptySets.map((set: any) => (
                    <div key={set.setId} className={`print-page-container ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
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
                    <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} hideInstitute={hideInstitute} paperClass={paperClass} />
                  ))}
                </>
              ) : (
                // Answer Sheets (Standard)
                nonEmptySets.map((set: any) => (
                  <div key={`answer-${set.setId}`} className={`print-page-container ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
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
            </>
          )}

          {/* ==============================================================
              CASE 2: 4-PAGE BOOKLET IMPOSITION (OUTER 4|1, INNER 2|3)
             ============================================================== */}
          {layoutMode === 'booklet_4page' && (
            <>
              {nonEmptySets.map((set: any) => {
                const [p1, p2, p3, p4] = splitExamSetForBooklet(set, examInfo, 4);
                return (
                  <React.Fragment key={`booklet-imposed-${set.setId}`}>
                    {/* SHEET 1: OUTER SPREAD (Side 1) -> Left: Page 4 (Back) | Right: Page 1 (Front) */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      {/* Left Column: Page 4 (Back Cover & Final Questions) */}
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p4.subjectName ? (language === 'en' ? `SUBJECT: ${p4.subjectName}` : `বিষয়: ${p4.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 4 (Back Cover)' : 'পৃষ্ঠা ৪ (শেষ পাতা)'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                        <div className="booklet-end-banner">
                          {language === 'en' ? '— END OF QUESTION PAPER —' : '— সমাপ্ত (সকল প্রশ্নের উত্তর দেওয়া শেষ করুন) —'}
                        </div>
                      </div>

                      {/* Center Fold Crease Line */}
                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'FOLD HERE' : 'মাঝে ভাঁজ করুন'}</span>
                        </div>
                      )}

                      {/* Right Column: Page 1 (Front Cover & Initial Questions) */}
                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 1 (Front Cover)' : 'পৃষ্ঠা ১ (কভার)'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>

                    {/* SHEET 2: INNER SPREAD (Side 2) -> Left: Page 2 | Right: Page 3 */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      {/* Left Column: Page 2 (Inside Left) */}
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p2.subjectName ? (language === 'en' ? `SUBJECT: ${p2.subjectName}` : `বিষয়: ${p2.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 2' : 'পৃষ্ঠা ২'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>

                      {/* Center Fold Crease Line */}
                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'FOLD HERE' : 'মাঝে ভাঁজ করুন'}</span>
                        </div>
                      )}

                      {/* Right Column: Page 3 (Inside Right) */}
                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{p3.subjectName ? (language === 'en' ? `SUBJECT: ${p3.subjectName}` : `বিষয়: ${p3.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 3' : 'পৃষ্ঠা ৩'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* OMR Sheets if requested */}
              {showOMR && !showAnswers && nonEmptySets.map((set: any) => (
                <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} hideInstitute={hideInstitute} paperClass={paperClass} />
              ))}
            </>
          )}

          {/* ==============================================================
              CASE 3: 6-PAGE BOOKLET IMPOSITION (SHEET 1: 6|1, SHEET 2: 2|5, SHEET 3: 3|4)
             ============================================================== */}
          {layoutMode === 'booklet_6page' && (
            <>
              {nonEmptySets.map((set: any) => {
                const [p1, p2, p3, p4, p5, p6] = splitExamSetForBooklet(set, examInfo, 6);
                return (
                  <React.Fragment key={`booklet-6page-${set.setId}`}>
                    {/* SHEET 1: OUTER SPREAD -> Left: Page 6 (Back Cover) | Right: Page 1 (Front Cover) */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      {/* Left Column: Page 6 (Back Cover & Final Questions) */}
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p6?.subjectName ? (language === 'en' ? `SUBJECT: ${p6.subjectName}` : `বিষয়: ${p6.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 6 (Back Cover)' : 'পৃষ্ঠা ৬ (শেষ পাতা)'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p6.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p6.startIndex}
                            startCqIndex={p6.cqStartIndex}
                            startSqIndex={p6.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p6.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p6.startIndex}
                            startCqIndex={p6.cqStartIndex}
                            startSqIndex={p6.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                        <div className="booklet-end-banner">
                          {language === 'en' ? '— END OF QUESTION PAPER —' : '— সমাপ্ত (সকল প্রশ্নের উত্তর দেওয়া শেষ করুন) —'}
                        </div>
                      </div>

                      {/* Center Fold Crease Line */}
                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'SHEET 1 (PAGES 6 & 1)' : 'শিট ১ (পৃষ্ঠা ৬ ও ১)'}</span>
                        </div>
                      )}

                      {/* Right Column: Page 1 (Front Cover & Initial Questions) */}
                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 1 (Front Cover)' : 'পৃষ্ঠা ১ (কভার)'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>

                    {/* SHEET 2: MIDDLE SPREAD -> Left: Page 2 | Right: Page 5 */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      {/* Left Column: Page 2 */}
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p2?.subjectName ? (language === 'en' ? `SUBJECT: ${p2.subjectName}` : `বিষয়: ${p2.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 2' : 'পৃষ্ঠা ২'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>

                      {/* Center Fold Crease Line */}
                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'SHEET 2 (PAGES 2 & 5)' : 'শিট ২ (পৃষ্ঠা ২ ও ৫)'}</span>
                        </div>
                      )}

                      {/* Right Column: Page 5 */}
                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{p5?.subjectName ? (language === 'en' ? `SUBJECT: ${p5.subjectName}` : `বিষয়: ${p5.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 5' : 'পৃষ্ঠা ৫'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p5.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p5.startIndex}
                            startCqIndex={p5.cqStartIndex}
                            startSqIndex={p5.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p5.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p5.startIndex}
                            startCqIndex={p5.cqStartIndex}
                            startSqIndex={p5.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>

                    {/* SHEET 3: CENTER FOLD SPREAD -> Left: Page 3 | Right: Page 4 */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      {/* Left Column: Page 3 */}
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p3?.subjectName ? (language === 'en' ? `SUBJECT: ${p3.subjectName}` : `বিষয়: ${p3.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 3' : 'পৃষ্ঠা ৩'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>

                      {/* Center Fold Crease Line */}
                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'SHEET 3 (CENTER FOLD - PAGES 3 & 4)' : 'শিট ৩ (মাঝের পাতা ৩ ও ৪)'}</span>
                        </div>
                      )}

                      {/* Right Column: Page 4 */}
                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{p4?.subjectName ? (language === 'en' ? `SUBJECT: ${p4.subjectName}` : `বিষয়: ${p4.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 4' : 'পৃষ্ঠা ৪'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* OMR Sheets if requested */}
              {showOMR && !showAnswers && nonEmptySets.map((set: any) => (
                <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} hideInstitute={hideInstitute} paperClass={paperClass} />
              ))}
            </>
          )}

          {/* ==============================================================
              CASE 3: 2-UP SEQUENTIAL SPREAD (1|2, 3|4)
             ============================================================== */}
          {layoutMode === 'booklet_2up' && (
            <>
              {nonEmptySets.map((set: any) => {
                const [p1, p2, p3, p4] = splitExamSetForBooklet(set, examInfo);
                return (
                  <React.Fragment key={`booklet-seq-${set.setId}`}>
                    {/* SPREAD 1: Page 1 [Left] | Page 2 [Right] */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 1' : 'পৃষ্ঠা ১'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p1.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={false}
                            hideSignature={true}
                            startQuestionIndex={p1.startIndex}
                            startCqIndex={p1.cqStartIndex}
                            startSqIndex={p1.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>

                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'FOLD HERE' : 'মাঝে ভাঁজ করুন'}</span>
                        </div>
                      )}

                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{p2.subjectName ? (language === 'en' ? `SUBJECT: ${p2.subjectName}` : `বিষয়: ${p2.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 2' : 'পৃষ্ঠা ২'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p2.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p2.startIndex}
                            startCqIndex={p2.cqStartIndex}
                            startSqIndex={p2.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>
                    </div>

                    {/* SPREAD 2: Page 3 [Left] | Page 4 [Right] */}
                    <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always' }}>
                      <div className="booklet-half-page booklet-left">
                        <div className="booklet-page-header-tag">
                          <span>{p3.subjectName ? (language === 'en' ? `SUBJECT: ${p3.subjectName}` : `বিষয়: ${p3.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 3' : 'পৃষ্ঠা ৩'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p3.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={true}
                            startQuestionIndex={p3.startIndex}
                            startCqIndex={p3.cqStartIndex}
                            startSqIndex={p3.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                      </div>

                      {showFoldGuide && (
                        <div className="booklet-center-crease">
                          <span className="booklet-fold-badge">✂ {language === 'en' ? 'FOLD HERE' : 'মাঝে ভাঁজ করুন'}</span>
                        </div>
                      )}

                      <div className="booklet-half-page booklet-right">
                        <div className="booklet-page-header-tag">
                          <span>{p4.subjectName ? (language === 'en' ? `SUBJECT: ${p4.subjectName}` : `বিষয়: ${p4.subjectName}`) : examInfo.title}</span>
                          <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">{language === 'en' ? 'Page 4' : 'পৃষ্ঠা ৪'}</span>
                        </div>
                        {!showAnswers ? (
                          <QuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        ) : (
                          <AnswerQuestionPaper
                            examInfo={{ ...examInfo, set: set.setName }}
                            questions={p4.questions}
                            qrData={set.qrData}
                            fontSize={objectiveFontSize}
                            cqSqFontSize={cqSqFontSize}
                            forcePageBreak={false}
                            language={language}
                            hideOMR={!showOMR}
                            showDate={showDate}
                            hideInstitute={hideInstitute}
                            hideHeader={true}
                            hideSignature={false}
                            startQuestionIndex={p4.startIndex}
                            startCqIndex={p4.cqStartIndex}
                            startSqIndex={p4.sqStartIndex}
                            pageNumberLabel=""
                          />
                        )}
                        <div className="booklet-end-banner">
                          {language === 'en' ? '— END OF QUESTION PAPER —' : '— সমাপ্ত (সকল প্রশ্নের উত্তর দেওয়া শেষ করুন) —'}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* OMR Sheets if requested */}
              {showOMR && !showAnswers && nonEmptySets.map((set: any) => (
                <OMRPage key={`omr-${set.setId}`} set={set} examInfo={examInfo} language={language} hideInstitute={hideInstitute} paperClass={paperClass} />
              ))}
            </>
          )}

        </div>

        {/* Booklet & Paper Size Advisory Modal */}
        {showBookletGuideModal && (
          <BookletGuideModal
            language={language}
            paperSize={paperSize}
            setPaperSize={handlePaperSizeChange}
            layoutMode={layoutMode}
            setLayoutMode={handleLayoutModeChange}
            activeTab={activeGuideTab}
            setActiveTab={setActiveGuideTab}
            onClose={() => setShowBookletGuideModal(false)}
          />
        )}

      </div>
    </MathJaxContext>
  );
}

// --- Sub-Component: OMR Page ---
const OMRPage = ({ set, examInfo, language, hideInstitute, paperClass = 'a4-paper' }: { set: any, examInfo: any, language: 'bn' | 'en', hideInstitute?: boolean, paperClass?: string }) => {
  const [uniqueCode] = useState(() => uuidv4());

  const mcqOptionsCount = useMemo(() => {
    if (!set.mcq || set.mcq.length === 0) return 4;
    const maxOptions = Math.max(...set.mcq.map((q: any) => q.options?.length || 0));
    return maxOptions > 4 ? 5 : 4;
  }, [set.mcq]);

  return (
    <div className={`print-page-container ${paperClass} omr-sheet-wrapper`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

// --- Sub-Component: PrintControls ---
const PrintControls = ({
  language, setLanguage, onPrint, isPrinting, isMathJaxReady, showAnswers, setShowAnswers,
  objectiveFontSize, setObjectiveFontSize, cqSqFontSize, setCqSqFontSize,
  forcePageBreak, setForcePageBreak, showOMR, setShowOMR, showDate, setShowDate,
  hideInstitute, toggleHideInstitute, openEditInstituteModal,
  showEditInstituteModal, setShowEditInstituteModal,
  tempSchoolName, setTempSchoolName, tempSchoolAddress, setTempSchoolAddress,
  handleSaveInstitute, handleResetInstitute,
  paperSize, setPaperSize, layoutMode, setLayoutMode,
  showFoldGuide, toggleFoldGuide, openBookletGuide,
  t
}: any) => {
  const updateGlobalFontSize = (delta: number) => {
    setObjectiveFontSize((prev: number) => Math.min(200, Math.max(50, prev + delta)));
    setCqSqFontSize((prev: number) => Math.min(200, Math.max(50, prev + delta)));
  };

  const isBooklet = layoutMode === 'booklet_4page' || layoutMode === 'booklet_2up';

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-col gap-2.5 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-2xl border border-gray-300 w-64 sm:w-72 max-h-[92vh] overflow-y-auto text-xs">
        
        {/* Row 1: Language & Question/Answer toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-2 rounded-lg font-bold border border-gray-300 transition text-[11px]"
          >
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-[11px] shadow-sm ${showAnswers ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {showAnswers ? 'উত্তরপত্র' : 'প্রশ্নপত্র'}
          </button>
        </div>

        {/* Section: Paper Size & Booklet Setup */}
        <div className="border-t border-gray-200 pt-2 space-y-2">
          
          {/* Paper Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-700 text-[11px]">
                {language === 'en' ? 'Paper Size:' : 'পেপারের সাইজ:'}
              </span>
              <button
                type="button"
                onClick={openBookletGuide}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-0.5"
                title="কোন পেপার সাইজটি সেরা তা জানতে ক্লিক করুন"
              >
                💡 {language === 'en' ? 'Which is Best?' : 'কোনটি সেরা?'}
              </button>
            </div>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
            >
              <option value="a4">A4 Paper (Standard 210×297mm)</option>
              <option value="a3">A3 Paper (🌟 Admission Booklet / ভর্তি সেরা)</option>
              <option value="legal">Legal Paper (Long 8.5×14")</option>
              <option value="letter">Letter Paper (8.5×11")</option>
            </select>
          </div>

          {/* Print Layout / Booklet Mode Selection */}
          <div>
            <span className="block font-bold text-gray-700 mb-1 text-[11px]">
              {language === 'en' ? 'Print Layout Mode:' : 'প্রিন্ট লেআউট মোড:'}
            </span>
            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLayoutMode('standard')}
                className={`py-1.5 px-0.5 rounded font-bold text-[9px] transition text-center leading-tight ${layoutMode === 'standard' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                {language === 'en' ? 'Standard' : '১-পেজ'}
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('booklet_4page')}
                className={`py-1.5 px-0.5 rounded font-bold text-[9px] transition text-center leading-tight ${layoutMode === 'booklet_4page' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                title="৪ পৃষ্ঠার ফোল্ডেবল বুকলেট (৪|১ ও ২|৩)"
              >
                {language === 'en' ? '4P Booklet' : '৪-পৃষ্ঠা'}
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('booklet_6page')}
                className={`py-1.5 px-0.5 rounded font-bold text-[9px] transition text-center leading-tight ${layoutMode === 'booklet_6page' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                title="৬ পৃষ্ঠার নেস্টেড বুকলেট (৬|১, ২|৫, ৩|৪)"
              >
                {language === 'en' ? '6P Booklet' : '৬-পৃষ্ঠা'}
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('booklet_2up')}
                className={`py-1.5 px-0.5 rounded font-bold text-[9px] transition text-center leading-tight ${layoutMode === 'booklet_2up' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                title="ধারাবাহিক ২-পৃষ্ঠা পাশাপাশি স্প্রেড"
              >
                {language === 'en' ? '2-Up Spread' : '২-পেজ'}
              </button>
            </div>
          </div>

          {/* Booklet Sub-Controls & Advice Card */}
          {isBooklet && (
            <div className="bg-indigo-50/80 border border-indigo-200 p-2 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-900">
                  {language === 'en' ? 'Center Fold Crease Line:' : 'মাঝে ভাঁজ রেখা (Fold Line):'}
                </span>
                <button
                  type="button"
                  onClick={toggleFoldGuide}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${showFoldGuide ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {showFoldGuide ? (language === 'en' ? 'ON' : 'চালু') : (language === 'en' ? 'OFF' : 'বন্ধ')}
                </button>
              </div>

              {/* Recommendation Callout */}
              <div className="text-[10px] text-indigo-800 leading-tight bg-white p-1.5 rounded border border-indigo-100">
                {layoutMode === 'booklet_6page' ? (
                  <span>📑 <strong>৬-পৃষ্ঠা বুকলেট:</strong> শিট ১ (৬ ও ১) • শিট ২ (২ ও ৫) • শিট ৩ (৩ ও ৪)। ৩ শিট ক্রমানুসারে নেস্টেড ভাঁজ।</span>
                ) : layoutMode === 'booklet_4page' ? (
                  <span>📖 <strong>৪-পৃষ্ঠা বুকলেট:</strong> শিট ১ (৪ ও ১) • শিট ২ (২ ও ৩)। মাঝে ভাঁজ করলেই পারফেক্ট বুকলেট।</span>
                ) : (
                  <span>📑 <strong>২-পেজ স্প্রেড:</strong> ধারাবাহিক ২-পৃষ্ঠা পাশাপাশি স্প্রেড (১|২, ৩|৪)।</span>
                )}
              </div>

              {/* Button to open Guide Modal */}
              <button
                type="button"
                onClick={openBookletGuide}
                className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] transition flex items-center justify-center gap-1 shadow-sm"
              >
                📖 {language === 'en' ? 'View Duplex & Folding Guide' : 'বুকলেট প্রিন্ট ও ভাঁজ নির্দেশিকা'}
              </button>
            </div>
          )}
        </div>

        {/* Section: Exam Options (CQ Break, OMR, Date, Institute) */}
        <div className="border-t border-gray-200 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'Page Break (CQ):' : 'পেজ ব্রেক (CQ):'}</span>
            <button
              type="button"
              onClick={() => setForcePageBreak(!forcePageBreak)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${forcePageBreak ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {forcePageBreak ? 'চালু' : 'বন্ধ'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'OMR Sheet:' : 'OMR শিট:'}</span>
            <button
              type="button"
              onClick={() => setShowOMR(!showOMR)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${showOMR ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {showOMR ? (language === 'en' ? 'Show' : 'চালু') : (language === 'en' ? 'Hide' : 'বন্ধ')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'Show Date:' : 'তারিখ দেখান:'}</span>
            <button
              type="button"
              onClick={() => setShowDate(!showDate)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${showDate ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {showDate ? (language === 'en' ? 'Show' : 'চালু') : (language === 'en' ? 'Hide' : 'বন্ধ')}
            </button>
          </div>

          {/* Institute Customization Controls */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-600">{language === 'en' ? 'Institute:' : 'প্রতিষ্ঠান:'}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openEditInstituteModal}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 shadow-sm"
                title={language === 'en' ? 'Edit Institute Name & Address' : 'প্রতিষ্ঠানের নাম ও ঠিকানা এডিট করুন'}
              >
                ✏️ {language === 'en' ? 'Edit' : 'এডিট'}
              </button>
              <button
                type="button"
                onClick={toggleHideInstitute}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition shadow-sm ${hideInstitute ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
              >
                {hideInstitute ? (language === 'en' ? 'Hidden' : 'লুকানো') : (language === 'en' ? 'Visible' : 'দৃশ্যমান')}
              </button>
            </div>
          </div>
        </div>

        {/* Section: Font Size Scaling */}
        <div className="border-t border-gray-200 pt-2 space-y-1.5">
          {!forcePageBreak ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-700">গ্লোবাল ফন্ট: {objectiveFontSize}%</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => updateGlobalFontSize(-1)} className="w-7 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">-</button>
                <button type="button" onClick={() => updateGlobalFontSize(1)} className="w-7 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">+</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-700">OBJ: {objectiveFontSize}%</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setObjectiveFontSize((p: number) => Math.max(50, p - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">-</button>
                  <button type="button" onClick={() => setObjectiveFontSize((p: number) => Math.min(200, p + 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-700">CQ/SQ: {cqSqFontSize}%</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setCqSqFontSize((p: number) => Math.max(50, p - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">-</button>
                  <button type="button" onClick={() => setCqSqFontSize((p: number) => Math.min(200, p + 1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs">+</button>
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

        {/* Print Button */}
        <button
          type="button"
          onClick={onPrint}
          disabled={isPrinting || !isMathJaxReady}
          className="w-full mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-wait font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <span>🖨️</span>
          <span>{isPrinting ? t.preparing : t.print}</span>
        </button>
      </div>

      {isPrinting && !isMathJaxReady && (
        <div className="text-[10px] text-blue-800 bg-blue-100 p-2 rounded-md shadow border border-blue-200 w-64 sm:w-72">
          {t.waiting}
        </div>
      )}
    </div>
  );
};

// --- Sub-Component: Comprehensive Booklet & Paper Size Advisory Modal ---
const BookletGuideModal = ({
  language, paperSize, setPaperSize, layoutMode, setLayoutMode, activeTab, setActiveTab, onClose
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
            className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'paper_comparison' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            🌟 {isEn ? 'Which Paper Size is Best?' : 'কোন পেপার সাইজটি সেরা?'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('print_steps')}
            className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'print_steps' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            🖨️ {isEn ? 'Duplex Print & Folding Steps' : 'ডুপ্লেক্স প্রিন্ট ও ভাঁজ করার ধাপ'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 flex-1">
          {activeTab === 'paper_comparison' ? (
            <div className="space-y-4">
              
              {/* Option A: A3 (Recommended) */}
              <div className={`p-4 rounded-xl border-2 transition ${paperSize === 'a3' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
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
                    onClick={() => { setPaperSize('a3'); setLayoutMode('booklet_4page'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${paperSize === 'a3' && layoutMode === 'booklet_4page' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border'}`}
                  >
                    {paperSize === 'a3' && layoutMode === 'booklet_4page' ? '✓ নির্বাচিত' : 'A3 বুকলেট নির্বাচন করুন'}
                  </button>
                </div>
                <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-gray-600 text-[11px] leading-relaxed">
                  <li><strong>ভাঁজের পর সঠিক সাইজ:</strong> A3 পেপারকে মাঝে ভাঁজ করলে তৈরি হয় <strong>দুটি সম্পূর্ণ পূর্ণাঙ্গ A4 (২১০ × ২৯৭ মিমি) পৃষ্ঠা</strong>!</li>
                  <li><strong>কেন সেরা:</strong> বুয়েট (BUET), ঢাকা বিশ্ববিদ্যালয় (DU), মেডিকেল ভর্তি পরীক্ষা ও শীর্ষ ক্যাডেট কলেজের ৪ পৃষ্ঠার প্রশ্নপত্র এই A3 পেপারেই মুদ্রিত হয়।</li>
                  <li><strong>স্ট্যাপলার মুক্ত:</strong> একটি মাত্র শিটের এপিঠ-ওপিঠ প্রিন্ট হয়ে মাঝের রেখা বরাবর ভাঁজ করলেই চমৎকার ৪ পৃষ্ঠার প্রশ্ন বুকলেট হয়—কোনো স্ট্যাপলার লাগবে না।</li>
                  <li><strong>১০০% স্বাভাবিক ফন্ট:</strong> কোনো ফন্ট বা জটিল গাণিতিক সমীকরণ ছোট করতে হয় না, ডায়াগ্রাম থাকে বড় ও সম্পূর্ণ স্পষ্ট।</li>
                </ul>
              </div>

              {/* Option B: A4 (Standard Desktop Printers) */}
              <div className={`p-4 rounded-xl border-2 transition ${paperSize === 'a4' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
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
                    onClick={() => { setPaperSize('a4'); setLayoutMode('booklet_4page'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${paperSize === 'a4' && layoutMode === 'booklet_4page' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border'}`}
                  >
                    {paperSize === 'a4' && layoutMode === 'booklet_4page' ? '✓ নির্বাচিত' : 'A4 বুকলেট নির্বাচন করুন'}
                  </button>
                </div>
                <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-gray-600 text-[11px] leading-relaxed">
                  <li><strong>ভাঁজের পর সাইজ:</strong> A4 পেপারকে মাঝে ভাঁজ করলে তৈরি হয় <strong>দুটি A5 সাইজের পৃষ্ঠা (১৪৮ × ২১০ মিমি)</strong>।</li>
                  <li><strong>সুবিধা:</strong> যে কোনো সাধারণ ডেস্কটপ / হোম প্রিন্টারে (Canon, Epson, HP, Brother) A4 পেপারে সরাসরি প্রিন্ট করা যায়।</li>
                  <li><strong>পরামর্শ:</strong> A4 বুকলেটের ক্ষেত্রে কন্ট্রোলস থেকে ফন্ট সাইজ <strong>৮০% থেকে ৮৫%</strong> রাখা ভালো, যেন অপশনগুলো স্বচ্ছন্দে জায়গা পায়।</li>
                </ul>
              </div>

              {/* Option C: Legal Paper */}
              <div className={`p-4 rounded-xl border-2 transition ${paperSize === 'legal' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      📜 {isEn ? 'Coaching & Offset Center Favorite' : 'কোচিং ও ফটোকপি সেন্টারের পছন্দ'}
                    </span>
                    <h4 className="text-sm font-extrabold text-gray-900 mt-1">
                      Legal Paper (৮.৫ × ১৪ ইঞ্চি)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPaperSize('legal'); setLayoutMode('booklet_4page'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${paperSize === 'legal' && layoutMode === 'booklet_4page' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border'}`}
                  >
                    {paperSize === 'legal' && layoutMode === 'booklet_4page' ? '✓ নির্বাচিত' : 'Legal বুকলেট নির্বাচন করুন'}
                  </button>
                </div>
                <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-gray-600 text-[11px] leading-relaxed">
                  <li>ভাঁজের পর তৈরি হয় ৭ × ৮.৫ ইঞ্চি পকেট বুকলেট। বাংলাদেশে ফটোকপি দোকানে অত্যন্ত সুলভ ও বহুল ব্যবহৃত।</li>
                </ul>
              </div>

            </div>
          ) : (
            <div className="space-y-3.5">
              
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-blue-900 space-y-1">
                <span className="font-extrabold text-xs">🖨️ বুকলেট কীভাবে কাজ করে?</span>
                <p className="text-[11px] leading-relaxed">
                  • <strong>৪-পৃষ্ঠা বুকলেট (১ শিট ডুপ্লেক্স):</strong> শিট ১ (পৃষ্ঠা ৪ ও ১) এবং শিট ২ (পৃষ্ঠা ২ ও ৩)। মাঝে ভাঁজ করলেই ৪ পৃষ্ঠার আসল ভর্তি বুকলেট!
                  <br />• <strong>৬-পৃষ্ঠা বুকলেট (৩ শিট নেস্টেড):</strong> শিট ১ (পৃষ্ঠা ৬ ও ১), শিট ২ (পৃষ্ঠা ২ ও ৫), এবং শিট ৩ (পৃষ্ঠা ৩ ও ৪)। ৩টি শিট ক্রমানুসারে নেস্টেড ভাঁজ করলেই চমৎকার ৬ পৃষ্ঠার অ্যাডমিশন বুকলেট!
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-2">
                <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">১</span>
                  <div>
                    <strong className="text-gray-900">লেআউট নির্বাচন:</strong>
                    <p className="text-gray-600 text-[11px]">প্রিন্ট কন্ট্রোলস থেকে <strong>'৪-পৃষ্ঠা'</strong> বা <strong>'৬-পৃষ্ঠা'</strong> বুকলেট মোড নির্বাচন করুন।</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">২</span>
                  <div>
                    <strong className="text-gray-900">পেপার সাইজ:</strong>
                    <p className="text-gray-600 text-[11px]">ভর্তি পরীক্ষার জন্য <strong>A3</strong> নির্বাচন করুন (অথবা সাধারণ প্রিন্টারের জন্য <strong>A4</strong>)।</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">৩</span>
                  <div>
                    <strong className="text-gray-900">ডুপ্লেক্স / দুই পিঠে প্রিন্ট (গুরুত্বপূর্ণ):</strong>
                    <p className="text-gray-600 text-[11px]">
                      'প্রিন্ট করুন' বাটনে চাপলে ব্রাউজারের প্রিন্ট ডায়ালগ আসবে। সেখানে <strong>Two-sided (Duplex)</strong> চেকবক্সে টিক দিন।
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">৪</span>
                  <div>
                    <strong className="text-amber-900">জরুরি বাইন্ডিং সেটিং: "Flip on short edge"</strong>
                    <p className="text-[11px] leading-relaxed">
                      যেহেতু বুকলেট ল্যান্ডস্কেপ মোডে প্রিন্ট হয়, তাই প্রিন্টার সেটিংসে অবশ্যই <strong>"Flip on short edge" (শর্ট এজ ফ্লিপ)</strong> নির্বাচন করতে হবে। (ভুল করে 'Flip on long edge' দিলে পেছনের পাতা উল্টো আসবে)।
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">৫</span>
                  <div>
                    <strong className="text-gray-900">মাঝে ভাঁজ করুন:</strong>
                    <p className="text-gray-600 text-[11px]">
                      প্রিন্ট বের হলে শিটের মাঝের ড্যাশ লাইন বরাবর ভাঁজ করুন। কোনো স্ট্যাপলারের কোনো প্রয়োজন নেই!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 flex justify-between items-center text-xs">
          <div className="text-gray-500 font-semibold text-[11px]">
            বর্তমান নির্বাচন: <span className="text-indigo-700 font-bold uppercase">{paperSize}</span> | <span className="text-indigo-700 font-bold">{layoutMode === 'booklet_4page' ? '৪-পৃষ্ঠা বুকলেট' : layoutMode === 'booklet_6page' ? '৬-পৃষ্ঠা বুকলেট' : layoutMode === 'booklet_2up' ? '২-পেজ স্প্রেড' : 'স্ট্যান্ডার্ড'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm"
          >
            {isEn ? 'Close & Apply' : 'ঠিক আছে ও বন্ধ করুন'}
          </button>
        </div>

      </div>
    </div>
  );
};

// Simple div Loader placeholder
const Loader = ({ message, isError = false }: { message: string, isError?: boolean }) => (
  <div className={`flex items-center justify-center min-h-screen text-lg ${isError ? 'text-red-500' : 'text-gray-700'}`}>{message}</div>
);