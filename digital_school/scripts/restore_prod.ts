
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
    const backupPath = path.join(process.cwd(), 'backup_prod_full.json');
    if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found at ${backupPath}`);
    }

    console.log("Reading backup file...");
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    const validUserIds = new Set((data.user || []).map((u: any) => u.id));
    const validClassIds = new Set((data.class || []).map((c: any) => c.id));
    const validInstituteIds = new Set((data.institute || []).map((i: any) => i.id));

    const fallbackUser = data.user?.find((u: any) => u.role === 'SUPER_USER') || data.user?.[0];

    // --- WIPE ---
    console.log("⚠️  WIPING DATABASE...");
    try {
        const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
        const tablesToTruncate = tablenames.map(t => `"${t.tablename}"`).filter(t => t !== '"_prisma_migrations"');
        if (tablesToTruncate.length > 0) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE;`);
            console.log("✅ Database wiped.");
        }
    } catch (e) { console.error("Wipe failed:", e); }

    // --- RESTORE HELPER ---
    const restoreModel = async (modelName: string, rows: any[], transform?: (row: any) => any, relationMap: Record<string, string> = {}) => {
        if (!rows || rows.length === 0) return;
        console.log(`Restoring ${rows.length} ${modelName}...`);

        const individualRows: any[] = [];

        for (let r of rows) {
            if (transform) r = transform(r);
            if (!r) continue;

            // Relation Mapping Logic: Convert scalar ID -> { connect: { id: ... } }
            // AND DELETE THE SCALAR ID.
            const row = { ...r };

            for (const [scalarField, relationName] of Object.entries(relationMap)) {
                const val = row[scalarField];

                // Delete scalar regardless (to avoid 'Unknown argument' in Checked input)
                delete row[scalarField];

                // If value exists and isn't null, connect it
                if (val) {
                    row[relationName] = { connect: { id: val } };
                }
            }
            individualRows.push(row);
        }

        // Always use individual create for complex models to ensure relation correctness
        // Batch create is faster but stricter on scalars, and we are fixing orphans/data structure here.
        // For simple models we could use batch, but let's be safe.

        let success = 0;
        // Batch Insert optimization for simple models (no relations in map)
        if (Object.keys(relationMap).length === 0) {
            try {
                // @ts-ignore
                await prisma[modelName].createMany({ data: rows, skipDuplicates: true });
                console.log(`  ✅ Restored ${modelName} (Batch)`);
                return;
            } catch (e) { console.log("  Batch failed, trying individual..."); }
        }

        for (const row of individualRows) {
            try {
                // @ts-ignore
                await prisma[modelName].create({ data: row });
                success++;
            } catch (err: any) {
                console.error(`    Failed ${row.id}: ${err.message}`);
            }
        }
        console.log(`  ✅ Recovered ${success}/${individualRows.length} ${modelName}`);
    };

    // 1. Independent (Top of dependency tree)
    // BREAK CIRCULAR DEPENDENCY: Institute depends on SuperUser, User depends on Institute.
    // Restore Institute WITHOUT superUserId first.
    await restoreModel('institute', data.institute, (i) => {
        const newI = { ...i };
        delete newI.superUserId; // Will re-link later
        return newI;
    });

    // 2. First-level Dependencies
    await restoreModel('user', data.user, undefined, { instituteId: 'institute' });
    await restoreModel('class', data.class, undefined, { instituteId: 'institute' });
    await restoreModel('questionBank', data.questionBank, undefined, { instituteId: 'institute' });

    // 3. Second-level Dependencies
    await restoreModel('studentProfile', data.studentProfile, undefined, { userId: 'user', classId: 'class' });
    // teacherProfile depends on User
    await restoreModel('teacherProfile', data.teacherProfile, undefined, { userId: 'user' });

    // 4. Questions
    // Map all scalars to their Relation names in Schema
    const questionRelations = {
        classId: 'class',
        createdById: 'createdBy',
        teacherProfileId: 'TeacherProfile', // Note capitalization in Schema!
        clonedFromId: 'clonedFrom',
        editedById: 'editedBy'
    };

    await restoreModel('question', data.question, (q) => {
        const newQ = { ...q };
        delete newQ.fbd;
        delete newQ.questionLatex;
        delete newQ.answerLatex;
        delete newQ.difficultyDetail;

        newQ.isForPractice = newQ.isForPractice ?? false;
        if (!newQ.tags) newQ.tags = [];
        if (!newQ.images) newQ.images = [];

        // Orphans Check (Before we convert to relations)
        if (newQ.classId && !validClassIds.has(newQ.classId)) return null;
        if (newQ.createdById && !validUserIds.has(newQ.createdById)) {
            if (fallbackUser) newQ.createdById = fallbackUser.id;
            else return null;
        }
        return newQ;
    }, questionRelations);

    // 4. Exams
    const examRelations = {
        classId: 'class',
        createdById: 'createdBy',
        teacherProfileId: 'TeacherProfile',
        examSetId: 'examSet' // If applicable
    };

    await restoreModel('exam', data.exam, (e) => {
        const newE = { ...e };
        // Ensure createdById exists or use fallback
        if (newE.createdById && !validUserIds.has(newE.createdById)) {
            if (fallbackUser) newE.createdById = fallbackUser.id;
            else return null;
        }
        return newE;
    }, {
        classId: 'class',
        createdById: 'createdBy',
        teacherProfileId: 'TeacherProfile',
        questionBankId: 'questionBank' // If exists in schema (checked: not in recent schema dump but safe to map)
    });

    await restoreModel('examSet', data.examSet, undefined, { examId: 'exam' });

    // 5. Maps/Results
    await restoreModel('examStudentMap', data.examStudentMap, undefined, {
        examId: 'exam',
        studentId: 'student'
    });

    await restoreModel('examSubmission', data.examSubmission, undefined, {
        examId: 'exam',
        studentId: 'student'
    });

    await restoreModel('result', data.result, undefined, {
        examId: 'exam',
        studentId: 'student',
        examSubmissionId: 'examSubmission' // FIXED: Was submissionId, schema says examSubmissionId
    });

    // 6. Many-to-Many & Special Tables
    const restoreRawTable = async (tableName: string, dataKey: string, columns: string[]) => {
        if (data[dataKey]) {
            console.log(`Restoring Raw Table: ${tableName}`);
            for (const row of data[dataKey]) {
                const cols = columns.map(c => `"${c}"`).join(', ');
                const vals = columns.map((_, i) => `$${i + 1}`).join(', ');
                const values = columns.map(c => row[c]);
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING`,
                    ...values
                ).catch(() => { });
            }
        }
    };

    if (data.questionToQuestionBank) await restoreRawTable('_QuestionToQuestionBank', 'questionToQuestionBank', ['A', 'B']);
    if (data.examSetToQuestion) await restoreRawTable('_ExamSetToQuestion', 'examSetToQuestion', ['A', 'B']);
    if (data.examSetToQuestionBank) await restoreRawTable('_ExamSetToQuestionBank', 'examSetToQuestionBank', ['A', 'B']);

    // 7. Evaluations & Others
    await restoreModel('examEvaluationAssignment', data.examEvaluationAssignment, undefined, {
        examId: 'exam',
        teacherId: 'teacher'
    });

    // Versions
    await restoreModel('questionVersion', data.questionVersion, undefined, { questionId: 'question' });

    // 7. FIX CIRCULAR DEPS (Institute SuperUser)
    if (data.institute) {
        console.log("Linking Institute SuperUsers...");
        for (const i of data.institute) {
            if (i.superUserId) {
                await prisma.institute.update({
                    where: { id: i.id },
                    data: { superUserId: i.superUserId }
                }).catch(e => console.warn(`Failed to link SuperUser for Institute ${i.id}`, e.message));
            }
        }
    }

    console.log("✅ Restore FINISHED.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
