
import { PrismaClient } from '@prisma/client';
import { getAvailablePresets } from '../utils/diagrams/index';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Bulk Diagram Question Seeding...');

    // 1. Get Context
    const superUser = await prisma.user.findFirst({
        where: { email: 'superuser@school.com' }
    });

    const targetClass = await prisma.class.findFirst({
        where: { name: 'Class 10' }
    });

    if (!superUser || !targetClass) {
        // Fallback if main seed wasn't run or email differs
        console.log('⚠️ Superuser or Class 10 not found. Checking for any available user/class...');
        const fallbackUser = await prisma.user.findFirst();
        const fallbackClass = await prisma.class.findFirst();

        if (!fallbackUser || !fallbackClass) {
            throw new Error('No users or classes found in database. Please run migrations and base seed.');
        }

        console.log(`✅ Using fallback user: ${fallbackUser.email} and class: ${fallbackClass.name}`);
        // Proceed with fallbacks
        return runSeeding(fallbackUser.id, fallbackClass.id);
    }

    return runSeeding(superUser.id, targetClass.id);
}

async function runSeeding(userId: string, classId: string) {
    // 2. Get all presets
    const presets = getAvailablePresets();
    console.log(`📦 Found ${presets.length} presets to seed.`);

    let seeded = 0;

    for (const presetName of presets) {
        try {
            // Create a question for this preset
            await prisma.question.create({
                data: {
                    type: 'MCQ',
                    subject: 'Physics',
                    topic: 'High Volume Verification',
                    questionText: `Identify the correct property or component shown in this diagram: ##PRESET:${presetName}##`,
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    modelAnswer: 'Option A',
                    marks: 1,
                    difficulty: 'MEDIUM',
                    classId: classId,
                    createdById: userId,
                    hasMath: true,
                    tags: ['automated-verification', presetName]
                }
            });
            seeded++;
            if (seeded % 50 === 0) {
                console.log(`✅ Seeded ${seeded} questions...`);
            }
        } catch (e: any) {
            console.error(`❌ Failed to seed ${presetName}:`, e.message);
        }
    }

    console.log(`\n🎉 SEEDING COMPLETE! Total Questions Seeded: ${seeded}`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
