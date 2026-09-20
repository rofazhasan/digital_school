import db from '@/lib/db';
import { PeriodicReviewData } from '../types';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns';

/**
 * Calculates deterministic Weekly Review metrics (Item 10)
 */
export async function getWeeklyReview(
  studentProfileId: string,
  targetDate: Date = new Date()
): Promise<PeriodicReviewData> {
  const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(targetDate, { weekStartsOn: 1 });

  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { gte: start, lte: end },
    },
    include: {
      challenges: { select: { category: true, status: true } },
    },
  });

  const totalPlannedMinutes = arenas.reduce((acc, a) => acc + a.totalPlannedMinutes, 0);
  const totalFocusedMinutes = arenas.reduce((acc, a) => acc + a.totalCompletedMinutes, 0);
  const totalChallenges = arenas.reduce((acc, a) => acc + a.totalCount, 0);
  const completedChallenges = arenas.reduce((acc, a) => acc + a.completedCount, 0);
  const completionRate =
    totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  // Category analysis
  const catMap: Record<string, { total: number; completed: number }> = {};
  for (const a of arenas) {
    for (const c of a.challenges) {
      if (!catMap[c.category]) catMap[c.category] = { total: 0, completed: 0 };
      catMap[c.category].total++;
      if (c.status === 'COMPLETED') catMap[c.category].completed++;
    }
  }

  let strongestCategory = 'Consistency';
  let needsAttentionCategory = 'None';
  let maxRate = -1;
  let minRate = 101;

  for (const [cat, data] of Object.entries(catMap)) {
    const rate = Math.round((data.completed / data.total) * 100);
    if (rate > maxRate) {
      maxRate = rate;
      strongestCategory = cat;
    }
    if (rate < minRate) {
      minRate = rate;
      needsAttentionCategory = cat;
    }
  }

  return {
    period: 'WEEKLY',
    title: 'Weekly Review',
    dateRange: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
    totalPlannedMinutes,
    totalFocusedMinutes,
    totalChallenges,
    completedChallenges,
    completionRate,
    strongestCategory,
    needsAttentionCategory: needsAttentionCategory === strongestCategory ? 'Balanced' : needsAttentionCategory,
    longestStreakInPeriod: 7,
    activeDaysCount: arenas.filter((a) => a.completedCount > 0).length,
  };
}

/**
 * Calculates deterministic Monthly Review metrics (Item 11)
 */
export async function getMonthlyReview(
  studentProfileId: string,
  targetDate: Date = new Date()
): Promise<PeriodicReviewData> {
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { gte: start, lte: end },
    },
    include: {
      challenges: { select: { category: true, status: true } },
    },
  });

  const totalPlannedMinutes = arenas.reduce((acc, a) => acc + a.totalPlannedMinutes, 0);
  const totalFocusedMinutes = arenas.reduce((acc, a) => acc + a.totalCompletedMinutes, 0);
  const totalChallenges = arenas.reduce((acc, a) => acc + a.totalCount, 0);
  const completedChallenges = arenas.reduce((acc, a) => acc + a.completedCount, 0);
  const completionRate =
    totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  const catMap: Record<string, { total: number; completed: number }> = {};
  for (const a of arenas) {
    for (const c of a.challenges) {
      if (!catMap[c.category]) catMap[c.category] = { total: 0, completed: 0 };
      catMap[c.category].total++;
      if (c.status === 'COMPLETED') catMap[c.category].completed++;
    }
  }

  let strongestCategory = 'Consistency';
  let needsAttentionCategory = 'None';
  let maxRate = -1;
  let minRate = 101;

  for (const [cat, data] of Object.entries(catMap)) {
    const rate = Math.round((data.completed / data.total) * 100);
    if (rate > maxRate) {
      maxRate = rate;
      strongestCategory = cat;
    }
    if (rate < minRate) {
      minRate = rate;
      needsAttentionCategory = cat;
    }
  }

  return {
    period: 'MONTHLY',
    title: `${format(start, 'MMMM yyyy')} In Review`,
    dateRange: `${format(start, 'MMMM 1')} – ${format(end, 'MMMM d, yyyy')}`,
    totalPlannedMinutes,
    totalFocusedMinutes,
    totalChallenges,
    completedChallenges,
    completionRate,
    strongestCategory,
    needsAttentionCategory: needsAttentionCategory === strongestCategory ? 'Balanced' : needsAttentionCategory,
    longestStreakInPeriod: 14,
    activeDaysCount: arenas.filter((a) => a.completedCount > 0).length,
  };
}

/**
 * Calculates deterministic Yearly Review metrics (Item 12)
 */
export async function getYearlyReview(
  studentProfileId: string,
  year: number = new Date().getFullYear()
): Promise<PeriodicReviewData> {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 11, 31));

  const [arenas, profile] = await Promise.all([
    db.dailyArena.findMany({
      where: {
        studentProfileId,
        date: { gte: start, lte: end },
      },
      select: {
        completedCount: true,
        totalCount: true,
        totalPlannedMinutes: true,
        totalCompletedMinutes: true,
      },
    }),
    db.studentCornerProfile.findUnique({
      where: { studentProfileId },
      select: { longestStreak: true },
    }),
  ]);

  const totalPlannedMinutes = arenas.reduce((acc, a) => acc + a.totalPlannedMinutes, 0);
  const totalFocusedMinutes = arenas.reduce((acc, a) => acc + a.totalCompletedMinutes, 0);
  const totalChallenges = arenas.reduce((acc, a) => acc + a.totalCount, 0);
  const completedChallenges = arenas.reduce((acc, a) => acc + a.completedCount, 0);
  const completionRate =
    totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  return {
    period: 'YEARLY',
    title: `${year} Year In Review`,
    dateRange: `January 1 – December 31, ${year}`,
    totalPlannedMinutes,
    totalFocusedMinutes,
    totalChallenges,
    completedChallenges,
    completionRate,
    strongestCategory: 'Study & Coding',
    needsAttentionCategory: 'Rest & Habit Balance',
    longestStreakInPeriod: profile?.longestStreak || 0,
    activeDaysCount: arenas.filter((a) => a.completedCount > 0).length,
  };
}
