/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit OTP to the given phone number.
 * Stores hashed OTP in the user's record (phoneOtp + phoneOtpExpiry fields).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import { normalizePhone } from '@/lib/utils';
import { sendSMS, generateOTP } from '@/lib/sms';
import bcrypt from 'bcryptjs';

const schema = z.object({
    phone: z.string().min(8),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone } = schema.parse(body);
        const normalizedPhone = normalizePhone(phone);

        // Find user by phone
        const user = await (prismadb.user as any).findFirst({
            where: { OR: [{ phone: normalizedPhone }, { phone }] },
            select: { id: true, phone: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found with this phone number.' }, { status: 404 });
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store hashed OTP in DB
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                phoneOtp: hashedOtp,
                phoneOtpExpiry: expiry,
            } as any,
        });

        // Send SMS
        const smsMessage = `Your Digital School verification code is: ${otp}. Valid for 10 minutes.`;
        const smsResult = await sendSMS(normalizedPhone, smsMessage);

        if (!smsResult.success) {
            console.warn('[SEND-OTP] SMS failed:', smsResult.error);
            // Return error so caller knows to fall back
            return NextResponse.json(
                { success: false, error: 'Failed to send SMS', detail: smsResult.error },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, message: 'OTP sent to your phone.' });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
        }
        console.error('[SEND-OTP] Error:', err?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
