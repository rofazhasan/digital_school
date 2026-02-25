import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const reviews = await (prisma as any).resultReview.findMany({
            include: {
                student: {
                    include: {
                        user: true
                    }
                }
            }
        });
        console.log('Reviews count:', reviews.length);
        if (reviews.length > 0) {
            console.log('First review student name:', reviews[0].student.user.name);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
