import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const user = await db.user.findUnique({
      where: { id: token.user.id },
      include: {
        studentProfile: true
      }
    });

    if (!user || !user.studentProfile) {
      console.log(`[API_RESULTS] No student profile found for user ${token.user.id}, returning empty results`);
      return NextResponse.json({ results: [] });
    }

    // Fetch results for this student
    const results = await db.result.findMany({
      where: {
        studentId: user.studentProfile.id
      },
      select: {
        examId: true,
        total: true,
        grade: true,
        rank: true,
        isPublished: true,
        percentage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      results
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 