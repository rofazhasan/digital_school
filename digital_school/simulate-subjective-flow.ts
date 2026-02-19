
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const studentProfileId = 'cmlrofkwm00123uwfnkwpi239'; // Correct StudentProfile ID
    const examId = 'test_exam_subjective_only';
    const examSetId = 'test_set_subjective_only';

    console.log('--- Simulating Subjective-Only Exam Flow ---');

    // 1. Check Initial State (should start with cqsq)
    // In a real browser, ExamContext would set activeSection = 'cqsq' because hasObjective is false.

    // 2. Start Subjective Section
    console.log('1. Starting Subjective Section...');
    const submission = await prisma.examSubmission.create({
        data: {
            examId: examId,
            studentId: studentProfileId,
            examSetId: examSetId,
            cqSqStatus: 'IN_PROGRESS',
            cqSqStartedAt: new Date(),
            status: 'IN_PROGRESS',
            answers: {}
        }
    });
    console.log('Submission created:', submission.id);

    // 3. Submit Final Exam
    console.log('2. Submitting Final Exam...');
    const finalSubmission = await prisma.examSubmission.update({
        where: { id: submission.id },
        data: {
            cqSqStatus: 'SUBMITTED',
            cqSqSubmittedAt: new Date(),
            status: 'SUBMITTED',
            submittedAt: new Date(),
            answers: {
                'sub_q1': 'Answer to photosynthesis...',
                'sub_q2': 'Answer to climate change...'
            }
        }
    });

    console.log('--- Verification Complete ---');
    console.log('Final Submission Status:', finalSubmission.status);
    console.log('Objective Status:', finalSubmission.objectiveStatus); // Should be default (e.g. IN_PROGRESS or null)
    console.log('CQ/SQ Status:', finalSubmission.cqSqStatus);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
