import db from '@/lib/db';
import {
  ChallengeCategory,
  ChallengePriority,
  ChallengeSource,
  ChallengeStatus,
  GoalStatus,
} from '@prisma/client';
import { addDays, startOfDay, differenceInDays, format } from 'date-fns';
import { LEITNER_INTERVALS, calculateRetentionRate } from './revision-service';
import { calculateStudentStreaks } from './streak-service';
import { calculateTopicRetention } from './syllabus-service';

export interface NextBestActionItem {
  id: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM';
  category: 'EXAM_PREP' | 'MISTAKE_RETEST' | 'REVISION' | 'GOAL_DEFICIT' | 'ARENA_TASK';
  title: string;
  subtitle: string;
  reason: string;
  estimatedMinutes: number;
  actionType: 'START_FOCUS' | 'ADD_TO_ARENA' | 'NAVIGATE' | 'EXECUTE_NOW';
  actionUrl: string;
  payload?: Record<string, any>;
}

export interface TopicHubDetails {
  topic: {
    id: string;
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    name: string;
    paper: string | null;
    chapterNumber: number | null;
    theoryCompleted: boolean;
    qbSolved: boolean;
    leitnerBox: number;
    reviewCount: number;
    lastReviewedAt: Date | null;
    nextReviewDate: Date | null;
    retentionRate: number;
    confidenceLevel: number;
    masteryStatus: string;
  };
  totalFocusMinutes: number;
  completedChallengesCount: number;
  activeChallengesCount: number;
  mistakes: {
    total: number;
    resolved: number;
    unresolved: number;
    items: Array<{
      id: string;
      errorNumber: string;
      fallacyCategory: string;
      rootCause: string;
      remedialRule: string;
      isResolved: boolean;
      nextRetestDate: Date | null;
    }>;
  };
  revisions: {
    total: number;
    dueCount: number;
    items: Array<{
      id: string;
      title: string;
      vaultCategory: string;
      leitnerBox: number;
      intervalDays: number;
      confidenceLevel: number;
      retentionRate: number;
      nextReviewDate: Date;
      isDue: boolean;
    }>;
  };
  upcomingExams: Array<{
    id: string;
    title: string;
    examDate: Date;
    daysRemaining: number;
    isLmsExam: boolean;
  }>;
}

export interface CrossFeatureSearchResult {
  topics: Array<{ id: string; name: string; subjectName: string; masteryStatus: string; url: string }>;
  revisions: Array<{ id: string; title: string; vaultCategory: string; leitnerBox: number; url: string }>;
  mistakes: Array<{ id: string; errorNumber: string; subjectName: string; fallacyCategory: string; isResolved: boolean; url: string }>;
  exams: Array<{ id: string; title: string; subject: string; examDate: Date; url: string }>;
  goals: Array<{ id: string; title: string; currentValue: number; targetValue: number; unit: string; url: string }>;
  arenaChallenges: Array<{ id: string; title: string; category: string; status: string; url: string }>;
}

/**
 * CENTRAL DOMAIN-EVENT DISPATCHER:
 * Called whenever an Arena challenge is marked COMPLETED.
 * Cascades consequences across:
 * 1. Mistake Lab (auto-resolves mistakes, logs scores)
 * 2. Spaced Revision & Syllabus (advances Leitner box, updates Ebbinghaus decay, topic retention)
 * 3. Goals (increments matching goals, alerts on milestones)
 * 4. Exam Preparation (advances syllabus coverage on upcoming exams)
 * 5. Streaks, Heatmap & Daily Arena totals
 */
