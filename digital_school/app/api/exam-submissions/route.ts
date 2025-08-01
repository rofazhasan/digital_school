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
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Fetch exam submissions for this student
    const submissions = await db.examSubmission.findMany({
      where: {
        studentId: user.studentProfile.id
      },
      select: {
        examId: true,
        studentId: true,
        submittedAt: true,
        score: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json({
      submissions
    });

  } catch (error) {
    console.error('Error fetching exam submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 