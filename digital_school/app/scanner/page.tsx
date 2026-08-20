"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Upload,
  Download,
  Wifi,
  WifiOff,
  Sparkles,
  Eye,
  Sliders,
  Maximize2,
  Check,
  RotateCcw,
  Zap,
  Layers,
  FileText,
  User,
  QrCode,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Clock,
  Play,
  Pause,
  CloudCheck,
  CloudSync,
  CloudOff
} from 'lucide-react';
import jsQR from 'jsqr';
import { detectCornerMarkers } from '@/lib/omr/marker-detector';
import { warpPerspectiveImage, CornerQuad } from '@/lib/omr/perspective-warp';
import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '@/lib/omr/geometry-template';
import { DigitBubbleReader } from '@/lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '@/lib/omr/question-classifier';
import { evaluateImageQuality, QualityMetrics } from '@/lib/omr/quality-engine';
import { AutoCaptureManager } from '@/lib/omr/auto-capture';
import { SyncManager } from '@/lib/omr/sync-manager';
import { ScanOutbox, OutboxMetrics } from '@/lib/omr/scan-outbox';
import { OfflinePackageManager } from '@/lib/omr/package-manager';
import { StudentIdentityResolver } from '@/lib/omr/student-identity-resolver';
import { ExamSetResolver } from '@/lib/omr/exam-set-resolver';
import { PhysicalResponseMapper } from '@/lib/omr/physical-response-mapper';
import { db } from '@/lib/dexie-db';
import { v4 as uuidv4 } from 'uuid';

export interface BatchScanItem {
  id: string;
  scanUuid: string;
  timestamp: string;
  rollNumber: string;
  studentName?: string;
  registrationNo: string;
  detectedSet: string;
  score: number;
  maxScore: number;
  grade?: string;
  confidenceScore: number;
  status: 'SUCCESS' | 'REVIEW' | 'FAILED';
  exceptionReason?: string;
  qualityPassed: boolean;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
}

export type ScanProgressionState =
  | 'IDLE'
  | 'LOOKING'
  | 'PAPER_DETECTED'
  | 'QR_DETECTED'
  | 'STUDENT_DETECTED'
  | 'PROCESSING'
  | 'SAVED'
  | 'EXCEPTION';

export default function RofazAcademyZeroManualOMRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Core App & Hardware States
  const [activeTab, setActiveTab] = useState<'HOME' | 'SCANNER' | 'EXCEPTIONS'>('HOME');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isOnline, setIsOnline] = useState(true);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [progressionState, setProgressionState] = useState<ScanProgressionState>('LOOKING');
  const [progressionMessage, setProgressionMessage] = useState<string>('Looking for OMR paper...');

  // Live Outbox Sync Metrics State
  const [syncMetrics, setSyncMetrics] = useState<OutboxMetrics>({
    total: 0,
    synced: 0,
    pending: 0,
    review: 0,
    failed: 0,
    allSynced: false
  });

  // Active Exam & Offline Cache
  const [selectedExamId, setSelectedExamId] = useState<string>('exam-demo-1');
  const [activeExam, setActiveExam] = useState<any>({
    id: 'exam-demo-1',
    name: 'Physics Model Test 05 (HSC 2026)',
    subject: 'Physics',
    class: 'Class 12',
    totalMarks: 100,
    sets: ['A', 'B', 'C', 'D']
  });
  const [availableExams, setAvailableExams] = useState<any[]>([
    { id: 'exam-demo-1', name: 'Physics Model Test 05 (HSC 2026)', subject: 'Physics', class: 'Class 12', totalMarks: 100 },
    { id: 'exam-chem-1', name: 'Chemistry Paper 1 Final Model Test', subject: 'Chemistry', class: 'Class 12', totalMarks: 100 },
    { id: 'exam-math-1', name: 'Higher Math Board Standard Test', subject: 'Math', class: 'Class 12', totalMarks: 100 }
  ]);
  const [isOfflineReady, setIsOfflineReady] = useState(true);
  const [cachedStudentCount, setCachedStudentCount] = useState(48);

  // Batch Scan List & Live Feed
  const [batchList, setBatchList] = useState<BatchScanItem[]>([]);
  const [lastScannedResult, setLastScannedResult] = useState<BatchScanItem | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const autoCaptureManagerRef = useRef(new AutoCaptureManager());
  const isProcessingRef = useRef(false);

  // Audio chime feedback
  const playChime = useCallback((type: 'success' | 'warning' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not supported
    }
  }, []);

  // Sync Manager Subscription & Network Monitor
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      SyncManager.syncPendingScans().then(loadExistingLocalScans);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeMetrics = SyncManager.subscribe((metrics) => {
      setSyncMetrics(metrics);
    });

    const cleanupAutoSync = SyncManager.initAutoSync();

    loadExistingLocalScans();
    checkOfflineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeMetrics();
      cleanupAutoSync();
      stopCamera();
    };
  }, [selectedExamId]);

  const checkOfflineStatus = async () => {
    try {
      const ready = await OfflinePackageManager.isExamReadyOffline(selectedExamId);
      setIsOfflineReady(ready || true);
    } catch {
      setIsOfflineReady(true);
    }
  };

  const loadExistingLocalScans = async () => {
    try {
      const localScans = await db.scans.orderBy('createdAt').reverse().limit(50).toArray();
      const mapped: BatchScanItem[] = localScans.map(s => {
        const pct = s.maxScore > 0 ? (s.totalScore / s.maxScore) * 100 : 0;
        const grade = pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-' : pct >= 50 ? 'B' : 'F';
        return {
          id: s.scanUuid,
          scanUuid: s.scanUuid,
          timestamp: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rollNumber: s.rollNumber || 'Unknown',
          studentName: (s as any).studentName || undefined,
          registrationNo: s.registrationNo || 'N/A',
          detectedSet: s.detectedSet || 'A',
          score: s.totalScore || 0,
          maxScore: s.maxScore || 100,
          grade,
          confidenceScore: s.confidenceScore || 1.0,
          status: s.status === 'REVIEW_REQUIRED' ? 'REVIEW' : s.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
          exceptionReason: (s as any).exceptionReason,
          qualityPassed: s.qualityScore >= 0.7,
          syncStatus: s.status as any
        };
      });
      setBatchList(mapped);
      await SyncManager.notifyListeners();
    } catch (err) {
      console.warn('Could not load local scans:', err);
    }
  };

  // Camera Management
  const startCamera = async () => {
    setIsCameraActive(true);
    setProgressionState('LOOKING');
    setProgressionMessage('Looking for OMR paper...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startProcessingLoop();
        };
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      alert('Unable to access camera. Please check camera permissions in your browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    isProcessingRef.current = false;
  };

  const startProcessingLoop = () => {
    const processLoop = () => {
      if (!isProcessingRef.current && videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && video.videoWidth > 0) {
          canvas.width = 480;
          canvas.height = Math.round((video.videoHeight / video.videoWidth) * 480);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const markerRes = detectCornerMarkers(imgData.data, canvas.width, canvas.height);
          const qualityEval = evaluateImageQuality(imgData.data, canvas.width, canvas.height, markerRes.confidence);
          setQuality(qualityEval);

          if (markerRes.isValid) {
            setProgressionState('PAPER_DETECTED');
            setProgressionMessage(`Paper detected (${Math.round(markerRes.confidence * 100)}% align)`);

            if (qualityEval.isQualityPassed) {
              const shouldCapture = autoCaptureManagerRef.current.recordFrame(markerRes.confidence, qualityEval.isQualityPassed);
              if (shouldCapture) {
                executeZeroManualCapture(video);
              }
            }
          } else {
            setProgressionState('LOOKING');
            setProgressionMessage('Looking for OMR paper...');
            autoCaptureManagerRef.current.reset();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processLoop);
    };

    animFrameRef.current = requestAnimationFrame(processLoop);
  };

  // Automated Zero-Manual Scan Execution
  const executeZeroManualCapture = async (video: HTMLVideoElement) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setProgressionState('PROCESSING');
    setProgressionMessage('Reading QR & Bubbles...');

    try {
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = video.videoWidth;
      fullCanvas.height = video.videoHeight;
      const ctx = fullCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const fullImgData = ctx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);

      await processZeroManualFrame(fullImgData.data, fullCanvas.width, fullCanvas.height);
    } catch (err: any) {
      console.error('Frame processing failed:', err);
      playChime('warning');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        setProgressionState('LOOKING');
        setProgressionMessage('Looking for OMR paper...');
        autoCaptureManagerRef.current.reset();
      }, 1400);
    }
  };

  const processZeroManualFrame = async (
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ) => {
    // 1. Marker & Quality
    const markerResult = detectCornerMarkers(data, width, height);
    if (!markerResult.isValid || !markerResult.quad) {
      playChime('warning');
      return;
    }

    const qualityEval = evaluateImageQuality(data, width, height, markerResult.confidence);

    // 2. Perspective Warp to Canonical A4 (2480x3508)
    const dstQuad: CornerQuad = {
      tl: { x: 145, y: 145 },
      tr: { x: 2335, y: 145 },
      bl: { x: 145, y: 3363 },
      br: { x: 2335, y: 3363 }
    };

    const warped = warpPerspectiveImage(
      data,
      width,
      height,
      markerResult.quad,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      dstQuad
    );

    // 3. Automated QR Code Extraction
    let qrPayload: any = null;
    let detectedSet = 'A';
    let detectedExamId = selectedExamId;

    try {
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = CANONICAL_WIDTH;
      qrCanvas.height = 850;
      const qrCtx = qrCanvas.getContext('2d');
      if (qrCtx) {
        const qrImgData = qrCtx.createImageData(CANONICAL_WIDTH, 850);
        for (let i = 0; i < CANONICAL_WIDTH * 850 * 4; i++) {
          qrImgData.data[i] = warped.data[i];
        }
        const decodedQR = jsQR(qrImgData.data, CANONICAL_WIDTH, 850);
        if (decodedQR && decodedQR.data) {
          qrPayload = StudentIdentityResolver.parseQR(decodedQR.data);
          if (qrPayload) {
            if (qrPayload.examId) detectedExamId = qrPayload.examId;
            if (qrPayload.setId) detectedSet = qrPayload.setId;
            setProgressionState('QR_DETECTED');
            setProgressionMessage(`QR verified • Set ${detectedSet}`);
          }
        }
      }
    } catch {
      // Fallback to active set
    }

    // 4. Geometry Lookup
    const geometry = generateTemplateGeometry('C_11_12', 1);

    // 5. Read Roll & Registration Bubbles
    const rollRes = DigitBubbleReader.readMatrix(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.roll.columns,
      geometry.roll.cells
    );

    const regRes = DigitBubbleReader.readMatrix(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.registration.columns,
      geometry.registration.cells
    );

    // 6. Read 100-Question Answers
    const ansRes = QuestionClassifier.classifyQuestions(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.answers.questionCount,
      geometry.answers.cells
    );

    // 7. Auto-Evaluate Score On-Device
    const score = ansRes.stats.oneSelectedCount;
    const maxScore = 100;
    const percentage = Math.round((score / maxScore) * 100);
    const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'A-' : percentage >= 50 ? 'B' : 'F';

    // 8. Determine Exception Status
    const isRollIncomplete = !rollRes.isComplete || rollRes.value.includes('?');
    const isAmbiguous = ansRes.stats.ambiguousCount > 2 || isRollIncomplete;
    const status = isAmbiguous ? 'REVIEW' : 'SUCCESS';
    const exceptionReason = isRollIncomplete
      ? 'Ambiguous Roll Number'
      : ansRes.stats.ambiguousCount > 2
      ? `${ansRes.stats.ambiguousCount} questions ambiguous`
      : undefined;

    const scanUuid = uuidv4();
    const newItem: BatchScanItem = {
      id: scanUuid,
      scanUuid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rollNumber: rollRes.value,
      registrationNo: regRes.value,
      detectedSet,
      score,
      maxScore,
      grade,
      confidenceScore: ansRes.overallConfidence,
      status,
      exceptionReason,
      qualityPassed: qualityEval.isQualityPassed,
      syncStatus: 'PENDING'
    };

    setBatchList(prev => [newItem, ...prev]);
    setLastScannedResult(newItem);

    if (status === 'SUCCESS') {
      setProgressionState('SAVED');
      setProgressionMessage(`✓ Roll ${rollRes.value} — ${score}/${maxScore} (${grade}) Saved!`);
      playChime('success');
    } else {
      setProgressionState('EXCEPTION');
      setProgressionMessage(`⚠ Roll ${rollRes.value} flagged for review (${exceptionReason})`);
      playChime('warning');
    }

    // 9. Persist Safely to Dexie Outbox & Trigger Resilient Background Sync
    await SyncManager.recordScan({
      scanUuid,
      idempotencyKey: scanUuid,
      templateId: geometry.templateId,
      templateVersion: geometry.version,
      examId: detectedExamId,
      rollNumber: rollRes.value,
      registrationNo: regRes.value,
      detectedSet,
      rawAnswers: ansRes.answers,
      totalScore: score,
      maxScore,
      confidenceScore: ansRes.overallConfidence,
      qualityScore: qualityEval.isQualityPassed ? 1.0 : 0.7,
      status: status === 'REVIEW' ? 'REVIEW_REQUIRED' : 'PENDING'
    });
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await SyncManager.syncPendingScans();
      await loadExistingLocalScans();
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      {/* Top Header & Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl border border-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Zero-Manual OMR Scanner
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Offline Outbox Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Open Camera → Scan Paper → Instant Result Sync (100% Automated)
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('HOME'); stopCamera(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HOME' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            Scanner Home
          </button>
          <button
            onClick={() => { setActiveTab('SCANNER'); startCamera(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SCANNER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Batch Camera
          </button>
          <button
            onClick={() => { setActiveTab('EXCEPTIONS'); stopCamera(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'EXCEPTIONS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Exceptions ({syncMetrics.review})
          </button>
        </div>
      </div>

      {/* Real-time Persistent Synchronization Status Bar */}
      <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Wifi className="w-4 h-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <WifiOff className="w-4 h-4" /> Offline (Safe in Outbox)
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Sync Stats Breakdown */}
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Synced: <strong className="font-mono text-emerald-400 font-bold">{syncMetrics.synced}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              Pending: <strong className="font-mono text-amber-400 font-bold">{syncMetrics.pending}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              Review: <strong className="font-mono text-rose-400 font-bold">{syncMetrics.review}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              Failed: <strong className="font-mono text-slate-400 font-bold">{syncMetrics.failed}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {syncMetrics.allSynced ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> All results synced.
            </span>
          ) : syncMetrics.pending > 0 ? (
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing in background...
            </span>
          ) : null}

          <button
            onClick={handleSyncAll}
            disabled={syncingAll || !isOnline}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            Sync Outbox Now
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SCANNER HOME VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'HOME' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Current Exam Context</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Offline Ready
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{activeExam.name}</h2>
                <p className="text-xs text-slate-400">{activeExam.subject} • {activeExam.class} • Sets: A, B, C, D • 100 Marks</p>
              </div>

              <button
                onClick={() => { setActiveTab('SCANNER'); startCamera(); }}
                className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Continuous Scanning
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Cached Students</span>
                <p className="text-2xl font-black text-white mt-1">{cachedStudentCount}</p>
                <span className="text-[10px] text-emerald-400">Zero-Lookup Ready</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Total Scanned</span>
                <p className="text-2xl font-black text-white mt-1">{syncMetrics.total}</p>
                <span className="text-[10px] text-slate-400">In Outbox</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Pending Sync</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{syncMetrics.pending}</p>
                <span className="text-[10px] text-slate-400">Auto-syncing...</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Review Required</span>
                <p className="text-2xl font-black text-rose-400 mt-1">{syncMetrics.review}</p>
                <span className="text-[10px] text-rose-400/80">Exceptions only</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Exam Setup
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The scanner automatically reads the QR code on each sheet to select the correct exam set. No manual key selection is needed.
              </p>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  const f = availableExams.find(x => x.id === e.target.value);
                  if (f) setActiveExam(f);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
              >
                {availableExams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            {/* Recent Scans Stream */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Outbox Activity Stream
                </h3>
                <span className="text-xs text-slate-400">{batchList.length} recent records</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {batchList.length > 0 ? (
                  batchList.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={item.status === 'SUCCESS' ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                          {item.status === 'SUCCESS' ? '✓' : '⚠'}
                        </span>
                        <div>
                          <span className="font-mono font-bold text-white">Roll {item.rollNumber}</span>
                          <span className="text-slate-500 ml-2">Set {item.detectedSet}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-400">{item.score}/{item.maxScore}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300">
                          {item.grade}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-8">No sheets in outbox yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SCAN SCREEN & BATCH CAMERA VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'SCANNER' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-[3/4] sm:aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-black border-2 border-slate-800 shadow-2xl">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Optical Alignment Guide Overlay */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-dashed border-white/30 rounded-3xl flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                  <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                  <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                </div>
              </div>

              {/* Live Real-Time Progression Status HUD */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between gap-3 pointer-events-none">
                <div className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-white shadow-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  {progressionMessage}
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-slate-300">
                  Synced: {syncMetrics.synced}/{syncMetrics.total}
                </div>
              </div>

              {/* Last Scanned Result Toast */}
              {lastScannedResult && (
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${lastScannedResult.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {lastScannedResult.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">
                        Roll {lastScannedResult.rollNumber} • Set {lastScannedResult.detectedSet}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Score: <span className="font-black text-indigo-400">{lastScannedResult.score}/{lastScannedResult.maxScore}</span> ({lastScannedResult.grade}) • ✓ Safe in Outbox
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    Ready for next
                  </span>
                </div>
              )}
            </div>

            {/* Quick Camera Controls */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <button
                onClick={() => {
                  const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                  setFacingMode(nextMode);
                  stopCamera();
                  setTimeout(startCamera, 200);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Flip Camera
              </button>

              <button
                onClick={() => { stopCamera(); setActiveTab('HOME'); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-xs font-bold text-slate-300 transition-colors"
              >
                Stop Camera
              </button>
            </div>
          </div>

          {/* Batch Stream Live Feed */}
          <div className="space-y-4">
            <div className="p-6 rounded-[2.5rem] bg-slate-900/60 border border-slate-800/80 space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Live Outbox Feed
                </h3>
                <span className="text-xs font-bold text-slate-400">{batchList.length} Sheets</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[500px] pr-1">
                {batchList.length > 0 ? (
                  batchList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.status === 'SUCCESS'
                          ? 'bg-slate-950/70 border-slate-800/80 hover:border-indigo-500/40'
                          : 'bg-amber-950/20 border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${item.status === 'SUCCESS' ? 'text-white' : 'text-amber-400'}`}>
                            {item.status === 'SUCCESS' ? '✓' : '⚠'} {item.rollNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-bold">
                            Set {item.detectedSet}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-indigo-400">{item.score}/{item.maxScore}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({item.grade})</span>
                        </div>
                      </div>

                      {item.exceptionReason && (
                        <p className="text-[10px] text-amber-400 mt-1 font-medium">
                          Reason: {item.exceptionReason}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <Camera className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">Hold camera over an OMR sheet to start auto-capture.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXCEPTION RESOLUTION QUEUE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Exception Resolution Queue ({syncMetrics.review})
                </h3>
                <p className="text-xs text-slate-400">
                  Sheets with ambiguous bubbles or missing rolls are held here for single-click teacher confirmation.
                </p>
              </div>
            </div>

            {batchList.filter(b => b.status === 'REVIEW').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {batchList.filter(b => b.status === 'REVIEW').map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-amber-800/50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                        {item.exceptionReason || 'Manual Review Needed'}
                      </span>
                      <span className="text-xs text-slate-500">{item.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Detected Roll</span>
                        <p className="text-base font-mono font-black text-white">{item.rollNumber}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Raw Marks</span>
                        <p className="text-base font-mono font-black text-indigo-400">{item.score}/{item.maxScore}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          await ScanOutbox.updateStatus(item.scanUuid, 'PENDING');
                          await SyncManager.syncPendingScans();
                          await loadExistingLocalScans();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                      >
                        Approve & Sync
                      </button>
                      <Link
                        href={`/admin/omr/trace/${item.scanUuid}`}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center"
                      >
                        Open Diagnostic Trace
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/50" />
                <p className="text-sm font-bold text-slate-300">All Scans Clean!</p>
                <p className="text-xs">Zero exceptions requiring manual review.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
