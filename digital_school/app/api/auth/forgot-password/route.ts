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
        const token = Math.floor(100000 + Math.random() * 900000).toString(); // Always use 6-digit for commonality
        const expires = new Date(Date.now() + 3600000);

        // 1. If user has an email, send the professional email (Priority 1)
        if (user.email) {
            console.log('[FORGOT_PASSWORD] Priority 1: Attempting to send email to:', user.email);

            await prismadb.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: token,
                    passwordResetExpires: expires,
                    passwordResetApproved: true, // Email link is self-verifying
                },
            });

            const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

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

                if (emailResult.success) {
                    return NextResponse.json({
                        message: 'A password reset link has been sent to your registered email.',
                        type: 'email'
                    });
                }
                console.error('[FORGOT_PASSWORD] Email delivery failed:', emailResult.error);
            } catch (err) {
                console.error('[FORGOT_PASSWORD] Email crash:', err);
            }
        }

        // 2. If no email or email failed, try SMS (Priority 2)
        if (user.phone) {
            console.log('[FORGOT_PASSWORD] Priority 2: Attempting to send SMS to:', user.phone);

            await prismadb.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: token,
                    passwordResetExpires: expires,
                    passwordResetApproved: true, // SMS OTP is self-verifying
                },
            });

            try {
                const { buildOtpMessage } = await import('@/lib/sms');
                const instName = user.institute?.name || 'Digital School';
                const message = buildOtpMessage(token, instName);
                const smsResult = await sendSMS(user.phone, message);

                if (smsResult.success) {
                    return NextResponse.json({
                        message: `A password reset OTP has been sent to your registered phone number.`,
                        type: 'phone'
                    });
                }
                console.warn('[FORGOT_PASSWORD] SMS delivery failed, falling back to admin approval.');
            } catch (smsError) {
                console.error('[FORGOT_PASSWORD] SMS processing error:', smsError);
            }
        }

        // 3. Fallback: Admin Approval (Priority 3)
        console.log('[FORGOT_PASSWORD] Priority 3: Falling back to admin approval for user:', user.id);

        await prismadb.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpires: expires,
                passwordResetApproved: false, // Requires admin manual intervention
            },
        });

        try {
            // Find Super Admin to notify
            const superAdmin = await prismadb.user.findFirst({
                where: { role: 'SUPER_USER' },
                select: { email: true }
            });

            if (superAdmin?.email) {
                const { PasswordResetApprovalEmail } = await import('@/components/emails/PasswordResetApprovalEmail');
                await sendEmail({
                    to: superAdmin.email,
                    subject: `Password Reset Approval Required - ${user.name}`,
                    react: PasswordResetApprovalEmail({
                        userName: user.name,
                        userIdentifier: identifier,
                        institute: user.institute ? {
                            name: user.institute.name,
                            logoUrl: user.institute.logoUrl || undefined
                        } : undefined
                    }) as any,
                });
            }
        } catch (adminNotifyErr) {
            console.error('[FORGOT_PASSWORD] Failed to notify admin:', adminNotifyErr);
        }

        return NextResponse.json({
            message: 'SMS delivery failed. Your password reset request has been sent for admin approval. Please contact your administrator.',
            status: 'pending_approval'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
