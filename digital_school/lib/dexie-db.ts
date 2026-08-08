import Dexie, { Table } from 'dexie';

export interface LocalExam {
  id: string;
  title: string;
  templateJson: unknown;
  questionsJson: unknown;
  answerKeyJson?: unknown;
  downloadedAt: Date;
}

export interface OfflineStudent {
  id: string;
  roll: string;
  registrationNo: string;
  name: string;
  classId: string;
}

export interface OfflineTemplate {
  templateId: string;
  version: number;
  name: string;
  geometry: any;
}

export interface OfflineScanRecord {
  id?: number;
  scanUuid: string;             // Idempotency Key
  qrCode?: string;
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
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REVIEW_REQUIRED';
  scanSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  lastError?: string;
  imageBlobUrl?: string;
}

export interface OfflineSyncEvent {
  idempotencyKey: string;
  scanUuid: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  syncedAt?: Date;
  createdAt: Date;
}

export class OMRDatabase extends Dexie {
  exams!: Table<LocalExam>;
  templates!: Table<OfflineTemplate>;
  students!: Table<OfflineStudent>;
  scans!: Table<OfflineScanRecord>;
  syncEvents!: Table<OfflineSyncEvent>;

  constructor() {
    super('OMRScannerDB_V2');
    this.version(2).stores({
      exams: 'id, title',
      templates: 'templateId, version',
      students: 'id, roll, registrationNo',
      scans: '++id, scanUuid, examId, studentId, rollNumber, registrationNo, status, createdAt',
      syncEvents: 'idempotencyKey, scanUuid, status, createdAt'
    });
  }
}

export const db = new OMRDatabase();
