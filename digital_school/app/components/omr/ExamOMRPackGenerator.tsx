"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  FileText,
  ScanLine,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { BangladeshOMRGenerator, type PresetType } from './BangladeshOMRGenerator';

interface ExamSetInfo {
  id: string;
  name: string;
  questionsJson?: any[];
}

interface ExamDetailForOMR {
  id: string;
  name: string;
  totalMarks?: number;
  duration?: number;
  subject?: string;
  examSets?: ExamSetInfo[];
  questions?: any[];
}

interface ExamOMRPackGeneratorProps {
  examId: string;
  onBack?: () => void;
}

export function ExamOMRPackGenerator({ examId, onBack }: ExamOMRPackGeneratorProps) {
  const [exam, setExam] = useState<ExamDetailForOMR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'mcq_sets' | 'cq_cover'>('mcq_sets');
  const [selectedSetIdx, setSelectedSetIdx] = useState<number>(0);

  useEffect(() => {
    let active = true;
    async function loadExam() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/exams/${examId}?mode=omr`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const examObj = json?.exam || json?.data || json;
        if (active) setExam(examObj);
      } catch (err: any) {
        if (active) setError(err?.message || 'পরীক্ষার তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadExam();
    return () => {
      active = false;
    };
  }, [examId]);

  const analysis = useMemo(() => {
    const sets: ExamSetInfo[] =
      exam?.examSets && exam.examSets.length > 0
        ? exam.examSets
        : [{ id: 'SET_A', name: 'Set A', questionsJson: exam?.questions || [] }];

    const sampleQs = Array.isArray(sets[0]?.questionsJson)
      ? sets[0].questionsJson!
      : Array.isArray(exam?.questions)
      ? exam!.questions!
      : [];

    let mcqCount = 0;
    let cqCount = 0;
    let sqCount = 0;
    let maxOptions = 4;

    sampleQs.forEach((q: any) => {
      const t = String(q?.type || 'MCQ').toUpperCase();
      if (t === 'CQ' || t === 'DESCRIPTIVE') cqCount++;
      else if (t === 'SQ' || t === 'SHORT') sqCount++;
      else {
        mcqCount++;
        if (Array.isArray(q?.options) && q.options.length >= 5) maxOptions = 5;
      }
    });

    const hasWritten = cqCount > 0 || sqCount > 0;

    // Pick optimal OMR preset automatically based on real exam MCQ count & options
    let recommendedPreset: PresetType = 'hsc_ssc_50';
    if (maxOptions >= 5) {
      recommendedPreset = 'buet_iba_5opt_50';
    } else if (mcqCount > 60) {
      recommendedPreset = 'medical_100';
    } else if (mcqCount > 50) {
      recommendedPreset = 'du_admission';
    } else if (mcqCount > 0 && mcqCount <= 25) {
      recommendedPreset = 'hsc_ssc_25';
    } else {
      recommendedPreset = 'hsc_ssc_50';
    }

    return {
      sets,
      mcqCount: mcqCount || 50,
      cqCount,
      sqCount,
      hasWritten,
      maxOptions,
      recommendedPreset,
    };
  }, [exam]);

  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">পরীক্ষার জেনারেটেড সেট ও প্রশ্ন বিশ্লেষণ করা হচ্ছে...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 bg-rose-950/30 border border-rose-500/40 rounded-2xl text-rose-200 text-sm">
        <p className="font-bold mb-2">ত্রুটি: {error || 'Exam not found'}</p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            ফিরে যান
          </button>
        )}
      </div>
    );
  }

  const activeSet = analysis.sets[Math.min(selectedSetIdx, analysis.sets.length - 1)] || analysis.sets[0];
  const cleanSetLetter = activeSet.name
    .replace(/^(set|সেট)\s*[-:]?\s*/i, '')
    .trim()
    .split(/\s+/)[0] || 'A';

  return (
    <div className="space-y-4">
      {/* Exam Pack Summary Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="পরীক্ষা তালিকায় ফিরুন"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AUTO-BOUND EXAM PACK
              </span>
              <h2 className="text-base font-bold text-white">{exam.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>
                মোট সেট: <strong className="text-white">{analysis.sets.length} টি</strong>
              </span>
              <span>
                MCQ: <strong className="text-emerald-400">{analysis.mcqCount} টি ({analysis.maxOptions}-অপশন)</strong>
              </span>
              {analysis.hasWritten && (
                <span>
                  লিখিত (CQ/SQ):{' '}
                  <strong className="text-amber-400">
                    {analysis.cqCount} CQ + {analysis.sqCount} SQ (টপ-কভার সক্রিয়)
                  </strong>
                </span>
              )}
              <span>
                পূর্ণমান: <strong className="text-white">{exam.totalMarks || 100}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/exams/${exam.id}/print`}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>প্রশ্নপত্র প্রিন্ট</span>
          </Link>
          <Link
            href={`/exams/${exam.id}/omr-scan`}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>OMR স্ক্যান করুন ({analysis.hasWritten ? 'MCQ → CQ' : 'MCQ'})</span>
          </Link>
        </div>
      </div>

      {/* Mode Switcher: Set-Wise MCQ Sheets vs CQ/SQ Top Cover */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('mcq_sets')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'mcq_sets'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>১. সেট-ভিত্তিক MCQ OMR ({analysis.sets.length} সেট)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('cq_cover')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'cq_cover'
                ? 'bg-amber-600 text-white shadow'
                : analysis.hasWritten
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              ২. CQ/SQ টপ-কভার শিট {analysis.hasWritten ? '(প্রয়োজনীয়)' : '(ঐচ্ছিক)'}
            </span>
          </button>
        </div>

        {/* Generated Set Pills when in MCQ mode */}
        {activeMode === 'mcq_sets' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">জেনারেটেড সেট:</span>
            {analysis.sets.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSetIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  idx === selectedSetIdx
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {idx === selectedSetIdx && <CheckCircle2 className="w-3 h-3" />}
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Calibrated OMR Generator bound to this exact Exam + Set (or CQ Cover) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {activeMode === 'cq_cover' ? (
          <BangladeshOMRGenerator
            key={`cq-${exam.id}`}
            initialPreset="board_cq_3part"
            examId={exam.id}
            setId={activeSet.id}
            setName={cleanSetLetter}
            hideTopHeader={true}
          />
        ) : (
          <BangladeshOMRGenerator
            key={`mcq-${exam.id}-${activeSet.id}-${analysis.recommendedPreset}`}
            initialPreset={analysis.recommendedPreset}
            examId={exam.id}
            setId={activeSet.id}
            setName={cleanSetLetter}
            hideTopHeader={true}
          />
        )}
      </div>
    </div>
  );
}
