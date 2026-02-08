import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";

/**
 * Check if an exam consists only of MCQs
 * Now improved to check actual questions if settings are ambiguous
 */
export function isMCQOnlyExam(exam: any, examSets: any[] = []): boolean {
    // 1. Check explicit settings if they are zero
    if (exam.cqTotalQuestions === 0 && exam.sqTotalQuestions === 0) return true;

    // 2. If settings are non-zero (or default), checking actual questions is safer
    // because user might have left settings at default but only added MCQ questions.

    if (!examSets || examSets.length === 0) return false; // Can't determine

    // Check the first set (assuming all sets have similar structure, or fairly enough)
    // Ideally check all sets, but usually they follow the same pattern
    for (const set of examSets) {
        if (set.questionsJson) {
            const questions = typeof set.questionsJson === 'string'
                ? JSON.parse(set.questionsJson)
                : set.questionsJson;

            const hasNonMCQ = questions.some((q: any) => {
                const type = (q.type || q.questionType || '').toUpperCase();
                return type === 'CQ' || type === 'SQ';
            });

            if (hasNonMCQ) return false;
        }
    }

    // If we scanned sets and found no CQ/SQ, then it IS MCQ only
    return true;
}

/**
 * Evaluate a single submission and update its Result
 */
export async function evaluateSubmission(submission: any, exam: any, examSets: any[]) {
    let totalScore = 0;
    let mcqMarks = 0;
    let cqMarks = 0;
    let sqMarks = 0;
    const answers = submission.answers as any;

    // 1. Calculate Manual Marks (CQ/SQ)
    for (const key in answers) {
        if (key.endsWith('_marks') && typeof answers[key] === 'number') {
            const questionId = key.replace('_marks', '');

            // Determine question type
            let questionType = 'CQ'; // Default
            for (const examSet of examSets) {
                if (examSet.questionsJson) {
                    const questions = typeof examSet.questionsJson === 'string'
                        ? JSON.parse(examSet.questionsJson)
                        : examSet.questionsJson;

                    const question = questions.find((q: any) => q.id === questionId);
                    if (question) {
                        questionType = question.type?.toUpperCase() || 'CQ';
                        break;
                    }
                }
            }

            if (questionType === 'SQ') {
                sqMarks += answers[key];
                totalScore += answers[key];
            } else if (questionType === 'CQ') {
                cqMarks += answers[key];
                totalScore += answers[key];
            }
        }
    }

    // 2. Calculate MCQ Marks (Auto-grading)
    const studentExamMap = await prisma.examStudentMap.findFirst({
        where: {
            studentId: submission.studentId,
            examId: exam.id
        }
    });

    let assignedExamSet = null;
    if (studentExamMap?.examSetId) {
        assignedExamSet = await prisma.examSet.findUnique({
            where: { id: studentExamMap.examSetId }
        });
    } else if (submission.examSetId) {
        assignedExamSet = await prisma.examSet.findUnique({
            where: { id: submission.examSetId }
        });
    }

    // Use the assigned set, or fallback to first set if only one exists (common in simple exams)
    const targetSet = assignedExamSet || (examSets.length === 1 ? examSets[0] : null);

    if (targetSet?.questionsJson) {
        const questions = typeof targetSet.questionsJson === 'string'
            ? JSON.parse(targetSet.questionsJson)
            : targetSet.questionsJson;

        for (const question of questions) {
            if (question.type?.toUpperCase() === 'MCQ') {
                const studentAnswer = answers[question.id];
                if (studentAnswer) {
                    const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
                    const userAns = normalize(studentAnswer);
                    let isCorrect = false;

                    // Logic from submit-all/route.ts
                    if (question.options && Array.isArray(question.options)) {
                        const correctOption = question.options.find((opt: any) => opt.isCorrect);
                        if (correctOption) {
                            const correctOptionText = normalize(correctOption.text || String(correctOption));
                            isCorrect = userAns === correctOptionText;
                        }
                    }

                    if (!isCorrect && question.correctAnswer) {
                        const correctAnswer = question.correctAnswer;
                        if (typeof correctAnswer === 'number') {
                            isCorrect = userAns === normalize(String(correctAnswer));
                        } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
                            // @ts-ignore
                            isCorrect = userAns === normalize(correctAnswer.text || String(correctAnswer));
                        } else if (Array.isArray(correctAnswer)) {
                            isCorrect = correctAnswer.some((ans: any) => normalize(String(ans)) === userAns);
                        } else {
                            isCorrect = userAns === normalize(String(correctAnswer));
                        }
                    }

                    if (!isCorrect && question.correct) {
                        const correctAns = normalize(String(question.correct));
                        isCorrect = userAns === correctAns;
                    }

                    if (isCorrect) {
                        mcqMarks += question.marks;
                        totalScore += question.marks;
                    } else {
                        if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                            const negativeMarks = (question.marks * exam.mcqNegativeMarking) / 100;
                            mcqMarks -= negativeMarks;
                            totalScore -= negativeMarks;
                        }
                    }
                }
            }
        }
    }

    // 3. Update Submission
    const percentage = calculatePercentage(totalScore, exam.totalMarks);
    const grade = calculateGrade(percentage);

    await prisma.examSubmission.update({
        where: { id: submission.id },
        data: {
            score: totalScore,
            evaluatedAt: new Date(),
            // Ensure status is submitted if we are fully evaluating
            status: 'SUBMITTED' as any // Use as any to bypass dev type issues
        }
    });

    // 4. Upsert Result
    await prisma.result.upsert({
        where: {
            studentId_examId: {
                studentId: submission.studentId,
                examId: exam.id
            }
        },
        update: {
            total: totalScore,
            mcqMarks, cqMarks, sqMarks,
            percentage,
            grade,
            isPublished: false, // Don't publish individual results yet (wait for release)
            examSubmissionId: submission.id
        },
        create: {
            studentId: submission.studentId,
            examId: exam.id,
            total: totalScore,
            mcqMarks, cqMarks, sqMarks,
            percentage,
            grade,
            isPublished: false,
            examSubmissionId: submission.id
        }
    });

    return { totalScore, percentage, grade };
}

