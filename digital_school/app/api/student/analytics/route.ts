import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || auth.user.role !== 'STUDENT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const session = { user: auth.user }; // Mapping for compatibility

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                class: true,
                results: {
                    include: { exam: true }
                },
                badges: true
            }
        });

        if (!studentProfile) {
            return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        // 1. Calculate Average Score/Grade (Basic)
        const results = studentProfile.results;
        let totalScore = 0;
        let totalPossible = 0;

        results.forEach((r: any) => {
            totalScore += r.total;
            // Assuming exam total marks is stored on Exam model
            totalPossible += r.exam.totalMarks;
        });

        const averagePercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
        const gpa = (averagePercentage / 20).toFixed(2); // Rough 5.0 scale approximation

        // 2. Attendance
        // Fetch attendance records where this student is present/absent
        // We need to query the Attendance model.
        // The Attendance model has `present: String[]`, `absent: String[]` which are arrays of student IDs (presumably).
        // Let's check schema: `present String[]`, `absent String[]`.

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                classId: studentProfile.classId
            }
        });

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let totalDays = attendanceRecords.length;

        attendanceRecords.forEach((record: any) => {
            if (record.present.includes(studentProfile.id)) presentCount++;
            else if (record.absent.includes(studentProfile.id)) absentCount++;
            else if (record.late.includes(studentProfile.id)) {
                lateCount++;
                presentCount++; // Usually late counts as present
            }
        });

        const attendancePercentage = totalDays > 0 ? Number(((presentCount / totalDays) * 100).toFixed(1)) : 0;

        // 3. Rank
        // To get rank, we need to compare with others in the same class.
        // This can be expensive. For now, maybe just use the rank from the latest result if available.
        // Or calculate based on total cumulative score.
        // Let's stick to the latest result rank for "Class Rank" card.

        const latestResult = results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const currentRank = latestResult?.rank || '-';

        // 4. Badges
        const badges = studentProfile.badges.map(b => ({
            ...b,
            icon: b.type === 'EXCELLENCE' ? '🏆' : b.type === 'ACHIEVEMENT' ? '🏅' : b.type === 'MILESTONE' ? '🎯' : '⭐',
            earnedAt: b.issuedDate
        }));

        // 5. Leaderboard (Class-wide)
        // Fetch all students in the same class to calculate standings
        const classStudents = await prisma.studentProfile.findMany({
            where: { classId: studentProfile.classId },
            include: {
                user: { select: { name: true } },
                results: true
            }
        });

        const leaderboard = classStudents.map(student => {
            const studentResults = student.results;
            const totalScore = studentResults.reduce((acc, r) => acc + r.total, 0);
            const totalCount = studentResults.length;

            // Calculate a score that combines total performance
            // For now, using average percentage if results exist, otherwise 0
            let avgScore = 0;
            if (totalCount > 0) {
                const totalPossible = studentResults.length * 100; // Simplified assumption: each exam is 100 max for leaderboard purposes
                avgScore = (totalScore / totalPossible) * 100;
            }

            return {
                rank: 0, // Will be set after sorting
                name: student.user.name,
                score: Math.round(avgScore),
                isCurrent: student.id === studentProfile.id
            };
        })
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({ ...entry, rank: index + 1 }))
            .slice(0, 10); // Return top 10 for more depth

        // 6. Trends & Subject Performance
        const examIds = results.map(r => r.examId);
        const classResults = await prisma.result.findMany({
            where: {
                examId: { in: examIds },
                student: { classId: studentProfile.classId }
            },
            select: {
                examId: true,
                total: true
            }
        });

        const examAverages: { [key: string]: { total: number, count: number } } = {};
        classResults.forEach(r => {
            if (!examAverages[r.examId]) examAverages[r.examId] = { total: 0, count: 0 };
            examAverages[r.examId].total += r.total;
            examAverages[r.examId].count += 1;
        });

        const sortedResults = [...results].sort((a, b) => new Date(a.exam.date).getTime() - new Date(b.exam.date).getTime());
        const trends = sortedResults.map(r => {
            const classData = examAverages[r.examId];
            const classAvg = classData ? Math.round((classData.total / (classData.count * r.exam.totalMarks)) * 100) : 0;

            return {
                label: r.exam.name,
                score: Math.round((r.total / r.exam.totalMarks) * 100),
                classAverage: classAvg,
                date: r.exam.date,
                // Removed invalid subject reference as it doesn't exist on Exam model in schema
            };
        });

        // Subject Strengths
        const subjectGroups: { [key: string]: { total: number, possible: number, count: number, history: number[] } } = {};
        results.forEach(r => {
            const subject = r.exam.name || 'General'; // Using exam name as subject identifier if subject field is missing or generic
            if (!subjectGroups[subject]) subjectGroups[subject] = { total: 0, possible: 0, count: 0, history: [] };
            subjectGroups[subject].total += r.total;
            subjectGroups[subject].possible += r.exam.totalMarks;
            subjectGroups[subject].count += 1;
            subjectGroups[subject].history.push(Math.round((r.total / r.exam.totalMarks) * 100));
        });

        const subjectPerformance = Object.entries(subjectGroups).map(([subject, data]) => ({
            subject,
            score: Math.round((data.total / data.possible) * 100),
            trend: data.history.length > 1 ? (data.history[data.history.length - 1] - data.history[data.history.length - 2]) : 0
        }));

        // 7. AI Analysis & Insights
        const aiInsights = generateInsights(averagePercentage, trends, subjectPerformance, attendancePercentage);

        // 8. Predictive Analytics (Score Projection)
        const projection = calculateProjection(trends);

        return NextResponse.json({
            analytics: {
                attendance: {
                    percentage: attendancePercentage,
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    total: totalDays
                },
                performance: {
                    averagePercentage: averagePercentage.toFixed(1),
                    gpa: gpa,
                    grade: calculateGrade(averagePercentage)
                },
                rank: currentRank,
                totalStudents: classStudents.length,
                leaderboard,
                trends,
                subjectPerformance,
                insights: aiInsights,
                projection
            },
            badges
        });

    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

