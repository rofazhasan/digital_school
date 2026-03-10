import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const tokenData = await getTokenFromRequest(req);
        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (tokenData.user.role === "STUDENT") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Parse query params for simple filtering
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const statusFilter = searchParams.get("status"); // e.g. "IN_PROGRESS" or "ALL"

        const whereClause: any = {};
        if (statusFilter && statusFilter !== "ALL") {
            whereClause.status = statusFilter;
        }

        // Fast query to get the most recent activity across all exams
        const submissions = await prisma.examSubmission.findMany({
            take: limit,
            where: whereClause,
            orderBy: { id: 'desc' },
            include: {
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
                        generatedSet: true
                    }
                },
                examSet: {
                    select: {
                        id: true,
                        questionsJson: true
                    }
                },
                result: {
                    select: {
                        total: true
                    }
                }
            }
        });

        const activityData = submissions.map(subRecord => {
            const sub = subRecord as any; // Bypass TS strict typing for relations
            const answers = typeof sub.answers === 'object' && sub.answers !== null ? (sub.answers as Record<string, any>) : {};

            // Calculate answered questions roughly (ignoring marks/notes)
            const answeredCount = Object.keys(answers).filter(k =>
                !k.endsWith('_marks') && !k.endsWith('_evaluator') && answers[k] !== "" && answers[k] !== null
            ).length;

            // Extract total questions for progress calculation
            let totalQuestions = 0;
            let defaultQuestions: any[] = [];

            if (sub.examSet?.questionsJson) {
                try {
                    const parsed = typeof sub.examSet.questionsJson === 'string'
                        ? JSON.parse(sub.examSet.questionsJson)
                        : sub.examSet.questionsJson;
                    if (Array.isArray(parsed)) defaultQuestions = parsed;
                } catch (e) { }
            } else if (sub.exam?.generatedSet && typeof sub.exam.generatedSet === 'object') {
                const parsed = sub.exam.generatedSet as any;
                if (Array.isArray(parsed.questions)) defaultQuestions = parsed.questions;
            }
            totalQuestions = defaultQuestions.length || 10; // fallback if parsing fails

            // Rough progress (cap at 100%)
            const progress = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

            // Score comes from pre-calculated submission score, or result, or 0
            const score = sub.score || sub.result?.total || 0;

            // Determine the most recent activity timestamp for this submission
            let lastActive = sub.evaluatedAt || sub.cqSqSubmittedAt || sub.objectiveSubmittedAt || sub.objectiveStartedAt || new Date();
            const lastActiveDate = new Date(lastActive);
            const isIdle = sub.status === 'IN_PROGRESS' && (new Date().getTime() - lastActiveDate.getTime()) > 5 * 60 * 1000;

            // Stable start time
            let startedAt = sub.objectiveStartedAt || sub.cqSqStartedAt || sub.createdAt || lastActiveDate;

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
                startedAt: new Date(startedAt).toISOString(),
                isIdle
            };
        });

        // SORT BY START TIME DESCENDING (MOST RECENT STARTS AT TOP)
        // This makes the UI stable as startedAt never changes
        activityData.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

        return NextResponse.json({ activity: activityData });

    } catch (error) {
        console.error("Activity API Error:", error);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }
}
