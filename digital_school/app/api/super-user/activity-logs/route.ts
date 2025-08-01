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

    // Get recent activity logs (last 20)
    const activityLogs = await prismadb.log.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        action: true,
        context: true,
        timestamp: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Transform data to match frontend expectations
    const transformedLogs = activityLogs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user?.name || 'Unknown',
      details: JSON.stringify(log.context || {}),
      timestamp: log.timestamp,
      type: 'SYSTEM' // Default type, could be determined from action
    }));

    return NextResponse.json(transformedLogs);
  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
} 