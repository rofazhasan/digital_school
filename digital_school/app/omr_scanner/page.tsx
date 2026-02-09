"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, ScanLine, FileText } from "lucide-react";
import { toast } from "sonner";

export default function OMRScannerPage() {
    const [activeTab, setActiveTab] = useState("camera");
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // --- Camera Control ---
    const startCamera = async () => {
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            toast.error("Could not access camera.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        setPreviewUrl(URL.createObjectURL(blob));
                        processFile(file);
                        stopCamera(); // Stop after capture
                    }
                }, "image/jpeg", 0.9);
            }
        }
    };

    // --- Processing ---
    const processFile = async (file: File) => {
        setIsProcessing(true);
        setScanResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/omr/process", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Scan failed");
            }

            setScanResult(data.data);
            if (data.data.grading) {
                toast.success(`Graded! Score: ${data.data.grading.score}/${data.data.grading.total}`);
            } else {
                toast.success("OMR Scanned");
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
            processFile(file);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">OMR Scanner</h1>
                    <p className="text-muted-foreground">Server-side processing for high accuracy.</p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setScanResult(null); setPreviewUrl(null); if (activeTab === 'camera') startCamera(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
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
                                <div className="relative w-full h-full">
                                    <video ref={videoRef} className="w-full h-full object-cover max-h-[400px]" autoPlay playsInline muted />
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <Button size="lg" onClick={capturePhoto} className="rounded-full w-16 h-16 p-0 border-4 border-white">
                                            <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                                        </Button>
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

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">Roll No</p>
                                            <p className="text-xl font-mono font-bold truncate">{scanResult.roll || "?"}</p>
                                        </div>
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">Set Code</p>
                                            <p className="text-xl font-mono font-bold">{scanResult.set || "?"}</p>
                                        </div>
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">Answers</p>
                                            <p className="text-xl font-mono font-bold">{Object.keys(scanResult.answers || {}).length}</p>
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

                                                let bgClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                                                if (grade) {
                                                    if (grade.status === 'correct') bgClass = "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
                                                    if (grade.status === 'wrong') bgClass = "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
                                                }

                                                return (
                                                    <div key={qNum} className={`flex justify-between p-2 rounded border ${bgClass}`}>
                                                        <span className="opacity-70">{qNum}</span>
                                                        <span className="font-bold">{ans || "-"}</span>
                                                        {grade && grade.status === 'wrong' && <span className="text-xs opacity-50 ml-1">({grade.expected})</span>}
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
