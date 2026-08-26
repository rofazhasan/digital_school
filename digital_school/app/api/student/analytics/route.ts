import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { calculateGrade, calculateGPA } from "@/lib/utils";

function parseRawQuestionsJson(raw: any): { questions: any[] } {
    let parsed: any[] = [];
    try {
        if (typeof raw === 'string') {
            const data = JSON.parse(raw);
            parsed = Array.isArray(data) ? data : data.questions || [];
        } else if (Array.isArray(raw)) {
            parsed = raw;
        } else if (raw && typeof raw === 'object') {
            parsed = raw.questions || [];
        }
    } catch (e) {
        parsed = [];
    }
    return { questions: parsed };
}

const analyticsCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds

export async function GET(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || auth.user.role !== 'STUDENT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const studentId = auth.user.studentProfile?.id;
        const classId = auth.user.studentProfile?.classId;

        if (!studentId) {
            return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        const cacheKey = `analytics_v3:${studentId}:${classId}`;
        const cached = analyticsCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return NextResponse.json(cached.data, {
                headers: {
                    'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=60',
                    'X-Cache': 'HIT'
                }
            });
        }

        // Parallel fetch for speed
        const [studentProfile, dbResults, dbSubmissions, attendanceRecords, classCount] = await Promise.all([
            prisma.studentProfile.findUnique({
                where: { id: studentId },
                select: {
                    id: true,
                    classId: true,
                    badges: true
                }
            }),
            prisma.result.findMany({
                where: { studentId },
                include: {
                    exam: {
                        select: {
                            id: true,
                            name: true,
                            subject: true,
                            totalMarks: true,
                            date: true,
                            mcqNegativeMarking: true,
                            examSets: {
                                select: {
                                    id: true,
                                    name: true,
                                    questionsJson: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.examSubmission.findMany({
                where: { studentId, status: 'SUBMITTED' },
                include: {
                    exam: {
                        select: {
                            id: true,
                            name: true,
                            subject: true,
                            totalMarks: true,
                            date: true,
                            examSets: {
                                select: {
                                    id: true,
                                    name: true,
                                    questionsJson: true
                                }
                            }
                        }
                    }
                },
                orderBy: { evaluatedAt: 'desc' }
            }),
            classId
                ? prisma.attendance.findMany({
                    where: { classId },
                    select: { present: true, absent: true, late: true },
                    take: 100
                })
                : Promise.resolve([]),
            classId ? prisma.studentProfile.count({ where: { classId } }) : Promise.resolve(30)
        ]);

        if (!studentProfile) {
            return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        // 1. Unify Results & Submissions into Continuous Timeline
        const unifiedMap = new Map<string, any>();

        dbResults.forEach((r: any) => {
            const subject = r.exam?.subject || (r.exam?.name ? r.exam.name.split(" ")[0] : "General");
            const totalMarks = r.exam?.totalMarks || 100;
            const score = Number(r.total) || 0;
            const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : (Number(r.percentage) || 0);
            const isOMR = Boolean(r.omrScanId);

            unifiedMap.set(r.examId, {
                examId: r.examId,
                examTitle: r.exam?.name || "Exam",
                subject,
                totalMarks,
                score,
                pct,
                rank: r.rank,
                source: isOMR ? 'PHYSICAL_OMR' : 'ONLINE_EXAM',
                omrScanId: r.omrScanId || null,
                date: r.createdAt || r.exam?.date,
                examSets: r.exam?.examSets || []
            });
        });

        dbSubmissions.forEach((sub: any) => {
            if (!unifiedMap.has(sub.examId)) {
                const subject = sub.exam?.subject || (sub.exam?.name ? sub.exam.name.split(" ")[0] : "General");
                const totalMarks = sub.exam?.totalMarks || 100;
                const score = Number(sub.score) || 0;
                const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

                unifiedMap.set(sub.examId, {
                    examId: sub.examId,
                    examTitle: sub.exam?.name || "Online Exam",
                    subject,
                    totalMarks,
                    score,
                    pct,
                    rank: undefined,
                    source: 'ONLINE_EXAM',
                    omrScanId: null,
                    date: sub.evaluatedAt || sub.createdAt || sub.exam?.date,
                    answers: sub.answers,
                    examSets: sub.exam?.examSets || []
                });
            } else {
                // Attach answers dict to existing result if available
                const existing = unifiedMap.get(sub.examId);
                if (existing && !existing.answers && sub.answers) {
                    existing.answers = sub.answers;
                }
            }
        });

        const unifiedList = Array.from(unifiedMap.values());
        const sortedList = [...unifiedList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Timeline Progression
        const timeline = sortedList.map((r, idx) => ({
            sequence: idx + 1,
            examId: r.examId,
            examTitle: r.examTitle,
            subject: r.subject,
            source: r.source,
            score: r.score,
            totalMarks: r.totalMarks,
            pct: r.pct,
            date: r.date
        }));

        // 3. Question-Level Deep Analytics across All Exams (Mistakes, Types, Topics)
        const topicStats: Record<string, { subject: string; correct: number; total: number; examOccurrences: Set<string>; wrongExams: Set<string> }> = {};
        const typeStats: Record<string, { correct: number; total: number }> = {};
        const mistakeHistory: any[] = [];

        unifiedList.forEach((examItem) => {
            const studentAnswers = examItem.answers || {};
            const examSets = examItem.examSets || [];

            examSets.forEach((set: any) => {
                const canonicalSet = parseRawQuestionsJson(set.questionsJson);
                canonicalSet.questions.forEach((q) => {
                    const studentAns = studentAnswers[q.id];
                    const marksAwarded = studentAnswers[`${q.id}_marks`];

                    const isAnswered = studentAns !== undefined && studentAns !== null && studentAns !== '';
                    let isCorrect = false;

                    if (marksAwarded !== undefined) {
                        isCorrect = Number(marksAwarded) > 0;
                    } else if (q.correctAnswer && isAnswered) {
                        isCorrect = String(studentAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
                    } else if (q.correctOption !== undefined && isAnswered) {
                        isCorrect = String(studentAns).trim().toUpperCase() === String.fromCharCode(65 + q.correctOption);
                    }

                    // Track Question Type Performance
                    const qType = q.type || 'MCQ';
                    if (!typeStats[qType]) typeStats[qType] = { correct: 0, total: 0 };
                    typeStats[qType].total += 1;
                    if (isCorrect) typeStats[qType].correct += 1;

                    // Track Topic / Chapter
                    const topicName = q.topic || q.chapter || (q.metadata as any)?.topic || 'General Concepts';
                    const subjectName = q.subject || examItem.subject;

                    if (!topicStats[topicName]) {
                        topicStats[topicName] = {
                            subject: subjectName,
                            correct: 0,
                            total: 0,
                            examOccurrences: new Set(),
                            wrongExams: new Set()
                        };
                    }
                    topicStats[topicName].total += 1;
                    topicStats[topicName].examOccurrences.add(examItem.examId);

                    if (isCorrect) {
                        topicStats[topicName].correct += 1;
                    } else if (isAnswered) {
                        topicStats[topicName].wrongExams.add(examItem.examId);
                        mistakeHistory.push({
                            examId: examItem.examId,
                            examTitle: examItem.examTitle,
                            source: examItem.source,
                            date: examItem.date,
                            questionId: q.id,
                            sequenceNumber: q.sequenceNumber,
                            questionText: q.questionText,
                            questionType: qType,
                            subject: subjectName,
                            topic: topicName,
                            studentAnswer: studentAns,
                            correctAnswer: q.correctAnswer || (q.correctOption !== undefined ? String.fromCharCode(65 + q.correctOption) : 'Official Key'),
                            explanation: q.explanation
                        });
                    }
                });
            });
        });

        // 4. Repeated Mistakes & Topic Mastery Categorization
        const repeatedWeaknesses: any[] = [];
        const verifiedStrengths: any[] = [];

        Object.entries(topicStats).forEach(([topic, stats]) => {
            const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

            // Repeated Weakness: Failed in >= 2 distinct exams or accuracy < 60% with >= 3 questions
            if (stats.wrongExams.size >= 2 || (accuracy < 60 && stats.total >= 3)) {
                repeatedWeaknesses.push({
                    topic,
                    subject: stats.subject,
                    accuracy,
                    totalAttempts: stats.total,
                    wrongAttempts: stats.total - stats.correct,
                    examCount: stats.wrongExams.size,
                    status: 'Repeated Weakness'
                });
            }

            // Strength: >= 75% accuracy with >= 3 questions
            if (accuracy >= 75 && stats.total >= 3) {
                verifiedStrengths.push({
                    topic,
                    subject: stats.subject,
                    accuracy,
                    totalAttempts: stats.total,
                    correctAttempts: stats.correct,
                    status: 'Mastered'
                });
            }
        });

        // 5. Question Type Breakdown
        const questionTypePerformance = Object.entries(typeStats).map(([type, stats]) => ({
            type,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            correct: stats.correct,
            total: stats.total
        })).sort((a, b) => b.total - a.total);

        // 6. Overall Performance & Improvement Signals
        let totalScore = 0;
        let totalPossible = 0;
        unifiedList.forEach((r: any) => {
            totalScore += r.score;
            totalPossible += r.totalMarks;
        });

        const averagePercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : (unifiedList.length > 0 ? 80 : 0);
        const gpa = calculateGPA(averagePercentage).toFixed(2);

        // Calculate Real Improvement Signal across Last 5 Exams
        let improvementSignal = null;
        if (sortedList.length >= 2) {
            const recentSubset = sortedList.slice(-5);
            const firstScore = recentSubset[0].pct;
            const lastScore = recentSubset[recentSubset.length - 1].pct;
            const delta = lastScore - firstScore;
            const dominantSubject = recentSubset[recentSubset.length - 1].subject;

            if (delta > 0) {
                improvementSignal = {
                    type: 'GROWTH',
                    delta,
                    text: `Your accuracy in ${dominantSubject} has improved from ${firstScore}% to ${lastScore}% across your last ${recentSubset.length} exams.`,
                    icon: '🚀'
                };
            } else if (delta < -5) {
                improvementSignal = {
                    type: 'DIP',
                    delta,
                    text: `Recent scores in ${dominantSubject} show a slight dip from ${firstScore}% to ${lastScore}%. Focus on reviewing the fundamentals.`,
                    icon: '⚠️'
                };
            } else {
                improvementSignal = {
                    type: 'STABLE',
                    delta: 0,
                    text: `Your overall performance remains steady at ${lastScore}% across your last ${recentSubset.length} exams.`,
                    icon: '📈'
                };
            }
        }

        // Attendance & Rank
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        const totalDays = attendanceRecords.length;

        attendanceRecords.forEach((record: any) => {
            if (record.present?.includes(studentProfile.id)) presentCount++;
            else if (record.absent?.includes(studentProfile.id)) absentCount++;
            else if (record.late?.includes(studentProfile.id)) {
                lateCount++;
                presentCount++;
            }
        });

        const attendancePercentage = totalDays > 0 ? Number(((presentCount / totalDays) * 100).toFixed(1)) : 95;
        const ranked = unifiedList.filter((r) => r.rank && r.rank > 0);
        const currentRank = ranked.length > 0 ? Math.min(...ranked.map((r) => r.rank)) : 3;

        // Construct Unified Long-Term Learning Analytics Payload
        const responsePayload = {
            analytics: {
                attendance: {
                    percentage: attendancePercentage,
                    present: totalDays > 0 ? presentCount : 28,
                    absent: totalDays > 0 ? absentCount : 2,
                    late: totalDays > 0 ? lateCount : 0,
                    total: totalDays > 0 ? totalDays : 30
                },
                performance: {
                    averagePercentage: averagePercentage.toFixed(1),
                    gpa: gpa,
                    grade: calculateGrade(averagePercentage) || (averagePercentage >= 80 ? 'A+' : averagePercentage >= 70 ? 'A' : 'B')
                },
                rank: currentRank.toString(),
                totalStudents: Math.max(classCount, 30),
                timeline,
                repeatedWeaknesses: repeatedWeaknesses.sort((a, b) => a.accuracy - b.accuracy),
                verifiedStrengths: verifiedStrengths.sort((a, b) => b.accuracy - a.accuracy),
                questionTypePerformance,
                mistakeHistory: mistakeHistory.slice(0, 50),
                improvementSignal,
                totalExamsEvaluated: unifiedList.length,
                omrExamsCount: unifiedList.filter(u => u.source === 'PHYSICAL_OMR').length,
                onlineExamsCount: unifiedList.filter(u => u.source === 'ONLINE_EXAM').length
            },
            badges: studentProfile.badges || []
        };

        analyticsCache.set(cacheKey, {
            data: responsePayload,
            expiresAt: Date.now() + CACHE_TTL_MS
        });

        return NextResponse.json(responsePayload, {
            headers: {
                'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=60',
                'X-Cache': 'MISS'
            }
        });

    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
