import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    try {
        const user = await (prismadb.user as any).findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        // Update user status
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                // Automatically activate if no phone or if already approved
                isActive: user.isApproved ? true : user.isActive,
            }
        });

        // Redirect to success page or login with success message
        return NextResponse.redirect(new URL('/login?success=email_verified', request.url));
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }
}