export async function dispatchChallengeCompleted(
  studentProfileId: string,
  challengeId: string,
  actualMinutesSpent?: number
) {
  const challenge = await db.arenaChallenge.findFirst({
    where: { id: challengeId, studentProfileId },
    include: {
      subjects: { include: { subject: true } },
      topics: { include: { topic: true } },
      arena: true,
    },
  });

  if (!challenge) return;

  const now = new Date();
  const minutesToCredit = actualMinutesSpent ?? challenge.durationMinutes;

  // 1. MISTAKE LAB INTEGRATION
  if (challenge.source === ChallengeSource.MISTAKE_RETEST && challenge.sourceReferenceId) {
    await db.mistakeRecord.updateMany({
      where: { id: challenge.sourceReferenceId, studentProfileId },
      data: {
        isResolved: true,
        retestedAt: now,
        retestScore: 100,
        notes: `Retested & resolved via Arena Challenge "${challenge.title}" on ${format(now, 'yyyy-MM-dd HH:mm')}`,
      },
    });
  }

  // 2. SPACED REVISION ITEM INTEGRATION
  if (challenge.source === ChallengeSource.REVISION && challenge.sourceReferenceId) {
    // Check if sourceReferenceId refers to a SpacedRevisionItem
    const revItem = await db.spacedRevisionItem.findFirst({
      where: { id: challenge.sourceReferenceId, studentProfileId },
    });

    if (revItem) {
      const nextBox = Math.min(5, revItem.leitnerBox + 1);
      const interval = LEITNER_INTERVALS[nextBox] || 1;
      const nextReviewDate = addDays(startOfDay(now), interval);

      await db.spacedRevisionItem.update({
        where: { id: revItem.id },
        data: {
          leitnerBox: nextBox,
          intervalDays: interval,
          reviewCount: { increment: 1 },
          lastReviewedAt: now,
          nextReviewDate,
          retentionRate: 100,
          confidenceLevel: Math.min(5, revItem.confidenceLevel + 1),
        },
      });
    }

    // Check if sourceReferenceId refers to a StudentCornerTopic (Syllabus chapter revision)
    const syllabusTopic = await db.studentCornerTopic.findFirst({
      where: { id: challenge.sourceReferenceId, subject: { studentProfileId } },
    });

    if (syllabusTopic) {
      const nextBox = Math.min(5, syllabusTopic.leitnerBox + 1);
      const interval = LEITNER_INTERVALS[nextBox] || 1;
      const nextReviewDate = addDays(startOfDay(now), interval);
      const newConfidence = Math.min(5, syllabusTopic.confidenceLevel + 1);

      let mastery = syllabusTopic.masteryStatus;
      if (syllabusTopic.theoryCompleted && syllabusTopic.qbSolved && newConfidence >= 4) {
        mastery = 'MASTERED';
      } else if (syllabusTopic.theoryCompleted && syllabusTopic.qbSolved) {
        mastery = 'SOLID';
      }

      await db.studentCornerTopic.update({
        where: { id: syllabusTopic.id },
        data: {
          leitnerBox: nextBox,
          reviewCount: { increment: 1 },
          lastReviewedAt: now,
          nextReviewDate,
          confidenceLevel: newConfidence,
          retentionRate: 100,
          masteryStatus: mastery,
        },
      });
    }
  }

  // 3. TOPIC & SUBJECT PROGRESS FOR ANY LINKED TOPICS
  if (challenge.topics && challenge.topics.length > 0) {
    for (const topMap of challenge.topics) {
      const topic = topMap.topic;
      const newReviewCount = topic.reviewCount + 1;
      const newConfidence = Math.min(5, topic.confidenceLevel + 1);

      let newMastery = topic.masteryStatus;
      if (challenge.category === ChallengeCategory.REVISION) {
        if (topic.theoryCompleted && topic.qbSolved && newConfidence >= 4) {
          newMastery = 'MASTERED';
        } else if (topic.theoryCompleted && topic.qbSolved) {
          newMastery = 'SOLID';
        }
      }

      await db.studentCornerTopic.update({
        where: { id: topic.id },
        data: {
          reviewCount: newReviewCount,
          lastReviewedAt: now,
          retentionRate: 100,
          confidenceLevel: newConfidence,
          masteryStatus: newMastery,
        },
      });
    }
  }

  // 4. ACTIVE GOALS INTEGRATION
  const activeGoals = await db.studentGoal.findMany({
    where: {
      studentProfileId,
      status: GoalStatus.ACTIVE,
    },
  });

  const MILESTONES = [25, 50, 75, 100];

  for (const goal of activeGoals) {
    let shouldIncrement = false;
    let incrementAmount = 1;

    const goalCategory = (goal.category || '').toUpperCase().trim();
    const challengeCategory = challenge.category.toUpperCase().trim();

    if (goalCategory === challengeCategory) {
      shouldIncrement = true;
      if (goal.unit.toLowerCase().includes('hour')) {
        incrementAmount = Math.max(1, Math.round(minutesToCredit / 60));
      } else if (goal.unit.toLowerCase().includes('min')) {
        incrementAmount = minutesToCredit;
      } else {
        incrementAmount = 1;
      }
    } else if (!goal.category && (goal.unit.toLowerCase().includes('task') || goal.unit.toLowerCase().includes('challenge'))) {
      shouldIncrement = true;
      incrementAmount = 1;
    }

    if (shouldIncrement) {
      const newCurrent = goal.currentValue + incrementAmount;
      const progressPercent = Math.min(100, Math.round((newCurrent / goal.targetValue) * 100));
      const alreadyPassed = new Set(goal.milestonesPassed);
      const newlyPassed: number[] = [];

      for (const ms of MILESTONES) {
        if (progressPercent >= ms && !alreadyPassed.has(ms)) {
          newlyPassed.push(ms);
          alreadyPassed.add(ms);
        }
      }

      const isCompleted = progressPercent >= 100;

      await db.studentGoal.update({
        where: { id: goal.id },
        data: {
          currentValue: newCurrent,
          milestonesPassed: Array.from(alreadyPassed),
          status: isCompleted ? GoalStatus.COMPLETED : goal.status,
          completedAt: isCompleted ? now : goal.completedAt,
        },
      });

      if (newlyPassed.length > 0) {
        const highestMs = Math.max(...newlyPassed);
        await db.studentCornerNotification.create({
          data: {
            studentProfileId,
            title: highestMs === 100 ? '🎉 Goal Completed!' : `🎯 Milestone Reached: ${highestMs}%`,
            message: `Completed Arena task "${challenge.title}" advanced your goal "${goal.title}" to ${highestMs}%.`,
            type: 'MILESTONE',
            actionUrl: '/student/student-corner/goals',
          },
        });
      }
    }
  }

  // 5. EXAM PREPARATION SYNC
  if (challenge.source === ChallengeSource.EXAM_PREP && challenge.sourceReferenceId) {
    const exam = await db.personalExam.findFirst({
      where: { id: challenge.sourceReferenceId, studentProfileId },
    });

    if (exam && exam.preparationChecklist && Array.isArray(exam.preparationChecklist)) {
      const checklist = (exam.preparationChecklist as any[]).map((item: any) => {
        if (item.title === challenge.title || item.challengeId === challenge.id) {
          return { ...item, completed: true, completedAt: now.toISOString() };
        }
        return item;
      });

      await db.personalExam.update({
        where: { id: exam.id },
        data: { preparationChecklist: checklist },
      });
    }
  }

  // 6. STREAKS, HEATMAP ADHERENCE & AUDIT
  await calculateStudentStreaks(studentProfileId);
}

