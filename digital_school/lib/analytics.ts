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

    // Get total questions
    const totalQuestions = await prismadb.question.count({ where });

    // Get questions by type
    const questionsByType = await prismadb.question.groupBy({
      by: ['type'],
      where,
      _count: { type: true }
    });

    // Get questions by subject
    const questionsBySubject = await prismadb.question.groupBy({
      by: ['subject'],
      where,
      _count: { subject: true }
    });

    // Get questions by difficulty
    const questionsByDifficulty = await prismadb.question.groupBy({
      by: ['difficulty'],
      where,
      _count: { difficulty: true }
    });

    // Note: Question model doesn't have a status field, so we'll skip status grouping

    // Get average marks
    const avgMarks = await prismadb.question.aggregate({
      where,
      _avg: { marks: true }
    });

    // Get total usage
    const totalUsage = await prismadb.question.aggregate({
      where,
      _sum: { usageCount: true }
    });

    // Get AI generated count
    const aiGeneratedCount = await prismadb.question.count({
      where: { ...where, isAiGenerated: true }
    });

    // Note: Question model doesn't have status field, so we'll skip approval rate calculation
    const approvalRate = 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentActivity = await this.getDailyActivity(where, thirtyDaysAgo, new Date());

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

    // Get total users
    const totalUsers = await prismadb.user.count({ where });

    // Get users by role
    const usersByRole = await prismadb.user.groupBy({
      by: ['role'],
      where,
      _count: { role: true }
    });

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const activeUsers = await prismadb.user.count({
      where: {
        ...where,
        lastLoginAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get new users (created within last 30 days)
    const newUsers = await prismadb.user.count({
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get user activity (last 30 days)
    const recentActivity = await this.getDailyUserActivity(where, thirtyDaysAgo, new Date());

    // Get top contributors
    // Simplified top contributors since Question model doesn't have status field
    const topContributors = await prismadb.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10
    });

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

    // Get total activities
    const totalActivities = await prismadb.aIActivity.count({ where });

    // Get activities by type
    const activitiesByType = await prismadb.aIActivity.groupBy({
      by: ['activityType'],
      where,
      _count: { activityType: true }
    });

    // Get success rate
    const successfulActivities = await prismadb.aIActivity.count({
      where: { ...where, success: true }
    });
    const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;

    // Get average response time
    const avgResponseTime = await prismadb.aIActivity.aggregate({
      where: { ...where, responseTime: { not: null } },
      _avg: { responseTime: true }
    });

    // Get token usage
    const tokenUsage = await prismadb.aIActivity.aggregate({
      where: { ...where, tokenCost: { not: null } },
      _sum: { tokenCost: true }
    });

    // Estimate cost (assuming $0.002 per 1K tokens)
    const costEstimate = (tokenUsage._sum.tokenCost || 0) * 0.002;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentActivity = await this.getDailyAIActivity(where, thirtyDaysAgo, new Date());

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

    // Get total exports
    const totalExports = await prismadb.exportJob.count({ where });

    // Get exports by type
    const exportsByType = await prismadb.exportJob.groupBy({
      by: ['type'],
      where,
      _count: { type: true }
    });

    // Get exports by status (format)
    const exportsByStatus = await prismadb.exportJob.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    // Get average file size
    const avgFileSize = await prismadb.exportJob.aggregate({
      where: { ...where, fileSize: { not: null } },
      _avg: { fileSize: true }
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentActivity = await this.getDailyExportActivity(where, thirtyDaysAgo, new Date());

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

    // Question stats (no institute filtering for questions)
    const totalQuestions = await prismadb.question.count();
    const questionsThisMonth = await prismadb.question.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const questionsThisWeek = await prismadb.question.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    // User stats
    const userWhere = instituteId ? { instituteId } : {};
    const totalUsers = await prismadb.user.count({ where: userWhere });
    const activeUsers = await prismadb.user.count({
      where: { ...userWhere, lastLoginAt: { gte: sevenDaysAgo } }
    });

    // AI stats (no institute filtering for AI activities)
    const aiActivities = await prismadb.aIActivity.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Export stats (no institute filtering for exports)
    const exports = await prismadb.exportJob.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

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