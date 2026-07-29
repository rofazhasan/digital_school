if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://build:build@localhost:5432/builddb';
}

import { dataRecoveryEngine } from '../lib/data-engineering/data-recovery';
import { dataWarehouseEngine } from '../lib/data-engineering/warehouse';
import { aiDatasetPipeline } from '../lib/data-engineering/ai-dataset-pipeline';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('===========================================================');
  console.log('🚀 Digital School Data Engineering & Lakehouse Suite');
  console.log('===========================================================');

  if (command === 'snapshot' || command === 'all') {
    console.log('\n--- Step 1: Creating Data Snapshots & Lakehouse Silver Sync ---');
    await dataRecoveryEngine.createSnapshot(['Question', 'Exam', 'ExamSubmission', 'User']);
  }

  if (command === 'recover') {
    const tableArg = args.find((a) => a.startsWith('--table='))?.split('=')[1] || 'Question';
    const timeArg = args.find((a) => a.startsWith('--time='))?.split('=')[1] || new Date().toISOString();

    console.log(`\n--- Time-Travel Data Recovery: Table [${tableArg}] at [${timeArg}] ---`);
    const recovered = await dataRecoveryEngine.recoverDataAtTimestamp(tableArg, timeArg);
    console.log('Recovered Records Sample:', recovered.slice(0, 2));
  }

  if (command === 'warehouse' || command === 'all') {
    console.log('\n--- Step 2: Syncing Data Warehouse OLAP Aggregates ---');
    await dataWarehouseEngine.buildSubjectDifficultyWarehouse();
    await dataWarehouseEngine.buildExamAnalyticsWarehouse();
  }

  if (command === 'ai-build' || command === 'all') {
    console.log('\n--- Step 3: Building AI Training Datasets ---');
    await aiDatasetPipeline.buildAiTrainingDatasets();
  }

  console.log('\n✨ Data Engineering Operations Completed Successfully!');
}

main().catch((err) => {
  console.error('❌ Data Engineering CLI Error:', err);
  process.exit(1);
});
