import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await getTokenFromRequest(request);
  if (!auth || !hasPermission(auth.user.role, 'SUPER_USER')) {
    return NextResponse.json({ error: 'Forbidden: SUPER_USER role required' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    message: 'Authenticated diagnostic endpoint active',
    timestamp: new Date().toISOString(),
  });
}
