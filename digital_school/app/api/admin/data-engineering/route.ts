import { NextRequest, NextResponse } from 'next/server';
import { dataRecoveryEngine } from '@/lib/data-engineering/data-recovery';
import { dataWarehouseEngine } from '@/lib/data-engineering/warehouse';
import { aiDatasetPipeline } from '@/lib/data-engineering/ai-dataset-pipeline';
import { lakehouseEngine } from '@/lib/data-engineering/lakehouse';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'warehouse';
    const table = searchParams.get('table') || 'Question';
    const time = searchParams.get('time') || new Date().toISOString();

    if (action === 'recover') {
      const recoveredData = await dataRecoveryEngine.recoverDataAtTimestamp(table, time);
      return NextResponse.json({ success: true, action: 'recover', table, timestamp: time, records: recoveredData });
    }

    // Default: Return Gold Lakehouse Warehouse metrics
    const subjectMetrics = await lakehouseEngine.readTable('gold', 'subject_difficulty_metrics');
    const examMetrics = await lakehouseEngine.readTable('gold', 'exam_analytics_aggregates');

    return NextResponse.json({
      success: true,
      warehouse: {
        subjectMetrics,
        examMetrics,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in /api/admin/data-engineering GET:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tables } = body;

    if (action === 'snapshot') {
      const snapshots = await dataRecoveryEngine.createSnapshot(tables || ['Question', 'Exam', 'ExamSubmission', 'User']);
      return NextResponse.json({ success: true, message: 'Snapshot created successfully', snapshots });
    }

    if (action === 'warehouse') {
      const subjectMetrics = await dataWarehouseEngine.buildSubjectDifficultyWarehouse();
      const examMetrics = await dataWarehouseEngine.buildExamAnalyticsWarehouse();
      return NextResponse.json({ success: true, message: 'Warehouse metrics updated', warehouse: { subjectMetrics, examMetrics } });
    }

    if (action === 'ai-build') {
      const datasets = await aiDatasetPipeline.buildAiTrainingDatasets();
      return NextResponse.json({ success: true, message: 'AI Training Datasets built successfully', datasets });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error in /api/admin/data-engineering POST:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
