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

    const url = new URL(request.url);
    const isSummary = url.searchParams.get('summary') === 'true';

    if (isSummary) {
      const summarySubs = await db.examSubmission.findMany({
        where: {
          studentId: user.studentProfile.id,
        },
        select: {
          examId: true,
          studentId: true,
          status: true,
          score: true,
        },
        orderBy: {
          id: 'desc',
        },
      });
      return NextResponse.json({
        submissions: summarySubs,
      });
    }

    // Fetch exam submissions for this student
    const submissions = await db.examSubmission.findMany({
      where: {
        studentId: user.studentProfile.id
      },
      include: {
        exam: {
          include: {
            examSets: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const { autoSubmitExpiredSections } = await import('@/lib/exam-logic');
    const processedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        if (sub.status === 'IN_PROGRESS' && sub.exam) {
          const updated = await autoSubmitExpiredSections(sub, sub.exam);
          return {
            examId: updated.examId,
            studentId: updated.studentId,
            objectiveSubmittedAt: updated.objectiveSubmittedAt,
            cqSqSubmittedAt: updated.cqSqSubmittedAt,
            score: updated.score,
            answers: updated.answers,
            status: updated.status
          };
        }
        return {
          examId: sub.examId,
          studentId: sub.studentId,
          objectiveSubmittedAt: sub.objectiveSubmittedAt,
          cqSqSubmittedAt: sub.cqSqSubmittedAt,
          score: sub.score,
          answers: sub.answers,
          status: sub.status
        };
      })
    );

    return NextResponse.json({
      submissions: processedSubmissions
    });

  } catch (error) {
    console.error('Error fetching exam submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 