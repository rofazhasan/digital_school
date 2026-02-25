import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const resultId = 'cmm1y5s900001ycp91w323dzh';
        console.log('Fetching practice result...', resultId);

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
            console.log('Practice result not found');
            return;
        }

        console.log('Got result, exam:', practiceResult.exam.name);

        const exam = practiceResult.exam;
        const studentAnswers = practiceResult.answers as any || {};

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
            }

            return {
                ...q,
                studentAnswer,
                isCorrect,
                awardedMarks
            };
        });

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

        const responseObj = {
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
        };

        // Try to JSON stringify to catch Next.js serialization issues
        JSON.stringify(responseObj);
        console.log('Successfully completed without throwing!');

    } catch (e) {
        console.error('CRASHED!');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
