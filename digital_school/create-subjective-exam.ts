
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'cmlrofkw100023uwf7flu4747'; // Valid SUPER_USER ID
    const classId = 'cmlrofkwi000u3uwfwedpi0o0';   // Valid class ID

    console.log('--- Creating Subjective-Only Test Exam ---');

    const exam = await prisma.exam.upsert({
        where: { id: 'test_exam_subjective_only' },
        update: {},
        create: {
            id: 'test_exam_subjective_only',
            name: 'Subjective Only Verification',
            description: 'Verifying single-section logic',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // 1 hour duration
            duration: 60,
            totalMarks: 20,
            passMarks: 7,
            isActive: true,
            allowRetake: true,
            classId: classId,
            createdById: userId,
            type: 'ONLINE',
            cqTotalQuestions: 2,
            cqRequiredQuestions: 2,
            cqSqTime: 30, // 30 mins for subjective
            objectiveTime: 0, // 0 mins for objective
        }
    });

    const questions = [
        {
            id: 'sub_q1',
            type: 'CQ',
            questionText: 'Explain the process of photosynthesis in detail.',
            marks: 10,
            subQuestions: [
                { text: 'What is the role of chlorophyll?', marks: 2 },
                { text: 'How does water reach the leaves?', marks: 3 },
                { text: 'Describe the light-independent reactions.', marks: 5 }
            ]
        },
        {
            id: 'sub_q2',
            type: 'CQ',
            questionText: 'Discuss the impact of climate change on biodiversity.',
            marks: 10,
            subQuestions: [
                { text: 'Define biodiversity.', marks: 2 },
                { text: 'List three effects of rising global temperatures.', marks: 4 },
                { text: 'How can conservation efforts mitigate these impacts?', marks: 4 }
            ]
        }
    ];

    await prisma.examSet.upsert({
        where: { id: 'test_set_subjective_only' },
        update: {},
        create: {
            id: 'test_set_subjective_only',
            name: 'Set A',
            examId: exam.id,
            questionsJson: questions,
            createdById: userId // Added missing createdBy relation
        }
    });

    console.log('✅ Subjective-only exam created successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
