"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Line, Bar } from "react-chartjs-2";
// Ensure ChartJS is registered in the parent/page or register here if needed, 
// strictly speaking it's better to register once in root or page, but component-level import of register is safe.
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
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
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
                label: 'My Score (%)',
                data: (analytics.trends || []).map((t: any) => t.score),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
                fill: true
            },
            {
                label: 'Class Average (%)',
                data: (analytics.trends || []).map((t: any) => t.classAverage),
                borderColor: 'rgba(100, 116, 139, 0.5)',
                borderDash: [5, 5],
                tension: 0.3,
                fill: false
            }
        ]
    };

    const subjectData = {
        labels: (analytics.subjectPerformance || []).map((s: any) => s.subject),
        datasets: [
            {
                label: 'Performance (%)',
                data: (analytics.subjectPerformance || []).map((s: any) => s.score),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(139, 92, 246, 0.6)',
                ],
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Insights Row */}
            {analytics.insights && analytics.insights.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {analytics.insights.map((insight: any, i: number) => (
                        <Card key={i} className={`border-none shadow-sm ${insight.type === 'good' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                            <CardContent className="p-4 flex items-center gap-3">
                                {insight.type === 'good' ? <div className="p-2 bg-green-500 rounded-full text-white">✓</div> : <div className="p-2 bg-red-500 rounded-full text-white">!</div>}
                                <span className="font-medium">{insight.text}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-none bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Academic Progress</CardTitle>
                        <CardDescription>Your performance trend across all exams.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {(analytics.trends || []).length > 0 ? (
                            <Line data={performanceData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                Take more exams to see your progress trend!
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Subject-wise Mastery</CardTitle>
                        <CardDescription>Average scores across different subjects.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {(analytics.subjectPerformance || []).length > 0 ? (
                            <Bar data={subjectData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                No subject data available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
