import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

// In-memory cache for question counts with 2-minute TTL to keep queries blazing fast
const questionCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

export async function GET(req: NextRequest) {
    try {
        const tokenData = await getTokenFromRequest(req);
        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (tokenData.user.role === "STUDENT") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "80", 10), 150);
        const statusFilter = searchParams.get("status"); // e.g. "IN_PROGRESS" or "ALL"

        const whereClause: any = {};
        if (statusFilter && statusFilter !== "ALL") {
            whereClause.status = statusFilter;
        }

        // Fast query: Select ONLY necessary lightweight columns
        // NOTE: We deliberately do NOT fetch huge questionsJson or generatedSet per submission
        const submissions = await prisma.examSubmission.findMany({
            take: limit,
            where: whereClause,
            orderBy: { id: 'desc' },
            select: {
                id: true,
                studentId: true,
                examId: true,
                examSetId: true,
                status: true,
                score: true,
                evaluatedAt: true,
                objectiveStartedAt: true,
                objectiveSubmittedAt: true,
                cqSqStartedAt: true,
                cqSqSubmittedAt: true,
                answers: true,
                student: {
                    select: {
                        id: true,
                        roll: true,
                        user: { select: { name: true, avatar: true } },
                        class: { select: { name: true, section: true } }
                    }
                },
                exam: {
                    select: {
                        id: true,
                        name: true,
                        totalMarks: true,
                        duration: true,
                        startTime: true,
                        endTime: true,
                        objectiveTime: true,
                        cqSqTime: true
                    }
                },
                result: {
                    select: {
                        total: true
                    }
                }
            }
        });

        const now = new Date();
        const nowMs = now.getTime();
        const serverTime = now.toISOString();

        // Efficiently resolve question counts for distinct sets/exams in batch
        const neededSetIds = [...new Set(submissions.map(s => s.examSetId).filter(Boolean))] as string[];
        const missingSetIds = neededSetIds.filter(id => {
            const cached = questionCountCache.get(`set_${id}`);
            return !cached || (nowMs - cached.timestamp > CACHE_TTL_MS);
        });

        if (missingSetIds.length > 0) {
            const sets = await prisma.examSet.findMany({
                where: { id: { in: missingSetIds } },
                select: { id: true, questionsJson: true }
            });
            for (const s of sets) {
                let count = 0;
                if (s.questionsJson) {
                    try {
                        const parsed = typeof s.questionsJson === 'string' ? JSON.parse(s.questionsJson) : s.questionsJson;
                        if (Array.isArray(parsed)) count = parsed.length;
                    } catch (e) { }
                }
                questionCountCache.set(`set_${s.id}`, { count, timestamp: nowMs });
            }
        }

        const neededExamIds = [...new Set(submissions.filter(s => !s.examSetId).map(s => s.examId))];
        const missingExamIds = neededExamIds.filter(id => {
            const cached = questionCountCache.get(`exam_${id}`);
            return !cached || (nowMs - cached.timestamp > CACHE_TTL_MS);
        });

        if (missingExamIds.length > 0) {
            const exams = await prisma.exam.findMany({
                where: { id: { in: missingExamIds } },
                select: { id: true, generatedSet: true }
            });
            for (const ex of exams) {
                let count = 0;
                if (ex.generatedSet && typeof ex.generatedSet === 'object') {
                    const parsed = ex.generatedSet as any;
                    if (Array.isArray(parsed.questions)) count = parsed.questions.length;
                }
                questionCountCache.set(`exam_${ex.id}`, { count, timestamp: nowMs });
            }
        }

        const activityData = submissions.map(sub => {
            const answers = (typeof sub.answers === 'object' && sub.answers !== null)
                ? (sub.answers as Record<string, any>)
                : {};

            // Calculate answered questions roughly (ignoring marks/notes)
            const answeredCount = Object.keys(answers).filter(k =>
                !k.endsWith('_marks') && !k.endsWith('_evaluator') && answers[k] !== "" && answers[k] !== null
            ).length;

            // Extract total questions from cache
            let totalQuestions = 0;
            if (sub.examSetId) {
                totalQuestions = questionCountCache.get(`set_${sub.examSetId}`)?.count || 0;
            }
            if (!totalQuestions && sub.examId) {
                totalQuestions = questionCountCache.get(`exam_${sub.examId}`)?.count || 0;
            }
            if (!totalQuestions) totalQuestions = 10;

            const progress = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;
            const score = sub.score != null ? sub.score : (sub.result?.total != null ? sub.result.total : 0);

            const lastActive = sub.evaluatedAt || sub.cqSqSubmittedAt || sub.objectiveSubmittedAt || sub.objectiveStartedAt || sub.cqSqStartedAt || now;
            const lastActiveDate = new Date(lastActive);
            const isIdle = sub.status === 'IN_PROGRESS' && (nowMs - lastActiveDate.getTime()) > 5 * 60 * 1000;

            const startedAtDate = sub.objectiveStartedAt || sub.cqSqStartedAt || null;
            const startedAt = startedAtDate ? new Date(startedAtDate).toISOString() : null;

            // Duration calculation
            const exam = sub.exam;
            const durationMinutes = (Number(exam?.objectiveTime || 0) > 0 && Number(exam?.cqSqTime || 0) > 0)
                ? (Number(exam.objectiveTime) + Number(exam.cqSqTime))
                : (Number(exam?.duration) || 60);
            const durationSeconds = durationMinutes * 60;

            let elapsedSeconds = 0;
            let remainingSeconds = durationSeconds;
            let timeSpentSeconds = 0;
            let isOverdue = false;

            if (startedAtDate) {
                const startMs = new Date(startedAtDate).getTime();
                elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

                const isDone = (sub.status as string) === 'COMPLETED' || sub.status === 'SUBMITTED' || !!sub.evaluatedAt;
                if (isDone) {
                    const finishedAt = sub.evaluatedAt || sub.cqSqSubmittedAt || sub.objectiveSubmittedAt || lastActiveDate;
                    timeSpentSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - startMs) / 1000));
                    remainingSeconds = 0;
                    isOverdue = false;
                } else {
                    timeSpentSeconds = elapsedSeconds;
                    remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
                    if (exam?.endTime) {
                        const untilEnd = Math.max(0, Math.floor((new Date(exam.endTime).getTime() - nowMs) / 1000));
                        remainingSeconds = Math.min(remainingSeconds, untilEnd);
                    }
                    isOverdue = elapsedSeconds > durationSeconds;
                }
            }

            return {
                id: sub.id,
                examId: sub.exam?.id || '',
                studentId: sub.student?.id || '',
                examName: sub.exam?.name || 'Unknown Exam',
                studentName: sub.student?.user?.name || 'Unknown',
                roll: sub.student?.roll || 'N/A',
                className: sub.student?.class ? `${sub.student.class.name} ${sub.student.class.section}` : 'N/A',
                avatar: sub.student?.user?.avatar || null,
                status: sub.status,
                progress,
                answered: answeredCount,
                totalQuestions,
                score,
                maxScore: sub.exam?.totalMarks || 100,
                updatedAt: lastActiveDate.toISOString(),
                startedAt: startedAt || new Date().toISOString(),
                durationMinutes,
                durationSeconds,
                elapsedSeconds,
                remainingSeconds,
                timeSpentSeconds,
                isOverdue,
                isIdle,
                serverTime,
                endTime: exam?.endTime ? new Date(exam.endTime).toISOString() : null
            };
        });

        // Stable sort: By start time descending (most recently started first)
        activityData.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

        return NextResponse.json({
            activity: activityData,
            serverTime
        });

    } catch (error) {
        console.error("Activity API Error:", error);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }
}
