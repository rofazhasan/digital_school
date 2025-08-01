import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { analyticsService, AnalyticsFilters } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getTokenFromRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');
    const questionType = searchParams.get('questionType');
    const difficulty = searchParams.get('difficulty');

    // Build filters
    const filters: AnalyticsFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      subject: subject || undefined,
      questionType: questionType || undefined,
      difficulty: difficulty || undefined
    };

    // For teachers, only show their own questions
    if (user.role === 'TEACHER') {
      filters.userId = user.id;
    }

    const analytics = await analyticsService.getQuestionAnalytics(filters);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Question analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question analytics' },
      { status: 500 }
    );
  }
} 