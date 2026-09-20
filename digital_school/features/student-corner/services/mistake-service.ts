import db from '@/lib/db';
import { addDays, startOfDay } from 'date-fns';
import { createChallenge } from './arena-service';
import { ChallengeCategory, ChallengePriority, ChallengeSource } from '@prisma/client';

export const FALLACY_CATEGORIES = [
  { id: 'CALCULATION_TRAP', label: 'Calculation Trap', color: '#f59e0b', description: 'Arithmetic mistake, decimal slip, or algebraic flaw' },
  { id: 'FORMULA_CONFUSION', label: 'Formula Confusion', color: '#ef4444', description: 'Applied wrong formula or confused similar equations' },
  { id: 'MEMORY_SLIP', label: 'Memory Slip', color: '#8b5cf6', description: 'Temporary blackout or forgotten constant/definition' },
  { id: 'SPEED_RUSH', label: 'Speed Rush', color: '#ec4899', description: 'Rushed under exam pressure without complete solving' },
  { id: 'MISREADING', label: 'Misreading Question', color: '#06b6d4', description: 'Failed to note NOT, EXCEPT, or unit requirement' },
  { id: 'CONCEPT_GAP', label: 'Concept Gap', color: '#e11d48', description: 'Fundamental misunderstanding of core physics/math theorem' },
  { id: 'UNIT_ERROR', label: 'Unit Conversion Error', color: '#10b981', description: 'Omitted SI unit conversion or dimensional mismatch' },
  { id: 'SIGN_ERROR', label: 'Sign / Vector Error', color: '#6366f1', description: 'Incorrect sign (+/-) in work, energy, or vector direction' },
  { id: 'CARELESS_ERROR', label: 'Careless Slip', color: '#64748b', description: 'Bubbling error or copying wrong variable from step 1 to 2' },
  { id: 'LOGIC_ERROR', label: 'Flawed Logical Deduction', color: '#0284c7', description: 'Invalid reasoning path or unjustified assumption' },
] as const;

export interface CreateMistakeInput {
  errorNumber?: string;
  examCode?: string;
  subjectName: string;
  chapterName: string;
  questionDetails: string;
  fallacyCategory: string;
  rootCause: string;
  remedialRule: string;
  retestDaysOffset?: number; // default +3 days
  notes?: string;
}

/**
 * Retrieves all mistake records with search and filtering
 */
export async function getAllMistakes(
  studentProfileId: string,
  filter?: { isResolved?: boolean; subjectName?: string; fallacyCategory?: string; search?: string }
) {
  const where: any = { studentProfileId };

  if (typeof filter?.isResolved === 'boolean') {
    where.isResolved = filter.isResolved;
  }

  if (filter?.subjectName && filter.subjectName !== 'ALL') {
    where.subjectName = filter.subjectName;
  }

  if (filter?.fallacyCategory && filter.fallacyCategory !== 'ALL') {
    where.fallacyCategory = filter.fallacyCategory;
  }

  if (filter?.search?.trim()) {
    where.OR = [
      { questionDetails: { contains: filter.search.trim(), mode: 'insensitive' } },
      { rootCause: { contains: filter.search.trim(), mode: 'insensitive' } },
      { remedialRule: { contains: filter.search.trim(), mode: 'insensitive' } },
      { chapterName: { contains: filter.search.trim(), mode: 'insensitive' } },
      { errorNumber: { contains: filter.search.trim(), mode: 'insensitive' } },
    ];
  }

  return await db.mistakeRecord.findMany({
    where,
    orderBy: [{ isResolved: 'asc' }, { nextRetestDate: 'asc' }, { createdAt: 'desc' }],
  });
}

/**
 * Retrieves mistakes that are due for re-test today or overdue
 */
export async function getDueRetestMistakes(studentProfileId: string) {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return await db.mistakeRecord.findMany({
    where: {
      studentProfileId,
      isResolved: false,
      nextRetestDate: { lte: todayEnd },
    },
    orderBy: { nextRetestDate: 'asc' },
  });
}

/**
 * Creates a new mistake record and automatically schedules its remedial retest date
 */
