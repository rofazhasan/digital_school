import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createToken, JWTPayload } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from '@/lib/socket';

const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or phone number is required'),
    password: z.string().min(1, 'Password is required'),
    loginMethod: z.enum(['email', 'phone']).optional().default('email'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, password, loginMethod = 'email' } = loginSchema.parse(body);

        // Validate identifier based on login method
        if (loginMethod === 'email') {
            const emailSchema = z.string().email('Invalid email address');
            emailSchema.parse(identifier);
        } else {
            // Basic phone validation
            const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format');
            phoneSchema.parse(identifier);
        }

        // ... find user logic ...
        // [Existing code for finding user and verifying password]
        const user = await (prismadb.user as any).findFirst({
            where: loginMethod === 'email'
                ? { email: identifier }
                : { phone: identifier },
            include: {
                institute: { select: { id: true, name: true } },
                studentProfile: {
                    select: {
                        id: true, roll: true, registrationNo: true,
                        class: { select: { id: true, name: true, section: true } },
                    },
                },
                teacherProfile: {
                    select: { id: true, employeeId: true, department: true, subjects: true },
                },
            }
        });

        if (!user) {
            return NextResponse.json({ error: `Invalid ${loginMethod} or password` }, { status: 401 });
        }

        // Check if account is deactivated (not just pending)
        // If isActive is false, it could be pending or deactivated.
        // For now, let's assume isActive: true is required for general access,
        // but we'll check credentials first.

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: `Invalid ${loginMethod} or password` }, { status: 401 });
        }

        // Re-read requirements: "if both of two not meet he wont login if login a page come verify"
        // This implies they CAN login (enter password) but get a "verify" page.
        // So we allow token creation even if !isActive or !verified.

        // Create Session ID
        const sessionId = uuidv4();

        // Get device info
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';

        let deviceName = 'PC/Browser';
        if (userAgent.includes('iPhone')) deviceName = 'iPhone';
        else if (userAgent.includes('Android')) deviceName = 'Android Phone';
        else if (userAgent.includes('iPad')) deviceName = 'iPad';
        else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
        else if (userAgent.includes('Windows')) deviceName = 'Windows PC';

        const sessionInfo = {
            device: deviceName, ip, time: new Date().toISOString(), userAgent
        };

        // Emit forced-logout to previous session
        try {
            socketService.sendNotificationToUser(user.id, {
                type: 'forced-logout',
                message: `New login: ${deviceName} at ${new Date().toLocaleTimeString()}`,
                info: sessionInfo
            });
        } catch (socketError) {
            console.warn('[LOGIN] Socket emission failed:', socketError);
        }

        // Create JWT token
        const token = await createToken({
            userId: user.id,
            email: user.email || '',
            role: user.role as JWTPayload['role'],
            instituteId: user.instituteId || undefined,
            sid: sessionId,
            verified: (user as any).emailVerified,
            approved: (user as any).isApproved,
        });

        // Update user session in DB - DEFENSIVE WRAPPER
        try {
            console.log('[LOGIN] Updating session for user:', user.id, 'sid:', sessionId);
            await prismadb.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    activeSessionId: sessionId,
                    lastSessionInfo: sessionInfo
                } as any,
            });
            console.log('[LOGIN] Session updated successfully in DB');
        } catch (dbError: any) {
            console.error('[LOGIN] DB Session update failed:', dbError.message);
        }

        // Return user data without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...userWithoutPassword } = user;

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        });

        // Set session token in cookies
        response.cookies.set('session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
