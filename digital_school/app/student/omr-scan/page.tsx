"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  RefreshCw,
  QrCode,
  Eye,
  FileText,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award
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

export default function StudentOMRScannerPage() {
  const router = useRouter();

  // Active Session & Student Info
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Template State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical_admission_100q');
  const [activeTemplate, setActiveTemplate] = useState<Template>(PRESET_TEMPLATES[0].template);
  const [parsedBubbles, setParsedBubbles] = useState<BubblePoint[]>([]);

  // Scan Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanProcessingResult | null>(null);
  const [scoreCard, setScoreCard] = useState<StudentScoreCard | null>(null);
  const [detectedExamMeta, setDetectedExamMeta] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode: Camera or File Upload
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFeedback, setCameraFeedback] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Submission & Sync State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Fetch student session profile
  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentStudent(data.user);
          }
        }
      } catch (e) {
        console.warn('Could not load user profile', e);
      } finally {
        setLoadingAuth(false);
      }
    }
    loadStudent();
  }, []);

  // Initialize Template
  useEffect(() => {
    const preset = PRESET_TEMPLATES.find(p => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
    setActiveTemplate(preset.template);
    const parsed = parseTemplate(preset.template);
    setParsedBubbles(parsed.bubbles);
  }, [selectedPresetId]);

  // Clean up Camera on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Fetch Exam Data & Questions for Evaluation
  const fetchExamEvaluationConfig = async (examId: string): Promise<{ exam: any; config: EvaluationConfig } | null> => {
    try {
      const res = await fetch(`/api/exams/${examId}?mode=omr`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const exam = data.exam || data;

      const multiSetKeys: Record<string, Record<string, string>> = {};
      const defaultKey: Record<string, string> = {};
      const examSets = Array.isArray(exam.examSets) ? exam.examSets : [];

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
        examSets.forEach((s: any) => {
          const rawName = String(s.name || 'A').replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
          const setKey = extractAnswers(s.questionsJson || []);
          multiSetKeys[rawName] = setKey;
          multiSetKeys[rawName.charAt(0)] = setKey;
          if (Object.keys(defaultKey).length === 0 || rawName === 'A') {
            Object.assign(defaultKey, setKey);
          }
        });
      }

      if (Object.keys(defaultKey).length === 0 && Array.isArray(exam.questions)) {
        Object.assign(defaultKey, extractAnswers(exam.questions));
      }

      const negMark = exam.mcqNegativeMarking !== undefined ? Number(exam.mcqNegativeMarking) : 0.25;

      const config: EvaluationConfig = {
        examName: exam.name || 'Exam',
        examCode: exam.id || 'EXAM',
        totalMarks: Number(exam.totalMarks) || 100,
        answerKey: defaultKey,
        multiSetAnswerKeys: multiSetKeys,
        rollNumberField: 'Roll',
        serialNumberField: 'Serial',
        setNameField: 'Set',
        markingSchemes: {
          default: { correct: 1.0, incorrect: -Math.abs(negMark), unmarked: 0, bonus: 1.0 },
        },
      };

      return { exam, config };
    } catch (e) {
      console.error('Fetch exam config error:', e);
      return null;
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      if (!isOpenCVLoaded()) {
        setStatusMessage('ক্যামেরা চালুর জন্য OMR ইঞ্জিন লোড হচ্ছে...');
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
      setCameraActive(true);
      setCameraFeedback('ক্যামেরা প্রস্তুত। ওএমআর শিট এবং কিউআর কোড ফ্রেমের মধ্যে সোজা রাখুন।');
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
    setCameraActive(false);
  };

  // Core Processing Function for an image canvas
  const processStudentCanvas = async (canvas: HTMLCanvasElement, filename: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setStatusMessage('ওএমআর শিট এবং কিউআর কোড বিশ্লেষণ চলছে...');

    try {
      if (!isOpenCVLoaded()) {
        setStatusMessage('কম্পিউটার ভিশন ইঞ্জিন লোড করা হচ্ছে...');
        await loadOpenCV();
      }

      // Step 1: Decode QR Code (with 4-angle rotation recovery: 0, 90, 180, 270 deg)
      const qr = scanQRCodeFromCanvas(canvas);
      const qrExamId = qr?.metadata?.examId || (qr as any)?.examId;
      const qrSet = qr?.metadata?.setName || qr?.metadata?.setId || (qr as any)?.setName;

      let examBundle: { exam: any; config: EvaluationConfig } | null = null;
      if (qrExamId) {
        examBundle = await fetchExamEvaluationConfig(qrExamId);
      }

      const evalConfig = examBundle?.config || {
        examName: 'Student OMR Exam',
        examCode: qrExamId || 'EXAM',
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

      // Step 2: Run OMR Engine (Perspective Homography + Concentric Dual-Radius Moments)
      const scanRes = await processOMR(
        canvas,
        activeTemplate,
        parsedBubbles,
        undefined,
        filename,
        { generateCanvases: false }
      );

      // Override / set detected Set from QR if available
      const detectedSet = qrSet || scanRes.responses['Set']?.[0] || 'A';
      const effectiveResponses = { ...scanRes.responses, Set: [detectedSet] };

      // Step 3: Evaluate Student Card
      const evalEngine = new EvaluationEngine(evalConfig);
      const card = evalEngine.evaluateCandidate(
        scanRes.sheetId,
        filename,
        effectiveResponses,
        scanRes.concatenatedResponses,
        scanRes.flags
      );

      // Link to logged-in student
      if (currentStudent) {
        card.studentId = currentStudent.studentProfile?.id || currentStudent.id;
        card.studentName = currentStudent.name;
        if (!card.rollNumber && currentStudent.studentProfile?.roll) {
          card.rollNumber = currentStudent.studentProfile.roll;
        }
      }

      (card as any).examId = qrExamId;

      setScanResult(scanRes);
      setScoreCard(card);
      setDetectedExamMeta(examBundle?.exam || null);
      setStatusMessage('ওএমআর সফলভাবে স্ক্যান ও মূল্যায়ন করা হয়েছে!');

      // Auto-submit submission to DB
      if (qrExamId) {
        await submitScoreToDatabase(card, qrExamId);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg('ওএমআর শিট সনাক্ত করা যায়নি। অনুগ্রহ করে আলো বাড়িয়ে সোজাভাবে পেপারের ছবি তুলুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture Frame from Camera
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (v.videoWidth === 0 || v.videoHeight === 0) return;

    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);

    processStudentCanvas(c, `Camera_${Date.now()}`);
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        processStudentCanvas(c, file.name);
      }
    };
    img.src = url;
  };

  // Submit Scorecard to PostgreSQL Database
  const submitScoreToDatabase = async (card: StudentScoreCard, examId: string) => {
    setIsSubmitting(true);
    try {
      const rawAns: Record<string, any> = {};
      if (card.questionVerdicts) {
        Object.entries(card.questionVerdicts).forEach(([k, v]) => {
          rawAns[k] = v.studentAnswer;
        });
      }

      const payload = {
        scans: [
          {
            sheetId: card.sheetId,
            rollNumber: card.rollNumber || currentStudent?.studentProfile?.roll || '000000',
            examSet: card.examSet || 'A',
            totalScore: card.totalScore,
            maxScore: card.maxScore || 100,
            rawAnswers: rawAns,
            evaluatedAnswers: card.questionVerdicts || {},
            templateId: selectedPresetId,
            accuracyPercentage: card.percentage,
          }
        ]
      };

      const res = await fetch(`/api/exams/${examId}/omr-batch-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmissionSuccess(true);
      }
    } catch (e) {
      console.warn('Auto sync error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/student/dashboard"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <QrCode className="w-3 h-3" /> STUDENT SCANNER
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white">
                আমার OMR শিট স্ক্যানার
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              ফোন ক্যামেরা অথবা ছবির মাধ্যমে তাৎক্ষণিক ওএমআর শিট স্ক্যান, স্বয়ংক্রিয় রেজাল্ট ও ব্যাখ্যা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detectedExamMeta?.id && (
            <Link
              href={`/exams/results/${detectedExamMeta.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>রেজাল্ট ও মেধা তালিকা</span>
            </Link>
          )}

          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            ড্যাশবোর্ড
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Submission Success Toast */}
        {submissionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>আপনার উত্তরপত্র সফলভাবে মূল্যায়ন হয়েছে এবং ড্যাশবোর্ডে রেজাল্ট যুক্ত করা হয়েছে!</span>
            </div>
            {detectedExamMeta?.id && (
              <Link
                href={`/exams/results/${detectedExamMeta.id}`}
                className="underline text-xs font-bold text-white hover:text-emerald-200"
              >
                বিস্তারিত দেখুন →
              </Link>
            )}
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Scanner Viewport Section */}
        {!scoreCard ? (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setScanMode('camera');
                    if (!cameraActive) startCamera();
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    scanMode === 'camera'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>ক্যামেরা স্ক্যান</span>
                </button>

                <button
                  onClick={() => {
                    setScanMode('upload');
                    stopCamera();
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    scanMode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>ছবি আপলোড</span>
                </button>
              </div>

              {/* Template Selector */}
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

            {/* Camera View */}
            {scanMode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex flex-col items-center justify-center min-h-[460px]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full max-h-[560px] object-contain"
                />

                {/* Framing Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-72 h-96 border-2 border-indigo-400/70 rounded-2xl relative shadow-2xl">
                    <div className="absolute top-2 left-2 text-[10px] text-indigo-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">
                      ALIGN OMR SHEET
                    </div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/50 animate-pulse" />
                  </div>
                </div>

                {/* Bottom Capture Controls */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between bg-slate-950/80 backdrop-blur border border-slate-800/80 p-3 rounded-xl">
                  <div className="text-xs text-slate-300 truncate max-w-[60%]">
                    {cameraFeedback || 'ওএমআর শিট ফ্রেমের মধ্যে সোজা রাখুন'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCaptureCamera}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>বিশ্লেষণ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>স্ক্যান করুন</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                    >
                      বন্ধ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload View */}
            {scanMode === 'upload' && (
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-12 text-center bg-slate-900/40 hover:bg-slate-900/70 transition flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  ওএমআর শিটের ছবি আপলোড করুন
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-6">
                  আপনার মোবাইল ফোন দিয়ে তোলা ওএমআর শিটের পরিষ্কার ছবি নির্বাচন করুন। স্বয়ংক্রিয়ভাবে কিউআর কোড ও বৃত্ত সনাক্ত হবে।
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>ছবি নির্বাচন করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>

                {isProcessing && (
                  <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Detailed Result & Beautified Question Matrix Card */
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Header Title & Score Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {detectedExamMeta?.name || 'মূল্যায়ন ফলাফল'}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                      সেট {scoreCard.examSet}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    শিক্ষার্থী: {scoreCard.studentName || 'Student'} • রোল: {scoreCard.rollNumber || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400">
                      {toBengaliNumerals(scoreCard.totalScore)}
                    </div>
                    <div className="text-xs text-slate-400">
                      মোট {toBengaliNumerals(scoreCard.maxScore || Object.keys(scoreCard.questionVerdicts || {}).length)} এর মধ্যে ({scoreCard.percentage}%)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setScoreCard(null);
                      setScanResult(null);
                      setSubmissionSuccess(false);
                      if (scanMode === 'camera') startCamera();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="নতুন স্ক্যান করুন"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-xs text-emerald-400 font-bold">সঠিক উত্তর</div>
                  <div className="text-xl font-bold text-white mt-1">{scoreCard.correctCount} টি</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-xs text-rose-400 font-bold">ভুল উত্তর</div>
                  <div className="text-xl font-bold text-white mt-1">{scoreCard.incorrectCount} টি</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                  <div className="text-xs text-slate-400 font-bold">অনুত্তরিত</div>
                  <div className="text-xl font-bold text-white mt-1">{scoreCard.unmarkedCount} টি</div>
                </div>
              </div>

              {/* Question Breakdown Matrix */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                  <span>প্রশ্নভিত্তিক বিস্তারিত ফলাফল ও ব্যাখ্যা:</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    সবুজ: সঠিক • লাল: ভুল • ধূসর: অনুত্তরিত
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {Object.keys(scoreCard.questionVerdicts || {}).map((qKey, qIdx) => {
                    const verdict = scoreCard.questionVerdicts[qKey];
                    const isCorrect = verdict.verdict === 'correct';
                    const isWrong = verdict.studentAnswer && !isCorrect;
                    const isUnmarked = !verdict.studentAnswer;

                    return (
                      <div
                        key={qKey}
                        className={`p-3 rounded-xl border transition ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                            : isWrong
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                          <span>Q{qIdx + 1}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-400' : (isWrong ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400')
                          }`}>
                            {isCorrect ? 'সঠিক' : (isWrong ? 'ভুল' : 'ছেড়েছেন')}
                          </span>
                        </div>
                        <div className="text-xs">
                          আপনার উত্তর: <strong className="text-white">{verdict.studentAnswer || '-'}</strong>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          সঠিক উত্তর: <strong className="text-emerald-400">{Array.isArray(verdict.correctAnswer) ? verdict.correctAnswer.join(',') : verdict.correctAnswer}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

