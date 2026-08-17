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

    // Fetch results for the student with full exam details
    const results = await prismadb.result.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            totalMarks: true,
            date: true,
            class: { select: { id: true, name: true, section: true } },
            examSets: {
              take: 1,
              select: {
                questions: {
                  take: 3,
                  select: { subject: true }
                }
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map results to desired format
    const mapped = results.map(r => {
      let subject = "General";
      if (r.exam?.examSets?.[0]?.questions?.[0]?.subject) {
        subject = r.exam.examSets[0].questions[0].subject;
      } else if (r.exam?.name) {
        const words = r.exam.name.split(" ");
        if (words.length > 0) subject = words[0];
      }

      const totalMarks = r.exam?.totalMarks || 100;
      const score = Number(r.total) || 0;
      const calculatedPct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : (Number(r.percentage) || 0);

      return {
        id: r.id,
        examId: r.examId,
        examTitle: r.exam?.name || 'Academic Exam',
        subject: subject,
        type: r.exam?.type || 'ONLINE',
        totalMarks: totalMarks,
        score: score,
        total: score,
        mcqMarks: r.mcqMarks || 0,
        cqMarks: r.cqMarks || 0,
        rank: r.rank,
        grade: r.grade || (calculatedPct >= 80 ? 'A+' : calculatedPct >= 70 ? 'A' : calculatedPct >= 60 ? 'A-' : calculatedPct >= 50 ? 'B' : calculatedPct >= 40 ? 'C' : 'F'),
        percentage: r.percentage ?? calculatedPct,
        comment: r.comment || '',
        isPublished: r.isPublished !== false,
        publishedAt: r.publishedAt,
        date: r.createdAt,
        className: r.exam?.class?.name,
      };
    });

    return NextResponse.json(
      { results: mapped },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=60',
        }
      }
    );
  } catch (error) {
    console.error('Student results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}