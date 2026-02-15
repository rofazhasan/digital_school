
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of Load Test Mock Data (V2)...');

    const EXAM_NAME = "National Load Test Exam";
    const CLASS_NAME = "Class Load Test";
    const HALL_PREFIX = "Load Hall";
    const STUDENT_EMAIL_PREFIX = "load_std_";

    // 1. Clean up Exam-related data (already done mostly, but re-run safe)
    const exam = await prisma.exam.findFirst({ where: { name: EXAM_NAME } });
    if (exam) {
        console.log(`Found exam "${EXAM_NAME}". Cleaning up...`);
        await prisma.seatAllocation.deleteMany({ where: { examId: exam.id } });
        await prisma.admitCard.deleteMany({ where: { examId: exam.id } });
        await prisma.examStudentMap.deleteMany({ where: { examId: exam.id } });
        await prisma.exam.delete({ where: { id: exam.id } });
        console.log(`- Deleted Exam.`);
    }

    // 2. Clean up Student Profiles (BATCHED)
    const loadClass = await prisma.class.findFirst({ where: { name: CLASS_NAME } });

    if (loadClass) {
        console.log(`Found class "${CLASS_NAME}". Deleting profiles...`);
        // Count first
        const profileCount = await prisma.studentProfile.count({ where: { classId: loadClass.id } });
        console.log(`- Found ${profileCount} profiles.`);

        // Batched delete
        let deletedProfiles = 0;
        while (deletedProfiles < profileCount) {
            const batch = await prisma.studentProfile.findMany({
                where: { classId: loadClass.id },
                take: 5000,
                select: { id: true }
            });

            if (batch.length === 0) break;

            await prisma.studentProfile.deleteMany({
                where: { id: { in: batch.map(p => p.id) } }
            });

            deletedProfiles += batch.length;
            console.log(`  - Deleted ${deletedProfiles}/${profileCount} profiles...`);
        }

        // Now safe to delete Class
        await prisma.class.delete({ where: { id: loadClass.id } });
        console.log(`- Deleted Class "${CLASS_NAME}".`);
    }

    // 3. Clean up Users (BATCHED)
    console.log(`Deleting Mock Users...`);
    const userCount = await prisma.user.count({ where: { email: { startsWith: STUDENT_EMAIL_PREFIX } } });
    console.log(`- Found ${userCount} users.`);

    let deletedUsers = 0;
    while (deletedUsers < userCount) {
        // Find IDs first
        const batch = await prisma.user.findMany({
            where: { email: { startsWith: STUDENT_EMAIL_PREFIX } },
            take: 5000,
            select: { id: true }
        });

        if (batch.length === 0) break;

        await prisma.user.deleteMany({
            where: { id: { in: batch.map(u => u.id) } }
        });

        deletedUsers += batch.length;
        console.log(`  - Deleted ${deletedUsers}/${userCount} users...`);
    }

    // 4. Clean up Halls
    const hallCount = await prisma.examHall.count({ where: { name: { startsWith: HALL_PREFIX } } });
    if (hallCount > 0) {
        await prisma.examHall.deleteMany({ where: { name: { startsWith: HALL_PREFIX } } });
        console.log(`- Deleted ${hallCount} ExamHalls.`);
    }

    console.log('✅ Cleanup V2 complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
