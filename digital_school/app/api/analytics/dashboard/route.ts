import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { analyticsService } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getTokenFromRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authResult;

    // Get dashboard stats
    const stats = await analyticsService.getDashboardStats(user.instituteId);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
} 