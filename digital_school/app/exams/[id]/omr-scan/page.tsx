"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  Camera,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  ArrowLeft,
  Printer,
  Eye,
  Send,
  Zap,
  BarChart3,
  ShieldCheck,
  FileText
} from 'lucide-react';

import type {
  Template,
  BubblePoint,
  ScanProcessingResult,
  StudentScoreCard,
  EvaluationConfig,
  QuestionVerdict
} from '@/lib/omr/types';
import { PRESET_TEMPLATES } from '@/lib/omr/presetTemplates';
import { parseTemplate } from '@/lib/omr/templateParser';
import { EvaluationEngine } from '@/lib/omr/evaluationEngine';
import { processOMR } from '@/lib/omr/omrEngine';
import { renderPdfToCanvases } from '@/lib/omr/pdfLoader';
import { loadOpenCV } from '@/lib/omr/opencvLoader';
import { toBengaliNumerals } from '@/utils/numeralConverter';
import Papa from 'papaparse';

export default function ExamBatchScanPage() {
  const params = useParams();
  const examId = params?.id as string;
  const router = useRouter();

  // Exam state from DB
  const [exam, setExam] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState<boolean>(true);
  const [examError, setExamError] = useState<string | null>(null);

  // OMR Config state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical_admission_100q');
  const [evaluationConfig, setEvaluationConfig] = useState<EvaluationConfig>(PRESET_TEMPLATES[0].evaluationConfig);
  const [activeTemplate, setActiveTemplate] = useState<Template>(PRESET_TEMPLATES[0].template);
  const [parsedBubbles, setParsedBubbles] = useState<BubblePoint[]>([]);

  // Batch Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ScanProcessingResult>>({});
  const [scoreCards, setScoreCards] = useState<StudentScoreCard[]>([]);
  const [selectedScoreCard, setSelectedScoreCard] = useState<StudentScoreCard | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'results' | 'analytics'>('upload');

  // DB Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Initialize OpenCV & Template
  useEffect(() => {
    loadOpenCV().catch(err => {
      console.warn('OpenCV lazy load deferred (will retry on scan):', err);
    });

    const preset = PRESET_TEMPLATES.find(p => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
    setActiveTemplate(preset.template);
    const parsed = parseTemplate(preset.template);
    setParsedBubbles(parsed.bubbles);
  }, [selectedPresetId]);

  // Fetch Exam Data & Compile Authentic Answer Key from DB
  useEffect(() => {
    if (!examId) return;

    async function fetchExamDetails() {
      try {
        setLoadingExam(true);
        const res = await fetch(`/api/exams/${examId}`);
        if (!res.ok) throw new Error(`Exam not found (HTTP ${res.status})`);
        const data = await res.json();
        setExam(data);

        // Compile Answer Key from Exam Questions / Sets
        const multiSetKeys: Record<string, Record<string, string>> = {};
        const defaultKey: Record<string, string> = {};

        const examSets = Array.isArray(data.examSets) ? data.examSets : [];

        // Helper to convert option index to letter
        const indexToLetter = (idx: number) => {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          return letters[idx] || 'A';
        };

        const extractAnswersFromQuestions = (qList: any[]) => {
          const map: Record<string, string> = {};
          qList.forEach((q: any, idx: number) => {
            const qKey = `q${idx + 1}`;
            let correctLetter = 'A';

            if (Array.isArray(q.options)) {
              const correctIdx = q.options.findIndex((opt: any) => {
                if (typeof opt === 'object' && opt !== null) {
                  return opt.isCorrect === true || opt.correct === true;
                }
                return false;
              });

              if (correctIdx >= 0) {
                correctLetter = indexToLetter(correctIdx);
              } else if (q.correctOption !== undefined) {
                if (typeof q.correctOption === 'number') {
                  correctLetter = indexToLetter(q.correctOption - 1);
                } else if (typeof q.correctOption === 'string') {
                  const cleaned = q.correctOption.trim().toUpperCase();
                  if (['A', 'B', 'C', 'D', 'E'].includes(cleaned)) {
                    correctLetter = cleaned;
                  } else if (['ক', 'খ', 'গ', 'ঘ'].includes(cleaned)) {
                    const bnMap: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
                    correctLetter = bnMap[cleaned] || 'A';
                  }
                }
              }
            }
            map[qKey] = correctLetter;
          });
          return map;
        };

        if (examSets.length > 0) {
          examSets.forEach((s: any) => {
            const rawName = s.name.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
            const qs = Array.isArray(s.questionsJson) 
              ? s.questionsJson 
              : (Array.isArray(s.questions) ? s.questions : []);
            
            const setKey = extractAnswersFromQuestions(qs);
            multiSetKeys[rawName] = setKey;
            if (rawName === 'A' || !defaultKey['q1']) {
              Object.assign(defaultKey, setKey);
            }
          });
        }

        const negMark = data.mcqNegativeMarking !== undefined ? Number(data.mcqNegativeMarking) : 0.25;

        const dynamicConfig: EvaluationConfig = {
          examName: data.name,
          examCode: data.id,
          totalMarks: Number(data.totalMarks) || 100,
          answerKey: defaultKey,
          multiSetAnswerKeys: multiSetKeys,
          rollNumberField: 'Roll',
          serialNumberField: 'Serial',
          setNameField: 'Set',
          markingSchemes: {
            default: {
              correct: 1.0,
              incorrect: -Math.abs(negMark),
              unmarked: 0,
              bonus: 1.0,
            },
          },
        };

        setEvaluationConfig(dynamicConfig);
      } catch (err: any) {
        console.error('Failed to load exam details:', err);
        setExamError(err.message || 'Error loading exam');
      } finally {
        setLoadingExam(false);
      }
    }

    fetchExamDetails();
  }, [examId]);

  // Clean up Camera Stream on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Batch File Upload (PDFs or Images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage('ডকুমেন্ট প্রসেসিং এবং পেজ লোডিং শুরু হচ্ছে...');

    const itemsToProcess: { canvas: HTMLCanvasElement; name: string }[] = [];

    try {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          const isMasterSpread = file.name.toLowerCase().includes('medical') || 
                                 file.name.toLowerCase().includes('master') ||
                                 activeTemplate.pageDimensions[0] === 1060;
          
          const renderedPages = await renderPdfToCanvases(file, {
            dpi: 150,
            oddPagesOnly: isMasterSpread,
          });

          for (const item of renderedPages) {
            itemsToProcess.push({
              canvas: item.canvas,
              name: `${file.name} (P.${item.pageNumber})`,
            });
          }
        } else {
          const img = await loadImageFromFile(file);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          itemsToProcess.push({
            canvas,
            name: file.name,
          });
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setStatusMessage(`ফাইল লোড করতে ব্যর্থ: ${err.message}`);
      setIsProcessing(false);
      return;
    }

    setProgress({ current: 0, total: itemsToProcess.length });
    setStatusMessage(`${itemsToProcess.length} টি OMR শিট স্ক্যান ও মূল্যায়ন করা হচ্ছে...`);

    const newScanResults = { ...scanResults };
    const newScoreCards: StudentScoreCard[] = [...scoreCards];
    const evalEngine = new EvaluationEngine(evaluationConfig);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setProgress({ current: i + 1, total: itemsToProcess.length });
      await new Promise(r => setTimeout(r, 16));

      try {
        const scanRes = await processOMR(
          item.canvas,
          activeTemplate,
          parsedBubbles,
          undefined,
          item.name
        );

        newScanResults[scanRes.sheetId] = scanRes;

        const card = evalEngine.evaluateCandidate(
          scanRes.sheetId,
          item.name,
          scanRes.responses,
          scanRes.concatenatedResponses,
          scanRes.flags
        );

        newScoreCards.push(card);
        successCount++;
      } catch (err: any) {
        console.error(`Error scanning ${item.name}:`, err);
        failCount++;
      }
    }

    const ranked = EvaluationEngine.rankCohort(newScoreCards);
    setScanResults(newScanResults);
    setScoreCards(ranked);
    setIsProcessing(false);
    setStatusMessage(`ব্যাচ স্ক্যান সম্পন্ন: ${successCount} টি সফল${failCount > 0 ? `, ${failCount} টি ত্রুটি` : ''}!`);
    setActiveTab('results');
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Start Camera Feed
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      alert('ক্যামেরা চালু করা সম্ভব হয়নি: ' + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Live Snapshot and Grade
  const captureAndGrade = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsProcessing(true);
    setStatusMessage('ক্যামেরা ফ্রেম স্ক্যান ও মূল্যায়ন করা হচ্ছে...');

    try {
      const scanRes = await processOMR(
        canvas,
        activeTemplate,
        parsedBubbles,
        undefined,
        `Camera_Capture_${Date.now()}`
      );

      const evalEngine = new EvaluationEngine(evaluationConfig);
      const card = evalEngine.evaluateCandidate(
        scanRes.sheetId,
        scanRes.filename,
        scanRes.responses,
        scanRes.concatenatedResponses,
        scanRes.flags
      );

      const updated = EvaluationEngine.rankCohort([...scoreCards, card]);
      setScanResults(prev => ({ ...prev, [scanRes.sheetId]: scanRes }));
      setScoreCards(updated);
      setSelectedScoreCard(card);
      setStatusMessage(`সফলভাবে রোল: ${card.rollNumber} স্ক্যান ও গ্রেড হয়েছে (নম্বর: ${card.totalScore})!`);
    } catch (err: any) {
      console.error('Camera scan error:', err);
      setStatusMessage('স্ক্যান ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync Cohort Results to Database
  const handleSyncToDatabase = async () => {
    if (scoreCards.length === 0) {
      alert('সিঙ্ক করার জন্য কোনো গ্রেডেড ওএমআর রেকর্ড নেই। প্রথমে ফাইল স্ক্যান করুন।');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus(null);

      const payload = {
        examId,
        scans: scoreCards.map(card => {
          const scan = scanResults[card.sheetId];
          const answersMap: Record<string, string> = {};
          if (scan && scan.responses) {
            Object.entries(scan.responses).forEach(([k, v]) => {
              answersMap[k] = v.join('');
            });
          }

          return {
            sheetId: card.sheetId,
            filename: card.filename,
            rollNumber: card.rollNumber,
            serialNo: card.serialNo,
            examSet: card.examSet,
            totalScore: card.totalScore,
            maxScore: card.maxScore,
            percentage: card.percentage,
            correctCount: card.correctCount,
            incorrectCount: card.incorrectCount,
            unmarkedCount: card.unmarkedCount,
            answers: answersMap,
            rawAnswers: scan?.responses || {},
            evaluatedAnswers: card.questionVerdicts || {},
            flags: card.flags,
          };
        }),
      };

      const res = await fetch(`/api/exams/${examId}/omr-batch-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');

      setSyncStatus({
        success: true,
        message: data.message || `সাফল্যের সাথে ${data.processedCount} টি খাতা ডাটাবেসে সেভ হয়েছে!`,
      });
    } catch (err: any) {
      console.error('Database sync error:', err);
      setSyncStatus({
        success: false,
        message: 'ডাটাবেস সিঙ্ক ব্যর্থ: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export Results CSV
  const handleExportCSV = () => {
    if (scoreCards.length === 0) return;
    const csvData = scoreCards.map(c => ({
      'Rank': c.rank,
      'Roll Number': c.rollNumber,
      'Exam Set': c.examSet,
      'Total Score': c.totalScore,
      'Max Score': c.maxScore,
      'Percentage (%)': c.percentage,
      'Correct': c.correctCount,
      'Incorrect': c.incorrectCount,
      'Unmarked': c.unmarkedCount,
      'Filename': c.filename,
      'Flags': c.flags.join('; '),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_Batch_Results_${exam?.name || 'Exam'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Cards for search
  const filteredScoreCards = scoreCards.filter(c => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return c.rollNumber.toLowerCase().includes(q) ||
           c.examSet.toLowerCase().includes(q) ||
           c.filename.toLowerCase().includes(q);
  });

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-semibold">পরীক্ষার বিবরণ ও উত্তরমালা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold">পরীক্ষা লোড করা যায়নি</h2>
        <p className="text-sm text-slate-400 mt-1">{examError}</p>
        <Link href="/exams" className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold">
          পরীক্ষা তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/exams/${examId}`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="পরীক্ষার ড্যাশবোর্ডে ফিরুন"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white">
                {exam.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                OMR ব্যাচ স্ক্যান ও অটো-গ্রেডিং
              </span>
            </div>
            <p className="text-xs text-slate-400">
              পূর্ণমান: {toBengaliNumerals(exam.totalMarks)} • নেগেটিভ মার্কিং: -{toBengaliNumerals(exam.mcqNegativeMarking ?? 0.25)} • সেটের সংখ্যা: {toBengaliNumerals(exam.examSets?.length || 1)}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href={`/exams/${examId}/print`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300"
          >
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট / OMR
          </Link>
          <Link
            href={`/exams/results`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300"
          >
            <BarChart3 className="w-3.5 h-3.5" /> ফলাফল বোর্ড
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" /> ফাইল ব্যাচ আপলোড
            </button>
            <button
              onClick={() => {
                setActiveTab('camera');
                if (!isCameraActive) startCamera();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'camera'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" /> লাইভ ক্যামেরা স্ক্যানার
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> গ্রেডেড ফলাফল ({toBengaliNumerals(scoreCards.length)})
            </button>
          </div>

          {/* Sync to DB Button */}
          {scoreCards.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncToDatabase}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSyncing ? 'ডাটাবেসে সিঙ্ক হচ্ছে...' : 'ডাটাবেসে সিঙ্ক ও ফলাফল প্রকাশ করুন'}
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                title="CSV এক্সপোর্ট"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> এক্সপোর্ট
              </button>
            </div>
          )}
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              syncStatus.success
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
            </div>
            {syncStatus.success && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/exams/results`}
                  className="underline hover:text-white text-xs font-bold"
                >
                  ফলাফল বোর্ড দেখুন ➔
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: BATCH FILE UPLOAD */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Drag and Drop Upload Card */}
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-900/40 backdrop-blur-sm transition-all group">
                <input
                  type="file"
                  id="batch-omr-files"
                  multiple
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label
                  htmlFor="batch-omr-files"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      OMR স্ক্যান ফাইল এখানে আপলোড করুন
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      মাস্টার পরীক্ষা PDF (যেমন: ALL_13_MEDICAL_EXAMS_WORLD_CLASS_BW_MASTER.pdf), স্ক্যানার ডক বান্ডেল বা মোবাইল ক্যামেরা ফটো (PNG, JPG) ড্রপ করুন
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                    ফাইল নির্বাচন করুন
                  </div>
                </label>
              </div>

              {/* Progress and Real-time Status */}
              {isProcessing && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{statusMessage}</span>
                    <span>
                      {toBengaliNumerals(progress.current)} / {toBengaliNumerals(progress.total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Preset Template Selector & Answer Key Info */}
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" /> OMR টেমপ্লেট নির্বাচন
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {PRESET_TEMPLATES.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        selectedPresetId === preset.id
                          ? 'bg-indigo-950/40 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Exam Answer Key Status */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>স্বয়ংক্রিয় উত্তরমালা:</span>
                    <span className="text-emerald-400">
                      {toBengaliNumerals(Object.keys(evaluationConfig.answerKey).length)} টি প্রশ্ন লোডকৃত
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ডাটাবেস থেকে সেটের প্রশ্নসমূহ সরাসরি লিঙ্ক করা আছে। স্ক্যানের সময় সেটের কোড অনুযায়ী মূল্যায়ন করা হবে।
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={cameraCanvasRef} className="hidden" />

              {/* Target Alignment Overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="bg-slate-950/80 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/40">
                  OMR শিটটি ফ্রেমের ভেতরে রাখুন
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={captureAndGrade}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {isProcessing ? 'স্ক্যান হচ্ছে...' : 'ছবি তুলুন ও গ্রেড করুন'}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                ক্যামেরা বন্ধ করুন
              </button>
            </div>

            {statusMessage && (
              <p className="text-center text-xs font-semibold text-indigo-300">
                {statusMessage}
              </p>
            )}
          </div>
        )}

        {/* TAB 3: GRADED ROSTER RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {/* Search Filter Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="রোল নম্বর বা সেট দিয়ে খুঁজুন..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold">
                মোট পরীক্ষার্থী: <span className="text-white font-bold">{toBengaliNumerals(scoreCards.length)}</span> জন
              </div>
            </div>

            {/* Results Table */}
            {filteredScoreCards.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                কোনো OMR খাতার ফলাফল পাওয়া যায়নি। প্রথমে ফাইল আপলোড বা ক্যামেরা দিয়ে স্ক্যান করুন।
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-center">মেধা ক্রম</th>
                      <th className="py-2.5 px-3 font-bold">রোল নম্বর</th>
                      <th className="py-2.5 px-3 font-bold text-center">সেট</th>
                      <th className="py-2.5 px-3 font-bold text-center">সঠিক</th>
                      <th className="py-2.5 px-3 font-bold text-center">ভুল</th>
                      <th className="py-2.5 px-3 font-bold text-center">ফাঁকা</th>
                      <th className="py-2.5 px-3 font-bold text-right">মোট নম্বর</th>
                      <th className="py-2.5 px-3 font-bold text-right">শতাংশ (%)</th>
                      <th className="py-2.5 px-3 font-bold text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredScoreCards.map((card) => (
                      <tr key={card.sheetId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-indigo-400">
                          #{toBengaliNumerals(card.rank || 1)}
                        </td>
                        <td className="py-2 px-3 font-bold text-white">
                          {card.rollNumber}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200">
                            {card.examSet}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">
                          {toBengaliNumerals(card.correctCount)}
                        </td>
                        <td className="py-2 px-3 text-center text-rose-400 font-bold">
                          {toBengaliNumerals(card.incorrectCount)}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400">
                          {toBengaliNumerals(card.unmarkedCount)}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-white text-sm">
                          {toBengaliNumerals(card.totalScore)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-200">
                          {toBengaliNumerals(card.percentage)}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedScoreCard(card)}
                            className="p-1 rounded hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                            title="উত্তর বিশ্লেষণ দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Question Verdict Breakdown Modal */}
      {selectedScoreCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">
                  রোল: {selectedScoreCard.rollNumber} — বিস্তারিত মূল্যায়ন
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  সেট: {selectedScoreCard.examSet} • স্কোর: {toBengaliNumerals(selectedScoreCard.totalScore)} / {toBengaliNumerals(selectedScoreCard.maxScore)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScoreCard(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">সঠিক উত্তর</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {toBengaliNumerals(selectedScoreCard.correctCount)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">ভুল উত্তর</div>
                  <div className="text-sm font-bold text-rose-400">
                    {toBengaliNumerals(selectedScoreCard.incorrectCount)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">ফাঁকা</div>
                  <div className="text-sm font-bold text-slate-400">
                    {toBengaliNumerals(selectedScoreCard.unmarkedCount)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">শতাংশ</div>
                  <div className="text-sm font-bold text-indigo-400">
                    {toBengaliNumerals(selectedScoreCard.percentage)}%
                  </div>
                </div>
              </div>

              {/* Questions Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {Object.entries(selectedScoreCard.questionVerdicts || {}).map(([qKey, verdict]) => {
                  const isCorrect = verdict.verdict === 'correct';
                  const isIncorrect = verdict.verdict === 'incorrect';
                  return (
                    <div
                      key={qKey}
                      className={`p-1 rounded text-center border font-mono ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                          : isIncorrect
                          ? 'bg-rose-950/40 border-rose-700 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                      title={`${qKey}: দেওয়া উত্তর: ${verdict.studentAnswer || '—'}, সঠিক: ${verdict.correctAnswer}`}
                    >
                      <div className="text-[9px] opacity-75">{qKey.toUpperCase()}</div>
                      <div className="font-bold text-[10px]">{verdict.studentAnswer || '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedScoreCard(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
