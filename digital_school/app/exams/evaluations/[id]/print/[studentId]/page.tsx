"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { Loader2, Printer, ArrowLeft, Download } from 'lucide-react';
import MarkedQuestionPaper from '@/app/components/MarkedQuestionPaper';
import { Button } from '@/components/ui/button';

export default function StudentScriptPrintPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
    const { id: examId, studentId } = use(params);
    const router = useRouter();

    const [examData, setExamData] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [rank, setRank] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isPrinting, setIsPrinting] = useState(false);
    const [isMathJaxReady, setIsMathJaxReady] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const [settings, setSettings] = useState<any>(null);
    const [examSetName, setExamSetName] = useState<string>("A");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch settings
                const settingsRes = await fetch('/api/settings');
                const settingsData = settingsRes.ok ? await settingsRes.json() : null;
                setSettings(settingsData);

                // Fetch full exam evaluation data which includes all submissions
                const response = await fetch(`/api/exams/evaluations/${examId}`);
                if (!response.ok) throw new Error("Failed to fetch exam data");

                const data = await response.json();

                // Find the specific student submission
                const studentSub = data.submissions.find((s: any) => s.student.id === studentId);

                if (!studentSub) {
                    throw new Error("Student submission not found");
                }

                // Calculate Rank and Highest Mark
                // Sort submissions by total marks (descending)
                const sortedSubmissions = [...data.submissions].sort((a: any, b: any) => {
                    const marksA = a.result?.total || 0;
                    const marksB = b.result?.total || 0;
                    return marksB - marksA;
                });

                const studentRank = sortedSubmissions.findIndex((s: any) => s.student.id === studentId) + 1;

                // Fetch student's exam set name
                try {
                    const examSetResponse = await fetch(`/api/exams/${examId}/student-set/${studentId}`);
                    if (examSetResponse.ok) {
                        const examSetData = await examSetResponse.json();
                        setExamSetName(examSetData.setName || "A");
                    }
                } catch (error) {
                    console.error("Error fetching exam set:", error);
                }

                setExamData(data);
                setSubmission(studentSub);
                setRank(studentRank);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [examId, studentId]);

    // @ts-ignore
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${submission?.student?.name || 'student'}_script_${examId}`,
        onBeforeGetContent: async () => {
            setIsPrinting(true);
            if (isMathJaxReady) return;
            return new Promise<void>((resolve) => {
                const check = setInterval(() => {
                    if ((window as any).__IS_MATHJAX_READY) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        },
        onAfterPrint: () => {
            setIsPrinting(false);
            (window as any).__IS_MATHJAX_READY = false;
        }
    } as any);

    const mathJaxConfig = {
        loader: { load: ["input/tex", "input/mml", "output/chtml"] },
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            packages: { '[+]': ['ams'] }
        },
        options: {
            enableEnrichment: false // Disable enrichment to avoid SRE errors if not strictly needed for speech
        },
        startup: {
            pageReady: () => {
                setIsMathJaxReady(true);
                (window as any).__IS_MATHJAX_READY = true;
                return (window as any).MathJax.startup.defaultPageReady();
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading Script...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500">
                Error: {error}
            </div>
        );
    }


    // ... (questions mapping)

    const questions = {
        mcq: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'MCQ').map((q: any) => ({
            ...q,
            q: q.text // Component expects 'q' for text
        })),
        mc: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'MC').map((q: any) => ({
            ...q,
            q: q.text
        })),
        int: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'INT').map((q: any) => ({
            ...q,
            q: q.text
        })),
        ar: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'AR').map((q: any) => ({
            ...q,
            // AR fields (assertion, reason) should be in ...q
        })),
        mtf: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'MTF').map((q: any) => ({
            ...q,
            q: q.text
        })),
        cq: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'CQ').map((q: any) => ({
            ...q,
            questionText: q.text // Component expects 'questionText'
        })),
        sq: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'SQ').map((q: any) => ({
            ...q,
            questionText: q.text
        }))
    };

    const highestMark = examData.submissions.reduce((max: number, s: any) => Math.max(max, s.result?.total || 0), 0);

    const examInfo = {
        schoolName: settings?.instituteName || "Digital School",
        schoolAddress: settings?.address || "Dhaka, Bangladesh",
        logoUrl: settings?.logoUrl,
        title: examData.name,
        subject: examData.subject || "General",
        class: examData.class?.name || submission.student.className || "N/A",
        date: examData.startTime ? new Date(examData.startTime).toLocaleDateString() : new Date().toLocaleDateString(),
        set: examSetName,
        totalMarks: String(examData.totalMarks),
        mcqNegativeMarking: examData.mcqNegativeMarking || 0,
        cqRequiredQuestions: examData.cqRequiredQuestions,
        sqRequiredQuestions: examData.sqRequiredQuestions,
        highestMark: highestMark
    };

    // Need to pass QR data.
    const qrData = {
        examId,
        studentId,
        roll: submission.student.roll,
        hash: submission.id
    };

    return (
        <MathJaxContext config={mathJaxConfig}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
                {/* Header / Controls - Responsive and Sticky */}
                <div className="sticky top-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-8 print:hidden shadow-sm">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="min-w-0">
                                <h1 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                                    {submission?.student?.name || 'Student'}'s Answer Script
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        {examData?.name || 'Evaluation'}
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-[10px] text-blue-600 font-bold uppercase">
                                        Class {examData?.class?.name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="flex-1 sm:flex-none border-slate-200 dark:border-slate-700 font-bold"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                {isPrinting ? "Wait..." : "Print Script"}
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 sm:flex-none bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-bold"
                                onClick={() => window.print()}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Save as PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
                    {/* Brief Performance Summary for Web View */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">
                        {[
                            { label: 'Total Mark', value: submission?.result?.total, sub: `/ ${examData?.totalMarks}`, color: 'text-slate-900 dark:text-white' },
                            { label: 'Rank', value: rank ? `#${rank}` : 'N/A', sub: `of ${examData?.submissions?.length}`, color: 'text-amber-600' },
                            { label: 'Grade', value: submission?.result?.grade || 'N/A', sub: 'Performance', color: 'text-emerald-600' },
                            { label: 'Highest', value: highestMark, sub: 'In Class', color: 'text-blue-600' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                                    <span className="text-xs text-slate-400 font-medium">{stat.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* The Actual Script */}
                    <div className="bg-white dark:bg-white rounded-[2rem] shadow-2xl shadow-slate-200 dark:shadow-none overflow-hidden ring-1 ring-slate-100 print:ring-0 print:shadow-none print:rounded-none">
                        <div className="p-0 sm:p-2 md:p-4">
                            <MarkedQuestionPaper
                                ref={printRef}
                                examInfo={examInfo}
                                questions={questions}
                                submission={submission}
                                rank={rank}
                                totalStudents={examData.submissions.length}
                                qrData={qrData}
                            />
                        </div>
                    </div>

                    {/* Footer / Disclaimer for Web View */}
                    <div className="mt-12 text-center pb-12 print:hidden">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                            © 2026 DIGITAL SCHOOL • SECURE ACADEMIC RECORD
                        </p>
                    </div>
                </main>
            </div>

            {/* Print Styles Injection */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </MathJaxContext>
    );
}

