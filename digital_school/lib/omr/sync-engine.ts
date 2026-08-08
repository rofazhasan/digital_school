/**
 * OMR Offline Sync Engine
 * 
 * Manages background synchronization of offline OMR scans with server idempotency keys.
 */

import { db, OfflineScanRecord } from '../dexie-db';

export interface SyncResult {
  scanUuid: string;
  success: boolean;
  status: string;
  error?: string;
  serverScore?: number;
}

export class OMRSyncEngine {
  private static isSyncing = false;

  /**
   * Enqueues a new scan locally into IndexedDB with a unique idempotency key (scanUuid).
   */
  public static async saveScanLocally(scan: Omit<OfflineScanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfflineScanRecord> {
    const record: OfflineScanRecord = {
      ...scan,
      status: scan.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.scans.put(record);

    await db.syncEvents.put({
      idempotencyKey: record.scanUuid,
      scanUuid: record.scanUuid,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date()
    });

    return record;
  }

  /**
   * Syncs all pending local scans to the server.
   */
  public static async syncPendingScans(): Promise<SyncResult[]> {
    if (this.isSyncing) return [];
    this.isSyncing = true;

    const results: SyncResult[] = [];

    try {
      const pendingScans = await db.scans
        .where('status')
        .equals('PENDING')
        .toArray();

      for (const scan of pendingScans) {
        const res = await this.syncSingleScan(scan);
        results.push(res);
      }
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  /**
   * Syncs a single scan using its idempotency key.
   */
  public static async syncSingleScan(scan: OfflineScanRecord): Promise<SyncResult> {
    try {
      // Mark local state SYNCING
      await db.scans.update(scan.scanUuid, { status: 'SYNCING', updatedAt: new Date() });
      await db.syncEvents.update(scan.scanUuid, { status: 'SYNCING' });

      const response = await fetch('/api/omr/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': scan.scanUuid
        },
        body: JSON.stringify({
          scanUuid: scan.scanUuid,
          templateId: scan.templateId,
          templateVersion: scan.templateVersion,
          examId: scan.examId,
          examSetId: scan.examSetId,
          studentId: scan.studentId,
          rollNumber: scan.rollNumber,
          registrationNo: scan.registrationNo,
          detectedSet: scan.detectedSet,
          rawAnswers: scan.rawAnswers,
          confidenceScore: scan.confidenceScore,
          qualityScore: scan.qualityScore,
          scanSessionId: scan.scanSessionId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const finalStatus = data.reviewRequired ? 'REVIEW_REQUIRED' : 'SYNCED';

        await db.scans.update(scan.scanUuid, {
          status: finalStatus,
          totalScore: data.score?.totalScore,
          maxScore: data.score?.maxScore,
          evaluatedAnswers: data.score?.evaluatedAnswers,
          syncedAt: new Date(),
          updatedAt: new Date()
        });

        await db.syncEvents.update(scan.scanUuid, {
          status: 'SYNCED',
          syncedAt: new Date()
        });

        return {
          scanUuid: scan.scanUuid,
          success: true,
          status: finalStatus,
          serverScore: data.score?.totalScore
        };
      } else {
        const errorMsg = data.error || `HTTP ${response.status}`;
        await db.scans.update(scan.scanUuid, {
          status: 'FAILED',
          lastError: errorMsg,
          updatedAt: new Date()
        });

        await db.syncEvents.update(scan.scanUuid, {
          status: 'FAILED',
          lastError: errorMsg
        });

        return {
          scanUuid: scan.scanUuid,
          success: false,
          status: 'FAILED',
          error: errorMsg
        };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error';
      await db.scans.update(scan.scanUuid, {
        status: 'FAILED',
        lastError: errorMsg,
        updatedAt: new Date()
      });

      return {
        scanUuid: scan.scanUuid,
        success: false,
        status: 'FAILED',
        error: errorMsg
      };
    }
  }

  /**
   * Initializes automatic sync listeners on network online event.
   */
  public static initAutoSync(): () => void {
    const handleOnline = () => {
      OMRSyncEngine.syncPendingScans().catch(console.error);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }

    return () => {};
  }
}
