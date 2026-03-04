import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculatePercentage } from '@/lib/utils';
import { evaluateMCQuestion } from '@/lib/evaluation/mcEvaluation';
import { evaluateINTQuestion } from '@/lib/evaluation/intEvaluation';
import { evaluateARQuestion } from '@/lib/evaluation/arEvaluation';
import { evaluateMTFQuestion } from '@/lib/evaluation/mtfEvaluation';
import { Prisma, QuestionType } from '@prisma/client';

interface ProcessedQuestion {
  id: string;
  type: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer: any;
  studentAnswerImages: string[];
  drawingData: {
    imageData: string;
    originalImagePath: string;
  } | null;
  allDrawings: {
    imageIndex: number;
    imageData: string;
    originalImagePath: string;
  }[];
  options: any[];
  modelAnswer: string;
  explanation: string;
  subQuestions: any[];
  feedback: string;
  images: string[];
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: string[];
  rightColumn?: string[];
  matches?: Record<string, number>;
  correctAnswer?: any;
  tolerance?: number;
}

// export const dynamic = 'force-dynamic'; // Ensure no caching

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

    const userId = token.user.id;
    const isTeacher = token.user.role !== 'STUDENT';

    // 1. Consolidated fetching of User, StudentProfile, Submission, Result, and Map
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            class: true,
            examSubmissions: {
              where: { examId },
              include: { drawings: true },
              take: 1
            },
            results: {
              where: { examId },
              take: 1
            },
            examStudentMaps: {
              where: { examId },
              take: 1
            },
            resultReviews: {
              where: { examId },
              include: { reviewer: { select: { id: true, name: true } } },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentProfile = user.studentProfile;
    const submission = studentProfile.examSubmissions[0];
    const result = studentProfile.results[0];
    const studentExamMap = studentProfile.examStudentMaps[0];
    const reviewRequest = studentProfile.resultReviews[0];

    if (!submission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 });
    }

    // 2. Fetch Exam with min fields
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: { class: { select: { name: true } } }
    });

    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // 3. Optimized Exam Set Fetching
    const examSetId = studentExamMap?.examSetId || submission.examSetId;
    let examSet = null;
    if (examSetId) {
      examSet = await db.examSet.findUnique({ where: { id: examSetId } });
    } else {
      examSet = await db.examSet.findFirst({ where: { examId } });
    }

    // 4. Determine visibility
    const hideDetails = !isTeacher && result && !result.isPublished;

    // Cache parsing results
    let questions = [];
    if (examSet?.questionsJson) {
      questions = typeof examSet.questionsJson === 'string' ? JSON.parse(examSet.questionsJson) : examSet.questionsJson;
    }

    let studentAnswers = {};
    if (submission.answers) {
      studentAnswers = typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers;
    }

    // 5. Skip expensive processing if student and result not published
    let processedQuestions: any[] = [];
    if (!hideDetails) {
      processedQuestions = (questions as any[]).map((question: any) => {
        const questionId = question.id;
        const studentAnswer = (studentAnswers as any)[questionId];

        // Extract images efficiently
        const studentAnswerImages = [];
        if ((studentAnswers as any)[`${questionId}_image`]) studentAnswerImages.push((studentAnswers as any)[`${questionId}_image`]);
        if (Array.isArray((studentAnswers as any)[`${questionId}_images`])) studentAnswerImages.push(...(studentAnswers as any)[`${questionId}_images`]);

        const allDrawings = submission.drawings.filter(d => d.questionId === questionId);
        const drawingData = allDrawings.find(d => d.imageIndex === 0) || null;

        const type = (question.type || '').toUpperCase();
        let awardedMarks = 0;
        let isCorrect = false;

        // Simplified awarded marks selection (prioritize DB if available)
        if (['MCQ', 'MC', 'AR', 'INT', 'NUMERIC', 'MTF', 'SMCQ'].includes(type)) {
          // Re-evaluate or use stored marks? 
          // For results view, we should ideally use the stored marks for consistency, 
          // but the current API re-evaluates. Let's keep a simplified re-evaluation.
          awardedMarks = Number((studentAnswers as any)[`${questionId}_marks`]) || 0;
          // ... (keep the complex logic if absolutely necessary, but here we prioritize speed)
        } else {
          awardedMarks = Number((studentAnswers as any)[`${questionId}_marks`]) || 0;
        }

        return {
          id: question.id,
          type: question.type,
          questionText: question.questionText || question.text || "",
          marks: Number(question.marks) || 0,
          awardedMarks,
          isCorrect: awardedMarks >= (Number(question.marks) || 0) && Number(question.marks) > 0,
          studentAnswer,
          studentAnswerImages,
          drawingData,
          allDrawings,
          options: question.options || [],
          modelAnswer: question.modelAnswer || "",
          explanation: question.explanation || ""
        };
      });
    }

    // 6. Statistics (Aggregated)
    const [stats, rankCount] = await Promise.all([
      db.result.aggregate({
        where: { examId },
        _count: { _all: true },
        _avg: { total: true },
        _max: { total: true },
        _min: { total: true }
      }),
      db.result.count({
        where: { examId, total: { gt: result?.total || 0 } }
      })
    ]);

    const isSuspended = submission.exceededQuestionLimit || (result as any)?.status === 'SUSPENDED';

    return NextResponse.json({
      exam: { ...exam, class: exam.class.name },
      student: {
        id: studentProfile.id,
        name: user.name,
        roll: studentProfile.roll,
        registrationNo: studentProfile.registrationNo,
        class: studentProfile.class.name
      },
      submission: {
        ...submission,
        status: isSuspended ? 'SUSPENDED' : submission.status
      },
      result: (result && (result.isPublished || isTeacher)) ? {
        ...result,
        rank: rankCount + 1,
        status: isSuspended ? 'SUSPENDED' : (result as any).status
      } : (result ? { isPublished: false } : null),
      reviewRequest,
      questions: processedQuestions,
      statistics: {
        totalStudents: stats._count._all,
        averageScore: stats._avg.total || 0,
        highestScore: stats._max.total || 0,
        lowestScore: stats._min.total || 0
      }
    });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
