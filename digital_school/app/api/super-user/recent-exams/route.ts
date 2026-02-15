import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);

    if (!authData || authData.user.role !== 'SUPER_USER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prismadb = await getDatabaseClient();

    // Get recent exams (last 10)
    const recentExams = await prismadb.exam.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        },
        class: {
          select: {
            name: true,
            institute: {
              select: {
                name: true,
              }
            }
          }
        },
        cqTotalQuestions: true,
        sqTotalQuestions: true
      }
    });

    // Transform data to match frontend expectations
    const transformedExams = recentExams.map(exam => {
      let typeLabel = 'OMR';

      if (exam.type === 'ONLINE') {
        const hasCQ = (exam.cqTotalQuestions ?? 0) > 0;
        const hasSQ = (exam.sqTotalQuestions ?? 0) > 0;
        const hasMCQ = !hasCQ && !hasSQ; // Logic fallback if it's ONLINE but no counts specified

        if (hasCQ && hasSQ) typeLabel = 'CQ+SQ';
        else if (hasCQ) typeLabel = 'CQ';
        else if (hasSQ) typeLabel = 'SQ';
        else typeLabel = 'MCQ';
      }

      return {
        id: exam.id,
        title: exam.name,
        subject: exam.class?.name || 'Unknown',
        date: new Date(exam.createdAt).toLocaleDateString(),
        status: exam.isActive ? 'APPROVED' : 'PENDING',
        type: typeLabel,
        createdBy: exam.createdBy?.name || 'Unknown',
        totalStudents: 0
      };
    });

    return NextResponse.json(transformedExams);
  } catch (error) {
    console.error('Recent exams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent exams' },
      { status: 500 }
    );
  }
} 