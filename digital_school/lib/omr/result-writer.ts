/**
 * OMR Result Writer — Phase 3-A
 *
 * Called after an OMR scan is scored authoritatively on the server.
 * Writes/upserts a `Result` record in the existing production `results` table,
 * computing grade and percentage from the exam's marking rules.
 *
 * The Result is created with isPublished = false so teachers can review
 * before bulk-publishing from the Session Manager.
 */

import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Grade Scale — Bengali secondary/higher-secondary grading system (SSC/HSC)
// ---------------------------------------------------------------------------
export interface GradeEntry {
  grade: string;        // e.g. "A+"
  gradePoint: number;   // e.g. 5.00
  minPct: number;       // e.g. 80
}

const DEFAULT_GRADE_SCALE: GradeEntry[] = [
  { grade: 'A+', gradePoint: 5.00, minPct: 80 },
  { grade: 'A',  gradePoint: 4.00, minPct: 70 },
  { grade: 'A-', gradePoint: 3.50, minPct: 60 },
  { grade: 'B',  gradePoint: 3.00, minPct: 50 },
  { grade: 'C',  gradePoint: 2.00, minPct: 40 },
  { grade: 'D',  gradePoint: 1.00, minPct: 33 },
  { grade: 'F',  gradePoint: 0.00, minPct: 0  },
];

export function computeGrade(percentage: number, scale = DEFAULT_GRADE_SCALE): GradeEntry {
  for (const entry of scale) {
    if (percentage >= entry.minPct) return entry;
  }
  return scale[scale.length - 1]; // F
}

// ---------------------------------------------------------------------------
// Write OMR Result
// ---------------------------------------------------------------------------

export interface OMRResultWriterInput {
  scanId: string;           // OMRScan.id already stored in DB
  studentId: string;        // StudentProfile.id
  examId: string;
  totalScore: number;       // Authoritative score from server scorer
  maxScore: number;         // Maximum possible marks
  mcqMarks?: number;        // Defaults to totalScore (pure MCQ exam)
  cqMarks?: number;         // CQ/written component (0 for OMR-only)
  sqMarks?: number;
  comment?: string;
}

export interface OMRResultWriterOutput {
  resultId: string;
  isNew: boolean;
  grade: string;
  gradePoint: number;
  percentage: number;
  total: number;
  isPublished: boolean;
}

/**
 * Upserts a `Result` record for the given OMR scan.
 * - If a Result already exists for (studentId, examId), it is updated with the
 *   new OMR score (idempotent — safe to call multiple times).
 * - Grade and percentage are always recalculated from the current maxScore.
 * - isPublished remains false until a teacher explicitly publishes via Session Manager.
 */
export async function writeOMRResult(
  input: OMRResultWriterInput,
  prisma: PrismaClient
): Promise<OMRResultWriterOutput> {
  const {
    scanId,
    studentId,
    examId,
    totalScore,
    maxScore,
    mcqMarks,
    cqMarks = 0,
    sqMarks = 0,
    comment,
  } = input;

  const mcq = mcqMarks ?? totalScore;
  const total = mcq + cqMarks + sqMarks;
  const percentage = maxScore > 0 ? Math.round((total / maxScore) * 10000) / 100 : 0;
  const gradeEntry = computeGrade(percentage);

  // Fetch exam passMarks for comment generation
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { passMarks: true, name: true },
  });
  const passed = exam ? total >= exam.passMarks : percentage >= 33;
  const autoComment = comment ?? (passed ? 'Passed' : 'Failed');

  // Check if a Result already exists
  const existingResult = await prisma.result.findFirst({
    where: { studentId, examId },
    select: { id: true },
  });

  let resultId: string;
  let isNew = false;

  if (existingResult) {
    // Update existing Result with the fresh OMR score
    await prisma.result.update({
      where: { id: existingResult.id },
      data: {
        mcqMarks: mcq,
        cqMarks,
        sqMarks,
        total,
        grade: gradeEntry.grade,
        percentage,
        comment: autoComment,
        // Keep isPublished as-is — teacher controls publication
      },
    });
    resultId = existingResult.id;
  } else {
    // Create new Result record
    const created = await prisma.result.create({
      data: {
        studentId,
        examId,
        mcqMarks: mcq,
        cqMarks,
        sqMarks,
        total,
        grade: gradeEntry.grade,
        percentage,
        comment: autoComment,
        isPublished: false,
        // examSubmissionId is intentionally null for OMR-sourced results
      },
    });
    resultId = created.id;
    isNew = true;
  }

  // Store the omrScanId link if the Result model supports it
  // (Added via schema migration — graceful no-op if field not yet migrated)
  try {
    await (prisma as any).result.update({
      where: { id: resultId },
      data: { omrScanId: scanId },
    });
  } catch {
    // Field not yet in schema — safe to ignore during migration window
  }

  return {
    resultId,
    isNew,
    grade: gradeEntry.grade,
    gradePoint: gradeEntry.gradePoint,
    percentage,
    total,
    isPublished: false,
  };
}

/**
 * Bulk-publish all Results for a given scan session.
 * Sets isPublished = true, publishedAt = now() for all students in the session.
 * Returns the count of published results.
 */
export async function publishSessionResults(
  sessionId: string,
  prisma: PrismaClient
): Promise<number> {
  // Fetch all OMRScans for this session that have been approved
  const scans = await prisma.oMRScan.findMany({
    where: {
      scanSessionId: sessionId,
      status: { in: ['APPROVED', 'SYNCED'] },
      studentId: { not: null },
    },
    select: { studentId: true, examId: true },
  });

  if (scans.length === 0) return 0;

  const conditions = scans
    .filter((s) => s.studentId)
    .map((s) => ({ studentId: s.studentId as string, examId: s.examId }));

  // Batch update in chunks of 50
  let published = 0;
  for (const cond of conditions) {
    const updated = await prisma.result.updateMany({
      where: { studentId: cond.studentId, examId: cond.examId, isPublished: false },
      data: { isPublished: true, publishedAt: new Date() },
    });
    published += updated.count;
  }

  return published;
}
