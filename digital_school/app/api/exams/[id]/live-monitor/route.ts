import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

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

        // Fetch exam with questions and sets
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                examSets: true,
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

        // 1. Prepare Question Maps
        const studentQuestionsMap = new Map();
        let defaultQuestions: any[] = [];

        // Parse Generated Set Questions (Default)
        if (exam.generatedSet && typeof exam.generatedSet === 'object') {
            const generatedSet = exam.generatedSet as any;
            if (generatedSet.questions && Array.isArray(generatedSet.questions)) {
                defaultQuestions = generatedSet.questions;
            }
        }

        // Parse Exam Sets Questions
        if ((exam as any).examSets) {
            for (const examSet of (exam as any).examSets) {
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

        // Import evaluation utilities dynamically to avoid startup overhead or circular deps
        const { evaluateMCQuestion } = await import("@/lib/evaluation/mcEvaluation");
        const { evaluateINTQuestion } = await import("@/lib/evaluation/intEvaluation");
        const { evaluateARQuestion } = await import("@/lib/evaluation/arEvaluation");
        const { evaluateMTFQuestion } = await import("@/lib/evaluation/mtfEvaluation");

        // 2. Process Submissions for Live Monitor
        const liveData = await Promise.all(
            exam.examSubmissions.map(async (submission) => {
                // Determine questions for this student
                let studentQuestions = defaultQuestions;
                let examSetId = submission.examSetId;

                if (!examSetId) {
                    const map = await prisma.examStudentMap.findUnique({
                        where: { studentId_examId: { studentId: submission.studentId, examId } }
                    });
                    examSetId = map?.examSetId ?? null;
                }

                if (examSetId && studentQuestionsMap.has(examSetId)) {
                    studentQuestions = studentQuestionsMap.get(examSetId);
                }

                if (studentQuestions.length === 0 && studentQuestionsMap.size > 0) {
                    studentQuestions = studentQuestionsMap.values().next().value;
                }

                // Calculate Stats
                const answers = submission.answers as Record<string, any>;
                const totalQuestions = studentQuestions.length;
                let answeredQuestions = 0;
                let objectiveScore = 0;
                let maxObjectiveScore = 0;

                for (const q of studentQuestions) {
                    const type = (q.type || '').toUpperCase();
                    const isObjective = ['MCQ', 'MC', 'AR', 'INT', 'NUMERIC', 'MTF', 'SMCQ'].includes(type);

                    if (isObjective) {
                        maxObjectiveScore += q.marks;
                    }

                    const ans = answers[q.id];
                    const hasAnswer = ans !== undefined && ans !== null && ans !== "";

                    // For SMCQ, we need to check sub-answers
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

                // Get manual marks from Result table if already evaluated
                const result = await prisma.result.findUnique({
                    where: { studentId_examId: { studentId: submission.studentId, examId } }
                });

                const cqMarks = result?.cqMarks || 0;
                const sqMarks = result?.sqMarks || 0;
                const totalScore = Math.max(0, objectiveScore) + cqMarks + sqMarks;

                const evaluationStatus = submission.evaluatedAt ? 'COMPLETED' : 'IN_PROGRESS';

                return {
                    id: submission.id,
                    studentName: submission.student.user.name,
                    roll: submission.student.roll,
                    className: submission.student.class.name,
                    section: submission.student.class.section,
                    status: evaluationStatus,
                    progress: Math.round((answeredQuestions / totalQuestions) * 100) || 0,
                    answered: answeredQuestions,
                    totalQuestions: totalQuestions,
                    score: parseFloat(totalScore.toFixed(2)),
                    objectiveScore: parseFloat(Math.max(0, objectiveScore).toFixed(2)),
                    cqMarks,
                    sqMarks,
                    maxScore: exam.totalMarks,
                    lastActive: submission.evaluatedAt || submission.cqSqSubmittedAt || submission.objectiveSubmittedAt || null,
                    answers: answers
                };
            })
        );

        // Also include the Questions Data so frontend can render detailed view
        // We send a map of { [studentId]: questions } or just send one set if they are all same.
        // To be safe and support multiple sets, we can send a map of examSetId -> Questions, 
        // and each student has examSetId.
        // For simplicity, let's just send the `studentQuestionsMap` as an object { [setId]: questions }
        // AND the defaultQuestions.
        const questionsBySet: Record<string, any[]> = {};
        for (const [key, val] of studentQuestionsMap.entries()) {
            questionsBySet[key] = val;
        }

        return NextResponse.json({
            examName: exam.name,
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
