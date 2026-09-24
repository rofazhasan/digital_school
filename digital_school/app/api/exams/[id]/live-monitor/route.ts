import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokenData = await getTokenFromRequest(req);
        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: examId } = await params;

        // Fetch exam with sets, submissions, student maps, and results in a SINGLE batch query
        // This eliminates all N+1 database roundtrips!
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                examSets: true,
                examStudentMaps: {
                    select: {
                        studentId: true,
                        examSetId: true
                    }
                },
                results: {
                    select: {
                        studentId: true,
                        cqMarks: true,
                        sqMarks: true,
                        total: true
                    }
                },
                examSubmissions: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: { name: true, email: true }
                                },
                                class: {
                                    select: { name: true, section: true }
                                }
                            }
                        }
                    },
                    orderBy: { objectiveSubmittedAt: 'asc' }
                },
                class: {
                    select: { name: true }
                }
            }
        });

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // Fast In-Memory Lookups
        const studentSetMap = new Map<string, string>();
        if (exam.examStudentMaps) {
            for (const map of exam.examStudentMaps) {
                if (map.examSetId) {
                    studentSetMap.set(map.studentId, map.examSetId);
                }
            }
        }

        const studentResultMap = new Map<string, any>();
        if (exam.results) {
            for (const res of exam.results) {
                studentResultMap.set(res.studentId, res);
            }
        }

        // 1. Prepare Question Maps
        const studentQuestionsMap = new Map<string, any[]>();
        let defaultQuestions: any[] = [];

        // Parse Generated Set Questions (Default)
        if (exam.generatedSet && typeof exam.generatedSet === 'object') {
            const generatedSet = exam.generatedSet as any;
            if (generatedSet.questions && Array.isArray(generatedSet.questions)) {
                defaultQuestions = generatedSet.questions;
            }
        }

        // Parse Exam Sets Questions
        if (exam.examSets) {
            for (const examSet of exam.examSets) {
                if (examSet.questionsJson) {
                    try {
                        const questionsJson = typeof examSet.questionsJson === 'string'
                            ? JSON.parse(examSet.questionsJson)
                            : examSet.questionsJson;
                        if (Array.isArray(questionsJson)) {
                            studentQuestionsMap.set(examSet.id, questionsJson);
                        }
                    } catch (e) {
                        console.error('Error parsing questionsJson:', e);
                    }
                }
            }
        }

        // Helper: Normalize String for comparison
        const normalize = (s: string) => String(s).trim().toLowerCase().normalize();

        // Dynamically import evaluation utilities
        const { evaluateMCQuestion } = await import("@/lib/evaluation/mcEvaluation");
        const { evaluateINTQuestion } = await import("@/lib/evaluation/intEvaluation");
        const { evaluateARQuestion } = await import("@/lib/evaluation/arEvaluation");
        const { evaluateMTFQuestion } = await import("@/lib/evaluation/mtfEvaluation");

        const now = new Date();
        const nowMs = now.getTime();
        const serverTime = now.toISOString();

        // Calculate allowed duration for the exam
        const durationMinutes = (Number(exam.objectiveTime || 0) > 0 && Number(exam.cqSqTime || 0) > 0)
            ? (Number(exam.objectiveTime) + Number(exam.cqSqTime))
            : (Number(exam.duration) || 60);
        const durationSeconds = durationMinutes * 60;

        // 2. Process Submissions for Live Monitor
        const liveData = exam.examSubmissions.map((submission) => {
            // Determine questions for this student
            let studentQuestions = defaultQuestions;
            let examSetId = submission.examSetId || studentSetMap.get(submission.studentId) || null;

            if (examSetId && studentQuestionsMap.has(examSetId)) {
                studentQuestions = studentQuestionsMap.get(examSetId) || defaultQuestions;
            }

            if (studentQuestions.length === 0 && studentQuestionsMap.size > 0) {
                studentQuestions = studentQuestionsMap.values().next().value || defaultQuestions;
            }

            // Calculate Stats
            const answers = (typeof submission.answers === 'object' && submission.answers !== null)
                ? (submission.answers as Record<string, any>)
                : {};
            const totalQuestions = studentQuestions.length || 10;
            let answeredQuestions = 0;
            let objectiveScore = 0;

            for (const q of studentQuestions) {
                const type = (q.type || '').toUpperCase();
                const ans = answers[q.id];
                const hasAnswer = ans !== undefined && ans !== null && ans !== "";

                // For SMCQ, check sub-answers
                let hasSMCQAnswer = false;
                if (type === 'SMCQ') {
                    const subs = q.subQuestions || q.sub_questions || [];
                    hasSMCQAnswer = subs.some((_: any, idx: number) => {
                        const subAns = answers[`${q.id}_sub_${idx}`];
                        return subAns !== undefined && subAns !== null && subAns !== "";
                    });
                }

                if (hasAnswer || hasSMCQAnswer) {
                    answeredQuestions++;

                    if (type === 'MCQ') {
                        let isCorrect = false;
                        const userAns = normalize(ans);
                        if (q.options && Array.isArray(q.options)) {
                            const correctOpt = q.options.find((o: any) => o.isCorrect);
                            if (correctOpt) isCorrect = userAns === normalize(correctOpt.text || String(correctOpt));
                        }
                        if (!isCorrect && (q.correctAnswer || q.correct)) {
                            isCorrect = userAns === normalize(String(q.correctAnswer || q.correct));
                        }

                        if (isCorrect) {
                            objectiveScore += q.marks;
                        } else if (exam.mcqNegativeMarking) {
                            objectiveScore -= (q.marks * exam.mcqNegativeMarking) / 100;
                        }
                    } else if (type === 'MC') {
                        objectiveScore += evaluateMCQuestion(q, ans || { selectedOptions: [] }, {
                            negativeMarking: exam.mcqNegativeMarking || 0,
                            partialMarking: true
                        });
                    } else if (type === 'INT' || type === 'NUMERIC') {
                        const res = evaluateINTQuestion(q, ans);
                        objectiveScore += res.score;
                    } else if (type === 'AR') {
                        const res = evaluateARQuestion(q, ans);
                        objectiveScore += res.score;
                    } else if (type === 'MTF') {
                        const res = evaluateMTFQuestion(q, ans || {});
                        objectiveScore += res.score;
                    } else if (type === 'SMCQ') {
                        const subs = q.subQuestions || q.sub_questions || [];
                        let smcqScore = 0;
                        subs.forEach((subQ: any, sIdx: number) => {
                            const subAns = answers[`${q.id}_sub_${sIdx}`];
                            if (!subAns) return;

                            let isSubCorrect = false;
                            const subNorm = (s: any) => String(s || "").trim().toLowerCase();
                            const userSubAns = subNorm(subAns);

                            if (subQ.options && Array.isArray(subQ.options)) {
                                const correctOpt = subQ.options.find((o: any) => o.isCorrect);
                                if (correctOpt) isSubCorrect = userSubAns === subNorm(correctOpt.text || String(correctOpt));
                            }
                            if (!isSubCorrect && (subQ.correctAnswer || subQ.correct)) {
                                isSubCorrect = userSubAns === subNorm(String(subQ.correctAnswer || subQ.correct));
                            }
                            if (isSubCorrect) smcqScore += (Number(subQ.marks) || 1);
                        });
                        objectiveScore += smcqScore;
                    }
                }
            }

            // Get marks from pre-loaded Result lookup map (zero DB queries!)
            const result = studentResultMap.get(submission.studentId);
            const cqMarks = result?.cqMarks || 0;
            const sqMarks = result?.sqMarks || 0;
            const totalScore = Math.max(0, objectiveScore) + cqMarks + sqMarks;

            const isDone = (submission.status as string) === 'COMPLETED' || submission.status === 'SUBMITTED' || !!submission.evaluatedAt;
            const evaluationStatus = isDone ? 'COMPLETED' : 'IN_PROGRESS';

            // Timing comparisons
            const startedAtDate = submission.objectiveStartedAt || submission.cqSqStartedAt || null;
            const startedAt = startedAtDate ? new Date(startedAtDate).toISOString() : null;

            let elapsedSeconds = 0;
            let remainingSeconds = durationSeconds;
            let timeSpentSeconds = 0;
            let isOverdue = false;

            if (startedAtDate) {
                const startMs = new Date(startedAtDate).getTime();
                elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

                if (isDone) {
                    const finishedAt = submission.evaluatedAt || submission.cqSqSubmittedAt || submission.objectiveSubmittedAt || now;
                    timeSpentSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - startMs) / 1000));
                    remainingSeconds = 0;
                    isOverdue = false;
                } else {
                    timeSpentSeconds = elapsedSeconds;
                    remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
                    if (exam.endTime) {
                        const untilEnd = Math.max(0, Math.floor((new Date(exam.endTime).getTime() - nowMs) / 1000));
                        remainingSeconds = Math.min(remainingSeconds, untilEnd);
                    }
                    isOverdue = elapsedSeconds > durationSeconds;
                }
            }

            return {
                id: submission.id,
                studentId: submission.studentId,
                studentName: submission.student.user.name,
                roll: submission.student.roll,
                className: submission.student.class?.name || '',
                section: submission.student.class?.section || '',
                status: evaluationStatus,
                progress: Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100)) || 0,
                answered: answeredQuestions,
                totalQuestions: totalQuestions,
                score: parseFloat(totalScore.toFixed(2)),
                objectiveScore: parseFloat(Math.max(0, objectiveScore).toFixed(2)),
                cqMarks,
                sqMarks,
                maxScore: exam.totalMarks,
                lastActive: submission.evaluatedAt || submission.cqSqSubmittedAt || submission.objectiveSubmittedAt || null,
                startedAt,
                durationMinutes,
                durationSeconds,
                elapsedSeconds,
                remainingSeconds,
                timeSpentSeconds,
                isOverdue,
                answers: answers,
                examSetId: examSetId
            };
        });

        const questionsBySet: Record<string, any[]> = {};
        for (const [key, val] of studentQuestionsMap.entries()) {
            questionsBySet[key] = val;
        }

        return NextResponse.json({
            examName: exam.name,
            examDuration: exam.duration,
            objectiveTime: exam.objectiveTime,
            cqSqTime: exam.cqSqTime,
            startTime: exam.startTime ? new Date(exam.startTime).toISOString() : null,
            endTime: exam.endTime ? new Date(exam.endTime).toISOString() : null,
            serverTime,
            totalStudents: liveData.length,
            activeStudents: liveData.filter(s => s.status === 'IN_PROGRESS').length,
            submittedStudents: liveData.filter(s => s.status === 'COMPLETED').length,
            liveData,
            questionsBySet,
            defaultQuestions
        });

    } catch (error) {
        console.error("Live Monitor Error:", error);
        return NextResponse.json({ error: "Failed to fetch live data" }, { status: 500 });
    }
}
