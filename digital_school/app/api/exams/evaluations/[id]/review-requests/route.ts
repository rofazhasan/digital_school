import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Extremely robust params handling for Next.js 14/15
    const params = await (context.params || {});
    const examId = params.id;

    if (!examId) {
      return NextResponse.json({ error: 'Missing exam ID' }, { status: 400 });
    }

    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission
    const user = await db.user.findUnique({
      where: { id: token.user.id },
      select: { role: true }
    });

    if (!user || !['TEACHER', 'ADMIN', 'SUPER_USER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log(`[DEBUG] Fetching reviews for exam: ${examId}`);

    // Fetch review requests with absolute minimum include first to isolate error
    const reviewRequests = await (db as any).resultReview.findMany({
      where: { examId: examId },
      include: {
        student: {
          select: {
            id: true,
            roll: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        examSubmission: {
          select: {
            id: true,
            objectiveSubmittedAt: true,
            cqSqSubmittedAt: true,
            score: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Safe transformation
    const transformed = (reviewRequests || []).map((r: any) => {
      return {
        ...r,
        student: r.student ? {
          ...r.student,
          name: r.student.user?.name || 'Unknown Student',
          email: r.student.user?.email || 'N/A'
        } : { name: 'Unknown Student', email: 'N/A' }
      };
    });

    return NextResponse.json({ reviewRequests: transformed });

  } catch (error: any) {
    console.error('CRITICAL Error in review-requests API:', error);
    // Return error details to help debugging
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}