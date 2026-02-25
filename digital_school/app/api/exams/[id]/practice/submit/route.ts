import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { evaluateMCQuestion } from '@/lib/evaluation/mcEvaluation';
import { evaluateINTQuestion } from '@/lib/evaluation/intEvaluation';
import { evaluateARQuestion } from '@/lib/evaluation/arEvaluation';
import { evaluateMTFQuestion } from '@/lib/evaluation/mtfEvaluation';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: examId } = await params;
        const tokenData = await getTokenFromRequest(request);

        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;
        const body = await request.json();
        const { answers } = body;

        if (!answers) {
            return NextResponse.json({ error: 'Missing answers' }, { status: 400 });
        }

        const prisma = await DatabaseClient.getInstance();

        // 1. Fetch the exam and its questions
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                examSets: true,
            },
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // 2. Collect all MCQ/Objective questions from all sets
        const objectiveQuestions: any[] = [];
        const questionIdsSet = new Set<string>();

        for (const examSet of exam.examSets) {
            const qList = examSet.questionsJson ? (
                Array.isArray(examSet.questionsJson)
                    ? examSet.questionsJson
                    : JSON.parse(examSet.questionsJson as string)
            ) : [];

            for (const q of qList) {
                if (!questionIdsSet.has(q.id)) {
                    const type = (q.type || q.questionType || '').toLowerCase();
                    const isObjective = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(type) || !['cq', 'sq', 'descriptive'].includes(type);

                    if (isObjective) {
                        objectiveQuestions.push(q);
                        questionIdsSet.add(q.id);
                    }
                }
            }
        }

        // 3. Evaluate MCQ answers
        let totalScore = 0;
        let totalPossibleMarks = 0;

        for (const question of objectiveQuestions) {
            const type = (question.type || question.questionType || '').toUpperCase();
            const studentAnswer = answers[question.id];
            totalPossibleMarks += Number(question.marks) || 0;

            if (!studentAnswer) continue;

            let questionScore = 0;

            if (type === 'MCQ') {
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
                    isCorrect = userAns === normalize(String(question.correctAnswer || question.correct));
                }

                if (isCorrect) {
                    questionScore = Number(question.marks) || 0;
                } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'MC') {
                questionScore = Number(evaluateMCQuestion(question, studentAnswer, {
                    negativeMarking: exam.mcqNegativeMarking || 0,
                    partialMarking: true
                })) || 0;
            } else if (type === 'INT' || type === 'NUMERIC') {
                const result = evaluateINTQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'AR') {
                const result = evaluateARQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore = -((Number(question.marks || 0) * exam.mcqNegativeMarking) / 100);
                }
            } else if (type === 'MTF') {
                const result = evaluateMTFQuestion(question, studentAnswer);
                questionScore = Number(result.score) || 0;
                if (!result.isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    questionScore -= (Number(question.marks || 0) * exam.mcqNegativeMarking) / 100;
                }
            }

            totalScore += questionScore;
        }

        // 4. Save Practice Result
        const practiceResult = await prisma.practiceResult.create({
            data: {
                studentId,
                examId,
                answers: answers,
                score: totalScore,
                totalMarks: totalPossibleMarks,
            },
        });

        return NextResponse.json({
            success: true,
            resultId: practiceResult.id,
            score: totalScore,
            totalMarks: totalPossibleMarks,
        });

    } catch (error) {
        console.error('POST /api/exams/[id]/practice/submit Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
