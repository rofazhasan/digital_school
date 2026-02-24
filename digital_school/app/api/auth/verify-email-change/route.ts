import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/db-init";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    try {
        const prismadb = await getDatabaseClient();
        const user = await (prismadb.user as any).findUnique({
            where: { emailChangeToken: token }
        });

        if (!user || !user.pendingEmail) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        // Apply new email and clear pending
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailChangeToken: null,
                emailVerified: true // The new email is verified by clicking the link
            }
        });

        return NextResponse.redirect(new URL('/login?success=email_updated', request.url));
    } catch (error) {
        console.error('Email change verification error:', error);
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }
}
