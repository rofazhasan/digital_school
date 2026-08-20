/**
 * OMR Sync Manager
 * 
 * Orchestrates outbox draining, exponential retry scheduling, network state listeners,
 * concurrency bounding, and real-time metric event broadcasts.
 */

import { ScanOutbox, OutboxMetrics, OutboxScanPayload } from './scan-outbox';
import { RetryQueue } from './retry-queue';
import { OfflineScanRecord } from '../dexie-db';

export interface SyncResponse {
  scanUuid: string;
  success: boolean;
  status: 'SYNCED' | 'REVIEW_REQUIRED' | 'FAILED';
  idempotent?: boolean;
  score?: number;
  error?: string;
}

export type MetricsListener = (metrics: OutboxMetrics) => void;

export class SyncManager {
  private static isSyncing = false;
  private static listeners: Set<MetricsListener> = new Set();
  private static maxConcurrency = 3;

  /**
   * Enqueues a new scan locally and attempts immediate background synchronization.
   */
  public static async recordScan(payload: OutboxScanPayload): Promise<OfflineScanRecord> {
    const record = await ScanOutbox.enqueue(payload);
    this.notifyListeners();

    // Trigger sync in background if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncPendingScans().catch(console.error);
    }

    return record;
  }

  /**
   * Registers a callback listener for outbox metrics changes.
   */
  public static subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener);
    this.getMetrics().then(listener).catch(console.error);
    return () => this.listeners.delete(listener);
  }

  /**
   * Broadcasts current metrics to all subscribers.
   */
  public static async notifyListeners(): Promise<void> {
    const metrics = await ScanOutbox.getMetrics();
    this.listeners.forEach(fn => fn(metrics));
  }

  /**
   * Returns current synchronization metrics.
   */
  public static async getMetrics(): Promise<OutboxMetrics> {
    return await ScanOutbox.getMetrics();
  }

  /**
   * Synchronizes all pending and failed scans in the outbox using bounded concurrency.
   */
  public static async syncPendingScans(): Promise<SyncResponse[]> {
    if (this.isSyncing) return [];
    this.isSyncing = true;

    const results: SyncResponse[] = [];

    try {
      const pending = await ScanOutbox.getPendingScans();
      if (pending.length === 0) {
        await this.notifyListeners();
        return [];
      }

      // Chunk processing into bounded batches
      for (let i = 0; i < pending.length; i += this.maxConcurrency) {
        const chunk = pending.slice(i, i + this.maxConcurrency);
        const chunkResults = await Promise.all(
          chunk.map(scan => this.syncSingleScanWithRetry(scan))
        );
        results.push(...chunkResults);
        await this.notifyListeners();
      }
    } finally {
      this.isSyncing = false;
      await this.notifyListeners();
    }

    return results;
  }

  /**
   * Synchronizes a single scan record with exponential backoff on transient errors.
   */
  public static async syncSingleScanWithRetry(scan: OfflineScanRecord): Promise<SyncResponse> {
    try {
      await ScanOutbox.updateStatus(scan.scanUuid, 'SYNCING');

      const result = await RetryQueue.executeWithRetry(
        async (attempt) => {
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
            return {
              scanUuid: scan.scanUuid,
              success: true,
              status: (data.reviewRequired ? 'REVIEW_REQUIRED' : 'SYNCED') as 'SYNCED' | 'REVIEW_REQUIRED',
              idempotent: data.idempotent,
              score: data.score?.totalScore
            };
          } else {
            const errorMsg = data.error || `HTTP ${response.status}`;
            // If 4xx client error (e.g. invalid exam), don't retry repeatedly
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              const err: any = new Error(errorMsg);
              err.isFatal = true;
              throw err;
            }
            throw new Error(errorMsg);
          }
        },
        { maxRetries: 3, initialDelayMs: 800, maxDelayMs: 15000, backoffFactor: 2 }
      );

      // Successfully synced or review required
      await ScanOutbox.updateStatus(scan.scanUuid, result.status, {
        serverScore: result.score,
        reviewRequired: result.status === 'REVIEW_REQUIRED'
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Sync failed';
      await ScanOutbox.updateStatus(scan.scanUuid, 'FAILED', { lastError: errorMsg });

      return {
        scanUuid: scan.scanUuid,
        success: false,
        status: 'FAILED',
        error: errorMsg
      };
    }
  }

  /**
   * Initializes automatic online/offline lifecycle listeners.
   */
  public static initAutoSync(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      this.syncPendingScans().catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }
}
