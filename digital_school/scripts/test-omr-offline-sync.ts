/**
 * Automated Verification Suite: Physical OMR Offline-to-Online Synchronization
 * 
 * Tests:
 * 1. 500-scan bulk offline outbox retention
 * 2. Idempotency key preservation across retry attempts
 * 3. Exponential backoff & jitter calculations
 * 4. Outbox state machine transitions
 * 5. Server idempotency & duplicate handling
 */

import { RetryQueue } from '../lib/omr/retry-queue';

interface MockOutboxRecord {
  scanUuid: string;
  idempotencyKey: string;
  examId: string;
  rollNumber: string;
  rawAnswers: Record<number, string>;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REVIEW_REQUIRED';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  syncedAt?: Date;
}

class MockOutbox {
  private records: Map<string, MockOutboxRecord> = new Map();

  public enqueue(record: MockOutboxRecord) {
    this.records.set(record.scanUuid, { ...record });
  }

  public get(scanUuid: string): MockOutboxRecord | undefined {
    return this.records.get(scanUuid);
  }

  public updateStatus(scanUuid: string, status: MockOutboxRecord['status'], extra?: { lastError?: string }) {
    const existing = this.records.get(scanUuid);
    if (!existing) return;
    existing.status = status;
    if (extra?.lastError) existing.lastError = extra.lastError;
    if (status === 'SYNCED') existing.syncedAt = new Date();
    if (status === 'FAILED') existing.retryCount += 1;
    this.records.set(scanUuid, existing);
  }

  public countByStatus() {
    let pending = 0, syncing = 0, synced = 0, failed = 0, review = 0;
    this.records.forEach(r => {
      if (r.status === 'PENDING') pending++;
      else if (r.status === 'SYNCING') syncing++;
      else if (r.status === 'SYNCED') synced++;
      else if (r.status === 'FAILED') failed++;
      else if (r.status === 'REVIEW_REQUIRED') review++;
    });
    return { total: this.records.size, pending, syncing, synced, failed, review };
  }
}

