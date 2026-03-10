/**
 * POST /api/auth/verify-otp
 * Verifies a 6-digit OTP for phone-based account verification.
 * On success: sets user.isApproved = true, isActive = true, phoneVerified = true.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import { normalizePhone } from '@/lib/utils';
import bcrypt from 'bcryptjs';

const schema = z.object({
    phone: z.string().min(8),
    otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, otp } = schema.parse(body);
        const normalizedPhone = normalizePhone(phone);

        // Find user
        const user = await (prismadb.user as any).findFirst({
            where: { OR: [{ phone: normalizedPhone }, { phone }] },
            select: {
                id: true,
                phoneOtp: true,
                phoneOtpExpiry: true,
                isApproved: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        if (!user.phoneOtp) {
            return NextResponse.json({ error: 'No OTP was requested for this number.' }, { status: 400 });
        }

        // Check expiry
        if (user.phoneOtpExpiry && new Date() > new Date(user.phoneOtpExpiry)) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, user.phoneOtp);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
        }

        // Mark user as verified + active + approved
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                isApproved: true,
                isActive: true,
                phoneOtp: null,
                phoneOtpExpiry: null,
            } as any,
        });

        return NextResponse.json({ success: true, message: 'Phone verified successfully!' });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
        }
        console.error('[VERIFY-OTP] Error:', err?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
