// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signupSchema, UserRole } from '@/lib/schemas/auth';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createToken, JWTPayload } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { sendEmail } from '@/lib/email';

/**
 * POST handler for production-ready user signup.
 * - Validates input with conditional logic for roles.
 * - Checks for existing user by email or phone number.
 * - Hashes password securely with bcrypt.
 * - Creates user in the database using Prisma.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the request body
        const validatedData = signupSchema.parse(body);

        // Check if user already exists by email (if email is provided)
        if (validatedData.email) {
            const existingUserByEmail = await (prismadb.user as any).findUnique({
                where: { email: validatedData.email }
            });

            if (existingUserByEmail) {
                return NextResponse.json(
                    { message: 'User with this email already exists.' },
                    { status: 400 }
                );
            }
        }

        // Check if user already exists by phone (if phone is provided)
        if (validatedData.phone) {
            const existingUserByPhone = await (prismadb.user as any).findUnique({
                where: { phone: validatedData.phone }
            });

            if (existingUserByPhone) {
                return NextResponse.json(
                    { message: 'User with this phone number already exists.' },
                    { status: 400 }
                );
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        // Generate verification token if email is provided
        const verificationToken = validatedData.email ? crypto.randomUUID() : null;

        // Create user data
        const userData: any = {
            name: validatedData.name,
            password: hashedPassword,
            role: validatedData.role,
            isActive: false, // Default to inactive for self-signup until verified/approved
            emailVerified: !validatedData.email, // If no email, mark as verified (or handled by approval)
            isApproved: !validatedData.phone, // If no phone, mark as approved (or handled by verification)
            verificationToken,
            institute: validatedData.instituteId ? { connect: { id: validatedData.instituteId } } : undefined,
        };

        // Add email or phone based on what's provided (only if not empty)
        if (validatedData.email && validatedData.email.trim() !== '') {
            userData.email = validatedData.email.trim();
        }
        if (validatedData.phone && validatedData.phone.trim() !== '') {
            userData.phone = validatedData.phone.trim();
        }

        // Add student-specific fields if role is STUDENT
        /* ... roll/reg logic same ... */
        if (validatedData.role === UserRole.STUDENT) {
            try {
                // First, we need to find or create the class
                let classRecord = await (prismadb.class as any).findFirst({
                    where: {
                        name: validatedData.class!,
                        section: validatedData.section!,
                    }
                });

                if (!classRecord) {
                    // Create a default institute if none exists
                    let institute = await prismadb.institute.findFirst();
                    if (!institute) {
                        institute = await (prismadb.institute as any).create({
                            data: {
                                name: "Default Institute",
                                email: "default@institute.com",
                            }
                        });
                    }

                    classRecord = await (prismadb.class as any).create({
                        data: {
                            name: validatedData.class!,
                            section: validatedData.section!,
                            instituteId: (institute as any).id,
                        }
                    });
                }

                userData.studentProfile = {
                    create: {
                        roll: validatedData.roll!.toString(), // Convert to string as per schema
                        registrationNo: `REG${Date.now()}`, // Generate a unique registration number
                        guardianName: validatedData.name, // Use name as guardian name for now
                        guardianPhone: validatedData.phone || validatedData.email || '', // Use phone or email as fallback
                        class: { connect: { id: classRecord.id } },
                    }
                };
            } catch (classError) {
                console.error('Error creating/finding class:', classError);
                return NextResponse.json(
                    { message: 'Error creating student profile. Please try again.' },
                    { status: 500 }
                );
            }
        }

        // Add teacher-specific fields if role is TEACHER
        if (validatedData.role === UserRole.TEACHER) {
            userData.teacherProfile = {
                create: {
                    employeeId: `EMP${Date.now()}`, // Generate a unique employee ID
                    department: "General", // Default department
                    subjects: ["General"], // Default subjects
                }
            };
        }

        // Create the user
        const user = await (prismadb.user as any).create({
            data: userData,
            include: {
                studentProfile: validatedData.role === UserRole.STUDENT,
                teacherProfile: validatedData.role === UserRole.TEACHER,
            }
        });

        // Create Session ID and Token for Auto-Login
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

        const token = await createToken({
            userId: user.id,
            email: user.email || '',
            role: user.role as JWTPayload['role'],
            instituteId: user.instituteId || undefined,
            sid: sessionId,
            verified: (user as any).emailVerified,
            approved: (user as any).isApproved,
        });

        // Update user session in DB
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                activeSessionId: sessionId,
                lastSessionInfo: sessionInfo
            },
        });

        // Remove password from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;

        // Send Verification Email if email is provided
        if (user.email && verificationToken) {
            try {
                const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;

                // Fetch institute data if associated
                let institute = undefined;
                if (user.instituteId) {
                    const inst = await (prismadb.institute as any).findUnique({
                        where: { id: user.instituteId },
                        select: { name: true, address: true, phone: true, logoUrl: true }
                    });
                    if (inst) institute = inst;
                }

                await sendEmail({
                    to: user.email,
                    subject: `Verify your email - ${institute?.name || 'Digital School'}`,
                    react: WelcomeEmail({
                        firstName: user.name.split(' ')[0],
                        institute: institute as any,
                        verificationLink // Pass the link to the email template
                    }) as any,
                });
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
            }
        }

        const response = NextResponse.json(
            {
                message: 'Account created successfully. ' +
                    (user.email ? 'Please check your email to verify your account. ' : '') +
                    (user.phone ? 'Your account is pending admin approval.' : ''),
                user: userWithoutPassword,
                token
            },
            { status: 201 }
        );

        // Set session token in cookies for auto-login
        response.cookies.set('session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;

    } catch (error: unknown) {
        console.error('Signup error:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            // ZodError has an 'errors' property
            const zodError = error as any; // Safe cast if we know name is ZodError
            return NextResponse.json(
                { message: 'Validation failed.', errors: zodError.errors },
                { status: 400 }
            );
        }

        // Handle Prisma-specific errors safely
        // P2002: Unique constraint failed
        const prismaError = error as any;
        if (prismaError && typeof prismaError === 'object' && prismaError.code === 'P2002') {
            const target = prismaError.meta?.target;
            const field = Array.isArray(target) ? target[0] : 'field';
            return NextResponse.json(
                { message: `A user with this ${field} already exists.` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
