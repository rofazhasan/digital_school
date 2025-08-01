import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    
    if (!authData || authData.user.role !== 'SUPER_USER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prismadb = await getDatabaseClient();

    // Get AI usage statistics
    const aiActivities = await prismadb.aIActivity.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        activityType: true,
        usageCount: true,
        tokenCost: true,
        responseTime: true,
        success: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Transform data to match frontend expectations
    const transformedUsage = aiActivities.map(activity => ({
      userId: activity.user?.id || 'unknown',
      userName: activity.user?.name || 'Unknown',
      tokensUsed: activity.tokenCost || 0,
      requests: activity.usageCount || 1,
      lastUsed: activity.createdAt
    }));

    return NextResponse.json(transformedUsage);
  } catch (error) {
    console.error('AI usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage data' },
      { status: 500 }
    );
  }
} 