/**
 * REVERT DISPATCHER:
 * Called when a challenge is toggled back from COMPLETED to NOT_STARTED / IN_PROGRESS
 */
export async function dispatchChallengeReverted(
  studentProfileId: string,
  challengeId: string
) {
  const challenge = await db.arenaChallenge.findFirst({
    where: { id: challengeId, studentProfileId },
  });

  if (!challenge) return;

  // Revert mistake resolution if applicable
  if (challenge.source === ChallengeSource.MISTAKE_RETEST && challenge.sourceReferenceId) {
    await db.mistakeRecord.updateMany({
      where: { id: challenge.sourceReferenceId, studentProfileId },
      data: {
        isResolved: false,
        retestedAt: null,
        retestScore: null,
      },
    });
  }

  // Re-calculate streaks
  await calculateStudentStreaks(studentProfileId);
}

/**
 * DETERMINISTIC "NEXT BEST ACTION" ENGINE:
 * Answers: "What is the single most urgent, high-impact thing the student should do right now?"
 * Uses real domain data with zero LLM hallucinations:
 * 1. Proximity Exam with weak topics or mistake backlog (< 72h)
 * 2. Overdue or due mistake retests
 * 3. Spaced revision due today
 * 4. Active goals behind target daily pace
 * 5. High-priority Arena item remaining today
 */
