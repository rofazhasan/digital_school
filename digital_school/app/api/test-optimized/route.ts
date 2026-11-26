import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';
import prismadb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !hasPermission(auth.user.role, 'SUPER_USER')) {
      return NextResponse.json({ error: 'Forbidden: SUPER_USER role required' }, { status: 403 });
    }

    const startTime = Date.now();
    const [examCount, userCount] = await Promise.all([
      prismadb.exam.count(),
      prismadb.user.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: { examCount, userCount, timestamp: new Date().toISOString() },
      responseTime: `${Date.now() - startTime}ms`,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 });
  }
}
