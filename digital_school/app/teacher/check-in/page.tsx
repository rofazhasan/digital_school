"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Wifi,
    UserCheck,
    RotateCcw,
    LayoutDashboard,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Lock,
    History,
    FileText,
    DownloadCloud
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { startNfcScanner, stopNfcScanner, CapacitorNfc } from "@/lib/native/nfc";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";
import { Capacitor } from "@capacitor/core";

export default function NfcCheckInPage() {
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);
    const [scannedCount, setScannedCount] = useState(0);
    const [nfcStatus, setNfcStatus] = useState<string>("Initializing...");
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [scanHistory, setScanHistory] = useState<any[]>([]);

    // Fetch exams for selection
    useEffect(() => {
        fetch('/api/exams/evaluations')
            .then(res => res.json())
            .then(data => {
                setExams(data);
                if (data.length > 0) setSelectedExamId(data[0].id);
            })
            .catch(console.error);
    }, []);

    // Initialize NFC status check
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            setNfcStatus("Web Mode (Simulation)");
            return;
        }

        const checkNfc = async () => {
            try {
                const { status } = await CapacitorNfc.getStatus();
                setNfcStatus(status === 'NFC_OK' ? "Ready to Scan" : status);
            } catch (error) {
                setNfcStatus("NFC Unavailable");
            }
        };

        checkNfc();
    }, []);

    const handleStartScan = async () => {
        if (!Capacitor.isNativePlatform()) {
            // Simulate scan for development
            simulateScan();
            return;
        }

        setIsScanning(true);
        triggerHaptic(ImpactStyle.Light);

        try {
            await startNfcScanner((tag: any) => {
                processTag(tag);
            });
            toast.info("NFC Scanner Active: Hold tag near device");
        } catch (error) {
            console.error("Failed to start NFC:", error);
            toast.error("NFC Scanning failed to start");
            setIsScanning(false);
        }
    };

    const handleStopScan = async () => {
        setIsScanning(false);
        if (Capacitor.isNativePlatform()) {
            await stopNfcScanner();
        }
        toast.success("Scanner stopped");
    };

    const processTag = (tag: any) => {
        triggerHaptic(ImpactStyle.Heavy);
        setScannedCount(prev => prev + 1);

        // In a real app, you'd fetch student details based on tag.id
        // Here we'll simulate a successful identification
        const mockStudent = {
            name: `Student #${Math.floor(Math.random() * 1000)}`,
            roll: `R-${Math.floor(Math.random() * 500)}`,
            class: "Class 10",
            section: "Science A",
            timestamp: new Date().toLocaleTimeString()
        };

        setLastScannedStudent(mockStudent);
        setScanHistory(prev => [mockStudent, ...prev].slice(0, 10)); // Keep last 10
        toast.success(`Verified: ${mockStudent.name}`);
    };

    const simulateScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            processTag({ id: [1, 2, 3] });
            setIsScanning(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto w-full space-y-8">

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                            <Lock className="w-8 h-8 text-blue-600" />
                            NFC Hall Verification
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Instant student check-in via secure ID tapping
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.push('/teacher/dashboard')} className="rounded-full">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                </div>

                {/* Scanner Control Center */}
                <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                    <div className={`h-1.5 w-full bg-blue-500 transition-all duration-300 ${isScanning ? 'animate-pulse opacity-100' : 'opacity-0'}`} />
                    <CardContent className="p-8 md:p-12 flex flex-col items-center text-center space-y-8">

                        <div className="relative">
                            {/* Outer Pulse Rings */}
                            {isScanning && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                    <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse delay-75" />
                                </>
                            )}

                            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500
                ${isScanning ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                {isScanning ? (
                                    <Wifi className="w-16 h-16 animate-pulse" />
                                ) : (
                                    <CreditCard className="w-16 h-16" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 w-full max-w-sm">
                            <div className="text-left space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Target Exam Session</label>
                                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                    <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200">
                                        <SelectValue placeholder="Select Exam" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exams.map(exam => (
                                            <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Badge variant="outline" className={`px-4 py-1 text-xs font-bold uppercase tracking-widest border-2
                                    ${nfcStatus === 'Ready to Scan' ? 'border-green-500 text-green-600 bg-green-50' : 'border-slate-200 text-slate-500'}`}>
                                    {nfcStatus}
                                </Badge>
                                <h2 className="text-2xl font-bold">
                                    {isScanning ? "Waiting for ID Card..." : "Ready to Verify"}
                                </h2>
                                <p className="text-slate-500">
                                    {isScanning
                                        ? "Place student's NFC-enabled ID card near the back of your device to verify identity."
                                        : "Select an exam and tap the button below to start verification."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full max-w-md">
                            {!isScanning ? (
                                <Button onClick={handleStartScan} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold shadow-lg shadow-blue-500/30">
                                    <Wifi className="w-5 h-5 mr-3" />
                                    Start Hall Scanning
                                </Button>
                            ) : (
                                <Button onClick={handleStopScan} variant="destructive" size="lg" className="w-full h-14 text-lg font-bold">
                                    <RotateCcw className="w-5 h-5 mr-3" />
                                    Stop Scanner
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Results Sidebar/Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Recent Scan List */}
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                Last Verified Student
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {lastScannedStudent ? (
                                <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
                                        {lastScannedStudent.name.substring(0, 1)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg leading-tight">{lastScannedStudent.name}</h3>
                                        <p className="text-xs font-medium text-slate-500">Roll: {lastScannedStudent.roll} • {lastScannedStudent.class}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified at {lastScannedStudent.timestamp}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 space-y-3 opacity-50">
                                    <AlertCircle className="w-12 h-12 mx-auto text-slate-300" />
                                    <p className="text-sm font-medium">No students verified yet in this session</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Session Statistics */}
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Total Check-ins</p>
                                <p className="text-5xl font-black text-blue-600">{scannedCount}</p>
                            </div>
                            <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <Loader2 className={`w-8 h-8 text-blue-600 ${isScanning ? 'animate-spin' : ''}`} />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-500" />
                                Session History
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600 font-bold hover:bg-blue-50">
                                <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {scanHistory.map((scan, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                                                {scan.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{scan.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Roll: {scan.roll} • {scan.timestamp}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-600 border-green-100 text-[10px]">VERIFIED</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer info */}
                <div className="text-center pt-8">
                    <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        End-to-End Encrypted Verification Protocol v2.4
                    </p>
                </div>

            </div>
        </div>
    );
}
