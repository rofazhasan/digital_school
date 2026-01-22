"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, ScanLine } from "lucide-react";
import jsQR from 'jsqr';
import { toast } from "sonner";

export default function OMRScannerPage() {
    const [activeTab, setActiveTab] = useState("upload"); // Default to upload

    // ...

    // 5. Extract Bubbles
    const extractBubbles = (binary: Uint8Array, width: number, height: number, transform: (u: number, v: number) => { x: number, y: number }, ctx?: CanvasRenderingContext2D) => {
        // We define the zones relative to the 4 anchors (0,0 to 1,1)
        // With 4 column layout for answers, the Answer Grid takes up approx 75% of width.
        // Columns evenly spaced 0-0.75 range?
        // Let's recalibrate roughly based on visual inspection of OMRSheet layout.

        const output = {
            roll: '' as string,
            set: '' as string,
            reg: '' as string,
            answers: {} as Record<number, string>
        };

        // Helper to count black pixels in a bubble at (u, v) with radius r (normalized)
        const countBlack = (u: number, v: number, radiusU: number, radiusV: number) => {
            const center = transform(u, v);
            const rPx = Math.max(radiusU * width, 5); // min 5px
            let blackCount = 0;
            let totalCount = 0;

            const startX = Math.floor(center.x - rPx);
            const endX = Math.floor(center.x + rPx);
            const startY = Math.floor(center.y - rPx);
            const endY = Math.floor(center.y + rPx);

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        totalCount++;
                        if (binary[y * width + x] === 1) blackCount++;
                    }
                }
            }

            const fill = totalCount > 0 ? (blackCount / totalCount) : 0;
            // Debug Visualization
            if (ctx) {
                ctx.beginPath();
                ctx.arc(center.x, center.y, rPx, 0, 2 * Math.PI);
                ctx.strokeStyle = fill > 0.4 ? "red" : "rgba(0,255,0,0.3)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            return fill;
        };

        // --- DECODE ROLL (Right Column) ---
        // Right side column
        const rollCols = 6;
        const rollRows = 10;
        const rollStartU = 0.82; // Shifted slightly right due to wider answer grid
        const rollStepU = 0.025;
        const rollStartV = 0.20;
        const rollStepV = 0.018;

        let detectedRoll = [];
        for (let c = 0; c < rollCols; c++) {
            let bestR = -1;
            let maxFill = 0.4;
            for (let r = 0; r < rollRows; r++) {
                const u = rollStartU + (c * rollStepU);
                const v = rollStartV + (r * rollStepV);
                const fill = countBlack(u, v, 0.005, 0.005);
                if (fill > maxFill) {
                    maxFill = fill;
                    bestR = r;
                }
            }
            detectedRoll.push(bestR !== -1 ? bestR : '?');
        }
        output.roll = detectedRoll.join('');

        // --- DECODE ANSWERS (100 Questions) ---
        // 4 Columns: Q1-25, Q26-50, Q51-75, Q76-100
        // Total Answer Grid Width approx 0.75
        // Each Col Width approx 0.18

        const answerCols = 4; // A, B, C, D
        const questionsPerBlock = 25;
        const blockCount = 4;

        const blockStartU = 0.06;
        const blockStepU = 0.19; // Move right for next block

        const optStartU = 0.055; // Relative to block start
        const optStepU = 0.032;

        const rowStartV = 0.12;
        const rowStepV = 0.033;

        for (let b = 0; b < blockCount; b++) {
            const baseU = blockStartU + (b * blockStepU);

            for (let q = 0; q < questionsPerBlock; q++) {
                const qNum = (b * questionsPerBlock) + q + 1;

                let bestOpt = -1;
                let maxFill = 0.35;

                for (let opt = 0; opt < 4; opt++) {
                    const u = baseU + optStartU + (opt * optStepU);
                    const v = rowStartV + (q * rowStepV);
                    const fill = countBlack(u, v, 0.006, 0.006);
                    if (fill > maxFill) {
                        maxFill = fill;
                        bestOpt = opt;
                    }
                }
                if (bestOpt !== -1) {
                    output.answers[qNum] = ['A', 'B', 'C', 'D'][bestOpt];
                }
            }
        }

        return output;
    };

    // --- PDF Worker Configuration ---
    // Use specific version matching package.json
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        // Use unpkg or cdnjs for the exact version 5.3.31
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.3.31/legacy/build/pdf.worker.min.mjs`;
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (file.type === 'application/pdf') {
                try {
                    toast.info("Processing PDF...");
                    const arrayBuffer = await file.arrayBuffer();

                    // Loading document
                    const loadingTask = pdfjsLib.getDocument({
                        data: arrayBuffer,
                        verbosity: 0
                    });

                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1); // Scan first page

                    const viewport = page.getViewport({ scale: 2.0 }); // High res
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    scanFrame(canvas);
                    toast.success("PDF Rendered Successfully");
                } catch (err: any) {
                    console.error(err);
                    log(`PDF Error: ${err.message}`);
                    toast.error(`Failed to parse PDF: ${err.message}`);
                }
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        scanFrame(img);
                    };
                    img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // --- Updated Anchor Logic for Squares ---
    const findAnchors = (blobs: any[], width: number, height: number) => {
        // Filter out small noise, but keep large square anchors
        // Anchors are now 24px (+ margin). In a 2MP image, they will be significant.
        const candidates = blobs.filter(b => b.size > 100);

        if (candidates.length < 4) return null;

        let tl = candidates[0], tr = candidates[0], bl = candidates[0], br = candidates[0];
        let minSum = Infinity, maxSum = -Infinity, minDiff = Infinity, maxDiff = -Infinity;

        candidates.forEach(b => {
            const sum = b.cx + b.cy;
            const diff = b.cx - b.cy;
            if (sum < minSum) { minSum = sum; tl = b; }
            if (sum > maxSum) { maxSum = sum; br = b; }
            if (diff < minDiff) { minDiff = diff; bl = b; }
            if (diff > maxDiff) { maxDiff = diff; tr = b; }
        });

        if (new Set([tl, tr, bl, br]).size < 4) return null;
        return { tl, tr, bl, br };
    };

    // --- Grading Logic ---
    const gradeExam = async (scannedData: any) => {
        if (!scannedData.examId || !scannedData.setId) return;

        try {
            toast.loading("Fetching Answer Key...");
            // In a real app, this should be a specific secure endpoint. 
            // Reuse existing public endpoint or create one.
            // Using /api/exams/[id] for now assuming it returns question data.
            const res = await fetch(`/api/exams/${scannedData.examId}`);
            if (!res.ok) throw new Error("Failed to fetch key");

            const examData = await res.json();
            const set = examData.sets.find((s: any) => s.setId === scannedData.setId);

            if (!set) throw new Error("Set not found");

            let score = 0;
            let total = 0;
            const details = [];

            // Grade MCQs (1-50)
            // Flatten set.mcq to find correct answers
            // Assuming set.mcq is array of { id, correctAnswer: "Option A" ... }
            if (set.mcq) {
                set.mcq.forEach((q: any, idx: number) => {
                    const qNum = idx + 1;
                    const studentAns = scannedData.answers[qNum];
                    // Clean "Option A" -> "A" if needed, assume data matches
                    // If correctAnswer is "Option A", studentAns is "A"
                    const correctChar = q.correctAnswer.replace('Option ', '').trim();

                    if (studentAns === correctChar) {
                        score += q.marks || 1;
                        details.push({ q: qNum, status: 'correct' });
                    } else if (studentAns) {
                        score -= 0.25; // Negative marking?
                        details.push({ q: qNum, status: 'wrong', got: studentAns, expected: correctChar });
                    }
                    total += q.marks || 1;
                });
            }

            toast.dismiss();
            toast.success(`Grading Complete: ${score} / ${total}`);

            setScanResult((prev: any) => ({
                ...prev,
                score,
                total,
                graded: true
            }));

        } catch (err: any) {
            toast.dismiss();
            toast.error("Grading Failed: " + (err?.message || String(err)));
        }
    };

    // Trigger grading when scan is stable and has answers
    useEffect(() => {
        if (scanResult && !scanResult.graded && scanResult.examId && Object.keys(scanResult.answers || {}).length > 0) {
            // Debounce or wait for user confirmation?
            // Auto-grade for now
            gradeExam(scanResult);
        }
    }, [scanResult]);

    return (
        <div className="container mx-auto p-4 max-w-4xl min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">OMR Scanner</h1>
                    <p className="text-muted-foreground">Scan printed exam sheets to auto-grade.</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Card className="overflow-hidden border-2 border-primary/20">
                        <div className="relative aspect-video bg-black flex items-center justify-center">
                            {activeTab === 'camera' && (
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    playsInline
                                    muted
                                />
                            )}
                            {/* Overlay Canvas for drawing debug lines */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />

                            {!videoRef.current?.srcObject && activeTab === 'camera' && (
                                <div className="text-white flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p>Starting Camera...</p>
                                </div>
                            )}
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="bg-muted px-4 py-2 flex justify-between items-center">
                                <TabsList>
                                    <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" /> Camera</TabsTrigger>
                                    <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" /> Upload File</TabsTrigger>
                                </TabsList>
                                {scanResult && (
                                    <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Scanned</Badge>
                                )}
                            </div>
                            <TabsContent value="upload" className="p-4 bg-card">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                />
                                <p className="text-xs text-muted-foreground mt-2">Upload a clear photo of the OMR sheet.</p>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Scan Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {scanResult ? (
                                <div className="space-y-2">
                                    {/* Result details placeholder */}
                                    <div className="p-2 bg-green-50 text-green-800 rounded text-sm font-mono">
                                        JSON: {JSON.stringify(scanResult, null, 2)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ScanLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Point camera at the OMR sheet QR code to start.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-950 text-slate-300 font-mono text-xs">
                        <CardHeader className="py-2"><CardTitle className="text-sm">Debug Log</CardTitle></CardHeader>
                        <CardContent className="h-40 overflow-y-auto">
                            {debugLog.map((l, i) => (
                                <div key={i} className="border-b border-slate-800 py-1">{l}</div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
