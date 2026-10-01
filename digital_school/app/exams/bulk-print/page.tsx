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
  HelpCircle, ExternalLink, Minimize2, Maximize2, X,
  Calculator, Users, Check, Building2, Stamp, Copy,
  ZoomIn, ZoomOut, RotateCcw, SlidersHorizontal, ArrowUpDown,
  CheckCheck, HardDriveDownload, Cpu
} from 'lucide-react';

import { mathJaxConfig as globalMathJaxConfig } from '@/app/components/MathJaxConfig';
import QuestionPaper from '../../components/QuestionPaper';
import AnswerQuestionPaper from '../../components/Answer_QuestionPaper';
import { estimateSqVisualUnits } from '@/utils/engineeringAnswerBox';
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
    print: "সরাসরি প্রিন্ট করুন (প্রিন্টার ড্রাইভার)",
    pdfDownload: "PDF ডাউনলোড করুন",
    preparing: "প্রস্তুত করা হচ্ছে...",
    waiting: "ম্যাথ ও ফন্ট রেন্ডারিং চলছে...",
    bulkPrintHub: "বাল্ক এক্সাম প্রিন্ট ও PDF স্টুডিও",
    selectedExams: "টি এক্সাম নির্বাচিত",
    selectExamsToPrint: "প্রিন্ট করার জন্য এক্সাম নির্বাচন করুন",
    noExamsSelected: "কোনো এক্সাম সিলেক্ট করা হয়নি",
    searchPlaceholder: "নাম, বিষয়, শ্রেণি বা কোড দিয়ে খুঁজুন...",
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
    pages: "পৃষ্ঠা",
    sheets: "শিট",
    duplexNote: "ডুপ্লেক্স / উভয় পৃষ্ঠায় প্রিন্ট",
  },
  en: {
    print: "Direct Print (System Driver - No Download)",
    pdfDownload: "Download PDF File",
    preparing: "Preparing Print Spooler...",
    waiting: "Waiting for MathJax & Fonts to render...",
    bulkPrintHub: "Bulk Exam Print & PDF Studio",
    selectedExams: "Exams Selected",
    selectExamsToPrint: "Select Exams to Print",
    noExamsSelected: "No exams selected yet",
    searchPlaceholder: "Search by title, subject, grade or ID...",
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
    pages: "Pages",
    sheets: "Sheets",
    duplexNote: "Duplex / Both Sides Print",
  }
};

