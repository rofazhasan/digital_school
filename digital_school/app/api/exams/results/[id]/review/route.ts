import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const token = await getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { comment, examId: bodyExamId, studentId } = body;

    if (!comment || !bodyExamId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { id: token.user.id },
      include: {
        studentProfile: true
      }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Verify the student is requesting review for their own result
    if (user.studentProfile.id !== studentId) {
      return NextResponse.json({ error: 'Unauthorized to request review for another student' }, { status: 403 });
    }

    // Get the exam submission for this student
    const examSubmission = await db.examSubmission.findFirst({
      where: {
        examId: bodyExamId,
        studentId: studentId
      }
    });

    if (!examSubmission) {
      return NextResponse.json({ error: 'No exam submission found for this student' }, { status: 404 });
    }

    // Check if a review request already exists (only one review per exam per student allowed)
    const existingReview = await (db as any).resultReview.findFirst({
      where: {
        examId: bodyExamId,
        studentId: studentId
      }
    });

    if (existingReview) {
      if (existingReview.status === 'PENDING') {
        return NextResponse.json({ error: 'A review request is already pending for this exam' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'A review request has already been submitted for this exam' }, { status: 400 });
      }
    }

    // Create review request
    const reviewRequest = await (db as any).resultReview.create({
      data: {
        examId: bodyExamId,
        studentId: studentId,
        examSubmissionId: examSubmission.id,
        studentComment: comment,
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      reviewRequest: {
        id: reviewRequest.id,
        status: reviewRequest.status,
        requestedAt: reviewRequest.requestedAt
      }
    });

  } catch (error) {
    console.error('Error creating review request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get the current user
    const user = await db.user.findUnique({
      where: { id: token.user.id },
      include: {
        studentProfile: true
      }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get review requests for this student and exam
    const reviewRequests = await (db as any).resultReview.findMany({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return NextResponse.json({
      reviewRequests
    });

  } catch (error) {
    console.error('Error fetching review requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 