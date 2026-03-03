import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface ExamResultsGroup {
  exam: any;
  results: any[];
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  mcqTotal: number;
  cqTotal: number;
  sqTotal: number;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = token.user;
    const isStudent = user.role === 'STUDENT';
    const canViewAllResults = ['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role);

    if (isStudent) {
      // Student can see their own results and their classmates' published results
      if (!user.studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      const studentClassId = user.studentProfile.classId;

      const results = await prismadb.result.findMany({
        where: {
          OR: [
            { studentId: user.studentProfile.id },
            {
              student: {
                classId: studentClassId
              },
              isPublished: true
            }
          ]
        },
        select: {
          id: true,
          mcqMarks: true,
          cqMarks: true,
          sqMarks: true,
          total: true,
          rank: true,
          grade: true,
          percentage: true,
          isPublished: true,
          publishedAt: true,
          exam: {
            include: {
              class: true
            }
          },
          student: {
            include: {
              user: {
                select: {
                  name: true
                }
              },
              class: true
            }
          }
        },
        orderBy: {
          total: 'desc'
        }
      });

      // Group results by exam
      const examResultsMap = results.reduce((acc: Record<string, ExamResultsGroup>, result: any) => {
        const examId = result.exam.id;
        if (!acc[examId]) {
          // Calculate category totals from the first available exam set
          const questions = (result.exam.examSets?.[0]?.questionsJson as Prisma.JsonArray) || [];
          const mcqTotal = (questions as any[]).filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ'].includes(q.type?.toUpperCase()))
            .reduce((sum, q) => {
              if (q.type?.toUpperCase() === 'SMCQ') {
                return sum + (q.subQuestions || []).reduce((s: number, sq: any) => s + (Number(sq.marks) || 1), 0);
              }
              return sum + (Number(q.marks) || 1);
            }, 0);

          const cqTotal = (questions as any[]).filter(q => q.type?.toUpperCase() === 'CQ')
            .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
            .slice(0, result.exam.cqRequiredQuestions || 0)
            .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          const sqTotal = (questions as any[]).filter(q => q.type?.toUpperCase() === 'SQ')
            .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
            .slice(0, result.exam.sqRequiredQuestions || 0)
            .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          acc[examId] = {
            exam: result.exam,
            results: [],
            totalStudents: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            passRate: 0,
            mcqTotal,
            cqTotal,
            sqTotal
          };
        }
        acc[examId].results.push(result);
        return acc;
      }, {} as Record<string, ExamResultsGroup>);

      // Calculate statistics for each exam
      const examResults = Object.values(examResultsMap).map((examResult: ExamResultsGroup) => {
        const resList = examResult.results;
        const totalStudents = resList.length;
        const totalScore = resList.reduce((sum: number, r: any) => sum + r.total, 0);
        const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
        const scores = resList.map((r: any) => r.total);
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const passCount = resList.filter((r: any) => r.total >= r.exam.passMarks).length;
        const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;

        return {
          ...examResult,
          totalStudents,
          averageScore,
          highestScore,
          lowestScore,
          passRate
        };
      });

      return NextResponse.json({
        examResults
      });

    } else if (canViewAllResults) {
      // Teachers, Admins, and Super Users can see all results
      const whereClause: any = {};

      // If teacher, only show results from their institute
      if (user.role === 'TEACHER' && user.instituteId) {
        whereClause.exam = {
          class: {
            instituteId: user.instituteId
          }
        };
      }

      // If admin, only show results from their institute
      if (user.role === 'ADMIN' && user.instituteId) {
        whereClause.exam = {
          class: {
            instituteId: user.instituteId
          }
        };
      }

      const allResults = await prismadb.result.findMany({
        where: whereClause,
        select: {
          id: true,
          mcqMarks: true,
          cqMarks: true,
          sqMarks: true,
          total: true,
          rank: true,
          grade: true,
          percentage: true,
          isPublished: true,
          publishedAt: true,
          exam: {
            include: {
              class: true
            }
          },
          student: {
            include: {
              user: {
                select: {
                  name: true
                }
              },
              class: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Group results by exam and calculate statistics
      const examResultsMap = allResults.reduce((acc: Record<string, ExamResultsGroup>, result: any) => {
        const examId = result.exam.id;
        if (!acc[examId]) {
          // Calculate category totals from the first available exam set
          const questions = (result.exam.examSets?.[0]?.questionsJson as Prisma.JsonArray) || [];
          const mcqTotal = (questions as any[]).filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ'].includes(q.type?.toUpperCase()))
            .reduce((sum, q) => {
              if (q.type?.toUpperCase() === 'SMCQ') {
                return sum + (q.subQuestions || []).reduce((s: number, sq: any) => s + (Number(sq.marks) || 1), 0);
              }
              return sum + (Number(q.marks) || 1);
            }, 0);

          const cqTotal = (questions as any[]).filter(q => q.type?.toUpperCase() === 'CQ')
            .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
            .slice(0, result.exam.cqRequiredQuestions || 0)
            .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          const sqTotal = (questions as any[]).filter(q => q.type?.toUpperCase() === 'SQ')
            .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
            .slice(0, result.exam.sqRequiredQuestions || 0)
            .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          acc[examId] = {
            exam: result.exam,
            results: [],
            totalStudents: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            passRate: 0,
            mcqTotal,
            cqTotal,
            sqTotal
          };
        }
        acc[examId].results.push(result);
        return acc;
      }, {} as Record<string, ExamResultsGroup>);

      // Calculate statistics for each exam
      const examResults = Object.values(examResultsMap).map((examResult: ExamResultsGroup) => {
        const results = examResult.results;
        const totalStudents = results.length;
        const totalScore = results.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0);
        const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
        const highestScore = Math.max(...results.map((r: any) => Number(r.total) || 0));
        const lowestScore = Math.min(...results.map((r: any) => Number(r.total) || 0));
        const passCount = results.filter((r: any) => (Number(r.total) || 0) >= (Number(r.exam.passMarks) || 0)).length;
        const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;

        return {
          ...examResult,
          totalStudents,
          averageScore,
          highestScore,
          lowestScore,
          passRate
        };
      });

      return NextResponse.json({
        examResults
      });

    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 