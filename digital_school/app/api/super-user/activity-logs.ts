import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prismadb.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { user: true },
    });

    const result = logs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user?.name || '',
      details: typeof log.context === 'object' && log.context !== null && 'details' in log.context ? log.context.details : '',
      timestamp: log.timestamp.toISOString(),
      type: log.action,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
} 