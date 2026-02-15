
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Cleanup...');

    const EXAM_NAME = "National Load Test Exam";
    const CLASS_NAME = "Class Load Test";
    const HALL_PREFIX = "Load Hall";
    const STUDENT_EMAIL_PREFIX = "load_std_";

    const exam = await prisma.exam.findFirst({ where: { name: EXAM_NAME } });
    const loadClass = await prisma.class.findFirst({ where: { name: CLASS_NAME } });
    const hallCount = await prisma.examHall.count({ where: { name: { startsWith: HALL_PREFIX } } });
    const userCount = await prisma.user.count({ where: { email: { startsWith: STUDENT_EMAIL_PREFIX } } });

    console.log(`- Exam "${EXAM_NAME}": ${exam ? '❌ FOUND' : '✅ GONE'}`);
    console.log(`- Class "${CLASS_NAME}": ${loadClass ? '❌ FOUND' : '✅ GONE'}`);
    console.log(`- Halls starting with "${HALL_PREFIX}": ${hallCount > 0 ? `❌ FOUND (${hallCount})` : '✅ GONE'}`);
    console.log(`- Users starting with "${STUDENT_EMAIL_PREFIX}": ${userCount > 0 ? `❌ FOUND (${userCount})` : '✅ GONE'}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
