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
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
        }

        const user = await prismadb.user.findUnique({
            where: { email },
            include: { institute: true }
        });

        if (!user) {
            // For security reasons, don't reveal that the user doesn't exist
            return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Generate token and expiry (1 hour)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        await prismadb.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpires: expires,
            },
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

        await sendEmail({
            to: user.email!,
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

        return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
