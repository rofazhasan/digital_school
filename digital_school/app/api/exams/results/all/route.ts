import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

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
      // Student can only see their own results
      if (!user.studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      const studentResults = await prismadb.result.findMany({
        where: {
          studentId: user.studentProfile.id,
          isPublished: true
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
          createdAt: 'desc'
        }
      });

      // Group results by exam for student view
      const examResults = studentResults.reduce((acc, result) => {
        const examId = result.exam.id;
        if (!acc[examId]) {
          acc[examId] = {
            exam: result.exam,
            results: [],
            totalStudents: 1,
            averageScore: result.total,
            highestScore: result.total,
            lowestScore: result.total,
            passRate: result.total >= result.exam.passMarks ? 100 : 0
          };
        }
        acc[examId].results.push(result);
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({
        examResults: Object.values(examResults)
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
      const examResultsMap = allResults.reduce((acc, result) => {
        const examId = result.exam.id;
        if (!acc[examId]) {
          acc[examId] = {
            exam: result.exam,
            results: [],
            totalStudents: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            passRate: 0
          };
        }
        acc[examId].results.push(result);
        return acc;
      }, {} as Record<string, any>);

      // Calculate statistics for each exam
      const examResults = Object.values(examResultsMap).map((examResult: any) => {
        const results = examResult.results;
        const totalStudents = results.length;
        const totalScore = results.reduce((sum: number, r: any) => sum + r.total, 0);
        const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
        const highestScore = Math.max(...results.map((r: any) => r.total));
        const lowestScore = Math.min(...results.map((r: any) => r.total));
        const passCount = results.filter((r: any) => r.total >= r.exam.passMarks).length;
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