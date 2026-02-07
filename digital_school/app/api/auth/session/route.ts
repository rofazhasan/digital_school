import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const tokenData = await getTokenFromRequest(req);

        if (!tokenData) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: tokenData.user,
            sid: tokenData.user.activeSessionId // Return the sid from the DB for client-side comparison
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
