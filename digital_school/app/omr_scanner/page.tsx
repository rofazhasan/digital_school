'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, ScanLine, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/dexie-db";
import { useLiveQuery } from "dexie-react-hooks";

export default function OMRScannerPage() {
    const [activeTab, setActiveTab] = useState("camera");
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [markersFound, setMarkersFound] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const pendingExams = useLiveQuery(() => db.exams.toArray());

    // --- Engine Initialization ---
    useEffect(() => {
        const worker = new Worker('/workers/omr-engine.worker.js');
        worker.onmessage = (e) => {
            if (e.data.type === 'ready') {
                setIsEngineReady(true);
                toast.success("OMR Engine Ready (Offline)");
            } else if (e.data.type === 'result') {
                handleWorkerResult(e.data.result);
            }
        };
        workerRef.current = worker;
        return () => worker.terminate();
    }, []);

    const handleWorkerResult = (result: any) => {
        setIsProcessing(false);
        if (result.type === 'searching') {
            setMarkersFound(result.markersFound);
            drawOverlay(null);
        } else if (result.type === 'success') {
            setScanResult(result.data);
            setMarkersFound(4);
            drawOverlay(result.data.markers);
            toast.success("Sheet Scanned Successfully!");
            // Haptic feedback
            if (window.navigator.vibrate) window.navigator.vibrate(200);
        }
    };

    // --- Camera & Processing Loop ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
                requestAnimationFrame(processLoop);
            }
        } catch (err) {
            toast.error("Camera access denied.");
        }
    };

    const processLoop = () => {
        if (!cameraActive || !videoRef.current || !canvasRef.current || !workerRef.current || !isEngineReady) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth / 2; // Downscale for performance
            canvas.height = video.videoHeight / 2;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Get selected template
            const selectedExam = pendingExams?.find(e => e.id === selectedExamId);
            const template = selectedExam?.templateJson || null;

            workerRef.current.postMessage({
                type: 'process',
                imageData: imageData,
                template: template
            }, [imageData.data.buffer]);
        }

        setTimeout(() => requestAnimationFrame(processLoop), 100); // Target ~10fps for scanner
    };

    const drawOverlay = (markers: any) => {
        if (!overlayRef.current || !videoRef.current) return;
        const canvas = overlayRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!markers) return;

        // Draw quad over detected markers
        ctx.strokeStyle = '#10b981'; // Emerald 500
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(markers[0].x * 2, markers[0].y * 2);
        ctx.lineTo(markers[1].x * 2, markers[1].y * 2);
        ctx.lineTo(markers[2].x * 2, markers[2].y * 2);
        ctx.lineTo(markers[3].x * 2, markers[3].y * 2);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fill();
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const syncOfflineData = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/omr/sync');
            const data = await res.json();
            await db.exams.clear();
            await db.exams.bulkAdd(data);
            toast.success("Offline Exams Synced!");
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && workerRef.current) {
            const file = e.target.files[0];
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                if (imageData) {
                    setIsProcessing(true);
                    const selectedExam = pendingExams?.find(e => e.id === selectedExamId);
                    const template = selectedExam?.templateJson || null;
                    workerRef.current?.postMessage({ type: 'process', imageData, template });
                }
            };
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">OMR Scanner</h1>
                    <p className="text-muted-foreground">Offline-first high accuracy scanning.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={syncOfflineData} disabled={isSyncing}>
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Sync Offline Data
                    </Button>
                    <Button variant="outline" onClick={() => { setScanResult(null); setPreviewUrl(null); if (activeTab === 'camera') startCamera(); }}>
                        Reset
                    </Button>
                </div>
            </div>

            {/* Offline Status / Engine Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs font-medium border border-blue-100 dark:border-blue-800">
                    <Info className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                        <span className="opacity-70 uppercase tracking-wider mr-2">Engine:</span>
                        {isEngineReady ? <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">READY (WEBWASM)</Badge> : <Badge variant="outline" className="animate-pulse">INITIALIZING...</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="opacity-70 uppercase tracking-wider">Markers:</span>
                        <Badge variant={markersFound === 4 ? "default" : "outline"} className={markersFound === 4 ? "bg-green-500" : ""}>
                            {markersFound} / 4
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800">
                    <select
                        className="flex-1 bg-transparent border-none text-xs font-bold p-2 focus:ring-0"
                        value={selectedExamId || ''}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                    >
                        <option value="">Select Exam Template...</option>
                        {pendingExams?.map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <CardHeader>
                            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'camera') startCamera(); else stopCamera(); }} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" /> Camera</TabsTrigger>
                                    <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" /> Upload</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="min-h-[300px] flex items-center justify-center relative p-0 overflow-hidden rounded-b-lg">
                            {previewUrl && !isProcessing && !cameraActive && activeTab === 'camera' && (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-[400px]" />
                            )}

                            {activeTab === 'camera' && cameraActive && (
                                <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden shadow-2xl">
                                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" autoPlay playsInline muted />
                                    <canvas ref={overlayRef} className="absolute inset-0 w-full h-full object-cover z-20" width={1280} height={720} />

                                    {/* Secret processing canvas (hidden) */}
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Scan Guidelines Overlay */}
                                    <div className="absolute inset-0 pointer-events-none z-10 border-[40px] border-black/20 flex items-center justify-center">
                                        <div className="w-[80%] h-[80%] border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                                            {markersFound < 4 && (
                                                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold text-sm animate-pulse border border-white/20">
                                                    ALIGN ALL 4 CORNER MARKERS
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Floating Stats */}
                                    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                                        {isProcessing && (
                                            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> Processing
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div className="p-8 text-center w-full">
                                    {previewUrl && !isProcessing ? (
                                        <img src={previewUrl} alt="Preview" className="mx-auto rounded-lg max-h-[300px] mb-4" />
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm font-medium">Click to upload Image or PDF</p>
                                        </div>
                                    )}
                                    <Input type="file" className="mt-4" accept="image/*,application/pdf" onChange={handleFileUpload} />
                                </div>
                            )}

                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                    <p className="font-semibold text-lg">Processing OMR...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ScanLine className="w-5 h-5" /> Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!scanResult ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Scan a sheet to see results here.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Grading Badge */}
                                    {scanResult.grading && (
                                        <div className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${scanResult.grading.score > 0 ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-900"}`}>
                                            <div>
                                                <p className="text-xs font-semibold uppercase opacity-70">Calculated Score</p>
                                                <p className="text-3xl font-bold">{scanResult.grading.score.toFixed(2)} / {scanResult.grading.total}</p>
                                            </div>
                                            <div className="text-left sm:text-right text-xs">
                                                <p className="font-semibold">{scanResult.grading.examName}</p>
                                                <p className="opacity-70">Set: {scanResult.grading.setName}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className={`p-3 rounded-lg text-center border transition-colors ${scanResult.conflicts?.some((c: any) => c.type === 'ROLL') ? "bg-red-50 border-red-500 text-red-900 animate-pulse" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                                            <div className="flex justify-center items-center gap-1 mb-1">
                                                <p className="text-xs uppercase font-bold opacity-70">Roll No</p>
                                                {scanResult.conflicts?.some((c: any) => c.type === 'ROLL') && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                            </div>
                                            <p className="text-2xl font-mono font-black text-primary">{scanResult.roll || "??????"}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center border transition-colors ${scanResult.conflicts?.some((c: any) => c.type === 'SET') ? "bg-red-50 border-red-500 text-red-900" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                                            <p className="text-xs text-muted-foreground uppercase mb-1 font-bold">Set Code</p>
                                            <p className="text-2xl font-mono font-black text-primary">{scanResult.set || "?"}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center border transition-colors ${scanResult.conflicts?.some((c: any) => c.type === 'REG') ? "bg-red-50 border-red-500 text-red-900 animate-pulse" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                                            <div className="flex justify-center items-center gap-1 mb-1">
                                                <p className="text-xs uppercase font-bold opacity-70">Registration</p>
                                                {scanResult.conflicts?.some((c: any) => c.type === 'REG') && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                            </div>
                                            <p className="text-lg font-mono font-bold">{scanResult.registration || "??????"}</p>
                                        </div>
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                                            <p className="text-xs text-muted-foreground uppercase mb-1 font-bold">Confidence</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[80px]">
                                                    <div
                                                        className={`h-1.5 rounded-full ${scanResult.confidence > 0.95 ? "bg-emerald-500" : scanResult.confidence > 0.85 ? "bg-yellow-500" : "bg-red-500"}`}
                                                        style={{ width: `${scanResult.confidence * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm font-bold font-mono">{(scanResult.confidence * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Grid */}
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                                        <h3 className="font-semibold mb-3 text-sm">Detected Answers</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-xs">
                                            {/* We want to show 100 questions cleanly */}
                                            {Array.from({ length: 100 }).map((_, i) => {
                                                const qNum = i + 1;
                                                const ans = scanResult.answers[qNum];
                                                const grade = scanResult.grading?.details.find((d: any) => d.q === qNum);
                                                const conflict = scanResult.conflicts?.find((c: any) => c.qId == qNum && c.type === 'MCQ');

                                                let bgClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                                                if (conflict) bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-400 animate-pulse";
                                                else if (grade) {
                                                    if (grade.status === 'correct') bgClass = "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
                                                    if (grade.status === 'wrong') bgClass = "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
                                                }

                                                return (
                                                    <div key={qNum} className={`flex justify-between items-center p-2 rounded border ${bgClass}`}>
                                                        <span className="opacity-70">{qNum}</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold">{ans || "-"}</span>
                                                            {conflict && <span className="text-[8px] font-bold uppercase">Multimark</span>}
                                                            {grade && grade.status === 'wrong' && <span className="text-[10px] opacity-50">({grade.expected})</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {scanResult.error && (
                                        <div className="p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
                                            <span className="font-bold">Warning:</span> {scanResult.error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
