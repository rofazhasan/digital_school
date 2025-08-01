// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signupSchema, UserRole } from '@/lib/schemas/auth';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

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
            const existingUserByEmail = await prismadb.user.findUnique({
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
            const existingUserByPhone = await prismadb.user.findUnique({
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
        
        // Create user data
        const userData: Prisma.UserCreateInput = {
            name: validatedData.name,
            password: hashedPassword,
            role: validatedData.role,
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
        if (validatedData.role === UserRole.STUDENT) {
            try {
                // First, we need to find or create the class
                let classRecord = await prismadb.class.findFirst({
                    where: {
                        name: validatedData.class!,
                        section: validatedData.section!,
                    }
                });
                
                if (!classRecord) {
                    // Create a default institute if none exists
                    let institute = await prismadb.institute.findFirst();
                    if (!institute) {
                        institute = await prismadb.institute.create({
                            data: {
                                name: "Default Institute",
                                email: "default@institute.com",
                            }
                        });
                    }
                    
                    classRecord = await prismadb.class.create({
                        data: {
                            name: validatedData.class!,
                            section: validatedData.section!,
                            instituteId: institute.id,
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
        const user = await prismadb.user.create({
            data: userData,
            include: {
                studentProfile: validatedData.role === UserRole.STUDENT,
                teacherProfile: validatedData.role === UserRole.TEACHER,
            }
        });
        
        // Remove password from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        
        return NextResponse.json(
            { 
                message: 'User created successfully.',
                user: userWithoutPassword 
            },
            { status: 201 }
        );
        
    } catch (error: unknown) {
        console.error('Signup error:', error);
        
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { message: 'Validation failed.', errors: (error as { errors: unknown[] }).errors },
                { status: 400 }
            );
        }
        
        // Handle Prisma-specific errors
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002') {
            const field = ((error as { meta: { target: unknown[] } }).meta as { target: string[] })?.target?.[0];
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