export async function createMistakeRecord(studentProfileId: string, input: CreateMistakeInput) {
  // Generate incremental error number if not provided (e.g. E-01, E-02)
  let errNum = input.errorNumber?.trim();
  if (!errNum) {
    const count = await db.mistakeRecord.count({ where: { studentProfileId } });
    errNum = `E-${String(count + 1).padStart(2, '0')}`;
  }

  const offset = input.retestDaysOffset ?? 3; // Standard 3-day buffer before retesting
  const nextRetestDate = addDays(startOfDay(new Date()), offset);

  return await db.mistakeRecord.create({
    data: {
      studentProfileId,
      errorNumber: errNum,
      examCode: input.examCode?.trim() || null,
      subjectName: input.subjectName.trim(),
      chapterName: input.chapterName.trim(),
      questionDetails: input.questionDetails.trim(),
      fallacyCategory: input.fallacyCategory,
      rootCause: input.rootCause.trim(),
      remedialRule: input.remedialRule.trim(),
      nextRetestDate,
      isResolved: false,
      notes: input.notes?.trim() || null,
    },
  });
}

/**
 * Resolves a mistake after successful retest
 */
export async function resolveMistakeRetest(
  studentProfileId: string,
  mistakeId: string,
  retestScore?: number,
  notes?: string
) {
  return await db.mistakeRecord.update({
    where: { id: mistakeId },
    data: {
      isResolved: true,
      retestedAt: new Date(),
      retestScore: retestScore ?? 100,
      notes: notes ? `${notes}\n[Resolved on ${new Date().toLocaleDateString()}]` : undefined,
    },
  });
}

/**
 * Adds an error retest challenge directly to Today's Arena
 */
export async function addMistakeRetestToTodayArena(
  studentProfileId: string,
  mistakeId: string,
  durationMinutes: number = 30
) {
  const mistake = await db.mistakeRecord.findFirst({
    where: { id: mistakeId, studentProfileId },
  });

  if (!mistake) {
    throw new Error('Mistake record not found.');
  }

  const challenge = await createChallenge(studentProfileId, {
    date: new Date(),
    title: `Remedial Retest: [${mistake.errorNumber}] ${mistake.subjectName} — ${mistake.chapterName}`,
    category: ChallengeCategory.MISTAKE_RETEST,
    durationMinutes,
    priority: ChallengePriority.HIGH,
    notes: `Original Fallacy: ${mistake.fallacyCategory}\nRoot Cause: ${mistake.rootCause}\nRemedial Rule to Apply: ${mistake.remedialRule}\nProblem: ${mistake.questionDetails}`,
    source: ChallengeSource.MISTAKE_RETEST,
    sourceReferenceId: mistake.id,
  });

  return challenge;
}

/**
 * Computes Mistake Analytics (Fallacy distribution, subject error hotspots, resolution rate)
 */
export async function getMistakeAnalytics(studentProfileId: string) {
  const allMistakes = await db.mistakeRecord.findMany({
    where: { studentProfileId },
    select: {
      id: true,
      fallacyCategory: true,
      subjectName: true,
      isResolved: true,
      nextRetestDate: true,
    },
  });

  const totalErrors = allMistakes.length;
  const resolvedCount = allMistakes.filter((m) => m.isResolved).length;
  const unresolvedCount = totalErrors - resolvedCount;
  const resolutionRate = totalErrors > 0 ? Math.round((resolvedCount / totalErrors) * 100) : 100;

  // Fallacy category distribution
  const fallacyMap: Record<string, number> = {};
  for (const m of allMistakes) {
    fallacyMap[m.fallacyCategory] = (fallacyMap[m.fallacyCategory] || 0) + 1;
  }

  const topFallacies = Object.entries(fallacyMap)
    .map(([cat, count]) => ({
      category: cat,
      label: FALLACY_CATEGORIES.find((f) => f.id === cat)?.label || cat,
      count,
      percentage: Math.round((count / Math.max(1, totalErrors)) * 100),
      color: FALLACY_CATEGORIES.find((f) => f.id === cat)?.color || '#64748b',
    }))
    .sort((a, b) => b.count - a.count);

  // Subject error hotspots
  const subjectMap: Record<string, number> = {};
  for (const m of allMistakes) {
    subjectMap[m.subjectName] = (subjectMap[m.subjectName] || 0) + 1;
  }

  const subjectHotspots = Object.entries(subjectMap)
    .map(([subject, count]) => ({
      subject,
      count,
      percentage: Math.round((count / Math.max(1, totalErrors)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalErrors,
    resolvedCount,
    unresolvedCount,
    resolutionRate,
    topFallacies,
    subjectHotspots,
  };
}
