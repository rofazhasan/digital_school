import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const sets = await prisma.examSet.findMany({
        where: {
            NOT: { questionsJson: { equals: null } } as any
        },
        take: 10
    });

    console.log(`Checking ${sets.length} ExamSets...`);
    sets.forEach((set: any) => {
        console.log(`\nExamSet: ${set.name} (examId: ${set.examId})`);
        const qJson = set.questionsJson;
        if (qJson && Array.isArray(qJson)) {
            const sample = qJson[0] as any;
            if (sample) {
                console.log('Sample question keys:', Object.keys(sample));
                if (sample.negativeMarking !== undefined || sample.negativeMarks !== undefined) {
                    console.log('FOUND negative marking in JSON!');
                    console.log('Sample:', {
                        id: sample.id,
                        negativeMarking: sample.negativeMarking,
                        negativeMarks: sample.negativeMarks
                    });
                } else {
                    console.log('No negative marking found in this sample.');
                }
            }
        }
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
