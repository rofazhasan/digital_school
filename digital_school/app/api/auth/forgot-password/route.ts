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
            console.log('[FORGOT_PASSWORD] User not found for identifier:', identifier);
            return NextResponse.json({ message: 'No account found with that email or phone number.' }, { status: 404 });
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
            const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            console.log('[FORGOT_PASSWORD] Attempting to send email to:', user.email, 'Link:', resetLink);

            const emailResult = await sendEmail({
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

            if (!emailResult.success) {
                console.error('[FORGOT_PASSWORD] Email delivery failed:', emailResult.error);
                return NextResponse.json({
                    message: 'Failed to send recovery email. Please try again later.',
                    error: emailResult.error
                }, { status: 500 });
            }

            console.log('[FORGOT_PASSWORD] Email sent successfully to:', user.email);
            return NextResponse.json({
                message: 'A password reset link has been sent to your registered email.',
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
