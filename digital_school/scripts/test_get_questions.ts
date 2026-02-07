
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.PROD_DATABASE_URL,
        },
    },
});

async function main() {
    console.log("Testing GET /api/question-bank query against PROD DB...");
    try {
        const questions = await prisma.question.findMany({
            include: {
                createdBy: { select: { id: true, name: true } },
                class: { select: { id: true, name: true } },
                QuestionToQuestionBank: {
                    include: {
                        question_banks: { select: { id: true, name: true } }
                    }
                }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });
        console.log("✅ Successfully fetched questions.");
        console.log("Count:", questions.length);
        if (questions.length > 0) {
            console.log("Sample Keys:", Object.keys(questions[0]));
        }
    } catch (error) {
        console.error("❌ FAILED to fetch questions:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