export async function getNextBestActions(studentProfileId: string): Promise<NextBestActionItem[]> {
  const today = startOfDay(new Date());
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const actions: NextBestActionItem[] = [];

  // Query in parallel
  const [personalExams, dueMistakes, dueRevisions, activeGoals, todayArena] = await Promise.all([
    db.personalExam.findMany({
      where: {
        studentProfileId,
        isCompleted: false,
        examDate: { gte: today },
      },
      orderBy: { examDate: 'asc' },
      take: 3,
    }),
    db.mistakeRecord.findMany({
      where: {
        studentProfileId,
        isResolved: false,
        nextRetestDate: { lte: todayEnd },
      },
      orderBy: { nextRetestDate: 'asc' },
      take: 5,
    }),
    db.spacedRevisionItem.findMany({
      where: {
        studentProfileId,
        isArchived: false,
        nextReviewDate: { lte: todayEnd },
      },
      orderBy: [{ leitnerBox: 'asc' }, { nextReviewDate: 'asc' }],
      take: 5,
    }),
    db.studentGoal.findMany({
      where: {
        studentProfileId,
        status: GoalStatus.ACTIVE,
      },
      take: 3,
    }),
    db.dailyArena.findFirst({
      where: {
        studentProfileId,
        date: today,
      },
      include: {
        challenges: {
          where: { isArchived: false },
          orderBy: [{ priority: 'desc' }, { orderIndex: 'asc' }],
        },
      },
    }),
  ]);

  // PRIORITY 1: EXAM WITHIN 72 HOURS WITH PREPARATION NEEDED
  if (personalExams.length > 0) {
    const nextExam = personalExams[0];
    const daysRemaining = differenceInDays(new Date(nextExam.examDate), today);

    if (daysRemaining <= 3) {
      // Find weak topics for this subject
      const weakTopics = await db.studentCornerTopic.findMany({
        where: {
          subject: { studentProfileId, name: { contains: nextExam.subject, mode: 'insensitive' } },
          confidenceLevel: { lte: 2 },
        },
        take: 2,
      });

      const topicNote = weakTopics.length > 0
        ? `Focus on weak topics: ${weakTopics.map((t) => t.name).join(', ')}`
        : 'Review key formulas and active recall';

      actions.push({
        id: `action-exam-${nextExam.id}`,
        priority: 'URGENT',
        category: 'EXAM_PREP',
        title: `Exam Alert: ${nextExam.title} (${nextExam.subject})`,
        subtitle: daysRemaining === 0 ? 'Exam is scheduled for TODAY!' : `Exam is in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
        reason: topicNote,
        estimatedMinutes: 60,
        actionType: 'NAVIGATE',
        actionUrl: `/student/student-corner/exams`,
        payload: { examId: nextExam.id, subject: nextExam.subject },
      });
    }
  }

  // PRIORITY 2: DUE MISTAKE RETESTS (Remedial learning loop)
  if (dueMistakes.length > 0) {
    const topMistake = dueMistakes[0];
    actions.push({
      id: `action-mistake-${topMistake.id}`,
      priority: 'HIGH',
      category: 'MISTAKE_RETEST',
      title: `Retest Error [${topMistake.errorNumber}]: ${topMistake.subjectName} — ${topMistake.chapterName}`,
      subtitle: `Remedial Rule: "${topMistake.remedialRule}"`,
      reason: `Fallacy: ${topMistake.fallacyCategory.replace(/_/g, ' ')}. Scheduled retest is due today.`,
      estimatedMinutes: 30,
      actionType: 'ADD_TO_ARENA',
      actionUrl: `/student/student-corner/mistakes`,
      payload: { mistakeId: topMistake.id, type: 'MISTAKE_RETEST' },
    });
  }

  // PRIORITY 3: DUE SPACED REVISIONS (Leitner active recall)
  if (dueRevisions.length > 0) {
    const topRev = dueRevisions[0];
    actions.push({
      id: `action-rev-${topRev.id}`,
      priority: 'HIGH',
      category: 'REVISION',
      title: `Active Recall: ${topRev.title}`,
      subtitle: `Leitner Box ${topRev.leitnerBox} • Vault: ${topRev.vaultCategory}`,
      reason: `Ebbinghaus memory curve reached review threshold. Recall before decay sets in.`,
      estimatedMinutes: 25,
      actionType: 'START_FOCUS',
      actionUrl: `/student/student-corner/revision`,
      payload: { revisionId: topRev.id, type: 'REVISION' },
    });
  }

  // PRIORITY 4: TODAY'S ARENA PENDING CRITICAL TASKS
  if (todayArena && todayArena.challenges.length > 0) {
    const uncompleted = todayArena.challenges.filter((c) => c.status !== ChallengeStatus.COMPLETED);
    const critical = uncompleted.find((c) => c.priority === ChallengePriority.URGENT || c.priority === ChallengePriority.HIGH);
    const target = critical || uncompleted[0];

    if (target) {
      actions.push({
        id: `action-arena-${target.id}`,
        priority: target.priority === ChallengePriority.URGENT ? 'URGENT' : 'MEDIUM',
        category: 'ARENA_TASK',
        title: `Execute Arena Mission: ${target.title}`,
        subtitle: `${target.durationMinutes} min • Priority: ${target.priority}`,
        reason: `Part of your committed daily plan. Focus and execute.`,
        estimatedMinutes: target.durationMinutes,
        actionType: 'START_FOCUS',
        actionUrl: `/student/student-corner/focus?challengeId=${target.id}`,
        payload: { challengeId: target.id },
      });
    }
  }

  // PRIORITY 5: GOAL DEFICIT
  for (const goal of activeGoals) {
    const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
    if (progress < 60) {
      actions.push({
        id: `action-goal-${goal.id}`,
        priority: 'MEDIUM',
        category: 'GOAL_DEFICIT',
        title: `Advance Goal: ${goal.title}`,
        subtitle: `${goal.currentValue} / ${goal.targetValue} ${goal.unit} (${progress}% achieved)`,
        reason: `Keep consistent pacing towards your target milestone.`,
        estimatedMinutes: 45,
        actionType: 'NAVIGATE',
        actionUrl: `/student/student-corner/goals`,
        payload: { goalId: goal.id },
      });
      break;
    }
  }

  return actions.slice(0, 3);
}

/**
 * TOPIC MINI-HUB AGGREGATION:
 * Cross-references a single topic across Syllabus, Focus, Mistakes, Revision, and Exams
 */
export async function getTopicHubDetails(studentProfileId: string, topicId: string): Promise<TopicHubDetails> {
  const topic = await db.studentCornerTopic.findFirst({
    where: { id: topicId, subject: { studentProfileId } },
    include: { subject: true },
  });

  if (!topic) {
    throw new Error('Topic not found or unauthorized.');
  }

  const today = startOfDay(new Date());

  // Aggregate connected entities in parallel
  const [completedChallenges, activeChallengesCount, mistakes, revisions, personalExams] = await Promise.all([
    db.arenaChallenge.findMany({
      where: {
        studentProfileId,
        status: ChallengeStatus.COMPLETED,
        topics: { some: { topicId } },
      },
      select: { actualMinutesSpent: true },
    }),
    db.arenaChallenge.count({
      where: {
        studentProfileId,
        status: { not: ChallengeStatus.COMPLETED },
        isArchived: false,
        topics: { some: { topicId } },
      },
    }),
    db.mistakeRecord.findMany({
      where: {
        studentProfileId,
        chapterName: { contains: topic.name, mode: 'insensitive' },
      },
      orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
    }),
    db.spacedRevisionItem.findMany({
      where: {
        studentProfileId,
        isArchived: false,
        OR: [
          { topicId: topic.id },
          { title: { contains: topic.name, mode: 'insensitive' } },
        ],
      },
      orderBy: { nextReviewDate: 'asc' },
    }),
    db.personalExam.findMany({
      where: {
        studentProfileId,
        isCompleted: false,
        subject: { contains: topic.subject.name, mode: 'insensitive' },
        examDate: { gte: today },
      },
      orderBy: { examDate: 'asc' },
    }),
  ]);

  const totalFocusMinutes = completedChallenges.reduce((acc, c) => acc + c.actualMinutesSpent, 0);
  const resolvedMistakesCount = mistakes.filter((m) => m.isResolved).length;
  const unresolvedMistakesCount = mistakes.length - resolvedMistakesCount;

  const currentRetention = calculateTopicRetention(
    topic.lastReviewedAt,
    topic.leitnerBox,
    topic.confidenceLevel
  );

  return {
    topic: {
      id: topic.id,
      subjectId: topic.subjectId,
      subjectName: topic.subject.name,
      subjectColor: topic.subject.color,
      name: topic.name,
      paper: topic.paper,
      chapterNumber: topic.chapterNumber,
      theoryCompleted: topic.theoryCompleted,
      qbSolved: topic.qbSolved,
      leitnerBox: topic.leitnerBox,
      reviewCount: topic.reviewCount,
      lastReviewedAt: topic.lastReviewedAt,
      nextReviewDate: topic.nextReviewDate,
      retentionRate: currentRetention,
      confidenceLevel: topic.confidenceLevel,
      masteryStatus: topic.masteryStatus,
    },
    totalFocusMinutes,
    completedChallengesCount: completedChallenges.length,
    activeChallengesCount,
    mistakes: {
      total: mistakes.length,
      resolved: resolvedMistakesCount,
      unresolved: unresolvedMistakesCount,
      items: mistakes.map((m) => ({
        id: m.id,
        errorNumber: m.errorNumber,
        fallacyCategory: m.fallacyCategory,
        rootCause: m.rootCause,
        remedialRule: m.remedialRule,
        isResolved: m.isResolved,
        nextRetestDate: m.nextRetestDate,
      })),
    },
    revisions: {
      total: revisions.length,
      dueCount: revisions.filter((r) => startOfDay(new Date(r.nextReviewDate)) <= today).length,
      items: revisions.map((r) => ({
        id: r.id,
        title: r.title,
        vaultCategory: r.vaultCategory,
        leitnerBox: r.leitnerBox,
        intervalDays: r.intervalDays,
        confidenceLevel: r.confidenceLevel,
        retentionRate: calculateRetentionRate(r.lastReviewedAt, r.intervalDays, r.confidenceLevel),
        nextReviewDate: r.nextReviewDate,
        isDue: startOfDay(new Date(r.nextReviewDate)) <= today,
      })),
    },
    upcomingExams: personalExams.map((e) => ({
      id: e.id,
      title: e.title,
      examDate: e.examDate,
      daysRemaining: Math.max(0, differenceInDays(new Date(e.examDate), today)),
      isLmsExam: false,
    })),
  };
}

/**
 * CROSS-FEATURE GLOBAL SEARCH:
 * Multi-domain search query across Topics, Revisions, Mistakes, Exams, Goals, and Arena
 */
export async function crossFeatureSearch(
  studentProfileId: string,
  rawQuery: string
): Promise<CrossFeatureSearchResult> {
  const query = rawQuery.trim();
  if (!query) {
    return { topics: [], revisions: [], mistakes: [], exams: [], goals: [], arenaChallenges: [] };
  }

  const [topics, revisions, mistakes, exams, goals, challenges] = await Promise.all([
    db.studentCornerTopic.findMany({
      where: {
        subject: { studentProfileId },
        name: { contains: query, mode: 'insensitive' },
      },
      include: { subject: true },
      take: 6,
    }),
    db.spacedRevisionItem.findMany({
      where: {
        studentProfileId,
        isArchived: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 6,
    }),
    db.mistakeRecord.findMany({
      where: {
        studentProfileId,
        OR: [
          { errorNumber: { contains: query, mode: 'insensitive' } },
          { subjectName: { contains: query, mode: 'insensitive' } },
          { chapterName: { contains: query, mode: 'insensitive' } },
          { questionDetails: { contains: query, mode: 'insensitive' } },
          { remedialRule: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 6,
    }),
    db.personalExam.findMany({
      where: {
        studentProfileId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 6,
    }),
    db.studentGoal.findMany({
      where: {
        studentProfileId,
        title: { contains: query, mode: 'insensitive' },
      },
      take: 4,
    }),
    db.arenaChallenge.findMany({
      where: {
        studentProfileId,
        isArchived: false,
        title: { contains: query, mode: 'insensitive' },
      },
      take: 6,
    }),
  ]);

  return {
    topics: topics.map((t) => ({
      id: t.id,
      name: t.name,
      subjectName: t.subject.name,
      masteryStatus: t.masteryStatus,
      url: `/student/student-corner/syllabus?topicId=${t.id}`,
    })),
    revisions: revisions.map((r) => ({
      id: r.id,
      title: r.title,
      vaultCategory: r.vaultCategory,
      leitnerBox: r.leitnerBox,
      url: `/student/student-corner/revision?itemId=${r.id}`,
    })),
    mistakes: mistakes.map((m) => ({
      id: m.id,
      errorNumber: m.errorNumber,
      subjectName: m.subjectName,
      fallacyCategory: m.fallacyCategory,
      isResolved: m.isResolved,
      url: `/student/student-corner/mistakes?mistakeId=${m.id}`,
    })),
    exams: exams.map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      examDate: e.examDate,
      url: `/student/student-corner/exams`,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      unit: g.unit,
      url: `/student/student-corner/goals`,
    })),
    arenaChallenges: challenges.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      status: c.status,
      url: `/student/student-corner/arena`,
    })),
  };
}

/**
 * EXAM PREPARATION TASK GENERATOR:
 * Curates structured preparation challenges into Today's Arena linked to an exam and topics
 */
export async function generateExamPreparationTasks(
  studentProfileId: string,
  examId: string,
  topicIds: string[]
) {
  const exam = await db.personalExam.findFirst({
    where: { id: examId, studentProfileId },
  });

  if (!exam) {
    throw new Error('Exam not found or unauthorized.');
  }

  const topics = await db.studentCornerTopic.findMany({
    where: { id: { in: topicIds }, subject: { studentProfileId } },
    include: { subject: true },
  });

  const { createChallenge } = await import('./arena-service');
  const createdChallenges = [];

  for (const topic of topics) {
    const challenge = await createChallenge(studentProfileId, {
      date: new Date(),
      title: `Exam Prep [${exam.title}]: ${topic.name}`,
      category: ChallengeCategory.EXAM_PREP,
      durationMinutes: 45,
      priority: ChallengePriority.HIGH,
      notes: `Target Exam: ${exam.title} (${exam.subject})\nTopic: ${topic.name}\nConfidence: ${topic.confidenceLevel}/5\nLeitner Box: ${topic.leitnerBox}`,
      subjectNames: [topic.subject.name],
      topicNames: [topic.name],
      source: ChallengeSource.EXAM_PREP,
      sourceReferenceId: exam.id,
    });
    createdChallenges.push(challenge);
  }

  return createdChallenges;
}
