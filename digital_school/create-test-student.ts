
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const classId = 'cmlrofkwi000u3uwfwedpi0o0'; // Valid class ID

    console.log('--- Creating Test Student ---');

    const user = await prisma.user.upsert({
        where: { email: 'test_student@example.com' },
        update: {},
        create: {
            email: 'test_student@example.com',
            name: 'Test Student',
            role: 'STUDENT',
            isActive: true,
        }
    });

    const studentProfile = await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            roll: '101',
            registrationNo: 'REG101',
            guardianName: 'Guardian',
            guardianPhone: '01700000000',
            classId: classId,
        }
    });

    console.log('✅ Test student and profile created.');
    console.log('Student Profile ID:', studentProfile.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
