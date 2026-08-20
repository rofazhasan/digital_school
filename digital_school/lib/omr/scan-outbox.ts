/**
 * OMR Scan Outbox
 * 
 * Thread-safe persistent local storage in IndexedDB (Dexie).
 * Guaranteed: Never deletes unsynchronized scans.
 */

import { db, OfflineScanRecord, OfflineSyncEvent } from '../dexie-db';

export type OutboxScanStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REVIEW_REQUIRED';

export interface OutboxScanPayload {
  scanUuid: string;
  idempotencyKey: string;
  templateId: string;
  templateVersion: number;
  examId: string;
  examSetId?: string;
  studentId?: string;
  rollNumber?: string;
  registrationNo?: string;
  detectedSet?: string;
  rawAnswers: Record<number, string>;
  evaluatedAnswers?: any;
  totalScore?: number;
  maxScore?: number;
  confidenceScore: number;
  qualityScore: number;
  status: OutboxScanStatus;
  scanSessionId?: string;
  localCreatedAt?: Date;
}

export interface OutboxMetrics {
  total: number;
  synced: number;
  pending: number;
  review: number;
  failed: number;
  allSynced: boolean;
}

export class ScanOutbox {
  /**
   * Saves a new physical scan to the local outbox.
   * Enforces local idempotency and creates tracking sync event.
   */
  public static async enqueue(payload: OutboxScanPayload): Promise<OfflineScanRecord> {
    const now = new Date();
    const idempotencyKey = payload.idempotencyKey || payload.scanUuid;

    const record: OfflineScanRecord = {
      scanUuid: payload.scanUuid,
      templateId: payload.templateId,
      templateVersion: payload.templateVersion,
      examId: payload.examId,
      examSetId: payload.examSetId,
      studentId: payload.studentId,
      rollNumber: payload.rollNumber,
      registrationNo: payload.registrationNo,
      detectedSet: payload.detectedSet,
      rawAnswers: payload.rawAnswers,
      evaluatedAnswers: payload.evaluatedAnswers,
      totalScore: payload.totalScore,
      maxScore: payload.maxScore || 100,
      confidenceScore: payload.confidenceScore,
      qualityScore: payload.qualityScore,
      status: payload.status || 'PENDING',
      scanSessionId: payload.scanSessionId,
      createdAt: payload.localCreatedAt || now,
      updatedAt: now
    };

    // Save scan record
    await db.scans.put(record);

    // Save sync event
    await db.syncEvents.put({
      idempotencyKey,
      scanUuid: payload.scanUuid,
      status: payload.status === 'REVIEW_REQUIRED' ? 'PENDING' : (payload.status as any),
      retryCount: 0,
      createdAt: now
    });

    return record;
  }

  /**
   * Retrieves all unsynchronized scans (PENDING and FAILED).
   */
  public static async getPendingScans(): Promise<OfflineScanRecord[]> {
    return await db.scans
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .toArray();
  }

  /**
   * Retrieves a single scan by its scanUuid.
   */
  public static async getByUuid(scanUuid: string): Promise<OfflineScanRecord | undefined> {
    return await db.scans.where('scanUuid').equals(scanUuid).first();
  }

  /**
   * Updates scan sync status and server response metadata.
   */
  public static async updateStatus(
    scanUuid: string,
    status: OutboxScanStatus,
    extra?: {
      serverScore?: number;
      maxScore?: number;
      evaluatedAnswers?: any;
      lastError?: string;
      reviewRequired?: boolean;
    }
  ): Promise<void> {
    const now = new Date();

    const updateData: Partial<OfflineScanRecord> = {
      status,
      updatedAt: now
    };

    if (extra?.serverScore !== undefined) updateData.totalScore = extra.serverScore;
    if (extra?.maxScore !== undefined) updateData.maxScore = extra.maxScore;
    if (extra?.evaluatedAnswers !== undefined) updateData.evaluatedAnswers = extra.evaluatedAnswers;
    if (extra?.lastError !== undefined) updateData.lastError = extra.lastError;
    if (status === 'SYNCED') updateData.syncedAt = now;

    await db.scans.where('scanUuid').equals(scanUuid).modify(updateData);

    // Update sync event
    const syncEvent = await db.syncEvents.where('scanUuid').equals(scanUuid).first();
    if (syncEvent) {
      await db.syncEvents.where('scanUuid').equals(scanUuid).modify({
        status: status === 'REVIEW_REQUIRED' ? 'SYNCED' : (status as any),
        lastError: extra?.lastError,
        syncedAt: status === 'SYNCED' ? now : undefined,
        retryCount: status === 'FAILED' ? syncEvent.retryCount + 1 : syncEvent.retryCount
      });
    }
  }

  /**
   * Aggregates outbox synchronization metrics for the teacher HUD.
   */
  public static async getMetrics(): Promise<OutboxMetrics> {
    const allScans = await db.scans.toArray();
    const synced = allScans.filter(s => s.status === 'SYNCED').length;
    const pending = allScans.filter(s => s.status === 'PENDING' || s.status === 'SYNCING').length;
    const review = allScans.filter(s => s.status === 'REVIEW_REQUIRED').length;
    const failed = allScans.filter(s => s.status === 'FAILED').length;

    return {
      total: allScans.length,
      synced,
      pending,
      review,
      failed,
      allSynced: pending === 0 && failed === 0 && allScans.length > 0
    };
  }
}
