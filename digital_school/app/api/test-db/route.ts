import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const prismadb = await getDatabaseClient();
    
    // Test a simple query
    const userCount = await prismadb.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 