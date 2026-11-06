"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  Clock
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
import { processOMR, scanQRCodeFromCanvas } from '@/lib/omr/omrEngine';
import { loadOpenCV, isOpenCVLoaded } from '@/lib/omr/opencvLoader';
import { toBengaliNumerals } from '@/utils/numeralConverter';

export default function ExamBatchScanPage() {
  const nextParams = useParams();

  // Multi-tier, rock-solid examId resolution
  const resolveExamId = useCallback(() => {
    // 1. From Next.js useParams() hook
    const fromNext = nextParams?.id;
    if (typeof fromNext === 'string' && fromNext.trim()) return fromNext.trim();
    if (Array.isArray(fromNext) && fromNext[0]?.trim()) return fromNext[0].trim();

    // 3. From window.location pathname (immediate, synchronous fallback in browser)
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const idx = parts.indexOf('exams');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'omr-scan') {
        return parts[idx + 1].trim();
      }
    }
    return '';
  }, [nextParams]);

  const [examId, setExamId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const idx = parts.indexOf('exams');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'omr-scan') {
        return parts[idx + 1].trim();
      }
    }
    const fromNext = nextParams?.id;
    if (typeof fromNext === 'string' && fromNext) return fromNext;
    if (Array.isArray(fromNext) && fromNext[0]) return fromNext[0];
    return '';
  });
  const router = useRouter();

  // Synchronize examId if nextParams resolves asynchronously
  useEffect(() => {
    const detected = resolveExamId();
    if (detected && detected !== examId) {
      setExamId(detected);
    }
  }, [resolveExamId, examId]);

  // Exam state from DB
  const [exam, setExam] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState<boolean>(true);
  const [examError, setExamError] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState<number>(0);
  const [studentDirectory, setStudentDirectory] = useState<Map<string, { id: string; name: string }>>(new Map());

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

  // Initialize Template configuration without heavy OpenCV download on page mount
  useEffect(() => {
    const preset = PRESET_TEMPLATES.find(p => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
    setActiveTemplate(preset.template);
    const parsed = parseTemplate(preset.template);
    setParsedBubbles(parsed.bubbles);
  }, [selectedPresetId]);

  // Preload OpenCV in background idle time so scans start instantly with zero latency
  useEffect(() => {
    if (typeof window !== 'undefined' && !isOpenCVLoaded()) {
      const timer = setTimeout(() => {
        loadOpenCV().catch(err => console.debug('OpenCV background prefetch deferred:', err));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Memoized function to configure student directory and answer key
  const compileExamData = useCallback((data: any) => {
    if (!data) return;
    setExam(data);

    // 1. Build Student Directory Map
    const dirMap = new Map<string, { id: string; name: string }>();
    if (Array.isArray(data.students)) {
      data.students.forEach((st: any) => {
        if (st && st.roll) {
          const cleanR = String(st.roll).trim();
          const strippedR = cleanR.replace(/^0+/, '') || cleanR;
          const name = st.user?.name || `Roll ${cleanR}`;
          dirMap.set(cleanR, { id: st.id, name });
          dirMap.set(strippedR, { id: st.id, name });
        }
      });
    }
    setStudentDirectory(dirMap);

    // 2. Compile Answer Keys
    const multiSetKeys: Record<string, Record<string, string>> = {};
    const defaultKey: Record<string, string> = {};
    const examSets = Array.isArray(data.examSets) ? data.examSets : [];

    const indexToLetter = (idx: number) => {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      return letters[idx] || 'A';
    };

    const extractAnswersFromQuestions = (qList: any[]) => {
      const map: Record<string, string> = {};
      if (!Array.isArray(qList)) return map;

      qList.forEach((q: any, idx: number) => {
        if (!q || typeof q !== 'object') return;
        const qKey = `q${idx + 1}`;
        let correctLetter = '';

        if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
          const caStr = String(q.correctAnswer).trim().toUpperCase();
          const firstChar = caStr.charAt(0);
          if (['A', 'B', 'C', 'D', 'E'].includes(caStr)) {
            correctLetter = caStr;
          } else if (['A', 'B', 'C', 'D', 'E'].includes(firstChar)) {
            correctLetter = firstChar;
          } else if (['ক', 'খ', 'গ', 'ঘ'].includes(firstChar)) {
            const bnMap: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
            correctLetter = bnMap[firstChar] || '';
          }
        }

        if (!correctLetter && Array.isArray(q.options)) {
          const correctIdx = q.options.findIndex((opt: any) => {
            if (typeof opt === 'object' && opt !== null) {
              return opt.isCorrect === true || opt.correct === true;
            }
            return false;
          });

          if (correctIdx >= 0) {
            correctLetter = indexToLetter(correctIdx);
          }
        }

        if (!correctLetter && q.correctOption !== undefined && q.correctOption !== null) {
          if (typeof q.correctOption === 'number') {
            correctLetter = indexToLetter(q.correctOption - 1);
          } else if (typeof q.correctOption === 'string') {
            const cleaned = q.correctOption.trim().toUpperCase();
            const f = cleaned.charAt(0);
            if (['A', 'B', 'C', 'D', 'E'].includes(cleaned)) {
              correctLetter = cleaned;
            } else if (['A', 'B', 'C', 'D', 'E'].includes(f)) {
              correctLetter = f;
            } else if (['ক', 'খ', 'গ', 'ঘ'].includes(f)) {
              const bnMap: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
              correctLetter = bnMap[f] || '';
            }
          }
        }

        map[qKey] = correctLetter || 'A';
      });
      return map;
    };

    if (examSets.length > 0) {
      examSets.forEach((s: any) => {
        if (!s || typeof s !== 'object') return;
        const sNameStr = String(s.name || 'A');
        const rawName = sNameStr.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase() || 'A';
        const firstLetter = rawName.charAt(0) || 'A';
        const qs = Array.isArray(s.questionsJson) 
          ? s.questionsJson 
          : (Array.isArray(s.questions) ? s.questions : []);
        
        const setKey = extractAnswersFromQuestions(qs);
        multiSetKeys[rawName] = setKey;
        multiSetKeys[firstLetter] = setKey;
        multiSetKeys[sNameStr.trim().toUpperCase()] = setKey;

        if (Object.keys(defaultKey).length === 0 || rawName === 'A' || firstLetter === 'A') {
          Object.assign(defaultKey, setKey);
        }
      });
    }

    if (Object.keys(defaultKey).length === 0 && Array.isArray(data.questions)) {
      Object.assign(defaultKey, extractAnswersFromQuestions(data.questions));
    }

    // Auto-select template preset based on question count
    const totalQuestionCount = Object.keys(defaultKey).length || Number(data.totalMarks) || 100;
    if (totalQuestionCount <= 50) {
      setSelectedPresetId('bangladesh_board_hsc');
    } else {
      setSelectedPresetId('medical_admission_100q');
    }

    const negMark = data.mcqNegativeMarking !== undefined ? Number(data.mcqNegativeMarking) : 0.25;

    const dynamicConfig: EvaluationConfig = {
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

    setEvaluationConfig(dynamicConfig);
  }, []);

  // Fetch Exam Data & Compile Authentic Answer Key from DB with Instant Cache
  useEffect(() => {
    const activeExamId = examId || resolveExamId();
    if (!activeExamId) {
      setLoadingExam(false);
      setExamError('পরীক্ষার আইডি সনাক্ত করা যায়নি। অনুগ্রহ করে পরীক্ষার তালিকা থেকে পুনরায় প্রবেশ করুন।');
      return;
    }

    // Fast-path: Instant hydration from sessionStorage (0ms perceived load)
    try {
      const cached = sessionStorage.getItem(`omr_exam_${activeExamId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id === activeExamId || parsed.name)) {
          compileExamData(parsed);
          setLoadingExam(false);
        }
      }
    } catch {}

    let isCurrent = true;

    async function fetchExamDetails() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        setExamError(null);
        const res = await fetch(`/api/exams/${activeExamId}?mode=omr`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`পরীক্ষা পাওয়া যায়নি (HTTP ${res.status})`);
        }
        const rawData = await res.json();
        const data = rawData.exam || rawData;

        if (!isCurrent) return;
        compileExamData(data);

        try {
          sessionStorage.setItem(`omr_exam_${activeExamId}`, JSON.stringify(data));
        } catch {}
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (!isCurrent) return;
        console.error('Failed to load exam details:', err);
        setExamError(err.name === 'AbortError' ? 'সার্ভার সংযোগ সময়োত্তীর্ণ হয়েছে (Timeout)। পুনরায় চেষ্টা করুন।' : (err.message || 'Error loading exam'));
      } finally {
        if (isCurrent) {
          setLoadingExam(false);
        }
      }
    }

    fetchExamDetails();

    return () => {
      isCurrent = false;
    };
  }, [examId, resolveExamId, fetchAttempt, compileExamData]);

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

    // On-demand load OpenCV if not already initialized
    if (!isOpenCVLoaded()) {
      setStatusMessage('OMR Vision ইঞ্জিন (OpenCV) লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
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
        const qr = scanQRCodeFromCanvas(item.canvas);
        const qrSet = qr?.metadata?.setName || qr?.metadata?.setId || (qr as any)?.setName;

        const scanRes = await processOMR(
          item.canvas,
          activeTemplate,
          parsedBubbles,
          undefined,
          item.name,
          { generateCanvases: false } // Crucial: avoid 24MB canvas in memory
        );

        // Store lightweight scan result without DOM canvases
        const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = scanRes;
        newScanResults[scanRes.sheetId] = leanScanRes as any;

        const effectiveResponses = { ...scanRes.responses };
        if (qrSet) {
          effectiveResponses['Set'] = [qrSet];
        }

        const card = evalEngine.evaluateCandidate(
          scanRes.sheetId,
          item.name,
          effectiveResponses,
          scanRes.concatenatedResponses,
          scanRes.flags
        );

        // Pre-resolve candidate name and ID from student directory
        const rollStr = card.rollNumber || '';
        const strippedRoll = rollStr.replace(/^0+/, '') || rollStr;
        const matched = studentDirectory.get(rollStr) || studentDirectory.get(strippedRoll);
        if (matched) {
          card.studentId = matched.id;
          card.studentName = matched.name;
        }

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

  // Start Camera Feed
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      if (!isOpenCVLoaded()) {
        loadOpenCV().catch(e => console.warn('Camera OpenCV preload error:', e));
      }
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
      if (!isOpenCVLoaded()) {
        setStatusMessage('OMR Vision ইঞ্জিন (OpenCV) প্রস্তুত হচ্ছে...');
        await loadOpenCV();
      }

      const scanRes = await processOMR(
        canvas,
        activeTemplate,
        parsedBubbles,
        undefined,
        `Camera_Capture_${Date.now()}`,
        { generateCanvases: false } // Prevent RAM explosion
      );

      // Clean canvas memory
      canvas.width = 0;
      canvas.height = 0;

      const evalEngine = new EvaluationEngine(evaluationConfig);
      const card = evalEngine.evaluateCandidate(
        scanRes.sheetId,
        scanRes.filename,
        scanRes.responses,
        scanRes.concatenatedResponses,
        scanRes.flags
      );

      // Pre-resolve candidate name and ID from student directory
      const rollStr = card.rollNumber || '';
      const strippedRoll = rollStr.replace(/^0+/, '') || rollStr;
      const matched = studentDirectory.get(rollStr) || studentDirectory.get(strippedRoll);
      if (matched) {
        card.studentId = matched.id;
        card.studentName = matched.name;
      }

      const updated = EvaluationEngine.rankCohort([...scoreCards, card]);
      const { warpedImageCanvas, enhancedImageCanvas, ...leanScanRes } = scanRes;
      setScanResults(prev => ({ ...prev, [scanRes.sheetId]: leanScanRes as any }));
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

      // Update local score cards with database IDs and synced state
      if (Array.isArray(data.results)) {
        const resultMap = new Map<string, any>();
        data.results.forEach((r: any) => {
          if (r.rollNumber) {
            resultMap.set(String(r.rollNumber), r);
            resultMap.set(String(r.rollNumber).replace(/^0+/, ''), r);
          }
        });

        setScoreCards(prev => prev.map(card => {
          const rMatch = resultMap.get(card.rollNumber) || resultMap.get(card.rollNumber.replace(/^0+/, ''));
          if (rMatch) {
            return {
              ...card,
              studentId: rMatch.studentId || card.studentId,
              studentName: rMatch.studentName || card.studentName,
              submissionId: rMatch.submissionId,
              resultId: rMatch.resultId,
              synced: true,
            };
          }
          return { ...card, synced: true };
        }));
      }

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
  const handleExportCSV = async () => {
    if (scoreCards.length === 0) return;
    const csvData = scoreCards.map(c => ({
      'Rank': c.rank,
      'Roll Number': c.rollNumber,
      'Student Name': c.studentName || 'N/A',
      'Exam Set': c.examSet,
      'Total Score': c.totalScore,
      'Max Score': c.maxScore,
      'Percentage (%)': c.percentage,
      'Correct': c.correctCount,
      'Incorrect': c.incorrectCount,
      'Unmarked': c.unmarkedCount,
      'Status': c.synced ? 'Synced' : 'Local Only',
      'Filename': c.filename,
      'Flags': c.flags.join('; '),
    }));

    const Papa = (await import('papaparse')).default;
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
           (c.studentName && c.studentName.toLowerCase().includes(q)) ||
           c.examSet.toLowerCase().includes(q) ||
           c.filename.toLowerCase().includes(q);
  });

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Header Skeleton */}
        <header className="border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-48 sm:w-64 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
            <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-9 w-28 bg-slate-800/60 rounded-xl animate-pulse" />
            </div>
            <div className="h-8 w-44 bg-slate-800/50 rounded-lg animate-pulse hidden sm:block" />
          </div>

          <div className="border-2 border-dashed border-slate-800/80 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-slate-900/40">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-base font-bold text-white mb-1">পরীক্ষার বিবরণ ও উত্তরমালা প্রস্তুত হচ্ছে...</h2>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              ডাটাবেস থেকে প্রশ্নসেট, সঠিক উত্তর এবং শিক্ষার্থীদের রোল তালিকা দ্রুত সিঙ্ক হচ্ছে।
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLoadingExam(true);
                  setExamError(null);
                  setFetchAttempt(prev => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>রিফ্রেশ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">পরীক্ষা লোড করা যায়নি</h2>
        <p className="text-sm text-slate-300 max-w-md mb-6 bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-xs">
          {examError || 'অপ্রত্যাশিত কোনো ত্রুটি হয়েছে।'}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoadingExam(true);
              setExamError(null);
              setFetchAttempt(prev => prev + 1);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            পুনরায় চেষ্টা করুন
          </button>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            পরীক্ষার তালিকা
          </Link>
        </div>
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
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট / A3 মাস্টার
          </Link>
          <Link
            href="/exams/omr-templates"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300"
          >
            <Layers className="w-3.5 h-3.5" /> OMR গ্যালারি
          </Link>
          <Link
            href={`/exams/results/${examId}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/30 hover:bg-indigo-900/40 text-xs font-semibold text-indigo-300"
          >
            <BarChart3 className="w-3.5 h-3.5" /> পরীক্ষা ফলাফল
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
                      <th className="py-2.5 px-3 font-bold">পরীক্ষার্থীর নাম</th>
                      <th className="py-2.5 px-3 font-bold text-center">সেট</th>
                      <th className="py-2.5 px-3 font-bold text-center">সঠিক</th>
                      <th className="py-2.5 px-3 font-bold text-center">ভুল</th>
                      <th className="py-2.5 px-3 font-bold text-center">ফাঁকা</th>
                      <th className="py-2.5 px-3 font-bold text-right">মোট নম্বর</th>
                      <th className="py-2.5 px-3 font-bold text-right">শতাংশ (%)</th>
                      <th className="py-2.5 px-3 font-bold text-center">স্ট্যাটাস</th>
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
                        <td className="py-2 px-3 font-medium text-slate-200">
                          {card.studentName || (
                            <span className="text-slate-500 italic">শিক্ষার্থী প্রোফাইল</span>
                          )}
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
                          {card.synced ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                              <CheckCircle2 className="w-3 h-3" /> সিঙ্কড
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                              <Clock className="w-3 h-3" /> লোকাল
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedScoreCard(card)}
                              className="p-1.5 rounded hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                              title="উত্তর বিশ্লেষণ দেখুন"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/exams/results/${examId}${card.studentId ? `?studentId=${card.studentId}` : ''}`}
                              target="_blank"
                              className="p-1.5 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center"
                              title="পূর্ণাঙ্গ ফলাফল ও ভুল পর্যালোচনা পেজ দেখুন"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          </div>
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
                  রোল: {selectedScoreCard.rollNumber} {selectedScoreCard.studentName ? `• ${selectedScoreCard.studentName}` : ''} — বিস্তারিত মূল্যায়ন
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  সেট: {selectedScoreCard.examSet} • স্কোর: {toBengaliNumerals(selectedScoreCard.totalScore)} / {toBengaliNumerals(selectedScoreCard.maxScore)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScoreCard(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
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

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <Link
                href={`/exams/results/${examId}${selectedScoreCard.studentId ? `?studentId=${selectedScoreCard.studentId}` : ''}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                পূর্ণাঙ্গ ভুল পর্যালোচনা পেজ দেখুন
              </Link>
              <button
                type="button"
                onClick={() => setSelectedScoreCard(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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