function generateInsights(avg: number, trends: any[], subjects: any[], attendance: number) {
    const insights = [];

    // General Performance
    if (avg >= 80) insights.push({ text: "You're demonstrating mastery across subjects. Keep leading the way!", type: "good", icon: "🚀" });
    else if (avg >= 60) insights.push({ text: "Steady progress. Aim for consistency in your core subjects.", type: "neutral", icon: "📈" });
    else insights.push({ text: "Let's focus on building stronger fundamentals in weak areas.", type: "bad", icon: "💡" });

    // Subject Insights
    const topSubject = [...subjects].sort((a, b) => b.score - a.score)[0];
    if (topSubject && topSubject.score >= 85) {
        insights.push({ text: `Natural aptitude in ${topSubject.subject}! Consider advanced practice here.`, type: "good", icon: "🌟" });
    }

    const weakSubject = [...subjects].sort((a, b) => a.score - b.score)[0];
    if (weakSubject && weakSubject.score < 50) {
        insights.push({ text: `Prioritize ${weakSubject.subject} in your next study session to bridge the gap.`, type: "bad", icon: "🎯" });
    }

    // Trend Analysis
    if (trends.length >= 2) {
        const last = trends[trends.length - 1].score;
        const prev = trends[trends.length - 2].score;
        if (last > prev + 5) insights.push({ text: "Incredible growth in your recent exams! The effort is paying off.", type: "good", icon: "🔥" });
        else if (last < prev - 10) insights.push({ text: "Recent scores show a slight dip. Take a breath and review the basics.", type: "bad", icon: "⚠️" });
    }

    // Attendance
    if (attendance < 75) insights.push({ text: "Attending more classes could significantly boost your understanding.", type: "bad", icon: "📅" });

    return insights;
}

function calculateProjection(trends: any[]) {
    if (trends.length < 2) return null;

    // Simple linear projection based on last 3 points
    const recent = trends.slice(-3);
    const sum = recent.reduce((acc, r) => acc + r.score, 0);
    const avg = sum / recent.length;

    // Growth factor
    const growth = recent.length > 1 ? (recent[recent.length - 1].score - recent[0].score) / (recent.length - 1) : 0;

    return {
        nextPredictedScore: Math.min(100, Math.max(0, Math.round(avg + growth))),
        growthRate: growth.toFixed(1),
        confidence: recent.length > 2 ? 'High' : 'Medium'
    };
}

function calculateGrade(percentage: number) {
    if (percentage >= 80) return 'A+';
    if (percentage >= 75) return 'A';
    if (percentage >= 70) return 'A-';
    if (percentage >= 65) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

