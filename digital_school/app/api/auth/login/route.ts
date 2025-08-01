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
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: `Invalid ${loginMethod} or password` },
                { status: 401 }
            );
        }
        
        // Create JWT token
        const token = await createToken({
            userId: user.id,
            email: user.email || '',
            role: user.role as JWTPayload['role'],
            instituteId: user.instituteId || undefined,
        });

        // Update last login time
        await prismadb.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
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
