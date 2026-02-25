import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: examId } = await params;
        const { searchParams } = new URL(request.url);
        const resultId = searchParams.get('resultId');

        if (!resultId) {
            return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
        }

        const tokenData = await getTokenFromRequest(request);
        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prisma = await DatabaseClient.getInstance();

        const practiceResult = await prisma.practiceResult.findUnique({
            where: { id: resultId },
            include: {
                exam: {
                    include: {
                        examSets: true,
                        class: true
                    }
                },
                student: true
            }
        });

        if (!practiceResult) {
            return NextResponse.json({ error: 'Practice result not found' }, { status: 404 });
        }

        const exam = practiceResult.exam;
        const studentAnswers = practiceResult.answers as any || {};

        // Collect all objective questions from all sets to match with answers
        const allQuestions: any[] = [];
        const questionIdsSet = new Set<string>();

        for (const examSet of exam.examSets) {
            const qList = examSet.questionsJson ? (
                Array.isArray(examSet.questionsJson)
                    ? examSet.questionsJson
                    : JSON.parse(examSet.questionsJson as string)
            ) : [];

            for (const q of qList) {
                if (!questionIdsSet.has(q.id)) {
                    allQuestions.push(q);
                    questionIdsSet.add(q.id);
                }
            }
        }

        // Process questions with student answers
        const processedQuestions = allQuestions.map((q: any) => {
            const studentAnswer = studentAnswers[q.id];
            const type = (q.type || q.questionType || '').toUpperCase();
            let isCorrect = false;
            let awardedMarks = 0;

            if (studentAnswer) {
                if (type === 'MCQ') {
                    const normalize = (s: any) => String(s || '').trim().toLowerCase().normalize();
                    const userAns = normalize(studentAnswer);

                    if (q.options && Array.isArray(q.options)) {
                        const correctOption = q.options.find((opt: any) => opt.isCorrect);
                        if (correctOption) {
                            const correctOptionText = normalize(correctOption.text || String(correctOption));
                            isCorrect = userAns === correctOptionText;
                        }
                    }
                    if (!isCorrect && (q.correctAnswer || q.correct)) {
                        isCorrect = userAns === normalize(String(q.correctAnswer || q.correct));
                    }
                    if (isCorrect) awardedMarks = q.marks || 0;
                }
                // Add more evaluation logic if needed (similar to regular results API)
                // For now, focusing on MCQ/Objective as practice is mainly for those
            }

            return {
                ...q,
                studentAnswer,
                isCorrect,
                awardedMarks
            };
        });

        // Calculate statistics for THIS specific practice result vs other practice results of same exam
        const statsAggregation = await prisma.practiceResult.aggregate({
            where: { examId: exam.id },
            _avg: { score: true },
            _max: { score: true },
            _min: { score: true },
            _count: { _all: true }
        });

        const rankCount = await prisma.practiceResult.count({
            where: {
                examId: exam.id,
                score: { gt: practiceResult.score }
            }
        });

        return NextResponse.json({
            exam: {
                ...exam,
                subject: (exam as any).subject || 'Academic',
                className: exam.class?.name || 'Academic'
            },
            student: {
                name: (practiceResult.student as any).name || 'Student',
                roll: (practiceResult.student as any).roll || 'N/A'
            },
            submission: {
                id: practiceResult.id,
                submittedAt: practiceResult.createdAt,
                score: practiceResult.score
            },
            result: {
                total: practiceResult.score,
                rank: rankCount + 1,
                percentage: (practiceResult.score / practiceResult.totalMarks) * 100,
                isPractice: true
            },
            questions: processedQuestions,
            statistics: {
                totalStudents: statsAggregation._count._all,
                averageScore: statsAggregation._avg.score || 0,
                highestScore: statsAggregation._max.score || 0,
                lowestScore: statsAggregation._min.score || 0
            }
        });

    } catch (error) {
        console.error('GET /api/exams/practice/results Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
