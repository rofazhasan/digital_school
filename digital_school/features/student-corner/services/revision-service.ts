import db from '@/lib/db';
import { addDays, startOfDay, differenceInDays } from 'date-fns';
import { createChallenge } from './arena-service';
import { ChallengeCategory, ChallengePriority, ChallengeSource } from '@prisma/client';

export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,   // +1 day
  2: 3,   // +3 days
  3: 7,   // +7 days
  4: 14,  // +14 days
  5: 30,  // +30 days
};

export const ACTIVE_RECALL_METHODS = [
  { id: 'FEYNMAN', label: 'Feynman Technique', description: 'Explain core concept in plain language without jargon' },
  { id: 'BLURTING', label: 'Blurting Method', description: 'Quick closed-book brain dump of all recalled facts/formulas' },
  { id: 'FLASHCARD', label: 'Rapid-Fire Flashcard', description: 'High-speed active prompt-response retrieval' },
  { id: 'DERIVATION', label: 'Closed-Book Derivation', description: 'Step-by-step mathematical or physical derivation from scratch' },
  { id: 'FORMULA_RECONSTRUCTION', label: 'Formula Reconstruction', description: 'Derive and reconstruct formulas from fundamental laws' },
  { id: 'CONCEPT_EXPLANATION', label: 'Concept Teaching', description: 'Teach the concept to an imaginary peer or record a voice note' },
] as const;

export const VAULT_CATEGORIES = [
  { id: 'HIGH_YIELD', label: 'High Yield', color: '#6366f1' },
  { id: 'FORMULA', label: 'Formula Vault', color: '#06b6d4' },
  { id: 'REACTION', label: 'Chemical Reaction', color: '#10b981' },
  { id: 'DEFINITION', label: 'Core Definition', color: '#f59e0b' },
  { id: 'CONCEPT', label: 'Key Concept', color: '#8b5cf6' },
  { id: 'FLASHCARD', label: 'Active Flashcard', color: '#ec4899' },
  { id: 'MISTAKE_VAULT', label: 'Past Error Anchor', color: '#ef4444' },
  { id: 'EXAM_CRITICAL', label: 'Exam Critical', color: '#e11d48' },
] as const;

/**
 * Calculates retention percentage using an Ebbinghaus exponential decay model:
 * R(t) = 100 * exp(-t / S)
 * S (stability) is proportional to current interval * (confidence / 3)
 */
export function calculateRetentionRate(
  lastReviewedAt: Date | null,
  intervalDays: number,
  confidenceLevel: number = 3
): number {
  if (!lastReviewedAt) return 100;
  const elapsedDays = Math.max(0, differenceInDays(new Date(), new Date(lastReviewedAt)));
  const stability = Math.max(1, intervalDays * (Math.max(1, confidenceLevel) / 3));
  const retention = 100 * Math.exp(-elapsedDays / stability);
  return Math.min(100, Math.max(10, Math.round(retention)));
}

/**
 * Fetches all revision items for a student with dynamic retention calculation
 */
export async function getAllRevisionItems(
  studentProfileId: string,
  filter?: { vaultCategory?: string; leitnerBox?: number; search?: string }
) {
  const where: any = {
    studentProfileId,
    isArchived: false,
  };

  if (filter?.vaultCategory && filter.vaultCategory !== 'ALL') {
    where.vaultCategory = filter.vaultCategory;
  }

  if (filter?.leitnerBox && filter.leitnerBox > 0) {
    where.leitnerBox = filter.leitnerBox;
  }

  if (filter?.search?.trim()) {
    where.OR = [
      { title: { contains: filter.search.trim(), mode: 'insensitive' } },
      { content: { contains: filter.search.trim(), mode: 'insensitive' } },
    ];
  }

  const items = await db.spacedRevisionItem.findMany({
    where,
    orderBy: [{ nextReviewDate: 'asc' }, { createdAt: 'desc' }],
  });

  return items.map((item) => ({
    ...item,
    currentRetentionRate: calculateRetentionRate(item.lastReviewedAt, item.intervalDays, item.confidenceLevel),
    isDue: startOfDay(new Date(item.nextReviewDate)) <= startOfDay(new Date()),
  }));
}

/**
 * Retrieves due revision items for today's active recall
 */
export async function getDueRevisionItems(studentProfileId: string) {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const items = await db.spacedRevisionItem.findMany({
    where: {
      studentProfileId,
      isArchived: false,
      nextReviewDate: { lte: todayEnd },
    },
    orderBy: { leitnerBox: 'asc' },
  });

  return items.map((item) => ({
    ...item,
    currentRetentionRate: calculateRetentionRate(item.lastReviewedAt, item.intervalDays, item.confidenceLevel),
    isDue: true,
  }));
}

/**
 * Comprehensive dashboard stats for Leitner 5-Box and Active Recall
 */
