"use client";

import UniversalOMRScannerPage from '@/app/exams/omr-scan/page';

/**
 * Exam-Scoped OMR Scanner Route (`/exams/[id]/omr-scan`)
 * Shares the unified v3 Universal OMR Scanner Studio (auto-binding `[id]` via `useParams()`),
 * providing full visual HITL Quality Control, Offline IndexedDB crash recovery,
 * Off-Thread Worker QR decoding, CSV export, and Item Psychometrics.
 */
export default function ExamScopedOMRScannerPage() {
  return <UniversalOMRScannerPage />;
}
