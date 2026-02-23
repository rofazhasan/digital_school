"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AIAnalysisCard } from "./student/AIAnalysisCard";
import { PerformancePredictor } from "./student/PerformancePredictor";
import { TrendingUp, Target, Award, BookOpen } from "lucide-react";
import { Line, Radar } from "react-chartjs-2";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StudentAnalyticsTabProps {
    analytics: any;
}

export function StudentAnalyticsTab({ analytics }: StudentAnalyticsTabProps) {
    if (!analytics) return <div className="p-8 text-center text-muted-foreground">No analytics data available.</div>;

    const performanceData = {
        labels: (analytics.trends || []).map((t: any) => t.label),
        datasets: [
            {
                label: 'Your Score (%)',
                data: (analytics.trends || []).map((t: any) => t.score),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                borderWidth: 3,
            },
            {
                label: 'Class Average (%)',
                data: (analytics.trends || []).map((t: any) => t.classAverage),
                borderColor: 'rgba(100, 116, 139, 0.5)',
                borderDash: [5, 5],
                tension: 0.4,
                fill: false,
                pointRadius: 0,
                borderWidth: 2,
            }
        ]
    };

    const radarData = {
        labels: (analytics.subjectPerformance || []).map((s: any) => s.subject),
        datasets: [{
            label: 'Proficiency %',
            data: (analytics.subjectPerformance || []).map((s: any) => s.score),
            backgroundColor: 'rgba(244, 63, 94, 0.2)',
            borderColor: 'rgb(244, 63, 94)',
            borderWidth: 2,
            pointBackgroundColor: 'rgb(244, 63, 94)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(244, 63, 94)'
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* AI Insights & Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AIAnalysisCard insights={analytics?.insights || []} />
                </div>
                <div>
                    <PerformancePredictor projection={analytics?.projection || null} />
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-xl border border-white/10 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Academic Growth
                        </CardTitle>
                        <CardDescription>Your score trends relative to class average.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {(analytics.trends || []).length > 0 ? (
                            <Line
                                data={performanceData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 6, padding: 20 } },
                                        tooltip: {
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            padding: 12,
                                            titleFont: { size: 14, weight: 'bold' },
                                            bodyFont: { size: 13 },
                                            cornerRadius: 8,
                                            displayColors: false
                                        }
                                    },
                                    scales: {
                                        y: { min: 0, max: 100, grid: { color: 'rgba(156, 163, 175, 0.05)' }, border: { display: false } },
                                        x: { grid: { display: false }, border: { display: false } }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic py-12">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                    Take more exams to see your progress trend!
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-xl border border-white/10 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-rose-500" />
                            Subject-wise Mastery
                        </CardTitle>
                        <CardDescription>Visualizing your core competencies across subjects.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {(analytics.subjectPerformance || []).length > 0 ? (
                            <Radar
                                data={radarData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            min: 0,
                                            max: 100,
                                            ticks: { display: false },
                                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                            angleLines: { color: 'rgba(156, 163, 175, 0.1)' },
                                            pointLabels: { font: { size: 11, weight: 600 } }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic py-12">
                                <div className="text-center">
                                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                    No subject data available yet.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

