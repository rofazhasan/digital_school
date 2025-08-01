import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated first
    const authHeader = request.headers.get('authorization');
    const hasAuth = !!authHeader;
    
    // Only show environment info to authenticated users
    if (!hasAuth) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required to view environment info'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      message: 'Environment variables check completed'
    });

  } catch (error) {
    console.error('Test Env Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 