import db from '@/lib/db';
import { differenceInDays, startOfDay, addDays } from 'date-fns';
import { createChallenge } from './arena-service';
import { ChallengeCategory, ChallengePriority, ChallengeSource } from '@prisma/client';
import { LEITNER_INTERVALS } from './revision-service';

export const MASTERY_STATUSES = [
  { id: 'NOT_STARTED', label: 'Not Started', color: '#94a3b8' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { id: 'REVIEW_NEEDED', label: 'Review Needed', color: '#f59e0b' },
  { id: 'SOLID', label: 'Solid', color: '#10b981' },
  { id: 'MASTERED', label: 'Mastered', color: '#6366f1' },
] as const;

/**
 * Calculates topic retention % based on Ebbinghaus exponential decay
 */
export function calculateTopicRetention(
  lastReviewedAt: Date | null,
  leitnerBox: number,
  confidenceLevel: number
): number {
  if (!lastReviewedAt) return 100;
  const elapsedDays = Math.max(0, differenceInDays(new Date(), new Date(lastReviewedAt)));
  const interval = LEITNER_INTERVALS[leitnerBox] || 1;
  const stability = Math.max(1, interval * (Math.max(1, confidenceLevel) / 3));
  const retention = 100 * Math.exp(-elapsedDays / stability);
  return Math.min(100, Math.max(15, Math.round(retention)));
}

/**
 * Retrieves the full subject & chapter syllabus matrix for a student
 */
export async function getSyllabusMatrix(
  studentProfileId: string,
  filter?: { subjectId?: string; paper?: string; masteryStatus?: string; search?: string }
) {
  const subjects = await db.studentCornerSubject.findMany({
    where: { studentProfileId },
    include: {
      topics: {
        orderBy: [{ paper: 'asc' }, { chapterNumber: 'asc' }, { name: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  });

  const matrix = subjects.map((subject) => {
    let filteredTopics = subject.topics;

    if (filter?.paper && filter.paper !== 'ALL') {
      filteredTopics = filteredTopics.filter((t) => t.paper === filter.paper);
    }
    if (filter?.masteryStatus && filter.masteryStatus !== 'ALL') {
      filteredTopics = filteredTopics.filter((t) => t.masteryStatus === filter.masteryStatus);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      filteredTopics = filteredTopics.filter((t) => t.name.toLowerCase().includes(q));
    }

    const topicsWithRetention = filteredTopics.map((topic) => {
      const retention = calculateTopicRetention(topic.lastReviewedAt, topic.leitnerBox, topic.confidenceLevel);
      const isDue = topic.nextReviewDate ? startOfDay(new Date(topic.nextReviewDate)) <= startOfDay(new Date()) : false;

      return {
        ...topic,
        currentRetentionRate: retention,
        isDue,
      };
    });

    const totalChapters = subject.topics.length;
    const theoryCompletedCount = subject.topics.filter((t) => t.theoryCompleted).length;
    const qbSolvedCount = subject.topics.filter((t) => t.qbSolved).length;
    const masteredCount = subject.topics.filter((t) => t.masteryStatus === 'MASTERED' || t.masteryStatus === 'SOLID').length;

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      totalChapters,
      theoryCompletedCount,
      qbSolvedCount,
      masteredCount,
      theoryProgressPercent: totalChapters > 0 ? Math.round((theoryCompletedCount / totalChapters) * 100) : 0,
      qbProgressPercent: totalChapters > 0 ? Math.round((qbSolvedCount / totalChapters) * 100) : 0,
      masteryPercent: totalChapters > 0 ? Math.round((masteredCount / totalChapters) * 100) : 0,
      topics: topicsWithRetention,
    };
  });

  return matrix;
}

/**
 * Updates a topic's syllabus progress (theory, QB, confidence, mastery)
 */
export async function updateTopicSyllabusProgress(
  studentProfileId: string,
  topicId: string,
  data: {
    theoryCompleted?: boolean;
    qbSolved?: boolean;
    confidenceLevel?: number; // 1..5
    masteryStatus?: string;
    leitnerBox?: number;
    paper?: string;
    chapterNumber?: number;
  }
) {
  // Verify ownership through subject relation
  const topic = await db.studentCornerTopic.findFirst({
    where: { id: topicId, subject: { studentProfileId } },
  });

  if (!topic) {
    throw new Error('Topic not found or access denied.');
  }

  // Determine intelligent mastery status if not manually set
  let status = data.masteryStatus ?? topic.masteryStatus;
  const theory = data.theoryCompleted ?? topic.theoryCompleted;
  const qb = data.qbSolved ?? topic.qbSolved;
  const conf = data.confidenceLevel ?? topic.confidenceLevel;

  if (!data.masteryStatus) {
    if (theory && qb && conf >= 4 && topic.reviewCount >= 2) {
      status = 'MASTERED';
    } else if (theory && qb && conf >= 3) {
      status = 'SOLID';
    } else if (theory || qb) {
      status = 'IN_PROGRESS';
    }
  }

  return await db.studentCornerTopic.update({
    where: { id: topicId },
    data: {
      theoryCompleted: theory,
      qbSolved: qb,
      confidenceLevel: conf,
      masteryStatus: status,
      leitnerBox: data.leitnerBox ?? topic.leitnerBox,
      paper: data.paper ?? topic.paper,
      chapterNumber: data.chapterNumber ?? topic.chapterNumber,
    },
  });
}

/**
 * Records a revision review on a syllabus chapter, advancing Leitner box and scheduling next review
 */
export async function recordChapterRevision(
  studentProfileId: string,
  topicId: string,
  performance: 'FAILED' | 'HARD' | 'GOOD' | 'EASY',
  newConfidence?: number
) {
  const topic = await db.studentCornerTopic.findFirst({
    where: { id: topicId, subject: { studentProfileId } },
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  let nextBox = topic.leitnerBox;
  switch (performance) {
    case 'FAILED':
      nextBox = 1;
      break;
    case 'HARD':
      nextBox = Math.max(1, topic.leitnerBox - 1);
      break;
    case 'GOOD':
      nextBox = Math.min(5, topic.leitnerBox + 1);
      break;
    case 'EASY':
      nextBox = Math.min(5, topic.leitnerBox + 2);
      break;
  }

  const interval = LEITNER_INTERVALS[nextBox] || 1;
  const nextReviewDate = addDays(startOfDay(new Date()), interval);
  const conf = newConfidence ?? (performance === 'FAILED' ? 1 : performance === 'EASY' ? 5 : topic.confidenceLevel);

  return await db.studentCornerTopic.update({
    where: { id: topicId },
    data: {
      leitnerBox: nextBox,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
      nextReviewDate,
      confidenceLevel: conf,
      retentionRate: 100,
    },
  });
}

/**
 * Connects a syllabus chapter revision directly to Today's Arena
 */
export async function addChapterToTodayArena(
  studentProfileId: string,
  topicId: string,
  durationMinutes: number = 45
) {
  const topic = await db.studentCornerTopic.findFirst({
    where: { id: topicId, subject: { studentProfileId } },
    include: { subject: true },
  });

  if (!topic) {
    throw new Error('Chapter not found');
  }

  const challenge = await createChallenge(studentProfileId, {
    date: new Date(),
    title: `Syllabus Revision: ${topic.subject.name} — ${topic.name}`,
    category: ChallengeCategory.REVISION,
    durationMinutes,
    priority: ChallengePriority.HIGH,
    notes: `Chapter: ${topic.name} (${topic.paper || 'Paper 1'})\nLeitner Box: ${topic.leitnerBox}\nConfidence: ${topic.confidenceLevel} / 5 Stars\nTheory: ${topic.theoryCompleted ? 'Done' : 'Pending'} | QB: ${topic.qbSolved ? 'Solved' : 'Pending'}`,
    subjectNames: [topic.subject.name],
    topicNames: [topic.name],
    source: ChallengeSource.REVISION,
    sourceReferenceId: topic.id,
  });

  return challenge;
}
