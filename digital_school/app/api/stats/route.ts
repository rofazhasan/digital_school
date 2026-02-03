import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Parallelize queries for performance
    const [
      totalUsers,
      newUsers,
      totalExams,
      examsToday,
      totalResults,
      totalQuestions,
      pendingApprovalsCount,
      aiActivities
    ] = await Promise.all([
      prismadb.user.count(),
      prismadb.user.count({ where: { createdAt: { gte: lastWeek } } }),
      prismadb.exam.count(),
      prismadb.exam.count({ where: { date: { gte: today } } }),
      prismadb.result.count(),
      prismadb.question.count(),
      prismadb.user.count({
        where: {
          isActive: false,
          role: { in: ['ADMIN', 'TEACHER'] }
        }
      }),
      prismadb.aIActivity.aggregate({
        _sum: { tokenCost: true }
      })
    ]);

    // Calculate AI usage
    const aiUsage = aiActivities._sum.tokenCost || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        newUsers,
        examsToday,
        aiUsage,
        pendingApprovals: pendingApprovalsCount,
        // Legacy fields if needed
        users: totalUsers,
        exams: totalExams,
        results: totalResults,
        questions: totalQuestions,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
} 