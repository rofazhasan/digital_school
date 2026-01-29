import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupBrokenImages() {
    try {
        console.log('Starting cleanup of broken image URLs...');

        // Get all exam submissions
        const submissions = await prisma.examSubmission.findMany({
            select: {
                id: true,
                answers: true,
            },
        });

        let totalCleaned = 0;

        for (const submission of submissions) {
            let answers = submission.answers;
            let modified = false;

            // Parse answers if it's a string
            if (typeof answers === 'string') {
                try {
                    answers = JSON.parse(answers);
                } catch (e) {
                    console.error(`Failed to parse answers for submission ${submission.id}`);
                    continue;
                }
            }

            // Check all keys for image URLs
            const keys = Object.keys(answers);
            for (const key of keys) {
                // Check if it's an image key (ends with _image or _images)
                if (key.endsWith('_image') || key.endsWith('_images')) {
                    const value = answers[key];

                    // Check if it's a Cloudinary URL
                    if (typeof value === 'string' && value.includes('cloudinary.com')) {
                        console.log(`Found image URL in submission ${submission.id}: ${key}`);
                        delete answers[key];
                        modified = true;
                        totalCleaned++;
                    }
                }
            }

            // Update the submission if modified
            if (modified) {
                await prisma.examSubmission.update({
                    where: { id: submission.id },
                    data: { answers: JSON.stringify(answers) },
                });
                console.log(`✓ Cleaned submission ${submission.id}`);
            }
        }

        console.log(`\n✅ Cleanup complete! Removed ${totalCleaned} broken image URLs.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupBrokenImages();
