import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";
import { evaluateMCQuestion } from "./evaluation/mcEvaluation";
import { evaluateINTQuestion } from "./evaluation/intEvaluation";
import { evaluateARQuestion } from "./evaluation/arEvaluation";
import { evaluateMTFQuestion } from "./evaluation/mtfEvaluation";

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

    // Initialize section-wise scores
    const allCqScores: number[] = [];
    const allSqScores: number[] = [];

    // 1. Determine Exam Set
    const studentExamMap = await prisma.examStudentMap.findFirst({
        where: { studentId: submission.studentId, examId: exam.id }
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

    const targetSet = assignedExamSet || (examSets.length === 1 ? examSets[0] : null);

    // 2. Main Evaluation Loop
    if (targetSet?.questionsJson) {
        const questions = typeof targetSet.questionsJson === 'string'
            ? JSON.parse(targetSet.questionsJson)
            : targetSet.questionsJson;

        for (const question of questions) {
            const type = question.type?.toUpperCase();
            const studentAnswer = answers[question.id];
            const manualMark = answers[`${question.id}_marks`];

            // A. Handle Manual Grading (CQ/SQ/DESCRIPTIVE)
            if (type === 'CQ' || type === 'SQ' || type === 'DESCRIPTIVE') {
                let score = 0;

                // For CQ/SQ, we also check sub-questions now
                if ((type === 'DESCRIPTIVE' || type === 'CQ' || type === 'SQ') && question.subQuestions) {
                    // Sum up sub-question marks if they exist
                    question.subQuestions.forEach((sub: any, idx: number) => {
                        // Support both _desc_ and _sub_ prefixes for maximum compatibility
                        const subMark = answers[`${question.id}_desc_${idx}_marks`] ?? answers[`${question.id}_sub_${idx}_marks`];
                        if (typeof subMark === 'number') {
                            score += subMark;
                        }
                    });

                    // Fallback to top-level manual mark if no sub-marks were found but a main mark exists
                    if (score === 0 && typeof manualMark === 'number') {
                        score = manualMark;
                    }
                } else {
                    score = typeof manualMark === 'number' ? manualMark : 0;
                }

                if (type === 'CQ') allCqScores.push(score);
                else allSqScores.push(score); // DESCRIPTIVE is usually grouped with SQ marks
                continue;
            }

            // B. Auto-grading (Objective Types)
            let questionScore = 0;
            if (type === 'MCQ') {
                if (!studentAnswer) continue;
                const normalize = (s: any) => String(s || '').trim().toLowerCase().normalize();
                const userAns = normalize(studentAnswer);
                let isCorrect = false;

                if (question.options && Array.isArray(question.options)) {
                    const correctOption = question.options.find((opt: any) => opt.isCorrect);
                    if (correctOption) {
                        const correctOptionText = normalize(correctOption.text || String(correctOption));
                        isCorrect = userAns === correctOptionText;
                    }
                }

                if (!isCorrect && (question.correctAnswer || question.correct)) {
                    const correct = question.correctAnswer || question.correct;
                    isCorrect = userAns === normalize(String(correct));
                }

                if (isCorrect) {
                    questionScore = Number(question.marks) || 0;
                } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'MC') {
                const hasSelected = studentAnswer && Array.isArray(studentAnswer.selectedOptions) && studentAnswer.selectedOptions.length > 0;
                if (!hasSelected) continue;
                questionScore = Number(evaluateMCQuestion(question, studentAnswer, {
                    negativeMarking: exam.mcqNegativeMarking || 0,
                    partialMarking: true
                })) || 0;
            } else if (type === 'INT' || type === 'NUMERIC') {
                const isAnswered = studentAnswer && (studentAnswer.answer !== undefined && studentAnswer.answer !== null && studentAnswer.answer !== "");
                if (!isAnswered) continue;
                const result = evaluateINTQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'AR') {
                const isAnswered = studentAnswer && studentAnswer.selectedOption > 0;
                if (!isAnswered) continue;
                const result = evaluateARQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'MTF') {
                const hasMatches = studentAnswer && (
                    (studentAnswer.matches && Array.isArray(studentAnswer.matches) && studentAnswer.matches.length > 0) ||
                    (Object.keys(studentAnswer).length > 0 && !studentAnswer.matches)
                );
                if (!hasMatches) continue;
                const result = evaluateMTFQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore -= (Number(question.marks || 0) * exam.mcqNegativeMarking) / 100;
                }
            }

            mcqMarks += questionScore;
            totalScore += questionScore;
        }
    }

    // 3. Select Best N for CQ and SQ
    const cqRequired = exam.cqRequiredQuestions || allCqScores.length;
    const sqRequired = exam.sqRequiredQuestions || allSqScores.length;

    // Sort descending to pick highest marks
    cqMarks = allCqScores.sort((a, b) => b - a).slice(0, cqRequired).reduce((sum, s) => sum + s, 0);
    sqMarks = allSqScores.sort((a, b) => b - a).slice(0, sqRequired).reduce((sum, s) => sum + s, 0);

    totalScore += cqMarks + sqMarks;

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

    return { totalScore, percentage, grade, mcqMarks, cqMarks, sqMarks };
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
