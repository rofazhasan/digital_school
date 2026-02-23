import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'student_class10_1@school.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { studentProfile: true }
    });

    if (!user) {
        console.log(`User ${email} not found`);
        const allUsers = await prisma.user.findMany({ take: 5 });
        console.log('Sample users:', allUsers.map(u => u.email));
    } else {
        console.log(`User ${email} found:`, {
            id: user.id,
            role: user.role,
            hasProfile: !!user.studentProfile,
            profileId: user.studentProfile?.id
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
