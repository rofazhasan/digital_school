import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !hasPermission(auth.user.role, 'SUPER_USER')) {
      return NextResponse.json({ error: 'Forbidden: SUPER_USER role required' }, { status: 403 });
    }

    const prismadb = await getDatabaseClient();
    const userCount = await prismadb.user.count();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: 'Database check failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
