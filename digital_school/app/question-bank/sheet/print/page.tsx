"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig as globalMathJaxConfig } from '@/app/components/MathJaxConfig';
import Head from 'next/head';

import QuestionPaper from '@/app/components/QuestionPaper';
import AnswerQuestionPaper from '@/app/components/Answer_QuestionPaper';
import SingleQuestionPageSheet, { normalizeQuestionData } from '@/app/components/SingleQuestionPageSheet';
import OMRSheet from '@/app/components/OMRSheet';
import "@/app/exams/[id]/print/print.css";

import { Printer, Download, RefreshCw, Layers, FileText, CheckCircle2, ArrowLeft, Stamp, UserCheck, FileCheck, Sliders, Type, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PrintSheetPage() {
  const [sheetData, setSheetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');

  // Control options
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMathJaxReady, setIsMathJaxReady] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'standard' | 'single'>('standard');
  const [paperSize, setPaperSize] = useState<'a4' | 'legal' | 'letter'>(sheetData?.paperSize || 'a4');
  const [singleStyle, setSingleStyle] = useState<'vertical' | 'split'>(sheetData?.singleStyle || 'split');
  const [objectiveFontSize, setObjectiveFontSize] = useState(100);
  const [cqSqFontSize, setCqSqFontSize] = useState(100);
  const [showDate, setShowDate] = useState(true);
  const [showStudentHeader, setShowStudentHeader] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [showOMR, setShowOMR] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Load Sheet Data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sheet_maker_print_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSheetData(parsed);
        if (parsed.showSolution !== undefined) {
          setShowAnswers(parsed.showSolution);
        }
        if (parsed.layoutMode) {
          setLayoutMode(parsed.layoutMode);
        }
        if (parsed.watermarkText) {
          setWatermarkText(parsed.watermarkText);
        }
        if (parsed.showStudentHeader !== undefined) {
          setShowStudentHeader(parsed.showStudentHeader);
        }
      }
    } catch (err) {
      console.error("Error parsing sheet print data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Shuffle Options & Remap Answers (matching /exams/[id] set generator)
  const shuffleOptionsAndMapAnswers = (questions: any[]) => {
    const shuffleArray = (arr: any[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    return questions.map((q: any) => {
      let processed = { ...q };

      // 1. MCQ, MC, SMCQ Option Shuffling & Answer Key Remapping
      if ((q.type === 'MCQ' || q.type === 'MC') && Array.isArray(q.options) && q.options.length > 0) {
        const shuffledOptions = shuffleArray(q.options);
        processed.options = shuffledOptions;

        const correctIndices = shuffledOptions.reduce((acc: number[], opt: any, idx: number) => {
          if (opt.isCorrect === true || String(opt.isCorrect) === 'true') acc.push(idx);
          return acc;
        }, []);
        if (correctIndices.length > 0) {
          processed.correctAnswer = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
        }
      }

      // SMCQ sub-question option shuffling
      if (q.type === 'SMCQ' && Array.isArray(q.subQuestions)) {
        processed.subQuestions = q.subQuestions.map((sq: any) => {
          if (Array.isArray(sq.options) && sq.options.length > 0) {
            return { ...sq, options: shuffleArray(sq.options) };
          }
          return sq;
        });
      }

      // 2. AR Questions: Ensure 4 options with correctness mapping
      if (q.type === 'AR') {
        const defaultAROptions = [
          { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা", isCorrect: false },
          { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়", isCorrect: false },
          { text: "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা", isCorrect: false },
          { text: "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক", isCorrect: false }
        ];

        let arOpts = (Array.isArray(q.options) && q.options.length > 0) ? q.options : defaultAROptions;
        let correctIdx = -1;
        if (q.correctOption) {
          correctIdx = Number(q.correctOption) - 1;
        } else {
          correctIdx = arOpts.findIndex((o: any) => o.isCorrect === true || String(o.isCorrect) === 'true');
        }

        arOpts = arOpts.map((opt: any, idx: number) => ({
          ...opt,
          isCorrect: correctIdx >= 0 ? idx === correctIdx : Boolean(opt.isCorrect)
        }));

        processed.options = arOpts;
      }

      // 3. MTF Column Shuffling
      if (q.type === 'MTF' && Array.isArray(q.rightColumn) && q.rightColumn.length > 0) {
        processed.rightColumn = shuffleArray(q.rightColumn);
      }

      return processed;
    });
  };

  // Check MathJax Readiness
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

  const printPageStyle = (layoutMode === 'single' && singleStyle === 'split')
    ? `@page { size: landscape; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; } }`
    : `@page { size: auto; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; } }`;

  // React to Print handler
  // @ts-ignore: react-to-print typing issue
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sheetData?.title || "sheet-print",
    pageStyle: printPageStyle,
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
      (window as any).__IS_MATHJAX_READY = false;
    },
  } as any);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!sheetData || !sheetData.questions || sheetData.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
          <FileText className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">কোন শীট ডাটা পাওয়া যায়নি</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            প্রশ্ন ব্যাংক থেকে শীট তৈরি করে "শীট প্রিন্ট" বাটনে ক্লিক করুন।
          </p>
          <Button onClick={() => window.close()} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  // Normalize all questions to resolve model answers, explanations, and subquestions
  let normalizedQuestionsList = (sheetData?.questions || []).map((q: any) => normalizeQuestionData(q));

  if (isShuffled) {
    normalizedQuestionsList = shuffleOptionsAndMapAnswers(normalizedQuestionsList);
  }

  // Organize questions for QuestionPaper / AnswerQuestionPaper standard view
  const objectiveQuestions = normalizedQuestionsList.filter((q: any) => ['MCQ', 'MC', 'INT', 'AR', 'SMCQ', 'MTF', 'CMA', 'MPC', 'DR'].includes(q.type));

  const formattedQuestions = {
    mcq: normalizedQuestionsList.filter((q: any) => q.type === 'MCQ' || q.type === 'MC'),
    mc: normalizedQuestionsList.filter((q: any) => q.type === 'MC'),
    int: normalizedQuestionsList.filter((q: any) => q.type === 'INT'),
    ar: normalizedQuestionsList.filter((q: any) => q.type === 'AR'),
    cq: normalizedQuestionsList.filter((q: any) => q.type === 'CQ'),
    sq: normalizedQuestionsList.filter((q: any) => q.type === 'SQ'),
    mtf: normalizedQuestionsList.filter((q: any) => q.type === 'MTF'),
    cma: normalizedQuestionsList.filter((q: any) => q.type === 'CMA'),
    mpc: normalizedQuestionsList.filter((q: any) => q.type === 'MPC'),
    dr: normalizedQuestionsList.filter((q: any) => q.type === 'DR'),
    descriptive: normalizedQuestionsList.filter((q: any) => q.type === 'DESCRIPTIVE'),
    smcq: normalizedQuestionsList.filter((q: any) => q.type === 'SMCQ'),
    allObjective: objectiveQuestions
  };

  const examInfo = {
    title: sheetData.title || "কাস্টম প্রশ্ন শীট",
    schoolName: sheetData.schoolName || "রোফাজ একাডেমি (Rofaz Academy)",
    schoolAddress: sheetData.schoolAddress || "",
    class: sheetData.className || sheetData.class || "",
    subject: sheetData.subject || "",
    date: sheetData.date || new Date().toISOString().split('T')[0],
    duration: sheetData.duration ? `${sheetData.duration} মিনিট` : "",
    totalMarks: sheetData.totalMarks ? sheetData.totalMarks.toString() : "",
    set: "A",
  };

  const omrQuestionsFormat = {
    mcq: objectiveQuestions.map((q: any) => ({
      q: q.questionText || "",
      options: (q.options || []).map((o: any) => typeof o === 'string' ? o : o.text || "")
    }))
  };

  const paperClass = paperSize === 'legal' ? 'legal-paper' : paperSize === 'letter' ? 'letter-paper' : 'a4-paper';

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-gray-200 print:bg-white print:text-black font-serif">
        <Head>
          <title>{sheetData.title || "প্রিন্ট শীট"}</title>
        </Head>

        {/* WORLD-CLASS PRINT CONTROLS TOOLBAR */}
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b shadow-md p-4 print:hidden">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Title & Stats */}
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {sheetData.title || "প্রশ্ন শীট"}
                </h1>
                <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span>{sheetData.className}</span>
                  <span>•</span>
                  <span>{sheetData.subject}</span>
                  <span>•</span>
                  <span>মোট প্রশ্ন: {sheetData.questions.length}</span>
                  <span>•</span>
                  <span>মোট নম্বর: {sheetData.totalMarks}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Language Switch */}
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl text-xs">
                  <button
                    onClick={() => setLanguage('bn')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${language === 'bn' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-600'}`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-600'}`}
                  >
                    English
                  </button>
                </div>

                {/* Shuffle Options Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={`font-bold px-4 py-2 rounded-xl border flex items-center gap-2 text-xs transition-all ${isShuffled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-300'}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isShuffled ? 'animate-spin-slow' : ''}`} />
                  {isShuffled ? (language === 'bn' ? 'অপশন শুফলিং অন' : 'Shuffled Options') : (language === 'bn' ? 'অপশন শুফল করুন' : 'Shuffle Options')}
                </Button>

                {/* Print Button */}
                <Button
                  onClick={() => handlePrint()}
                  disabled={isPrinting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm"
                >
                  {isPrinting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  {language === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / PDF Download'}
                </Button>
              </div>
            </div>

            {/* SECOND ROW: ADVANCED PRINT SETTINGS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
              
              {/* Layout Mode */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">প্রিন্ট লেআউট</Label>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setLayoutMode('standard')}
                    className={`flex-1 py-1 rounded font-bold text-[11px] transition-all ${layoutMode === 'standard' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    স্ট্যান্ডার্ড
                  </button>
                  <button
                    onClick={() => setLayoutMode('single')}
                    className={`flex-1 py-1 rounded font-bold text-[11px] transition-all ${layoutMode === 'single' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    ১ পেজে ১টি
                  </button>
                </div>
              </div>

              {/* 1-Page Layout Sub-Style (Split vs Vertical) */}
              {layoutMode === 'single' && (
                <div>
                  <Label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">১-পেজ লেআউট স্টাইল</Label>
                  <div className="flex bg-indigo-50 dark:bg-slate-800 p-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <button
                      onClick={() => setSingleStyle('split')}
                      className={`flex-1 py-1 px-2 rounded font-bold text-[11px] transition-all ${singleStyle === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      📖 স্প্লিট ল্যান্ডস্কেপ (ডানে উত্তর খাতা)
                    </button>
                    <button
                      onClick={() => setSingleStyle('vertical')}
                      className={`flex-1 py-1 px-2 rounded font-bold text-[11px] transition-all ${singleStyle === 'vertical' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      📄 উল্লম্ব (নিচে খাতা)
                    </button>
                  </div>
                </div>
              )}

              {/* Paper Size */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">পেপারের সাইজ</Label>
                <Select value={paperSize} onValueChange={(val: any) => setPaperSize(val)}>
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg text-xs">
                    <SelectItem value="a4">A4 Paper (Standard)</SelectItem>
                    <SelectItem value="legal">Legal Paper (Long)</SelectItem>
                    <SelectItem value="letter">Letter Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Solutions Toggle */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">উত্তরপত্র / সমাধান</Label>
                <div className="flex items-center gap-2 h-8 px-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Switch id="sol-toggle" checked={showAnswers} onCheckedChange={setShowAnswers} />
                  <Label htmlFor="sol-toggle" className="text-xs font-medium cursor-pointer">
                    {showAnswers ? "উত্তর সহ" : "শুধু প্রশ্ন"}
                  </Label>
                </div>
              </div>

              {/* Student Info Header Toggle */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">শিক্ষার্থীর তথ্য ব্লক</Label>
                <div className="flex items-center gap-2 h-8 px-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Switch id="student-header-toggle" checked={showStudentHeader} onCheckedChange={setShowStudentHeader} />
                  <Label htmlFor="student-header-toggle" className="text-xs font-medium cursor-pointer">
                    {showStudentHeader ? "অন আছে" : "অফ"}
                  </Label>
                </div>
              </div>

              {/* Append OMR Toggle */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">OMR শীট যুক্ত করুন</Label>
                <div className="flex items-center gap-2 h-8 px-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Switch id="omr-toggle" checked={showOMR} onCheckedChange={setShowOMR} />
                  <Label htmlFor="omr-toggle" className="text-xs font-medium cursor-pointer">
                    {showOMR ? "OMR সহ" : "OMR ছাড়া"}
                  </Label>
                </div>
              </div>

              {/* Watermark Input */}
              <div>
                <Label className="text-[10px] font-bold text-gray-500 block mb-1">ওয়াটারমার্ক টেক্সট</Label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. ROFAZ ACADEMY"
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MATHJAX READY STATUS BADGE */}
        <div className="flex justify-center mt-2 gap-3 print:hidden">
          {isMathJaxReady ? (
            <span className="bg-green-100 text-green-800 border border-green-300 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> MathJax Ready
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-0.5 rounded-full text-xs font-bold animate-pulse">
              MathJax রেন্ডার হচ্ছে...
            </span>
          )}

          <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${layoutMode === 'single' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {layoutMode === 'single' ? '১ প্রশ্ন / পেজ মোড' : 'স্ট্যান্ডার্ড মাল্টি-প্রশ্ন মোড'}
          </span>

          <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${showAnswers ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'}`}>
            {showAnswers ? 'উত্তর ও সমাধান ভিউ' : 'প্রশ্নপত্র ভিউ'}
          </span>

          <span className="bg-gray-100 text-gray-800 border px-3 py-0.5 rounded-full text-xs font-bold uppercase">
            Paper: {paperSize}
          </span>
        </div>

        {/* DYNAMIC AUTO-LANDSCAPE PRINT CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${layoutMode === 'single' && singleStyle === 'split' ? 'landscape' : 'portrait'};
              margin: 5mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` }} />

        {/* PRINTABLE CONTENT AREA */}
        <div ref={printRef} className={`relative z-10 mx-auto my-6 print:m-0 print:max-w-none print:w-full ${layoutMode === 'single' && singleStyle === 'split' ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
          
          {/* WATERMARK OVERLAY FOR STANDARD PRINT MODE */}
          {watermarkText && layoutMode === 'standard' && (
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.05] print:opacity-[0.07] select-none">
              <span className="text-7xl md:text-9xl font-black uppercase tracking-widest text-black -rotate-45 text-center">
                {watermarkText}
              </span>
            </div>
          )}

          {layoutMode === 'standard' ? (
            !showAnswers ? (
              <div className={`print-page-container ${paperClass} bg-white shadow-xl p-8 print:shadow-none print:p-0 relative z-10`}>
                {showStudentHeader && (
                  <div className="border border-black rounded-lg p-3 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold print:text-black">
                    <div className="border-b border-dashed border-gray-400 pb-1">
                      <span>{language === 'bn' ? "পরীক্ষার্থীর নাম: " : "Name: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-1">
                      <span>{language === 'bn' ? "রোল / আইডি: " : "Roll / ID: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-1">
                      <span>{language === 'bn' ? "শাখা / সেকশন: " : "Section: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-1">
                      <span>{language === 'bn' ? "তারিখ: " : "Date: "} {examInfo.date}</span>
                    </div>
                  </div>
                )}

                <QuestionPaper
                  examInfo={examInfo}
                  questions={formattedQuestions}
                  qrData={{ type: 'sheet' }}
                  fontSize={objectiveFontSize}
                  cqSqFontSize={cqSqFontSize}
                  language={language}
                  hideOMR={true}
                  showDate={showDate}
                />
              </div>
            ) : (
              <div className={`print-page-container ${paperClass} bg-white shadow-xl p-8 print:shadow-none print:p-0 relative z-10`}>
                <AnswerQuestionPaper
                  examInfo={examInfo}
                  questions={formattedQuestions}
                  qrData={{ type: 'sheet' }}
                  fontSize={objectiveFontSize}
                  cqSqFontSize={cqSqFontSize}
                  language={language}
                  hideOMR={true}
                  showDate={showDate}
                />
              </div>
            )
          ) : (
            <SingleQuestionPageSheet
              sheetInfo={examInfo}
              questions={normalizedQuestionsList}
              showAnswers={showAnswers}
              fontSize={objectiveFontSize}
              language={language}
              showStudentHeader={showStudentHeader}
              watermarkText={watermarkText}
              paperSize={paperSize}
              singleStyle={singleStyle}
              isShuffled={isShuffled}
            />
          )}

          {/* OMR SHEET APPEND IF ENABLED */}
          {showOMR && objectiveQuestions.length > 0 && (
            <div className={`print-page-container ${paperClass} bg-white shadow-xl p-8 print:shadow-none print:p-0 mt-8 print:mt-0`} style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
              <div className="text-center mb-4 border-b pb-2">
                <h3 className="font-bold text-lg">OMR Answer Sheet (উত্তরপত্র)</h3>
                <p className="text-xs text-gray-500">{examInfo.title} • {examInfo.class} • {examInfo.subject}</p>
              </div>
              <OMRSheet
                questions={omrQuestionsFormat}
                qrData={{ type: 'sheet-omr', title: examInfo.title }}
                mcqOptionsCount={4}
                mcqOptionLabels={['ক', 'খ', 'গ', 'ঘ']}
                setName="A"
              />
            </div>
          )}
        </div>
      </div>
    </MathJaxContext>
  );
}
