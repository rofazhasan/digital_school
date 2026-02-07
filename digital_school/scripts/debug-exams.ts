
import { PrismaClient } from '@prisma/client';

async function main() {
    const databaseUrl = 'postgresql://neondb_owner:npg_zwLvr6Tko4bn@ep-square-grass-a1zw13yd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    });

    try {
        console.log("Checking Users...");
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                studentProfile: {
                    select: {
                        id: true,
                        classId: true,
                        class: { select: { name: true, section: true } }
                    }
                }
            },
            take: 5
        });
        console.log("Sample Students:", JSON.stringify(students, null, 2));

        console.log("\nChecking Exams...");
        const exams = await prisma.exam.findMany({
            select: {
                id: true,
                name: true,
                classId: true,
                class: { select: { name: true, section: true } }
            },
            take: 5
        });
        console.log("Sample Exams:", JSON.stringify(exams, null, 2));

        console.log("\nChecking Classes...");
        const classes = await prisma.class.findMany({
            take: 5
        });
        console.log("Sample Classes:", JSON.stringify(classes, null, 2));

    } catch (error) {
        console.error("Debug failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
