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
    const now = Date.now();

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
          answers: true,
          objectiveStartedAt: true,
          cqSqStartedAt: true,
          exam: {
            select: {
              duration: true,
              objectiveTime: true,
              cqSqTime: true,
              endTime: true
            }
          }
        },
        orderBy: {
          id: 'desc',
        },
      });

      const sanitizedSubs = summarySubs.map(s => {
        let status = s.status;
        if (status === 'SUBMITTED') {
          const ans = (typeof s.answers === 'object' && s.answers !== null) ? (s.answers as any) : {};
          const isManual = ans._manualSubmit === true;
          const firstStart = s.objectiveStartedAt
            ? new Date(s.objectiveStartedAt).getTime()
            : s.cqSqStartedAt
              ? new Date(s.cqSqStartedAt).getTime()
              : null;
          const totalMin = (Number(s.exam?.objectiveTime || 0) > 0 && Number(s.exam?.cqSqTime || 0) > 0)
            ? Number(s.exam?.objectiveTime) + Number(s.exam?.cqSqTime)
            : (Number(s.exam?.duration) || 0);
          const isTimeValid = firstStart && totalMin > 0 ? (now < firstStart + totalMin * 60 * 1000) : true;
          const isEndValid = s.exam?.endTime ? (now < new Date(s.exam.endTime).getTime()) : true;

          if (!isManual && isTimeValid && isEndValid) {
            status = 'IN_PROGRESS';
          }
        }
        return {
          examId: s.examId,
          studentId: s.studentId,
          status,
          score: s.score
        };
      });

      return NextResponse.json({
        submissions: sanitizedSubs,
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

        let status = sub.status;
        if (status === 'SUBMITTED' && sub.exam) {
          const ans = (typeof sub.answers === 'object' && sub.answers !== null) ? (sub.answers as any) : {};
          const isManual = ans._manualSubmit === true;
          const firstStart = sub.objectiveStartedAt
            ? new Date(sub.objectiveStartedAt).getTime()
            : sub.cqSqStartedAt
              ? new Date(sub.cqSqStartedAt).getTime()
              : null;
          const totalMin = (Number(sub.exam.objectiveTime || 0) > 0 && Number(sub.exam.cqSqTime || 0) > 0)
            ? Number(sub.exam.objectiveTime) + Number(sub.exam.cqSqTime)
            : (Number(sub.exam.duration) || 0);
          const isTimeValid = firstStart && totalMin > 0 ? (now < firstStart + totalMin * 60 * 1000) : true;
          const isEndValid = sub.exam.endTime ? (now < new Date(sub.exam.endTime).getTime()) : true;

          if (!isManual && isTimeValid && isEndValid) {
            status = 'IN_PROGRESS';
          }
        }

        return {
          examId: sub.examId,
          studentId: sub.studentId,
          objectiveSubmittedAt: sub.objectiveSubmittedAt,
          cqSqSubmittedAt: sub.cqSqSubmittedAt,
          score: sub.score,
          answers: sub.answers,
          status: status
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