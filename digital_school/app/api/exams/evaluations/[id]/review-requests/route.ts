import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view review requests (teacher, admin, super user)
    const user = await db.user.findUnique({
      where: { id: token.user.id }
    });

    if (!user || !['TEACHER', 'ADMIN', 'SUPER_USER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all review requests for this exam
    const reviewRequests = await (db as any).resultReview.findMany({
      where: {
        examId: examId
      },
      include: {
        student: {
          include: {
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
            submittedAt: true,
            score: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Transform the data to include student name safely
    const transformedRequests = reviewRequests.map((request: any) => {
      try {
        if (!request.student || !request.student.user) {
          console.warn(`Review request ${request.id} has missing student or user data`);
          return {
            ...request,
            student: {
              ...(request.student || {}),
              name: 'Unknown Student',
              email: 'N/A'
            }
          };
        }

        return {
          ...request,
          student: {
            ...request.student,
            name: request.student.user.name,
            email: request.student.user.email
          }
        };
      } catch (err) {
        console.error(`Error transforming review request ${request.id}:`, err);
        return {
          ...request,
          student: {
            ...(request.student || {}),
            name: 'Error Loading Name',
            email: 'N/A'
          }
        };
      }
    });

    return NextResponse.json({
      reviewRequests: transformedRequests
    });

  } catch (error) {
    console.error('Error fetching review requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 