import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { PasswordResetEmail } from '@/components/emails/PasswordResetEmail';

/**
 * POST /api/auth/forgot-password
 * - Generates a secure reset token
 * - Saves token and expiration to user
 * - Sends Password Reset Email
 */
export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json({ message: 'Email or phone number is required.' }, { status: 400 });
        }

        const user = await prismadb.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            },
            include: { institute: true }
        });

        if (!user) {
            // For security reasons, don't reveal that the user doesn't exist
            return NextResponse.json({ message: 'If an account exists, instructions have been sent.' });
        }

        // Generate token and expiry (1 hour)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        await prismadb.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpires: expires,
            } as any, // Cast to any to avoid lint error if types are stale
        });

        // 1. If user has an email, send the professional email
        if (user.email) {
            const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

            await sendEmail({
                to: user.email,
                subject: 'Reset your password',
                react: PasswordResetEmail({
                    firstName: user.name.split(' ')[0],
                    resetLink,
                    institute: user.institute ? {
                        name: user.institute.name,
                        address: user.institute.address || undefined,
                        phone: user.institute.phone || undefined,
                        logoUrl: user.institute.logoUrl || undefined,
                    } : undefined
                }) as any,
            });

            return NextResponse.json({
                message: 'If an account exists with that email, a reset link has been sent.',
                type: 'email'
            });
        }

        // 2. If user has ONLY a phone, allow direct reset as per "no need verification" request
        // In a real production app, we would send an OTP here. 
        // For now, we provide the token back to the frontend to allow the "no verification" flow.
        return NextResponse.json({
            message: 'Direct reset enabled for your phone-based account.',
            type: 'phone',
            token: token // This allows the frontend to redirect directly to /reset-password?token=...
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
