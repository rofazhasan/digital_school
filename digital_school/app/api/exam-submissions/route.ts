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
          objectiveStatus: true,
          cqSqStatus: true,
          objectiveSubmittedAt: true,
          cqSqSubmittedAt: true,
          exam: {
            select: {
              duration: true,
              objectiveTime: true,
              cqSqTime: true,
              endTime: true,
              cqTotalQuestions: true,
              sqTotalQuestions: true
            }
          }
        },
        orderBy: {
          id: 'desc',
        },
      });

      const sanitizedSubs = summarySubs.map(s => {
        let status = s.status;
        const ans = (typeof s.answers === 'object' && s.answers !== null) ? (s.answers as any) : {};
        const isEndValid = s.exam?.endTime ? (now < new Date(s.exam.endTime).getTime()) : true;

        const hasCqSq = (Number(s.exam?.cqSqTime || 0) > 0) || (Number(s.exam?.cqTotalQuestions || 0) > 0) || (Number(s.exam?.sqTotalQuestions || 0) > 0);

        // Check CQ/SQ validity
        const cqStart = s.cqSqStartedAt ? new Date(s.cqSqStartedAt).getTime() : null;
        const cqDurationMin = Number(s.exam?.cqSqTime) > 0
          ? Number(s.exam?.cqSqTime)
          : (Number(s.exam?.duration || 0) > Number(s.exam?.objectiveTime || 0)
              ? Number(s.exam?.duration || 0) - Number(s.exam?.objectiveTime || 0)
              : Number(s.exam?.duration || 0));
        const isCqTimeValid = cqStart && cqDurationMin > 0 ? (now < cqStart + cqDurationMin * 60 * 1000) : true;

        // Check overall time validity
        const firstStart = s.objectiveStartedAt
          ? new Date(s.objectiveStartedAt).getTime()
          : s.cqSqStartedAt
            ? new Date(s.cqSqStartedAt).getTime()
            : null;
        const totalMin = (Number(s.exam?.objectiveTime || 0) > 0 && Number(s.exam?.cqSqTime || 0) > 0)
          ? Number(s.exam?.objectiveTime) + Number(s.exam?.cqSqTime)
          : (Number(s.exam?.duration) || 0);
        const isOverallTimeValid = firstStart && totalMin > 0 ? (now < firstStart + totalMin * 60 * 1000) : true;

        if (hasCqSq) {
          const isCqSubmitted = s.cqSqStatus === 'SUBMITTED' && (ans._manualCqSqSubmit === true || !isCqTimeValid || !isEndValid || !isOverallTimeValid);
          if (!isCqSubmitted && isEndValid && isOverallTimeValid) {
            status = 'IN_PROGRESS';
          }
        } else if (status === 'SUBMITTED') {
          const isManual = ans._manualSubmit === true || ans._manualObjectiveSubmit === true;
          if (!isManual && isOverallTimeValid && isEndValid) {
            status = 'IN_PROGRESS';
          }
        }

        return {
          examId: s.examId,
          studentId: s.studentId,
          status,
          score: s.score,
          objectiveStatus: s.objectiveStatus,
          cqSqStatus: s.cqSqStatus,
          objectiveStartedAt: s.objectiveStartedAt,
          cqSqStartedAt: s.cqSqStartedAt,
          objectiveSubmittedAt: s.objectiveSubmittedAt,
          cqSqSubmittedAt: s.cqSqSubmittedAt
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
        let currentSub = sub;
        if (sub.status === 'IN_PROGRESS' && sub.exam) {
          currentSub = await autoSubmitExpiredSections(sub, sub.exam);
        }

        let status = currentSub.status;
        const ans = (typeof currentSub.answers === 'object' && currentSub.answers !== null) ? (currentSub.answers as any) : {};
        const isEndValid = currentSub.exam?.endTime ? (now < new Date(currentSub.exam.endTime).getTime()) : true;

        const hasCqSq = (Number(currentSub.exam?.cqSqTime || 0) > 0) || (Number(currentSub.exam?.cqTotalQuestions || 0) > 0) || (Number(currentSub.exam?.sqTotalQuestions || 0) > 0);

        const cqStart = currentSub.cqSqStartedAt ? new Date(currentSub.cqSqStartedAt).getTime() : null;
        const cqDurationMin = Number(currentSub.exam?.cqSqTime) > 0
          ? Number(currentSub.exam?.cqSqTime)
          : (Number(currentSub.exam?.duration || 0) > Number(currentSub.exam?.objectiveTime || 0)
              ? Number(currentSub.exam?.duration || 0) - Number(currentSub.exam?.objectiveTime || 0)
              : Number(currentSub.exam?.duration || 0));
        const isCqTimeValid = cqStart && cqDurationMin > 0 ? (now < cqStart + cqDurationMin * 60 * 1000) : true;

        const firstStart = currentSub.objectiveStartedAt
          ? new Date(currentSub.objectiveStartedAt).getTime()
          : currentSub.cqSqStartedAt
            ? new Date(currentSub.cqSqStartedAt).getTime()
            : null;
        const totalMin = (Number(currentSub.exam?.objectiveTime || 0) > 0 && Number(currentSub.exam?.cqSqTime || 0) > 0)
          ? Number(currentSub.exam?.objectiveTime) + Number(currentSub.exam?.cqSqTime)
          : (Number(currentSub.exam?.duration) || 0);
        const isOverallTimeValid = firstStart && totalMin > 0 ? (now < firstStart + totalMin * 60 * 1000) : true;

        if (hasCqSq) {
          const isCqSubmitted = currentSub.cqSqStatus === 'SUBMITTED' && (ans._manualCqSqSubmit === true || !isCqTimeValid || !isEndValid || !isOverallTimeValid);
          if (!isCqSubmitted && isEndValid && isOverallTimeValid) {
            status = 'IN_PROGRESS';
          }
        } else if (status === 'SUBMITTED') {
          const isManual = ans._manualSubmit === true || ans._manualObjectiveSubmit === true;
          if (!isManual && isOverallTimeValid && isEndValid) {
            status = 'IN_PROGRESS';
          }
        }

        return {
          examId: currentSub.examId,
          studentId: currentSub.studentId,
          objectiveStartedAt: currentSub.objectiveStartedAt,
          cqSqStartedAt: currentSub.cqSqStartedAt,
          objectiveStatus: currentSub.objectiveStatus,
          cqSqStatus: currentSub.cqSqStatus,
          objectiveSubmittedAt: currentSub.objectiveSubmittedAt,
          cqSqSubmittedAt: currentSub.cqSqSubmittedAt,
          score: currentSub.score,
          answers: currentSub.answers,
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