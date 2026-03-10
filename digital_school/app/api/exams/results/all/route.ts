import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculateGPA } from '@/lib/utils';
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
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = token.user;
    const isStudent = user.role === 'STUDENT';
    const canViewAllResults = ['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role);

    let results = [];
    let totalCount = 0;

    if (isStudent) {
      if (!user.studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      const studentClassId = user.studentProfile.classId;
      const whereCondition = {
        OR: [
          { studentId: user.studentProfile.id },
          {
            student: { classId: studentClassId },
            isPublished: true
          }
        ]
      };

      [results, totalCount] = await Promise.all([
        prismadb.result.findMany({
          where: whereCondition,
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
            examId: true,
            exam: {
              select: {
                id: true,
                name: true,
                date: true,
                passMarks: true,
                cqRequiredQuestions: true,
                sqRequiredQuestions: true,
                class: {
                  select: { id: true, name: true, section: true }
                }
              }
            },
            student: {
              select: {
                id: true,
                roll: true,
                user: { select: { name: true } },
                class: { select: { name: true, section: true } }
              }
            }
          },
          orderBy: { total: 'desc' },
          skip,
          take: limit
        }),
        prismadb.result.count({ where: whereCondition })
      ]);

    } else if (canViewAllResults) {
      const whereClause: any = {};
      if ((user.role === 'TEACHER' || user.role === 'ADMIN') && user.instituteId) {
        whereClause.exam = { class: { instituteId: user.instituteId } };
      }

      [results, totalCount] = await Promise.all([
        prismadb.result.findMany({
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
            examId: true,
            exam: {
              select: {
                id: true,
                name: true,
                date: true,
                passMarks: true,
                cqRequiredQuestions: true,
                sqRequiredQuestions: true,
                class: {
                  select: { id: true, name: true, section: true }
                }
              }
            },
            student: {
              select: {
                id: true,
                roll: true,
                user: { select: { name: true } },
                class: { select: { name: true, section: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prismadb.result.count({ where: whereClause })
      ]);
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Recalculate Grade & GPA dynamically for "Insaaf"
    results = results.map((r: any) => {
      const percentage = r.percentage || (r.exam.totalMarks > 0 ? (r.total / r.exam.totalMarks) * 100 : 0);
      const passMark = Number(r.exam.passMarks) || 33;
      return {
        ...r,
        grade: calculateGrade(percentage, passMark),
        gpa: calculateGPA(percentage, passMark)
      };
    });

    // 1. Get unique exam IDs from results
    const uniqueExamIds = Array.from(new Set(results.map(r => r.examId)));

    // 2. Fetch exam sets only once per exam
    const examSets = await prismadb.examSet.findMany({
      where: {
        examId: { in: uniqueExamIds },
        isActive: true
      },
      select: {
        examId: true,
        questionsJson: true
      }
    });

    // 3. Pre-calculate totals for each exam
    const examTotalsMap = new Map();
    examSets.forEach(set => {
      if (examTotalsMap.has(set.examId)) return; // Already processed a set for this exam

      const questions = (set.questionsJson as any[]) || [];
      const mcqTotal = questions.filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ'].includes(q.type?.toUpperCase()))
        .reduce((sum, q) => {
          if (q.type?.toUpperCase() === 'SMCQ') {
            return sum + (q.subQuestions || []).reduce((s: number, sq: any) => s + (Number(sq.marks) || 1), 0);
          }
          return sum + (Number(q.marks) || 1);
        }, 0);

      // Find first result of this exam to get required question counts (they are same for all results of same exam)
      const sampleResult = results.find(r => r.examId === set.examId);
      const cqTotal = questions.filter(q => q.type?.toUpperCase() === 'CQ')
        .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
        .slice(0, sampleResult?.exam.cqRequiredQuestions || 0)
        .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

      const sqTotal = questions.filter(q => q.type?.toUpperCase() === 'SQ')
        .sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
        .slice(0, sampleResult?.exam.sqRequiredQuestions || 0)
        .reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

      examTotalsMap.set(set.examId, { mcqTotal, cqTotal, sqTotal });
    });

    // 4. Group results by exam
    const examGroupsMap: Record<string, ExamResultsGroup> = {};
    results.forEach((result: any) => {
      const examId = result.examId;
      if (!examGroupsMap[examId]) {
        const totals = examTotalsMap.get(examId) || { mcqTotal: 0, cqTotal: 0, sqTotal: 0 };
        examGroupsMap[examId] = {
          exam: result.exam,
          results: [],
          totalStudents: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0,
          ...totals
        };
      }
      examGroupsMap[examId].results.push(result);
    });

    // 5. Calculate final statistics
    const examResults = Object.values(examGroupsMap).map(group => {
      const resList = group.results;
      const count = resList.length;
      const scores = resList.map((r: any) => Number(r.total) || 0);
      const totalScore = scores.reduce((a, b) => a + b, 0);
      const passCount = resList.filter((r: any) => (Number(r.total) || 0) >= (Number(r.exam.passMarks) || 0)).length;

      return {
        ...group,
        totalStudents: count,
        averageScore: count > 0 ? totalScore / count : 0,
        highestScore: count > 0 ? Math.max(...scores) : 0,
        lowestScore: count > 0 ? Math.min(...scores) : 0,
        passRate: count > 0 ? (passCount / count) * 100 : 0
      };
    });

    return NextResponse.json({
      examResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