export async function getRevisionDashboardStats(studentProfileId: string) {
  const today = startOfDay(new Date());
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [allItems, dueCount] = await Promise.all([
    db.spacedRevisionItem.findMany({
      where: { studentProfileId, isArchived: false },
      select: {
        id: true,
        leitnerBox: true,
        confidenceLevel: true,
        lastReviewedAt: true,
        intervalDays: true,
        vaultCategory: true,
        nextReviewDate: true,
      },
    }),
    db.spacedRevisionItem.count({
      where: {
        studentProfileId,
        isArchived: false,
        nextReviewDate: { lte: todayEnd },
      },
    }),
  ]);

  const boxCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRetention = 0;

  for (const item of allItems) {
    boxCounts[item.leitnerBox] = (boxCounts[item.leitnerBox] || 0) + 1;
    totalRetention += calculateRetentionRate(item.lastReviewedAt, item.intervalDays, item.confidenceLevel);
  }

  const averageRetention = allItems.length > 0 ? Math.round(totalRetention / allItems.length) : 100;
  const masteredCount = boxCounts[5] || 0;

  return {
    totalItems: allItems.length,
    dueTodayCount: dueCount,
    averageRetention,
    masteredCount,
    boxCounts,
  };
}

/**
 * Creates a new spaced revision item
 */
export async function createRevisionItem(
  studentProfileId: string,
  data: {
    title: string;
    content?: string;
    vaultCategory?: string;
    subjectId?: string;
    topicId?: string;
    leitnerBox?: number;
    confidenceLevel?: number;
  }
) {
  const box = Math.max(1, Math.min(5, data.leitnerBox || 1));
  const interval = LEITNER_INTERVALS[box] || 1;
  const nextReviewDate = addDays(startOfDay(new Date()), interval);

  return await db.spacedRevisionItem.create({
    data: {
      studentProfileId,
      title: data.title.trim(),
      content: data.content?.trim() || null,
      vaultCategory: data.vaultCategory || 'HIGH_YIELD',
      subjectId: data.subjectId || null,
      topicId: data.topicId || null,
      leitnerBox: box,
      intervalDays: interval,
      confidenceLevel: data.confidenceLevel || 3,
      retentionRate: 100,
      nextReviewDate,
    },
  });
}

/**
 * Records an active recall review session and moves item across Leitner boxes
 */
export async function recordReviewResult(
  studentProfileId: string,
  itemId: string,
  performance: 'FAILED' | 'HARD' | 'GOOD' | 'EASY',
  newConfidence?: number
) {
  const item = await db.spacedRevisionItem.findFirst({
    where: { id: itemId, studentProfileId },
  });

  if (!item) {
    throw new Error('Revision item not found.');
  }

  let nextBox = item.leitnerBox;

  switch (performance) {
    case 'FAILED':
      nextBox = 1; // Drop back to Box 1
      break;
    case 'HARD':
      nextBox = Math.max(1, item.leitnerBox - 1); // Step back 1 box
      break;
    case 'GOOD':
      nextBox = Math.min(5, item.leitnerBox + 1); // Advance 1 box
      break;
    case 'EASY':
      nextBox = Math.min(5, item.leitnerBox + 2); // Accelerate
      break;
  }

  const interval = LEITNER_INTERVALS[nextBox] || 1;
  const nextReviewDate = addDays(startOfDay(new Date()), interval);
  const confidence = newConfidence ?? (performance === 'FAILED' ? 1 : performance === 'EASY' ? 5 : item.confidenceLevel);

  return await db.spacedRevisionItem.update({
    where: { id: itemId },
    data: {
      leitnerBox: nextBox,
      intervalDays: interval,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
      nextReviewDate,
      confidenceLevel: confidence,
      retentionRate: 100,
    },
  });
}

/**
 * Connects a due revision item directly to Today's Arena as an active challenge
 */
export async function addRevisionToTodayArena(
  studentProfileId: string,
  itemId: string,
  activeRecallMethod: string = 'FEYNMAN',
  durationMinutes: number = 30
) {
  const item = await db.spacedRevisionItem.findFirst({
    where: { id: itemId, studentProfileId },
  });

  if (!item) {
    throw new Error('Revision item not found');
  }

  const methodObj = ACTIVE_RECALL_METHODS.find((m) => m.id === activeRecallMethod);
  const methodLabel = methodObj?.label || activeRecallMethod;

  const challenge = await createChallenge(studentProfileId, {
    date: new Date(),
    title: `Active Recall [${methodLabel}]: ${item.title}`,
    category: ChallengeCategory.REVISION,
    durationMinutes,
    priority: ChallengePriority.HIGH,
    notes: `Protocol: ${methodLabel}\nLeitner Box: ${item.leitnerBox}\nVault: ${item.vaultCategory}\n${item.content || ''}`.trim(),
    source: ChallengeSource.REVISION,
    sourceReferenceId: item.id,
    activeRecallMethod,
  });

  return challenge;
}
