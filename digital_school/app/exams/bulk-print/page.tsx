"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import Head from 'next/head';
import {
  Printer, ArrowLeft, Search, Filter, CheckSquare, Square,
  Layers, Settings2, Sliders, ChevronDown, ChevronUp, MoveUp,
  MoveDown, Trash2, Eye, EyeOff, FileText, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, BookOpen, Calendar,
  HelpCircle, ExternalLink, Minimize2, Maximize2, X
} from 'lucide-react';

import { mathJaxConfig as globalMathJaxConfig } from '@/app/components/MathJaxConfig';
import QuestionPaper from '../../components/QuestionPaper';
import AnswerQuestionPaper from '../../components/Answer_QuestionPaper';
import {
  splitExamSetForBooklet,
  computeBookletSheets,
  toBengaliNumerals,
  OMRPage,
  BookletGuideModal
} from '../[id]/print/page';
import '../[id]/print/print.css';

// --- Types ---
interface ExamListItem {
  id: string;
  title: string;
  subject?: string;
  class?: string;
  grade?: string;
  date?: string;
  examDate?: string;
  totalMarks?: number;
  duration?: number;
  type?: string;
  isPublished?: boolean;
}

interface LoadedExamData {
  id: string;
  examInfo: any;
  sets: any[];
}

const LANGS = {
  bn: {
    print: "প্রিন্ট করুন / PDF ডাউনলোড",
    preparing: "প্রস্তুত করা হচ্ছে...",
    waiting: "ম্যাথ ও ফন্ট রেন্ডারিং চলছে...",
    bulkPrintHub: "বাল্ক এক্সাম প্রিন্ট ও PDF স্টুডিও",
    selectedExams: "টি এক্সাম নির্বাচিত",
    selectExamsToPrint: "প্রিন্ট করার জন্য এক্সাম নির্বাচন করুন",
    loadSelected: "নির্বাচিত এক্সাম লোড করুন",
    noExamsSelected: "কোনো এক্সাম সিলেক্ট করা হয়নি",
    searchPlaceholder: "এক্সামের নাম, বিষয় বা ক্লাস দিয়ে খুঁজুন...",
    freshPagePerExam: "প্রতিটি এক্সাম নতুন পেজ থেকে শুরু হবে",
    continuousFlow: "ধারাবাহিক প্রিন্ট (কাগজ বাঁচানো মোড)",
    questionPapersOnly: "শুধুমাত্র প্রশ্নপত্র",
    answersOnly: "শুধুমাত্র উত্তরপত্র ও সমাধান",
    bothQuestionsAndAnswers: "প্রশ্নপত্র ও উত্তরপত্র একসাথে",
    includeOMR: "OMR শিট সংযুক্ত করুন",
    omrAfterExam: "প্রতিটি এক্সামের শেষে OMR",
    omrAtEnd: "সব এক্সামের শেষে OMR একসাথে",
    allSets: "সকল সেট (সেট A, B, C...)",
    firstSetOnly: "শুধুমাত্র প্রথম সেট (সেট A)",
    compactPreset: "কমপ্যাক্ট (৮৫%)",
    standardPreset: "স্ট্যান্ডার্ড (১০০%)",
    largePreset: "লার্জ (১১৫%)",
  },
  en: {
    print: "Print All / Download PDF",
    preparing: "Preparing Print Bundle...",
    waiting: "Waiting for MathJax & Fonts to render...",
    bulkPrintHub: "Bulk Exam Print & PDF Studio",
    selectedExams: "Exams Selected",
    selectExamsToPrint: "Select Exams to Print",
    loadSelected: "Load Selected Exams",
    noExamsSelected: "No exams selected yet",
    searchPlaceholder: "Search by exam title, subject or class...",
    freshPagePerExam: "Fresh Page per Exam (Page Break)",
    continuousFlow: "Continuous Flow (Save Paper)",
    questionPapersOnly: "Question Papers Only",
    answersOnly: "Answer Papers / Solutions Only",
    bothQuestionsAndAnswers: "Both Questions & Answer Keys",
    includeOMR: "Include OMR Sheets",
    omrAfterExam: "OMR immediately after each exam",
    omrAtEnd: "All OMRs grouped at the end",
    allSets: "All Sets (Set A, B, C...)",
    firstSetOnly: "Primary Set Only (Set A)",
    compactPreset: "Compact (85%)",
    standardPreset: "Standard (100%)",
    largePreset: "Large (115%)",
  }
};

