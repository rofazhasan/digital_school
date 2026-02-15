import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: examId } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const questionId = searchParams.get('questionId');
    const imageIndex = parseInt(searchParams.get('imageIndex') || '0');

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    // Validate user has permission to view this exam
    const user = await prisma.user.findUnique({
      where: { id: tokenData.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can evaluate this exam
    if (user.role === 'SUPER_USER') {
      // Super user can view any exam
    } else if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      // Check if teacher is assigned to this exam
      const assignment = await prisma.examEvaluationAssignment.findFirst({
        where: {
          examId,
          evaluatorId: tokenData.user.id
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Not assigned to evaluate this exam' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // If questionId is not provided, return all drawings for the student
    if (!questionId) {
      const drawings = await prisma.examSubmissionDrawing.findMany({
        where: {
          studentId,
          examId
        }
      });

      return NextResponse.json({
        success: true,
        drawings: drawings || []
      });
    }

    // Get a specific drawing
    const drawing = await prisma.examSubmissionDrawing.findFirst({
      where: {
        studentId,
        questionId,
        imageIndex
      }
    });

    return NextResponse.json({
      success: true,
      drawing: drawing || null
    });

  } catch (error) {
    console.error('Error fetching drawing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drawing' },
      { status: 500 }
    );
  }
} 