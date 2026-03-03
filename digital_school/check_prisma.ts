import db from './lib/db';

async function checkPrisma() {
    try {
        const keys = Object.keys(db);
        console.log('Prisma keys:', keys.filter(k => !k.startsWith('_')).join(', '));

        // Check ResultReview model properties
        const rrFields = (db as any).resultReview.fields;
        console.log('\nResultReview fields:', rrFields ? Object.keys(rrFields).join(', ') : 'MISSING');

        // Check ExamSubmission model properties
        const esFields = (db as any).examSubmission.fields;
        console.log('\nExamSubmission fields:', esFields ? Object.keys(esFields).join(', ') : 'MISSING');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPrisma();
