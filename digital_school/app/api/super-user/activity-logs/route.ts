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

    // Get recent activity logs (last 100)
    const activityLogs = await prismadb.log.findMany({
      take: 100,
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
    const transformedLogs = activityLogs.map(log => {
      let action = log.action.toString();
      let type: 'EXAM' | 'USER' | 'SYSTEM' | 'AI' = 'SYSTEM';
      const context = log.context as any;

      if (context?.type === 'SYSTEM_AUDIT') {
        action = 'SYSTEM_AUDIT';
        type = 'SYSTEM';
      } else if (action.includes('EXAM') || action.includes('SUBMISSION')) {
        type = 'EXAM';
      } else if (action.includes('USER') || action.includes('LOGIN') || action.includes('REGISTER')) {
        type = 'USER';
      } else if (action.includes('AI') || action.includes('GENERAT')) {
        type = 'AI';
      }

      return {
        id: log.id,
        action: action,
        user: log.user?.name || 'Unknown',
        details: JSON.stringify(log.context || {}),
        timestamp: log.timestamp,
        type: type
      };
    });

    return NextResponse.json(transformedLogs);
  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
} 