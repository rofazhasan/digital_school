"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  Clock,
  QrCode,
  Check,
  ChevronDown
} from 'lucide-react';

import type {
  Template,
  BubblePoint,
  ScanProcessingResult,
  StudentScoreCard,
  EvaluationConfig,
  QRCodeScanResult
} from '@/lib/omr/types';
import { PRESET_TEMPLATES } from '@/lib/omr/presetTemplates';
import { parseTemplate } from '@/lib/omr/templateParser';
import { EvaluationEngine } from '@/lib/omr/evaluationEngine';
import { processOMR, scanQRCodeFromCanvas } from '@/lib/omr/omrEngine';
import { loadOpenCV, isOpenCVLoaded } from '@/lib/omr/opencvLoader';
import { toBengaliNumerals } from '@/utils/numeralConverter';

interface ExamMetadata {
  id: string;
  name: string;
  totalMarks: number;
  mcqNegativeMarking?: number;
  examSets?: Array<{
    id: string;
    name: string;
    questionsJson?: any[];
  }>;
  questions?: any[];
  students?: Array<{
    id: string;
    roll: string;
    registrationNo?: string;
    user?: { id: string; name: string };
  }>;
}

export default function UniversalOMRScannerPage() {
  // Available exams list for manual selection fallback
  const [examsList, setExamsList] = useState<Array<{ id: string; name: string; totalMarks?: number }>>([]);
  const [loadingExamsList, setLoadingExamsList] = useState<boolean>(true);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Cached Exam Data indexed by examId
  const [examCache, setExamCache] = useState<Record<string, { exam: ExamMetadata; config: EvaluationConfig; studentDir: Map<string, { id: string; name: string }> }>>({});

  // Active Template
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical_admission_100q');
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
  const [cameraFeedback, setCameraFeedback] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Initialize Template
  useEffect(() => {
    const preset = PRESET_TEMPLATES.find(p => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
    setActiveTemplate(preset.template);
    const parsed = parseTemplate(preset.template);
    setParsedBubbles(parsed.bubbles);
  }, [selectedPresetId]);

  // Fetch list of available exams on mount
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/exams?limit=50', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.exams) ? data.exams : (Array.isArray(data) ? data : []);
          setExamsList(list.map((e: any) => ({ id: e.id, name: e.name, totalMarks: e.totalMarks })));
          if (list.length > 0 && !selectedExamId) {
            setSelectedExamId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch exams list:', err);
      } finally {
        setLoadingExamsList(false);
      }
    }
    loadExams();
  }, []);

  // Helper to compile Exam details into evaluation config and student directory
  const processAndCacheExam = useCallback((data: ExamMetadata) => {
    if (!data || !data.id) return null;

    const dirMap = new Map<string, { id: string; name: string }>();
    if (Array.isArray(data.students)) {
      data.students.forEach((st) => {
        if (st && st.roll) {
          const cleanR = String(st.roll).trim();
          const strippedR = cleanR.replace(/^0+/, '') || cleanR;
          const name = st.user?.name || `Roll ${cleanR}`;
          dirMap.set(cleanR, { id: st.id, name });
          dirMap.set(strippedR, { id: st.id, name });
        }
      });
    }

    const multiSetKeys: Record<string, Record<string, string>> = {};
    const defaultKey: Record<string, string> = {};
    const examSets = Array.isArray(data.examSets) ? data.examSets : [];

    const indexToLetter = (idx: number) => ['A', 'B', 'C', 'D', 'E'][idx] || 'A';

    const extractAnswers = (qList: any[]) => {
      const map: Record<string, string> = {};
      if (!Array.isArray(qList)) return map;
      qList.forEach((q: any, idx: number) => {
        const qKey = `q${idx + 1}`;
        let letter = '';
        if (q.correctAnswer) {
          const c = String(q.correctAnswer).trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(c)) letter = c;
          else if (['ক', 'খ', 'গ', 'ঘ'].includes(c)) {
            const bnMap: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
            letter = bnMap[c] || '';
          }
        }
        if (!letter && Array.isArray(q.options)) {
          const cIdx = q.options.findIndex((opt: any) => opt?.isCorrect || opt?.correct);
          if (cIdx >= 0) letter = indexToLetter(cIdx);
        }
        map[qKey] = letter || 'A';
      });
      return map;
    };

    if (examSets.length > 0) {
      examSets.forEach((s) => {
        const rawName = String(s.name || 'A').replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
        const setKey = extractAnswers(s.questionsJson || []);
        multiSetKeys[rawName] = setKey;
        multiSetKeys[rawName.charAt(0)] = setKey;
        if (Object.keys(defaultKey).length === 0 || rawName === 'A') {
          Object.assign(defaultKey, setKey);
        }
      });
    }

    if (Object.keys(defaultKey).length === 0 && Array.isArray(data.questions)) {
      Object.assign(defaultKey, extractAnswers(data.questions));
    }

    const negMark = data.mcqNegativeMarking !== undefined ? Number(data.mcqNegativeMarking) : 0.25;

    const config: EvaluationConfig = {
      examName: data.name || 'Exam',
      examCode: data.id || 'EXAM',
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

    const entry = { exam: data, config, studentDir: dirMap };
    setExamCache(prev => ({ ...prev, [data.id]: entry }));
    return entry;
  }, []);

  // Fetch single exam details by ID with caching
  const getExamData = useCallback(async (id: string) => {
    if (!id) return null;
    if (examCache[id]) return examCache[id];

    try {
      const res = await fetch(`/api/exams/${id}?mode=omr`);
      if (!res.ok) return null;
      const json = await res.json();
      const examData = json.exam || json;
      return processAndCacheExam(examData);
    } catch (e) {
      console.error(`Failed to fetch exam ${id}:`, e);
      return null;
    }
  }, [examCache, processAndCacheExam]);

  // Clean up Camera Stream on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Helper to load image
  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  // Process Batch Files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage('ডকুমেন্ট প্রসেসিং এবং পেজ লোডিং শুরু হচ্ছে...');

    if (!isOpenCVLoaded()) {
      setStatusMessage('OMR Vision ইঞ্জিন (OpenCV) লোড হচ্ছে...');
      try {
        await loadOpenCV();
      } catch (cvErr: any) {
        setIsProcessing(false);
        setStatusMessage('OpenCV ইঞ্জিন লোড হতে ব্যর্থ হয়েছে: ' + cvErr.message);
        return;
      }
    }

    const itemsToProcess: { canvas: HTMLCanvasElement; name: string }[] = [];

    try {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          const isMasterSpread = file.name.toLowerCase().includes('medical') || 
                                 file.name.toLowerCase().includes('master') ||
                                 activeTemplate.pageDimensions[0] === 1060;
          
          const { renderPdfToCanvases } = await import('@/lib/omr/pdfLoader');
          const pdfPages = await renderPdfToCanvases(file, {
            dpi: 200,
          });

          pdfPages.forEach((p, idx) => {
            itemsToProcess.push({
              canvas: p.canvas,
              name: `${file.name.replace(/\.[^/.]+$/, '')}_p${p.pageNumber || idx + 1}`
            });
          });
        } else if (file.type.startsWith('image/')) {
          const img = await loadImageFromFile(file);
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
          itemsToProcess.push({ canvas: c, name: file.name });
        }
      }
    } catch (err: any) {
      console.error('File extraction error:', err);
      setStatusMessage('ফাইল প্রসেসিং ত্রুটি: ' + err.message);
      setIsProcessing(false);
      return;
    }

    if (itemsToProcess.length === 0) {
      setIsProcessing(false);
      setStatusMessage('কোনো বৈধ OMR ইমেজ বা পিডিএফ পাওয়া যায়নি।');
      return;
    }

    setProgress({ current: 0, total: itemsToProcess.length });
    setStatusMessage(`${itemsToProcess.length} টি OMR শিট স্ক্যান ও মূল্যায়ন করা হচ্ছে...`);

    const newScanResults = { ...scanResults };
    const newScoreCards: StudentScoreCard[] = [...scoreCards];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setProgress({ current: i + 1, total: itemsToProcess.length });
      await new Promise(r => setTimeout(r, 16));

      try {
        // Step 1: Scan QR Code from Canvas to auto-detect Exam & Set
        const qr = scanQRCodeFromCanvas(item.canvas);

        const qrExamId = qr?.metadata?.examId || (qr as any)?.examId;
        const qrSet = qr?.metadata?.setName || qr?.metadata?.setId || (qr as any)?.setName;
        let targetExamId = qrExamId || selectedExamId;
        let examInfo = await getExamData(targetExamId);

        let evalConfig = examInfo?.config || {
          examName: 'General OMR Exam',
          examCode: targetExamId || 'EXAM',
          totalMarks: 100,
          answerKey: {},
          multiSetAnswerKeys: {},
          rollNumberField: 'Roll',
          serialNumberField: 'Serial',
          setNameField: 'Set',
          markingSchemes: {
            default: { correct: 1.0, incorrect: -0.25, unmarked: 0, bonus: 1.0 },
          },
        };

        const scanRes = await processOMR(
          item.canvas,
          activeTemplate,
          parsedBubbles,
          undefined,
          item.name,
          { generateCanvases: false }
        );

        // Store lightweight scan result
        const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = scanRes;
        newScanResults[scanRes.sheetId] = leanScanRes as any;

        const evalEngine = new EvaluationEngine(evalConfig);

        // If QR had a specific set name, override or match with scan responses
        const detectedSet = qrSet || scanRes.responses['Set']?.[0] || 'A';
        const responsesWithSet = { ...scanRes.responses, Set: [detectedSet] };

        const card = evalEngine.evaluateCandidate(
          scanRes.sheetId,
          item.name,
          responsesWithSet,
          scanRes.concatenatedResponses,
          scanRes.flags
        );

        // Pre-resolve candidate name and ID from student directory
        const rollStr = card.rollNumber || '';
        const strippedRoll = rollStr.replace(/^0+/, '') || rollStr;
        const matched = examInfo?.studentDir.get(rollStr) || examInfo?.studentDir.get(strippedRoll);
        if (matched) {
          card.studentId = matched.id;
          card.studentName = matched.name;
        }

        // Store target examId on the card for bulk syncing
        (card as any).examId = targetExamId;

        newScoreCards.push(card);
        successCount++;

        // Free canvas bitmap memory
        item.canvas.width = 0;
        item.canvas.height = 0;
      } catch (err: any) {
        console.error(`Error scanning ${item.name}:`, err);
        failCount++;
        item.canvas.width = 0;
        item.canvas.height = 0;
      }
    }

    const ranked = EvaluationEngine.rankCohort(newScoreCards);
    setScanResults(newScanResults);
    setScoreCards(ranked);
    setIsProcessing(false);
    setStatusMessage(`ব্যাচ স্ক্যান সম্পন্ন: ${successCount} টি সফল${failCount > 0 ? `, ${failCount} টি ত্রুটি` : ''}!`);
    setActiveTab('results');
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (!isOpenCVLoaded()) {
        setStatusMessage('ক্যামেরা চালুর পূর্বে OMR Vision ইঞ্জিন লোড করা হচ্ছে...');
        await loadOpenCV();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setActiveTab('camera');
      setCameraFeedback('ক্যামেরা প্রস্তুত। ওএমআর শিটের উপর কিউআর কোড এবং পেপার সোজা রাখুন।');
    } catch (err: any) {
      console.error('Camera access error:', err);
      alert('ক্যামেরা চালু করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Single Frame from Camera
  const captureFrameAndProcess = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (v.videoWidth === 0 || v.videoHeight === 0) return;

    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);

    setCameraFeedback('স্ক্যান বিশ্লেষণ চলছে...');

    try {
      const qr = scanQRCodeFromCanvas(c);
      const qrExamId = qr?.metadata?.examId || (qr as any)?.examId;
      const qrSet = qr?.metadata?.setName || qr?.metadata?.setId || (qr as any)?.setName;
      let targetExamId = qrExamId || selectedExamId;
      let examInfo = await getExamData(targetExamId);

      let evalConfig = examInfo?.config || {
        examName: 'General OMR Exam',
        examCode: targetExamId || 'EXAM',
        totalMarks: 100,
        answerKey: {},
        multiSetAnswerKeys: {},
        rollNumberField: 'Roll',
        serialNumberField: 'Serial',
        setNameField: 'Set',
        markingSchemes: {
          default: { correct: 1.0, incorrect: -0.25, unmarked: 0, bonus: 1.0 },
        },
      };

      const scanRes = await processOMR(
        c,
        activeTemplate,
        parsedBubbles,
        undefined,
        `Camera_${Date.now()}`,
        { generateCanvases: false }
      );

      const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = scanRes;
      setScanResults(prev => ({ ...prev, [scanRes.sheetId]: leanScanRes as any }));

      const evalEngine = new EvaluationEngine(evalConfig);
      const detectedSet = qrSet || scanRes.responses['Set']?.[0] || 'A';
      const responsesWithSet = { ...scanRes.responses, Set: [detectedSet] };

      const card = evalEngine.evaluateCandidate(
        scanRes.sheetId,
        `Camera_${toBengaliNumerals(new Date().toLocaleTimeString())}`,
        responsesWithSet,
        scanRes.concatenatedResponses,
        scanRes.flags
      );

      const rollStr = card.rollNumber || '';
      const strippedRoll = rollStr.replace(/^0+/, '') || rollStr;
      const matched = examInfo?.studentDir.get(rollStr) || examInfo?.studentDir.get(strippedRoll);
      if (matched) {
        card.studentId = matched.id;
        card.studentName = matched.name;
      }
      (card as any).examId = targetExamId;

      setScoreCards(prev => EvaluationEngine.rankCohort([...prev, card]));
      setSelectedScoreCard(card);
      setCameraFeedback(`সফলভাবে স্ক্যান হয়েছে! রোল: ${card.rollNumber || 'N/A'}, প্রাপ্ত নম্বর: ${card.totalScore}`);
    } catch (err: any) {
      console.error('Camera capture processing error:', err);
      setCameraFeedback('স্ক্যান সনাক্ত করা যায়নি। অনুগ্রহ করে আলো বাড়িয়ে সোজাভাবে ধরুন।');
    }
  };

  // Sync / Batch Submit to PostgreSQL DB
  const syncCohortToDatabase = async () => {
    if (scoreCards.length === 0) {
      alert('ডাটাবেসে পাঠানোর জন্য কোনো স্ক্যান ফলাফল নেই।');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    // Group scorecards by examId
    const groups: Record<string, StudentScoreCard[]> = {};
    scoreCards.forEach(c => {
      const eid = (c as any).examId || selectedExamId;
      if (!groups[eid]) groups[eid] = [];
      groups[eid].push(c);
    });

    let totalSaved = 0;
    let anyError = '';

    for (const [eId, cards] of Object.entries(groups)) {
      if (!eId) continue;
      try {
        const payload = {
          scans: cards.map(c => {
            const rawAns: Record<string, any> = {};
            if (c.questionVerdicts) {
              Object.entries(c.questionVerdicts).forEach(([k, v]) => {
                rawAns[k] = v.studentAnswer;
              });
            }
            return {
              sheetId: c.sheetId,
              rollNumber: c.rollNumber || '000000',
              examSet: c.examSet || 'A',
              totalScore: c.totalScore,
              maxScore: c.maxScore || 100,
              rawAnswers: rawAns,
              evaluatedAnswers: c.questionVerdicts || {},
              templateId: selectedPresetId,
              accuracyPercentage: c.percentage,
            };
          }),
        };

        const res = await fetch(`/api/exams/${eId}/omr-batch-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        totalSaved += data.count || cards.length;
      } catch (err: any) {
        console.error(`Sync error for exam ${eId}:`, err);
        anyError = err.message;
      }
    }

    setIsSyncing(false);
    if (totalSaved > 0) {
      setSyncStatus({
        success: true,
        message: `সফলভাবে ${totalSaved} টি ফলাফল ডাটাবেসে সেভ করা হয়েছে এবং শিক্ষার্থীদের ড্যাশবোর্ডে প্রকাশিত হয়েছে!`,
      });
    } else {
      setSyncStatus({
        success: false,
        message: `ডাটাবেস সিঙ্ক ব্যর্থ হয়েছে: ${anyError || 'Unknown error'}`,
      });
    }
  };

  // Filtered Cards
  const filteredScoreCards = scoreCards.filter(c => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.rollNumber.toLowerCase().includes(q) ||
      (c.studentName && c.studentName.toLowerCase().includes(q)) ||
      c.examSet.toLowerCase().includes(q) ||
      c.filename.toLowerCase().includes(q)
    );
  });

  // Analytics Metrics
  const totalScans = scoreCards.length;
  const avgScore = totalScans > 0 ? (scoreCards.reduce((acc, c) => acc + c.totalScore, 0) / totalScans).toFixed(2) : '0';
  const highestScore = totalScans > 0 ? Math.max(...scoreCards.map(c => c.totalScore)).toFixed(2) : '0';
  const passCount = scoreCards.filter(c => c.percentage >= 40).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <QrCode className="w-3 h-3" /> UNIVERSAL SCANNER
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white">
                স্মার্ট ইউনিভার্সাল OMR স্ক্যানার
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              কিউআর কোড ভিত্তিক স্বয়ংক্রিয় পরীক্ষা সনাক্তকরণ, ফোন ক্যামেরা স্ক্যান ও ইনস্ট্যান্ট রেজাল্ট সিঙ্ক
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {scoreCards.length > 0 && (
            <button
              onClick={syncCohortToDatabase}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>সিঙ্ক হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ডাটাবেসে পাবলিশ ({scoreCards.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/exams/print"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OMR প্রিন্ট ও টেমপ্লেট</span>
          </Link>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className={`px-4 sm:px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
          syncStatus.success ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-b border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{syncStatus.message}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs & Config Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>ব্যাচ আপলোড</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('camera');
                if (!isCameraActive) startCamera();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>লাইভ ক্যামেরা</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition relative ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ফলাফল ও খাতা ({scoreCards.length})</span>
              {scoreCards.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Exam & Template Selectors */}
          <div className="flex items-center gap-2">
            {/* Fallback Exam Selector (If Sheet Lacks QR) */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">ফলব্যাক পরীক্ষা:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none max-w-[160px] truncate cursor-pointer"
              >
                {examsList.map(e => (
                  <option key={e.id} value={e.id} className="bg-slate-900 text-white">
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Preset Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">টেমপ্লেট:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {PRESET_TEMPLATES.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab 1: Batch Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-900/40 hover:bg-slate-900/70 transition flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                OMR শিট ফাইল এখানে ড্রপ করুন অথবা নির্বাচন করুন
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                কিউআর কোড সম্বলিত যেকোনো ওএমআর শিটের একাধিক ছবি (JPEG/PNG) অথবা পিডিএফ ফাইল একসঙ্গে আপলোড করুন। স্বয়ংক্রিয়ভাবে পরীক্ষা ও সেট সনাক্ত হবে।
              </p>

              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>ফাইল সিলেক্ট করুন</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>

              {isProcessing && (
                <div className="mt-6 w-full max-w-md space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{statusMessage}</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            {scoreCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400">মোট পরীক্ষার্থী</div>
                  <div className="text-xl font-bold text-white mt-1">{toBengaliNumerals(totalScans)} জন</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400">গড় নম্বর</div>
                  <div className="text-xl font-bold text-indigo-400 mt-1">{toBengaliNumerals(avgScore)}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400">সর্বোচ্চ নম্বর</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{toBengaliNumerals(highestScore)}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400">উত্তীর্ণের হার</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {toBengaliNumerals(totalScans > 0 ? ((passCount / totalScans) * 100).toFixed(1) : 0)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex flex-col items-center justify-center min-h-[420px]">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-h-[540px] object-contain"
              />

              {/* Scanning Crosshair Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-96 border-2 border-indigo-400/60 rounded-xl relative">
                  <div className="absolute top-2 left-2 text-[10px] text-indigo-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">
                    ALIGN OMR SHEET
                  </div>
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/40 animate-pulse" />
                </div>
              </div>

              {/* Camera Controls Bar */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between bg-slate-950/80 backdrop-blur border border-slate-800/80 p-3 rounded-xl">
                <div className="text-xs text-slate-300 truncate max-w-[60%]">
                  {cameraFeedback || 'ক্যামেরা চালু আছে'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={captureFrameAndProcess}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>স্ক্যান করুন</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    বন্ধ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Results Cohort Table & Beautified OMR Inspection */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Roster List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="রোল, নাম বা সেট দিয়ে খুঁজুন..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono px-2">
                  {filteredScoreCards.length} টি
                </span>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredScoreCards.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
                    কোনো পরীক্ষার্থীর ফলাফল পাওয়া যায়নি
                  </div>
                ) : (
                  filteredScoreCards.map((card, idx) => (
                    <div
                      key={card.sheetId || idx}
                      onClick={() => setSelectedScoreCard(card)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        selectedScoreCard?.sheetId === card.sheetId
                          ? 'bg-indigo-600/15 border-indigo-500/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                          #{card.rank || idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>রোল: {card.rollNumber || 'N/A'}</span>
                            <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-300 rounded">
                              সেট {card.examSet || 'A'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {card.studentName || card.filename}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">
                          {toBengaliNumerals(card.totalScore)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          সঠিক: {card.correctCount} | ভুল: {card.incorrectCount}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Detailed OMR Card Inspection */}
            <div className="lg:col-span-7">
              {selectedScoreCard ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
                  {/* Candidate Header Banner */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          {selectedScoreCard.studentName || `শিক্ষার্থী রোল: ${selectedScoreCard.rollNumber}`}
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                          সেট {selectedScoreCard.examSet}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ফাইল: {selectedScoreCard.filename} • মেধা ক্রম: #{selectedScoreCard.rank}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400">
                        {toBengaliNumerals(selectedScoreCard.totalScore)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        মোট {toBengaliNumerals(selectedScoreCard.maxScore || Object.keys(selectedScoreCard.questionVerdicts || {}).length)} এর মধ্যে ({selectedScoreCard.percentage}%)
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-400 font-bold">সঠিক উত্তর</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.correctCount}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                      <div className="text-[10px] text-rose-400 font-bold">ভুল উত্তর</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.incorrectCount}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">অনুত্তরিত</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.unmarkedCount}</div>
                    </div>
                  </div>

                  {/* Beautified Question Answer Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
                      <span>প্রশ্নভিত্তিক বিস্তারিত মূল্যায়ন:</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        সবুজ: সঠিক • লাল: ভুল • ধূসর: অনুত্তরিত
                      </span>
                    </h3>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 max-h-[380px] overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      {Object.keys(selectedScoreCard.questionVerdicts || {}).map((qKey, qIdx) => {
                        const verdict = selectedScoreCard.questionVerdicts[qKey];
                        const isCorrect = verdict.verdict === 'correct';
                        const isWrong = verdict.studentAnswer && !isCorrect;
                        const isUnmarked = !verdict.studentAnswer;

                        return (
                          <div
                            key={qKey}
                            className={`p-1.5 rounded-lg border text-center transition ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : isWrong
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="text-[10px] font-mono text-slate-400 font-semibold">
                              Q{qIdx + 1}
                            </div>
                            <div className="text-xs font-bold mt-0.5">
                              {verdict.studentAnswer || '-'}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              সঠিক: {Array.isArray(verdict.correctAnswer) ? verdict.correctAnswer.join(',') : verdict.correctAnswer}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[360px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/20">
                  <Eye className="w-8 h-8 mb-2 text-slate-600" />
                  <p className="text-xs">
                    বামদিকের তালিকা থেকে যেকোনো পরীক্ষার্থীর কার্ড নির্বাচন করে ওএমআর শিট এবং বিস্তারিত প্রশ্নভিত্তিক ফলাফল দেখুন।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
