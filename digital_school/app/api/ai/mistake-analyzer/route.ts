import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { localSLMService, StudentMistakeContext } from '@/lib/ai/local-slm-service';

export async function POST(req: NextRequest) {
  try {
    const auth = await getTokenFromRequest(req);
    if (!auth?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    let { studentId, examId } = body;

    // Prevent IDOR: students can only analyze their own submissions
    if (auth.user.role === 'STUDENT') {
      const ownProfile = await prisma.studentProfile.findUnique({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!ownProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      if (studentId && studentId !== ownProfile.id) {
        return NextResponse.json({ error: 'Forbidden: Cannot analyze another student' }, { status: 403 });
      }
      studentId = ownProfile.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // 1. Fetch exam submissions for the student
    const whereClause: any = { studentId };
    if (examId) {
      whereClause.examId = examId;
    }

    const submission = await prisma.examSubmission.findFirst({
      where: whereClause,
      orderBy: { id: 'desc' },
      include: {
        exam: true,
        result: true,
        student: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'No exam submission found for the given criteria.' },
        { status: 404 }
      );
    }

    // 2. Fetch questions related to this exam/subject to calculate topic error frequency
    const questions = await prisma.question.findMany({
      where: {
        examSets: {
          some: {
            examId: submission.examId,
          },
        },
      },
      select: {
        id: true,
        questionText: true,
        modelAnswer: true,
        topic: true,
        subject: true,
      },
      take: 20,
    });

    // 3. Compute topic errors & sample question errors deterministically
    const topicCountMap: Record<string, number> = {};
    const questionErrors: StudentMistakeContext['questionErrors'] = [];

    // Parse student answers from submission
    const studentAnswersMap: Record<string, string> =
      typeof submission.answers === 'object' && submission.answers !== null
        ? (submission.answers as Record<string, string>)
        : {};

    questions.forEach((q) => {
      const studentAns = studentAnswersMap[q.id];
      const isIncorrect = studentAns !== undefined && studentAns !== q.modelAnswer;

      if (isIncorrect || studentAns === undefined) {
        const topicName = q.topic || q.subject || 'General';
        topicCountMap[topicName] = (topicCountMap[topicName] || 0) + 1;

        questionErrors.push({
          questionText: q.questionText,
          studentAnswer: studentAns || '[Unattempted]',
          correctAnswer: q.modelAnswer || 'N/A',
          explanation: undefined,
          topic: topicName,
        });
      }
    });

    const topMistakeTopics = Object.entries(topicCountMap)
      .map(([topic, errorCount]) => ({ topic, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount);

    const totalMarks = submission.exam?.totalMarks || 100;
    const obtainedMarks = submission.score ?? submission.result?.total ?? 0;
    const accuracyPercentage = Math.round((obtainedMarks / totalMarks) * 100);

    const context: StudentMistakeContext = {
      studentName: submission.student?.user?.name || 'Student',
      examTitle: submission.exam?.name || 'Recent Exam',
      scoreObtained: obtainedMarks,
      totalScore: totalMarks,
      accuracyPercentage,
      topMistakeTopics,
      questionErrors,
    };

    // 4. Generate AI Diagnosis via Local SLM Service
    const aiDiagnosis = await localSLMService.generateMistakeDiagnosis(context);

    return NextResponse.json({
      success: true,
      data: {
        studentName: context.studentName,
        examTitle: context.examTitle,
        score: `${context.scoreObtained} / ${context.totalScore}`,
        accuracyPercentage: `${context.accuracyPercentage}%`,
        topMistakeTopics: context.topMistakeTopics,
        diagnosis: aiDiagnosis,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in /api/ai/mistake-analyzer:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
