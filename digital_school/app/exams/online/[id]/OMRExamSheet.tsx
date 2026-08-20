"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
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
  Layers
} from "lucide-react";
import { useExamContext } from "./ExamContext";
import { toBengaliNumerals, toBengaliAlphabets } from "@/utils/numeralConverter";
import { cn } from "@/lib/utils";
import Timer from "./Timer";

const OMR_BENGALI_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
const OMR_ENGLISH_OPTIONS = ["A", "B", "C", "D", "E", "F"];
const SET_CODES = [
  { code: "A", bangla: "ক", name: "Set A (সেট ক)" },
  { code: "B", bangla: "খ", name: "Set B (সেট খ)" },
  { code: "C", bangla: "গ", name: "Set C (সেট গ)" },
  { code: "D", bangla: "ঘ", name: "Set D (সেট ঘ)" },
];

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
    activeSection,
    hasCqSq,
  } = useExamContext();

  const questions = sortedQuestions || [];
  const totalQuestions = questions.length;

  // Selected Set Code on OMR sheet
  const [selectedSet, setSelectedSet] = useState<string>(() => {
    return exam.setName || exam.examSet?.name || "A";
  });

  // Calculate answered count
  const answeredCount = useMemo(() => {
    let count = 0;
    questions.forEach((q: any) => {
      const type = (q.type || q.questionType || "").toLowerCase();
      const ans = answers[q.id];

      if (type === "smcq") {
        const subQs = q.subQuestions || [];
        const anySub = subQs.some((_: any, idx: number) => !!answers[`${q.id}_sub_${idx}`]);
        if (anySub) count++;
      } else if (type === "cq" || type === "sq") {
        if (type === "sq" && ans && ans !== "No answer provided") count++;
        else if (type === "cq") {
          const subQs = q.subQuestions || q.sub_questions || [];
          const anySub = subQs.some((_: any, idx: number) => !!answers[`${q.id}_sub_${idx}`]);
          if (anySub) count++;
        }
      } else if (type === "mc") {
        if (ans?.selectedOptions && ans.selectedOptions.length > 0) count++;
      } else if (type === "mtf") {
        if (ans && Object.keys(ans).length > 0) count++;
      } else if (ans !== undefined && ans !== null && ans !== "" && ans !== "No answer provided") {
        count++;
      }
    });
    return count;
  }, [questions, answers]);

  // Handle single MCQ Bubble Select
  const handleMCQSelect = useCallback((qId: string, optionLabel: string, optionIndex: number) => {
    if (isSubmitting) return;
    setAnswers((prev: any) => {
      const current = prev[qId];
      // If tapping same option, unselect or switch
      const currentStr = typeof current === "object" ? current?.selectedOption || current?.text : String(current || "");
      if (currentStr.trim() === optionLabel.trim()) {
        const updated = { ...prev };
        delete updated[qId];
        return updated;
      }
      return { ...prev, [qId]: optionLabel };
    });
  }, [isSubmitting, setAnswers]);

  // Handle Multiple Correct (MC) Toggle
  const handleMCToggle = useCallback((qId: string, optIndex: number) => {
    if (isSubmitting) return;
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
  }, [isSubmitting, setAnswers]);

  // Handle SMCQ Sub-Question select
  const handleSMCQSelect = useCallback((qId: string, subIdx: number, optionLabel: string) => {
    if (isSubmitting) return;
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
  }, [isSubmitting, setAnswers]);

  // Handle MTF Pair Select
  const handleMTFPair = useCallback((qId: string, leftKey: string, rightVal: string) => {
    if (isSubmitting) return;
    setAnswers((prev: any) => {
      const currentMap = prev[qId] || {};
      if (currentMap[leftKey] === rightVal) {
        const nextMap = { ...currentMap };
        delete nextMap[leftKey];
        return { ...prev, [qId]: nextMap };
      }
      return { ...prev, [qId]: { ...currentMap, [leftKey]: rightVal } };
    });
  }, [isSubmitting, setAnswers]);

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

  // Handle Assertion-Reason select
  const handleARSelect = useCallback((qId: string, optionNumber: number) => {
    if (isSubmitting) return;
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
  }, [isSubmitting, setAnswers]);

  // Clear a specific question's answer
  const handleClearAnswer = useCallback((q: any) => {
    if (isSubmitting) return;
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
  }, [isSubmitting, setAnswers]);

  return (
    <div className="w-full min-h-screen bg-slate-100/80 dark:bg-slate-950 py-4 sm:py-8 px-2 sm:px-4 md:px-6 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- STICKY OMR CONTROL & TIMER BAR --- */}
        <div className="sticky top-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 shadow-xl rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  OMR উত্তরপত্র (Physical OMR Mode)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                পূরণকৃত: <span className="font-bold text-indigo-600 dark:text-indigo-400">{answeredCount}</span> / {totalQuestions} টি প্রশ্ন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="scale-90 sm:scale-100">
              <Timer onTimeUp={() => onSubmit(true)} />
            </div>

            {onToggleViewMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleViewMode}
                className="rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold gap-1.5 hidden md:flex"
                title="সম্পূর্ণ ডিজিটাল প্রশ্ন দেখুন"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>প্রশ্ন দেখুন (Full View)</span>
              </Button>
            )}

            <Button
              onClick={() => onSubmit(false)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl px-4 sm:px-6 h-10 shadow-lg shadow-emerald-600/20 text-xs sm:text-sm gap-2 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>উত্তরপত্র জমা দিন (Submit)</span>
            </Button>
          </div>
        </div>

        {/* --- AUTHENTIC BANGLADESH OMR SHEET CONTAINER --- */}
        <div className="relative bg-[#fffdfa] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-3xl p-4 sm:p-8 md:p-10 shadow-2xl overflow-hidden">

          {/* OMR Fiducial Corner Alignment Squares (Optical Tracking Simulation) */}
          <div className="absolute top-3 left-3 w-4 h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute top-3 right-3 w-4 h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 bg-black dark:bg-white rounded-none"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 bg-black dark:bg-white rounded-none"></div>

          {/* Left & Right Optical Timing Tracks (Black sync bars like real OMR sheets) */}
          <div className="hidden lg:flex flex-col justify-between absolute left-2 top-24 bottom-24 w-1.5 pointer-events-none opacity-40">
            {Array.from({ length: 45 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-black dark:bg-white mb-1.5"></div>
            ))}
          </div>
          <div className="hidden lg:flex flex-col justify-between absolute right-2 top-24 bottom-24 w-1.5 pointer-events-none opacity-40">
            {Array.from({ length: 45 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-black dark:bg-white mb-1.5"></div>
            ))}
          </div>

          {/* --- SHEET HEADER --- */}
          <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-6 mb-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={instituteLogo}
                  alt="Institute Logo"
                  className="h-14 w-auto object-contain drop-shadow-sm"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
                <div className="text-left">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {instituteName}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    ডিজিটাল মূল্যায়ন ও ওএমআর পরীক্ষণ পদ্ধতি
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono">
                <QrCode className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  CODE: {exam.id?.slice(-8).toUpperCase() || "OMR-EXAM"}
                </span>
              </div>
            </div>

            <div className="inline-block bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-6 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase mb-3 shadow-md">
              বহুনির্বাচনী ওএমআর উত্তরপত্র (OMR ANSWER SHEET)
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              {exam.title || exam.name || "নৈর্ব্যক্তিক পরীক্ষা"}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700">

            {/* Candidate Identity block */}
            <div className="space-y-1 md:border-r md:border-slate-300 dark:md:border-slate-700 md:pr-4">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                পরীক্ষার্থীর তথ্য (CANDIDATE INFO)
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {exam.studentName || "নিয়মিত পরীক্ষার্থী (Student)"}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                রোল নং: <span className="font-mono font-bold text-slate-900 dark:text-white">{exam.studentRoll || "001"}</span>
              </div>
            </div>

            {/* SET CODE OMR BUBBLE SELECTOR (Authentic BD Board Style) */}
            <div className="space-y-2 md:border-r md:border-slate-300 dark:md:border-slate-700 md:px-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> প্রশ্ন সেট কোড (SET CODE)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                  সেট {selectedSet}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {SET_CODES.map((s) => {
                  const isSelected = selectedSet === s.code || selectedSet === s.bangla;
                  return (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => setSelectedSet(s.code)}
                      className="flex flex-col items-center gap-1 group focus:outline-none"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 border-2",
                        isSelected
                          ? "bg-slate-950 text-white border-slate-950 shadow-md scale-110 dark:bg-white dark:text-slate-950 dark:border-white ring-2 ring-indigo-500/50"
                          : "bg-white text-slate-800 border-slate-400 hover:border-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                      )}>
                        {s.bangla}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {s.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruction Graphic */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 md:pl-4 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                নির্দেশাবলি (INSTRUCTIONS)
              </span>
              <div className="flex items-center gap-3 text-[11px] pt-1">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-slate-950 dark:bg-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white dark:text-slate-950" />
                  </div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">সঠিক</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-rose-500" />
                  </div>
                  <span className="text-slate-400">ভুল</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  </div>
                  <span className="text-slate-400">ভুল</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 leading-tight">
                প্রশ্নপত্র দেখে সঠিক বৃত্তটি স্পর্শ করে সম্পূর্ণ ভরাট করুন।
              </p>
            </div>
          </div>

          {/* --- MAIN OMR ANSWER GRIDS --- */}
          <div className="space-y-8">
            {(() => {
              // Group questions into columns (e.g. 20-25 questions per column)
              const chunkSize = questions.length > 50 ? 25 : questions.length > 25 ? 15 : 10;
              const columns = [];
              for (let i = 0; i < questions.length; i += chunkSize) {
                columns.push(questions.slice(i, i + chunkSize));
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {columns.map((columnQuestions, colIdx) => (
                    <div
                      key={colIdx}
                      className="bg-white dark:bg-slate-800/60 rounded-2xl border-2 border-slate-800 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col"
                    >
                      {/* Column Header */}
                      <div className="bg-slate-900 text-white dark:bg-slate-700 px-3 py-2 flex items-center justify-between text-xs font-bold tracking-wider">
                        <span className="w-12 text-center">নং (Q)</span>
                        <div className="flex-1 flex justify-around px-2">
                          <span>ক (A)</span>
                          <span>খ (B)</span>
                          <span>গ (C)</span>
                          <span>ঘ (D)</span>
                        </div>
                        <span className="w-6 text-center opacity-70 text-[10px]">রিসেট</span>
                      </div>

                      {/* Question Rows in Column */}
                      <div className="divide-y divide-slate-200 dark:divide-slate-700/60 p-1 flex-1">
                        {columnQuestions.map((q: any) => {
                          const globalIdx = questions.indexOf(q);
                          const qType = (q.type || q.questionType || "").toLowerCase();

                          return (
                            <OMRQuestionRow
                              key={q.id}
                              question={q}
                              index={globalIdx}
                              answers={answers}
                              onMCQSelect={handleMCQSelect}
                              onMCToggle={handleMCToggle}
                              onSMCQSelect={handleSMCQSelect}
                              onMTFPair={handleMTFPair}
                              onNumericInput={handleNumericInput}
                              onARSelect={handleARSelect}
                              onClearAnswer={handleClearAnswer}
                              disabled={isSubmitting}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* --- FOOTER & SIGNATURE SECTION --- */}
          <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ডিজিটাল ওএমআর শিট স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে (Real-time Encrypted State)</span>
            </div>

            <div className="flex items-center gap-8 text-center">
              <div className="border-t border-slate-400 dark:border-slate-600 px-4 pt-1">
                <span className="text-[10px] font-bold uppercase">পরীক্ষার্থীর ডিজিটাল সম্মতি</span>
              </div>
              <div className="border-t border-slate-400 dark:border-slate-600 px-4 pt-1">
                <span className="text-[10px] font-bold uppercase">কন্ট্রোলার অব এগজামিনেশন</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Submit Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => onSubmit(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black py-7 text-lg rounded-2xl shadow-xl shadow-emerald-500/25 border-0 transition-all active:scale-[0.98] gap-3"
            >
              <Send className="w-5 h-5" />
              <span>পরীক্ষা ও উত্তরপত্র জমা দিন (Submit Exam)</span>
            </Button>
            <p className="text-[11px] text-slate-400 mt-2">
              উত্তরপত্র জমা দিলে আপনার ফলাফল তাৎক্ষণিকভাবে মূল্যায়িত হবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- INDIVIDUAL OMR QUESTION ROW ---
interface OMRQuestionRowProps {
  question: any;
  index: number;
  answers: any;
  onMCQSelect: (qId: string, label: string, idx: number) => void;
  onMCToggle: (qId: string, optIdx: number) => void;
  onSMCQSelect: (qId: string, subIdx: number, label: string) => void;
  onMTFPair: (qId: string, leftKey: string, rightVal: string) => void;
  onNumericInput: (qId: string, val: string) => void;
  onARSelect: (qId: string, optNum: number) => void;
  onClearAnswer: (q: any) => void;
  disabled: boolean;
}

const OMRQuestionRow: React.FC<OMRQuestionRowProps> = memo(({
  question,
  index,
  answers,
  onMCQSelect,
  onMCToggle,
  onSMCQSelect,
  onMTFPair,
  onNumericInput,
  onARSelect,
  onClearAnswer,
  disabled
}) => {
  const qId = question.id;
  let type = (question.type || question.questionType || "").toLowerCase();
  if (type === "constructed_multi_answer" || type === "constructed-multi-answer") type = "cma";
  if (type === "multi_step_chain" || type === "multi-step-chain" || type === "multi_step_problem_chain") type = "mpc";

  const userAnswer = answers[qId];

  // Options count (default 4)
  const optionsCount = question.options?.length || 4;
  const optionsLabels = question.options || ["ক", "খ", "গ", "ঘ"];

  // 1. STANDARD MCQ
  if (type === "mcq" || !type || type === "single") {
    return (
      <div className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
        {/* Question Number */}
        <div className="w-12 font-black text-sm text-slate-800 dark:text-slate-200 text-center flex flex-col items-center">
          <span>{toBengaliNumerals(index + 1)}</span>
          <span className="text-[9px] font-mono text-slate-400">({index + 1})</span>
        </div>

        {/* 4 or 5 OMR Bubbles */}
        <div className="flex-1 flex justify-around items-center px-1">
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
            "w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all",
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
      <div className="py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-800 dark:text-slate-200">
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
      <div className="py-2 px-2 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl my-1 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
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
          const subAnswer = answers[`${qId}_sub_${subIdx}`];
          const subOptCount = subQ.options?.length || 4;

          return (
            <div key={subIdx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 text-center font-bold text-xs text-slate-700 dark:text-slate-300">
                {toBengaliNumerals(index + 1)}.{toBengaliNumerals(subIdx + 1)}
              </div>
              <div className="flex-1 flex justify-around items-center px-1">
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
      <div className="py-2.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-slate-800 dark:text-slate-200">
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

        <div className="space-y-1.5">
          {leftCol.map((lc: any, li: number) => {
            const lKey = typeof lc === "string" ? lc : (lc.id || String(li));
            const currentMatch = matches[lKey];

            return (
              <div key={lKey} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="w-8 font-bold text-xs text-slate-700 dark:text-slate-300 text-center font-mono">
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
                          "w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-bold border transition-all",
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
      <div className="py-2.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-slate-800 dark:text-slate-200">
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

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={rawVal}
            onChange={(e) => onNumericInput(qId, e.target.value)}
            disabled={disabled}
            placeholder="উত্তর লিখুন (যেমন: 42, 3.14, -5)"
            className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>
    );
  }

  // 6. ASSERTION-REASON (AR)
  if (type === "ar") {
    const selectedOpt = typeof userAnswer === "object" ? userAnswer?.selectedOption : Number(userAnswer);
    return (
      <div className="py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-800 dark:text-slate-200">
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
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 7. CMA / MPC (Constructed / Multi-part)
  if (type === "cma" || type === "mpc") {
    const currentVal = typeof userAnswer === "string" ? (() => { try { return JSON.parse(userAnswer); } catch { return {}; } })() : (userAnswer || {});
    return (
      <div className="py-2.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl my-1 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-slate-800 dark:text-slate-200">
            প্রশ্ন {toBengaliNumerals(index + 1)}: বহুস্তরীয় কাঠামো ({type.toUpperCase()})
          </span>
          <button
            type="button"
            onClick={() => onClearAnswer(question)}
            disabled={disabled}
            className="text-[10px] text-rose-500 hover:underline"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["A", "B", "C", "D"].map((part) => {
            const isSelected = currentVal[part] || currentVal[part.toLowerCase()];
            return (
              <button
                key={part}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  const nextVal = { ...currentVal, [part]: !isSelected };
                  onNumericInput(qId, JSON.stringify(nextVal));
                }}
                className={cn(
                  "p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all",
                  isSelected
                    ? "bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                )}
              >
                <span>অংশ {part}</span>
                <span className={cn("w-4 h-4 rounded-full border flex items-center justify-center text-[10px]", isSelected ? "bg-white text-black dark:bg-black dark:text-white" : "")}>
                  {isSelected ? "✓" : ""}
                </span>
              </button>
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

// --- REUSABLE AUTHENTIC OMR BUBBLE ---
const OMRBubble: React.FC<{
  label: string;
  subLabel?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isSquare?: boolean;
}> = memo(({ label, subLabel, isSelected, onClick, disabled, isSquare = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center p-1 group focus:outline-none"
    >
      <div
        className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 flex flex-col items-center justify-center transition-all duration-150 relative select-none",
          isSquare ? "rounded-lg" : "rounded-full",
          isSelected
            ? "bg-slate-950 text-white border-2 border-slate-950 shadow-md scale-105 dark:bg-white dark:text-slate-950 dark:border-white ring-2 ring-indigo-500/40"
            : "bg-white text-slate-800 border-2 border-slate-400 group-hover:border-slate-800 group-hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:group-hover:border-slate-400"
        )}
      >
        {/* Authentic dark graphite / ink ripple fill appearance */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10 pointer-events-none" />
        )}
        <span className="text-xs sm:text-sm font-black leading-none">{label}</span>
      </div>
      {subLabel && (
        <span className="text-[9px] font-mono font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 mt-0.5">
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
