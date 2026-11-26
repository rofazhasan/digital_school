import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid token found in request' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: token.user.id,
        name: token.user.name,
        email: token.user.email,
        role: token.user.role,
      },
      message: 'Authentication successful',
    });
  } catch {
    return NextResponse.json({ error: 'Authentication verification failed' }, { status: 500 });
  }
}
