/**
 * Audit Trail & Provenance Logger — ROFAZ OMR Intelligence Engine
 * 
 * Records immutable diagnostic traces for every OMR scan submission
 * and tracks teacher manual overrides for complete result accountability.
 */

export interface ManualCorrectionEntry {
  questionNo: number;
  questionId?: string;
  originalAnswer: string | null;
  correctedAnswer: string | null;
  changedBy: string; // User/Teacher identifier
  changedAt: string; // ISO 8601
  reason?: string;
}

export interface ScanAuditRecord {
  scanId: string;
  scanSessionId?: string;
  examId: string;
  examSetId: string;
  studentId: string;
  roll: string;
  registration: string;
  templateVersion: string;
  engineVersion: string;
  deviceTier: string;
  timestamp: string;
  processingLatencyMs: number;
  qualityScore: number; // 0..100
  confidenceSummary: {
    overall: number;
    markers: number;
    qr: number;
    roll: number;
    registration: number;
    answersAvg: number;
    ambiguousCount: number;
    multipleCount: number;
  };
  manualCorrections: ManualCorrectionEntry[];
  validationStatus: 'VALID' | 'WARNINGS' | 'REVIEWED' | 'REJECTED';
}

export class AuditTrailManager {
  private static localAuditLog: ScanAuditRecord[] = [];

  /**
   * Records a complete scan audit event in local storage and in-memory log.
   */
  public static recordScanAudit(record: ScanAuditRecord): void {
    this.localAuditLog.push(record);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('ROFAZ_OMR_AUDIT_LOG');
        const list: ScanAuditRecord[] = stored ? JSON.parse(stored) : [];
        list.unshift(record);
        // Retain last 100 scans for local diagnostics
        if (list.length > 100) list.pop();
        localStorage.setItem('ROFAZ_OMR_AUDIT_LOG', JSON.stringify(list));
      } catch (err) {
        console.warn('Could not persist audit record to localStorage:', err);
      }
    }
  }

  /**
   * Retrieves recent audit records for inspection.
   */
  public static getRecentAudits(limit: number = 20): ScanAuditRecord[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('ROFAZ_OMR_AUDIT_LOG');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.slice(0, limit);
        }
      } catch (e) {
        // fallback
      }
    }
    return this.localAuditLog.slice(-limit).reverse();
  }
}
