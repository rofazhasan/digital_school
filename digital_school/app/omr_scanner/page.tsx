"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Layers, ShieldCheck, Eye, Upload } from 'lucide-react';
import { detectCornerMarkers } from '@/lib/omr/marker-detector';
import { warpPerspectiveImage, CornerQuad } from '@/lib/omr/perspective-warp';
import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '@/lib/omr/geometry-template';
import { DigitBubbleReader } from '@/lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '@/lib/omr/question-classifier';
import { evaluateImageQuality, QualityMetrics } from '@/lib/omr/quality-engine';
import { AutoCaptureManager } from '@/lib/omr/auto-capture';
import { OMRSyncEngine } from '@/lib/omr/sync-engine';
import { v4 as uuidv4 } from 'uuid';

interface BatchScanItem {
  id: string;
  scanUuid: string;
  timestamp: string;
  rollNumber: string;
  registrationNo: string;
  score: number;
  maxScore: number;
  status: 'SUCCESS' | 'REVIEW' | 'FAILED';
  qualityPassed: boolean;
}

export default function ProductionOMRScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [batchList, setBatchList] = useState<BatchScanItem[]>([]);
  const [examId, setExamId] = useState<string>('demo-exam-1');

  const autoCaptureManagerRef = useRef(new AutoCaptureManager());

  useEffect(() => {
    OMRSyncEngine.initAutoSync();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    await new Promise(resolve => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    processScanFrame(imgData.data, canvas.width, canvas.height);
  };

  const processScanFrame = async (
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ) => {
    // 1. Marker Detection
    const markerResult = detectCornerMarkers(data, width, height);

    // 2. Quality Evaluation
    const qualityEval = evaluateImageQuality(data, width, height, markerResult.confidence);
    setQuality(qualityEval);

    if (!markerResult.isValid || !markerResult.quad) {
      console.warn('Marker detection failed:', markerResult.error);
      const scanUuid = uuidv4();
      const failItem: BatchScanItem = {
        id: scanUuid,
        scanUuid,
        timestamp: new Date().toLocaleTimeString(),
        rollNumber: 'Invalid Markers',
        registrationNo: 'N/A',
        score: 0,
        maxScore: 100,
        status: 'FAILED',
        qualityPassed: qualityEval.isQualityPassed
      };
      setBatchList(prev => [failItem, ...prev]);
      return;
    }

    // 3. Perspective Warp into Canonical Space (2480x3508)
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

    // 4. Geometry Lookup
    const geometry = generateTemplateGeometry('C_11_12', 1);

    // 5. Extract Roll & Reg Number
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

    // 6. Extract Answers (100 Questions)
    const ansRes = QuestionClassifier.classifyQuestions(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.answers.questionCount,
      geometry.answers.cells
    );

    // 7. Save Scan Record to Offline Dexie Storage & Trigger Sync
    const scanUuid = uuidv4();
    const status = (ansRes.stats.ambiguousCount > 0 || !rollRes.isComplete) ? 'REVIEW' : 'SUCCESS';

    const newItem: BatchScanItem = {
      id: scanUuid,
      scanUuid,
      timestamp: new Date().toLocaleTimeString(),
      rollNumber: rollRes.value,
      registrationNo: regRes.value,
      score: ansRes.stats.oneSelectedCount,
      maxScore: 100,
      status,
      qualityPassed: qualityEval.isQualityPassed
    };

    setBatchList(prev => [newItem, ...prev]);

    await OMRSyncEngine.saveScanLocally({
      scanUuid,
      templateId: geometry.templateId,
      templateVersion: geometry.version,
      examId,
      rollNumber: rollRes.value,
      registrationNo: regRes.value,
      rawAnswers: ansRes.answers,
      confidenceScore: ansRes.overallConfidence,
      qualityScore: qualityEval.isQualityPassed ? 1.0 : 0.6,
      status: status === 'REVIEW' ? 'REVIEW_REQUIRED' : 'PENDING'
    });

    // Auto sync
    OMRSyncEngine.syncPendingScans().catch(console.error);
  };

  const counts = {
    scanned: batchList.length,
    pending: batchList.filter(b => b.status === 'SUCCESS').length,
    review: batchList.filter(b => b.status === 'REVIEW').length,
    failed: batchList.filter(b => b.status === 'FAILED').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/omr/review" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-white">PRODUCTION OMR SCANNER V2</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Offline-first high-speed batch scanner for Rofaz Academy template C(11,12).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
              debugMode ? 'bg-indigo-950 text-indigo-400 border-indigo-700' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Debug Overlay: {debugMode ? 'ON' : 'OFF'}
          </button>

          <Link
            href="/admin/omr/review"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
          >
            Review Studio ({counts.review})
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Camera & Scanner View */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden min-h-[420px] flex items-center justify-center">
            {isCameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <Camera className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm mb-6 max-w-sm">
                  Click "Start Camera Scanner" or upload OMR sheet photos to begin high-speed batch processing.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" /> Start Camera Scanner
                  </button>

                  <label className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl cursor-pointer flex items-center gap-2 border border-slate-700">
                    <Upload className="w-5 h-5" /> Upload Photo / Batch
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* Quality Feedback Banner */}
            {quality && (
              <div className="absolute top-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      quality.isQualityPassed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="font-semibold text-slate-200">
                    {quality.userInstructions.join(' | ')}
                  </span>
                </div>

                <div className="font-mono text-slate-400">
                  Blur: {Math.round(quality.blurScore)} | Conf: {(quality.markerConfidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Batch Counters & Scan Queue */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Counters */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xl font-black text-white">{counts.scanned}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Scanned</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xl font-black text-emerald-400">{counts.pending}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xl font-black text-amber-400">{counts.review}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Review</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xl font-black text-rose-400">{counts.failed}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Failed</div>
            </div>
          </div>

          {/* Batch Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Batch Scan Log (Instant Next-Sheet Flow)
            </h2>

            <div className="divide-y divide-slate-800 max-h-[480px] overflow-y-auto">
              {batchList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No papers scanned in this session yet.
                </div>
              ) : (
                batchList.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : item.status === 'REVIEW' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      )}

                      <div>
                        <div className="text-xs font-bold text-white">
                          Roll: {item.rollNumber || 'Unassigned'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Reg: {item.registrationNo || 'N/A'} • {item.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-400">
                        {item.score} / {item.maxScore}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
