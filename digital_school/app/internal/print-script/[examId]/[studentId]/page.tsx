"use client";

import React, { useState, useEffect, use } from 'react';
import { MathJaxContext } from 'better-react-mathjax';
import { Loader2 } from 'lucide-react';
import MarkedQuestionPaper from '@/app/components/MarkedQuestionPaper';

export default function InternalStudentScriptPrintPage({ params, searchParams }: { params: Promise<{ examId: string; studentId: string }>, searchParams: Promise<{ secret?: string }> }) {
    const { examId, studentId } = use(params);
    const { secret } = use(searchParams);

    const [examData, setExamData] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [rank, setRank] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMathJaxReady, setIsMathJaxReady] = useState(false);

    const [settings, setSettings] = useState<any>(null);
    const [examSetName, setExamSetName] = useState<string>("A");

    useEffect(() => {
        const fetchData = async () => {
            if (!secret) {
                setError("Unauthorized: Missing Secret");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const headers = {
                    'x-internal-secret': secret
                };

                // Fetch settings
                const settingsRes = await fetch('/api/settings', { headers });
                const settingsData = settingsRes.ok ? await settingsRes.json() : null;
                setSettings(settingsData);

                // Fetch full exam evaluation data (using internal secret bypass)
                const response = await fetch(`/api/exams/evaluations/${examId}`, { headers });
                if (!response.ok) throw new Error("Failed to fetch exam data");

                const data = await response.json();

                // Find the specific student submission
                const studentSub = data.submissions.find((s: any) => s.student.id === studentId);

                if (!studentSub) {
                    throw new Error("Student submission not found");
                }

                // Calculate Rank and Highest Mark
                const sortedSubmissions = [...data.submissions].sort((a: any, b: any) => {
                    const marksA = a.result?.total || 0;
                    const marksB = b.result?.total || 0;
                    return marksB - marksA;
                });

                const studentRank = sortedSubmissions.findIndex((s: any) => s.student.id === studentId) + 1;

                // Fetch student's exam set name
                try {
                    const examSetResponse = await fetch(`/api/exams/${examId}/student-set/${studentId}`, { headers });
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
    }, [examId, studentId, secret]);

    const mathJaxConfig = {
        loader: { load: ["input/tex", "input/mml", "output/chtml"] },
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            packages: { '[+]': ['ams'] }
        },
        options: {
            enableEnrichment: false
        },
        startup: {
            pageReady: () => {
                setIsMathJaxReady(true);
                // Expose this so Puppeteer knows when MathJax is finished rendering
                (window as any).__IS_MATHJAX_READY = true;
                return (window as any).MathJax.startup.defaultPageReady();
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white" id="puppeteer-status" data-status="loading">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading Script...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500 bg-white" id="puppeteer-status" data-status="error">
                Error: {error}
            </div>
        );
    }

    const questions = {
        mcq: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'MCQ').map((q: any) => ({
            ...q,
            q: q.text
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
        })),
        mtf: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'MTF').map((q: any) => ({
            ...q,
            q: q.text
        })),
        cq: examData.questions.filter((q: any) => (q.type || "").toUpperCase() === 'CQ').map((q: any) => ({
            ...q,
            questionText: q.text
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

    const qrData = {
        examId,
        studentId,
        roll: submission.student.roll,
        hash: submission.id
    };

    return (
        <MathJaxContext config={mathJaxConfig}>
            <div id="puppeteer-status" data-status="ready" className="bg-white text-slate-900 font-sans" style={{ minHeight: '100vh', padding: '0', margin: '0' }}>
                <MarkedQuestionPaper
                    examInfo={examInfo}
                    questions={questions}
                    submission={submission}
                    rank={rank}
                    totalStudents={examData.submissions.length}
                    qrData={qrData}
                />
            </div>
        </MathJaxContext>
    );
}
