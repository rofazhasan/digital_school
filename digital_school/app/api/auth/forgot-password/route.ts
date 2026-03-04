import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
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
        // For phone users, we'll use a 6-digit numeric OTP for better SMS compatibility
        const isPhoneUser = !!(user.phone && !user.email);
        const token = isPhoneUser
            ? Math.floor(100000 + Math.random() * 900000).toString()
            : crypto.randomBytes(32).toString('hex');

        const expires = new Date(Date.now() + 3600000);

        await prismadb.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpires: expires,
            } as any,
        });

        // 1. If user has an email, send the professional email
        if (user.email) {
            const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            console.log('[FORGOT_PASSWORD] Attempting to send email to:', user.email);

            try {
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
                        message: 'Failed to send recovery email. Please ensure your email configuration (GMAIL_USER/GMAIL_APP_PASSWORD) is correct.',
                        error: (emailResult.error as any)?.message || String(emailResult.error)
                    }, { status: 500 });
                }
            } catch (renderError: any) {
                console.error('[FORGOT_PASSWORD] Email rendering/sending crash:', renderError);
                return NextResponse.json({
                    message: 'Internal error during email generation.',
                    details: renderError.message || 'Unknown render error'
                }, { status: 500 });
            }

            console.log('[FORGOT_PASSWORD] Email sent successfully to:', user.email);
            return NextResponse.json({
                message: 'A password reset link has been sent to your registered email.',
                type: 'email'
            });
        }

        // 2. If user has ONLY a phone, try to send SMS first
        if (user.phone) {
            console.log('[FORGOT_PASSWORD] Attempting to send SMS to:', user.phone);
            try {
                const instName = user.institute?.name || 'Digital School';
                // Follow specific provider format: (Your {Brand/Company Name} OTP is XXXX)
                const message = `Your ${instName} OTP is ${token}`;
                const smsResult = await sendSMS(user.phone, message);

                if (smsResult.success) {
                    return NextResponse.json({
                        message: `A password reset OTP has been sent to your registered phone number.`,
                        type: 'phone'
                    });
                }
                console.warn('[FORGOT_PASSWORD] SMS delivery failed, falling back to direct reset.');
            } catch (smsError) {
                console.error('[FORGOT_PASSWORD] SMS processing error:', smsError);
            }
        }

        // 3. Fallback: If user has ONLY a phone (and SMS failed or was skipped), 
        // allow direct reset as per "previously approval service" (existing bypass logic)
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
