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
                    orderBy: { submittedAt: 'asc' }
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

        // 2. Process Submissions for Live Monitor
        const liveData = await Promise.all(
            exam.examSubmissions.map(async (submission) => {
                // Determine questions for this student
                let studentQuestions = defaultQuestions;
                let examSetId = submission.examSetId;

                // If no explicit set in submission (rare), try to find from map (if needed, but usually submission.examSetId is key)
                if (!examSetId) {
                    const map = await prisma.examStudentMap.findUnique({
                        where: { studentId_examId: { studentId: submission.studentId, examId } }
                    });
                    examSetId = map?.examSetId ?? null;
                }

                if (examSetId && studentQuestionsMap.has(examSetId)) {
                    studentQuestions = studentQuestionsMap.get(examSetId);
                }

                // If still empty (e.g. no generated set and no mapped set), fallback to first available set
                if (studentQuestions.length === 0 && studentQuestionsMap.size > 0) {
                    studentQuestions = studentQuestionsMap.values().next().value;
                }

                // Calculate Stats
                const answers = submission.answers as Record<string, any>;
                let totalQuestions = studentQuestions.length;
                let answeredQuestions = 0;
                let score = 0;
                let maxScore = 0;

                for (const q of studentQuestions) {
                    maxScore += q.marks;
                    const ans = answers[q.id];
                    if (ans !== undefined && ans !== null && ans !== "") {
                        answeredQuestions++;

                        // Auto-grading logic (Simplified from main route)
                        if (q.type === 'MCQ') {
                            let isCorrect = false;
                            const userAns = normalize(ans);

                            // Check options
                            if (q.options && Array.isArray(q.options)) {
                                const correctOpt = q.options.find((o: any) => o.isCorrect);
                                if (correctOpt) isCorrect = userAns === normalize(correctOpt.text || String(correctOpt));
                            }

                            // Check correct field
                            if (!isCorrect && q.correct) {
                                isCorrect = userAns === normalize(String(q.correct));
                            }

                            // Check correctAnswer field
                            if (!isCorrect && q.correctAnswer) {
                                isCorrect = userAns === normalize(String(q.correctAnswer));
                            }

                            if (isCorrect) {
                                score += q.marks;
                            } else if (exam.mcqNegativeMarking) {
                                score -= (q.marks * exam.mcqNegativeMarking) / 100;
                            }
                        } else {
                            // For non-MCQ, if we have manual marks in answers (rare during live, but possible if partially graded)
                            // live monitor usually shows auto-score.
                            // We'll skip adding manual marks here for "Live" score unless it's available.
                            // But actually, for live monitoring, usually we only know objective.
                        }
                    }
                }

                return {
                    id: submission.id,
                    studentName: submission.student.user.name,
                    roll: submission.student.roll,
                    className: submission.student.class.name,
                    section: submission.student.class.section,
                    status: submission.status, // IN_PROGRESS | SUBMITTED
                    progress: Math.round((answeredQuestions / totalQuestions) * 100) || 0,
                    answered: answeredQuestions,
                    totalQuestions: totalQuestions,
                    score: Math.max(0, parseFloat(score.toFixed(2))), // Ensure no negative total shown? or allow it.
                    maxScore,
                    lastActive: (submission as any).updatedAt, // Use this for "Online" inference (e.g., < 2 mins ago)
                    answers: answers // Return answers for detailed view
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
            submittedStudents: liveData.filter(s => s.status === 'SUBMITTED').length,
            liveData,
            questionsBySet, // For detailed view lookup
            defaultQuestions
        });

    } catch (error) {
        console.error("Live Monitor Error:", error);
        return NextResponse.json({ error: "Failed to fetch live data" }, { status: 500 });
    }
}
