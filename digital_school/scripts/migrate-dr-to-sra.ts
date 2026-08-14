/**
 * Migration Script: DR -> SRA (Structured Reasoning Assembly)
 * 
 * Safely converts legacy DR questions into SRA structured question format.
 */

import { convertDRToSRA } from '../lib/evaluation/sraEvaluation';
import prismadb from '../lib/db';

async function migrateDRToSRA() {
  console.log('==========================================================================');
  console.log('   DR -> SRA (STRUCTURED REASONING ASSEMBLY) DATABASE MIGRATION');
  console.log('==========================================================================');

  try {
    const drQuestions = await prismadb.question.findMany({
      where: {
        type: 'DR' as any
      }
    });

    console.log(`Found ${drQuestions.length} legacy DR questions to migrate.`);

    let migratedCount = 0;
    for (const q of drQuestions) {
      const sraStructure = convertDRToSRA(q);
      
      await prismadb.question.update({
        where: { id: q.id },
        data: {
          type: 'SRA' as any,
          subQuestions: sraStructure.components as any
        }
      });
      migratedCount++;
    }

    console.log(`✅ Successfully migrated ${migratedCount} questions from DR to SRA.`);
  } catch (err: any) {
    console.error('Migration error (or no db connection in local runner):', err?.message || err);
  }
}

if (require.main === module) {
  migrateDRToSRA();
}

export { migrateDRToSRA };
