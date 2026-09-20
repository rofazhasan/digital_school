import db from '@/lib/db';
import {
  startOfDay,
  subDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameMonth,
  isSameYear,
} from 'date-fns';
import { StreakHistoryDetails, ChallengeCategory } from '../types';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  completionRateLast30Days: number;
  totalDaysCompleted: number;
  graceDayUsedToday?: boolean;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

/**
 * Calculates current and longest streaks based on meaningful activity.
 * Supports configurable qualifying criteria and non-manipulative 1-day grace recovery.
 */
export async function calculateStudentStreaks(studentProfileId: string): Promise<StreakInfo> {
  const profile = await db.studentCornerProfile.findUnique({
    where: { studentProfileId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      streakGraceDaysAvailable: true,
      streakQualifyingCriteria: true,
    },
  });

  const criteria = profile?.streakQualifyingCriteria || 'ONE_CHALLENGE';
  const availableGraceDays = profile?.streakGraceDaysAvailable ?? 1;

  // Fetch arenas from the last 365 days ordered by date descending
  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { gte: subDays(new Date(), 365) },
    },
    orderBy: { date: 'desc' },
    select: {
      date: true,
      completedCount: true,
      totalCount: true,
      totalCompletedMinutes: true,
    },
  });

  // Helper to test if a day meaningfully qualifies
  const isQualifyingDay = (arena?: {
    completedCount: number;
    totalCount: number;
    totalCompletedMinutes: number;
  } | null) => {
    if (!arena) return false;
    if (criteria === 'MIN_FOCUS_25M') {
      return arena.totalCompletedMinutes >= 25;
    }
    if (criteria === 'PERCENT_50') {
      return arena.totalCount > 0 && (arena.completedCount / arena.totalCount) >= 0.5;
    }
    // Default: at least 1 challenge completed
    return arena.completedCount > 0;
  };

  const qualifyingArenas = arenas.filter(isQualifyingDay);

  if (qualifyingArenas.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: profile?.longestStreak || 0,
      completionRateLast30Days: 0,
      totalDaysCompleted: 0,
    };
  }

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  const hasCompletedToday = qualifyingArenas.some((a) => isSameDay(new Date(a.date), today));
  const hasCompletedYesterday = qualifyingArenas.some((a) => isSameDay(new Date(a.date), yesterday));

  let currentStreak = 0;
  let graceUsed = false;

  if (hasCompletedToday || hasCompletedYesterday) {
    let dayCursor = hasCompletedToday ? today : yesterday;
    let graceAllowed = availableGraceDays > 0;

    while (true) {
      const match = qualifyingArenas.find((a) => isSameDay(new Date(a.date), dayCursor));
      if (match) {
        currentStreak++;
        dayCursor = subDays(dayCursor, 1);
      } else if (graceAllowed && !graceUsed) {
        // Use single grace day to bridge 1 missed day
        graceUsed = true;
        dayCursor = subDays(dayCursor, 1);
      } else {
        break;
      }
    }
  }

  const longestStreak = Math.max(currentStreak, profile?.longestStreak || 0);

  // Update profile in DB if changed
  if (
    profile &&
    (profile.currentStreak !== currentStreak || profile.longestStreak !== longestStreak)
  ) {
    await db.studentCornerProfile.update({
      where: { studentProfileId },
      data: {
        currentStreak,
        longestStreak,
        lastActiveDate: hasCompletedToday ? new Date() : profile.lastActiveDate,
      },
    });
  }

  // 30-day completion rate
  const last30DaysArenas = arenas.filter(
    (a) => new Date(a.date) >= subDays(new Date(), 30)
  );
  const totalPlannedIn30 = last30DaysArenas.reduce((acc, a) => acc + a.totalCount, 0);
  const totalCompletedIn30 = last30DaysArenas.reduce((acc, a) => acc + a.completedCount, 0);
  const completionRateLast30Days =
    totalPlannedIn30 > 0 ? Math.round((totalCompletedIn30 / totalPlannedIn30) * 100) : 0;

  return {
    currentStreak,
    longestStreak,
    completionRateLast30Days,
    totalDaysCompleted: qualifyingArenas.length,
    graceDayUsedToday: graceUsed,
  };
}

/**
 * Provides comprehensive streak history breakdown for detailed streak modal
 */
export async function getDetailedStreakHistory(studentProfileId: string): Promise<StreakHistoryDetails> {
  const streakInfo = await calculateStudentStreaks(studentProfileId);
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const startOfCurrentYear = startOfYear(now);

  const profile = await db.studentCornerProfile.findUnique({
    where: { studentProfileId },
    select: { streakGraceDaysAvailable: true },
  });

  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { gte: startOfCurrentYear },
      completedCount: { gt: 0 },
    },
    select: { date: true, completedCount: true, totalCompletedMinutes: true },
  });

  const daysActiveThisMonth = arenas.filter((a) => isSameMonth(new Date(a.date), now)).length;
  const totalDaysThisMonth = now.getDate();
  const daysActiveThisYear = arenas.filter((a) => isSameYear(new Date(a.date), now)).length;

  // Category streak breakdown
  const challenges = await db.arenaChallenge.findMany({
    where: {
      studentProfileId,
      status: 'COMPLETED',
      completedAt: { gte: subDays(now, 30) },
    },
    select: { category: true, completedAt: true },
  });

  const categoryCounts: Record<string, number> = {};
  for (const c of challenges) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  }

  const categoryStreaks = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat as ChallengeCategory,
    streakDays: Math.min(count, streakInfo.currentStreak),
  }));

  // Milestones
  const milestones = STREAK_MILESTONES.map((days) => ({
    days,
    reached: streakInfo.longestStreak >= days,
  }));

  return {
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    daysActiveThisMonth,
    totalDaysThisMonth,
    daysActiveThisYear,
    graceDaysRemaining: profile?.streakGraceDaysAvailable ?? 1,
    weeklyStreak: Math.floor(streakInfo.currentStreak / 7),
    focusStreak: Math.min(streakInfo.currentStreak, 14),
    categoryStreaks,
    milestones,
  };
}
