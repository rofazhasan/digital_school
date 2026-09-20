import db from '@/lib/db';
import {
  HeatmapDayData,
  HeatmapMetricType,
  MultiMetricHeatmapData,
  TodayScoreDetails,
  PlanVsRealityItem,
  EstimationAccuracyData,
  PeakProductivityWindow,
  DaySummaryCalculation,
} from '../types';
import { startOfYear, endOfYear, format, subDays, startOfDay } from 'date-fns';
import { ChallengeStatus, DayMode } from '@prisma/client';

/**
 * Aggregates 365-day activity for the GitHub-style consistency heatmap with multi-metric support.
 * Uses selective column projection and SQL-compatible aggregation.
 */
export async function getMultiMetricHeatmapData(
  studentProfileId: string,
  metric: HeatmapMetricType = 'COMPLETION',
  targetYear: number = new Date().getFullYear()
): Promise<MultiMetricHeatmapData[]> {
  const startDate = startOfYear(new Date(targetYear, 0, 1));
  const endDate = endOfYear(new Date(targetYear, 11, 31));

  // Fetch only necessary summary columns from daily_arenas
  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      totalCount: true,
      completedCount: true,
      totalCompletedMinutes: true,
      totalPlannedMinutes: true,
    },
  });

  // Fetch category breakdowns for study/coding metrics
  const categoryAggregates = await db.arenaChallenge.groupBy({
    by: ['completedAt', 'category'],
    where: {
      studentProfileId,
      status: 'COMPLETED',
      completedAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
    _sum: { actualMinutesSpent: true },
  });

  const categoryMap = new Map<string, { studyMinutes: number; codingMinutes: number }>();
  for (const row of categoryAggregates) {
    if (!row.completedAt) continue;
    const dateKey = format(new Date(row.completedAt), 'yyyy-MM-dd');
    const existing = categoryMap.get(dateKey) || { studyMinutes: 0, codingMinutes: 0 };

    if (row.category === 'STUDY' || row.category === 'REVISION' || row.category === 'EXAM_PREP') {
      existing.studyMinutes += row._sum.actualMinutesSpent || 0;
    } else if (row.category === 'CODING') {
      existing.codingMinutes += row._sum.actualMinutesSpent || 0;
    }
    categoryMap.set(dateKey, existing);
  }

  const arenaMap = new Map<string, typeof arenas[0]>();
  for (const arena of arenas) {
    const key = format(new Date(arena.date), 'yyyy-MM-dd');
    arenaMap.set(key, arena);
  }

  // Generate full calendar year days
  const result: MultiMetricHeatmapData[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const dateKey = format(curr, 'yyyy-MM-dd');
    const arena = arenaMap.get(dateKey);
    const catData = categoryMap.get(dateKey) || { studyMinutes: 0, codingMinutes: 0 };

    const totalChallenges = arena?.totalCount || 0;
    const completedChallenges = arena?.completedCount || 0;
    const focusMinutes = arena?.totalCompletedMinutes || 0;
    const studyMinutes = catData.studyMinutes;
    const codingMinutes = catData.codingMinutes;
    const completionRate =
      totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

    let value = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    switch (metric) {
      case 'FOCUS':
        value = focusMinutes;
        if (value >= 180) level = 4;
        else if (value >= 120) level = 3;
        else if (value >= 60) level = 2;
        else if (value > 0) level = 1;
        break;
      case 'STUDY':
        value = studyMinutes;
        if (value >= 150) level = 4;
        else if (value >= 90) level = 3;
        else if (value >= 45) level = 2;
        else if (value > 0) level = 1;
        break;
      case 'CODING':
        value = codingMinutes;
        if (value >= 120) level = 4;
        else if (value >= 60) level = 3;
        else if (value >= 30) level = 2;
        else if (value > 0) level = 1;
        break;
      case 'CHALLENGES':
        value = completedChallenges;
        if (value >= 6) level = 4;
        else if (value >= 4) level = 3;
        else if (value >= 2) level = 2;
        else if (value > 0) level = 1;
        break;
      case 'COMPLETION':
      default:
        value = completionRate;
        if (completedChallenges > 0) {
          if (completionRate >= 80) level = 4;
          else if (completionRate >= 50) level = 3;
          else if (completionRate >= 25) level = 2;
          else level = 1;
        }
        break;
    }

    result.push({
      date: dateKey,
      value,
      level,
      totalChallenges,
      completedChallenges,
      focusMinutes,
      studyMinutes,
      codingMinutes,
      completionRate,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

/**
 * Backward-compatible wrapper for heatmap data
 */
export async function getHeatmapData(
  studentProfileId: string,
  targetYear: number = new Date().getFullYear()
): Promise<HeatmapDayData[]> {
  const data = await getMultiMetricHeatmapData(studentProfileId, 'COMPLETION', targetYear);
  return data.map((d) => ({
    date: d.date,
    count: d.totalChallenges,
    completedCount: d.completedChallenges,
    focusMinutes: d.focusMinutes,
    completionRate: d.completionRate,
    level: d.level,
  }));
}

/**
 * Calculates transparent deterministic "Today Score" (0 - 100)
 */
export async function calculateTodayScore(studentProfileId: string): Promise<TodayScoreDetails> {
  const today = startOfDay(new Date());

  const [arena, profile] = await Promise.all([
    db.dailyArena.findUnique({
      where: {
        studentProfileId_date: {
          studentProfileId,
          date: today,
        },
      },
      include: {
        challenges: {
          select: { priority: true, status: true, category: true, source: true },
        },
      },
    }),
    db.studentCornerProfile.findUnique({
      where: { studentProfileId },
      select: { dailyGoalMinutes: true },
    }),
  ]);

  const totalChallenges = arena?.challenges?.length || 0;
  const completedChallenges =
    arena?.challenges?.filter((c) => c.status === 'COMPLETED').length || 0;
  const completionPercentage =
    totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  const focusMinutesLogged = arena?.totalCompletedMinutes || 0;
  const focusTargetMinutes = profile?.dailyGoalMinutes || 240;

  const criticalTasks = arena?.challenges?.filter(
    (c) => c.priority === 'HIGH' || c.priority === 'URGENT'
  ) || [];
  const criticalTasksTotal = criticalTasks.length;
  const criticalTasksCompleted = criticalTasks.filter((c) => c.status === 'COMPLETED').length;

  // Weightings: 50% challenge completion + 30% focus adherence + 20% critical tasks
  const completionComponent = Math.round(completionPercentage * 0.5);
  const focusAdherence =
    focusTargetMinutes > 0
      ? Math.min(100, Math.round((focusMinutesLogged / focusTargetMinutes) * 100))
      : 100;
  const focusComponent = Math.round(focusAdherence * 0.3);
  const criticalRate =
    criticalTasksTotal > 0
      ? Math.round((criticalTasksCompleted / criticalTasksTotal) * 100)
      : 100;
  const criticalComponent = Math.round(criticalRate * 0.2);

  const score = Math.min(100, completionComponent + focusComponent + criticalComponent);

  // 4-Pillar Daily Core Standard (1.00 Point win rate from 105D Challenge & Golden Pillars)
  const completedList = arena?.challenges?.filter((c) => c.status === 'COMPLETED') || [];
  const hasStudy = completedList.some((c) =>
    ['STUDY', 'CODING', 'ASSIGNMENT'].includes(c.category)
  );
  const hasRecall = completedList.some((c) =>
    c.category === 'REVISION' || c.source === 'REVISION'
  );
  const hasExam = completedList.some((c) =>
    c.category === 'EXAM_PREP' || c.category === 'MISTAKE_RETEST' || c.source === 'MISTAKE_RETEST'
  );
  const hasLifestyle = completedList.some((c) =>
    ['SALAT', 'HABIT', 'DIET', 'QURAN', 'EXERCISE'].includes(c.category)
  );

  let corePoints = 0;
  if (hasStudy) corePoints += 0.25;
  if (hasRecall) corePoints += 0.25;
  if (hasExam) corePoints += 0.25;
  if (hasLifestyle) corePoints += 0.25;

  return {
    score,
    totalChallenges,
    completedChallenges,
    completionPercentage,
    focusMinutesLogged,
    focusTargetMinutes,
    criticalTasksTotal,
    criticalTasksCompleted,
    calculationBreakdown: {
      completionComponent,
      focusComponent,
      criticalComponent,
    },
    coreStandardScore: Number(corePoints.toFixed(2)),
    coreStandardPillars: {
      study: hasStudy,
      recall: hasRecall,
      exam: hasExam,
      lifestyle: hasLifestyle,
    },
  };
}

/**
 * Calculates Plan vs Reality and Estimation Bias
 */
export async function getPlanVsReality(
  studentProfileId: string,
  days = 14
): Promise<{ items: PlanVsRealityItem[]; estimation: EstimationAccuracyData }> {
  const startDate = subDays(startOfDay(new Date()), days);

  const challenges = await db.arenaChallenge.findMany({
    where: {
      studentProfileId,
      createdAt: { gte: startDate },
    },
    select: {
      category: true,
      durationMinutes: true,
      actualMinutesSpent: true,
      status: true,
    },
  });

  const categoryMap: Record<
    string,
    { planned: number; actual: number; total: number; completed: number }
  > = {};

  let totalEstimated = 0;
  let totalActual = 0;

  for (const c of challenges) {
    const cat = c.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { planned: 0, actual: 0, total: 0, completed: 0 };
    }
    categoryMap[cat].planned += c.durationMinutes;
    categoryMap[cat].actual += c.actualMinutesSpent;
    categoryMap[cat].total += 1;
    if (c.status === 'COMPLETED') {
      categoryMap[cat].completed += 1;
    }

    if (c.status === 'COMPLETED' && c.actualMinutesSpent > 0) {
      totalEstimated += c.durationMinutes;
      totalActual += c.actualMinutesSpent;
    }
  }

  const items: PlanVsRealityItem[] = Object.entries(categoryMap).map(([cat, data]) => ({
    category: cat,
    plannedMinutes: data.planned,
    actualMinutes: data.actual,
    differenceMinutes: data.actual - data.planned,
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  // Calculate estimation bias
  const overallDiff = totalActual - totalEstimated;
  const averageDiscrepancyPercentage =
    totalEstimated > 0 ? Math.round((overallDiff / totalEstimated) * 100) : 0;

  const underestimatedCategories = items
    .filter((it) => it.differenceMinutes > 0 && it.plannedMinutes > 0)
    .map((it) => ({
      category: it.category,
      averageBiasPercentage: Math.round((it.differenceMinutes / it.plannedMinutes) * 100),
    }));

  let summaryInsight = 'Your estimated plan matches your actual focus pace well.';
  if (averageDiscrepancyPercentage > 10) {
    summaryInsight = `You usually spend ~${averageDiscrepancyPercentage}% more time than initially planned. Consider planning slightly larger blocks.`;
  } else if (averageDiscrepancyPercentage < -10) {
    summaryInsight = `You complete tasks ~${Math.abs(averageDiscrepancyPercentage)}% faster than planned, giving you extra buffer.`;
  }

  return {
    items,
    estimation: {
      averageDiscrepancyPercentage,
      underestimatedCategories,
      summaryInsight,
    },
  };
}

/**
 * Descriptive peak productivity windows from completed focus sessions
 */
export async function getPeakProductivityWindows(
  studentProfileId: string
): Promise<PeakProductivityWindow[]> {
  const sessions = await db.focusSession.findMany({
    where: {
      studentProfileId,
      status: 'COMPLETED',
      startedAt: { gte: subDays(new Date(), 60) },
    },
    select: { startedAt: true },
  });

  const hourBuckets: Record<string, { label: string; count: number }> = {
    '06:00–09:00': { label: 'Early Morning', count: 0 },
    '09:00–12:00': { label: 'Morning Peak', count: 0 },
    '13:00–16:00': { label: 'Afternoon', count: 0 },
    '16:00–19:00': { label: 'Late Afternoon', count: 0 },
    '19:00–22:00': { label: 'Evening Prime', count: 0 },
    '22:00–01:00': { label: 'Night Owl', count: 0 },
  };

  for (const s of sessions) {
    const hour = new Date(s.startedAt).getHours();
    if (hour >= 6 && hour < 9) hourBuckets['06:00–09:00'].count++;
    else if (hour >= 9 && hour < 12) hourBuckets['09:00–12:00'].count++;
    else if (hour >= 13 && hour < 16) hourBuckets['13:00–16:00'].count++;
    else if (hour >= 16 && hour < 19) hourBuckets['16:00–19:00'].count++;
    else if (hour >= 19 && hour < 22) hourBuckets['19:00–22:00'].count++;
    else hourBuckets['22:00–01:00'].count++;
  }

  const total = sessions.length || 1;
  return Object.entries(hourBuckets).map(([range, data]) => ({
    timeRange: range,
    label: data.label,
    completedSessionsCount: data.count,
    completionRate: Math.round((data.count / total) * 100),
  }));
}

/**
 * Subject & Topic Level Progress
 */
export async function getSubjectAndTopicAnalytics(studentProfileId: string) {
  const subjects = await db.studentCornerSubject.findMany({
    where: { studentProfileId },
    include: {
      topics: true,
      challenges: {
        include: {
          challenge: {
            select: { status: true, durationMinutes: true, actualMinutesSpent: true },
          },
        },
      },
    },
  });

  return subjects.map((subj) => {
    const totalChallenges = subj.challenges.length;
    const completedChallenges = subj.challenges.filter(
      (c) => c.challenge.status === 'COMPLETED'
    ).length;
    const completionRate =
      totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;
    const plannedMinutes = subj.challenges.reduce(
      (acc, c) => acc + c.challenge.durationMinutes,
      0
    );
    const actualMinutes = subj.challenges.reduce(
      (acc, c) => acc + c.challenge.actualMinutesSpent,
      0
    );

    return {
      id: subj.id,
      name: subj.name,
      color: subj.color,
      topicsCount: subj.topics.length,
      totalChallenges,
      completedChallenges,
      completionRate,
      plannedMinutes,
      actualMinutes,
    };
  });
}

/**
 * Calculates weekly and monthly category analytics and focus breakdown.
 */
export async function getStudentAnalyticsOverview(studentProfileId: string) {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  const challenges = await db.arenaChallenge.findMany({
    where: {
      studentProfileId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      category: true,
      durationMinutes: true,
      actualMinutesSpent: true,
      status: true,
    },
  });

  const categoryMap: Record<
    string,
    { total: number; completed: number; plannedMinutes: number; actualMinutes: number }
  > = {};

  for (const c of challenges) {
    if (!categoryMap[c.category]) {
      categoryMap[c.category] = { total: 0, completed: 0, plannedMinutes: 0, actualMinutes: 0 };
    }
    categoryMap[c.category].total += 1;
    categoryMap[c.category].plannedMinutes += c.durationMinutes;
    categoryMap[c.category].actualMinutes += c.actualMinutesSpent;
    if (c.status === 'COMPLETED') {
      categoryMap[c.category].completed += 1;
    }
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
    category,
    totalChallenges: stats.total,
    completedChallenges: stats.completed,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    plannedHours: Math.round((stats.plannedMinutes / 60) * 10) / 10,
    focusedHours: Math.round((stats.actualMinutes / 60) * 10) / 10,
  }));

  const totalCompletedFocusMinutes = challenges.reduce((acc, c) => acc + c.actualMinutesSpent, 0);
  const totalPlannedMinutes = challenges.reduce((acc, c) => acc + c.durationMinutes, 0);
  const totalCompletedTasks = challenges.filter((c) => c.status === 'COMPLETED').length;
  const overallRate =
    challenges.length > 0 ? Math.round((totalCompletedTasks / challenges.length) * 100) : 0;

  return {
    totalCompletedFocusHours: Math.round((totalCompletedFocusMinutes / 60) * 10) / 10,
    totalPlannedHours: Math.round((totalPlannedMinutes / 60) * 10) / 10,
    totalChallenges: challenges.length,
    completedChallenges: totalCompletedTasks,
    overallCompletionRate: overallRate,
    categoryBreakdown,
  };
}

/**
 * Calculates end-of-day deterministic summary metrics.
 */
export async function calculateDaySummary(arenaId: string): Promise<DaySummaryCalculation> {
  const arena = await db.dailyArena.findUnique({
    where: { id: arenaId },
    include: { challenges: true },
  });

  if (!arena) throw new Error('Arena not found');

  const totalChallenges = arena.challenges.length;
  const completedChallenges = arena.challenges.filter((c) => c.status === 'COMPLETED').length;
  const completionRate =
    totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;
  const totalFocusMinutes = arena.totalCompletedMinutes;

  const categoryScores: Record<string, { total: number; completed: number }> = {};
  for (const c of arena.challenges) {
    if (!categoryScores[c.category]) categoryScores[c.category] = { total: 0, completed: 0 };
    categoryScores[c.category].total += 1;
    if (c.status === 'COMPLETED') categoryScores[c.category].completed += 1;
  }

  let strongestArea = 'Consistency';
  let needsAttention = 'None';
  let maxRate = -1;
  let minRate = 101;

  for (const [cat, data] of Object.entries(categoryScores)) {
    const rate = Math.round((data.completed / data.total) * 100);
    if (rate > maxRate) {
      maxRate = rate;
      strongestArea = cat;
    }
    if (rate < minRate) {
      minRate = rate;
      needsAttention = cat;
    }
  }

  return {
    date: format(new Date(arena.date), 'yyyy-MM-dd'),
    totalChallenges,
    completedChallenges,
    completionRate,
    totalFocusMinutes,
    strongestArea,
    needsAttention: needsAttention === strongestArea ? 'Balanced' : needsAttention,
    consistencyPercentage: completionRate,
    dayMode: arena.mode as DayMode,
  };
}

/**
 * Cross-feature ecosystem correlation analytics:
 * Connects Study Hours ↔ Mistakes, Mistakes ↔ Revisions, and Exam ↔ Syllabus readiness.
 */
export async function getCrossFeatureEcosystemAnalytics(studentProfileId: string) {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
  const today = startOfDay(new Date());

  const [subjects, mistakes, revisions, exams, goals] = await Promise.all([
    db.studentCornerSubject.findMany({
      where: { studentProfileId },
      include: {
        topics: true,
        challenges: {
          include: {
            challenge: {
              select: { status: true, durationMinutes: true, actualMinutesSpent: true, category: true, createdAt: true },
            },
          },
        },
      },
    }),
    db.mistakeRecord.findMany({
      where: { studentProfileId },
    }),
    db.spacedRevisionItem.findMany({
      where: { studentProfileId, isArchived: false },
    }),
    db.personalExam.findMany({
      where: { studentProfileId, isCompleted: false, examDate: { gte: today } },
      orderBy: { examDate: 'asc' },
    }),
    db.studentGoal.findMany({
      where: { studentProfileId, status: 'ACTIVE' },
    }),
  ]);

  // Subject Study ↔ Mistake Correlation
  const subjectCorrelations = subjects.map((subj) => {
    const studyChallenges = subj.challenges.filter((c) =>
      ['STUDY', 'REVISION', 'EXAM_PREP'].includes(c.challenge.category) && c.challenge.status === 'COMPLETED'
    );
    const totalStudyMinutes = studyChallenges.reduce((acc, c) => acc + c.challenge.actualMinutesSpent, 0);

    const relatedMistakes = mistakes.filter((m) =>
      m.subjectName.toLowerCase().includes(subj.name.toLowerCase())
    );
    const resolvedMistakes = relatedMistakes.filter((m) => m.isResolved).length;

    const totalTopics = subj.topics.length;
    const masteredTopics = subj.topics.filter((t) => t.masteryStatus === 'MASTERED' || t.masteryStatus === 'SOLID').length;
    const weakTopics = subj.topics.filter((t) => t.confidenceLevel <= 2).length;

    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color,
      studyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
      mistakesTotal: relatedMistakes.length,
      mistakesResolved: resolvedMistakes,
      mistakeResolutionRate: relatedMistakes.length > 0 ? Math.round((resolvedMistakes / relatedMistakes.length) * 100) : 100,
      syllabusCoverageRate: totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0,
      weakTopicsCount: weakTopics,
    };
  });

  // Mistakes ↔ Revision Loop Effectiveness
  const totalMistakes = mistakes.length;
  const resolvedMistakesCount = mistakes.filter((m) => m.isResolved).length;
  const mistakeRetentionRate = totalMistakes > 0 ? Math.round((resolvedMistakesCount / totalMistakes) * 100) : 100;

  // Spaced Revision Mastery Progress
  const totalRevisions = revisions.length;
  const highBoxCount = revisions.filter((r) => r.leitnerBox >= 4).length;
  const revisionMasteryRate = totalRevisions > 0 ? Math.round((highBoxCount / totalRevisions) * 100) : 0;

  // Upcoming Exam Readiness
  const examReadiness = exams.slice(0, 3).map((exam) => {
    const matchedSubject = subjects.find((s) => s.name.toLowerCase().includes(exam.subject.toLowerCase()));
    const totalChapters = matchedSubject?.topics.length || 0;
    const coveredChapters = matchedSubject?.topics.filter((t) => t.theoryCompleted && t.qbSolved).length || 0;
    const readinessPercent = totalChapters > 0 ? Math.round((coveredChapters / totalChapters) * 100) : 50;

    return {
      examId: exam.id,
      title: exam.title,
      subject: exam.subject,
      examDate: exam.examDate,
      readinessPercent,
      totalChapters,
      coveredChapters,
    };
  });

  return {
    subjectCorrelations,
    mistakeLoop: {
      totalMistakes,
      resolvedMistakesCount,
      mistakeRetentionRate,
    },
    revisionLoop: {
      totalRevisions,
      highBoxCount,
      revisionMasteryRate,
    },
    examReadiness,
  };
}

/**
 * Weekly Ecosystem Review (7-Day connected student activity report)
 */
export async function getWeeklyEcosystemReview(studentProfileId: string) {
  const sevenDaysAgo = subDays(startOfDay(new Date()), 7);
  const now = new Date();

  const [recentChallenges, recentMistakes, activeGoals, profile] = await Promise.all([
    db.arenaChallenge.findMany({
      where: {
        studentProfileId,
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
      },
      select: {
        category: true,
        source: true,
        actualMinutesSpent: true,
        completedAt: true,
      },
    }),
    db.mistakeRecord.findMany({
      where: {
        studentProfileId,
        retestedAt: { gte: sevenDaysAgo },
        isResolved: true,
      },
    }),
    db.studentGoal.findMany({
      where: { studentProfileId },
    }),
    db.studentCornerProfile.findUnique({
      where: { studentProfileId },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  const totalFocusMinutes = recentChallenges.reduce((acc, c) => acc + c.actualMinutesSpent, 0);
  const focusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;
  const revisionsCount = recentChallenges.filter((c) => c.category === 'REVISION' || c.source === 'REVISION').length;
  const codingCount = recentChallenges.filter((c) => c.category === 'CODING').length;
  const mistakesResolvedCount = recentMistakes.length;

  const completedGoalsCount = activeGoals.filter((g) => g.status === 'COMPLETED').length;

  return {
    period: `${format(sevenDaysAgo, 'MMM d')} – ${format(now, 'MMM d, yyyy')}`,
    focusHours,
    revisionsCount,
    mistakesResolvedCount,
    codingCount,
    totalChallengesCompleted: recentChallenges.length,
    activeGoalsCount: activeGoals.length,
    completedGoalsCount,
    currentStreak: profile?.currentStreak || 0,
  };
}
