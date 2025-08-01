import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabaseClient } from '@/lib/db-init';
import { createToken, JWTPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('[SETUP API] Starting super user creation process');
    
    const body = await request.json();
    const { name, email, password, institute } = body;

    // Validate input
    if (!name || !email || !password) {
      console.log('[SETUP API] Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate institute data
    if (!institute || !institute.name) {
      console.log('[SETUP API] Missing institute name');
      return NextResponse.json(
        { error: 'Institute name is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    console.log('[SETUP API] Checking environment variables...');
    if (!process.env.DATABASE_URL) {
      console.error('[SETUP API] DATABASE_URL not set');
      return NextResponse.json(
        { error: 'Database configuration error. DATABASE_URL environment variable is not set.' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('[SETUP API] JWT_SECRET not set');
      return NextResponse.json(
        { error: 'Authentication configuration error. JWT_SECRET environment variable is not set.' },
        { status: 500 }
      );
    }

    console.log('[SETUP API] Environment variables check passed');

    // Get database client with automatic initialization
    console.log('[SETUP API] Connecting to database...');
    const prismadb = await getDatabaseClient();
    console.log('[SETUP API] Database connection successful');

    // Check if super user already exists
    console.log('[SETUP API] Checking for existing super user...');
    const existingSuperUser = await prismadb.user.findFirst({
      where: { role: 'SUPER_USER' }
    });

    if (existingSuperUser) {
      console.log('[SETUP API] Super user already exists:', existingSuperUser.email);
      return NextResponse.json(
        { error: 'Super user already exists. Only one super user can be created.' },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    console.log('[SETUP API] Checking for existing user with email...');
    const existingUser = await prismadb.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('[SETUP API] User with email already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('[SETUP API] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create institute with provided data
    console.log('[SETUP API] Creating institute...');
    const createdInstitute = await prismadb.institute.create({
      data: {
        name: institute.name,
        email: institute.email || null,
        phone: institute.phone || null,
        address: institute.address || null,
        website: institute.website || null,
      }
    });
    console.log('[SETUP API] Institute created:', createdInstitute.id);

    // Create super user
    console.log('[SETUP API] Creating super user...');
    const superUser = await prismadb.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SUPER_USER',
        instituteId: createdInstitute.id,
        isActive: true,
      },
      include: {
        institute: true,
      }
    });
    console.log('[SETUP API] Super user created:', superUser.id);

    // Update institute with super user
    console.log('[SETUP API] Updating institute with super user...');
    await prismadb.institute.update({
      where: { id: createdInstitute.id },
      data: { superUserId: superUser.id }
    });

    // Create JWT token
    console.log('[SETUP API] Creating JWT token...');
    const token = await createToken({
      userId: superUser.id,
      email: superUser.email || '',
      role: superUser.role as JWTPayload['role'],
      instituteId: superUser.instituteId || undefined,
    });
    console.log('[SETUP API] JWT token created successfully');

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = superUser;

    // Create response with cookie
    const response = NextResponse.json({
      message: 'Super user and institute created successfully',
      user: userWithoutPassword,
      institute: createdInstitute,
      token,
    });

    // Set session token in cookies
    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log('[SETUP API] Setup completed successfully');
    return response;

  } catch (error) {
    console.error('[SETUP API] Error during super user creation:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        return NextResponse.json(
          { error: 'Database configuration error. Please check your DATABASE_URL environment variable.' },
          { status: 500 }
        );
      }
      if (error.message.includes('JWT_SECRET')) {
        return NextResponse.json(
          { error: 'Authentication configuration error. Please check your JWT_SECRET environment variable.' },
          { status: 500 }
        );
      }
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error. Please check your database configuration and ensure the database is accessible.' },
          { status: 500 }
        );
      }
      if (error.message.includes('schema')) {
        return NextResponse.json(
          { error: 'Database schema error. Please run database migrations: npx prisma migrate deploy' },
          { status: 500 }
        );
      }
      if (error.message.includes('bcrypt')) {
        return NextResponse.json(
          { error: 'Password hashing error. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please check the server logs for more details.' },
      { status: 500 }
    );
  }
} 