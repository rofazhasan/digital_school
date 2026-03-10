/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP, stores it hashed in the DB, and sends via SMS.
 * The message format is: "Your {InstituteName} OTP is {otp}. Valid for 10 minutes."
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import { normalizePhone } from '@/lib/utils';
import { sendSMS, generateOTP, buildOtpMessage } from '@/lib/sms';
import bcrypt from 'bcryptjs';

const schema = z.object({
    phone: z.string().min(8),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone } = schema.parse(body);
        const normalizedPhone = normalizePhone(phone);

        // Find user by phone — also fetch institute for branded message
        const user = await (prismadb.user as any).findFirst({
            where: { OR: [{ phone: normalizedPhone }, { phone }] },
            select: {
                id: true,
                phone: true,
                instituteId: true,
                institute: { select: { name: true } },
            },
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

        // Build branded message: "Your {InstituteName} OTP is 123456. Valid for 10 minutes."
        const brandName = (user.institute as any)?.name || 'Digital School';
        const smsMessage = buildOtpMessage(otp, brandName);

        // Send SMS via BulkSMSBD
        const smsResult = await sendSMS(user.phone || normalizedPhone, smsMessage);

        if (!smsResult.success) {
            console.warn('[SEND-OTP] SMS failed:', smsResult.error, '| code:', smsResult.code);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to send OTP SMS',
                    detail: smsResult.error,
                    code: smsResult.code,
                },
                { status: 502 }
            );
        }

        console.log(`[SEND-OTP] OTP sent to ${user.phone || normalizedPhone} for ${brandName}`);
        return NextResponse.json({ success: true, message: 'OTP sent to your phone.' });

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
        }
        console.error('[SEND-OTP] Error:', err?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
