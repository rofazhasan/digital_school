import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

/**
 * POST /api/auth/verify-otp
 * - Verifies the 6-digit SMS OTP
 * - Activates the user and marks as approved
 */
export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json({ message: 'Phone number and OTP are required.' }, { status: 400 });
        }

        // Find user with matching phone and pending verification token
        const user = await prismadb.user.findFirst({
            where: {
                phone: phone,
                verificationToken: otp,
                isActive: false
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Invalid OTP or phone number.' }, { status: 400 });
        }

        // Activate and approve the user
        await prismadb.user.update({
            where: { id: user.id },
            data: {
                isActive: true,
                isApproved: true,
                verificationToken: null // Clear token after success
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Phone number verified and account activated successfully.'
        });

    } catch (error) {
        console.error('[VERIFY_OTP_ERROR]', error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
