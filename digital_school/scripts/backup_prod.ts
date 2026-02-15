
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.PROD_DATABASE_URL,
        },
    },
});

async function main() {
    console.log("Starting Production Backup (Raw SQL Mode)...");

    const data: any = {};

    // Explicit mapping of Prisma model names to DB table names
    const tableMapping: Record<string, string> = {
        'user': 'users',
        'class': 'classes',
        'studentProfile': 'student_profiles',
        'teacherProfile': 'teacher_profiles',
        'questionBank': 'question_banks',
        'question': 'questions',
        'questionToQuestionBank': '_QuestionToQuestionBank', // Implicit many-to-many
        'exam': 'exams',
        'examSet': 'exam_sets',
        'examStudentMap': 'exam_student_maps',
        'examSubmission': 'ExamSubmission', // Note case from DB check
        'result': 'results',
        'institute': 'institutes',
        'notice': 'notices',
        'notification': 'notifications',
        'examEvaluationAssignment': 'exam_evaluation_assignments',
        'questionVersion': 'QuestionVersion',
        'examSetToQuestion': '_ExamSetToQuestion',
        'examSetToQuestionBank': '_ExamSetToQuestionBank',
        'noticeToClasses': '_NoticeToClasses',
        'attendance': 'attendance',
        'badge': 'badges',
        'omrScanSession': 'omr_scan_sessions',
        'omrSheet': 'omr_sheets',
        'payment': 'payments',
        'invoice': 'invoices',
        'feeStructure': 'fee_structures',
        // Add others if needed based on schema
    };

    const models = Object.keys(tableMapping);

    for (const model of models) {
        const tableName = tableMapping[model];
        console.log(`Backing up ${model} (Table: ${tableName})...`);
        try {
            // Use raw SQL to bypass Prisma schema validation errors (e.g. missing columns in schema)
            const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
            data[model] = rows;
            // @ts-ignore
            console.log(`  Saved ${rows.length} records for ${model}`);
        } catch (e) {
            console.warn(`  Could not backup ${model} from table "${tableName}":`);
            // console.error(e); // Uncomment for verbose error
        }
    }

    const backupPath = path.join(process.cwd(), 'backup_prod_full.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`✅ Backup complete! Saved to ${backupPath}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
