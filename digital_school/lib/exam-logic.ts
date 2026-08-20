import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";
import { evaluateMCQuestion, MCQuestion, MCAnswer } from "./evaluation/mcEvaluation";
import { evaluateINTQuestion, INTQuestion, INTAnswer } from "./evaluation/intEvaluation";
import { evaluateARQuestion, ARQuestion, ARAnswer } from "./evaluation/arEvaluation";
import { evaluateMTFQuestion, MTFMatchNode, MTFAnswer } from "./evaluation/mtfEvaluation";
import { evaluateCMAQuestion } from "./evaluation/cmaEvaluation";
import { evaluateMPCQuestion } from "./evaluation/mpcEvaluation";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { ExamResultEmail } from "@/components/emails/ExamResultEmail";
import { Exam, ExamSet, ExamSubmission, SubmissionStatus, Institute, PrismaClient } from "@prisma/client";
import React from "react";

/**
 * Assign an exam set to a student using a balanced random approach (least-assigned).
 * If the student is already assigned, returns the existing set.
 */
export async function assignBalancedExamSet(studentId: string, examId: string, prismaClient?: PrismaClient) {
    const db = prismaClient || prisma;

    // 1. Check for existing mapping
    const existingMap = await db.examStudentMap.findUnique({
        where: { studentId_examId: { studentId, examId } },
        select: { examSetId: true }
    });

    if (existingMap?.examSetId) {
        return existingMap.examSetId;
    }

    // 2. Get all active sets for this exam
    const examSets = await db.examSet.findMany({
        where: { examId, isActive: true },
        select: { id: true }
    });

    if (examSets.length === 0) return null;
    if (examSets.length === 1) {
        const setId = examSets[0].id;
        await db.examStudentMap.upsert({
            where: { studentId_examId: { studentId, examId } },
            update: { examSetId: setId },
            create: { studentId, examId, examSetId: setId }
        });
        return setId;
    }

    // 3. Count current assignments for each set to ensure balance
    const assignmentCounts = await db.examStudentMap.groupBy({
        by: ['examSetId'],
        where: {
            examId,
            examSetId: { in: examSets.map(s => s.id) }
        },
        _count: { _all: true }
    });

    const countMap = new Map<string, number>();
    examSets.forEach(s => countMap.set(s.id, 0));
    assignmentCounts.forEach(c => {
        if (c.examSetId) countMap.set(c.examSetId, c._count._all);
    });

    // 4. Find the minimum count
    let minCount = Infinity;
    countMap.forEach(count => {
        if (count < minCount) minCount = count;
    });

    // 5. Get all sets that have this minimum count
    const candidates = examSets.filter(s => countMap.get(s.id) === minCount);

    // 6. Pick one randomly from candidates
    const selectedSet = candidates[Math.floor(Math.random() * candidates.length)];

    // 7. Persist assignment
    await db.examStudentMap.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { examSetId: selectedSet.id },
        create: { studentId, examId, examSetId: selectedSet.id }
    });

    console.log(`[SetAssignment] Student ${studentId} assigned to set ${selectedSet.id} for exam ${examId} (Balance: ${minCount} assignments)`);
    return selectedSet.id;
}

export interface QuestionOption {
    text: string;
    isCorrect?: boolean;
}

export interface SubQuestion {
    id: string;
    text: string;
    type?: string;
    marks: number;
    options?: QuestionOption[];
    correctAnswer?: string | number;
}

export interface QuestionData {
    id: string;
    type: string;
    questionType?: string;
    text: string;
    marks: number;
    options?: QuestionOption[];
    subQuestions?: SubQuestion[];
    sub_questions?: SubQuestion[];
    correctAnswer?: string | number;
    correct?: string | number;
    assertion?: string;
    reason?: string;
    correctOption?: number;
    leftColumn?: MTFMatchNode[];
    rightColumn?: MTFMatchNode[];
    matches?: Record<string, string>;
}

export type SubmissionAnswers = Record<string, unknown>;

/**
 * Check if an exam consists only of MCQs
 * Now improved to check actual questions if settings are ambiguous
 */
export function isMCQOnlyExam(exam: Partial<Exam>, examSets: Partial<ExamSet>[] = []): boolean {
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

            const hasNonMCQ = questions.some((q: QuestionData) => {
                const type = (q.type || q.questionType || '').toUpperCase();
                return type === 'CQ' || type === 'SQ' || type === 'DESCRIPTIVE';
            });

            if (hasNonMCQ) return false;
        }
    }

    // If we scanned sets and found no CQ/SQ, then it IS MCQ only
    return true;
}

