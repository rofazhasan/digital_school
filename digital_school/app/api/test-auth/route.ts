import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth API called:', { 
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    const token = await getTokenFromRequest(request);
    
    console.log('🔍 Test Auth Token result:', { 
      hasToken: !!token,
      userRole: token?.user?.role,
      userId: token?.user?.id,
      userEmail: token?.user?.email
    });
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'No valid token found in request'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: token.user.id,
        name: token.user.name,
        email: token.user.email,
        role: token.user.role
      },
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Test Auth Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 