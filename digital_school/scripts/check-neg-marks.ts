import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const exams = await prisma.exam.findMany({
        select: {
            id: true,
            name: true,
            mcqNegativeMarking: true,
            mcNegativeMarking: true,
        }
    });

    console.log(`Checking ${exams.length} exams...`);
    const mcqZero = exams.filter(e => !e.mcqNegativeMarking || e.mcqNegativeMarking === 0).length;
    const mcZero = exams.filter(e => !e.mcNegativeMarking || e.mcNegativeMarking === 0).length;

    console.log(`Exams with 0 mcqNegativeMarking: ${mcqZero}`);
    console.log(`Exams with 0 mcNegativeMarking: ${mcZero}`);

    const hasSomeData = exams.filter(e => (e.mcqNegativeMarking && e.mcqNegativeMarking > 0) || (e.mcNegativeMarking && e.mcNegativeMarking > 0));
    console.log(`Exams with SOME data: ${hasSomeData.length}`);

    if (hasSomeData.length > 0) {
        console.log('\nSample exams with data:');
        hasSomeData.slice(0, 5).forEach(e => {
            console.log(`- ${e.name}: mcq=${e.mcqNegativeMarking}, mc=${e.mcNegativeMarking}`);
        });
    }

    const bothZero = exams.filter(e => (!e.mcqNegativeMarking || e.mcqNegativeMarking === 0) && (!e.mcNegativeMarking || e.mcNegativeMarking === 0));
    if (bothZero.length > 0) {
        console.log('\nSample exams with BOTH zero:');
        bothZero.slice(0, 5).forEach(e => {
            console.log(`- ${e.name}`);
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