/**
 * Evaluate a single submission and update its Result
 * @param saveToDb - if true (default), updates the submission status and saves the result to the DB. If false, calculates and returns scores in-memory without mutating the DB. Useful for previewing evaluations.
 */
export async function evaluateSubmission(submission: ExamSubmission, exam: Exam, examSets: ExamSet[], saveToDb: boolean = true) {
    let totalScore = 0;
    let mcqMarks = 0;
    let cqMarks = 0;
    let sqMarks = 0;
    const answers = submission.answers as SubmissionAnswers;

    // Initialize section-wise scores
    const allCqScores: number[] = [];
    const allSqScores: number[] = [];
    const evaluationResult: Record<string, any> = {};
    // 1. Determine Exam Set
    let assignedExamSet = examSets?.find(s => s.id === submission.examSetId) || null;

    if (!assignedExamSet) {
        try {
            const studentExamMap = await prisma.examStudentMap.findFirst({
                where: { studentId: submission.studentId, examId: exam.id }
            });

            if (studentExamMap?.examSetId) {
                assignedExamSet = await prisma.examSet.findUnique({
                    where: { id: studentExamMap.examSetId }
                });
            } else if (submission.examSetId) {
                assignedExamSet = await prisma.examSet.findUnique({
                    where: { id: submission.examSetId }
                });
            }
        } catch {
            // In offline or unit-test environments without active DB connection, fallback gracefully
        }
    }

    const targetSet = assignedExamSet || (examSets && examSets.length > 0 ? examSets[0] : null);

    // 2. Main Evaluation Loop
    if (targetSet?.questionsJson) {
        const questions = typeof targetSet.questionsJson === 'string'
            ? JSON.parse(targetSet.questionsJson)
            : targetSet.questionsJson;

        for (const question of (questions as QuestionData[])) {
            const type = question.type?.toUpperCase();
            const studentAnswer = answers[question.id] as any;
            const manualMark = answers[`${question.id}_marks`];

            // A. Handle Manual Grading (CQ/SQ/DESCRIPTIVE) — with auto-scoring for structured sub-types
            if (type === 'CQ' || type === 'SQ' || type === 'DESCRIPTIVE') {
                let score = 0;

                const subQs = (question as any).subQuestions || (question as any).sub_questions || (question as any).parts;
                if ((type === 'DESCRIPTIVE' || type === 'CQ' || type === 'SQ') && subQs) {
                    // Sum up sub-question marks
                    subQs.forEach((sub: any, idx: number) => {
                        const descPrefix = `${question.id}_desc_${idx}_`;
                        const subDescMark = answers[`${question.id}_desc_${idx}_marks`];
                        const subSubMark = answers[`${question.id}_sub_${idx}_marks`];

                        // Evaluator manually graded — trust it completely
                        if (typeof subDescMark === 'number') { score += subDescMark; return; }
                        if (typeof subSubMark === 'number') { score += subSubMark; return; }

                        // --- Auto-scoring for structured sub-types ---
                        const subType = sub.subType || sub.sub_type || '';
                        const normalize = (s: any) => String(s ?? '').trim().toLowerCase();
                        const getDesc = (key: string | number) => (answers as any)[`${descPrefix}${key}`];
                        const subMaxMarks = Number(sub.marks || sub.mark || 0);

                        if (subMaxMarks === 0) return; // Nothing to score

                        let autoScore: number | null = null;

                        if (subType === 'comprehension_mcq') {
                            // Each inner MCQ sub-question is indexed: descPrefix + sqi
                            const sqList = sub.subQuestions || sub.questions || [];
                            if (sqList.length > 0) {
                                let correct = 0;
                                sqList.forEach((sq: any, sqi: number) => {
                                    const studentPick = getDesc(sqi);
                                    if (!studentPick) return;
                                    const opts = sq.options || [];
                                    const correctOpt = opts.find((o: any) =>
                                        (typeof o === 'object' && o.isCorrect) ||
                                        (sq.correctAnswer !== undefined && (Number(sq.correctAnswer) === opts.indexOf(o) || normalize(sq.correctAnswer) === normalize(typeof o === 'string' ? o : o.text)))
                                    );
                                    if (correctOpt && normalize(studentPick) === normalize(typeof correctOpt === 'string' ? correctOpt : correctOpt.text)) {
                                        correct++;
                                    }
                                });
                                // Pro-rate marks across sub-questions
                                autoScore = Math.round((correct / sqList.length) * subMaxMarks * 100) / 100;
                            }
                        } else if (subType === 'rearranging') {
                            const studentOrder = getDesc('order');
                            const correctOrder = sub.correctOrder || sub.modelAnswer || sub.answers?.[0];
                            if (studentOrder && correctOrder) {
                                const clean = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                autoScore = clean(studentOrder) === clean(correctOrder) ? subMaxMarks : 0;
                            }
                        } else if (subType === 'fill_in') {
                            const passage = sub.passage || sub.questionText || '';
                            const blanks = passage.split('___').length - 1;
                            const items = sub.items || [];
                            const total = blanks > 0 ? blanks : items.length;
                            if (total > 0 && sub.answers) {
                                let correct = 0;
                                for (let i = 0; i < total; i++) {
                                    const studentVal = getDesc(i);
                                    const correctVal = sub.answers[i];
                                    if (studentVal && correctVal && normalize(studentVal) === normalize(correctVal)) correct++;
                                }
                                autoScore = Math.round((correct / total) * subMaxMarks * 100) / 100;
                            }
                        } else if (subType === 'true_false') {
                            const statements = sub.statements || [];
                            if (statements.length > 0 && sub.correctAnswers) {
                                let correct = 0;
                                statements.forEach((_: any, i: number) => {
                                    const studentVal = getDesc(i);
                                    const correctVal = sub.correctAnswers[i];
                                    if (studentVal && correctVal && normalize(studentVal) === normalize(correctVal)) correct++;
                                });
                                autoScore = Math.round((correct / statements.length) * subMaxMarks * 100) / 100;
                            }
                        } else if (subType === 'error_correction') {
                            const sentences = sub.sentences || [];
                            if (sentences.length > 0 && sub.answers) {
                                let correct = 0;
                                sentences.forEach((_: any, i: number) => {
                                    const studentVal = getDesc(i);
                                    const correctVal = sub.answers[i];
                                    if (studentVal && correctVal && normalize(studentVal) === normalize(correctVal)) correct++;
                                });
                                autoScore = Math.round((correct / sentences.length) * subMaxMarks * 100) / 100;
                            }
                        } else if (subType === 'short_answer') {
                            const questions = sub.questions || sub.items || [];
                            if (questions.length > 0 && sub.answers) {
                                let correct = 0;
                                questions.forEach((_: any, i: number) => {
                                    const studentVal = getDesc(i);
                                    const correctVal = sub.answers[i];
                                    if (studentVal && correctVal && normalize(studentVal) === normalize(correctVal)) correct++;
                                });
                                autoScore = Math.round((correct / questions.length) * subMaxMarks * 100) / 100;
                            }
                        }

                        if (autoScore !== null) {
                            score += autoScore;
                            // Persist the auto-computed mark so evaluators can see and override it
                            (answers as any)[`${question.id}_desc_${idx}_marks`] = autoScore;
                        }
                    });

                    // Fallback to top-level manual mark if no sub-marks found at all
                    if (score === 0 && typeof manualMark === 'number') {
                        score = manualMark;
                    }
                } else {
                    score = typeof manualMark === 'number' ? manualMark : 0;
                }

                if (type === 'CQ') allCqScores.push(score);
                else allSqScores.push(score); // DESCRIPTIVE grouped with SQ marks
                continue;
            }

            // B. Auto-grading (Objective Types)
            let questionScore = 0;
            let res: any = null;

            if (type === 'MCQ') {
                if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') continue;

                const normalize = (s: string | number | undefined | null) => String(s !== undefined && s !== null ? s : '').trim().toLowerCase();
                const userAns = normalize(studentAnswer);
                let isCorrect = false;

                if (question.options && Array.isArray(question.options)) {
                    const correctIdx = question.options.findIndex((opt: QuestionOption) => opt.isCorrect);
                    if (correctIdx !== -1) {
                        const correctOpt = question.options[correctIdx];
                        const correctText = normalize(correctOpt.text);
                        const letter = String.fromCharCode(97 + correctIdx); // 'a', 'b', 'c'...
                        isCorrect = userAns === correctText || userAns === String(correctIdx) || userAns === letter;
                    }

                    if (!isCorrect) {
                        const num = parseInt(userAns, 10);
                        if (!isNaN(num) && num >= 0 && num < question.options.length) {
                            isCorrect = Boolean(question.options[num]?.isCorrect);
                        }
                    }
                }

                if (!isCorrect && (question.correctAnswer !== undefined || question.correct !== undefined || question.correctOption !== undefined)) {
                    const cAns = normalize(String(question.correctAnswer ?? question.correct ?? question.correctOption));
                    isCorrect = userAns === cAns;
                }

                if (isCorrect) {
                    questionScore = Number(question.marks) || 0;
                } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
                res = { score: questionScore, type, isCorrect };
            } else if (type === 'MC') {
                const hasSelected = studentAnswer && Array.isArray(studentAnswer.selectedOptions) && studentAnswer.selectedOptions.length > 0;
                if (!hasSelected) continue;
                questionScore = evaluateMCQuestion(question as unknown as MCQuestion, studentAnswer as MCAnswer, {
                    negativeMarking: (exam as any).mcNegativeMarking ?? exam.mcqNegativeMarking ?? 0,
                    partialMarking: true,
                    hasAttempted: true
                });
                res = { score: questionScore, type };
            } else if (type === 'INT' || type === 'NUMERIC') {
                if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') continue;
                const evaluationRes = evaluateINTQuestion(question, studentAnswer);
                questionScore = evaluationRes.score;
                if (!evaluationRes.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
                res = { score: questionScore, type, isCorrect: evaluationRes.isCorrect };
            } else if (type === 'AR') {
                if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') continue;
                const evaluationRes = evaluateARQuestion(question as unknown as ARQuestion, studentAnswer);
                questionScore = evaluationRes.score;
                if (!evaluationRes.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
                res = { score: questionScore, type, isCorrect: evaluationRes.isCorrect };
            } else if (type === 'SMCQ') {
                const subQs = question.subQuestions || question.sub_questions;
                if (!subQs) continue;

                let smcqScore = 0;
                let subAttemptCount = 0;
                subQs.forEach((subQ: SubQuestion, sIdx: number) => {
                    const subAnswer = answers[`${question.id}_sub_${sIdx}`] as any;
                    if (subAnswer === undefined || subAnswer === null || subAnswer === '') {
                        answers[`${question.id}_sub_${sIdx}_marks`] = 0;
                        return;
                    }

                    subAttemptCount++;
                    const normalize = (s: string | number | undefined | null) => String(s || '').trim().toLowerCase();
                    const userAns = normalize(subAnswer);
                    let isSubCorrect = false;

                    if (subQ.options && Array.isArray(subQ.options)) {
                        const correctOption = subQ.options.find((opt: QuestionOption) => opt.isCorrect);
                        if (correctOption) {
                            const correctOptionText = normalize(correctOption.text);
                            isSubCorrect = userAns === correctOptionText;
                        }
                    }

                    if (!isSubCorrect && (subQ.correctAnswer !== undefined && subQ.correctAnswer !== null)) {
                        const correctIndex = Number(subQ.correctAnswer);
                        if (!isNaN(correctIndex) && subQ.options && subQ.options[correctIndex]) {
                            const opt = subQ.options[correctIndex];
                            const correctText = normalize(typeof opt === 'object' ? opt.text : opt);
                            isSubCorrect = userAns === correctText;
                        } else {
                            isSubCorrect = userAns === normalize(subQ.correctAnswer);
                        }
                    }

                    if (isSubCorrect) {
                        const sMark = Number(subQ.marks) || 1;
                        smcqScore += sMark;
                        answers[`${question.id}_sub_${sIdx}_marks`] = sMark;
                    } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                        const negMark = -((Number(subQ.marks || 1) * exam.mcqNegativeMarking) / 100);
                        smcqScore += negMark;
                        answers[`${question.id}_sub_${sIdx}_marks`] = negMark;
                    } else {
                        answers[`${question.id}_sub_${sIdx}_marks`] = 0;
                    }
                });
                questionScore = smcqScore;
                const allSubAttempted = subAttemptCount > 0;
                res = { score: questionScore, type, attempted: allSubAttempted };
            } else if (type === 'MTF') {
                const hasMatchSet = studentAnswer && (Array.isArray((studentAnswer as any).matches) ? (studentAnswer as any).matches.length > 0 : Object.keys(studentAnswer as any).length > 0);
                if (!hasMatchSet) {
                    evaluationResult[question.id] = { score: 0, type, isCorrect: false, attempted: false };
                    continue;
                }

                res = evaluateMTFQuestion(question as unknown as any, studentAnswer as unknown as MTFAnswer);
                questionScore = res.score;
            } else if (type === 'CMA') {
                if (studentAnswer === undefined || studentAnswer === null) continue;
                const cmaRes = evaluateCMAQuestion(question as any, studentAnswer as any);
                questionScore = cmaRes.score;
                res = { score: questionScore, type, isCorrect: cmaRes.isCorrect, partResults: cmaRes.partResults };
            } else if (type === 'MPC') {
                if (studentAnswer === undefined || studentAnswer === null) continue;
                const mpcRes = evaluateMPCQuestion(question as any, studentAnswer as any);
                questionScore = mpcRes.score;
                res = { score: questionScore, type, isCorrect: mpcRes.isCorrect, stageResults: mpcRes.stageResults };
            }

            if (res) {
                mcqMarks += questionScore;
                totalScore += questionScore;
                evaluationResult[question.id] = { ...res, type };

                // PERSIST MARKS in answers JSON for results view
                answers[`${question.id}_marks`] = questionScore;
            }
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
    const passMark = Number(exam.passMarks) || 33;
    const grade = calculateGrade(percentage, passMark);

    if (saveToDb) {
        await prisma.examSubmission.update({
            where: { id: submission.id },
            data: {
                answers: answers as any, // Include populated _marks
                score: totalScore, // Keep score for backward compatibility
                status: SubmissionStatus.SUBMITTED,
                objectiveStatus: SubmissionStatus.SUBMITTED,
                cqSqStatus: SubmissionStatus.SUBMITTED,
                evaluatedAt: new Date()
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
    }

    return { totalScore, percentage, grade, mcqMarks, cqMarks, sqMarks, evaluationResult };
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
    });

    // Calculate ranks
    const resultsWithRanks = allResults.map((result, index: number) => {
        const sameCount = allResults.filter(r => r.total === result.total).length;
        let rank = index + 1;
        if (sameCount > 1) {
            const firstIndex = allResults.findIndex(r => r.total === result.total);
            rank = firstIndex + 1;
        }
        return { id: result.id, rank };
    });

    // 4. IDENTIFY RESULTS TO NOTIFY (Before update to detect changes)
    const resultsWithCorrections = allResults.map(r => {
        const rw = resultsWithRanks.find(item => item.id === r.id);
        const newRank = rw?.rank;
        const wasPreviouslyReleased = r.publishedAt !== null;

        // Correction if previously released AND (marks changed [isPublished: false] OR rank changed)
        const isCorrection = wasPreviouslyReleased && (!r.isPublished || r.rank !== newRank || !r.isPublished); // Added !r.isPublished check
        const isNew = !r.isPublished && !wasPreviouslyReleased;

        return { id: r.id, isNew, isCorrection };
    }).filter(r => r.isNew || r.isCorrection);

    const resultsToNotifyIds = resultsWithCorrections.map(r => r.id);

    // If no results to notify, it means nothing changed (already published and ranks are same)
    if (resultsToNotifyIds.length === 0) {
        console.log(`[RELEASE] No new or corrected results for exam ${examId}. Skipping release process.`);
        return;
    }

    // 5. Bulk update with conditional publishedAt
    const now = new Date();
    await Promise.all(resultsWithRanks.map(item => {
        const existing = allResults.find(r => r.id === item.id);
        const needsPublishing = !existing?.isPublished;

        return prisma.result.update({
            where: { id: item.id },
            data: {
                rank: item.rank,
                isPublished: true,
                ...(needsPublishing && { publishedAt: now })
            }
        });
    }));

    console.log(`🚀 Released results for exam ${examId}. Published ${resultsWithRanks.length} results.`);

    // --- EMAIL NOTIFICATION LOGIC ---
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { class: true, examSets: true }
        });

        const institute = await prisma.institute.findFirst({
            select: { name: true, address: true, phone: true, logoUrl: true }
        });

        // Only send notifications to results that are new or corrected
        if (resultsToNotifyIds.length === 0) {
            console.log(`[NOTIFY] No new or corrected results to notify for exam ${examId}.`);
            return;
        }

        const resultsToNotify = await prisma.result.findMany({
            where: {
                id: { in: resultsToNotifyIds }
            },
            include: {
                student: {
                    select: {
                        id: true,
                        guardianEmail: true,
                        guardianPhone: true,
                        user: {
                            select: { id: true, name: true, email: true, phone: true }
                        },
                        class: { select: { name: true, section: true } }
                    }
                },
                examSubmission: true
            }
        });

        // Sequential notification sending for stability with Email -> SMS Fallback
        let sentCount = 0;
        let failCount = 0;

        for (let i = 0; i < resultsToNotify.length; i++) {
            const res = resultsToNotify[i];

            const correctionInfo = resultsWithCorrections.find(c => c.id === res.id);
            const isCorrection = correctionInfo?.isCorrection || false;

            const emailToUse = (res.student?.user?.email || res.student?.guardianEmail || '').trim();
            const phoneToUse = (res.student?.user?.phone || res.student?.guardianPhone || '').trim();

            if (!emailToUse && !phoneToUse) continue;

            let emailSuccess = false;

            // 1. Try sending by Email first if available
            if (emailToUse && emailToUse.includes('@')) {
                try {
                    console.log(`[EMAIL] Processing ${i + 1}/${resultsToNotify.length}: ${emailToUse}`);
                    const resultItems = [{
                        subject: (exam as any).subject || exam?.name || "General",
                        marks: res.total || 0,
                        totalMarks: exam?.totalMarks || 100,
                        grade: res.grade || "F",
                        mcqMarks: res.mcqMarks,
                        cqMarks: res.cqMarks,
                        sqMarks: res.sqMarks
                    }];

                    await sendEmail({
                        to: emailToUse,
                        subject: `${isCorrection ? 'Updated ' : ''}Exam Result Released: ${exam?.name} - ${institute?.name || 'Digital School'}`,
                        react: ExamResultEmail({
                            studentName: res.student?.user?.name || "Student",
                            examName: exam?.name || "Exam",
                            results: resultItems,
                            totalPercentage: res.percentage || 0,
                            finalGrade: res.grade || "F",
                            rank: (res as any).rank || undefined,
                            institute: institute as any,
                            section: res.student?.class?.section || undefined,
                            examDate: exam?.date ? new Date(exam.date).toLocaleDateString() : undefined,
                            baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        }) as React.ReactElement
                    });
                    sentCount++;
                    emailSuccess = true;
                    console.log(`✅ [EMAIL SUCCESS] Sent result email to ${emailToUse}`);
                } catch (emailErr) {
                    console.error(`❌ [EMAIL FAILED] Could not send email to ${emailToUse}. Triggering auto SMS fallback:`, emailErr);
                    emailSuccess = false;
                }
            }

            // 2. If email is not available OR email failed, auto-send by SMS to phone number!
            if (!emailSuccess) {
                if (phoneToUse) {
                    try {
                        console.log(`[SMS FALLBACK] Processing ${i + 1}/${resultsToNotify.length}: ${phoneToUse}`);
                        const firstName = res.student?.user?.name?.split(' ')[0] || 'Student';
                        const instName = institute?.name || 'School';
                        const examName = exam?.name || 'Exam';
                        const totalMarks = exam?.totalMarks || 100;
                        const percentage = Math.round(res.percentage || 0);

                        let mcqCorrect = 0;
                        let mcqWrong = 0;
                        let mcqDed = 0;

                        if (res.examSubmission && exam?.examSets) {
                            const answers = res.examSubmission.answers as Record<string, any>;
                            const setId = res.examSubmission.examSetId;
                            const targetSet = exam.examSets.find(s => s.id === setId) || exam.examSets[0];

                            if (targetSet?.questionsJson) {
                                const questions = typeof targetSet.questionsJson === 'string'
                                    ? JSON.parse(targetSet.questionsJson)
                                    : targetSet.questionsJson;

                                questions.forEach((q: any) => {
                                    const type = q.type?.toUpperCase();
                                    const studentAnswer = answers[q.id];
                                    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') return;

                                    const normalizeStr = (s: any) => String(s || '').trim().toLowerCase();
                                    const qMarks = Number(q.marks || 1);
                                    let isCorrect = false;

                                    if (type === 'MCQ') {
                                        const correctOpt = q.options?.find((o: any) => o.isCorrect);
                                        const correctText = normalizeStr(correctOpt?.text || q.correctAnswer || q.correct);
                                        isCorrect = normalizeStr(studentAnswer) === correctText;
                                    }
                                    if (isCorrect) mcqCorrect++;
                                    else mcqWrong++;
                                });
                            }
                        }

                        const header = `Dear ${firstName},\n${examName} Res:${res.total}/${totalMarks} (${percentage}% ${res.grade})${res.rank ? ` Rank:${res.rank}` : ''}`;

                        let analytics = '';
                        if (res.mcqMarks > 0 || mcqCorrect > 0) {
                            analytics += `\nMCQ:${res.mcqMarks} Cor:${mcqCorrect} Wro:${mcqWrong}`;
                        }
                        if (res.cqMarks > 0) analytics += ` CQ:${res.cqMarks}`;
                        if (res.sqMarks > 0) analytics += ` SQ:${res.sqMarks}`;

                        const smsMessage = `${isCorrection ? 'Cor. Result:\n' : ''}${header}${analytics}\nGood Luck! - ${instName}`;

                        const smsResult = await sendSMS(phoneToUse, smsMessage);
                        if (smsResult.success) {
                            sentCount++;
                            console.log(`✅ [SMS SUCCESS] Sent result SMS to ${phoneToUse}`);
                        } else {
                            failCount++;
                            console.error(`❌ [SMS FAILED] Failed SMS to ${phoneToUse}:`, smsResult.error);
                        }
                    } catch (smsErr) {
                        console.error(`❌ [SMS ERROR] Exception sending SMS to ${phoneToUse}:`, smsErr);
                        failCount++;
                    }
                } else {
                    console.warn(`⚠️ [NO CONTACT] Student ${res.student?.user?.name || res.studentId} has no valid email or phone.`);
                    failCount++;
                }
            }

            if (i < resultsToNotify.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        console.log(`✉️ Batch complete: Successfully sent ${sentCount} notifications. Failed: ${failCount}.`);
    } catch (emailError) {
        console.error("Failed to send result notifications:", emailError);
    }
}

/**
 * Check for expired sections and auto-submit them
 */
export async function autoSubmitExpiredSections(submission: ExamSubmission, exam: Partial<Exam> & { examSets?: ExamSet[] }) {
    if (!submission) return submission;

    const examId = exam.id || submission.examId;

    // If already submitted, ensure result exists
    if (submission.status === SubmissionStatus.SUBMITTED) {
        try {
            const existingResult = await prisma.result.findUnique({
                where: { studentId_examId: { studentId: submission.studentId, examId } }
            });
            if (!existingResult && examId) {
                const fullExam = (exam.totalMarks !== undefined ? exam : await prisma.exam.findUnique({ where: { id: examId }, include: { examSets: true } })) as Exam & { examSets?: ExamSet[] };
                const examSets = fullExam?.examSets || await prisma.examSet.findMany({ where: { examId } });
                if (fullExam) {
                    await evaluateSubmission(submission, fullExam, examSets, true);
                }
            }
        } catch (e) {
            console.error(`[Auto-Submit] Error ensuring result for submitted submission ${submission.id}:`, e);
        }
        return submission;
    }

    const now = new Date();
    const nowTime = now.getTime();
    let hasChanges = false;
    const updateData: Partial<ExamSubmission> = {};

    // Intelligent section detection
    const isMCQOnly = isMCQOnlyExam(exam, exam.examSets || []);
    const hasObjective = (exam.objectiveTime && exam.objectiveTime > 0) || isMCQOnly || (exam as { hasObjective?: boolean }).hasObjective || (exam.cqTotalQuestions === 0 && exam.sqTotalQuestions === 0);
    const hasCqSq = (exam.cqSqTime && exam.cqSqTime > 0) || !isMCQOnly || (exam as { hasCqSq?: boolean }).hasCqSq || (Number(exam.cqTotalQuestions || 0) > 0) || (Number(exam.sqTotalQuestions || 0) > 0);

    // 1. Check Objective Section
    if (submission.objectiveStatus === SubmissionStatus.IN_PROGRESS && submission.objectiveStartedAt && hasObjective) {
        const objStartTime = new Date(submission.objectiveStartedAt).getTime();
        const objLimitMs = ((Number(exam.objectiveTime) > 0 ? Number(exam.objectiveTime) : Number(exam.duration)) || 0) * 60 * 1000;
        if (objLimitMs > 0 && nowTime >= objStartTime + objLimitMs) {
            updateData.objectiveStatus = SubmissionStatus.SUBMITTED;
            updateData.objectiveSubmittedAt = submission.objectiveSubmittedAt || new Date(objStartTime + objLimitMs);
            hasChanges = true;
            console.log(`[Auto-Submit] Objective expired for submission ${submission.id}`);
        }
    }

    // 2. Check CQ/SQ Section
    if (submission.cqSqStatus === SubmissionStatus.IN_PROGRESS && submission.cqSqStartedAt && hasCqSq) {
        const cqStartTime = new Date(submission.cqSqStartedAt).getTime();
        const cqLimitMs = ((Number(exam.cqSqTime) > 0 ? Number(exam.cqSqTime) : Number(exam.duration)) || 0) * 60 * 1000;
        if (cqLimitMs > 0 && nowTime >= cqStartTime + cqLimitMs) {
            updateData.cqSqStatus = SubmissionStatus.SUBMITTED;
            updateData.cqSqSubmittedAt = submission.cqSqSubmittedAt || new Date(cqStartTime + cqLimitMs);
            hasChanges = true;
            console.log(`[Auto-Submit] CQ/SQ expired for submission ${submission.id}`);
        }
    }

    // 3. Check Overall Duration (Based on when student started)
    const firstStartTime = submission.objectiveStartedAt
        ? new Date(submission.objectiveStartedAt).getTime()
        : submission.cqSqStartedAt
            ? new Date(submission.cqSqStartedAt).getTime()
            : ((submission as any).createdAt ? new Date((submission as any).createdAt).getTime() : null);

    const overallDurationMs = (Number(exam.duration) || 0) * 60 * 1000;
    if (firstStartTime && overallDurationMs > 0 && nowTime >= firstStartTime + overallDurationMs) {
        updateData.status = SubmissionStatus.SUBMITTED;
        updateData.objectiveStatus = SubmissionStatus.SUBMITTED;
        updateData.cqSqStatus = SubmissionStatus.SUBMITTED;
        if (!submission.objectiveSubmittedAt) updateData.objectiveSubmittedAt = new Date(firstStartTime + overallDurationMs);
        if (!submission.cqSqSubmittedAt) updateData.cqSqSubmittedAt = new Date(firstStartTime + overallDurationMs);
        hasChanges = true;
        console.log(`[Auto-Submit] Overall exam duration expired for submission ${submission.id}`);
    }

    // 4. Check Overall Exam Scheduled End Time (Absolute end time)
    if (exam.endTime) {
        const examEndTime = new Date(exam.endTime).getTime();
        if (nowTime >= examEndTime) {
            updateData.status = SubmissionStatus.SUBMITTED;
            updateData.objectiveStatus = SubmissionStatus.SUBMITTED;
            if (!submission.objectiveSubmittedAt) updateData.objectiveSubmittedAt = new Date(examEndTime);
            updateData.cqSqStatus = SubmissionStatus.SUBMITTED;
            if (!submission.cqSqSubmittedAt) updateData.cqSqSubmittedAt = new Date(examEndTime);
            hasChanges = true;
            console.log(`[Auto-Submit] Overall scheduled end time expired for submission ${submission.id}`);
        }
    }

    // 5. Check if all applicable sections are now submitted
    const effectiveObjStatus = updateData.objectiveStatus || submission.objectiveStatus;
    const effectiveCqStatus = updateData.cqSqStatus || submission.cqSqStatus;

    if (isMCQOnly) {
        if (effectiveObjStatus === SubmissionStatus.SUBMITTED) {
            updateData.status = SubmissionStatus.SUBMITTED;
            hasChanges = true;
        }
    } else if (hasObjective && hasCqSq) {
        if (effectiveObjStatus === SubmissionStatus.SUBMITTED && effectiveCqStatus === SubmissionStatus.SUBMITTED) {
            updateData.status = SubmissionStatus.SUBMITTED;
            hasChanges = true;
        }
    } else if (!hasObjective && hasCqSq) {
        if (effectiveCqStatus === SubmissionStatus.SUBMITTED) {
            updateData.status = SubmissionStatus.SUBMITTED;
            hasChanges = true;
        }
    }

    if (hasChanges) {
        const updatedSubmission = await prisma.examSubmission.update({
            where: { id: submission.id },
            data: updateData as any
        });

        // If finalized, evaluate immediately so student gets result
        if (updatedSubmission.status === SubmissionStatus.SUBMITTED && examId) {
            try {
                const fullExam = (exam.totalMarks !== undefined ? exam : await prisma.exam.findUnique({ where: { id: examId }, include: { examSets: true } })) as Exam & { examSets?: ExamSet[] };
                const examSets = fullExam?.examSets || await prisma.examSet.findMany({ where: { examId } });
                if (fullExam) {
                    await evaluateSubmission(updatedSubmission, fullExam, examSets, true);
                    console.log(`[Auto-Submit] Evaluated submission ${updatedSubmission.id} on auto-submit`);
                }
            } catch (evalErr) {
                console.error(`[Auto-Submit] Evaluation error for submission ${updatedSubmission.id}:`, evalErr);
            }
        }

        return updatedSubmission;
    }

    return submission;
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

    // Get non-submitted in-progress submissions
    const pendingSubmissions = await prisma.examSubmission.findMany({
        where: {
            examId,
            status: SubmissionStatus.IN_PROGRESS
        },
        include: {
            exam: {
                include: {
                    examSets: true
                }
            }
        }
    });

    console.log(`[Auto-Submit] Found ${pendingSubmissions.length} pending submissions for exam ${examId}`);

    // Force evaluate them after checking for expirations
    for (const submission of pendingSubmissions) {
        // First ensure statuses are up to date if they expired
        const updatedSubmission = await autoSubmitExpiredSections(submission, exam);

        // This will set status to SUBMITTED and calculate marks
        await evaluateSubmission(updatedSubmission, exam, exam.examSets);
    }

    // Now release results to students
    await releaseExamResults(examId);
}
