
import { PrismaClient } from '@prisma/client';
import { releaseExamResults } from '../lib/exam-logic';

const prisma = new PrismaClient();

async function verify() {
    // 1. Get a sample exam with results
    const exam = await prisma.exam.findFirst({
        where: {
            results: { some: {} }
        },
        include: {
            results: true
        }
    });

    if (!exam) {
        console.log("No exam with results found for testing.");
        return;
    }

    console.log(`Testing with Exam: ${exam.name} (${exam.id})`);

    // 2. Set all results to isPublished: true
    console.log("Setting all results to published...");
    await prisma.result.updateMany({
        where: { examId: exam.id },
        data: { isPublished: true, publishedAt: new Date() }
    });

    // 3. Call releaseExamResults and check logs (it should return early)
    console.log("Calling releaseExamResults (should return early without sending emails)...");
    const startTime = Date.now();
    await releaseExamResults(exam.id);
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime}ms`);

    // 4. Set one result to isPublished: false
    console.log("\nSetting one result to unpublished (dirtying the data)...");
    const resultToDirty = exam.results[0];
    await prisma.result.update({
        where: { id: resultToDirty.id },
        data: { isPublished: false }
    });

    // 5. Call releaseExamResults again (should proceed)
    console.log("Calling releaseExamResults again (should proceed and send 1 notification)...");
    const startTime2 = Date.now();
    await releaseExamResults(exam.id);
    const endTime2 = Date.now();
    console.log(`Execution time: ${endTime2 - startTime2}ms`);

    console.log("\nVerification complete.");
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
