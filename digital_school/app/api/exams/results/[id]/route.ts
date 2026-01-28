import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculatePercentage } from '@/lib/utils';

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
        studentProfile: {
          include: {
            class: true
          }
        }
      }
    });

    console.log(`[ResultAPI] User: ${token.user.email} (${token.user.role})`);

    if (!user) {
      console.log(`[ResultAPI] User not found in DB`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.studentProfile) {
      console.log(`[ResultAPI] Student profile not found for user ${user.id}`);
      // Allow admins to view if they really want, but this API is structure for student view. 
      // For now, strict 404 is correct for the logic, but let's log it.
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Fetch exam
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        class: true // Include class to get class name
      }
    });

    if (!exam) {
      console.log(`[ResultAPI] Exam not found: ${examId}`);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Fetch submission with exam set and drawings
    const submission = await (db.examSubmission as any).findFirst({
      // ... (rest of the query remains same, just ensuring context)
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      },
      include: {
        drawings: true
      }
    });

    // ... (rest of code)

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        totalMarks: exam.totalMarks,
        allowRetake: exam.allowRetake,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        isActive: exam.isActive,
        createdAt: exam.createdAt,
        // Added fields for Print View
        subject: (exam as any).subject || "General",
        class: exam.class?.name || "N/A",
        set: examSet?.name || "A",
        mcqNegativeMarking: (exam as any).mcqNegativeMarking || 0,
        cqRequiredQuestions: (exam as any).cqRequiredQuestions,
        sqRequiredQuestions: (exam as any).sqRequiredQuestions
      },
      student: {
        id: user.studentProfile.id,
        name: user.name,
        roll: user.studentProfile.roll,
        registrationNo: user.studentProfile.registrationNo,
        class: user.studentProfile.class.name
      },
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        startedAt: submission.startedAt,
        score: submission.score,
        evaluatorNotes: submission.evaluatorNotes,
        evaluatedAt: submission.evaluatedAt,
        exceededQuestionLimit: submission.exceededQuestionLimit,
        status: isSuspended ? 'SUSPENDED' : submission.status
      },
      result: result ? {
        id: result.id,
        mcqMarks: mcqMarks,
        cqMarks: cqMarks,
        sqMarks: sqMarks,
        total: totalMarks,
        rank: result.rank || null,
        grade: grade,
        percentage: percentage,
        comment: result.comment,
        isPublished: result.isPublished || false,
        publishedAt: result.publishedAt,
        status: isSuspended ? 'SUSPENDED' : result.status,
        suspensionReason: isSuspended ? 'Student answered more questions than allowed' : result.suspensionReason
      } : null,
      reviewRequest: reviewRequest ? {
        id: reviewRequest.id,
        status: reviewRequest.status,
        studentComment: reviewRequest.studentComment,
        evaluatorComment: reviewRequest.evaluatorComment,
        requestedAt: reviewRequest.requestedAt,
        reviewedAt: reviewRequest.reviewedAt,
        reviewer: reviewRequest.reviewer ? {
          id: reviewRequest.reviewer.id,
          name: reviewRequest.reviewer.name
        } : null
      } : null,
      questions: processedQuestions,
      statistics: {
        totalStudents,
        averageScore,
        highestScore,
        lowestScore
      }
    });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 