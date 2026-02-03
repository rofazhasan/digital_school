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

export function StudentAnalyticsTab() {
    const performanceData = {
        labels: ['Unit 1', 'Mid-Term', 'Unit 2', 'Final (Mock)'],
        datasets: [
            {
                label: 'My Score (%)',
                data: [78, 82, 85, 88],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            },
            {
                label: 'Class Average (%)',
                data: [72, 75, 74, 76],
                borderColor: 'rgb(201, 203, 207)',
                borderDash: [5, 5],
                tension: 0.1,
                fill: false
            }
        ]
    };

    const subjectStrengths = {
        labels: ['Physics', 'Math', 'Chemistry', 'English', 'Biology'],
        datasets: [
            {
                label: 'Score',
                data: [85, 90, 78, 82, 88],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Academic Progress</CardTitle>
                        <CardDescription>Your performance trend over the semester.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Line data={performanceData} height={300} options={{ maintainAspectRatio: false }} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Subject Performance</CardTitle>
                        <CardDescription>Marks distribution across subjects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Bar data={subjectStrengths} height={300} options={{ maintainAspectRatio: false }} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
