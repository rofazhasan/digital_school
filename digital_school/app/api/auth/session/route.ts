import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const sessionToken = req.cookies.get('session-token')?.value;
        if (!sessionToken) {
            return NextResponse.json({ authenticated: false, status: 'no_token' }, { status: 401 });
        }

        const { status, user, lastSessionInfo } = await validateSession(sessionToken);

        if (status === 'valid' && user) {
            const response = NextResponse.json({
                authenticated: true,
                status: 'valid',
                user: user,
                sid: (user as any).activeSessionId
            });
            response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            return response;
        }

        if (status === 'mismatch') {
            return NextResponse.json({
                authenticated: false,
                status: 'mismatched',
                lastSessionInfo: lastSessionInfo
            }, { status: 401 });
        }

        return NextResponse.json({ authenticated: false, status: 'invalid' }, { status: 401 });
    } catch (error) {
        console.error('[SESSION_API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
