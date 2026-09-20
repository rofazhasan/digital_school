import { DayMode, ChallengeCategory, ChallengePriority, ChallengeStatus, FocusSessionStatus } from '@prisma/client';

export type { DayMode, ChallengeCategory, ChallengePriority, ChallengeStatus, FocusSessionStatus };

export interface CategoryMetadata {
  id: ChallengeCategory;
  label: string;
  banglaLabel: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface ChallengeWithRelations {
  id: string;
  arenaId: string;
  studentProfileId: string;
  title: string;
  category: ChallengeCategory;
  customCategoryName?: string | null;
  durationMinutes: number;
  scheduledTime?: string | null;
  priority: ChallengePriority;
  status: ChallengeStatus;
  orderIndex: number;
  notes?: string | null;
  completedAt?: Date | string | null;
  actualMinutesSpent: number;
  subjects: {
    subject: {
      id: string;
      name: string;
      color: string;
      icon?: string | null;
    };
  }[];
  topics: {
    topic: {
      id: string;
      name: string;
    };
  }[];
  focusSessions?: {
    id: string;
    secondsElapsed: number;
    status: FocusSessionStatus;
    startedAt: Date | string;
    plannedEnd: Date | string;
  }[];
}

export interface DailyArenaWithChallenges {
  id: string;
  studentProfileId: string;
  date: Date | string;
  mode: DayMode;
  isLocked: boolean;
  lockedAt?: Date | string | null;
  notes?: string | null;
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  completedCount: number;
  totalCount: number;
  summary?: any;
  challenges: ChallengeWithRelations[];
}

export interface QuranReflection {
  dayNumber: number;
  surahNumber: number;
  surahNameArabic: string;
  surahNameBangla: string;
  surahNameEnglish: string;
  ayahNumber: number;
  arabicText: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning?: string;
  theme?: string;
  audioUrl?: string;
  reciterName?: string;
}

export interface HadithReflection {
  dayNumber: number;
  arabicText?: string;
  banglaText: string;
  englishText?: string;
  sourceBook: string;
  hadithNumber: string;
  chapter?: string;
  grade: string;
  theme?: string;
}

export interface HijriDateInfo {
  gregorianDate: string;
  hijriFormatted: string;
  hijriDay: number;
  hijriMonth: string;
  hijriMonthArabic: string;
  hijriYear: number;
}

export interface AsmaUlHusnaItem {
  number: number;
  arabic: string;
  transliteration: string;
  english: string;
  meaning: string;
  banglaMeaning?: string;
}

export interface AuthenticDuaItem {
  id: number | string;
  category: string;
  categoryNameBangla?: string;
  title: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  banglaTranslation?: string;
  source?: string;
}

export interface PrayerTimesInfo {
  date: string;
  timezone: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  currentPrayer?: string;
  nextPrayer?: string;
  timeUntilNext?: string;
}

export interface CombinedExamItem {
  id: string;
  title: string;
  subject: string;
  examDate: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  isLmsExam: boolean;
  priority: ChallengePriority;
  totalMarks?: number | null;
  passMarks?: number | null;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface HeatmapDayData {
  date: string; // YYYY-MM-DD
  count: number;
  completedCount: number;
  focusMinutes: number;
  completionRate: number; // 0 - 100
  level: 0 | 1 | 2 | 3 | 4; // GitHub-like intensity
}

export interface DaySummaryCalculation {
  date: string;
  totalChallenges: number;
  completedChallenges: number;
  completionRate: number;
  totalFocusMinutes: number;
  strongestArea: string;
  needsAttention: string;
  consistencyPercentage: number;
  dayMode: DayMode;
}

export type HeatmapMetricType = 'COMPLETION' | 'FOCUS' | 'STUDY' | 'CODING' | 'CHALLENGES';

export interface MultiMetricHeatmapData {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
  totalChallenges: number;
  completedChallenges: number;
  focusMinutes: number;
  studyMinutes: number;
  codingMinutes: number;
  completionRate: number;
}

export interface TodayScoreDetails {
  score: number; // 0-100
  totalChallenges: number;
  completedChallenges: number;
  completionPercentage: number;
  focusMinutesLogged: number;
  focusTargetMinutes: number;
  criticalTasksTotal: number;
  criticalTasksCompleted: number;
  calculationBreakdown: {
    completionComponent: number; // 50%
    focusComponent: number; // 30%
    criticalComponent: number; // 20%
  };
  coreStandardScore: number; // 0.00 - 1.00
  coreStandardPillars: {
    study: boolean;     // Morning / Subject study
    recall: boolean;    // Active recall / Spaced revision
    exam: boolean;      // Exam practice / Question Bank / Retest
    lifestyle: boolean; // Salat / Hydration / Habit
  };
}

export interface StreakHistoryDetails {
  currentStreak: number;
  longestStreak: number;
  daysActiveThisMonth: number;
  totalDaysThisMonth: number;
  daysActiveThisYear: number;
  graceDaysRemaining: number;
  weeklyStreak: number;
  focusStreak: number;
  categoryStreaks: { category: ChallengeCategory; streakDays: number }[];
  milestones: { days: number; reached: boolean; dateReached?: string }[];
}

export interface PeriodicReviewData {
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  title: string;
  dateRange: string;
  totalPlannedMinutes: number;
  totalFocusedMinutes: number;
  totalChallenges: number;
  completedChallenges: number;
  completionRate: number;
  strongestCategory: string;
  needsAttentionCategory: string;
  longestStreakInPeriod: number;
  activeDaysCount: number;
}

export interface PlanVsRealityItem {
  category: string;
  plannedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  completionRate: number;
}

export interface EstimationAccuracyData {
  averageDiscrepancyPercentage: number; // e.g. -15% or +20%
  underestimatedCategories: { category: string; averageBiasPercentage: number }[];
  summaryInsight: string;
}

export interface PeakProductivityWindow {
  timeRange: string; // e.g. "08:00–11:00"
  label: string; // e.g. "Morning Peak"
  completionRate: number;
  completedSessionsCount: number;
}

export interface ExamPreparationTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface StudentGoalItem {
  id: string;
  studentProfileId: string;
  title: string;
  category?: string | null;
  targetType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'CUSTOM';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date | string;
  targetDate?: Date | string | null;
  completedAt?: Date | string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  milestonesPassed: number[];
  progressPercentage: number;
  notes?: string | null;
}

export type WidgetId =
  | 'todayScore'
  | 'todayArena'
  | 'timeline'
  | 'streak'
  | 'heatmap'
  | 'exams'
  | 'goals'
  | 'reflection'
  | 'planVsReality'
  | 'recovery';

export interface WidgetConfig {
  order: WidgetId[];
  hidden: WidgetId[];
}
