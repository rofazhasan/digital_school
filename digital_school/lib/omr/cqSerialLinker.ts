/**
 * Detached CQ Top-Cover Blind-Grading Serial Linker (Part 1 ↔ Part 2)
 *
 * In official Bangladesh Board CQ exams, Part 1 (পরীক্ষার্থীর অংশ: Roll + Reg + Serial QR)
 * is cut along the perforation line before scripts go to examiners for blind grading.
 * Later, Part 2 (পরীক্ষকের অংশ: Obtained Marks + SAME Serial QR) is scanned separately.
 *
 * This store pairs Part 1 and Part 2 automatically by their shared cryptographic `serial`
 * in ANY order (Part 1 first then Part 2, or Part 2 first then Part 1), persisting in localStorage.
 */

export interface CqSerialPairRecord {
  serial: string;
  examId?: string;
  // From Part 1 (Student Strip)
  rollNumber?: string;
  registrationNo?: string;
  studentId?: string;
  studentName?: string;
  part1ScannedAt?: number;
  // From Part 2 (Examiner Marks Strip)
  obtainedMarksCQ?: number;
  headExaminerMarks?: number;
  examinerCode?: string;
  part2ScannedAt?: number;
}

const STORAGE_KEY = 'omr_cq_serial_linker_v1';
const memoryMap = new Map<string, CqSerialPairRecord>();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CqSerialPairRecord>;
      Object.entries(parsed).forEach(([k, v]) => memoryMap.set(k, v));
    }
  } catch {
    // ignore
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, CqSerialPairRecord> = {};
    memoryMap.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export function normalizeSerialKey(raw?: string | null): string {
  return String(raw || '').trim().toUpperCase();
}

export function registerCqPart1Student(input: {
  serial: string;
  examId?: string;
  rollNumber?: string;
  registrationNo?: string;
  studentId?: string;
  studentName?: string;
}): { record: CqSerialPairRecord; isPaired: boolean } {
  hydrate();
  const key = normalizeSerialKey(input.serial);
  const existing = memoryMap.get(key) || { serial: key };
  const next: CqSerialPairRecord = {
    ...existing,
    serial: key,
    examId: input.examId || existing.examId,
    rollNumber: input.rollNumber || existing.rollNumber,
    registrationNo: input.registrationNo || existing.registrationNo,
    studentId: input.studentId || existing.studentId,
    studentName: input.studentName || existing.studentName,
    part1ScannedAt: Date.now(),
  };
  memoryMap.set(key, next);
  persist();
  const isPaired = Boolean(next.rollNumber && next.obtainedMarksCQ !== undefined);
  return { record: next, isPaired };
}

export function registerCqPart2Marks(input: {
  serial: string;
  examId?: string;
  obtainedMarksCQ: number;
  headExaminerMarks?: number;
  examinerCode?: string;
}): { record: CqSerialPairRecord; isPaired: boolean } {
  hydrate();
  const key = normalizeSerialKey(input.serial);
  const existing = memoryMap.get(key) || { serial: key };
  const effectiveMarks =
    input.headExaminerMarks !== undefined && input.headExaminerMarks > 0
      ? input.headExaminerMarks
      : input.obtainedMarksCQ;
  const next: CqSerialPairRecord = {
    ...existing,
    serial: key,
    examId: input.examId || existing.examId,
    obtainedMarksCQ: effectiveMarks,
    headExaminerMarks: input.headExaminerMarks,
    examinerCode: input.examinerCode || existing.examinerCode,
    part2ScannedAt: Date.now(),
  };
  memoryMap.set(key, next);
  persist();
  const isPaired = Boolean(next.rollNumber && next.obtainedMarksCQ !== undefined);
  return { record: next, isPaired };
}

export function getCqSerialRecord(serial: string): CqSerialPairRecord | null {
  hydrate();
  return memoryMap.get(normalizeSerialKey(serial)) || null;
}

export function listCqSerialStats(): { total: number; paired: number; waitingPart2: number; waitingPart1: number } {
  hydrate();
  let paired = 0, waitingPart2 = 0, waitingPart1 = 0;
  memoryMap.forEach((r) => {
    const hasP1 = Boolean(r.rollNumber);
    const hasP2 = r.obtainedMarksCQ !== undefined;
    if (hasP1 && hasP2) paired++;
    else if (hasP1) waitingPart2++;
    else if (hasP2) waitingPart1++;
  });
  return { total: memoryMap.size, paired, waitingPart2, waitingPart1 };
}

export function clearCqSerialLinker(): void {
  memoryMap.clear();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
