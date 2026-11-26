import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !hasPermission(auth.user.role, 'SUPER_USER')) {
      return NextResponse.json({ error: 'Forbidden: SUPER_USER role required' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      message: 'Environment variables check completed',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