// --- Inner Component that consumes useSearchParams ---
function BulkPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected exam IDs (ordered)
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [allExamsList, setAllExamsList] = useState<ExamListItem[]>([]);
  const [isFetchingList, setIsFetchingList] = useState(true);

  // Cached full exam print datasets: Map<id, LoadedExamData>
  const [loadedExamsMap, setLoadedExamsMap] = useState<Record<string, LoadedExamData>>({});
  const [loadingExamsStatus, setLoadingExamsStatus] = useState<{
    isLoading: boolean;
    total: number;
    completed: number;
    failed: string[];
  }>({ isLoading: false, total: 0, completed: 0, failed: [] });

  // Filtering & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'selected' | 'unselected'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Print Configuration Options
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [outputType, setOutputType] = useState<'questions' | 'answers' | 'both'>('questions');
  const [paperSize, setPaperSize] = useState<'a4' | 'a3' | 'legal' | 'letter'>('a4');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'booklet_4page' | 'booklet_2up'>('standard');
  const [examSeparation, setExamSeparation] = useState<'page_break' | 'continuous'>('page_break');
  const [setSelection, setSetSelection] = useState<'all' | 'first_only'>('all');
  const [showOMR, setShowOMR] = useState(false);
  const [omrPosition, setOmrPosition] = useState<'after_exam' | 'bundle_end'>('after_exam');
  const [showFoldGuide, setShowFoldGuide] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [hideInstitute, setHideInstitute] = useState(false);
  const [globalSchoolName, setGlobalSchoolName] = useState('');
  const [globalSchoolAddress, setGlobalSchoolAddress] = useState('');
  const [showGlobalInstituteModal, setShowGlobalInstituteModal] = useState(false);

  // Font Scaling
  const [objectiveFontSize, setObjectiveFontSize] = useState(100);
  const [cqSqFontSize, setCqSqFontSize] = useState(100);

  // Math & Print State
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMathJaxReady, setIsMathJaxReady] = useState(false);
  const [showBookletGuideModal, setShowBookletGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'paper_comparison' | 'print_steps'>('paper_comparison');

  const printRef = useRef<HTMLDivElement>(null);

  // Load URL query params ?ids=... on initial mount
  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        setSelectedExamIds(ids);
      }
    }
  }, [searchParams]);

  // Persist / restore layout preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPaper = localStorage.getItem('bulk_print_paper_size');
      if (savedPaper) setPaperSize(savedPaper as any);
      const savedLayout = localStorage.getItem('bulk_print_layout_mode');
      if (savedLayout) setLayoutMode(savedLayout as any);
      const savedLang = localStorage.getItem('bulk_print_lang');
      if (savedLang) setLanguage(savedLang as any);
      const savedSep = localStorage.getItem('bulk_print_separation');
      if (savedSep) setExamSeparation(savedSep as any);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch full list of all available exams from /api/exams
  useEffect(() => {
    let isMounted = true;
    async function fetchAllExams() {
      setIsFetchingList(true);
      try {
        const res = await fetch('/api/exams?limit=1000');
        if (res.ok) {
          const json = await res.json();
          const items: ExamListItem[] = (json.exams || json.data || json || []).map((ex: any) => ({
            id: ex.id,
            title: ex.title || ex.name || 'Untitled Exam',
            subject: ex.subject || ex.subjectName || '',
            class: ex.class || ex.grade || '',
            grade: ex.grade || '',
            date: ex.date || ex.examDate || '',
            examDate: ex.examDate || ex.date || '',
            totalMarks: ex.totalMarks || 0,
            duration: ex.duration || 0,
            type: ex.type || '',
            isPublished: ex.isPublished ?? true
          }));
          if (isMounted) {
            setAllExamsList(items);
          }
        }
      } catch (err) {
        console.error('Failed to fetch exams list for bulk print', err);
      } finally {
        if (isMounted) setIsFetchingList(false);
      }
    }
    fetchAllExams();
    return () => { isMounted = false; };
  }, []);

  // Batch-fetch print data for selected exams whenever selectedExamIds changes
  useEffect(() => {
    if (selectedExamIds.length === 0) return;

    const unLoadedIds = selectedExamIds.filter(id => !loadedExamsMap[id]);
    if (unLoadedIds.length === 0) return;

    let isCancelled = false;

    async function fetchMissingExams() {
      setLoadingExamsStatus({
        isLoading: true,
        total: unLoadedIds.length,
        completed: 0,
        failed: []
      });

      const failed: string[] = [];
      const newLoaded: Record<string, LoadedExamData> = {};

      for (let i = 0; i < unLoadedIds.length; i++) {
        if (isCancelled) break;
        const examId = unLoadedIds[i];
        try {
          const res = await fetch(`/api/print/exam/${examId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          newLoaded[examId] = {
            id: examId,
            examInfo: data.examInfo || {},
            sets: data.sets || []
          };
        } catch (e: any) {
          console.error(`Failed to fetch exam ${examId}:`, e);
          failed.push(examId);
        }

        if (!isCancelled) {
          setLoadingExamsStatus(prev => ({
            ...prev,
            completed: i + 1,
            failed: [...failed]
          }));
        }
      }

      if (!isCancelled) {
        setLoadedExamsMap(prev => ({ ...prev, ...newLoaded }));
        setLoadingExamsStatus(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchMissingExams();

    return () => { isCancelled = true; };
  }, [selectedExamIds, loadedExamsMap]);

  // MathJax ready detection
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

  // Filtered exams list in the selector drawer
  const filteredExamsList = useMemo(() => {
    return allExamsList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.class?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isSelected = selectedExamIds.includes(item.id);
      if (filterType === 'selected') return isSelected;
      if (filterType === 'unselected') return !isSelected;
      return true;
    });
  }, [allExamsList, searchQuery, filterType, selectedExamIds]);

  // Toggle selection of a single exam
  const toggleExamSelection = (id: string) => {
    setSelectedExamIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select all filtered exams
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredExamsList.map(e => e.id);
    setSelectedExamIds(prev => {
      const set = new Set([...prev, ...filteredIds]);
      return Array.from(set);
    });
  };

  // Deselect all exams
  const handleDeselectAll = () => {
    setSelectedExamIds([]);
  };

  // Invert selection among filtered
  const handleInvertFiltered = () => {
    const filteredIds = filteredExamsList.map(e => e.id);
    setSelectedExamIds(prev => {
      const newSelected = [...prev];
      filteredIds.forEach(id => {
        const idx = newSelected.indexOf(id);
        if (idx > -1) newSelected.splice(idx, 1);
        else newSelected.push(id);
      });
      return newSelected;
    });
  };

  // Move exam up in print order
  const moveExamOrder = (index: number, direction: 'up' | 'down') => {
    setSelectedExamIds(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return copy;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Remove exam from selection
  const removeSelectedExam = (id: string) => {
    setSelectedExamIds(prev => prev.filter(x => x !== id));
  };

  // Print execution with react-to-print
  // @ts-ignore
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `bulk-print-${selectedExamIds.length}-exams`,
    onBeforeGetContent: async () => {
      setIsPrinting(true);
      if (isMathJaxReady) return;
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
    },
  } as any);

  // MathJax configuration
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

  const t = LANGS[language];
  const paperClass = paperSize === 'legal' ? 'legal-paper' : paperSize === 'a3' ? 'a3-paper' : paperSize === 'letter' ? 'letter-paper' : 'a4-paper';
  const isBooklet = layoutMode === 'booklet_4page' || layoutMode === 'booklet_2up';

  // Resolved list of loaded exams in the user-specified sequence
  const orderedLoadedExams = useMemo(() => {
    return selectedExamIds
      .map(id => loadedExamsMap[id])
      .filter((ex): ex is LoadedExamData => Boolean(ex));
  }, [selectedExamIds, loadedExamsMap]);

  // Total question count calculation across all loaded exams
  const totalStats = useMemo(() => {
    let totalQuestions = 0;
    let totalMarks = 0;
    orderedLoadedExams.forEach(ex => {
      const sets = ex.sets || [];
      const firstSet = sets[0];
      if (firstSet) {
        const mcqCount = firstSet.mcq?.length || firstSet.orderedObjective?.length || 0;
        const cqCount = firstSet.cq?.length || 0;
        const sqCount = firstSet.sq?.length || 0;
        totalQuestions += (mcqCount + cqCount + sqCount);
      }
      totalMarks += (ex.examInfo?.totalMarks || 0);
    });
    return { totalQuestions, totalMarks };
  }, [orderedLoadedExams]);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans print:bg-white print:text-black">
        <Head>
          <title>{language === 'bn' ? 'বাল্ক এক্সাম প্রিন্ট ও PDF স্টুডিও' : 'Bulk Exam Print & PDF Studio'}</title>
        </Head>

        {/* Dynamic @page media rules for print */}
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
              background: white !important;
            }
          }
        ` }} />

        {/* =========================================================================
            TOP NAV BAR (Header)
           ========================================================================= */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/exams')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Back to Exams"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-blue-400" />
                  {t.bulkPrintHub}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedExamIds.length} {t.selectedExams}
                </span>
                {totalStats.totalQuestions > 0 && (
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {totalStats.totalQuestions} Questions
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Professional typeset examination bundle with universal booklet imposition & zero overflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isDrawerOpen
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isDrawerOpen ? 'Hide Selector' : 'Select Exams'}</span>
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {selectedExamIds.length}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => {
                const next = language === 'bn' ? 'en' : 'bn';
                setLanguage(next);
                try { localStorage.setItem('bulk_print_lang', next); } catch (e) {}
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
            >
              {language === 'bn' ? 'English' : 'বাংলা'}
            </button>

            {/* Print Action Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting || orderedLoadedExams.length === 0 || loadingExamsStatus.isLoading}
              className="px-4 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? t.preparing : t.print}</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            MAIN WORKSPACE: Sidebar Drawer + Main Canvas
           ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* -----------------------------------------------------------------------
              LEFT: EXAM SELECTOR & MANAGEMENT DRAWER (Collapsible)
             ----------------------------------------------------------------------- */}
          {isDrawerOpen && (
            <aside className="w-80 sm:w-96 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-[calc(100vh-53px)] z-30 print:hidden animate-fade-in">
              {/* Header with Search & Filter */}
              <div className="p-3.5 border-b border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    Exam Selection Drawer
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSelectAllFiltered}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  {(['all', 'selected', 'unselected'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFilterType(mode)}
                      className={`flex-1 py-1 rounded-lg font-medium transition text-center capitalize ${
                        filterType === mode
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {mode === 'all' ? `All (${allExamsList.length})` : mode === 'selected' ? `Selected (${selectedExamIds.length})` : 'Unselected'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Sequence Re-order Section (if selected exams exist) */}
              {selectedExamIds.length > 0 && (
                <div className="bg-slate-900/90 border-b border-slate-800 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1 text-blue-400">
                      <MoveUp className="w-3 h-3" /> Print Sequence ({selectedExamIds.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Order controls page sequence</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                    {selectedExamIds.map((id, idx) => {
                      const examItem = allExamsList.find(e => e.id === id);
                      return (
                        <div
                          key={`ordered-${id}`}
                          className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-mono text-[9px] flex items-center justify-center flex-shrink-0 font-bold">
                              {idx + 1}
                            </span>
                            <span className="truncate text-slate-200 font-medium">
                              {examItem?.title || id}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => moveExamOrder(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Up"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveExamOrder(idx, 'down')}
                              disabled={idx === selectedExamIds.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Down"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeSelectedExam(id)}
                              className="p-1 text-rose-400 hover:text-rose-300"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scrollable Exams List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {isFetchingList ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-xs">Loading available exams...</span>
                  </div>
                ) : filteredExamsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No exams found matching your query.
                  </div>
                ) : (
                  filteredExamsList.map(item => {
                    const isSelected = selectedExamIds.includes(item.id);
                    const isLoaded = Boolean(loadedExamsMap[item.id]);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleExamSelection(item.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExamSelection(item.id);
                            }}
                            className="mt-0.5 text-blue-400 flex-shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 fill-blue-500 text-slate-950" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                              {item.subject && (
                                <span className="text-blue-400 font-semibold">{item.subject}</span>
                              )}
                              {item.class && (
                                <span className="bg-slate-800 px-1 rounded text-slate-300">{item.class}</span>
                              )}
                              {item.totalMarks > 0 && (
                                <span>{item.totalMarks} Marks</span>
                              )}
                              {item.duration > 0 && (
                                <span>{item.duration} Mins</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">
                              #{selectedExamIds.indexOf(item.id) + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* -----------------------------------------------------------------------
              RIGHT: PRINT STUDIO CONTROLS & LIVE PAPER CANVAS
             ----------------------------------------------------------------------- */}
          <main className="flex-1 flex flex-col h-[calc(100vh-53px)] overflow-hidden bg-slate-900">
            
            {/* Top Toolbar: Settings & Controls */}
            <div className="bg-slate-950/80 border-b border-slate-800 p-3 flex items-center justify-between flex-wrap gap-2 text-xs print:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Paper Size */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Paper:</span>
                  <select
                    value={paperSize}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setPaperSize(v);
                      try { localStorage.setItem('bulk_print_paper_size', v); } catch (err) {}
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="a4">A4 (Standard)</option>
                    <option value="a3">A3 (🌟 Admission Booklet)</option>
                    <option value="legal">Legal (Long 8.5×14")</option>
                    <option value="letter">Letter (8.5×11")</option>
                  </select>
                </div>

                {/* Layout Mode */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Layout:</span>
                  <select
                    value={layoutMode}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setLayoutMode(v);
                      try { localStorage.setItem('bulk_print_layout_mode', v); } catch (err) {}
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="standard">Standard Multi-Page (Portrait)</option>
                    <option value="booklet_4page">Booklet Imposition (Duplex Fold)</option>
                    <option value="booklet_2up">2-Up Sequential Spread (Landscape)</option>
                  </select>
                </div>

                {/* Separation Mode */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Separation:</span>
                  <select
                    value={examSeparation}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setExamSeparation(v);
                      try { localStorage.setItem('bulk_print_separation', v); } catch (err) {}
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="page_break">Fresh Page per Exam (Recommended)</option>
                    <option value="continuous">Continuous Flow (Save Paper)</option>
                  </select>
                </div>

                {/* Output Mode (Questions vs Answers vs Both) */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setOutputType('questions')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition ${
                      outputType === 'questions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Questions
                  </button>
                  <button
                    onClick={() => setOutputType('answers')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition ${
                      outputType === 'answers' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Answers
                  </button>
                  <button
                    onClick={() => setOutputType('both')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition ${
                      outputType === 'both' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* Right Side Options: OMR, Font Presets, Booklet Guide */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* OMR Toggle */}
                <button
                  onClick={() => setShowOMR(prev => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                    showOMR
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OMR Sheets {showOMR ? 'ON' : 'OFF'}</span>
                </button>

                {/* Booklet Guide Modal Trigger */}
                <button
                  onClick={() => setShowBookletGuideModal(true)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Booklet Guide</span>
                </button>

                {/* Institute Customization Modal Trigger */}
                <button
                  onClick={() => setShowGlobalInstituteModal(true)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Institute</span>
                </button>
              </div>
            </div>

            {/* Secondary Toolbar: Font Scaling & Toggles */}
            <div className="bg-slate-950/50 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 print:hidden">
              <div className="flex items-center gap-4 flex-wrap">
                {/* MCQ Font Size */}
                <div className="flex items-center gap-1.5">
                  <span>MCQ Font:</span>
                  <input
                    type="range"
                    min={60}
                    max={150}
                    value={objectiveFontSize}
                    onChange={(e) => setObjectiveFontSize(Number(e.target.value))}
                    className="w-16 accent-blue-500"
                  />
                  <span className="font-mono text-slate-200">{objectiveFontSize}%</span>
                </div>

                {/* CQ Font Size */}
                <div className="flex items-center gap-1.5">
                  <span>CQ Font:</span>
                  <input
                    type="range"
                    min={60}
                    max={150}
                    value={cqSqFontSize}
                    onChange={(e) => setCqSqFontSize(Number(e.target.value))}
                    className="w-16 accent-blue-500"
                  />
                  <span className="font-mono text-slate-200">{cqSqFontSize}%</span>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setObjectiveFontSize(85); setCqSqFontSize(85); }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    Compact (85%)
                  </button>
                  <button
                    onClick={() => { setObjectiveFontSize(100); setCqSqFontSize(100); }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    Reset (100%)
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Show Date</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showFoldGuide}
                    onChange={(e) => setShowFoldGuide(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Fold Guides</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={hideInstitute}
                    onChange={(e) => setHideInstitute(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Hide Institute</span>
                </label>
              </div>
            </div>

            {/* Batch Loading Banner (if fetching data) */}
            {loadingExamsStatus.isLoading && (
              <div className="bg-blue-950/80 border-b border-blue-800 px-4 py-2 flex items-center justify-between text-xs text-blue-200 print:hidden animate-pulse">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>
                    Loading exam print assets ({loadingExamsStatus.completed} / {loadingExamsStatus.total})...
                  </span>
                </div>
                <div className="w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${(loadingExamsStatus.completed / (loadingExamsStatus.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Canvas Area: Displays the Full Print Bundle */}
            <div className="flex-1 overflow-y-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center">
              {selectedExamIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto p-8 rounded-2xl bg-slate-950/60 border border-slate-800 max-w-md text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {t.noExamsSelected}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Open the Exam Selection Drawer on the left, search and pick multiple exams to generate a unified, publication-grade print bundle.
                  </p>
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
                  >
                    Open Exam Selection Drawer
                  </button>
                </div>
              ) : orderedLoadedExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm font-semibold">Loading selected exam papers...</p>
                </div>
              ) : (
                /* =============================================================
                   ACTUAL PRINT CONTAINER (Referenced by useReactToPrint)
                   ============================================================= */
                <div
                  ref={printRef}
                  className="bulk-print-container print:w-full space-y-8 print:space-y-0"
                  style={{ fontFamily: "'ExamFont', 'Noto Serif Bengali', Georgia, serif" }}
                >
                  {orderedLoadedExams.map((examData, examIndex) => {
                    const isLastExam = examIndex === orderedLoadedExams.length - 1;
                    const { sets } = examData;
                    
                    // Effective exam info (with optional global institute override)
                    const examInfo = {
                      ...examData.examInfo,
                      schoolName: globalSchoolName !== '' ? globalSchoolName : examData.examInfo?.schoolName,
                      schoolAddress: globalSchoolAddress !== '' ? globalSchoolAddress : examData.examInfo?.schoolAddress,
                    };

                    const nonEmptySets = (sets || []).filter(
                      (set: any) => (
                        set.mcq?.length || set.mc?.length || set.int?.length ||
                        set.ar?.length || set.cq?.length || set.sq?.length ||
                        set.mtf?.length || set.descriptive?.length || set.orderedObjective?.length
                      )
                    );

                    const targetSets = setSelection === 'first_only' ? nonEmptySets.slice(0, 1) : nonEmptySets;

                    return (
                      <section
                        key={`bulk-exam-${examData.id}`}
                        className={`bulk-exam-block ${
                          examSeparation === 'page_break' && !isLastExam ? 'print:break-after-page' : ''
                        }`}
                        style={{
                          pageBreakAfter: (examSeparation === 'page_break' && !isLastExam) ? 'always' : 'auto',
                          breakAfter: (examSeparation === 'page_break' && !isLastExam) ? 'page' : 'auto'
                        }}
                      >
                        {/* =======================================================
                            LAYOUT MODE 1: STANDARD MULTI-PAGE
                           ======================================================= */}
                        {layoutMode === 'standard' && (
                          <>
                            {targetSets.map((set: any) => (
                              <React.Fragment key={`std-${examData.id}-${set.setId}`}>
                                {(outputType === 'questions' || outputType === 'both') && (
                                  <div className={`print-page-container ${paperClass}`}>
                                    <QuestionPaper
                                      examInfo={{ ...examInfo, set: set.setName }}
                                      questions={set}
                                      qrData={set.qrData}
                                      fontSize={objectiveFontSize}
                                      cqSqFontSize={cqSqFontSize}
                                      forcePageBreak={false}
                                      language={language}
                                      hideOMR={!showOMR}
                                      showDate={showDate}
                                      hideInstitute={hideInstitute}
                                      hideHeader={false}
                                      hideSignature={!showSignatures}
                                      startQuestionIndex={1}
                                      startCqIndex={1}
                                      startSqIndex={1}
                                    />
                                  </div>
                                )}

                                {(outputType === 'answers' || outputType === 'both') && (
                                  <div className={`print-page-container ${paperClass}`} style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                                    <AnswerQuestionPaper
                                      examInfo={{ ...examInfo, set: set.setName }}
                                      questions={set}
                                      qrData={set.qrData}
                                      fontSize={objectiveFontSize}
                                      cqSqFontSize={cqSqFontSize}
                                      forcePageBreak={false}
                                      language={language}
                                      hideOMR={!showOMR}
                                      showDate={showDate}
                                      hideInstitute={hideInstitute}
                                      hideHeader={false}
                                      hideSignature={!showSignatures}
                                      startQuestionIndex={1}
                                      startCqIndex={1}
                                      startSqIndex={1}
                                    />
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        )}

                        {/* =======================================================
                            LAYOUT MODE 2: BOOKLET IMPOSITION (Duplex Folding)
                           ======================================================= */}
                        {layoutMode === 'booklet_4page' && (
                          <>
                            {targetSets.map((set: any) => {
                              const pages = splitExamSetForBooklet(set, examInfo);
                              const totalPages = pages.length;
                              const { sheets } = computeBookletSheets(totalPages);

                              const renderHalfPage = (pageNum: number, side: 'left' | 'right') => {
                                const pageData = pages[pageNum - 1];
                                if (!pageData) {
                                  return (
                                    <div className={`booklet-half-page booklet-${side} booklet-blank-page`}>
                                      <div className="booklet-blank-notice">
                                        {language === 'en' ? '— INTENTIONALLY LEFT BLANK FOR NOTES / ROUGH WORK —' : '— রাফ ও নোটের জন্য খালি রাখা হয়েছে —'}
                                      </div>
                                    </div>
                                  );
                                }

                                const isPage1 = pageNum === 1;
                                const isFinalPage = pageNum === totalPages;
                                const isAns = outputType === 'answers';

                                return (
                                  <div className={`booklet-half-page booklet-${side}`}>
                                    <div className="booklet-page-header-tag">
                                      <span>
                                        {isPage1
                                          ? examInfo.title
                                          : pageData.subjectName
                                            ? (language === 'en' ? `SUBJECT: ${pageData.subjectName}` : `বিষয়: ${pageData.subjectName}`)
                                            : examInfo.title}
                                      </span>
                                      <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">
                                        {language === 'en' ? `Page ${pageNum}` : `পৃষ্ঠা ${toBengaliNumerals(pageNum)}`}
                                      </span>
                                    </div>

                                    {!isAns ? (
                                      <QuestionPaper
                                        examInfo={{ ...examInfo, set: set.setName }}
                                        questions={pageData.questions}
                                        qrData={set.qrData}
                                        fontSize={objectiveFontSize}
                                        cqSqFontSize={cqSqFontSize}
                                        forcePageBreak={false}
                                        language={language}
                                        hideOMR={!showOMR}
                                        showDate={showDate}
                                        hideInstitute={hideInstitute}
                                        hideHeader={!isPage1}
                                        hideSignature={!isFinalPage}
                                        startQuestionIndex={pageData.startIndex}
                                        startCqIndex={pageData.cqStartIndex}
                                        startSqIndex={pageData.sqStartIndex}
                                        pageNumberLabel=""
                                      />
                                    ) : (
                                      <AnswerQuestionPaper
                                        examInfo={{ ...examInfo, set: set.setName }}
                                        questions={pageData.questions}
                                        qrData={set.qrData}
                                        fontSize={objectiveFontSize}
                                        cqSqFontSize={cqSqFontSize}
                                        forcePageBreak={false}
                                        language={language}
                                        hideOMR={!showOMR}
                                        showDate={showDate}
                                        hideInstitute={hideInstitute}
                                        hideHeader={!isPage1}
                                        hideSignature={!isFinalPage}
                                        startQuestionIndex={pageData.startIndex}
                                        startCqIndex={pageData.cqStartIndex}
                                        startSqIndex={pageData.sqStartIndex}
                                        pageNumberLabel=""
                                      />
                                    )}

                                    {isFinalPage && (
                                      <div className="booklet-end-banner">
                                        {language === 'en'
                                          ? '— END OF QUESTION PAPER —'
                                          : '— সমাপ্ত (সকল প্রশ্নের উত্তর দেওয়া শেষ করুন) —'}
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return (
                                <React.Fragment key={`booklet-${examData.id}-${set.setId}`}>
                                  {sheets.map(sheet => (
                                    <React.Fragment key={`sheet-${examData.id}-${sheet.sheetNumber}`}>
                                      {/* FRONT SPREAD */}
                                      <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                                        {renderHalfPage(sheet.front.leftPageNum, 'left')}
                                        {showFoldGuide && (
                                          <div className="booklet-center-crease">
                                            <span className="booklet-fold-badge">
                                              ✂ {language === 'en'
                                                ? `SHEET ${sheet.sheetNumber} (FRONT: ${sheet.front.leftPageNum} | ${sheet.front.rightPageNum})`
                                                : `শিট ${toBengaliNumerals(sheet.sheetNumber)} (পৃষ্ঠা ${toBengaliNumerals(sheet.front.leftPageNum)} ও ${toBengaliNumerals(sheet.front.rightPageNum)})`}
                                            </span>
                                          </div>
                                        )}
                                        {renderHalfPage(sheet.front.rightPageNum, 'right')}
                                      </div>

                                      {/* BACK SPREAD */}
                                      <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                                        {renderHalfPage(sheet.back.leftPageNum, 'left')}
                                        {showFoldGuide && (
                                          <div className="booklet-center-crease">
                                            <span className="booklet-fold-badge">
                                              ✂ {language === 'en'
                                                ? `SHEET ${sheet.sheetNumber} (BACK: ${sheet.back.leftPageNum} | ${sheet.back.rightPageNum})`
                                                : `শিট ${toBengaliNumerals(sheet.sheetNumber)} (পৃষ্ঠা ${toBengaliNumerals(sheet.back.leftPageNum)} ও ${toBengaliNumerals(sheet.back.rightPageNum)})`}
                                            </span>
                                          </div>
                                        )}
                                        {renderHalfPage(sheet.back.rightPageNum, 'right')}
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}

                        {/* =======================================================
                            LAYOUT MODE 3: 2-UP SEQUENTIAL SPREAD
                           ======================================================= */}
                        {layoutMode === 'booklet_2up' && (
                          <>
                            {targetSets.map((set: any) => {
                              const [p1, p2, p3, p4] = splitExamSetForBooklet(set, examInfo);
                              return (
                                <React.Fragment key={`seq2up-${examData.id}-${set.setId}`}>
                                  {/* Spread 1: Page 1 | Page 2 */}
                                  <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                                    <div className="booklet-half-page booklet-left">
                                      <div className="booklet-page-header-tag">
                                        <span>{examInfo.title}</span>
                                        <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">
                                          {language === 'en' ? 'Page 1' : 'পৃষ্ঠা ১'}
                                        </span>
                                      </div>
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
                                    </div>

                                    {showFoldGuide && (
                                      <div className="booklet-center-crease">
                                        <span className="booklet-fold-badge">✂ FOLD HERE</span>
                                      </div>
                                    )}

                                    <div className="booklet-half-page booklet-right">
                                      <div className="booklet-page-header-tag">
                                        <span>{p2.subjectName ? `SUBJECT: ${p2.subjectName}` : examInfo.title}</span>
                                        <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">
                                          {language === 'en' ? 'Page 2' : 'পৃষ্ঠা ২'}
                                        </span>
                                      </div>
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
                                    </div>
                                  </div>

                                  {/* Spread 2: Page 3 | Page 4 */}
                                  <div className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                                    <div className="booklet-half-page booklet-left">
                                      <div className="booklet-page-header-tag">
                                        <span>{p3.subjectName ? `SUBJECT: ${p3.subjectName}` : examInfo.title}</span>
                                        <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">
                                          {language === 'en' ? 'Page 3' : 'পৃষ্ঠা ৩'}
                                        </span>
                                      </div>
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
                                    </div>

                                    {showFoldGuide && (
                                      <div className="booklet-center-crease">
                                        <span className="booklet-fold-badge">✂ FOLD HERE</span>
                                      </div>
                                    )}

                                    <div className="booklet-half-page booklet-right">
                                      <div className="booklet-page-header-tag">
                                        <span>{p4.subjectName ? `SUBJECT: ${p4.subjectName}` : examInfo.title}</span>
                                        <span className="border border-black px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-gray-50">
                                          {language === 'en' ? 'Page 4' : 'পৃষ্ঠা ৪'}
                                        </span>
                                      </div>
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
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}

                        {/* OMR Sheets immediately after each exam (if configured) */}
                        {showOMR && omrPosition === 'after_exam' && targetSets.map((set: any) => (
                          <OMRPage
                            key={`omr-${examData.id}-${set.setId}`}
                            set={set}
                            examInfo={examInfo}
                            language={language}
                            hideInstitute={hideInstitute}
                            paperClass={paperClass}
                          />
                        ))}
                      </section>
                    );
                  })}

                  {/* Bundled OMR Sheets at the end of all exams (if configured) */}
                  {showOMR && omrPosition === 'bundle_end' && orderedLoadedExams.map((examData) => {
                    const examInfo = {
                      ...examData.examInfo,
                      schoolName: globalSchoolName !== '' ? globalSchoolName : examData.examInfo?.schoolName,
                      schoolAddress: globalSchoolAddress !== '' ? globalSchoolAddress : examData.examInfo?.schoolAddress,
                    };
                    const nonEmptySets = (examData.sets || []).filter(
                      (set: any) => (
                        set.mcq?.length || set.mc?.length || set.int?.length ||
                        set.ar?.length || set.cq?.length || set.sq?.length ||
                        set.mtf?.length || set.descriptive?.length || set.orderedObjective?.length
                      )
                    );
                    const targetSets = setSelection === 'first_only' ? nonEmptySets.slice(0, 1) : nonEmptySets;

                    return (
                      <React.Fragment key={`bundle-omr-${examData.id}`}>
                        {targetSets.map((set: any) => (
                          <OMRPage
                            key={`bundle-omr-page-${examData.id}-${set.setId}`}
                            set={set}
                            examInfo={examInfo}
                            language={language}
                            hideInstitute={hideInstitute}
                            paperClass={paperClass}
                          />
                        ))}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* =========================================================================
            MODAL: GLOBAL INSTITUTE OVERRIDE
           ========================================================================= */}
        {showGlobalInstituteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-blue-400" />
                  Institute Header Customization
                </h3>
                <button
                  onClick={() => setShowGlobalInstituteModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Override Institution Name (Optional):
                  </label>
                  <input
                    type="text"
                    value={globalSchoolName}
                    onChange={(e) => setGlobalSchoolName(e.target.value)}
                    placeholder="Leave empty to use each exam's default name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Override Institution Address (Optional):
                  </label>
                  <input
                    type="text"
                    value={globalSchoolAddress}
                    onChange={(e) => setGlobalSchoolAddress(e.target.value)}
                    placeholder="Leave empty to use each exam's default address"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setGlobalSchoolName('');
                      setGlobalSchoolAddress('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={() => setShowGlobalInstituteModal(false)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: COMPREHENSIVE BOOKLET GUIDE
           ========================================================================= */}
        {showBookletGuideModal && (
          <BookletGuideModal
            language={language}
            paperSize={paperSize}
            setPaperSize={(size: any) => {
              setPaperSize(size);
              try { localStorage.setItem('bulk_print_paper_size', size); } catch (e) {}
            }}
            layoutMode={layoutMode}
            setLayoutMode={(mode: any) => {
              setLayoutMode(mode);
              try { localStorage.setItem('bulk_print_layout_mode', mode); } catch (e) {}
            }}
            activeTab={activeGuideTab}
            setActiveTab={setActiveGuideTab}
            onClose={() => setShowBookletGuideModal(false)}
          />
        )}
      </div>
    </MathJaxContext>
  );
}

// --- Default Export wrapped in Suspense for Next.js App Router useSearchParams ---
export default function BulkPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold animate-pulse">Initializing Bulk Print Studio...</p>
        </div>
      }
    >
      <BulkPrintContent />
    </Suspense>
  );
}
