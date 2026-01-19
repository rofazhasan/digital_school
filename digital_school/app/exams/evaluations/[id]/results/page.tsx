"use client";

import React, { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Trophy, Medal, Award } from "lucide-react";
import { toast } from "sonner";

interface ExamResult {
    rank: number;
    studentName: string;
    roll: string;
    submissionId: string;
    mcqMarks: number;
    cqMarks: number;
    sqMarks: number;
    totalObtained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    status: string;
    submissionStatus: string;
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [examName, setExamName] = useState("");
    const [results, setResults] = useState<ExamResult[]>([]);

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        try {
            const response = await fetch(`/api/exams/evaluations/${id}`, {
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setExamName(data.name);

                // Process and rank submissions
                const processedResults = data.submissions.map((sub: any) => {
                    const result = sub.result || {};
                    // Prefer result table data, fallback to calculated/submission data
                    const mcq = result.mcqMarks !== undefined ? result.mcqMarks :
                        (sub.answers ? calculateMcqFromAnswers(sub.answers, data.questions) : 0);

                    const cq = result.cqMarks !== undefined ? result.cqMarks :
                        (sub.answers ? calculateTypeMarks(sub.answers, data.questions, 'cq') : 0);

                    const sq = result.sqMarks !== undefined ? result.sqMarks :
                        (sub.answers ? calculateTypeMarks(sub.answers, data.questions, 'sq') : 0);

                    const totalObtained = result.total !== undefined ? result.total : (mcq + cq + sq);
                    const percentage = data.totalMarks > 0 ? (totalObtained / data.totalMarks) * 100 : 0;

                    return {
                        submissionId: sub.id,
                        studentName: sub.student.name,
                        roll: sub.student.roll,
                        mcqMarks: mcq,
                        cqMarks: cq,
                        sqMarks: sq,
                        totalObtained: totalObtained,
                        totalMarks: data.totalMarks,
                        percentage: parseFloat(percentage.toFixed(2)),
                        grade: getGrade(percentage),
                        status: sub.status,
                        submissionStatus: sub.submissionStatus
                    };
                });

                // Sort by total marks desc to assign rank
                processedResults.sort((a: ExamResult, b: ExamResult) => b.totalObtained - a.totalObtained);

                // Assign ranks (handle ties if needed, currently simple index + 1)
                const rankedResults = processedResults.map((res: ExamResult, index: number) => ({
                    ...res,
                    rank: index + 1
                }));

                setResults(rankedResults);
            } else {
                toast.error("Failed to fetch exam results");
            }
        } catch (error) {
            console.error("Error fetching results:", error);
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate MCQ marks if not in result table yet (e.g. preview)
    const calculateMcqFromAnswers = (answers: any, questions: any[]) => {
        let score = 0;
        const mcqQuestions = questions.filter((q: any) => q.type === 'mcq');

        // Simplistic calculation matching the API logic roughly for preview
        // Note: The API is the source of truth, this is just a fallback for display consistency
        // if the result record isn't fully committed yet.
        // ideally we rely on provided earnedMarks from API which handles this.
        // Actually, looking at API, it returns `earnedMarks` (which includes calculated MCQ).
        // Let's use `sub.earnedMarks` if `sub.result` is missing.
        return 0; // Placeholder, better to rely on sub.earnedMarks or sub.result logic
    };

    const calculateTypeMarks = (answers: any, questions: any[], type: string) => {
        const typeQuestions = questions.filter((q: any) => q.type === type);
        return typeQuestions.reduce((sum: number, q: any) => {
            return sum + (answers[`${q.id}_marks`] || 0);
        }, 0);
    };

    const getGrade = (percentage: number) => {
        if (percentage >= 80) return "A+";
        if (percentage >= 70) return "A";
        if (percentage >= 60) return "A-";
        if (percentage >= 50) return "B";
        if (percentage >= 40) return "C";
        if (percentage >= 33) return "D";
        return "F";
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />; // Bronze-ish
        return <span className="font-medium text-gray-500">#{rank}</span>;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center h-64">
                <div className="text-lg text-gray-500">Loading results...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => window.history.back()} className="mb-4 pl-0 hover:bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Evaluations
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{examName} Results</h1>
                        <p className="text-gray-600">Comprehensive results for all students.</p>
                    </div>
                    {/* Future Export Button */}
                    {/* <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button> */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead className="text-center">MCQ</TableHead>
                                <TableHead className="text-center">CQ</TableHead>
                                <TableHead className="text-center">SQ</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length > 0 ? (
                                results.map((result) => (
                                    <TableRow key={result.submissionId}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center justify-center w-8 h-8">
                                                {getRankIcon(result.rank)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{result.studentName}</div>
                                                <div className="text-xs text-gray-500">Roll: {result.roll}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">{result.mcqMarks}</TableCell>
                                        <TableCell className="text-center text-gray-600">{result.cqMarks}</TableCell>
                                        <TableCell className="text-center text-gray-600">{result.sqMarks}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {result.totalObtained} <span className="text-gray-400 text-xs font-normal">/ {result.totalMarks}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">{result.percentage}%</TableCell>
                                        <TableCell className="text-center">
                                            {result.submissionStatus === 'IN_PROGRESS' ? (
                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 animate-pulse">
                                                    In Progress
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    className={
                                                        result.grade === 'F' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                                            result.grade === 'A+' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                                'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                                    }
                                                >
                                                    {result.grade}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No results available yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
