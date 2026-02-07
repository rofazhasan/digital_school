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

        const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 0;

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
                leaderboard
            },
            badges
        });

    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

function calculateGrade(percentage: number) {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
}