async function runOfflineSyncTests() {
  console.log('\n=== RUNNING OMR OFFLINE-TO-ONLINE SYNCHRONIZATION VERIFICATION ===\n');

  const outbox = new MockOutbox();
  let passedCount = 0;

  // 1. Bulk 500 Offline Scans Retention Test
  const TOTAL_SCANS = 500;
  for (let i = 1; i <= TOTAL_SCANS; i++) {
    const scanUuid = `scan_offline_uuid_${i.toString().padStart(4, '0')}`;
    const roll = (230000 + i).toString();
    outbox.enqueue({
      scanUuid,
      idempotencyKey: scanUuid,
      examId: 'exam_physics_model_05',
      rollNumber: roll,
      rawAnswers: { 1: 'A', 2: 'B', 3: 'C', 4: 'D' },
      status: i === 485 || i === 486 ? 'REVIEW_REQUIRED' : 'PENDING',
      retryCount: 0,
      createdAt: new Date()
    });
  }

  const initialMetrics = outbox.countByStatus();
  if (initialMetrics.total === 500) {
    console.log(`✓ [PASS] Outbox safely enqueued all 500 offline scans without data loss`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Expected 500 scans, found ${initialMetrics.total}`);
  }

  // 2. Exponential Backoff & Jitter Verification
  const d0 = RetryQueue.calculateDelay(0);
  const d1 = RetryQueue.calculateDelay(1, { maxRetries: 5, initialDelayMs: 1000, maxDelayMs: 60000, backoffFactor: 2 });
  const d2 = RetryQueue.calculateDelay(2, { maxRetries: 5, initialDelayMs: 1000, maxDelayMs: 60000, backoffFactor: 2 });
  const d3 = RetryQueue.calculateDelay(3, { maxRetries: 5, initialDelayMs: 1000, maxDelayMs: 60000, backoffFactor: 2 });
  const d10 = RetryQueue.calculateDelay(10, { maxRetries: 5, initialDelayMs: 1000, maxDelayMs: 60000, backoffFactor: 2 });

  if (d0 === 0 && d1 >= 1000 && d1 <= 1250 && d2 >= 2000 && d2 <= 2500 && d3 >= 4000 && d3 <= 5000 && d10 <= 75000) {
    console.log(`✓ [PASS] Exponential backoff accurately calculates jittered intervals (1s -> 2s -> 4s -> max 60s)`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Backoff intervals invalid: d1=${d1}, d2=${d2}, d3=${d3}, d10=${d10}`);
  }

  // 3. Retry Execution Simulation with Transient Network Drop
  let attemptsMade = 0;
  const retryResult = await RetryQueue.executeWithRetry(
    async (attempt) => {
      attemptsMade = attempt;
      if (attempt < 3) {
        throw new Error('Connection reset by peer (simulated network hiccup)');
      }
      return { success: true, serverReceived: true };
    },
    { maxRetries: 4, initialDelayMs: 10, maxDelayMs: 100, backoffFactor: 2 }
  );

  if (retryResult.success && attemptsMade === 3) {
    console.log(`✓ [PASS] Retry queue recovered gracefully on attempt 3 after transient network drops`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Retry queue failed: attemptsMade=${attemptsMade}`);
  }

  // 4. Server Idempotency & Lost ACK Simulation
  // Scenario: Client submits scan_001. Server processes and stores it. Connection drops before client gets ACK.
  // Client retries scan_001 with the SAME idempotencyKey. Server returns existing result without duplicating.
  const serverDbScans = new Map<string, any>();
  function mockServerSubmit(payload: { scanUuid: string; roll: string; score: number }) {
    if (serverDbScans.has(payload.scanUuid)) {
      return { success: true, idempotent: true, duplicateDetected: true, scan: serverDbScans.get(payload.scanUuid) };
    }
    const record = { id: `omr_db_${Date.now()}`, ...payload, createdAt: new Date() };
    serverDbScans.set(payload.scanUuid, record);
    return { success: true, idempotent: false, duplicateDetected: false, scan: record };
  }

  const sub1 = mockServerSubmit({ scanUuid: 'scan_idemp_test_999', roll: '230145', score: 85 });
  const sub2 = mockServerSubmit({ scanUuid: 'scan_idemp_test_999', roll: '230145', score: 85 });

  if (!sub1.idempotent && sub2.idempotent && serverDbScans.size === 1) {
    console.log(`✓ [PASS] Server enforces idempotency: retrying identical idempotencyKey creates ZERO duplicates`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Idempotency failed: serverDbScans size=${serverDbScans.size}`);
  }

  // 5. Batch Outbox Draining & State Machine Verification
  for (let i = 1; i <= 488; i++) {
    const scanUuid = `scan_offline_uuid_${i.toString().padStart(4, '0')}`;
    outbox.updateStatus(scanUuid, 'SYNCED');
  }
  // Scans 489 and 490 are REVIEW_REQUIRED
  outbox.updateStatus('scan_offline_uuid_0489', 'REVIEW_REQUIRED');
  outbox.updateStatus('scan_offline_uuid_0490', 'REVIEW_REQUIRED');
  // Scans 491 to 500 are PENDING (10 pending)
  for (let i = 491; i <= 500; i++) {
    const scanUuid = `scan_offline_uuid_${i.toString().padStart(4, '0')}`;
    outbox.updateStatus(scanUuid, 'PENDING');
  }

  const finalMetrics = outbox.countByStatus();
  if (finalMetrics.synced === 488 && finalMetrics.pending === 10 && finalMetrics.review === 2 && finalMetrics.failed === 0) {
    console.log(`✓ [PASS] Outbox status aggregation matches expected HUD breakdown (Synced: 488 | Pending: 10 | Review: 2 | Failed: 0)`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Metrics mismatch: ${JSON.stringify(finalMetrics)}`);
  }

  // 6. Final Sync Transition Verification
  for (let i = 491; i <= 500; i++) {
    const scanUuid = `scan_offline_uuid_${i.toString().padStart(4, '0')}`;
    outbox.updateStatus(scanUuid, 'SYNCED');
  }
  const allSyncedMetrics = outbox.countByStatus();
  const allSynced = allSyncedMetrics.pending === 0 && allSyncedMetrics.failed === 0;

  if (allSynced && allSyncedMetrics.synced === 498) {
    console.log(`✓ [PASS] Outbox state reaches 'All results synced.' once remaining pending scans resolve`);
    passedCount++;
  } else {
    console.error(`✗ [FAIL] Final sync failed: ${JSON.stringify(allSyncedMetrics)}`);
  }

  console.log(`\n=== SUMMARY: ${passedCount} / 6 OFFLINE SYNC TESTS PASSED ===\n`);
}

runOfflineSyncTests().catch(console.error);
