"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { MathJaxContext } from 'better-react-mathjax';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch full exam evaluation data which includes all submissions
                const response = await fetch(`/api/exams/evaluations/${examId}`);
                if (!response.ok) throw new Error("Failed to fetch exam data");

                const data = await response.json();

                // Find the specific student submission
                const studentSub = data.submissions.find((s: any) => s.student.id === studentId);

                if (!studentSub) {
                    throw new Error("Student submission not found");
                }

                // Calculate Rank
                // Sort submissions by total marks (descending)
                const sortedSubmissions = [...data.submissions].sort((a: any, b: any) => {
                    const marksA = a.result?.total || 0;
                    const marksB = b.result?.total || 0;
                    return marksB - marksA;
                });

                const studentRank = sortedSubmissions.findIndex((s: any) => s.student.id === studentId) + 1;

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
    });

    const mathJaxConfig = {
        loader: { load: ["[tex]/ams"] },
        tex: { packages: { '[+]': ['ams'] } },
        startup: {
            pageReady: () => {
                setIsMathJaxReady(true);
                (window as any).__IS_MATHJAX_READY = true;
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

    if (!examData || !submission) return null;

    // Prepare questions structure for MarkedQuestionPaper
    // The API likely returns flat questions or clustered. 
    // Based on EvaluationPage.tsx: `exam.questions` is an array of Question. 
    // We need to group them into mcq, cq, sq for the component.

    const questions = {
        mcq: examData.questions.filter((q: any) => q.type === 'mcq').map((q: any) => ({
            ...q,
            q: q.text // Component expects 'q' for text
        })),
        cq: examData.questions.filter((q: any) => q.type === 'cq').map((q: any) => ({
            ...q,
            questionText: q.text // Component expects 'questionText'
        })),
        sq: examData.questions.filter((q: any) => q.type === 'sq').map((q: any) => ({
            ...q,
            questionText: q.text
        }))
    };

    const examInfo = {
        schoolName: "Digital School", // Or fetch from somewhere if available
        schoolAddress: "Dhaka, Bangladesh",
        title: examData.name,
        subject: "General", // The API response didn't explicitly show subject in the evaluation view, might need to extract or fallback
        class: submission.student.className || examData.class?.name || "N/A",
        date: new Date(examData.date).toLocaleDateString(),
        set: examData.set || "A", // If applicable
        totalMarks: String(examData.totalMarks),
        mcqNegativeMarking: examData.mcqNegativeMarking,
        cqRequiredQuestions: examData.cqRequiredQuestions,
        sqRequiredQuestions: examData.sqRequiredQuestions
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
            <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
                {/* Controls - Hidden in Print */}
                <div className="mb-6 flex justify-between items-center max-w-5xl mx-auto print:hidden">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} disabled={isPrinting}>
                            <Printer className="mr-2 h-4 w-4" />
                            {isPrinting ? "Preparing..." : "Print Script"}
                        </Button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="max-w-5xl mx-auto print:max-w-none">
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
        </MathJaxContext>
    );
}
