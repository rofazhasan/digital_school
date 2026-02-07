import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createToken, JWTPayload } from '@/lib/auth';

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

        // Find user by email or phone
        const user = await prismadb.user.findFirst({
            where: loginMethod === 'email'
                ? { email: identifier }
                : { phone: identifier },
            select: {
                id: true,
                email: true,
                phone: true,
                password: true,
                name: true,
                role: true,
                isActive: true,
                instituteId: true,
                institute: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                studentProfile: {
                    select: {
                        id: true,
                        roll: true,
                        registrationNo: true,
                        class: {
                            select: {
                                id: true,
                                name: true,
                                section: true,
                            },
                        },
                    },
                },
                teacherProfile: {
                    select: {
                        id: true,
                        employeeId: true,
                        department: true,
                        subjects: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: `Invalid ${loginMethod} or password` },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is deactivated. Please contact administrator.' },
                { status: 401 }
            );
        }

        // Check for maintenance mode
        if (user.role === 'STUDENT' || user.role === 'TEACHER') {
            const settings = await prismadb.settings.findFirst({
                select: { maintenanceMode: true }
            });

            if (settings?.maintenanceMode) {
                return NextResponse.json(
                    { error: 'System is currently under maintenance. Please try again later.' },
                    { status: 503 }
                );
            }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: `Invalid ${loginMethod} or password` },
                { status: 401 }
            );
        }

        // Create Session ID
        const { v4: uuidv4 } = require('uuid');
        const sessionId = uuidv4();

        // Get device info
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';

        // Simple device name parser
        let deviceName = 'PC/Browser';
        if (userAgent.includes('iPhone')) deviceName = 'iPhone';
        else if (userAgent.includes('Android')) deviceName = 'Android Phone';
        else if (userAgent.includes('iPad')) deviceName = 'iPad';
        else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
        else if (userAgent.includes('Windows')) deviceName = 'Windows PC';

        const sessionInfo = {
            device: deviceName,
            ip: ip,
            time: new Date().toISOString(),
            userAgent: userAgent
        };

        // Emit forced-logout to previous session via Socket.io
        try {
            const { socketService } = require('@/lib/socket');
            socketService.sendNotificationToUser(user.id, {
                type: 'forced-logout',
                message: `A device logged in: ${ip} with ${deviceName} at ${new Date().toLocaleTimeString()}`,
                info: sessionInfo
            });
        } catch (socketError) {
            console.error('[LOGIN] Failed to emit forced-logout:', socketError);
        }

        // Create JWT token
        const token = await createToken({
            userId: user.id,
            email: user.email || '',
            role: user.role as JWTPayload['role'],
            instituteId: user.instituteId || undefined,
            sid: sessionId
        });

        // Update user session in DB
        await prismadb.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                activeSessionId: sessionId,
                lastSessionInfo: sessionInfo
            },
        });

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
    } catch (error) {
        console.error('Login error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