/**
 * Release results for an exam (Rank calculation & Publish)
 */
export async function releaseExamResults(examId: string) {
    // Close reviews
    await (prisma as any).resultReview.updateMany({
        where: { examId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        data: { status: 'COMPLETED', reviewedAt: new Date() }
    });

    const allResults = await prisma.result.findMany({
        where: { examId },
        orderBy: { total: 'desc' },
        // Need to include students for debugging or notifications if added later, but for ranking just marks needed
    });

    // Calculate ranks
    const resultsWithRanks = allResults.map((result, index) => {
        const sameCount = allResults.filter(r => r.total === result.total).length;
        let rank = index + 1;
        if (sameCount > 1) {
            const firstIndex = allResults.findIndex(r => r.total === result.total);
            rank = firstIndex + 1;
        }
        // Only return the fields needed for update + id
        return { id: result.id, rank };
    });

    // Bulk update
    await Promise.all(resultsWithRanks.map(item =>
        prisma.result.update({
            where: { id: item.id },
            data: {
                rank: item.rank,
                isPublished: true,
                publishedAt: new Date()
            }
        })
    ));

    console.log(`🚀 Auto-released results for exam ${examId}. Published ${resultsWithRanks.length} results.`);
}

/**
 * Finalize an exam: Force-submit pending sessions (if time over) and release results
 */
export async function finalizeAndReleaseExam(examId: string) {
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { examSets: true }
    });

    if (!exam) return;

    // Find IN_PROGRESS submissions
    const pendingSubmissions = await prisma.examSubmission.findMany({
        where: {
            examId,
            status: 'IN_PROGRESS' as any
        }
    });

    // Force evaluate them
    for (const submission of pendingSubmissions) {
        // This will set status to SUBMITTED and calculate marks
        await evaluateSubmission(submission, exam, exam.examSets);
    }

    // Now release
    await releaseExamResults(examId);
}