// Calculate optimal page count dynamically based on question volume, layout mode, font scaling, and paper size (Legal vs A4)
function getOptimalPageCount(
  set: any,
  examInfo: any,
  layoutMode: string,
  fontSize: number = 100,
  cqSqFontSize: number = 100,
  engineeringExamBoxes: boolean = false,
  engineeringBoxScale: number = 1.0,
  paperSize: string = 'a4'
): number {
  const objCount = (set.mcq?.length || 0) + (set.orderedObjective?.length || 0) + (set.mc?.length || 0) + (set.int?.length || 0) + (set.ar?.length || 0);
  const cqCount = set.cq?.length || 0;
  const sqCount = set.sq?.length || 0;
  const descCount = (set.descriptive?.length || 0) + (set.mtf?.length || 0);

  const fontScale = Math.max(0.5, (fontSize || 100) / 100);
  const cqScale = Math.max(0.5, (cqSqFontSize || 100) / 100);

  const sqUnits = (engineeringExamBoxes && Array.isArray(set.sq) && set.sq.length > 0)
    ? set.sq.reduce((sum: number, q: any) => sum + estimateSqVisualUnits(q, engineeringBoxScale, paperSize as any), 0)
    : (sqCount * 3.5);

  // 1 CQ is roughly ~8-9 MCQs in visual height; 1 SQ is ~3.5 MCQs; 1 Desc is ~8 MCQs
  const estimatedUnits = (objCount * fontScale) + ((cqCount * 8.5 + sqUnits + descCount * 8) * cqScale);

  // STRICT RULE FOR ENGINEERING EXAM BOXES: At least 2, at most 3 questions per page
  const totalWritten = sqCount + cqCount + descCount;
  if (engineeringExamBoxes && totalWritten > 0 && objCount === 0) {
    const requiredPages = Math.max(1, Math.ceil(totalWritten / 3));
    if (layoutMode === 'booklet_4page') {
      return Math.max(4, Math.ceil(requiredPages / 4) * 4);
    }
    if (layoutMode === 'booklet_2up') {
      return Math.max(2, Math.ceil(requiredPages / 2) * 2);
    }
    return requiredPages;
  }

  if (layoutMode === 'booklet_4page') {
    if (paperSize === 'legal') {
      if (estimatedUnits > 165) return 8;
      return 4;
    }
    if (estimatedUnits > 135) return 8;
    return 4;
  }

  if (layoutMode === 'booklet_2up') {
    if (paperSize === 'legal') {
      if (estimatedUnits <= 46) return 2;
      if (estimatedUnits <= 100) return 4;
      return Math.max(2, Math.ceil(estimatedUnits / 32));
    }
    if (estimatedUnits <= 36) return 2;
    if (estimatedUnits <= 80) return 4;
    return Math.max(2, Math.ceil(estimatedUnits / 26));
  }

  // Legal paper has 14in (355.6mm) height vs A4 (297mm) -> ~25% more usable space
  if (paperSize === 'legal') {
    if (estimatedUnits <= 26) return 1;
    if (estimatedUnits <= 64) return 2;
    if (estimatedUnits <= 102) return 3;
    if (estimatedUnits <= 140) return 4;
    return Math.max(1, Math.ceil((estimatedUnits - 26) / 38) + 1);
  }

  // Standard portrait mode (A4, Letter)
  if (estimatedUnits <= 18) return 1;
  if (estimatedUnits <= 46) return 2;
  if (estimatedUnits <= 74) return 3;
  if (estimatedUnits <= 104) return 4;
  return Math.max(1, Math.ceil((estimatedUnits - 18) / 28) + 1);
}

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
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'marks_desc'>('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Print Configuration Options
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [outputType, setOutputType] = useState<'questions' | 'answers' | 'both'>('questions');
  const [paperSize, setPaperSize] = useState<'a4' | 'a3' | 'legal' | 'letter'>('a4');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'booklet_4page' | 'booklet_2up'>('standard');
  const [standardPagingMode, setStandardPagingMode] = useState<'paginated_bounds' | 'continuous_flow'>('paginated_bounds');
  const [examSeparation, setExamSeparation] = useState<'page_break' | 'continuous'>('page_break');
  const [setSelection, setSetSelection] = useState<'all' | 'first_only'>('all');
  const [showOMR, setShowOMR] = useState(false);
  const [omrPosition, setOmrPosition] = useState<'after_exam' | 'bundle_end'>('after_exam');
  const [showFoldGuide, setShowFoldGuide] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [spacingDensity, setSpacingDensity] = useState<'compact' | 'standard' | 'spacious'>('standard');
  const [engineeringExamBoxes, setEngineeringExamBoxes] = useState(false);
  const [engineeringBoxScale, setEngineeringBoxScale] = useState(1.0);
  const [engineeringBoxStyle, setEngineeringBoxStyle] = useState<'ruled' | 'blank' | 'grid'>('ruled');

  // Institute Customization State (Persistent)
  const [hideInstitute, setHideInstitute] = useState(false);
  const [globalSchoolName, setGlobalSchoolName] = useState('');
  const [globalSchoolAddress, setGlobalSchoolAddress] = useState('');
  const [showWatermark, setShowWatermark] = useState(true);
  const [customWatermarkText, setCustomWatermarkText] = useState('');
  const [showGlobalInstituteModal, setShowGlobalInstituteModal] = useState(false);

  // Modal Temp State
  const [tempSchoolName, setTempSchoolName] = useState('');
  const [tempSchoolAddress, setTempSchoolAddress] = useState('');
  const [tempWatermarkText, setTempWatermarkText] = useState('');
  const [instituteSaveSuccess, setInstituteSaveSuccess] = useState(false);

  // Student Print Calculator State
  const [studentBatchCount, setStudentBatchCount] = useState<number>(50);
  const [showCalculator, setShowCalculator] = useState(false);

  // Printer Driver Guide Modal
  const [showDriverGuideModal, setShowDriverGuideModal] = useState(false);

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

  // Persist / restore layout preferences & institute settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedPaper = localStorage.getItem('bulk_print_paper_size');
      if (savedPaper) setPaperSize(savedPaper as any);

      const savedLayout = localStorage.getItem('bulk_print_layout_mode');
      if (savedLayout) setLayoutMode(savedLayout as any);

      const savedPaging = localStorage.getItem('bulk_print_standard_paging');
      if (savedPaging) setStandardPagingMode(savedPaging as any);

      const savedLang = localStorage.getItem('bulk_print_lang');
      if (savedLang) setLanguage(savedLang as any);

      const savedSep = localStorage.getItem('bulk_print_separation');
      if (savedSep) setExamSeparation(savedSep as any);

      const savedDensity = localStorage.getItem('bulk_print_density');
      if (savedDensity) setSpacingDensity(savedDensity as any);

      const savedName = localStorage.getItem('bulk_custom_school_name');
      if (savedName) setGlobalSchoolName(savedName);

      const savedAddress = localStorage.getItem('bulk_custom_school_address');
      if (savedAddress) setGlobalSchoolAddress(savedAddress);

      const savedWatermark = localStorage.getItem('bulk_custom_watermark');
      if (savedWatermark) setCustomWatermarkText(savedWatermark);

      const savedShowWatermark = localStorage.getItem('bulk_show_watermark');
      if (savedShowWatermark !== null) setShowWatermark(savedShowWatermark === 'true');

      const savedHideInstitute = localStorage.getItem('bulk_hide_institute');
      if (savedHideInstitute !== null) setHideInstitute(savedHideInstitute === 'true');

      const savedObjFont = localStorage.getItem('bulk_obj_font_size');
      if (savedObjFont) setObjectiveFontSize(Number(savedObjFont));

      const savedCqFont = localStorage.getItem('bulk_cq_font_size');
      if (savedCqFont) setCqSqFontSize(Number(savedCqFont));

      const savedEng = localStorage.getItem('bulk_engineering_boxes');
      if (savedEng !== null) setEngineeringExamBoxes(savedEng === 'true');
      const savedScale = localStorage.getItem('bulk_engineering_box_scale');
      if (savedScale) setEngineeringBoxScale(Number(savedScale));
      const savedStyle = localStorage.getItem('bulk_engineering_box_style');
      if (savedStyle) setEngineeringBoxStyle(savedStyle as any);

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('engineeringBoxes') === 'true' || urlParams.get('engineeringExam') === 'true') {
          setEngineeringExamBoxes(true);
        }
      }
    } catch (e) {
      console.error('Error restoring bulk print preferences', e);
    }
  }, []);

  // Fetch full list of all available exams from /api/exams
  useEffect(() => {
    let isMounted = true;
    async function fetchAllExams() {
      setIsFetchingList(true);
      try {
        const res = await fetch('/api/exams?limit=1000');
        let rawList: any[] = [];
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rawList = json;
          } else if (Array.isArray(json.exams)) {
            rawList = json.exams;
          } else if (Array.isArray(json.data?.exams)) {
            rawList = json.data.exams;
          } else if (Array.isArray(json.data)) {
            rawList = json.data;
          }
        }

        // Fallback to localStorage cache if API returned empty array or failed
        if (rawList.length === 0 && typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('cached_admin_exams');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) rawList = parsed;
            }
          } catch (e) {}
        }

        const items: ExamListItem[] = rawList.map((ex: any) => ({
          id: ex.id,
          title: ex.title || ex.name || 'Untitled Exam',
          subject: ex.subject || ex.class?.name || ex.subjectName || '',
          class: ex.class?.name || ex.class || ex.grade || '',
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

  // Open Institute Modal with current active values
  const handleOpenInstituteModal = () => {
    setTempSchoolName(globalSchoolName);
    setTempSchoolAddress(globalSchoolAddress);
    setTempWatermarkText(customWatermarkText);
    setInstituteSaveSuccess(false);
    setShowGlobalInstituteModal(true);
  };

  // Save Institute Changes to state and localStorage
  const handleSaveInstituteChanges = () => {
    setGlobalSchoolName(tempSchoolName);
    setGlobalSchoolAddress(tempSchoolAddress);
    setCustomWatermarkText(tempWatermarkText);

    try {
      localStorage.setItem('bulk_custom_school_name', tempSchoolName);
      localStorage.setItem('bulk_custom_school_address', tempSchoolAddress);
      localStorage.setItem('bulk_custom_watermark', tempWatermarkText);
      localStorage.setItem('bulk_show_watermark', String(showWatermark));
      localStorage.setItem('bulk_hide_institute', String(hideInstitute));
    } catch (e) {
      console.error(e);
    }

    setInstituteSaveSuccess(true);
    setTimeout(() => {
      setShowGlobalInstituteModal(false);
      setInstituteSaveSuccess(false);
    }, 600);
  };

  // Reset Institute to default values
  const handleResetInstituteDefaults = () => {
    setTempSchoolName('');
    setTempSchoolAddress('');
    setTempWatermarkText('');
    setGlobalSchoolName('');
    setGlobalSchoolAddress('');
    setCustomWatermarkText('');
    setHideInstitute(false);

    try {
      localStorage.removeItem('bulk_custom_school_name');
      localStorage.removeItem('bulk_custom_school_address');
      localStorage.removeItem('bulk_custom_watermark');
      localStorage.removeItem('bulk_hide_institute');
    } catch (e) {}

    setShowGlobalInstituteModal(false);
  };

  // Extract unique subjects, classes, and types for filters
  const filterOptions = useMemo(() => {
    const subjects = new Set<string>();
    const classes = new Set<string>();
    const types = new Set<string>();

    allExamsList.forEach(e => {
      if (e.subject) subjects.add(e.subject.trim());
      if (e.class) classes.add(e.class.trim());
      if (e.type) types.add(e.type.trim());
    });

    return {
      subjects: Array.from(subjects).sort(),
      classes: Array.from(classes).sort(),
      types: Array.from(types).sort()
    };
  }, [allExamsList]);

  // Enhanced Filtered & Sorted exams list in the selector drawer
  const filteredExamsList = useMemo(() => {
    return allExamsList
      .filter(item => {
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

        if (selectedSubject !== 'all' && item.subject?.trim().toLowerCase() !== selectedSubject.toLowerCase()) {
          return false;
        }
        if (selectedClass !== 'all' && item.class?.trim().toLowerCase() !== selectedClass.toLowerCase()) {
          return false;
        }
        if (selectedType !== 'all' && item.type?.trim().toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date || b.examDate || 0).getTime() - new Date(a.date || a.examDate || 0).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.date || a.examDate || 0).getTime() - new Date(b.date || b.examDate || 0).getTime();
        }
        if (sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'title_desc') {
          return (b.title || '').localeCompare(a.title || '');
        }
        if (sortBy === 'marks_desc') {
          return (b.totalMarks || 0) - (a.totalMarks || 0);
        }
        return 0;
      });
  }, [
    allExamsList,
    searchQuery,
    filterType,
    selectedExamIds,
    selectedSubject,
    selectedClass,
    selectedType,
    sortBy
  ]);

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

  // Resolved list of loaded exams in the user-specified sequence
  const orderedLoadedExams = useMemo(() => {
    return selectedExamIds
      .map(id => loadedExamsMap[id])
      .filter((ex): ex is LoadedExamData => Boolean(ex));
  }, [selectedExamIds, loadedExamsMap]);

  // =========================================================================
  // PRECISE REAL-TIME PRINT PAGE & SHEET BUDGET CALCULATOR
  // =========================================================================
  const printMetrics = useMemo(() => {
    let totalLogicalPages = 0;
    let totalPhysicalSheets = 0;
    let totalQuestions = 0;
    let totalMarks = 0;

    const examBreakdowns: Array<{
      id: string;
      title: string;
      logicalPages: number;
      sheets: number;
      setsCount: number;
      questionsCount: number;
      omrSheets: number;
    }> = [];

    const sheetNavigationItems: Array<{
      sheetIndex: number;
      examTitle: string;
      label: string;
      elementId: string;
    }> = [];

    let currentSheetCounter = 1;

    orderedLoadedExams.forEach((examData) => {
      const { sets, examInfo } = examData;
      const effectiveInfo = {
        ...examInfo,
        schoolName: globalSchoolName !== '' ? globalSchoolName : examInfo?.schoolName,
      };

      const nonEmptySets = (sets || []).filter(
        (set: any) => (
          set.mcq?.length || set.mc?.length || set.int?.length ||
          set.ar?.length || set.cq?.length || set.sq?.length ||
          set.mtf?.length || set.descriptive?.length || set.orderedObjective?.length
        )
      );

      const targetSets = setSelection === 'first_only' ? nonEmptySets.slice(0, 1) : nonEmptySets;
      let examPages = 0;
      let examSheets = 0;
      let examQuestions = 0;

      targetSets.forEach((set: any) => {
        const mcqCount = set.mcq?.length || set.orderedObjective?.length || 0;
        const cqCount = set.cq?.length || 0;
        const sqCount = set.sq?.length || 0;
        const totalQ = mcqCount + cqCount + sqCount;
        examQuestions += totalQ;

        if (layoutMode === 'booklet_4page') {
          // Booklet Imposition: exact multiple of 4 pages
          const targetPages = getOptimalPageCount(set, effectiveInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
          const logicalPages = splitExamSetForBooklet(set, effectiveInfo, targetPages, {
            fontSize: objectiveFontSize,
            cqSqFontSize,
            layoutMode,
            hideInstitute,
            engineeringExamBoxes,
            engineeringBoxScale,
            paperSize
          });
          const { N, sheets } = computeBookletSheets(logicalPages.length);
          examPages += N;
          examSheets += sheets.length;

          sheets.forEach((sh, shIdx) => {
            sheetNavigationItems.push({
              sheetIndex: currentSheetCounter++,
              examTitle: effectiveInfo?.title || 'Exam',
              label: `Sheet ${sh.sheetNumber} (${sh.front.leftPageNum}|${sh.front.rightPageNum})`,
              elementId: `sheet-${examData.id}-${sh.sheetNumber}`
            });
          });
        } else if (layoutMode === 'booklet_2up') {
          // 2-Up Sequential Spread: 2 pages per sheet
          const targetPages = getOptimalPageCount(set, effectiveInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
          const logicalPages = splitExamSetForBooklet(set, effectiveInfo, targetPages, {
            fontSize: objectiveFontSize,
            cqSqFontSize,
            layoutMode,
            hideInstitute,
            engineeringExamBoxes,
            engineeringBoxScale,
            paperSize
          });
          examPages += logicalPages.length;
          const sCount = Math.ceil(logicalPages.length / 2);
          examSheets += sCount;

          for (let i = 1; i <= sCount; i++) {
            sheetNavigationItems.push({
              sheetIndex: currentSheetCounter++,
              examTitle: effectiveInfo?.title || 'Exam',
              label: `Spread ${i} (${i * 2 - 1}|${i * 2})`,
              elementId: `seq2up-${examData.id}-${set.setId}`
            });
          }
        } else {
          // Standard Multi-Page Mode
          if (standardPagingMode === 'paginated_bounds' || engineeringExamBoxes) {
            const targetPages = getOptimalPageCount(set, effectiveInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
            const logicalPages = splitExamSetForBooklet(set, effectiveInfo, targetPages, {
              fontSize: objectiveFontSize,
              cqSqFontSize,
              layoutMode,
              hideInstitute,
              engineeringExamBoxes,
              engineeringBoxScale,
              paperSize
            });
            examPages += logicalPages.length;
            const sCount = Math.ceil(logicalPages.length / 2);
            examSheets += sCount;

            for (let i = 1; i <= logicalPages.length; i++) {
              sheetNavigationItems.push({
                sheetIndex: currentSheetCounter++,
                examTitle: effectiveInfo?.title || 'Exam',
                label: `Page ${i}`,
                elementId: `page-${examData.id}-${i}`
              });
            }
          } else {
            // Continuous single long container
            const pagesEst = Math.max(1, Math.ceil((totalQ * (objectiveFontSize / 100)) / 28));
            examPages += pagesEst;
            examSheets += Math.ceil(pagesEst / 2);

            sheetNavigationItems.push({
              sheetIndex: currentSheetCounter++,
              examTitle: effectiveInfo?.title || 'Exam',
              label: `Exam ${examData.id.slice(0, 4)}`,
              elementId: `std-${examData.id}-${set.setId}`
            });
          }
        }

        // If answers are included in 'both' mode, double question paper pages
        if (outputType === 'both') {
          examPages *= 2;
          examSheets *= 2;
        }
      });

      // OMR sheets (1 per set if enabled)
      const omrSheetsCount = showOMR && outputType !== 'answers' ? targetSets.length : 0;
      examPages += omrSheetsCount;
      examSheets += omrSheetsCount;

      totalLogicalPages += examPages;
      totalPhysicalSheets += examSheets;
      totalQuestions += examQuestions;
      totalMarks += (examInfo?.totalMarks || 0);

      examBreakdowns.push({
        id: examData.id,
        title: examInfo?.title || 'Exam',
        logicalPages: examPages,
        sheets: examSheets,
        setsCount: targetSets.length,
        questionsCount: examQuestions,
        omrSheets: omrSheetsCount
      });
    });

    const studentsRequirement = studentBatchCount > 0 ? totalPhysicalSheets * studentBatchCount : 0;
    const reamsRequirement = (studentsRequirement / 500).toFixed(1);

    return {
      totalLogicalPages,
      totalPhysicalSheets,
      totalQuestions,
      totalMarks,
      examBreakdowns,
      sheetNavigationItems,
      studentsRequirement,
      reamsRequirement
    };
  }, [
    orderedLoadedExams,
    layoutMode,
    standardPagingMode,
    setSelection,
    outputType,
    showOMR,
    objectiveFontSize,
    globalSchoolName,
    studentBatchCount
  ]);

  // =========================================================================
  // DIRECT IN-BROWSER PRINTER DRIVER & PDF GENERATION (NO DOWNLOAD REQUIRED)
  // Dispatches directly to the system's physical printer spooler
  // =========================================================================
  // @ts-ignore
  const handleDirectPrint = useReactToPrint({
    contentRef: printRef,
    content: () => printRef.current,
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
  const densityClass = spacingDensity === 'compact' ? 'compact-exam-density' : spacingDensity === 'spacious' ? 'spacious-exam-density' : '';

  // Scroll smoothly to a specific sheet element
  const scrollToSheetElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
                spacingDensity === 'compact'
                  ? '4mm'
                  : isBooklet
                    ? (paperSize === 'a3' ? '8mm' : '5mm')
                    : (paperSize === 'a3' ? '12mm' : paperSize === 'legal' ? '12mm' : '8mm')
              };
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background: white !important;
            }
            .bulk-watermark-overlay {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 7.5rem;
              color: rgba(0, 0, 0, 0.035) !important;
              font-weight: 900;
              letter-spacing: 0.1em;
              white-space: nowrap;
              pointer-events: none;
              z-index: 0;
              text-transform: uppercase;
              user-select: none;
            }
            .compact-exam-density .question-paper-container {
              line-height: 1.35 !important;
            }
            .compact-exam-density .question-item {
              margin-bottom: 0.25rem !important;
            }
          }
        ` }} />

        {/* =========================================================================
            TOP NAV BAR (Header)
           ========================================================================= */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/exams')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Back to Exams"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-blue-400" />
                  {t.bulkPrintHub}
                </h1>
                
                {/* Selected Exams Badge */}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedExamIds.length} {t.selectedExams}
                </span>

                {/* EXACT LIVE PAGE BUDGET BADGE */}
                {printMetrics.totalPhysicalSheets > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs">
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>{printMetrics.totalPhysicalSheets} Sheets ({printMetrics.totalLogicalPages} Pages)</span>
                  </span>
                )}

                {/* Active Custom Institute Pill */}
                {globalSchoolName ? (
                  <button
                    onClick={handleOpenInstituteModal}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition flex items-center gap-1"
                    title="Click to edit custom institution header"
                  >
                    <Building2 className="w-3 h-3 text-purple-400" />
                    <span className="max-w-[130px] truncate">{globalSchoolName}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenInstituteModal}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Default Institute</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Student Paper Budget Calculator Button */}
            <button
              onClick={() => setShowCalculator(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition border ${
                showCalculator
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Calculate paper reams & sheets required for student cohorts"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Paper Budget</span>
            </button>

            {/* Direct Driver Setup Info Button */}
            <button
              onClick={() => setShowDriverGuideModal(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition flex items-center gap-1"
              title="Printer driver setup instructions: Duplex, scaling, paper trays"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Driver Setup</span>
            </button>

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
              <span>{isDrawerOpen ? 'Hide Drawer' : 'Select Exams'}</span>
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

            {/* DIRECT PRINTER DRIVER ACTION BUTTON (No Download Required) */}
            <button
              onClick={() => {
                try {
                  if (typeof handleDirectPrint === 'function') {
                    handleDirectPrint();
                  } else {
                    window.print();
                  }
                } catch (e) {
                  console.warn('Direct printer driver fallback to window.print:', e);
                  window.print();
                }
              }}
              disabled={isPrinting || orderedLoadedExams.length === 0 || loadingExamsStatus.isLoading}
              className="px-4 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Prints directly to your connected physical printer driver without saving files"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? t.preparing : t.print}</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            STUDENT BATCH PAPER BUDGET CALCULATOR DROPDOWN (Interactive)
           ========================================================================= */}
        {showCalculator && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 flex-wrap gap-3 print:hidden animate-fade-in">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Student Cohort Calculator:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-200/80">Batch Size:</span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={studentBatchCount}
                  onChange={(e) => setStudentBatchCount(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-700 text-amber-100 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span>students</span>
              </div>
              <div className="h-4 w-px bg-amber-800/80 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span>Sheets per student: <strong className="text-white font-mono">{printMetrics.totalPhysicalSheets}</strong></span>
                <span>• Total Reams: <strong className="text-amber-300 font-mono">{printMetrics.reamsRequirement}</strong> (~{printMetrics.studentsRequirement} sheets)</span>
              </div>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-amber-400 hover:text-amber-200 font-bold text-xs"
            >
              ✕ Close
            </button>
          </div>
        )}

        {/* =========================================================================
            MAIN WORKSPACE: Sidebar Drawer + Main Canvas
           ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* -----------------------------------------------------------------------
              LEFT: POWER EXAM SELECTOR & MANAGEMENT DRAWER (Collapsible with Advanced Filters)
             ----------------------------------------------------------------------- */}
          {isDrawerOpen && (
            <aside className="w-80 sm:w-96 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-[calc(100vh-53px)] z-30 print:hidden animate-fade-in">
              {/* Header with Search & Filter */}
              <div className="p-3.5 border-b border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    Exams Selector ({selectedExamIds.length})
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSelectAllFiltered}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Select all currently visible exams"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                      title="Clear all selections"
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
                    className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                {/* Filter Chips & Advanced Filter Toggle */}
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
                  <button
                    onClick={() => setShowAdvancedFilters(prev => !prev)}
                    className={`p-1.5 rounded-lg border transition ${
                      showAdvancedFilters || selectedSubject !== 'all' || selectedClass !== 'all'
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Toggle Advanced Filters (Subject, Class, Sorting)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ADVANCED MULTI-DIMENSIONAL FILTERS */}
                {showAdvancedFilters && (
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-[11px] animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Filter by Subject */}
                      <div>
                        <label className="text-slate-400 font-semibold block mb-0.5">Subject:</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="all">All Subjects</option>
                          {filterOptions.subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Class */}
                      <div>
                        <label className="text-slate-400 font-semibold block mb-0.5">Class / Grade:</label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="all">All Classes</option>
                          {filterOptions.classes.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Filter by Type */}
                      <div>
                        <label className="text-slate-400 font-semibold block mb-0.5">Exam Type:</label>
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="all">All Types</option>
                          {filterOptions.types.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="text-slate-400 font-semibold block mb-0.5">Sort By:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="date_desc">Newest First</option>
                          <option value="date_asc">Oldest First</option>
                          <option value="title_asc">Title (A-Z)</option>
                          <option value="title_desc">Title (Z-A)</option>
                          <option value="marks_desc">Highest Marks</option>
                        </select>
                      </div>
                    </div>

                    {/* Reset Filter Button */}
                    {(selectedSubject !== 'all' || selectedClass !== 'all' || selectedType !== 'all') && (
                      <div className="flex justify-end pt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedSubject('all');
                            setSelectedClass('all');
                            setSelectedType('all');
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Sequence Re-order Section with Per-Exam Page Badges */}
              {selectedExamIds.length > 0 && (
                <div className="bg-slate-900/90 border-b border-slate-800 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1 text-blue-400">
                      <MoveUp className="w-3 h-3" /> Print Sequence ({selectedExamIds.length})
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {printMetrics.totalPhysicalSheets} Sheets Total
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                    {selectedExamIds.map((id, idx) => {
                      const examItem = allExamsList.find(e => e.id === id);
                      const breakdown = printMetrics.examBreakdowns.find(b => b.id === id);

                      return (
                        <div
                          key={`ordered-${id}`}
                          className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-mono text-[9px] flex items-center justify-center flex-shrink-0 font-bold">
                              {idx + 1}
                            </span>
                            <span className="truncate text-slate-200 font-medium">
                              {examItem?.title || id}
                            </span>
                            {breakdown && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-800 flex-shrink-0">
                                {breakdown.logicalPages}p • {breakdown.sheets}s
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
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
                    const breakdown = printMetrics.examBreakdowns.find(b => b.id === item.id);

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
                              {breakdown && (
                                <span className="text-amber-400 font-mono font-bold bg-amber-950/60 border border-amber-800/60 px-1 rounded">
                                  {breakdown.logicalPages}p • {breakdown.sheets}s
                                </span>
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
            <div className="bg-slate-950/90 border-b border-slate-800 p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2 text-xs print:hidden">
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
                    <option value="a4">A4 (Standard 210×297mm)</option>
                    <option value="a3">A3 (🌟 Admission Test Booklet)</option>
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

                {/* Standard Paging Mode (Only when Standard layout is active) */}
                {layoutMode === 'standard' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Pagination:</span>
                    <select
                      value={standardPagingMode}
                      onChange={(e) => {
                        const v = e.target.value as any;
                        setStandardPagingMode(v);
                        try { localStorage.setItem('bulk_print_standard_paging', v); } catch (err) {}
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="paginated_bounds">Discrete Bounded Pages (No Cutting)</option>
                      <option value="continuous_flow">Continuous Flow (Vertical)</option>
                    </select>
                  </div>
                )}

                {/* Space Density (Compact vs Standard vs Spacious) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Density:</span>
                  <select
                    value={spacingDensity}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setSpacingDensity(v);
                      try { localStorage.setItem('bulk_print_density', v); } catch (err) {}
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="compact">Compact (⚡ Space Saver)</option>
                    <option value="standard">Balanced (Standard Exam)</option>
                    <option value="spacious">Spacious (Readable)</option>
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
                    <option value="page_break">Fresh Sheet per Exam</option>
                    <option value="continuous">Continuous Flow</option>
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

              {/* Right Side Options: OMR, Booklet Guide, Institute Edit */}
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

                {/* Engineering Exam SQ Boxes Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !engineeringExamBoxes;
                    setEngineeringExamBoxes(nextVal);
                    try { localStorage.setItem('bulk_engineering_boxes', String(nextVal)); } catch (err) {}
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 shadow-xs ${
                    engineeringExamBoxes
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Add designated engineering student answer boxes for Subjective Questions (SQ)"
                >
                  <span className="text-xs">📐</span>
                  <span>SQ Boxes {engineeringExamBoxes ? 'ON' : 'OFF'}</span>
                </button>

                {/* Engineering Box Fine Controls (when ON) */}
                {engineeringExamBoxes && (
                  <div className="flex items-center gap-1.5 bg-slate-900/90 border border-indigo-500/40 rounded-lg px-2 py-0.5 text-[11px]">
                    <span className="text-indigo-300 font-semibold text-[10px]">Style:</span>
                    <select
                      value={engineeringBoxStyle}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setEngineeringBoxStyle(val);
                        try { localStorage.setItem('bulk_engineering_box_style', val); } catch (err) {}
                      }}
                      className="bg-slate-800 text-white rounded px-1.5 py-0.5 text-[10px] font-semibold border border-slate-700 focus:outline-none"
                    >
                      <option value="ruled">Ruled</option>
                      <option value="blank">Blank</option>
                      <option value="grid">Grid</option>
                    </select>

                    <span className="text-indigo-300 font-semibold text-[10px] ml-1">Scale:</span>
                    <div className="flex items-center gap-0.5">
                      {[
                        { label: 'Compact', scale: 0.85 },
                        { label: 'Std', scale: 1.0 },
                        { label: 'Spacious', scale: 1.2 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setEngineeringBoxScale(item.scale);
                            try { localStorage.setItem('bulk_engineering_box_scale', String(item.scale)); } catch (err) {}
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition ${
                            engineeringBoxScale === item.scale
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Institute Customization Modal Trigger */}
                <button
                  onClick={handleOpenInstituteModal}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-100 bg-indigo-600 hover:bg-indigo-500 shadow-xs transition flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Edit Institute</span>
                </button>
              </div>
            </div>

            {/* Secondary Toolbar: Font Scaling & Canvas Zoom */}
            <div className="bg-slate-950/70 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 print:hidden">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* MCQ Font Size with - and + */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
                  <span className="text-slate-300 font-medium">MCQ Font:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.max(50, objectiveFontSize - 2);
                      setObjectiveFontSize(v);
                      try { localStorage.setItem('bulk_obj_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
                    title="Decrease MCQ Font (-2%)"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={objectiveFontSize}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setObjectiveFontSize(v);
                      try { localStorage.setItem('bulk_obj_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-16 accent-blue-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.min(160, objectiveFontSize + 2);
                      setObjectiveFontSize(v);
                      try { localStorage.setItem('bulk_obj_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
                    title="Increase MCQ Font (+2%)"
                  >
                    +
                  </button>
                  <span className="font-mono text-blue-400 font-semibold min-w-[36px] text-right">{objectiveFontSize}%</span>
                </div>

                {/* CQ Font Size with - and + */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
                  <span className="text-slate-300 font-medium">CQ Font:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.max(50, cqSqFontSize - 2);
                      setCqSqFontSize(v);
                      try { localStorage.setItem('bulk_cq_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
                    title="Decrease CQ Font (-2%)"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={cqSqFontSize}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCqSqFontSize(v);
                      try { localStorage.setItem('bulk_cq_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-16 accent-blue-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.min(160, cqSqFontSize + 2);
                      setCqSqFontSize(v);
                      try { localStorage.setItem('bulk_cq_font_size', String(v)); } catch (err) {}
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-xs"
                    title="Increase CQ Font (+2%)"
                  >
                    +
                  </button>
                  <span className="font-mono text-blue-400 font-semibold min-w-[36px] text-right">{cqSqFontSize}%</span>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setObjectiveFontSize(85);
                      setCqSqFontSize(85);
                      try {
                        localStorage.setItem('bulk_obj_font_size', '85');
                        localStorage.setItem('bulk_cq_font_size', '85');
                      } catch (err) {}
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                  >
                    Compact (85%)
                  </button>
                  <button
                    onClick={() => {
                      setObjectiveFontSize(100);
                      setCqSqFontSize(100);
                      try {
                        localStorage.setItem('bulk_obj_font_size', '100');
                        localStorage.setItem('bulk_cq_font_size', '100');
                      } catch (err) {}
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                  >
                    Reset (100%)
                  </button>
                  <button
                    onClick={() => {
                      setObjectiveFontSize(115);
                      setCqSqFontSize(115);
                      try {
                        localStorage.setItem('bulk_obj_font_size', '115');
                        localStorage.setItem('bulk_cq_font_size', '115');
                      } catch (err) {}
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                  >
                    Large (115%)
                  </button>
                </div>
              </div>

              {/* Canvas Zoom & Visual Inspection Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5">
                  <span className="text-slate-400">Zoom:</span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(50, prev - 15))}
                    className="p-0.5 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-200 font-bold px-1">{previewZoom}%</span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(150, prev + 15))}
                    className="p-0.5 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setPreviewZoom(100)}
                    className="text-[9px] text-blue-400 hover:text-blue-300 pl-1 font-bold"
                  >
                    Reset
                  </button>
                </div>

                {/* Toggles */}
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
                    checked={showWatermark}
                    onChange={(e) => {
                      setShowWatermark(e.target.checked);
                      try { localStorage.setItem('bulk_show_watermark', String(e.target.checked)); } catch (err) {}
                    }}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Watermark</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={hideInstitute}
                    onChange={(e) => {
                      setHideInstitute(e.target.checked);
                      try { localStorage.setItem('bulk_hide_institute', String(e.target.checked)); } catch (err) {}
                    }}
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
            <div className={`flex-1 overflow-y-auto bg-slate-900/90 p-4 sm:p-8 flex flex-col items-center ${densityClass}`}>
              {selectedExamIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto p-8 rounded-2xl bg-slate-950/60 border border-slate-800 max-w-md text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {t.noExamsSelected}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Open the Exam Selection Drawer on the left, filter by subject or class, and pick multiple exams to generate a unified, publication-grade print bundle.
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
                  className="bulk-print-container print:w-full space-y-8 print:space-y-0 relative transition-transform duration-200 origin-top"
                  style={{
                    fontFamily: "'ExamFont', 'Noto Serif Bengali', Georgia, serif",
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : 'none'
                  }}
                >
                  {/* Security Watermark Overlay across pages if enabled */}
                  {showWatermark && !hideInstitute && (customWatermarkText || globalSchoolName) && (
                    <div className="bulk-watermark-overlay print-only">
                      {customWatermarkText || globalSchoolName}
                    </div>
                  )}

                  {orderedLoadedExams.map((examData, examIndex) => {
                    const isLastExam = examIndex === orderedLoadedExams.length - 1;
                    const { sets } = examData;
                    
                    // Effective exam info (with custom institute info override applied)
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
                            {targetSets.map((set: any) => {
                              // If Bounded Paginated Mode is chosen, split into exact pages with zero clipping
                              if (standardPagingMode === 'paginated_bounds' || engineeringExamBoxes) {
                                const targetPages = getOptimalPageCount(set, examInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
                                const pages = splitExamSetForBooklet(set, examInfo, targetPages, {
                                  fontSize: objectiveFontSize,
                                  cqSqFontSize,
                                  layoutMode,
                                  hideInstitute,
                                  engineeringExamBoxes,
                                  engineeringBoxScale,
                                  paperSize
                                });
                                const totalPages = pages.length;

                                return (
                                  <React.Fragment key={`std-paginated-${examData.id}-${set.setId}`}>
                                    {pages.map((p, pIdx) => {
                                      const pageNum = pIdx + 1;
                                      const isPage1 = pageNum === 1;
                                      const isFinalPage = pageNum === totalPages;

                                      return (
                                        <div
                                          key={`page-${examData.id}-${pageNum}`}
                                          id={`page-${examData.id}-${pageNum}`}
                                          className={`print-page-container ${paperClass} ${engineeringExamBoxes ? 'engineering-page-mode' : ''}`}
                                          style={{ pageBreakAfter: (!isFinalPage || (examSeparation === 'page_break' && !isLastExam)) ? 'always' : 'auto', breakAfter: (!isFinalPage || (examSeparation === 'page_break' && !isLastExam)) ? 'page' : 'auto' }}
                                        >
                                          {/* Running Header on subsequent pages */}
                                          {!isPage1 && (
                                            <div className="flex justify-between items-center text-xs font-bold border-b border-black pb-1 mb-2 text-gray-800">
                                              <span>{!hideInstitute ? (examInfo.schoolName || '') : ''}</span>
                                              <span>{p.subjectName ? `[${p.subjectName}] ${examInfo.title}` : examInfo.title}</span>
                                              <span className="border border-black px-1.5 py-0.5 rounded text-[10px] bg-gray-50">
                                                {language === 'en' ? `Page ${pageNum} of ${totalPages}` : `পৃষ্ঠা ${toBengaliNumerals(pageNum)} / ${toBengaliNumerals(totalPages)}`}
                                              </span>
                                            </div>
                                          )}

                                          {outputType !== 'answers' ? (
                                            <QuestionPaper
                                              examInfo={{ ...examInfo, set: set.setName }}
                                              questions={p.questions}
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
                                              startQuestionIndex={p.startIndex}
                                              startCqIndex={p.cqStartIndex}
                                              startSqIndex={p.sqStartIndex}
                                              pageNumberLabel=""
                                              engineeringExamBoxes={engineeringExamBoxes}
                                              engineeringBoxScale={engineeringBoxScale}
                                              engineeringBoxStyle={engineeringBoxStyle}
                                              paperSize={paperSize}
                                            />
                                          ) : (
                                            <AnswerQuestionPaper
                                              examInfo={{ ...examInfo, set: set.setName }}
                                              questions={p.questions}
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
                                              startQuestionIndex={p.startIndex}
                                              startCqIndex={p.cqStartIndex}
                                              startSqIndex={p.sqStartIndex}
                                              pageNumberLabel=""
                                            />
                                          )}

                                          {/* End of Exam Tag on final page */}
                                          {isFinalPage && (
                                            <div className="text-center font-bold text-[10px] uppercase tracking-wider text-gray-500 border-t border-black/30 pt-1 mt-2">
                                              {language === 'en'
                                                ? `— End of Exam: ${examInfo.title} —`
                                                : `— সমাপ্ত: ${examInfo.title} —`}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              }

                              // Otherwise, standard continuous container
                              return (
                                <React.Fragment key={`std-${examData.id}-${set.setId}`}>
                                  {(outputType === 'questions' || outputType === 'both') && (
                                    <div id={`std-${examData.id}-${set.setId}`} className={`print-page-container ${paperClass}`}>
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
                                        paperSize={paperSize}
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
                              );
                            })}
                          </>
                        )}

                        {/* =======================================================
                            LAYOUT MODE 2: BOOKLET IMPOSITION (Duplex Folding)
                           ======================================================= */}
                        {layoutMode === 'booklet_4page' && (
                          <>
                            {targetSets.map((set: any) => {
                              const targetPages = getOptimalPageCount(set, examInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
                              const pages = splitExamSetForBooklet(set, examInfo, targetPages, {
                                fontSize: objectiveFontSize,
                                cqSqFontSize,
                                layoutMode,
                                hideInstitute,
                                engineeringExamBoxes,
                                engineeringBoxScale,
                                paperSize
                              });
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
                                        {language === 'en' ? `Page ${pageNum} of ${totalPages}` : `পৃষ্ঠা ${toBengaliNumerals(pageNum)} / ${toBengaliNumerals(totalPages)}`}
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
                                        paperSize={paperSize}
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
                                      <div id={`sheet-${examData.id}-${sheet.sheetNumber}`} className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
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
                              const targetPages = getOptimalPageCount(set, examInfo, layoutMode, objectiveFontSize, cqSqFontSize, engineeringExamBoxes, engineeringBoxScale, paperSize);
                              const pages = splitExamSetForBooklet(set, examInfo, targetPages, {
                                fontSize: objectiveFontSize,
                                cqSqFontSize,
                                layoutMode,
                                hideInstitute,
                                engineeringExamBoxes,
                                engineeringBoxScale,
                                paperSize
                              });
                              const [p1, p2, p3, p4] = pages;
                              return (
                                <React.Fragment key={`seq2up-${examData.id}-${set.setId}`}>
                                  {/* Spread 1: Page 1 | Page 2 */}
                                  <div id={`seq2up-${examData.id}-${set.setId}`} className={`print-page-container booklet-sheet ${paperClass}`} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
                                        paperSize={paperSize}
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
                                        paperSize={paperSize}
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
                                        paperSize={paperSize}
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
                                        engineeringExamBoxes={engineeringExamBoxes}
                                        engineeringBoxScale={engineeringBoxScale}
                                        engineeringBoxStyle={engineeringBoxStyle}
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

            {/* =====================================================================
                BOTTOM FLOATING SHEET NAVIGATOR STRIP (Jump to any Sheet / Page)
               ===================================================================== */}
            {printMetrics.sheetNavigationItems.length > 0 && (
              <div className="bg-slate-950/95 border-t border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-[11px] print:hidden">
                <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Jump to Sheet:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {printMetrics.sheetNavigationItems.map((item) => (
                    <button
                      key={item.sheetIndex}
                      onClick={() => scrollToSheetElement(item.elementId)}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-300 font-medium whitespace-nowrap transition flex items-center gap-1"
                      title={`Jump to ${item.examTitle} - ${item.label}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-mono flex items-center justify-center font-bold">
                        {item.sheetIndex}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (printRef.current) {
                        printRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Jump to Top"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* =========================================================================
            MODAL: COMPREHENSIVE INSTITUTE CUSTOMIZATION & PERSISTENCE
           ========================================================================= */}
        {showGlobalInstituteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      Custom Institute & Watermark Studio
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Overrides institute headers & security watermark across all selected exams
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGlobalInstituteModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {instituteSaveSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2 font-bold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Custom institution info saved & applied successfully!</span>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Institution Name (শিক্ষা প্রতিষ্ঠানের নাম):
                  </label>
                  <input
                    type="text"
                    value={tempSchoolName}
                    onChange={(e) => setTempSchoolName(e.target.value)}
                    placeholder="e.g. Dhaka Residential Model College / মতিঝিল আইডিয়াল স্কুল"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Leave empty to use each individual exam's original school name
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Institution Address (প্রতিষ্ঠানের ঠিকানা):
                  </label>
                  <input
                    type="text"
                    value={tempSchoolAddress}
                    onChange={(e) => setTempSchoolAddress(e.target.value)}
                    placeholder="e.g. Mirpur Road, Mohammadpur, Dhaka-1207"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Custom Watermark Text (জলছাপ):
                  </label>
                  <input
                    type="text"
                    value={tempWatermarkText}
                    onChange={(e) => setTempWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL / গোপনীয় / প্রতিষ্ঠানের নাম"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Appears faintly across all printed question pages for anti-leak security
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => setShowWatermark(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span className="font-semibold">Enable Security Watermark on Printed Pages</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={hideInstitute}
                      onChange={(e) => setHideInstitute(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span className="font-semibold">Hide Institute Information Completely</span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleResetInstituteDefaults}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Reset Defaults
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGlobalInstituteModal(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInstituteChanges}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Apply Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: PRINTER DRIVER & HARDWARE SPOOLER SETUP GUIDE
           ========================================================================= */}
        {showDriverGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      Physical Printer Driver Setup Guide
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Print directly to HP, Canon, Brother, Epson or Xerox without downloading
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDriverGuideModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>1. Destination Selection</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When the print dialog opens, look at the <strong>Destination</strong> dropdown. Select your connected physical printer (e.g. <em>Brother HL-L2320D, Canon LBP2900, HP LaserJet</em>) instead of "Save as PDF" to print instantly.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <span>2. Duplex (Two-Sided) Configuration</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>
                      <strong>For Booklet Mode (A3 / A4):</strong> Choose <strong className="text-white">"Flip on Short Edge"</strong> (বা খাটো প্রান্তে উল্টানো). This ensures the back cover and inside pages read right-side-up when folded!
                    </li>
                    <li>
                      <strong>For Standard Mode:</strong> Choose <strong className="text-white">"Flip on Long Edge"</strong>.
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>3. Quality & Scaling Settings</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set <strong>Scale</strong> to <strong>100% (Default)</strong> and check the box for <strong>"Background Graphics"</strong> so tables, watermarks, and Bengali mathematical equations render with rich contrast.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowDriverGuideModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Got It
                </button>
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
