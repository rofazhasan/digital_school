"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamLayout from "../../online/[id]/ExamLayout";
import { ExamContextProvider } from "../../online/[id]/ExamContext";

function PracticeExamContent({ params }: { params: Promise<{ id: string }> }) {
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const loadPracticeData = async () => {
            try {
                const { id } = await params;
                const res = await fetch(`/api/exams/${id}/practice/questions`);

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to load practice exam");
                }

                const data = await res.json();

                const fallbackDuration = data.exam.duration || 60; // 60 minutes
                const mockExam = {
                    ...data.exam,
                    questions: data.questions,
                    status: 'IN_PROGRESS',
                    objectiveStatus: 'IN_PROGRESS',
                    cqSqStatus: 'IN_PROGRESS',
                    isPractice: true, // Flag for UI differences
                    title: data.exam.name,
                    className: data.exam.subject || 'Academic',
                    duration: fallbackDuration,
                    objectiveTime: data.exam.objectiveTime || fallbackDuration,
                    cqSqTime: data.exam.cqSqTime || fallbackDuration,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + fallbackDuration * 60000).toISOString(),
                };

                setExam(mockExam);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPracticeData();
    }, [params]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-gray-900 dark:text-gray-100">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Loading practice environment...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Practice Unavailable</h2>
            <p className="text-muted-foreground max-w-md mb-6">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    if (!exam) return null;

    return (
        <ExamContextProvider exam={exam}>
            <div className="practice-exam-wrapper relative">
                {/* Visual indicator for practice mode */}
                <div className="fixed top-0 left-0 w-full h-1 bg-emerald-500 z-[100] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <ExamLayout />
            </div>
        </ExamContextProvider>
    );
}

export default function PracticeExamPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Initializing practice session...</p>
            </div>
        }>
            <PracticeExamContent params={params} />
        </Suspense>
    );
}
