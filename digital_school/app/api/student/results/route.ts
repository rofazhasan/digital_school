import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prismadb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    if (!authData || authData.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = authData.user.studentProfile?.id;
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    // Fetch results for the student
    const results = await prismadb.result.findMany({
      where: { studentId },
      include: {
        exam: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Map results to desired format
    const mapped = results.map(r => ({
      examTitle: r.exam?.name || '',
      subject: r.exam?.description || '',
      mcqMarks: r.mcqMarks,
      cqMarks: r.cqMarks,
      total: r.total,
      rank: r.rank,
      grade: r.grade,
      percentage: r.percentage,
      comment: r.comment,
      isPublished: r.isPublished,
      publishedAt: r.publishedAt,
      date: r.createdAt,
    }));
    return NextResponse.json({ results: mapped });
  } catch (error) {
    console.error('Student results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
} 