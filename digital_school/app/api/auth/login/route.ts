import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createToken, JWTPayload, verifyToken, validateSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from '@/lib/socket';
import { normalizePhone } from '@/lib/utils';

const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or phone number is required'),
    password: z.string().min(1, 'Password is required'),
    loginMethod: z.enum(['email', 'phone']).optional().default('email'),
    forceLogin: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, password, loginMethod = 'email', forceLogin = false } = loginSchema.parse(body);

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
        // For phone login, normalize the number so +8801794678595 and 01794678595 are equivalent
        const normalizedPhone = loginMethod === 'phone' ? normalizePhone(identifier) : identifier;

        let user;
        try {
            const phoneWhere = loginMethod === 'phone'
                ? { OR: [{ phone: normalizedPhone }, { phone: identifier }] }
                : {};
            user = await (prismadb.user as any).findFirst({
                where: loginMethod === 'email'
                    ? { email: identifier }
                    : phoneWhere,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    password: true,
                    role: true,
                    name: true,
                    isActive: true,
                    emailVerified: true,
                    isApproved: true,
                    instituteId: true,
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
        } catch (dbError: any) {
            console.warn('[LOGIN] Initial findFirst failed, trying minimal select.', dbError.message);
            user = await (prismadb.user as any).findFirst({
                where: loginMethod === 'email'
                    ? { email: identifier }
                    : { OR: [{ phone: normalizedPhone }, { phone: identifier }] }
            });
        }

        if (!user) {
            return NextResponse.json({ error: `Invalid ${loginMethod} or password` }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: `Invalid ${loginMethod} or password` }, { status: 401 });
        }

        // Check if student is actively in an exam session
        // Strictly applies ONLY to student accounts
        if (user.role === 'STUDENT' && !forceLogin) {
            try {
                let studentProfileId = user.studentProfile?.id;
                if (!studentProfileId) {
                    const sp = await (prismadb.studentProfile as any).findUnique({
                        where: { userId: user.id },
                        select: { id: true }
                    });
                    studentProfileId = sp?.id;
                }

                const candidateStudentIds: string[] = [user.id];
                if (studentProfileId && studentProfileId !== user.id) {
                    candidateStudentIds.push(studentProfileId);
                }

                const now = new Date();
                const activeSubmission = await prismadb.examSubmission.findFirst({
                    where: {
                        studentId: { in: candidateStudentIds },
                        OR: [
                            { status: 'IN_PROGRESS' },
                            { objectiveStatus: 'IN_PROGRESS' },
                            { cqSqStatus: 'IN_PROGRESS' }
                        ],
                        exam: {
                            isActive: true,
                            startTime: { lte: now },
                            endTime: { gte: now }
                        }
                    },
                    include: {
                        exam: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                objectiveTime: true,
                                cqSqTime: true,
                                endTime: true
                            }
                        }
                    }
                });

                if (activeSubmission && activeSubmission.exam) {
                    const exam = activeSubmission.exam;
                    const nowMs = now.getTime();
                    const examEndMs = new Date(exam.endTime).getTime();

                    const startedAt = (activeSubmission as any).objectiveStartedAt ||
                        (activeSubmission as any).cqSqStartedAt ||
                        (activeSubmission as any).createdAt;

                    let isExpired = false;
                    if (startedAt) {
                        const startMs = new Date(startedAt).getTime();
                        const effectiveMinutes = (Number(exam.objectiveTime || 0) > 0 && Number(exam.cqSqTime || 0) > 0)
                            ? Number(exam.objectiveTime) + Number(exam.cqSqTime)
                            : (Number(exam.duration) || 0);
                        if (effectiveMinutes > 0 && nowMs > startMs + effectiveMinutes * 60 * 1000) {
                            isExpired = true;
                        }
                    }
                    if (nowMs > examEndMs) {
                        isExpired = true;
                    }

                    if (!isExpired) {
                        return NextResponse.json({
                            requiresExamConfirmation: true,
                            examName: exam.name,
                            message: `The student is in ${exam.name}. Are you still want to login? Logging in will automatically disconnect their active exam on the other device.`
                        }, { status: 200 });
                    }
                }
            } catch (examCheckErr) {
                console.warn('[LOGIN] Active exam check non-blocking error:', examCheckErr);
            }
        }

        // Check if user already has an active valid session on this device for the exact same user account
        const existingSessionToken = request.cookies.get('session-token')?.value;
        if (existingSessionToken) {
            try {
                const existingTokenData = await verifyToken(existingSessionToken);
                if (existingTokenData && existingTokenData.userId === user.id) {
                    const sessionValidation = await validateSession(existingSessionToken);
                    if (sessionValidation.status === 'valid') {
                        console.log(`[LOGIN] User ${user.id} is already logged in on this device. Reusing existing session.`);
                        const { password: _password, ...userWithoutPassword } = user;
                        return NextResponse.json({
                            message: 'Already logged in',
                            user: userWithoutPassword,
                            token: existingSessionToken,
                            alreadyLoggedIn: true
                        });
                    }
                }
            } catch (err) {
                console.warn('[LOGIN] Existing session verification non-blocking error:', err);
            }
        }

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
            verified: (user as any).emailVerified !== false,
            approved: (user as any).isApproved !== false,
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
        console.error('[LOGIN_ERROR] Type:', error?.constructor?.name);
        console.error('[LOGIN_ERROR] Message:', error.message);

        if (error.message?.toLowerCase().includes('column') || error.message?.toLowerCase().includes('field')) {
            console.error('[CRITICAL] Database schema mismatch detected! Please run "npx prisma db push" or "npx prisma migrate deploy" in production.');
        }

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
