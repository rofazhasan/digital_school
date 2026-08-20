"use client";

import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  Eye,
  FileSpreadsheet,
  QrCode,
  ShieldCheck,
  Send,
  Layers,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Filter,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  CircleDot
} from "lucide-react";
import { useExamContext } from "./ExamContext";
import { toBengaliNumerals, toBengaliAlphabets } from "@/utils/numeralConverter";
import { cn } from "@/lib/utils";
import Timer from "./Timer";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

const OMR_BENGALI_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
const OMR_ENGLISH_OPTIONS = ["A", "B", "C", "D", "E", "F"];
const SET_CODES = [
  { code: "A", bangla: "ক", name: "Set A (সেট ক)" },
  { code: "B", bangla: "খ", name: "Set B (সেট খ)" },
  { code: "C", bangla: "গ", name: "Set C (সেট গ)" },
  { code: "D", bangla: "ঘ", name: "Set D (সেট ঘ)" },
];

type FilterTab = "all" | "unanswered" | "answered";

interface OMRExamSheetProps {
  instituteName?: string;
  instituteLogo?: string;
  onSubmit: (forced?: boolean) => void;
  onToggleViewMode?: () => void;
  isSubmitting?: boolean;
}

export const OMRExamSheet: React.FC<OMRExamSheetProps> = ({
  instituteName = "ডিজিটাল স্কুল",
  instituteLogo = "/logo.png",
  onSubmit,
  onToggleViewMode,
  isSubmitting = false
}) => {
  const {
    exam,
    answers,
    setAnswers,
    sortedQuestions,
    setOrderedQuestions,
    switchExamSet,
    activeSection,
    hasCqSq,
  } = useExamContext();

  // In Only OMR mode: strictly adhere to the physical generated set's exact question order (1, 2, 3, 4...)
  const questions = setOrderedQuestions || sortedQuestions || [];
  const totalQuestions = questions.length;

  // Session user fallback state
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    // If student info is missing from exam, fetch session info
    if (!exam.studentName || !exam.studentRoll) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          if (data?.authenticated && data?.user) {
            setSessionUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [exam.studentName, exam.studentRoll]);

  // Real student details from exam or session
  const realStudentName = exam.studentName || sessionUser?.name || sessionUser?.username || "নিয়মিত পরীক্ষার্থী";
  const realStudentRoll = exam.studentRoll || sessionUser?.studentProfile?.roll || sessionUser?.roll || "01";
  const realStudentReg = exam.studentReg || sessionUser?.studentProfile?.registrationNo || "";

  // Selected Set Code on OMR sheet (Normalized to A, B, C, D / ক, খ, গ, ঘ)
  const normalizedExamSet = useMemo(() => {
    const raw = String(exam.setName || exam.examSetName || exam.assignedSet?.name || exam.examSet?.name || "A").trim();
    const clean = raw.replace(/^(set|সেট)\s*[-:]?\s*/i, "").trim().toUpperCase();
    if (clean === "1" || clean === "A" || clean === "ক") return "A";
    if (clean === "2" || clean === "B" || clean === "খ") return "B";
    if (clean === "3" || clean === "C" || clean === "গ") return "C";
    if (clean === "4" || clean === "D" || clean === "ঘ") return "D";
    return clean || "A";
  }, [exam.setName, exam.examSetName, exam.assignedSet, exam.examSet]);

  const [selectedSet, setSelectedSet] = useState<string>(normalizedExamSet);

  useEffect(() => {
    if (normalizedExamSet) {
      setSelectedSet(normalizedExamSet);
    }
  }, [normalizedExamSet]);

  // UI state for small screen optimizations
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [showQuickNavModal, setShowQuickNavModal] = useState<boolean>(false);
  const [showRollBubbles, setShowRollBubbles] = useState<boolean>(false);
  const [bubbleSizeScale, setBubbleSizeScale] = useState<"normal" | "large">("normal");
  const [highlightedQId, setHighlightedQId] = useState<string | null>(null);

  // Student Roll bubbling state (6 digits based on real roll)
  const rollDigitsStr = useMemo(() => {
    const digitsOnly = String(realStudentRoll).replace(/\D/g, "");
    return (digitsOnly || "01").padStart(6, "0").slice(-6);
  }, [realStudentRoll]);

  const [bubbledRoll, setBubbledRoll] = useState<number[]>(() => {
    return rollDigitsStr.split("").map((d) => parseInt(d, 10) || 0);
  });

  useEffect(() => {
    if (rollDigitsStr) {
      setBubbledRoll(rollDigitsStr.split("").map((d) => parseInt(d, 10) || 0));
    }
  }, [rollDigitsStr]);

  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Helper to trigger mobile vibration / haptics
  const vibrateOnTouch = useCallback(() => {
    triggerHaptic(ImpactStyle.Light);
    if (typeof window !== "undefined" && navigator?.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  }, []);

  // Calculate answered questions map for fast O(1) checks
  const answeredStatusMap = useMemo(() => {
    const map: { [qId: string]: boolean } = {};
    questions.forEach((q: any) => {
      const type = (q.type || q.questionType || "").toLowerCase();
      const ans = answers[q.id];

      if (type === "smcq") {
        const subQs = q.subQuestions || [];
        map[q.id] = subQs.some((_: any, idx: number) => !!answers[`${q.id}_sub_${idx}`]);
      } else if (type === "cq" || type === "sq") {
        if (type === "sq") map[q.id] = !!ans && ans !== "No answer provided";
        else {
          const subQs = q.subQuestions || q.sub_questions || [];
          map[q.id] = subQs.some((_: any, idx: number) => !!answers[`${q.id}_sub_${idx}`]);
        }
      } else if (type === "mc") {
        map[q.id] = !!(ans?.selectedOptions && ans.selectedOptions.length > 0);
      } else if (type === "mtf") {
        map[q.id] = !!(ans && Object.keys(ans).length > 0);
      } else if (type === "cma" || type === "mpc" || type === "constructed_multi_answer" || type === "multi_step_problem_chain") {
        const obj = typeof ans === "string" ? (() => { try { return JSON.parse(ans); } catch { return {}; } })() : ans;
        if (obj && typeof obj === "object") {
          const nonBlank = Object.values(obj).filter((v: any) => v !== undefined && v !== null && String(v).trim() !== "");
          map[q.id] = nonBlank.length > 0;
        } else {
          map[q.id] = Boolean(ans);
        }
      } else {
        map[q.id] = ans !== undefined && ans !== null && ans !== "" && ans !== "No answer provided";
      }
    });
    return map;
  }, [questions, answers]);

  const answeredCount = useMemo(() => {
    return Object.values(answeredStatusMap).filter(Boolean).length;
  }, [answeredStatusMap]);

  const unansweredCount = totalQuestions - answeredCount;

  // Handle single MCQ Bubble Select
  const handleMCQSelect = useCallback((qId: string, optionLabel: string, optionIndex: number) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const current = prev[qId];
      const currentStr = typeof current === "object" ? current?.selectedOption || current?.text : String(current || "");
      if (currentStr.trim() === optionLabel.trim()) {
        const updated = { ...prev };
        delete updated[qId];
        return updated;
      }
      return { ...prev, [qId]: optionLabel };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle Multiple Correct (MC) Toggle
  const handleMCToggle = useCallback((qId: string, optIndex: number) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const currentObj = prev[qId] || {};
      const currentList: number[] = currentObj.selectedOptions || [];
      let nextList: number[];
      if (currentList.includes(optIndex)) {
        nextList = currentList.filter(i => i !== optIndex);
      } else {
        nextList = [...currentList, optIndex];
      }
      return { ...prev, [qId]: { ...currentObj, selectedOptions: nextList } };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle SMCQ Sub-Question select
  const handleSMCQSelect = useCallback((qId: string, subIdx: number, optionLabel: string) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    const key = `${qId}_sub_${subIdx}`;
    setAnswers((prev: any) => {
      const current = prev[key];
      if (String(current || "").trim() === optionLabel.trim()) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }
      return { ...prev, [key]: optionLabel };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle MTF Pair Select
  const handleMTFPair = useCallback((qId: string, leftKey: string, rightVal: string) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const currentMap = prev[qId] || {};
      if (currentMap[leftKey] === rightVal) {
        const nextMap = { ...currentMap };
        delete nextMap[leftKey];
        return { ...prev, [qId]: nextMap };
      }
      return { ...prev, [qId]: { ...currentMap, [leftKey]: rightVal } };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle Numeric / Integer Input
  const handleNumericInput = useCallback((qId: string, val: string) => {
    if (isSubmitting) return;
    setAnswers((prev: any) => {
      if (!val || val.trim() === "") {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: { answer: val } };
    });
  }, [isSubmitting, setAnswers]);

  // Handle CMA Part Input / Option Select
  const handleCMAPartChange = useCallback((qId: string, partId: string, val: string) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const current = typeof prev[qId] === 'string'
        ? (() => { try { return JSON.parse(prev[qId]); } catch { return {}; } })()
        : (prev[qId] || {});

      const updated = { ...current };
      if (!val || String(val).trim() === '') {
        delete updated[partId];
      } else {
        updated[partId] = val;
      }

      if (Object.keys(updated).length === 0) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }

      return { ...prev, [qId]: updated };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle MPC Stage Input / Option Select
  const handleMPCStageChange = useCallback((qId: string, stageId: string, val: string) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const current = typeof prev[qId] === 'string'
        ? (() => { try { return JSON.parse(prev[qId]); } catch { return {}; } })()
        : (prev[qId] || {});

      const updated = { ...current };
      if (!val || String(val).trim() === '') {
        delete updated[stageId];
      } else {
        updated[stageId] = val;
      }

      if (Object.keys(updated).length === 0) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }

      return { ...prev, [qId]: updated };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Handle Assertion-Reason select
  const handleARSelect = useCallback((qId: string, optionNumber: number) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const current = prev[qId];
      const curNum = typeof current === "object" ? current?.selectedOption : Number(current);
      if (curNum === optionNumber) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: { selectedOption: optionNumber } };
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Clear a specific question's answer
  const handleClearAnswer = useCallback((q: any) => {
    if (isSubmitting) return;
    vibrateOnTouch();
    setAnswers((prev: any) => {
      const next = { ...prev };
      delete next[q.id];
      if (q.subQuestions) {
        q.subQuestions.forEach((_: any, idx: number) => {
          delete next[`${q.id}_sub_${idx}`];
        });
      }
      return next;
    });
  }, [isSubmitting, setAnswers, vibrateOnTouch]);

  // Quick Jump to Question
  const handleJumpToQuestion = useCallback((qId: string) => {
    setShowQuickNavModal(false);
    setHighlightedQId(qId);
    setTimeout(() => {
      const el = questionRefs.current[qId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    setTimeout(() => setHighlightedQId(null), 2500);
  }, []);

  // Dynamic chunking for range tabs (e.g. 15 questions per chunk on mobile)
  const chunkSize = totalQuestions > 40 ? 15 : totalQuestions > 20 ? 10 : totalQuestions;
  const chunkRanges = useMemo(() => {
    const ranges = [];
    for (let i = 0; i < totalQuestions; i += chunkSize) {
      const start = i + 1;
      const end = Math.min(i + chunkSize, totalQuestions);
      ranges.push({ start, end, label: `${toBengaliNumerals(start)}–${toBengaliNumerals(end)}` });
    }
    return ranges;
  }, [totalQuestions, chunkSize]);

  // Filtered questions list based on active tab and range chunk
  const displayedQuestions = useMemo(() => {
    let list = questions;

    if (filterTab === "unanswered") {
      list = list.filter((q: any) => !answeredStatusMap[q.id]);
    } else if (filterTab === "answered") {
      list = list.filter((q: any) => !!answeredStatusMap[q.id]);
    }

    return list;
  }, [questions, filterTab, answeredStatusMap]);

  return (
    <div className="w-full min-h-screen bg-slate-100/90 dark:bg-slate-950 py-2 sm:py-6 px-1.5 sm:px-4 md:px-6 font-sans select-none pb-28 md:pb-12">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">

        {/* --- STICKY TOP OMR CONTROL & STATS BAR --- */}
        <div className="sticky top-1 sm:top-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 shadow-xl rounded-2xl p-2.5 sm:p-4 transition-all">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: OMR badge & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold shrink-0">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-base text-slate-900 dark:text-white truncate">
                    OMR উত্তরপত্র
                  </span>
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Live
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  পূরণকৃত: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{toBengaliNumerals(answeredCount)}</strong> / {toBengaliNumerals(totalQuestions)}
                </p>
              </div>
            </div>

            {/* Middle: Timer */}
            <div className="shrink-0 scale-90 sm:scale-100">
              <Timer onTimeUp={() => onSubmit(true)} />
            </div>

            {/* Right: Quick Tools & Desktop Submit Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Quick Navigator Modal Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickNavModal(true)}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-bold gap-1 bg-slate-50 dark:bg-slate-800"
                title="সকল প্রশ্নের গ্রিড দেখুন"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">গ্রিড ({toBengaliNumerals(answeredCount)}/{toBengaliNumerals(totalQuestions)})</span>
              </Button>

              {/* Bubble Size Toggle (Accessibility for small phones) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  vibrateOnTouch();
                  setBubbleSizeScale(prev => prev === "normal" ? "large" : "normal");
                }}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={bubbleSizeScale === "normal" ? "বড় বৃত্ত মোড (Large Bubbles)" : "নরমাল বৃত্ত মোড"}
              >
                {bubbleSizeScale === "normal" ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4 text-indigo-600" />}
              </Button>

              {/* Toggle to Full Question View */}
              {onToggleViewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleViewMode}
                  className="rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold gap-1 hidden md:flex h-9"
                  title="সম্পূর্ণ ডিজিটাল প্রশ্ন দেখুন"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>প্রশ্ন দেখুন</span>
                </Button>
              )}

              {/* Desktop Submit / Proceed to CQ/SQ Button */}
              <Button
                onClick={() => onSubmit(false)}
                disabled={isSubmitting}
                className={cn(
                  "hidden sm:flex text-white font-bold rounded-xl px-4 h-9 shadow-md text-xs gap-1.5 active:scale-95 transition-all",
                  hasCqSq && activeSection === 'objective'
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/20"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20"
                )}
              >
                {hasCqSq && activeSection === 'objective' ? (
                  <>
                    <span>পরবর্তী অংশ (CQ/SQ)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>জমা দিন</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Filter Tabs for Small Phones (All / Unanswered / Answered) */}
          <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                  filterTab === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                <span>সব ({toBengaliNumerals(totalQuestions)})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("unanswered")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                  filterTab === "unanswered"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                )}
              >
                <CircleDot className="w-3 h-3" />
                <span>বাকি আছে ({toBengaliNumerals(unansweredCount)})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("answered")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                  filterTab === "answered"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                )}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>পূরণকৃত ({toBengaliNumerals(answeredCount)})</span>
              </button>
            </div>

            {/* Set Code Indicator on Mobile */}
            <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>সেট {selectedSet}</span>
            </div>
          </div>
        </div>

        {/* --- AUTHENTIC BANGLADESH OMR SHEET CONTAINER --- */}
        <div className="relative bg-[#fffdfa] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-3 sm:p-8 shadow-2xl overflow-hidden">

          {/* OMR Fiducial Corner Alignment Squares */}
          <div className="absolute top-2 left-2 w-3 h-3 sm:w-4 sm:h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 sm:w-4 sm:h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 sm:w-4 sm:h-4 bg-black dark:bg-white rounded-none"></div>

          {/* Left & Right Optical Timing Tracks (Desktop) */}
          <div className="hidden xl:flex flex-col justify-between absolute left-1.5 top-28 bottom-28 w-1 pointer-events-none opacity-30">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-black dark:bg-white mb-1.5"></div>
            ))}
          </div>
          <div className="hidden xl:flex flex-col justify-between absolute right-1.5 top-28 bottom-28 w-1 pointer-events-none opacity-30">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-black dark:bg-white mb-1.5"></div>
            ))}
          </div>

          {/* --- SHEET HEADER --- */}
          <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 sm:pb-6 mb-4 sm:mb-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <img
                  src={instituteLogo}
                  alt="Institute Logo"
                  className="h-10 sm:h-14 w-auto object-contain drop-shadow-sm"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
                <div className="text-left">
                  <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {instituteName}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
                    ডিজিটাল ওএমআর মূল্যায়ন পদ্ধতি (Optical Mark Recognition Sheet)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[10px] sm:text-xs font-mono">
                <QrCode className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  CODE: {exam.id?.slice(-8).toUpperCase() || "OMR-EXAM"}
                </span>
              </div>
            </div>

            <div className="inline-block bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 sm:px-6 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase mb-2 shadow-sm">
              বহুনির্বাচনী ওএমআর উত্তরপত্র (OMR ANSWER SHEET)
            </div>

            <h1 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5 leading-snug">
              {exam.title || exam.name || "নৈর্ব্যক্তিক মূল্যায়ন পরীক্ষা"}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {exam.className && (
                <span>শ্রেণি: <strong className="text-slate-900 dark:text-white">{exam.className}</strong></span>
              )}
              {exam.subject && (
                <span>বিষয়: <strong className="text-slate-900 dark:text-white">{exam.subject}</strong></span>
              )}
              <span>মোট প্রশ্ন: <strong className="text-slate-900 dark:text-white">{toBengaliNumerals(totalQuestions)} টি</strong></span>
              <span>মোট নম্বর: <strong className="text-slate-900 dark:text-white">{toBengaliNumerals(exam.totalMarks || totalQuestions)}</strong></span>
              {exam.duration && (
                <span>সময়: <strong className="text-slate-900 dark:text-white">{toBengaliNumerals(exam.duration)} মিনিট</strong></span>
              )}
            </div>
          </div>

          {/* --- CANDIDATE INFO & SET CODE SELECTION BAND --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-700">

            {/* Candidate Identity block */}
            <div className="space-y-1 md:border-r md:border-slate-300 dark:md:border-slate-700 md:pr-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  পরীক্ষার্থীর তথ্য (CANDIDATE INFO)
                </span>
                {/* Expandable Roll Bubbles Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRollBubbles(prev => !prev)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>{showRollBubbles ? "রোল বৃত্ত লুকান" : "রোল বৃত্ত দেখুন"}</span>
                  {showRollBubbles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {realStudentName}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                রোল নং: <span className="font-mono font-bold text-slate-900 dark:text-white">{toBengaliNumerals(realStudentRoll)}</span>
                <span className="text-[10px] text-slate-400 ml-1 font-mono">({realStudentRoll})</span>
                {realStudentReg && (
                  <span className="text-[10px] text-slate-500 block truncate">রেজি: {realStudentReg}</span>
                )}
              </div>
            </div>

            {/* SET CODE OMR BUBBLE SELECTOR (Authentic BD Board Style) */}
            <div className="space-y-1.5 md:border-r md:border-slate-300 dark:md:border-slate-700 md:px-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> প্রশ্ন সেট কোড (SET CODE)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                  সেট {selectedSet}
                </span>
              </div>

              <div className="flex items-center justify-around gap-2 pt-0.5">
                {SET_CODES.map((s) => {
                  const isSelected = selectedSet === s.code || selectedSet === s.bangla;
                  return (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => {
                        vibrateOnTouch();
                        setSelectedSet(s.code);
                        if (switchExamSet) {
                          switchExamSet(s.code);
                        }
                      }}
                      className="flex flex-col items-center gap-0.5 group focus:outline-none touch-manipulation"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 border-2",
                        isSelected
                          ? "bg-slate-950 text-white border-slate-950 shadow-md scale-110 dark:bg-white dark:text-slate-950 dark:border-white ring-2 ring-indigo-500/50"
                          : "bg-white text-slate-800 border-slate-400 hover:border-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                      )}>
                        {s.bangla}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                        {s.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruction Graphic */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 md:pl-3 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                নির্দেশাবলি (INSTRUCTIONS)
              </span>
              <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] pt-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-950 dark:bg-white flex items-center justify-center">
                    <Check className="w-2 h-2 text-white dark:text-slate-950" />
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">সঠিক</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center">
                    <X className="w-2 h-2 text-rose-500" />
                  </div>
                  <span className="text-slate-400">ভুল</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  </div>
                  <span className="text-slate-400">ভুল</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                প্রশ্নপত্র দেখে সঠিক বৃত্তটি স্পর্শ করে সম্পূর্ণ ভরাট করুন।
              </p>
            </div>
          </div>

          {/* --- EXPANDABLE ROLL NUMBER BUBBLE MATRIX (Authentic BD OMR) --- */}
          <AnimatePresence>
            {showRollBubbles && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-800 dark:border-slate-700 overflow-hidden"
              >
                <div className="text-center mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    রোল নম্বর বৃত্ত ভরাট অংশ (ROLL NUMBER OMR BUBBLE MATRIX)
                  </h4>
                  <p className="text-[10px] text-slate-500">আপনার রোল নম্বরের প্রতিটি ডিজিট নিচে ভরাট অবস্থায় প্রদর্শিত</p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                  {bubbledRoll.map((digit, colIdx) => (
                    <div key={colIdx} className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700">
                      <div className="w-7 h-8 border-2 border-slate-900 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-900 dark:text-white rounded-md mb-1 shadow-inner">
                        {toBengaliNumerals(digit)}
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 10 }).map((_, d) => {
                          const isFilled = digit === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                vibrateOnTouch();
                                setBubbledRoll(prev => {
                                  const next = [...prev];
                                  next[colIdx] = d;
                                  return next;
                                });
                              }}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border",
                                isFilled
                                  ? "bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              {toBengaliNumerals(d)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- MAIN OMR ANSWER GRIDS --- */}
          <div className="space-y-6">
            {displayedQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি</p>
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  সব প্রশ্ন দেখুন ({toBengaliNumerals(totalQuestions)})
                </button>
              </div>
            ) : (
              (() => {
                // Responsive column layout: on mobile 1 col, md 2 cols, xl 3 cols
                // Chunk questions logically for clean layout
                const columnChunk = displayedQuestions.length > 50 ? 25 : displayedQuestions.length > 25 ? 15 : 10;
                const columns = [];
                for (let i = 0; i < displayedQuestions.length; i += columnChunk) {
                  columns.push(displayedQuestions.slice(i, i + columnChunk));
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {columns.map((colQuestions, colIdx) => (
                      <div
                        key={colIdx}
                        className="bg-white dark:bg-slate-800/60 rounded-2xl border-2 border-slate-800 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col"
                      >
                        {/* Column Header */}
                        <div className="bg-slate-900 text-white dark:bg-slate-700 px-2.5 sm:px-3 py-2 flex items-center justify-between text-[11px] sm:text-xs font-bold tracking-wider">
                          <span className="w-10 sm:w-12 text-center">নং (Q)</span>
                          <div className="flex-1 flex justify-around px-1 sm:px-2">
                            <span>ক (A)</span>
                            <span>খ (B)</span>
                            <span>গ (C)</span>
                            <span>ঘ (D)</span>
                          </div>
                          <span className="w-6 text-center opacity-70 text-[9px] sm:text-[10px]">রিসেট</span>
                        </div>

                        {/* Question Rows in Column */}
                        <div className="divide-y divide-slate-200 dark:divide-slate-700/60 p-0.5 sm:p-1 flex-1">
                          {colQuestions.map((q: any) => {
                            const globalIdx = questions.indexOf(q);
                            const isAnswered = answeredStatusMap[q.id];
                            const isHighlighted = highlightedQId === q.id;

                            return (
                              <div
                                key={q.id}
                                ref={(el) => { questionRefs.current[q.id] = el; }}
                                className={cn(
                                  "transition-all duration-300",
                                  isHighlighted && "bg-indigo-100 dark:bg-indigo-950/80 ring-2 ring-indigo-500 rounded-xl"
                                )}
                              >
                                <OMRQuestionRow
                                  question={q}
                                  index={globalIdx}
                                  userAnswer={answers[q.id]}
                                  subAnswers={answers}
                                  isAnswered={isAnswered}
                                  bubbleSizeScale={bubbleSizeScale}
                                  onMCQSelect={handleMCQSelect}
                                  onMCToggle={handleMCToggle}
                                  onSMCQSelect={handleSMCQSelect}
                                  onMTFPair={handleMTFPair}
                                  onNumericInput={handleNumericInput}
                                  onCMAPartChange={handleCMAPartChange}
                                  onMPCStageChange={handleMPCStageChange}
                                  onARSelect={handleARSelect}
                                  onClearAnswer={handleClearAnswer}
                                  disabled={isSubmitting}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* --- BOTTOM CALLOUT & SUBMIT BUTTON --- */}
          <div className="mt-8 pt-4 text-center">
            {hasCqSq && activeSection === 'objective' ? (
              <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 dark:bg-slate-800/80 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 text-center space-y-3 shadow-md">
                <div className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                  <Layers className="w-3.5 h-3.5" /> পরবর্তী ধাপ: সৃজনশীল / সংক্ষিপ্ত অংশ (CQ/SQ Section)
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  নৈর্ব্যক্তিক ওএমআর অংশ সম্পন্ন করে লিখিত/সৃজনশীল অংশে প্রবেশ করুন
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  ওএমআর উত্তরপত্র জমা দিলে আপনার নৈর্ব্যক্তিক উত্তর সংরক্ষিত হবে এবং সৃজনশীল/সংক্ষিপ্ত প্রশ্ন ও উত্তর লেখার অংশে নিয়ে যাওয়া হবে।
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => onSubmit(false)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-6 text-base rounded-2xl shadow-xl shadow-indigo-500/25 border-0 transition-all active:scale-[0.98] gap-2"
                  >
                    <span>নৈর্ব্যক্তিক ওএমআর জমা দিয়ে CQ/SQ শুরু করুন</span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => onSubmit(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black py-7 text-lg rounded-2xl shadow-xl shadow-emerald-500/25 border-0 transition-all active:scale-[0.98] gap-3"
              >
                <Send className="w-5 h-5" />
                <span>পরীক্ষা ও উত্তরপত্র জমা দিন (Submit Exam)</span>
              </Button>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              উত্তরপত্র জমা দিলে আপনার ফলাফল ও অগ্রগতি সংরক্ষিত হবে।
            </p>
          </div>

          {/* --- FOOTER & SIGNATURE SECTION --- */}
          <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ডিজিটাল ওএমআর শিট স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে (Real-time Encrypted)</span>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div className="border-t border-slate-400 dark:border-slate-600 px-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase">পরীক্ষার্থীর ডিজিটাল সম্মতি</span>
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 px-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase">কন্ট্রোলার অব এগজামিনেশন</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FIXED MOBILE BOTTOM SUBMISSION & QUICK-NAV BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-300 dark:border-slate-800 px-3 py-2.5 shadow-2xl flex items-center justify-between gap-2 max-w-5xl mx-auto md:hidden">
        
        {/* Quick Grid Modal Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQuickNavModal(true)}
          className="h-10 px-3 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-bold gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        >
          <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{toBengaliNumerals(answeredCount)}/{toBengaliNumerals(totalQuestions)}</span>
        </Button>

        {/* Small Live Timer */}
        <div className="shrink-0 scale-90">
          <Timer onTimeUp={() => onSubmit(true)} />
        </div>

        {/* Full-width Mobile Submit Button */}
        <Button
          onClick={() => onSubmit(false)}
          disabled={isSubmitting}
          className={cn(
            "flex-1 font-bold h-10 rounded-xl shadow-lg text-xs gap-1.5 active:scale-95 transition-all text-white",
            hasCqSq && activeSection === 'objective'
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/20"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20"
          )}
        >
          {hasCqSq && activeSection === 'objective' ? (
            <>
              <span>পরবর্তী অংশ: CQ/SQ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>জমা দিন ({toBengaliNumerals(answeredCount)})</span>
            </>
          )}
        </Button>
      </div>

      {/* --- QUICK QUESTION JUMP DRAWER / MODAL --- */}
      <AnimatePresence>
        {showQuickNavModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    সকল প্রশ্নের তালিকা (Quick Navigator)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickNavModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold px-1 mb-3 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                  <span>পূরণকৃত ({toBengaliNumerals(answeredCount)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-slate-400 bg-white"></div>
                  <span>বাকি ({toBengaliNumerals(unansweredCount)})</span>
                </div>
              </div>

              {/* Grid of question numbers */}
              <div className="flex-1 overflow-y-auto p-1 grid grid-cols-5 sm:grid-cols-6 gap-2">
                {questions.map((q: any, i: number) => {
                  const isAnswered = answeredStatusMap[q.id];
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleJumpToQuestion(q.id)}
                      className={cn(
                        "h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all active:scale-95 border-2",
                        isAnswered
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      )}
                    >
                      <span className="font-mono">{toBengaliNumerals(i + 1)}</span>
                      <span className="text-[9px] opacity-70">({i + 1})</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-3">
                <Button
                  onClick={() => setShowQuickNavModal(false)}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-bold h-10"
                >
                  বন্ধ করুন
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- INDIVIDUAL OMR QUESTION ROW (OPTIMIZED WITH REACT.MEMO) ---
interface OMRQuestionRowProps {
  question: any;
  index: number;
  userAnswer: any;
  subAnswers: any;
  isAnswered: boolean;
  bubbleSizeScale: "normal" | "large";
  onMCQSelect: (qId: string, label: string, idx: number) => void;
  onMCToggle: (qId: string, optIdx: number) => void;
  onSMCQSelect: (qId: string, subIdx: number, label: string) => void;
  onMTFPair: (qId: string, leftKey: string, rightVal: string) => void;
  onNumericInput: (qId: string, val: string) => void;
  onCMAPartChange: (qId: string, partId: string, val: string) => void;
  onMPCStageChange: (qId: string, stageId: string, val: string) => void;
  onARSelect: (qId: string, optNum: number) => void;
  onClearAnswer: (q: any) => void;
  disabled: boolean;
}

const OMRQuestionRow: React.FC<OMRQuestionRowProps> = memo(({
  question,
  index,
  userAnswer,
  subAnswers,
  isAnswered,
  bubbleSizeScale,
  onMCQSelect,
  onMCToggle,
  onSMCQSelect,
  onMTFPair,
  onNumericInput,
  onCMAPartChange,
  onMPCStageChange,
  onARSelect,
  onClearAnswer,
  disabled
}) => {
  const qId = question.id;
  let type = (question.type || question.questionType || "").toLowerCase();
  if (type === "constructed_multi_answer" || type === "constructed-multi-answer") type = "cma";
  if (type === "multi_step_chain" || type === "multi-step-chain" || type === "multi_step_problem_chain") type = "mpc";

  // Options count (default 4)
  const optionsCount = question.options?.length || 4;

  // 1. STANDARD MCQ
  if (type === "mcq" || !type || type === "single") {
    return (
      <div className={cn(
        "flex items-center justify-between py-1.5 sm:py-2 px-1.5 sm:px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group rounded-xl",
        isAnswered && "bg-indigo-50/20 dark:bg-indigo-950/10"
      )}>
        {/* Question Number */}
        <div className="w-10 sm:w-12 font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200 text-center flex flex-col items-center shrink-0">
          <span>{toBengaliNumerals(index + 1)}</span>
          <span className="text-[9px] font-mono text-slate-400">({index + 1})</span>
        </div>

        {/* 4 or 5 OMR Bubbles */}
        <div className="flex-1 flex justify-around items-center px-0.5 sm:px-1">
          {Array.from({ length: Math.min(optionsCount, 5) }).map((_, optIdx) => {
            const rawOpt = question.options?.[optIdx];
            const label = typeof rawOpt === "object" && rawOpt !== null
              ? (rawOpt.text || String(rawOpt))
              : (rawOpt !== undefined ? String(rawOpt) : OMR_BENGALI_OPTIONS[optIdx] || String(optIdx + 1));

            const isSelected = typeof userAnswer === "object" && userAnswer !== null
              ? (userAnswer.selectedOption === label || userAnswer.text === label)
              : String(userAnswer || "").trim() === label.trim();

            const banglaLabel = OMR_BENGALI_OPTIONS[optIdx] || String(optIdx + 1);
            const englishLabel = OMR_ENGLISH_OPTIONS[optIdx] || String.fromCharCode(65 + optIdx);

            return (
              <OMRBubble
                key={optIdx}
                label={banglaLabel}
                subLabel={englishLabel}
                isSelected={isSelected}
                onClick={() => onMCQSelect(qId, label, optIdx)}
                disabled={disabled}
                isLarge={bubbleSizeScale === "large"}
              />
            );
          })}
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={() => onClearAnswer(question)}
          disabled={disabled || !userAnswer}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0",
            !userAnswer && "opacity-0 pointer-events-none"
          )}
          title="উত্তর মুছুন"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // 2. MULTIPLE CORRECT (MC)
  if (type === "mc") {
    const selectedList: number[] = userAnswer?.selectedOptions || [];
    return (
      <div className="py-2 px-1.5 sm:px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors rounded-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              {toBengaliNumerals(index + 1)}. ({index + 1})
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300">
              বহুপদী (Multi)
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || selectedList.length === 0}
            className={cn("text-[10px] text-rose-500 hover:underline", selectedList.length === 0 && "opacity-0")}
          >
            Clear
          </button>
        </div>

        <div className="flex justify-around items-center px-1">
          {Array.from({ length: Math.min(optionsCount, 5) }).map((_, optIdx) => {
            const isSelected = selectedList.includes(optIdx);
            return (
              <OMRBubble
                key={optIdx}
                label={OM_BENGALI_LABEL(optIdx)}
                subLabel={OMR_ENGLISH_OPTIONS[optIdx]}
                isSelected={isSelected}
                onClick={() => onMCToggle(qId, optIdx)}
                disabled={disabled}
                isSquare
                isLarge={bubbleSizeScale === "large"}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 3. SUB-MCQ (SMCQ)
  if (type === "smcq") {
    const subQs = question.subQuestions || [];
    return (
      <div className="py-2 px-1.5 sm:px-2 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl my-1 border border-indigo-100 dark:border-indigo-900/30 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-black text-[11px] sm:text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
            <Layers className="w-3 h-3" /> প্রশ্ন {toBengaliNumerals(index + 1)} (উদ্দীপকভিত্তিক SMCQ)
          </span>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled}
            className="text-[10px] text-rose-500 hover:underline"
          >
            Clear All
          </button>
        </div>

        {subQs.map((subQ: any, subIdx: number) => {
          const subAnswer = subAnswers[`${qId}_sub_${subIdx}`];
          const subOptCount = subQ.options?.length || 4;

          return (
            <div key={subIdx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-8 sm:w-10 text-center font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 shrink-0">
                {toBengaliNumerals(index + 1)}.{toBengaliNumerals(subIdx + 1)}
              </div>
              <div className="flex-1 flex justify-around items-center px-0.5">
                {Array.from({ length: Math.min(subOptCount, 4) }).map((_, oi) => {
                  const rawOpt = subQ.options?.[oi];
                  const label = typeof rawOpt === "object" && rawOpt !== null
                    ? (rawOpt.text || String(rawOpt))
                    : (rawOpt !== undefined ? String(rawOpt) : OMR_BENGALI_OPTIONS[oi] || String(oi + 1));

                  const isSelected = String(subAnswer || "").trim() === label.trim();

                  return (
                    <OMRBubble
                      key={oi}
                      label={OMR_BENGALI_OPTIONS[oi]}
                      subLabel={OMR_ENGLISH_OPTIONS[oi]}
                      isSelected={isSelected}
                      onClick={() => onSMCQSelect(qId, subIdx, label)}
                      disabled={disabled}
                      isLarge={bubbleSizeScale === "large"}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. MATCH THE FOLLOWING (MTF)
  if (type === "mtf") {
    const leftCol = question.leftColumn || [
      { id: "i", text: "i" },
      { id: "ii", text: "ii" },
      { id: "iii", text: "iii" },
      { id: "iv", text: "iv" },
    ];
    const rightCol = question.rightColumn || [
      { id: "p", text: "p" },
      { id: "q", text: "q" },
      { id: "r", text: "r" },
      { id: "s", text: "s" },
    ];
    const matches = userAnswer || {};

    return (
      <div className="py-2 px-1.5 sm:px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-black text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
            প্রশ্ন {toBengaliNumerals(index + 1)}: মিলকরণ (MTF Matrix)
          </span>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || Object.keys(matches).length === 0}
            className="text-[10px] text-rose-500 hover:underline"
          >
            Clear
          </button>
        </div>

        <div className="space-y-1">
          {leftCol.map((lc: any, li: number) => {
            const lKey = typeof lc === "string" ? lc : (lc.id || String(li));
            const currentMatch = matches[lKey];

            return (
              <div key={lKey} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="w-6 sm:w-8 font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 text-center font-mono shrink-0">
                  ({lKey})
                </span>
                <div className="flex-1 flex justify-around items-center px-1">
                  {rightCol.map((rc: any, ri: number) => {
                    const rVal = typeof rc === "string" ? rc : (rc.id || String(ri));
                    const isSelected = currentMatch === rVal;

                    return (
                      <button
                        key={rVal}
                        type="button"
                        onClick={() => onMTFPair(qId, lKey, rVal)}
                        disabled={disabled}
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold border transition-all touch-manipulation",
                          isSelected
                            ? "bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 shadow"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                        )}
                      >
                        <span>{rVal}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. INTEGER / NUMERICAL (INT)
  if (type === "int" || type === "numeric") {
    const rawVal = typeof userAnswer === "object" && userAnswer !== null ? (userAnswer.answer ?? "") : (userAnswer ?? "");
    return (
      <div className="py-2 px-1.5 sm:px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-black text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
            প্রশ্ন {toBengaliNumerals(index + 1)}: সংখ্যাগত মান (Numeric OMR)
          </span>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || !rawVal}
            className="text-[10px] text-rose-500 hover:underline"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rawVal}
            onChange={(e) => onNumericInput(qId, e.target.value)}
            disabled={disabled}
            placeholder="সংখ্যা লিখুন (যেমন: 42, 3.14)"
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>
    );
  }

  // 6. ASSERTION-REASON (AR)
  if (type === "ar") {
    const selectedOpt = typeof userAnswer === "object" ? userAnswer?.selectedOption : Number(userAnswer);
    return (
      <div className="py-2 px-1.5 sm:px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors rounded-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              {toBengaliNumerals(index + 1)}. ({index + 1})
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300">
              Assertion-Reason
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || !selectedOpt}
            className={cn("text-[10px] text-rose-500 hover:underline", !selectedOpt && "opacity-0")}
          >
            Clear
          </button>
        </div>

        <div className="flex justify-around items-center px-1">
          {[1, 2, 3, 4, 5].map((optNum) => {
            const isSelected = selectedOpt === optNum;
            return (
              <OMRBubble
                key={optNum}
                label={toBengaliNumerals(optNum)}
                subLabel={String(optNum)}
                isSelected={isSelected}
                onClick={() => onARSelect(qId, optNum)}
                disabled={disabled}
                isLarge={bubbleSizeScale === "large"}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 7. CMA (Constructed Multi-Answer with sub-questions / parts)
  if (type === "cma") {
    const currentVal = typeof userAnswer === "string" ? (() => { try { return JSON.parse(userAnswer); } catch { return {}; } })() : (userAnswer || {});
    let rawParts = question.parts || question.cmaParts || question.subQuestions || question.sub_questions || [];
    if (typeof rawParts === "string") {
      try { rawParts = JSON.parse(rawParts); } catch { rawParts = []; }
    }
    const parts: any[] = Array.isArray(rawParts) && rawParts.length > 0
      ? rawParts
      : [{ id: "part_0", label: "Part 1" }, { id: "part_1", label: "Part 2" }];

    return (
      <div className="py-2.5 px-2 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl my-1.5 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
              প্রশ্ন {toBengaliNumerals(index + 1)}: বহুস্তরীয় উত্তর (CMA Parts)
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
              {toBengaliNumerals(parts.length)} টি অংশ
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || Object.keys(currentVal).length === 0}
            className={cn("text-[10px] text-rose-500 hover:underline", Object.keys(currentVal).length === 0 && "opacity-0")}
          >
            Clear All
          </button>
        </div>

        <div className="space-y-1.5">
          {parts.map((part: any, pIdx: number) => {
            const partId = part.id || part.key || part.name || `part_${pIdx}`;
            const partLabel = part.label || part.prompt || part.text || `অংশ ${toBengaliAlphabets(pIdx)} (${pIdx + 1})`;
            const partVal = currentVal[partId] ?? currentVal[part.label] ?? currentVal[`part_${pIdx}`] ?? currentVal[pIdx] ?? "";
            const hasOptions = Array.isArray(part.options) && part.options.length > 0;

            return (
              <div key={partId} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                      {pIdx + 1}
                    </span>
                    <span>{partLabel}</span>
                  </span>
                  {partVal && (
                    <button
                      type="button"
                      onClick={() => onCMAPartChange(qId, partId, "")}
                      disabled={disabled}
                      className="text-[9px] text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {hasOptions ? (
                  <div className="flex justify-around items-center px-1 pt-1">
                    {part.options.slice(0, 4).map((opt: any, optIdx: number) => {
                      const optLabel = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                      const isSelected = String(partVal).trim() === optLabel.trim() || String(partVal).trim() === String(optIdx);

                      return (
                        <OMRBubble
                          key={optIdx}
                          label={OMR_BENGALI_OPTIONS[optIdx]}
                          subLabel={OMR_ENGLISH_OPTIONS[optIdx]}
                          isSelected={isSelected}
                          onClick={() => onCMAPartChange(qId, partId, optLabel)}
                          disabled={disabled}
                          isLarge={bubbleSizeScale === "large"}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={partVal}
                    onChange={(e) => onCMAPartChange(qId, partId, e.target.value)}
                    disabled={disabled}
                    placeholder={`অংশ ${pIdx + 1} এর উত্তর লিখুন...`}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 8. MPC (Multi-step Problem Chain with stages / sub-questions)
  if (type === "mpc") {
    const currentVal = typeof userAnswer === "string" ? (() => { try { return JSON.parse(userAnswer); } catch { return {}; } })() : (userAnswer || {});
    let rawStages = question.stages || question.mpcStages || question.subQuestions || question.sub_questions || [];
    if (typeof rawStages === "string") {
      try { rawStages = JSON.parse(rawStages); } catch { rawStages = []; }
    }
    const stages: any[] = Array.isArray(rawStages) && rawStages.length > 0
      ? rawStages
      : [{ id: "stage_0", stageTitle: "Stage 1" }, { id: "stage_1", stageTitle: "Stage 2" }];

    return (
      <div className="py-2.5 px-2 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl my-1.5 border border-purple-100 dark:border-purple-900/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs sm:text-sm text-purple-950 dark:text-purple-200">
              প্রশ্ন {toBengaliNumerals(index + 1)}: বহুস্তরীয় সমস্যা (MPC Stages)
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
              {toBengaliNumerals(stages.length)} টি ধাপ
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled || Object.keys(currentVal).length === 0}
            className={cn("text-[10px] text-rose-500 hover:underline", Object.keys(currentVal).length === 0 && "opacity-0")}
          >
            Clear All
          </button>
        </div>

        <div className="space-y-1.5">
          {stages.map((stage: any, sIdx: number) => {
            const stageId = stage.id || stage.key || stage.name || `stage_${sIdx}`;
            const stageTitle = stage.stageTitle || stage.prompt || stage.text || `ধাপ ${toBengaliNumerals(sIdx + 1)}`;
            const stageVal = currentVal[stageId] ?? currentVal[stage.stageTitle] ?? currentVal[`stage_${sIdx}`] ?? currentVal[sIdx] ?? "";
            const hasOptions = Array.isArray(stage.options) && stage.options.length > 0;

            return (
              <div key={stageId} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold">
                      {sIdx + 1}
                    </span>
                    <span>{stageTitle}</span>
                  </span>
                  {stageVal && (
                    <button
                      type="button"
                      onClick={() => onMPCStageChange(qId, stageId, "")}
                      disabled={disabled}
                      className="text-[9px] text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {hasOptions ? (
                  <div className="flex justify-around items-center px-1 pt-1">
                    {stage.options.slice(0, 4).map((opt: any, optIdx: number) => {
                      const optLabel = typeof opt === "object" && opt !== null ? (opt.text || String(opt)) : String(opt);
                      const isSelected = String(stageVal).trim() === optLabel.trim() || String(stageVal).trim() === String(optIdx);

                      return (
                        <OMRBubble
                          key={optIdx}
                          label={OMR_BENGALI_OPTIONS[optIdx]}
                          subLabel={OMR_ENGLISH_OPTIONS[optIdx]}
                          isSelected={isSelected}
                          onClick={() => onMPCStageChange(qId, stageId, optLabel)}
                          disabled={disabled}
                          isLarge={bubbleSizeScale === "large"}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={stageVal}
                    onChange={(e) => onMPCStageChange(qId, stageId, e.target.value)}
                    disabled={disabled}
                    placeholder={`ধাপ ${sIdx + 1} এর মান বা উত্তর লিখুন...`}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback default
  return null;
});

OMRQuestionRow.displayName = "OMRQuestionRow";

// --- REUSABLE AUTHENTIC OMR BUBBLE (ERGONOMIC TOUCH TARGET FOR PHONES) ---
const OMRBubble: React.FC<{
  label: string;
  subLabel?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isSquare?: boolean;
  isLarge?: boolean;
}> = memo(({ label, subLabel, isSelected, onClick, disabled, isSquare = false, isLarge = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center p-0.5 sm:p-1 group focus:outline-none touch-manipulation active:scale-95 transition-transform"
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-150 relative select-none",
          isLarge
            ? "w-9 h-9 sm:w-11 sm:h-11 text-sm sm:text-base font-black"
            : "w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-black",
          isSquare ? "rounded-lg" : "rounded-full",
          isSelected
            ? "bg-slate-950 text-white border-2 border-slate-950 shadow-md scale-105 dark:bg-white dark:text-slate-950 dark:border-white ring-2 ring-indigo-500/40"
            : "bg-white text-slate-800 border-2 border-slate-400 group-hover:border-slate-800 group-hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:group-hover:border-slate-400"
        )}
      >
        {/* Authentic dark graphite fill appearance */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10 pointer-events-none" />
        )}
        <span className="leading-none">{label}</span>
      </div>
      {subLabel && (
        <span className="text-[8px] sm:text-[9px] font-mono font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 mt-0.5">
          {subLabel}
        </span>
      )}
    </button>
  );
});

OMRBubble.displayName = "OMRBubble";

function OM_BENGALI_LABEL(idx: number) {
  return OMR_BENGALI_OPTIONS[idx] || String(idx + 1);
}

export default OMRExamSheet;
