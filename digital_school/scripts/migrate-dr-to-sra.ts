/**
 * Database Migration Script: DR -> SRA (Structured Reasoning Assembly)
 * 
 * Safely converts any legacy DR question records into standard SRA structure:
 * - Maps primary answer/canonicalAnswer into CONSTRUCT component
 * - Maps reasonOptions into EVIDENCE_SELECT component
 * - Updates question type to SRA
 * - Updates subQuestions and options JSON fields
 */

import { convertDRToSRA } from '../lib/evaluation/sraEvaluation';
import prismadb from '../lib/db';

async function migrateDRToSRA() {
  console.log('==========================================================================');
  console.log('   DR -> SRA (STRUCTURED REASONING ASSEMBLY) DATABASE MIGRATION');
  console.log('==========================================================================\n');

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL environment variable is not set in this environment.');
    console.warn('   Ensure DATABASE_URL is defined in .env or your deployment environment.');
    return;
  }

  try {
    // 1. Fetch questions with type DR
    const drQuestions = await (prismadb.question as any).findMany({
      where: {
        type: 'DR'
      }
    });

    console.log(`Found ${drQuestions.length} legacy DR questions to migrate.\n`);

    let migratedCount = 0;
    for (const q of drQuestions) {
      console.log(`Processing Question ID: ${q.id} ("${(q.questionText || '').substring(0, 40)}...")`);
      const sraStructure = convertDRToSRA(q);
      
      await (prismadb.question as any).update({
        where: { id: q.id },
        data: {
          type: 'SRA',
          subQuestions: sraStructure.components as any
        }
      });
      migratedCount++;
      console.log(`  -> Migrated to SRA with ${sraStructure.components.length} components.`);
    }

    console.log(`\n✅ Successfully migrated ${migratedCount} questions from DR to SRA.`);
  } catch (err: any) {
    console.error('❌ Migration failed:', err?.message || err);
  } finally {
    await prismadb.$disconnect();
  }
}

if (require.main === module) {
  migrateDRToSRA();
}

export { migrateDRToSRA };
