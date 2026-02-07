
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.PROD_DATABASE_URL,
        },
    },
});

async function main() {
    try {
        const result: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions'
      ORDER BY column_name;
    `;

        const columnNames = result.map(c => c.column_name);
        console.log("Found columns:", columnNames);

        console.log("---------------------------------------------------");
        console.log("HAS 'fbd'?", columnNames.includes('fbd'));
        console.log("HAS 'isForPractice'?", columnNames.includes('isForPractice'));
        console.log("HAS 'questionLatex'?", columnNames.includes('questionLatex'));
        console.log("---------------------------------------------------");

    } catch (e) {
        console.error("Error querying DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
