import prismadb from './db';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  instituteId?: string;
  subject?: string;
  questionType?: string;
  difficulty?: string;
}

export interface QuestionAnalytics {
  totalQuestions: number;
  questionsByType: { [key: string]: number };
  questionsBySubject: { [key: string]: number };
  questionsByDifficulty: { [key: string]: number };
  questionsByStatus: { [key: string]: number };
  averageMarks: number;
  totalUsage: number;
  aiGeneratedCount: number;
  approvalRate: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: { [key: string]: number };
  activeUsers: number;
  newUsers: number;
  userActivity: Array<{
    date: string;
    count: number;
  }>;
  topContributors: Array<{
    userId: string;
    name: string;
    questionsCreated: number;
    questionsApproved: number;
  }>;
}

export interface AIAnalytics {
  totalActivities: number;
  activitiesByType: { [key: string]: number };
  successRate: number;
  averageResponseTime: number;
  tokenUsage: number;
  costEstimate: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface ExportAnalytics {
  totalExports: number;
  exportsByType: { [key: string]: number };
  exportsByFormat: { [key: string]: number };
  averageFileSize: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

class AnalyticsService {
  async getQuestionAnalytics(filters: AnalyticsFilters = {}): Promise<QuestionAnalytics> {
    const { startDate, endDate, userId, subject, questionType, difficulty } = filters;

    // Build where clause
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    if (userId) where.createdById = userId;
    if (subject) where.subject = subject;
    if (questionType) where.type = questionType;
    if (difficulty) where.difficulty = difficulty;

    // Define promises for independent queries
    const totalQuestionsPromise = prismadb.question.count({ where });

    const questionsByTypePromise = prismadb.question.groupBy({
      by: ['type'],
      where,
      _count: { type: true }
    });

    const questionsBySubjectPromise = prismadb.question.groupBy({
      by: ['subject'],
      where,
      _count: { subject: true }
    });

    const questionsByDifficultyPromise = prismadb.question.groupBy({
      by: ['difficulty'],
      where,
      _count: { difficulty: true }
    });

    // Note: Question model doesn't have a status field, so we'll skip status grouping

    const avgMarksPromise = prismadb.question.aggregate({
      where,
      _avg: { marks: true }
    });

    const totalUsagePromise = prismadb.question.aggregate({
      where,
      _sum: { usageCount: true }
    });

    const aiGeneratedCountPromise = prismadb.question.count({
      where: { ...where, isAiGenerated: true }
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentActivityPromise = this.getDailyActivity(where, thirtyDaysAgo, new Date());

    // Execute all in parallel
    const [
      totalQuestions,
      questionsByType,
      questionsBySubject,
      questionsByDifficulty,
      avgMarks,
      totalUsage,
      aiGeneratedCount,
      recentActivity
    ] = await Promise.all([
      totalQuestionsPromise,
      questionsByTypePromise,
      questionsBySubjectPromise,
      questionsByDifficultyPromise,
      avgMarksPromise,
      totalUsagePromise,
      aiGeneratedCountPromise,
      recentActivityPromise
    ]);

    // Note: Question model doesn't have status field, so we'll skip approval rate calculation
    const approvalRate = 0;

    return {
      totalQuestions,
      questionsByType: this.formatGroupByResult(questionsByType, 'type'),
      questionsBySubject: this.formatGroupByResult(questionsBySubject, 'subject'),
      questionsByDifficulty: this.formatGroupByResult(questionsByDifficulty, 'difficulty'),
      questionsByStatus: {}, // Question model doesn't have status field
      averageMarks: avgMarks._avg.marks || 0,
      totalUsage: totalUsage._sum.usageCount || 0,
      aiGeneratedCount,
      approvalRate,
      recentActivity
    };
  }

  async getUserAnalytics(filters: AnalyticsFilters = {}): Promise<UserAnalytics> {
    const { startDate, endDate, instituteId } = filters;

    // Build where clause
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    if (instituteId) where.instituteId = instituteId;

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Define promises
    const totalUsersPromise = prismadb.user.count({ where });

    const usersByRolePromise = prismadb.user.groupBy({
      by: ['role'],
      where,
      _count: { role: true }
    });

    const activeUsersPromise = prismadb.user.count({
      where: {
        ...where,
        lastLoginAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const newUsersPromise = prismadb.user.count({
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const recentActivityPromise = this.getDailyUserActivity(where, thirtyDaysAgo, new Date());

    // Simplified top contributors since Question model doesn't have status field
    const topContributorsPromise = prismadb.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10
    });

    // Execute parallel
    const [
      totalUsers,
      usersByRole,
      activeUsers,
      newUsers,
      recentActivity,
      topContributors
    ] = await Promise.all([
      totalUsersPromise,
      usersByRolePromise,
      activeUsersPromise,
      newUsersPromise,
      recentActivityPromise,
      topContributorsPromise
    ]);

    const formattedContributors = topContributors.map(user => ({
      userId: user.id,
      name: user.name,
      questionsCreated: 0, // Would need to count questions created by user
      questionsApproved: 0 // Question model doesn't have status field
    }));

    return {
      totalUsers,
      usersByRole: this.formatGroupByResult(usersByRole, 'role'),
      activeUsers,
      newUsers,
      userActivity: recentActivity,
      topContributors: formattedContributors
    };
  }

  async getAIAnalytics(filters: AnalyticsFilters = {}): Promise<AIAnalytics> {
    const { startDate, endDate, userId } = filters;

    // Build where clause
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    if (userId) where.userId = userId;

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Define promises
    const totalActivitiesPromise = prismadb.aIActivity.count({ where });

    const activitiesByTypePromise = prismadb.aIActivity.groupBy({
      by: ['activityType'],
      where,
      _count: { activityType: true }
    });

    const successfulActivitiesPromise = prismadb.aIActivity.count({
      where: { ...where, success: true }
    });

    const avgResponseTimePromise = prismadb.aIActivity.aggregate({
      where: { ...where, responseTime: { not: null } },
      _avg: { responseTime: true }
    });

    const tokenUsagePromise = prismadb.aIActivity.aggregate({
      where: { ...where, tokenCost: { not: null } },
      _sum: { tokenCost: true }
    });

    const recentActivityPromise = this.getDailyAIActivity(where, thirtyDaysAgo, new Date());

    // Execute parallel
    const [
      totalActivities,
      activitiesByType,
      successfulActivities,
      avgResponseTime,
      tokenUsage,
      recentActivity
    ] = await Promise.all([
      totalActivitiesPromise,
      activitiesByTypePromise,
      successfulActivitiesPromise,
      avgResponseTimePromise,
      tokenUsagePromise,
      recentActivityPromise
    ]);

    const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;
    const costEstimate = (tokenUsage._sum.tokenCost || 0) * 0.002;

    return {
      totalActivities,
      activitiesByType: this.formatGroupByResult(activitiesByType, 'activityType'),
      successRate,
      averageResponseTime: avgResponseTime._avg.responseTime || 0,
      tokenUsage: tokenUsage._sum.tokenCost || 0,
      costEstimate,
      recentActivity
    };
  }

  async getExportAnalytics(filters: AnalyticsFilters = {}): Promise<ExportAnalytics> {
    const { startDate, endDate, userId } = filters;

    // Build where clause
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    if (userId) where.triggeredById = userId;

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Define promises
    const totalExportsPromise = prismadb.exportJob.count({ where });

    const exportsByTypePromise = prismadb.exportJob.groupBy({
      by: ['type'],
      where,
      _count: { type: true }
    });

    const exportsByStatusPromise = prismadb.exportJob.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    const avgFileSizePromise = prismadb.exportJob.aggregate({
      where: { ...where, fileSize: { not: null } },
      _avg: { fileSize: true }
    });

    const recentActivityPromise = this.getDailyExportActivity(where, thirtyDaysAgo, new Date());

    // Execute parallel
    const [
      totalExports,
      exportsByType,
      exportsByStatus,
      avgFileSize,
      recentActivity
    ] = await Promise.all([
      totalExportsPromise,
      exportsByTypePromise,
      exportsByStatusPromise,
      avgFileSizePromise,
      recentActivityPromise
    ]);

    return {
      totalExports,
      exportsByType: this.formatGroupByResult(exportsByType, 'type'),
      exportsByFormat: this.formatGroupByResult(exportsByStatus, 'status'),
      averageFileSize: avgFileSize._avg.fileSize || 0,
      recentActivity
    };
  }

  private async getDailyActivity(where: any, startDate: Date, endDate: Date) {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prismadb.question.count({
        where: {
          ...where,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        count
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return days;
  }

  private async getDailyUserActivity(where: any, startDate: Date, endDate: Date) {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prismadb.user.count({
        where: {
          ...where,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        count
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return days;
  }

  private async getDailyAIActivity(where: any, startDate: Date, endDate: Date) {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prismadb.aIActivity.count({
        where: {
          ...where,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        count
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return days;
  }

  private async getDailyExportActivity(where: any, startDate: Date, endDate: Date) {
    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prismadb.exportJob.count({
        where: {
          ...where,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        count
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return days;
  }

  private formatGroupByResult<T extends { [key: string]: any }>(
    result: T[],
    key: string
  ): { [key: string]: number } {
    return result.reduce((acc, item) => {
      acc[item[key]] = item._count[key];
      return acc;
    }, {} as { [key: string]: number });
  }

  async getDashboardStats(instituteId?: string) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);
    const userWhere = instituteId ? { instituteId } : {};

    // Define all promises
    const totalQuestionsPromise = prismadb.question.count();

    const questionsThisMonthPromise = prismadb.question.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const questionsThisWeekPromise = prismadb.question.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    const totalUsersPromise = prismadb.user.count({ where: userWhere });

    const activeUsersPromise = prismadb.user.count({
      where: { ...userWhere, lastLoginAt: { gte: sevenDaysAgo } }
    });

    const aiActivitiesPromise = prismadb.aIActivity.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const exportsPromise = prismadb.exportJob.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Execute all in parallel
    const [
      totalQuestions,
      questionsThisMonth,
      questionsThisWeek,
      totalUsers,
      activeUsers,
      aiActivities,
      exports
    ] = await Promise.all([
      totalQuestionsPromise,
      questionsThisMonthPromise,
      questionsThisWeekPromise,
      totalUsersPromise,
      activeUsersPromise,
      aiActivitiesPromise,
      exportsPromise
    ]);

    return {
      questions: {
        total: totalQuestions,
        thisMonth: questionsThisMonth,
        thisWeek: questionsThisWeek
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      ai: {
        activities: aiActivities
      },
      exports: {
        total: exports
      }
    };
  }
}

export const analyticsService = new AnalyticsService(); 