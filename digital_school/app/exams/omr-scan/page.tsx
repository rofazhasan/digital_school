"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Upload,
  Camera,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ArrowLeft,
  Printer,
  Eye,
  EyeOff,
  Send,
  Zap,
  BarChart3,
  ShieldCheck,
  QrCode,
  Flashlight,
  Download,
  Trash2,
  Edit3,
  Database,
  Trophy,
  KeyRound,
  Smartphone,
} from 'lucide-react';

import type {
  Template,
  BubblePoint,
  ScanProcessingResult,
  StudentScoreCard,
  EvaluationConfig,
  AuditLogEntry,
} from '@/lib/omr/types';
import { PRESET_TEMPLATES, resolveTemplateByIdOrQR } from '@/lib/omr/presetTemplates';
import { parseTemplate } from '@/lib/omr/templateParser';
import { EvaluationEngine } from '@/lib/omr/evaluationEngine';
import { AnalyticsEngine } from '@/lib/omr/analyticsEngine';
import { processOMR } from '@/lib/omr/omrEngine';
import { scanQRCodeOffThread } from '@/lib/omr/omrWorkerClient';
import { OmrOfflineStore } from '@/lib/omr/omrOfflineStore';
import { loadOpenCV, isOpenCVLoaded } from '@/lib/omr/opencvLoader';
import { toBengaliNumerals } from '@/utils/numeralConverter';
import {
  StreamMotionAnalyzer,
  ScannerAudioHaptics,
  TorchController,
  DuplicateSuppressor,
} from '@/lib/omr/streamAutoScanner';
import { StudentOMRReportCardModal } from '@/app/components/omr/StudentOMRReportCardModal';
import { MeritListModal } from '@/app/components/omr/MeritListModal';
import { streamPdfPages } from '@/lib/omr/pdfLoader';
import { isNativeCapacitorRuntime, captureWithNativeDocumentScanner } from '@/lib/omr/nativeScanner';
import {
  buildRosterIndex,
  matchStudentByRollOrReg,
  sanitizeNumericId,
} from '@/lib/omr/studentIdentityMatcher';

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
  const routeParams = useParams();
  const routeExamId = typeof routeParams?.id === 'string' ? routeParams.id : Array.isArray(routeParams?.id) ? routeParams.id[0] || '' : '';

  const [examsList, setExamsList] = useState<Array<{ id: string; name: string; totalMarks?: number }>>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(routeExamId);

  const [examCache, setExamCache] = useState<
    Record<string, { exam: ExamMetadata; config: EvaluationConfig; studentDir: Map<string, { id: string; name: string }> }>
  >({});

  // Active Template
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical_admission_100q');
  const [activeTemplate, setActiveTemplate] = useState<Template>(PRESET_TEMPLATES[0].template);
  const [parsedBubbles, setParsedBubbles] = useState<BubblePoint[]>([]);

  // Batch & HITL Review State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ScanProcessingResult>>({});
  const [showMeritListModal, setShowMeritListModal] = useState<boolean>(false);
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  const [scannedMasterKeys, setScannedMasterKeys] = useState<Record<string, Record<string, string>>>({});
  const [masterKeySetTarget, setMasterKeySetTarget] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [autoReleaseResults, setAutoReleaseResults] = useState<boolean>(false);
  const [syncChunkProgress, setSyncChunkProgress] = useState<{ current: number; total: number } | null>(null);
  const [scanPhase, setScanPhase] = useState<'mcq' | 'cq'>('mcq');
  const [scanSpeedSps, setScanSpeedSps] = useState<number>(0);
  const [showAbsenteePanel, setShowAbsenteePanel] = useState<boolean>(false);
  const cancelBatchRef = useRef<boolean>(false);

  useEffect(() => {
    setIsNativeApp(isNativeCapacitorRuntime());
    try {
      const saved = localStorage.getItem('omr_scanned_master_keys_v1');
      if (saved) setScannedMasterKeys(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [correctionLogs, setCorrectionLogs] = useState<Record<string, AuditLogEntry[]>>({});
  const [scoreCards, setScoreCards] = useState<StudentScoreCard[]>([]);
  const [selectedScoreCard, setSelectedScoreCard] = useState<StudentScoreCard | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [reviewFilterOnly, setReviewFilterOnly] = useState<boolean>(false);
  const [showVisualSheet, setShowVisualSheet] = useState<boolean>(true);
  const [editingMeta, setEditingMeta] = useState<boolean>(false);
  const [draftRoll, setDraftRoll] = useState<string>('');
  const [draftReg, setDraftReg] = useState<string>('');
  const [draftSet, setDraftSet] = useState<string>('A');
  const [printingCard, setPrintingCard] = useState<StudentScoreCard | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'results' | 'analytics'>('upload');

  // DB Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [offlineRestoredCount, setOfflineRestoredCount] = useState<number>(0);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFeedback, setCameraFeedback] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [isAutoScanMode, setIsAutoScanMode] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [cameraMotionState, setCameraMotionState] = useState<'HAND_MOVING' | 'SETTLING' | 'STATIONARY'>('HAND_MOVING');
  const [sharpnessScore, setSharpnessScore] = useState<number>(0);
  const [arCornersLocked, setArCornersLocked] = useState<number>(0);
  const [flashGlow, setFlashGlow] = useState<boolean>(false);
  const [recentCapturePill, setRecentCapturePill] = useState<{ roll: string; score: number; set: string } | null>(null);

  const arCanvasRef = useRef<HTMLCanvasElement>(null);

  const motionAnalyzerRef = useRef<StreamMotionAnalyzer>(new StreamMotionAnalyzer(160, 120));
  const duplicateSuppressorRef = useRef<DuplicateSuppressor>(new DuplicateSuppressor());
  const lowResCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCapturingFrameRef = useRef<boolean>(false);
  const autoScanLoopRef = useRef<number | null>(null);

  // Initialize Template (supports ?preset=... and custom template handoff from /exams/omr-templates)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPreset = params.get('preset');
      if (urlPreset === 'custom') {
        const saved = localStorage.getItem('rofaz_active_omr_template');
        if (saved) {
          try {
            const customTpl = JSON.parse(saved) as Template;
            const parsed = parseTemplate(customTpl);
            setActiveTemplate(parsed.template);
            setParsedBubbles(parsed.bubbles);
            setStatusMessage(`কাস্টম OMR টেমপ্লেট লোড হয়েছে (${parsed.bubbles.length} বাবলস)`);
            return;
          } catch (err) {
            console.warn('Invalid custom OMR template in storage:', err);
          }
        }
      } else if (urlPreset) {
        const matched = PRESET_TEMPLATES.find(
          (p) => p.id === urlPreset || (p.aliases && p.aliases.includes(urlPreset))
        );
        if (matched && matched.id !== selectedPresetId) {
          setSelectedPresetId(matched.id);
          return;
        }
      }
    }
    const preset = PRESET_TEMPLATES.find((p) => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
    setActiveTemplate(preset.template);
    const parsed = parseTemplate(preset.template);
    setParsedBubbles(parsed.bubbles);
  }, [selectedPresetId]);

  // Preload OpenCV in background idle time
  useEffect(() => {
    if (typeof window !== 'undefined' && !isOpenCVLoaded()) {
      const timer = setTimeout(() => {
        loadOpenCV().catch((err) => console.debug('OpenCV background prefetch deferred:', err));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Restore any unsynced or recent batch from Offline IndexedDB Store on mount
  useEffect(() => {
    let mounted = true;
    OmrOfflineStore.loadAll().then((items) => {
      if (!mounted || items.length === 0) return;
      const restoredScans: Record<string, ScanProcessingResult> = {};
      const restoredPreviews: Record<string, string> = {};
      const restoredLogs: Record<string, AuditLogEntry[]> = {};
      const restoredCards: StudentScoreCard[] = [];

      items.forEach((it) => {
        restoredScans[it.sheetId] = it.scanResult as ScanProcessingResult;
        if (it.previewDataUrl) restoredPreviews[it.sheetId] = it.previewDataUrl;
        if (it.corrections?.length) restoredLogs[it.sheetId] = it.corrections;
        restoredCards.push(it.scoreCard);
      });

      const ranked = EvaluationEngine.rankCohort(restoredCards);
      setScanResults(restoredScans);
      setPreviewImages(restoredPreviews);
      setCorrectionLogs(restoredLogs);
      setScoreCards(ranked);
      setSelectedScoreCard(ranked[0] || null);
      setOfflineRestoredCount(items.filter((i) => !i.synced).length);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync draft meta inputs when selectedScoreCard changes
  useEffect(() => {
    if (selectedScoreCard) {
      setDraftRoll(selectedScoreCard.rollNumber || '');
      setDraftReg(selectedScoreCard.registrationNo || '');
      setDraftSet(selectedScoreCard.examSet || 'A');
      setEditingMeta(false);
    }
  }, [selectedScoreCard?.sheetId]);

  // Fetch list of available exams on mount
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/exams?limit=50', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.data || data?.exams || data;
          const list = Array.isArray(raw) ? raw : [];
          setExamsList(list.map((e: any) => ({ id: e.id, name: e.name || e.title || 'Exam', totalMarks: e.totalMarks })));
          if (routeExamId) {
            setSelectedExamId(routeExamId);
          } else if (list.length > 0 && !selectedExamId) {
            setSelectedExamId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch exams list:', err);
      }
    }
    loadExams();
  }, []);

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
      const mcqOnly = qList.filter(
        (q: any) => !q?.type || ['MCQ', 'SMCQ'].includes(String(q.type).toUpperCase())
      );
      mcqOnly.forEach((q: any, idx: number) => {
        const qKey = `q${idx + 1}`;
        let letter = '';
        if (q.correctAnswer) {
          const c = String(q.correctAnswer).trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(c)) letter = c;
          else if (['ক', 'খ', 'গ', 'ঘ', 'ঙ'].includes(c)) {
            const bnMap: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E' };
            letter = bnMap[c] || '';
          }
        }
        if (!letter && typeof q.correctOption === 'number') {
          letter = indexToLetter(q.correctOption);
        }
        if (!letter && Array.isArray(q.options)) {
          const cIdx = q.options.findIndex((opt: any) => opt?.isCorrect || opt?.correct);
          if (cIdx >= 0) letter = indexToLetter(cIdx);
        }
        if (letter) map[qKey] = letter;
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

    const rawNeg = data.mcqNegativeMarking !== undefined ? Math.abs(Number(data.mcqNegativeMarking)) : 0;
    const negMark = rawNeg > 1 ? rawNeg / 100 : rawNeg;

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
    setExamCache((prev) => ({ ...prev, [data.id]: entry }));
    return entry;
  }, []);

  const getExamData = useCallback(
    async (id: string) => {
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
    },
    [examCache, processAndCacheExam]
  );

  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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

  /**
   * Compresses an overlay canvas to a lightweight 640px-wide JPEG DataURL (~45KB)
   * so visual HITL Quality Review works across 200+ sheets without exhausting RAM.
   */
  const createCompactOverlayPreview = (overlayCanvas: HTMLCanvasElement): string | undefined => {
    try {
      if (overlayCanvas.width === 0 || overlayCanvas.height === 0) return undefined;
      const targetW = Math.min(680, overlayCanvas.width);
      const scale = targetW / overlayCanvas.width;
      const targetH = Math.round(overlayCanvas.height * scale);
      const thumb = document.createElement('canvas');
      thumb.width = targetW;
      thumb.height = targetH;
      const ctx = thumb.getContext('2d');
      if (!ctx) return undefined;
      ctx.drawImage(overlayCanvas, 0, 0, targetW, targetH);
      const dataUrl = thumb.toDataURL('image/jpeg', 0.68);
      thumb.width = 0;
      thumb.height = 0;
      return dataUrl;
    } catch {
      return undefined;
    }
  };

  /**
   * Core Single-Sheet Ingestion Pipeline (used by both Bulk Upload & Hands-Free Camera)
   */
  const ingestSingleSheetCanvas = async (
    canvas: HTMLCanvasElement,
    name: string
  ): Promise<{ scanRes: ScanProcessingResult; card: StudentScoreCard; previewUrl?: string; resolvedPresetId: string } | null> => {
    // 1. Off-Main-Thread Worker QR Decode
    const qr = await scanQRCodeOffThread(canvas);
    const qrExamId = qr?.metadata?.examId || (qr as any)?.examId;
    const qrSet = qr?.metadata?.setName || qr?.metadata?.setId || (qr as any)?.setName;
    const qrTemplateTag = qr?.metadata?.template;

    // 2. Auto-Switch Template Geometry if QR specifies a template ID!
    let effectiveTemplate = activeTemplate;
    let effectiveBubbles = parsedBubbles;
    let effectivePresetId = selectedPresetId;

    if (qrTemplateTag) {
      const resolved = await resolveTemplateByIdOrQR(qrTemplateTag);
      if (resolved) {
        effectiveTemplate = resolved.template;
        effectiveBubbles = parseTemplate(resolved.template).bubbles;
        effectivePresetId = resolved.presetId;
      }
    }

    const targetExamId = qrExamId || selectedExamId;
    const examInfo = await getExamData(targetExamId);

    const baseConfig: EvaluationConfig = examInfo?.config || {
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

    // Merge teacher-scanned Master Key sheets (takes precedence if DB key is empty or overridden)
    const hasMasterKeys = Object.keys(scannedMasterKeys).length > 0;
    const mergedMultiSet: Record<string, Record<string, string | string[]>> = {
      ...(baseConfig.multiSetAnswerKeys || {}),
    };
    if (hasMasterKeys) {
      Object.entries(scannedMasterKeys).forEach(([setCode, keyMap]) => {
        mergedMultiSet[setCode] = { ...(mergedMultiSet[setCode] || {}), ...keyMap };
      });
    }
    const primaryFallbackKey =
      Object.keys(baseConfig.answerKey || {}).length > 0
        ? baseConfig.answerKey
        : scannedMasterKeys['A'] || Object.values(scannedMasterKeys)[0] || {};

    const evalConfig: EvaluationConfig = {
      ...baseConfig,
      answerKey: primaryFallbackKey,
      multiSetAnswerKeys: mergedMultiSet,
      totalMarks:
        baseConfig.totalMarks ||
        Math.max(Object.keys(primaryFallbackKey).length, 100),
    };

    const tempOverlay = document.createElement('canvas');
    const scanRes = await processOMR(
      canvas,
      effectiveTemplate,
      effectiveBubbles,
      tempOverlay,
      name,
      { generateCanvases: false, preScannedQR: qr }
    );

    const previewUrl = createCompactOverlayPreview(tempOverlay);
    tempOverlay.width = 0;
    tempOverlay.height = 0;

    const evalEngine = new EvaluationEngine(evalConfig);
    const detectedSet = qrSet || scanRes.responses['Set']?.[0] || 'A';
    const normSet = ({ 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' } as Record<string, string>)[detectedSet] || detectedSet;
    const responsesWithSet = { ...scanRes.responses, Set: [normSet] };

    const card = evalEngine.evaluateCandidate(
      scanRes.sheetId,
      name,
      responsesWithSet,
      scanRes.concatenatedResponses,
      scanRes.flags
    );

    // Enforce strict numeric-only Roll & Registration + 3-tier fault-tolerant student recovery
    const rawReg = card.registrationNo || scanRes.concatenatedResponses['Registration'] || scanRes.concatenatedResponses['Reg'] || '';
    const qrRoll = qr.found && qr.parsedPayload?.rollNumber ? String(qr.parsedPayload.rollNumber) : '';
    const rawRoll =
      card.rollNumber && card.rollNumber !== 'UNKNOWN' && card.rollNumber !== 'N/A'
        ? card.rollNumber
        : qrRoll;

    const rollSan = sanitizeNumericId(rawRoll);
    const regSan = sanitizeNumericId(rawReg);
    if (rollSan.digits) card.rollNumber = rollSan.digits;
    if (regSan.digits) card.registrationNo = regSan.digits;

    if (examInfo?.exam?.students && examInfo.exam.students.length > 0) {
      const rosterIdx = buildRosterIndex(examInfo.exam.students);
      const matchRes = matchStudentByRollOrReg(rosterIdx, card.rollNumber, card.registrationNo);
      if (matchRes.student) {
        card.studentId = matchRes.student.id;
        card.studentName = matchRes.student.user?.name || `Roll ${matchRes.sanitizedRoll}`;
        if (matchRes.sanitizedRoll) card.rollNumber = matchRes.sanitizedRoll;
        if (matchRes.sanitizedReg) card.registrationNo = matchRes.sanitizedReg;
        if (matchRes.note) {
          card.flags = [...(card.flags || []), matchRes.note];
        }
      } else if (matchRes.matchMethod === 'AMBIGUOUS_CANDIDATES' && matchRes.ambiguousCandidates?.length) {
        (card as any).ambiguousCandidates = matchRes.ambiguousCandidates;
        card.needsReview = true;
        if (matchRes.note) {
          card.flags = [...(card.flags || []), matchRes.note];
        }
      }
    } else {
      const rollStr = card.rollNumber || '';
      const strippedRoll = rollStr.replace(/^0+/, '') || rollStr;
      const matched = examInfo?.studentDir.get(rollStr) || examInfo?.studentDir.get(strippedRoll);
      if (matched) {
        card.studentId = matched.id;
        card.studentName = matched.name;
      }
    }

    (card as any).examId = targetExamId;
    (card as any).templateId = effectivePresetId;

    return { scanRes, card, previewUrl, resolvedPresetId: effectivePresetId };
  };

  // Process Batch Files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage('ডকুমেন্ট প্রসেসিং এবং পেজ লোডিং শুরু হচ্ছে...');

    if (!isOpenCVLoaded()) {
      setStatusMessage('OMR v3 Vision ইঞ্জিন (OpenCV WASM) লোড হচ্ছে...');
      try {
        await loadOpenCV();
      } catch (cvErr: any) {
        setIsProcessing(false);
        setStatusMessage('OpenCV ইঞ্জিন লোড হতে ব্যর্থ হয়েছে: ' + cvErr.message);
        return;
      }
    }

    const newScanResults = { ...scanResults };
    const newPreviews = { ...previewImages };
    const newScoreCards: StudentScoreCard[] = [...scoreCards];

    let successCount = 0;
    let failCount = 0;
    let processedSoFar = 0;
    let estimatedTotal = files.length;
    cancelBatchRef.current = false;
    const batchStartMs = performance.now();

    const processSingleCanvasItem = async (canvas: HTMLCanvasElement, name: string) => {
      if (cancelBatchRef.current) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
      processedSoFar++;
      setProgress({ current: processedSoFar, total: Math.max(estimatedTotal, processedSoFar) });
      const elapsedSec = Math.max(0.1, (performance.now() - batchStartMs) / 1000);
      setScanSpeedSps(parseFloat((processedSoFar / elapsedSec).toFixed(1)));
      await new Promise((r) => setTimeout(r, 4));
      try {
        const res = await ingestSingleSheetCanvas(canvas, name);
        if (res) {
          const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = res.scanRes;
          newScanResults[res.scanRes.sheetId] = leanScanRes as ScanProcessingResult;
          if (res.previewUrl) newPreviews[res.scanRes.sheetId] = res.previewUrl;
          newScoreCards.push(res.card);
          successCount++;

          await OmrOfflineStore.saveItem({
            sheetId: res.scanRes.sheetId,
            examId: (res.card as any).examId || selectedExamId,
            presetId: res.resolvedPresetId,
            timestamp: Date.now(),
            synced: false,
            previewDataUrl: res.previewUrl,
            scanResult: leanScanRes,
            scoreCard: res.card,
            corrections: [],
          });
        }
      } catch (err) {
        console.error(`Error scanning ${name}:`, err);
        failCount++;
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    };

    try {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          setStatusMessage(`PDF স্ট্রিমিং স্ক্যান চলছে: ${file.name}...`);
          await streamPdfPages(file, { dpi: 185 }, async (page, idx, total) => {
            if (idx === 0) estimatedTotal = estimatedTotal - 1 + total;
            const pageName = `${file.name.replace(/\.[^/.]+$/, '')}_p${page.pageNumber}`;
            await processSingleCanvasItem(page.canvas, pageName);
          });
        } else if (file.type.startsWith('image/')) {
          setStatusMessage(`ইমেজ স্ক্যান চলছে: ${file.name}...`);
          const img = await loadImageFromFile(file);
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
          await processSingleCanvasItem(c, file.name);
        }
      }
    } catch (err: any) {
      setStatusMessage('ফাইল প্রসেসিং ত্রুটি: ' + err.message);
      setIsProcessing(false);
      return;
    }

    if (processedSoFar === 0) {
      setIsProcessing(false);
      setStatusMessage('কোনো বৈধ OMR ইমেজ বা পিডিএফ পাওয়া যায়নি।');
      return;
    }

    const ranked = EvaluationEngine.rankCohort(newScoreCards);
    setScanResults(newScanResults);
    setPreviewImages(newPreviews);
    setScoreCards(ranked);
    if (ranked.length > 0 && !selectedScoreCard) setSelectedScoreCard(ranked[0]);
    setIsProcessing(false);
    setStatusMessage(`ব্যাচ স্ক্যান সম্পন্ন: ${successCount} টি সফল${failCount > 0 ? `, ${failCount} টি ত্রুটি` : ''}!`);
    setActiveTab('results');
    e.target.value = '';
  };

  // Scan Teacher's Filled Master Answer Key Sheet (No Manual Typing Needed!)
  const handleMasterKeyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage(`মাস্টার অ্যান্সার কী (Set ${masterKeySetTarget}) স্ক্যান করা হচ্ছে...`);
    try {
      if (!isOpenCVLoaded()) await loadOpenCV();
      let canvas: HTMLCanvasElement;
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        let firstCanvas: HTMLCanvasElement | null = null;
        await streamPdfPages(file, { dpi: 185, pages: [1] }, async (p) => {
          const clone = document.createElement('canvas');
          clone.width = p.canvas.width;
          clone.height = p.canvas.height;
          clone.getContext('2d')?.drawImage(p.canvas, 0, 0);
          firstCanvas = clone;
        });
        if (!firstCanvas) throw new Error('পিডিএফ থেকে প্রথম পেজ পাওয়া যায়নি।');
        canvas = firstCanvas;
      } else {
        const img = await loadImageFromFile(file);
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
      }

      const qr = await scanQRCodeOffThread(canvas);
      let effectiveTemplate = activeTemplate;
      let effectiveBubbles = parsedBubbles;
      if (qr.found && qr.parsedPayload?.template) {
        const resolved = await resolveTemplateByIdOrQR(qr.parsedPayload.template);
        if (resolved) {
          effectiveTemplate = resolved.template;
          effectiveBubbles = parseTemplate(resolved.template).bubbles;
        }
      }

      const scanRes = await processOMR(canvas, effectiveTemplate, effectiveBubbles, null, file.name, {
        generateCanvases: false,
        preScannedQR: qr,
      });
      canvas.width = 0;
      canvas.height = 0;

      const banglaToEng: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E' };
      const detectedSetRaw = scanRes.responses['Set']?.[0] || masterKeySetTarget;
      const resolvedSet = banglaToEng[detectedSetRaw] || detectedSetRaw.toUpperCase() || masterKeySetTarget;

      const extractedKey: Record<string, string> = {};
      Object.entries(scanRes.responses).forEach(([k, vals]) => {
        if (/^q\d+$/i.test(k) && vals && vals.length > 0) {
          const v = vals[0];
          extractedKey[k.toLowerCase()] = banglaToEng[v] || v.toUpperCase();
        }
      });

      const qCount = Object.keys(extractedKey).length;
      if (qCount === 0) {
        throw new Error('মাস্টার কী শিটে কোনো ভরাট প্রশ্ন পাওয়া যায়নি।');
      }

      const updated = { ...scannedMasterKeys, [resolvedSet]: extractedKey };
      setScannedMasterKeys(updated);
      try {
        localStorage.setItem('omr_scanned_master_keys_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setStatusMessage(`সফল! Set ${resolvedSet} এর ${qCount} টি প্রশ্নের মাস্টার অ্যান্সার কী লোড হয়েছে।`);
    } catch (err: any) {
      setStatusMessage('মাস্টার কী স্ক্যান ত্রুটি: ' + err.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Native Android/iOS Capacitor Document Scanner Capture
  const handleNativeDocumentScan = async () => {
    setIsProcessing(true);
    setStatusMessage('নেটিভ ডকুমেন্ট স্ক্যানার চালু হচ্ছে...');
    try {
      if (!isOpenCVLoaded()) await loadOpenCV();
      const captures = await captureWithNativeDocumentScanner(30);
      if (captures.length === 0) {
        setIsProcessing(false);
        return;
      }

      const newScanResults = { ...scanResults };
      const newPreviews = { ...previewImages };
      const newScoreCards: StudentScoreCard[] = [...scoreCards];
      let ok = 0;

      for (let i = 0; i < captures.length; i++) {
        setProgress({ current: i + 1, total: captures.length });
        const item = captures[i];
        try {
          const res = await ingestSingleSheetCanvas(item.canvas, item.name);
          if (res) {
            const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = res.scanRes;
            newScanResults[res.scanRes.sheetId] = leanScanRes as ScanProcessingResult;
            if (res.previewUrl) newPreviews[res.scanRes.sheetId] = res.previewUrl;
            newScoreCards.push(res.card);
            ok++;
            await OmrOfflineStore.saveItem({
              sheetId: res.scanRes.sheetId,
              examId: (res.card as any).examId || selectedExamId,
              presetId: res.resolvedPresetId,
              timestamp: Date.now(),
              synced: false,
              previewDataUrl: res.previewUrl,
              scanResult: leanScanRes,
              scoreCard: res.card,
              corrections: [],
            });
          }
        } finally {
          item.canvas.width = 0;
          item.canvas.height = 0;
        }
      }

      const ranked = EvaluationEngine.rankCohort(newScoreCards);
      setScanResults(newScanResults);
      setPreviewImages(newPreviews);
      setScoreCards(ranked);
      if (ranked.length > 0 && !selectedScoreCard) setSelectedScoreCard(ranked[0]);
      setStatusMessage(`নেটিভ স্ক্যান সম্পন্ন: ${ok} টি শিট মূল্যায়ন হয়েছে!`);
      setActiveTab('results');
    } catch (err: any) {
      setStatusMessage('নেটিভ স্ক্যান ত্রুটি: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera Controls
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
          height: { ideal: 1080 },
        },
      });
      activeStreamRef.current = stream;
      const torchSupported = await TorchController.isSupported(stream);
      setIsTorchSupported(torchSupported);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setActiveTab('camera');
      setCameraFeedback('ক্যামেরা প্রস্তুত। ওএমআর শিট ফ্রেমের নিচে রাখুন — স্বয়ংক্রিয়ভাবে স্ক্যান হবে!');
    } catch (err: any) {
      alert('ক্যামেরা চালু করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => t.stop());
      activeStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    if (autoScanLoopRef.current) {
      cancelAnimationFrame(autoScanLoopRef.current);
      autoScanLoopRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!activeStreamRef.current) return;
    const nextState = !isTorchOn;
    const ok = await TorchController.setTorch(activeStreamRef.current, nextState);
    if (ok) setIsTorchOn(nextState);
  };

  const triggerAutoCapture = async () => {
    if (isCapturingFrameRef.current || !videoRef.current) return;
    const v = videoRef.current;
    if (v.videoWidth === 0 || v.videoHeight === 0) return;

    isCapturingFrameRef.current = true;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) {
      isCapturingFrameRef.current = false;
      return;
    }
    ctx.drawImage(v, 0, 0);

    try {
      const res = await ingestSingleSheetCanvas(c, `Camera_${Date.now()}.jpg`);
      if (!res) return;

      const rollStr = res.card.rollNumber || '';
      const targetExamId = (res.card as any).examId || selectedExamId;
      const sheetFingerprint = `${targetExamId}_${res.card.examSet || 'A'}_${rollStr || res.scanRes.sheetId}`;

      if (!duplicateSuppressorRef.current.canCapture(sheetFingerprint)) {
        return;
      }
      duplicateSuppressorRef.current.recordCapture(sheetFingerprint);

      ScannerAudioHaptics.playSuccessChirp();
      setFlashGlow(true);
      setTimeout(() => setFlashGlow(false), 300);

      const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = res.scanRes;
      setScanResults((prev) => ({ ...prev, [res.scanRes.sheetId]: leanScanRes as ScanProcessingResult }));
      if (res.previewUrl) {
        setPreviewImages((prev) => ({ ...prev, [res.scanRes.sheetId]: res.previewUrl! }));
      }
      setScoreCards((prev) => EvaluationEngine.rankCohort([...prev, res.card]));
      setSelectedScoreCard(res.card);

      await OmrOfflineStore.saveItem({
        sheetId: res.scanRes.sheetId,
        examId: targetExamId,
        presetId: res.resolvedPresetId,
        timestamp: Date.now(),
        synced: false,
        previewDataUrl: res.previewUrl,
        scanResult: leanScanRes,
        scoreCard: res.card,
        corrections: [],
      });

      setRecentCapturePill({
        roll: res.card.rollNumber || 'N/A',
        score: res.card.totalScore,
        set: res.card.examSet || 'A',
      });
      setCameraFeedback(
        `✅ শিট #${toBengaliNumerals(scoreCards.length + 1)} স্ক্যান হয়েছে! রোল: ${res.card.rollNumber || 'N/A'} • সেট: ${res.card.examSet || 'A'} • নম্বর: ${res.card.totalScore}`
      );
    } catch (err) {
      console.error('Camera auto-capture error:', err);
    } finally {
      c.width = 0;
      c.height = 0;
      setTimeout(() => {
        isCapturingFrameRef.current = false;
      }, 450);
    }
  };

  useEffect(() => {
    if (!isCameraActive || activeTab !== 'camera') {
      if (autoScanLoopRef.current) {
        cancelAnimationFrame(autoScanLoopRef.current);
        autoScanLoopRef.current = null;
      }
      return;
    }

    if (!lowResCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 120;
      lowResCanvasRef.current = c;
    }

    const lowCanvas = lowResCanvasRef.current;
    const lowCtx = lowCanvas.getContext('2d', { willReadFrequently: true });
    let lastAnalysisTime = 0;

    const frameTick = (time: number) => {
      if (!isCameraActive || !videoRef.current) return;
      const v = videoRef.current;

      if (time - lastAnalysisTime >= 45 && v.videoWidth > 0 && v.videoHeight > 0 && lowCtx) {
        lastAnalysisTime = time;
        lowCtx.drawImage(v, 0, 0, 160, 120);
        const analysis = motionAnalyzerRef.current.analyzeFrame(lowCanvas);

        setCameraMotionState(analysis.motionState);
        setSharpnessScore(analysis.sharpnessScore);
        setArCornersLocked(analysis.cornersLocked || 0);

        // Draw Live AR Corner-Lock Quad Overlay
        if (arCanvasRef.current && videoRef.current) {
          const arC = arCanvasRef.current;
          const dw = videoRef.current.clientWidth || 640;
          const dh = videoRef.current.clientHeight || 480;
          if (arC.width !== dw || arC.height !== dh) {
            arC.width = dw;
            arC.height = dh;
          }
          const arCtx = arC.getContext('2d');
          if (arCtx) {
            arCtx.clearRect(0, 0, dw, dh);
            if (analysis.paperQuadNorm && analysis.paperQuadNorm.length === 4) {
              const pts = analysis.paperQuadNorm.map((p) => ({ x: p.x * dw, y: p.y * dh }));
              arCtx.save();
              arCtx.strokeStyle = analysis.isAutoCaptureReady ? '#34d399' : '#38bdf8';
              arCtx.fillStyle = analysis.isAutoCaptureReady ? 'rgba(52, 211, 153, 0.12)' : 'rgba(56, 189, 248, 0.08)';
              arCtx.lineWidth = 3;
              arCtx.beginPath();
              arCtx.moveTo(pts[0].x, pts[0].y);
              for (let k = 1; k < 4; k++) arCtx.lineTo(pts[k].x, pts[k].y);
              arCtx.closePath();
              arCtx.fill();
              arCtx.stroke();
              pts.forEach((pt) => {
                arCtx.beginPath();
                arCtx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
                arCtx.fillStyle = analysis.isAutoCaptureReady ? '#10b981' : '#38bdf8';
                arCtx.fill();
                arCtx.strokeStyle = '#ffffff';
                arCtx.lineWidth = 2;
                arCtx.stroke();
              });
              arCtx.restore();
            }
          }
        }

        if (analysis.motionDelta > 16.0) {
          duplicateSuppressorRef.current.onMotionSpikeDetected();
        }

        if (isAutoScanMode && analysis.isAutoCaptureReady && !isCapturingFrameRef.current) {
          triggerAutoCapture();
        }
      }
      autoScanLoopRef.current = requestAnimationFrame(frameTick);
    };

    autoScanLoopRef.current = requestAnimationFrame(frameTick);
    return () => {
      if (autoScanLoopRef.current) {
        cancelAnimationFrame(autoScanLoopRef.current);
        autoScanLoopRef.current = null;
      }
    };
  }, [isCameraActive, activeTab, isAutoScanMode, selectedExamId, activeTemplate, parsedBubbles]);

  /**
   * HITL (Human-in-the-Loop) Override: Edit Roll / Reg / Set or Question Answer with Audit Trail
   */
  const handleSaveMetaOverride = async () => {
    if (!selectedScoreCard) return;
    const cleanDraftRoll = sanitizeNumericId(draftRoll).digits;
    const cleanDraftReg = sanitizeNumericId(draftReg).digits;
    if (!cleanDraftRoll) {
      alert('রোল নম্বর অবশ্যই শুধুমাত্র সংখ্যা (0-9) হতে হবে!');
      return;
    }
    if (cleanDraftRoll !== draftRoll) setDraftRoll(cleanDraftRoll);
    if (cleanDraftReg !== draftReg) setDraftReg(cleanDraftReg);

    const sheetId = selectedScoreCard.sheetId;
    const targetExamId = (selectedScoreCard as any).examId || selectedExamId;
    const examInfo = await getExamData(targetExamId);

    const newLogs: AuditLogEntry[] = [...(correctionLogs[sheetId] || [])];
    if (cleanDraftRoll !== selectedScoreCard.rollNumber) {
      newLogs.push({
        id: `corr_${Date.now()}_roll`,
        timestamp: Date.now(),
        sheetId,
        field: 'Roll',
        previousValue: selectedScoreCard.rollNumber,
        newValue: cleanDraftRoll,
        reason: 'Manual HITL numeric Roll correction',
        operator: 'Teacher',
      });
    }
    if (draftSet !== selectedScoreCard.examSet) {
      newLogs.push({
        id: `corr_${Date.now()}_set`,
        timestamp: Date.now(),
        sheetId,
        field: 'Set',
        previousValue: selectedScoreCard.examSet,
        newValue: draftSet,
        reason: 'Manual HITL Set correction',
        operator: 'Teacher',
      });
    }

    const rawScan = scanResults[sheetId];
    let updatedCard: StudentScoreCard = {
      ...selectedScoreCard,
      rollNumber: cleanDraftRoll,
      registrationNo: cleanDraftReg || undefined,
      examSet: draftSet.trim().toUpperCase() || 'A',
      manualOverride: true,
      needsReview: false,
    };
    delete (updatedCard as any).ambiguousCandidates;

    // Re-evaluate against new Set if exam config is loaded
    if (examInfo?.config && rawScan) {
      const evalEngine = new EvaluationEngine(examInfo.config);
      const reEval = evalEngine.evaluateCandidate(
        sheetId,
        selectedScoreCard.filename,
        { ...rawScan.responses, Set: [updatedCard.examSet] },
        { ...rawScan.concatenatedResponses, Roll: updatedCard.rollNumber, Registration: updatedCard.registrationNo || '' },
        []
      );
      updatedCard = {
        ...reEval,
        rollNumber: updatedCard.rollNumber,
        registrationNo: updatedCard.registrationNo,
        examSet: updatedCard.examSet,
        manualOverride: true,
        needsReview: false,
      };
      (updatedCard as any).examId = targetExamId;
      (updatedCard as any).templateId = (selectedScoreCard as any).templateId || selectedPresetId;
    }

    const stripped = updatedCard.rollNumber.replace(/^0+/, '') || updatedCard.rollNumber;
    const matched = examInfo?.studentDir.get(updatedCard.rollNumber) || examInfo?.studentDir.get(stripped);
    if (matched) {
      updatedCard.studentId = matched.id;
      updatedCard.studentName = matched.name;
    }

    const nextCards = EvaluationEngine.rankCohort(
      scoreCards.map((c) => (c.sheetId === sheetId ? updatedCard : c))
    );
    const refreshed = nextCards.find((c) => c.sheetId === sheetId) || updatedCard;

    setCorrectionLogs((prev) => ({ ...prev, [sheetId]: newLogs }));
    setScoreCards(nextCards);
    setSelectedScoreCard(refreshed);
    setEditingMeta(false);

    if (rawScan) {
      await OmrOfflineStore.saveItem({
        sheetId,
        examId: targetExamId,
        presetId: (updatedCard as any).templateId || selectedPresetId,
        timestamp: Date.now(),
        synced: false,
        previewDataUrl: previewImages[sheetId],
        scanResult: rawScan,
        scoreCard: refreshed,
        corrections: newLogs,
      });
    }
  };

  /**
   * 1-Click Question Bubble Override (Cycles A -> B -> C -> D -> Blank)
   */
  const handleCycleQuestionOverride = async (qKey: string) => {
    if (!selectedScoreCard) return;
    const sheetId = selectedScoreCard.sheetId;
    const curVerdict = selectedScoreCard.questionVerdicts?.[qKey];
    if (!curVerdict) return;

    const hasFiveOptionBlock = Object.values(activeTemplate.fieldBlocks || {}).some(
      (b) => b.fieldType === 'QTYPE_MCQ5' || b.fieldType === 'QTYPE_MCQ5_RTL' || (b.bubbleValues && b.bubbleValues.length === 5)
    );
    const cycle = hasFiveOptionBlock ? ['A', 'B', 'C', 'D', 'E', ''] : ['A', 'B', 'C', 'D', ''];
    const curAns = (curVerdict.studentAnswer || '').toUpperCase();
    const nextIdx = (cycle.indexOf(curAns) + 1) % cycle.length;
    const nextAns = cycle[nextIdx];

    const targetExamId = (selectedScoreCard as any).examId || selectedExamId;
    const examInfo = await getExamData(targetExamId);
    const rawNegCycle = Math.abs(Number(examInfo?.exam?.mcqNegativeMarking ?? 0));
    const negMark = rawNegCycle > 1 ? rawNegCycle / 100 : rawNegCycle;

    const correctStr = Array.isArray(curVerdict.correctAnswer)
      ? String(curVerdict.correctAnswer[0] || '')
      : String(curVerdict.correctAnswer || '');

    let newVerdictType: 'correct' | 'incorrect' | 'unmarked' = 'unmarked';
    let newScore = 0;
    if (!nextAns) {
      newVerdictType = 'unmarked';
      newScore = 0;
    } else if (nextAns.toUpperCase() === correctStr.toUpperCase()) {
      newVerdictType = 'correct';
      newScore = 1.0;
    } else {
      newVerdictType = 'incorrect';
      newScore = -negMark;
    }

    const updatedVerdicts = {
      ...selectedScoreCard.questionVerdicts,
      [qKey]: {
        ...curVerdict,
        studentAnswer: nextAns,
        verdict: newVerdictType,
        score: newScore,
      },
    };

    let total = 0, corr = 0, incorr = 0, unm = 0;
    Object.values(updatedVerdicts).forEach((v) => {
      total += v.score;
      if (v.verdict === 'correct' || v.verdict === 'bonus') corr++;
      else if (v.verdict === 'unmarked') unm++;
      else incorr++;
    });
    total = parseFloat(total.toFixed(2));
    const maxS = selectedScoreCard.maxScore || Object.keys(updatedVerdicts).length || 100;
    const pct = maxS > 0 ? parseFloat(((total / maxS) * 100).toFixed(2)) : 0;

    const qNum = parseInt(qKey.replace(/\D/g, ''), 10) || undefined;
    const auditEntry: AuditLogEntry = {
      id: `corr_${Date.now()}_${qKey}`,
      timestamp: Date.now(),
      sheetId,
      field: qKey,
      previousValue: curAns,
      newValue: nextAns,
      reason: `Teacher HITL override on ${qKey.toUpperCase()}`,
      operator: 'Teacher',
    };
    (auditEntry as any).questionNo = qNum;

    const newLogs = [...(correctionLogs[sheetId] || []), auditEntry];
    const updatedCard: StudentScoreCard = {
      ...selectedScoreCard,
      totalScore: total,
      percentage: pct,
      correctCount: corr,
      incorrectCount: incorr,
      unmarkedCount: unm,
      questionVerdicts: updatedVerdicts,
      manualOverride: true,
      needsReview: false,
    };
    (updatedCard as any).examId = targetExamId;
    (updatedCard as any).templateId = (selectedScoreCard as any).templateId || selectedPresetId;

    const nextCards = EvaluationEngine.rankCohort(
      scoreCards.map((c) => (c.sheetId === sheetId ? updatedCard : c))
    );
    const refreshed = nextCards.find((c) => c.sheetId === sheetId) || updatedCard;

    setCorrectionLogs((prev) => ({ ...prev, [sheetId]: newLogs }));
    setScoreCards(nextCards);
    setSelectedScoreCard(refreshed);

    const rawScan = scanResults[sheetId];
    if (rawScan) {
      rawScan.responses = { ...rawScan.responses, [qKey]: nextAns ? [nextAns] : [] };
      await OmrOfflineStore.saveItem({
        sheetId,
        examId: targetExamId,
        presetId: (updatedCard as any).templateId || selectedPresetId,
        timestamp: Date.now(),
        synced: false,
        previewDataUrl: previewImages[sheetId],
        scanResult: rawScan,
        scoreCard: refreshed,
        corrections: newLogs,
      });
    }
  };

  // Clear Batch
  const handleClearBatch = async () => {
    if (!confirm('আপনি কি বর্তমান ব্যাচের সকল স্ক্যান ফলাফল মুছে ফেলতে চান?')) return;
    await OmrOfflineStore.clearAll();
    setScanResults({});
    setPreviewImages({});
    setCorrectionLogs({});
    setScoreCards([]);
    setSelectedScoreCard(null);
    setOfflineRestoredCount(0);
    setStatusMessage('সকল ব্যাচ ডেটা পরিষ্কার করা হয়েছে।');
  };

  // Export Cohort CSV
  const handleDownloadCSV = () => {
    if (scoreCards.length === 0) return;
    const csv = AnalyticsEngine.exportCohortToCSV(scoreCards);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_Cohort_Results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sync / Batch Submit to PostgreSQL DB
  const syncCohortToDatabase = async () => {
    if (scoreCards.length === 0) {
      alert('ডাটাবেসে পাঠানোর জন্য কোনো স্ক্যান ফলাফল নেই।');
      return;
    }

    if (duplicateRolls.size > 0) {
      const ok = confirm(
        `সতর্কতা: ব্যাচে ${duplicateRolls.size} টি ডুপ্লিকেট রোল নম্বর পাওয়া গেছে (${Array.from(duplicateRolls).join(', ')})। সংশোধন না করে পাবলিশ করলে পূর্বের নম্বর ওভাররাইট হতে পারে। তবুও এগিয়ে যেতে চান?`
      );
      if (!ok) {
        setActiveTab('results');
        return;
      }
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const groups: Record<string, StudentScoreCard[]> = {};
    scoreCards.forEach((c) => {
      const eid = (c as any).examId || selectedExamId;
      if (!groups[eid]) groups[eid] = [];
      groups[eid].push(c);
    });

    const CHUNK_SIZE = 25; // Scales smoothly to 500–2,000+ sheets with zero serverless timeout or 413 errors
    const totalChunksAll = Object.values(groups).reduce(
      (sum, arr) => sum + Math.ceil(arr.length / CHUNK_SIZE),
      0
    );
    let completedChunks = 0;
    setSyncChunkProgress({ current: 0, total: totalChunksAll });

    let totalSaved = 0;
    let anyError = '';

    for (const [eId, cards] of Object.entries(groups)) {
      if (!eId) continue;
      const totalExamChunks = Math.ceil(cards.length / CHUNK_SIZE);

      for (let chunkIdx = 0; chunkIdx < totalExamChunks; chunkIdx++) {
        const chunkCards = cards.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);
        const isFinalChunkForExam = chunkIdx === totalExamChunks - 1;

        const payload = {
          autoRelease: autoReleaseResults,
          skipRanking: !isFinalChunkForExam,
          scans: chunkCards.map((c) => {
            const rawScan = scanResults[c.sheetId];
            const rawAns: Record<string, any> = {};
            if (c.questionVerdicts) {
              Object.entries(c.questionVerdicts).forEach(([k, v]) => {
                rawAns[k] = v.studentAnswer;
              });
            }
            const cqObtainedStr = rawScan?.concatenatedResponses?.['ObtainedMarks'];
            const cqObtained = cqObtainedStr && !isNaN(Number(cqObtainedStr)) ? Number(cqObtainedStr) : undefined;
            const tplId = (c as any).templateId || selectedPresetId;

            return {
              sheetId: c.sheetId,
              idempotencyKey: `${eId}:${c.sheetId}:${(correctionLogs[c.sheetId] || []).length}`,
              rollNumber: sanitizeNumericId(c.rollNumber).digits || '000000',
              registrationNo:
                sanitizeNumericId(c.registrationNo || rawScan?.concatenatedResponses?.['Registration']).digits ||
                undefined,
              examSet: c.examSet || 'A',
              totalScore: c.totalScore,
              maxScore: c.maxScore || 100,
              isCQScript: Boolean(
                scanPhase === 'cq' ||
                c.isCQScript ||
                cqObtained !== undefined ||
                tplId === 'bangladesh_board_cq_top_sheet'
              ),
              obtainedMarksCQ: cqObtained,
              rawAnswers: rawAns,
              evaluatedAnswers: c.questionVerdicts || {},
              templateId: tplId,
              accuracyPercentage: c.percentage,
              qrFound: Boolean(rawScan?.qrResult?.found),
              markersDetected: rawScan?.markersDetected,
              skewAngle: rawScan?.skewAngle,
              qualityMetrics: rawScan?.qualityMetrics,
              corrections: (correctionLogs[c.sheetId] || []).map((log: any) => ({
                field: log.field,
                questionNo: log.questionNo,
                previousValue: log.previousValue,
                newValue: log.newValue,
                reason: log.reason,
              })),
            };
          }),
        };

        // Resilient chunk POST with up to 2 automatic retries
        let chunkOk = false;
        for (let attempt = 0; attempt < 3 && !chunkOk; attempt++) {
          try {
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
            totalSaved += data.count || chunkCards.length;
            await OmrOfflineStore.markSynced(chunkCards.map((c) => c.sheetId));
            chunkOk = true;
          } catch (err: any) {
            if (attempt === 2) {
              console.error(`Sync chunk ${chunkIdx + 1}/${totalExamChunks} failed for exam ${eId}:`, err);
              anyError = err.message;
            } else {
              await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
            }
          }
        }

        completedChunks++;
        setSyncChunkProgress({ current: completedChunks, total: totalChunksAll });
      }
    }

    if (totalSaved > 0 && !anyError) {
      setOfflineRestoredCount(0);
    }

    setSyncChunkProgress(null);
    setIsSyncing(false);
    if (totalSaved > 0) {
      setSyncStatus({
        success: true,
        message: autoReleaseResults
          ? `সফলভাবে ${totalSaved} টি খাতা ডাটাবেসে সাবমিট ও Auto-Release হয়েছে! শিক্ষার্থীরা এখন /exams/online-এ ফলাফল দেখতে পারবে।`
          : `সফলভাবে ${totalSaved} টি খাতার ExamSubmission তৈরি হয়েছে! সুপারঅ্যাডমিন /exams/evaluations থেকে রিভিউ ও রিলিজ করতে পারবেন।`,
      });
    } else {
      setSyncStatus({
        success: false,
        message: `ডাটাবেস সিঙ্ক ব্যর্থ হয়েছে: ${anyError || 'Unknown error'}`,
      });
    }
  };

  // Instant In-Memory Re-Grade of Entire Batch (e.g. after scanning a Master Key or switching Exam)
  const handleRegradeAllScannedSheets = async () => {
    if (scoreCards.length === 0) return;
    const examInfo = await getExamData(selectedExamId);
    const baseConfig: EvaluationConfig = examInfo?.config || {
      examName: 'General OMR Exam',
      examCode: selectedExamId || 'EXAM',
      totalMarks: 100,
      answerKey: {},
      multiSetAnswerKeys: {},
      rollNumberField: 'Roll',
      serialNumberField: 'Serial',
      setNameField: 'Set',
      markingSchemes: { default: { correct: 1.0, incorrect: -0.25, unmarked: 0, bonus: 1.0 } },
    };

    const mergedMultiSet: Record<string, Record<string, string | string[]>> = {
      ...(baseConfig.multiSetAnswerKeys || {}),
    };
    Object.entries(scannedMasterKeys).forEach(([setCode, keyMap]) => {
      mergedMultiSet[setCode] = { ...(mergedMultiSet[setCode] || {}), ...keyMap };
    });
    const primaryFallbackKey =
      Object.keys(baseConfig.answerKey || {}).length > 0
        ? baseConfig.answerKey
        : scannedMasterKeys['A'] || Object.values(scannedMasterKeys)[0] || {};

    const evalEngine = new EvaluationEngine({
      ...baseConfig,
      answerKey: primaryFallbackKey,
      multiSetAnswerKeys: mergedMultiSet,
      totalMarks: baseConfig.totalMarks || Math.max(Object.keys(primaryFallbackKey).length, 100),
    });

    const rosterIdx =
      examInfo?.exam?.students && examInfo.exam.students.length > 0
        ? buildRosterIndex(examInfo.exam.students)
        : null;

    const regraded = scoreCards.map((c) => {
      const rawScan = scanResults[c.sheetId];
      if (!rawScan) return c;
      const responsesWithSet = { ...rawScan.responses, Set: [c.examSet || 'A'] };
      const fresh = evalEngine.evaluateCandidate(
        c.sheetId,
        c.filename,
        responsesWithSet,
        rawScan.concatenatedResponses,
        rawScan.flags
      );
      fresh.rollNumber = c.rollNumber;
      fresh.registrationNo = c.registrationNo;
      fresh.studentId = c.studentId;
      fresh.studentName = c.studentName;
      if (rosterIdx) {
        const m = matchStudentByRollOrReg(rosterIdx, fresh.rollNumber, fresh.registrationNo);
        if (m.student) {
          fresh.studentId = m.student.id;
          fresh.studentName = m.student.user?.name || fresh.studentName;
        }
      }
      (fresh as any).examId = selectedExamId || (c as any).examId;
      (fresh as any).templateId = (c as any).templateId;
      return fresh;
    });

    const ranked = EvaluationEngine.rankCohort(regraded);
    setScoreCards(ranked);
    if (selectedScoreCard) {
      const updatedSel = ranked.find((r) => r.sheetId === selectedScoreCard.sheetId);
      if (updatedSel) setSelectedScoreCard(updatedSel);
    }
    setStatusMessage(`সফল! ${ranked.length} টি স্ক্যান করা খাতা নতুন অ্যান্সার কী দিয়ে পুনরায় মূল্যায়ন হয়েছে।`);
  };

  // Live Absentee & Missing-Sheet Reconciliation against Enrolled Class Roster
  const absenteeStats = useMemo(() => {
    const cached = selectedExamId ? examCache[selectedExamId] : null;
    const enrolled = cached?.exam?.students || [];
    if (!Array.isArray(enrolled) || enrolled.length === 0) {
      return { enrolledCount: 0, scannedMatchedCount: 0, absent: [] as typeof enrolled };
    }
    const scannedIds = new Set(scoreCards.map((c) => c.studentId).filter(Boolean));
    const scannedRolls = new Set(
      scoreCards.map((c) => sanitizeNumericId(c.rollNumber).digits).filter(Boolean)
    );
    const absent = enrolled.filter((st) => {
      if (scannedIds.has(st.id)) return false;
      const r = sanitizeNumericId(st.roll).digits;
      if (r && scannedRolls.has(r)) return false;
      return true;
    });
    return {
      enrolledCount: enrolled.length,
      scannedMatchedCount: enrolled.length - absent.length,
      absent,
    };
  }, [selectedExamId, examCache, scoreCards]);

  // Duplicate-Roll Collision Detector
  const duplicateRolls = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of scoreCards) {
      const r = (c.rollNumber || '').trim();
      if (r && r !== 'UNKNOWN' && r !== 'N/A') {
        counts.set(r, (counts.get(r) || 0) + 1);
      }
    }
    const dups = new Set<string>();
    counts.forEach((cnt, r) => {
      if (cnt > 1) dups.add(r);
    });
    return dups;
  }, [scoreCards]);

  // Filtered Cards
  const flaggedCount = useMemo(
    () =>
      scoreCards.filter(
        (c) => c.needsReview || (c.flags && c.flags.length > 0) || duplicateRolls.has((c.rollNumber || '').trim())
      ).length,
    [scoreCards, duplicateRolls]
  );

  const filteredScoreCards = useMemo(() => {
    return scoreCards.filter((c) => {
      const isDup = duplicateRolls.has((c.rollNumber || '').trim());
      if (reviewFilterOnly && !c.needsReview && (!c.flags || c.flags.length === 0) && !isDup) {
        return false;
      }
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        c.rollNumber.toLowerCase().includes(q) ||
        (c.registrationNo && c.registrationNo.toLowerCase().includes(q)) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        c.examSet.toLowerCase().includes(q) ||
        c.filename.toLowerCase().includes(q)
      );
    });
  }, [scoreCards, reviewFilterOnly, searchFilter, duplicateRolls]);

  const psychometrics = useMemo(() => AnalyticsEngine.computePsychometrics(scoreCards), [scoreCards]);

  const totalScans = scoreCards.length;
  const avgScore = totalScans > 0 ? psychometrics.averageScore.toFixed(2) : '0';
  const highestScore = totalScans > 0 ? psychometrics.highestScore.toFixed(2) : '0';
  const passCount = scoreCards.filter((c) => c.percentage >= 40).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/exams"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <QrCode className="w-3 h-3" /> OMR v3 ENGINE
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                স্মার্ট ইউনিভার্সাল OMR স্ক্যানার ও QC স্টুডিও
              </h1>
              {offlineRestoredCount > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Database className="w-3 h-3" /> {toBengaliNumerals(offlineRestoredCount)} আন-সিঙ্কড ড্রাফট
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              অটো-QR টেমপ্লেট সুইচ, ভিজ্যুয়াল HITL কারেকশন, অফলাইন রিকভারি ও তাৎক্ষণিক ডাটাবেস সিঙ্ক
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {scoreCards.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowMeritListModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/40 transition cursor-pointer"
                title="অফিসিয়াল মেধা তালিকা প্রিন্ট ও Styled Excel (.xlsx) এক্সপোর্ট"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">মেধা তালিকা / Excel</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="Excel CSV এক্সপোর্ট করুন"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>CSV</span>
              </button>

              <label
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-semibold text-slate-200 cursor-pointer select-none"
                title="চালু করলে ফলাফল সরাসরি /exams/online-এ প্রকাশিত হবে; বন্ধ থাকলে সুপারঅ্যাডমিন /exams/evaluations থেকে রিভিউ করে রিলিজ করবেন"
              >
                <input
                  type="checkbox"
                  checked={autoReleaseResults}
                  onChange={(e) => setAutoReleaseResults(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{autoReleaseResults ? 'অটো-রিলিজ: চালু' : 'সুপারঅ্যাডমিন রিভিউ'}</span>
              </label>

              <button
                type="button"
                onClick={syncCohortToDatabase}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {syncChunkProgress
                        ? `সিঙ্ক ${syncChunkProgress.current}/${syncChunkProgress.total} চাঙ্ক...`
                        : 'সিঙ্ক হচ্ছে...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {autoReleaseResults
                        ? `পাবলিশ ও রিলিজ (${scoreCards.length})`
                        : `সাবমিশন পাঠান (${scoreCards.length})`}
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          <Link
            href="/exams/omr-templates"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700/70 transition"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>টেমপ্লেট হাব</span>
          </Link>

          <Link
            href="/exams/print"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">প্রিন্ট</span>
          </Link>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`px-4 sm:px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            syncStatus.success
              ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-b border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{syncStatus.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus.success && (
              <Link
                href={autoReleaseResults ? '/exams/online' : '/exams/evaluations'}
                className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-bold"
              >
                {autoReleaseResults ? 'ফলাফল দেখুন (/exams/online)' : 'ইভ্যালুয়েশন খুলুন (/exams/evaluations)'}
              </Link>
            )}
            <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs & Config Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>ব্যাচ আপলোড</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                if (!isCameraActive) startCamera();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>লাইভ অটো-ক্যামেরা</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ফলাফল ও HITL রিভিউ ({scoreCards.length})</span>
              {flaggedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  {flaggedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>আইটেম অ্যানালিটিক্স</span>
            </button>
          </div>

          {/* Exam & Template Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">ফলব্যাক পরীক্ষা:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none max-w-[160px] truncate cursor-pointer"
              >
                {examsList.map((e) => (
                  <option key={e.id} value={e.id} className="bg-slate-900 text-white">
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">টেমপ্লেট:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none max-w-[200px] truncate cursor-pointer"
              >
                {PRESET_TEMPLATES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {scoreCards.length > 0 && (
              <button
                type="button"
                onClick={handleClearBatch}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                title="ব্যাচ পরিষ্কার করুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Phase Guided Workflow Bar: Phase 1 (MCQ OMR) → Phase 2 (CQ/SQ Top Cover Merge) */}
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">স্ক্যান ধাপ (Workflow):</span>
            <button
              type="button"
              onClick={() => {
                setScanPhase('mcq');
                if (selectedPresetId === 'bangladesh_board_cq_top_sheet') {
                  handlePresetChange('bangladesh_board_hsc');
                }
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                scanPhase === 'mcq'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              ১. MCQ OMR স্ক্যান
            </button>
            <span className="text-slate-600">→</span>
            <button
              type="button"
              onClick={() => {
                setScanPhase('cq');
                handlePresetChange('bangladesh_board_cq_top_sheet');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                scanPhase === 'cq'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
              }`}
            >
              ২. CQ/SQ টপ-কভার শিট স্ক্যান (মার্জ)
            </button>
          </div>
          <div className="text-[11px] text-slate-400">
            {scanPhase === 'cq'
              ? 'CQ কভার স্ক্যান করলে একই শিক্ষার্থীর MCQ নম্বরের সাথে CQ নম্বর স্বয়ংক্রিয়ভাবে যোগ হবে।'
              : 'রোল বা রেজি যেকোনো একটি সঠিক হলেই শিক্ষার্থী অটো-ম্যাচ হবে (শুধু সংখ্যা অনুমোদিত)।'}
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
                OMR শিট ফাইল এখানে আপলোড করুন (JPG, PNG বা মাল্টি-পেজ PDF)
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mb-6">
                কিউআর কোড থাকলে স্বয়ংক্রিয়ভাবে পরীক্ষা, সেট এবং কাস্টম টেমপ্লেট সনাক্ত হবে। প্রতিটি স্ক্যান স্বয়ংক্রিয়ভাবে অফলাইন মেমোরিতে সংরক্ষিত থাকে — রিফ্রেশ হলেও কোনো ডেটা হারাবে না।
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>ফাইল সিলেক্ট করুন (JPG/PNG/PDF)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>

                {isNativeApp && (
                  <button
                    type="button"
                    onClick={handleNativeDocumentScan}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Android ডকুমেন্ট স্ক্যানার</span>
                  </button>
                )}
              </div>

              {/* Teacher Master Answer Key Sheet Scanner Strip */}
              <div className="mt-6 w-full max-w-2xl p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      মাস্টার অ্যান্সার কী শিট স্ক্যান (No Typing Needed)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {Object.keys(scannedMasterKeys).length > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          সক্রিয় কী:{' '}
                          {Object.entries(scannedMasterKeys)
                            .map(([s, m]) => `Set ${s} (${Object.keys(m).length}Q)`)
                            .join(' • ')}
                        </span>
                      ) : (
                        'শিক্ষকের ভরাট করা ১টি মাস্টার OMR শিট স্ক্যান করেই সম্পূর্ণ ব্যাচ মূল্যায়ন করুন'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={masterKeySetTarget}
                    onChange={(e) => setMasterKeySetTarget(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-200"
                    title="টার্গেট সেট কোড"
                  >
                    <option value="A">Set A</option>
                    <option value="B">Set B</option>
                    <option value="C">Set C</option>
                    <option value="D">Set D</option>
                  </select>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition cursor-pointer">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>কী শিট স্ক্যান</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleMasterKeyUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                  {Object.keys(scannedMasterKeys).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setScannedMasterKeys({});
                        try {
                          localStorage.removeItem('omr_scanned_master_keys_v1');
                        } catch {
                          // ignore
                        }
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                      title="মাস্টার কী মুছুন"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
              </div>

              {isProcessing && (
                <div className="mt-6 w-full max-w-md space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate">{statusMessage}</span>
                    <span className="font-mono font-bold shrink-0 ml-2">
                      {progress.current} / {progress.total}
                      {scanSpeedSps > 0 ? ` (${scanSpeedSps} শিট/সে.)` : ''}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        cancelBatchRef.current = true;
                        setStatusMessage('ব্যাচ স্ক্যান থামানো হচ্ছে — ইতিমধ্যে স্ক্যান করা খাতাগুলো সংরক্ষিত থাকবে...');
                      }}
                      className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold cursor-pointer"
                    >
                      থামান (Stop Queue)
                    </button>
                  </div>
                </div>
              )}
            </div>

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
            <div
              className={`relative rounded-2xl overflow-hidden bg-black border transition-all duration-300 flex flex-col items-center justify-center min-h-[480px] ${
                flashGlow
                  ? 'ring-8 ring-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.85)] border-emerald-400 scale-[1.005]'
                  : 'border-slate-800'
              }`}
            >
              <video ref={videoRef} playsInline muted className="w-full max-h-[560px] object-contain" />
              {/* Live AR Corner-Lock Canvas HUD */}
              <canvas
                ref={arCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoScanMode(!isAutoScanMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur shadow-lg transition cursor-pointer ${
                      isAutoScanMode
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-900/80 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isAutoScanMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>{isAutoScanMode ? 'অটো-স্ট্রিম: চালু' : 'ম্যানুয়াল মোড'}</span>
                  </button>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur border ${
                      cameraMotionState === 'STATIONARY'
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : cameraMotionState === 'SETTLING'
                        ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                        : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    }`}
                  >
                    <span>
                      {cameraMotionState === 'STATIONARY'
                        ? '🎯 স্থির (লকড)'
                        : cameraMotionState === 'SETTLING'
                        ? '⏳ স্থির হচ্ছে...'
                        : '🖐️ হাত নড়ছে'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur border bg-slate-950/80 border-slate-700 text-slate-200 hidden md:flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${arCornersLocked === 4 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>AR Lock: {arCornersLocked}/4</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-[11px] text-slate-400">শার্পনেস:</span>
                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          sharpnessScore > 65 ? 'bg-emerald-400' : sharpnessScore > 35 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, sharpnessScore)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-white">{sharpnessScore}%</span>
                  </div>

                  {isTorchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl backdrop-blur border transition cursor-pointer ${
                        isTorchOn
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold backdrop-blur transition cursor-pointer"
                  >
                    বন্ধ
                  </button>
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                <div
                  className={`w-full max-w-xs sm:max-w-sm h-72 sm:h-96 border-2 rounded-2xl relative transition-all duration-200 ${
                    cameraMotionState === 'STATIONARY'
                      ? 'border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
                      : cameraMotionState === 'SETTLING'
                      ? 'border-sky-400/60'
                      : 'border-indigo-400/40'
                  }`}
                >
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                </div>
              </div>

              {recentCapturePill && (
                <div className="absolute top-16 inset-x-4 flex justify-center pointer-events-none">
                  <div className="bg-emerald-950/90 border border-emerald-400/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>রোল: {recentCapturePill.roll}</span>
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
                          সেট {recentCapturePill.set}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-medium">
                        প্রাপ্ত নম্বর: {toBengaliNumerals(recentCapturePill.score)} • অফলাইন সেভ সম্পন্ন
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 p-3 rounded-2xl shadow-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-slate-300 truncate max-w-[55%] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{cameraFeedback || 'ক্যামেরা চালু আছে'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-mono font-bold">
                      মোট: {toBengaliNumerals(scoreCards.length)} টি
                    </span>
                    <button
                      type="button"
                      onClick={triggerAutoCapture}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>ম্যানুয়াল স্ক্যান</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Results Cohort & Visual HITL Quality Control */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {/* Live Roster Attendance / Absentee Reconciliation + Instant Batch Re-Grade Bar */}
            {scoreCards.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {absenteeStats.enrolledCount > 0 && (
                    <>
                      <span className="text-slate-300">
                        মোট এনরোলড: <strong className="text-white">{toBengaliNumerals(absenteeStats.enrolledCount)}</strong>
                      </span>
                      <span className="text-emerald-400">
                        স্ক্যান সম্পন্ন: <strong>{toBengaliNumerals(absenteeStats.scannedMatchedCount)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAbsenteePanel((v) => !v)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          absenteeStats.absent.length > 0
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        অনুপস্থিত / বাকি: {toBengaliNumerals(absenteeStats.absent.length)} জন{' '}
                        {absenteeStats.absent.length > 0 ? (showAbsenteePanel ? '▲' : '▼') : '✓'}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRegradeAllScannedSheets}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="নতুন মাস্টার কী বা নির্বাচিত পরীক্ষার উত্তরপত্র দিয়ে সব খাতা তাৎক্ষণিক পুনরায় মূল্যায়ন করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পুনরায় মূল্যায়ন (Re-Grade)</span>
                  </button>
                </div>
              </div>
            )}

            {showAbsenteePanel && absenteeStats.absent.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200">
                    অনুপস্থিত / স্ক্যান না হওয়া পরীক্ষার্থী ({toBengaliNumerals(absenteeStats.absent.length)} জন)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = absenteeStats.absent
                        .map((st) => `রোল: ${st.roll} | ${st.user?.name || 'Student'} | রেজি: ${st.registrationNo || '-'}`)
                        .join('\n');
                      navigator.clipboard?.writeText(txt);
                      setStatusMessage(`${absenteeStats.absent.length} জন অনুপস্থিত শিক্ষার্থীর তালিকা কপি হয়েছে!`);
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold cursor-pointer"
                  >
                    তালিকা কপি করুন
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {absenteeStats.absent.map((st) => (
                    <span
                      key={st.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-mono"
                    >
                      {st.roll} — {st.user?.name || 'Student'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {duplicateRolls.size > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    ডুপ্লিকেট রোল কলিশন সতর্কতা: একই রোল নম্বর একাধিক শিটে পাওয়া গেছে —{' '}
                    <strong className="font-mono text-white">{Array.from(duplicateRolls).join(', ')}</strong> (পাবলিশের আগে রোল সংশোধন করুন)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewFilterOnly(true)}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  শুধু ফ্ল্যাগড দেখুন
                </button>
              </div>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Roster List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="রোল, রেজি, নাম বা সেট দিয়ে খুঁজুন..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReviewFilterOnly(false)}
                      className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                        !reviewFilterOnly ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      সকল ({scoreCards.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilterOnly(true)}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                        reviewFilterOnly
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" /> ফ্ল্যাগড ({flaggedCount})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    disabled={scoreCards.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> CSV
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {filteredScoreCards.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
                    কোনো পরীক্ষার্থীর ফলাফল পাওয়া যায়নি
                  </div>
                ) : (
                  filteredScoreCards.map((card, idx) => {
                    const hasFlags = card.needsReview || (card.flags && card.flags.length > 0);
                    return (
                      <div
                        key={card.sheetId || idx}
                        onClick={() => setSelectedScoreCard(card)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          selectedScoreCard?.sheetId === card.sheetId
                            ? 'bg-indigo-600/15 border-indigo-500/60'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                            #{card.rank || idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                              <span>রোল: {card.rollNumber || 'N/A'}</span>
                              <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded">
                                সেট {card.examSet || 'A'}
                              </span>
                              {duplicateRolls.has((card.rollNumber || '').trim()) && (
                                <span className="px-1.5 py-0.5 bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded text-[9px] font-bold">
                                  DUP
                                </span>
                              )}
                              {hasFlags && (
                                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px]">
                                  QC
                                </span>
                              )}
                              {card.manualOverride && (
                                <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[9px]">
                                  Edited
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {card.studentName || card.registrationNo || card.filename}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <div className="text-xs font-bold text-emerald-400">{toBengaliNumerals(card.totalScore)}</div>
                          <div className="text-[10px] text-slate-400">
                            ✓{card.correctCount} • ✕{card.incorrectCount}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Visual Sheet Overlay + HITL Override Inspector */}
            <div className="lg:col-span-8">
              {selectedScoreCard ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
                  {/* Candidate Header & Inline HITL Roll/Set Editor */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-2 flex-1">
                      {!editingMeta ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-white">
                              {selectedScoreCard.studentName || `শিক্ষার্থী রোল: ${selectedScoreCard.rollNumber}`}
                            </h2>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                              সেট {selectedScoreCard.examSet}
                            </span>
                            {selectedScoreCard.registrationNo && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                                রেজি: {selectedScoreCard.registrationNo}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingMeta(true)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> রোল/সেট সংশোধন
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrintingCard(selectedScoreCard)}
                              className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> স্কোরকার্ড প্রিন্ট
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            ফাইল: {selectedScoreCard.filename} • মেধা ক্রম: #{selectedScoreCard.rank} • যেকোনো প্রশ্নের কার্ডে ক্লিক করে উত্তর ম্যানুয়ালি সংশোধন (HITL Override) করতে পারবেন
                          </p>
                          {/* 1-Click Ambiguous Roll Disambiguation Bar */}
                          {Array.isArray((selectedScoreCard as any).ambiguousCandidates) &&
                            (selectedScoreCard as any).ambiguousCandidates.length > 0 && (
                              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5">
                                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>অস্পষ্ট রোল ({selectedScoreCard.rollNumber}) — নিচের সম্ভাব্য শিক্ষার্থী থেকে ১ ক্লিকে নির্বাচন করুন:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(selectedScoreCard as any).ambiguousCandidates.map((cand: any) => (
                                    <button
                                      key={cand.id}
                                      type="button"
                                      onClick={() => {
                                        setDraftRoll(cand.roll || '');
                                        setDraftReg(cand.registrationNo || '');
                                        setDraftSet(selectedScoreCard.examSet || 'A');
                                        setEditingMeta(true);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-600/30 border border-amber-400/50 text-amber-100 text-[11px] font-bold transition cursor-pointer"
                                    >
                                      রোল {cand.roll} — {cand.user?.name || 'Student'} (রেজি: {cand.registrationNo || '—'})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="flex flex-wrap items-end gap-2 bg-slate-950 p-3 rounded-xl border border-indigo-500/40">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">রোল নম্বর (৪ ডিজিট)</label>
                            <input
                              value={draftRoll}
                              inputMode="numeric"
                              maxLength={6}
                              onChange={(e) => setDraftRoll(e.target.value.replace(/\D/g, ''))}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-28 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">রেজিস্ট্রেশন (৬ ডিজিট)</label>
                            <input
                              value={draftReg}
                              inputMode="numeric"
                              maxLength={10}
                              onChange={(e) => setDraftReg(e.target.value.replace(/\D/g, ''))}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-36 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">সেট</label>
                            <select
                              value={draftSet}
                              onChange={(e) => setDraftSet(e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                            >
                              {['A', 'B', 'C', 'D'].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveMetaOverride}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                          >
                            সেভ করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMeta(false)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-emerald-400">
                        {toBengaliNumerals(selectedScoreCard.totalScore)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        পূর্ণমান {toBengaliNumerals(selectedScoreCard.maxScore || 100)} ({selectedScoreCard.percentage}%)
                      </div>
                    </div>
                  </div>

                  {/* Optical Quality Telemetry & Flags */}
                  {(() => {
                    const qm = scanResults[selectedScoreCard.sheetId]?.qualityMetrics;
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-2">
                          {qm && (
                            <>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                                Confidence: {Math.round((qm.averageConfidence || 0) * 100)}%
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded border font-semibold ${
                                  qm.isBlurry
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                }`}
                              >
                                Sharpness: {qm.sharpnessScore}/100 {qm.isBlurry ? '(Deconvolved)' : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {qm.alignmentMethod}
                              </span>
                            </>
                          )}
                          {(correctionLogs[selectedScoreCard.sheetId]?.length || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                              Audit Edits: {correctionLogs[selectedScoreCard.sheetId].length}
                            </span>
                          )}
                        </div>

                        {previewImages[selectedScoreCard.sheetId] && (
                          <button
                            type="button"
                            onClick={() => setShowVisualSheet(!showVisualSheet)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {showVisualSheet ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showVisualSheet ? 'শিট ইমেজ লুকান' : 'শিট ওভারলে দেখুন'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {selectedScoreCard.flags && selectedScoreCard.flags.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <AlertTriangle className="w-4 h-4" /> কোয়ালিটি অডিট নোট ({selectedScoreCard.flags.length}):
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {selectedScoreCard.flags.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Warped + Bubble-Annotated OMR Sheet Preview */}
                  {showVisualSheet && previewImages[selectedScoreCard.sheetId] && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex flex-col items-center">
                      <img
                        src={previewImages[selectedScoreCard.sheetId]}
                        alt="Aligned OMR Overlay"
                        className="max-h-[420px] w-auto object-contain rounded-lg"
                      />
                      <span className="text-[10px] text-slate-400 mt-1.5">
                        সবুজ বক্স: বৈধ ভরাট • লাল বক্স: ডাবল মার্ক • হলুদ বক্স: অস্পষ্ট/ইরেজার দাগ
                      </span>
                    </div>
                  )}

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-400 font-bold">সঠিক উত্তর</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.correctCount}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                      <div className="text-[10px] text-rose-400 font-bold">ভুল / মাল্টি-মার্ক</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.incorrectCount}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-center">
                      <div className="text-[10px] text-slate-400 font-bold">অনুত্তরিত</div>
                      <div className="text-base font-bold text-white mt-0.5">{selectedScoreCard.unmarkedCount}</div>
                    </div>
                  </div>

                  {/* Interactive Question Answer Grid (Click any tile to override!) */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
                      <span>প্রশ্নভিত্তিক বিস্তারিত মূল্যায়ন (ক্লিক করে সংশোধনযোগ্য):</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        সবুজ: সঠিক • লাল: ভুল • ধূসর: অনুত্তরিত
                      </span>
                    </h3>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-[360px] overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      {Object.keys(selectedScoreCard.questionVerdicts || {}).map((qKey, qIdx) => {
                        const verdict = selectedScoreCard.questionVerdicts[qKey];
                        const isCorrect = verdict.verdict === 'correct' || verdict.verdict === 'bonus';
                        const isWrong = Boolean(verdict.studentAnswer) && !isCorrect;

                        return (
                          <button
                            key={qKey}
                            type="button"
                            onClick={() => handleCycleQuestionOverride(qKey)}
                            title="ক্লিক করে উত্তর পরিবর্তন করুন (A → B → C → D → Blank)"
                            className={`p-1.5 rounded-lg border text-center transition cursor-pointer hover:scale-[1.03] ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : isWrong
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <div className="text-[10px] font-mono text-slate-400 font-semibold">Q{qIdx + 1}</div>
                            <div className="text-xs font-bold mt-0.5">{verdict.studentAnswer || '-'}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              সঠিক: {Array.isArray(verdict.correctAnswer) ? verdict.correctAnswer.join(',') : verdict.correctAnswer}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[360px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/20">
                  <Eye className="w-8 h-8 mb-2 text-slate-600" />
                  <p className="text-xs">
                    বামদিকের তালিকা থেকে যেকোনো পরীক্ষার্থীর কার্ড নির্বাচন করে ভিজ্যুয়াল ওএমআর শিট ও প্রশ্নভিত্তিক ফলাফল দেখুন।
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Tab 4: Cohort Psychometrics & Item Analysis */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {scoreCards.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                অ্যানালিটিক্স দেখার জন্য প্রথমে অন্তত ১টি OMR শিট স্ক্যান করুন।
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">মোট পরীক্ষার্থী</div>
                    <div className="text-xl font-bold text-white mt-1">{psychometrics.totalCandidates}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">গড় নম্বর (Mean)</div>
                    <div className="text-xl font-bold text-indigo-400 mt-1">{psychometrics.averageScore}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">মধ্যমা (Median)</div>
                    <div className="text-xl font-bold text-sky-400 mt-1">{psychometrics.medianScore}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">পরিমিত ব্যবধান (SD)</div>
                    <div className="text-xl font-bold text-purple-400 mt-1">{psychometrics.standardDeviation}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">পাসের হার</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">{psychometrics.passPercentage}%</div>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">গ্রেড ডিস্ট্রিবিউশন</h3>
                  <div className="grid grid-cols-5 gap-3 text-center text-xs">
                    {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
                      <div key={g} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-bold text-slate-300">Grade {g}</div>
                        <div className="text-lg font-black text-indigo-400 mt-1">
                          {psychometrics.gradeDistribution[g]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-Question Item Psychometrics Table */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">প্রশ্নভিত্তিক সাইকোমেট্রিক বিশ্লেষণ (Item Analysis)</h3>
                      <p className="text-[11px] text-slate-400">
                        Difficulty Index (p-value) ও Discrimination Index (D: Upper 27% vs Lower 27%)
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[460px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">প্রশ্ন</th>
                          <th className="px-4 py-2.5">সঠিকের হার (p)</th>
                          <th className="px-4 py-2.5">বৈষম্য সূচক (D)</th>
                          <th className="px-4 py-2.5">অপশন বণ্টন (A / B / C / D / Blank)</th>
                          <th className="px-4 py-2.5">মান নির্ণয়</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {Object.values(psychometrics.itemAnalysis).map((item) => (
                          <tr key={item.question} className="hover:bg-slate-800/40">
                            <td className="px-4 py-2 font-mono font-bold text-white">{item.question.toUpperCase()}</td>
                            <td className="px-4 py-2">{Math.round(item.difficultyIndex * 100)}%</td>
                            <td className="px-4 py-2 font-mono">{item.discriminationIndex.toFixed(2)}</td>
                            <td className="px-4 py-2 text-slate-300 font-mono text-[11px]">
                              A:{item.distractorCounts.A || 0} • B:{item.distractorCounts.B || 0} • C:
                              {item.distractorCounts.C || 0} • D:{item.distractorCounts.D || 0} • -:
                              {item.distractorCounts.UNMARKED || 0}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.classification === 'Ideal'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : item.classification === 'Poor Discriminator'
                                    ? 'bg-rose-500/15 text-rose-300'
                                    : 'bg-amber-500/15 text-amber-300'
                                }`}
                              >
                                {item.classification}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Printable Individual Student OMR Report Card Modal */}
      {printingCard && (
        <StudentOMRReportCardModal
          scoreCard={printingCard}
          examName={
            examsList.find((e) => e.id === ((printingCard as any).examId || selectedExamId))?.name ||
            'অফিসিয়াল OMR মূল্যায়ন ফলাফল পত্র'
          }
          onClose={() => setPrintingCard(null)}
        />
      )}

      {/* Printable Official Class Merit List & Styled Excel Export Modal */}
      <MeritListModal
        open={showMeritListModal}
        onClose={() => setShowMeritListModal(false)}
        scoreCards={scoreCards}
        examTitle={
          examsList.find((e) => e.id === selectedExamId)?.name || 'অফিসিয়াল OMR পরীক্ষা'
        }
      />
    </div>
  );
}
