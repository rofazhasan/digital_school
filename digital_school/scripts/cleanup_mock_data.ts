
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of Load Test Mock Data...');

    const EXAM_NAME = "National Load Test Exam";
    const CLASS_NAME = "Class Load Test";
    const HALL_PREFIX = "Load Hall";
    const STUDENT_EMAIL_PREFIX = "load_std_";

    // 1. Find the Exam
    const exam = await prisma.exam.findFirst({
        where: { name: EXAM_NAME }
    });

    if (exam) {
        console.log(`Found exam "${EXAM_NAME}" (ID: ${exam.id}). Cleaning up relational data...`);

        // Delete Allocations
        const deletedAllocations = await prisma.seatAllocation.deleteMany({ where: { examId: exam.id } });
        console.log(`- Deleted ${deletedAllocations.count} SeatAllocations.`);

        // Delete Admit Cards
        const deletedCards = await prisma.admitCard.deleteMany({ where: { examId: exam.id } });
        console.log(`- Deleted ${deletedCards.count} AdmitCards.`);

        // Delete Exam Map
        const deletedMap = await prisma.examStudentMap.deleteMany({ where: { examId: exam.id } });
        console.log(`- Deleted ${deletedMap.count} ExamStudentMaps.`);

        // Delete Exam
        await prisma.exam.delete({ where: { id: exam.id } });
        console.log(`- Deleted Exam.`);
    } else {
        console.log(`Exam "${EXAM_NAME}" not found.`);
    }

    // 2. Delete Students (Users and Profiles)
    console.log(`Deleting Mock Students (Email starts with "${STUDENT_EMAIL_PREFIX}")...`);

    // We can delete Users directly, hoping constraints loop back to Profile/etc.
    // Or delete Profiles first. 
    // Let's delete Users, assuming cascade or we can rely on email filter.
    // Note: deleting 100k users might be slow or timeout.

    // Prisma doesn't always support cascading deletes depending on Schema.
    // Let's check if we need to delete profiles first.
    // Profiles are linked to Users.

    // Let's find IDs first to be safe and chunk it? 
    // Or just try deleteMany on User.
    const deletedUsers = await prisma.user.deleteMany({
        where: { email: { startsWith: STUDENT_EMAIL_PREFIX } }
    });
    console.log(`- Deleted ${deletedUsers.count} Mock Users (and hopefully cascaded profiles).`);

    // Just in case Users didn't cascade delete Profiles (if relation is optional or weird),
    // let's try to cleanup orphaned profiles if any, linked to the mock class.
    const loadClass = await prisma.class.findFirst({ where: { name: CLASS_NAME } });
    if (loadClass) {
        const deletedProfiles = await prisma.studentProfile.deleteMany({
            where: { classId: loadClass.id }
        });
        console.log(`- Deleted ${deletedProfiles.count} remaining StudentProfiles in "${CLASS_NAME}".`);

        // Delete Class
        await prisma.class.delete({ where: { id: loadClass.id } });
        console.log(`- Deleted Class "${CLASS_NAME}".`);
    }

    // 3. Delete Halls
    console.log(`Deleting Mock Halls (Name starts with "${HALL_PREFIX}")...`);
    const deletedHalls = await prisma.examHall.deleteMany({
        where: { name: { startsWith: HALL_PREFIX } }
    });
    console.log(`- Deleted ${deletedHalls.count} ExamHalls.`);

    console.log('✅ Cleanup complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
