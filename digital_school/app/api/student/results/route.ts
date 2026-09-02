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

    // Parallel fetch of official Results and ExamSubmissions
    const [results, submissions] = await Promise.all([
      prismadb.result.findMany({
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
      }),
      prismadb.examSubmission.findMany({
        where: { studentId, status: 'SUBMITTED' },
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
          }
        },
        orderBy: { evaluatedAt: 'desc' }
      })
    ]);

    const resultMap = new Map<string, any>();

    // Map official published results
    results.forEach(r => {
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

      resultMap.set(r.examId, {
        id: r.id,
        examId: r.examId,
        examTitle: r.exam?.name || 'Academic Exam',
        subject: subject,
        type: r.exam?.type || 'OFFLINE',
        totalMarks: totalMarks,
        score: score,
        total: score,
        mcqMarks: r.mcqMarks || 0,
        cqMarks: r.cqMarks || 0,
        sqMarks: r.sqMarks || 0,
        rank: r.rank,
        grade: r.grade || (calculatedPct >= 80 ? 'A+' : calculatedPct >= 70 ? 'A' : calculatedPct >= 60 ? 'A-' : calculatedPct >= 50 ? 'B' : calculatedPct >= 40 ? 'C' : 'F'),
        percentage: r.percentage ?? calculatedPct,
        comment: r.comment || '',
        isPublished: r.isPublished !== false,
        publishedAt: r.publishedAt,
        date: r.createdAt,
        className: r.exam?.class?.name,
        omrScanId: r.omrScanId
      });
    });

    // Merge online submissions not present in Result
    submissions.forEach(sub => {
      if (!resultMap.has(sub.examId)) {
        let subject = "General";
        if (sub.exam?.examSets?.[0]?.questions?.[0]?.subject) {
          subject = sub.exam.examSets[0].questions[0].subject;
        } else if (sub.exam?.name) {
          subject = sub.exam.name.split(" ")[0] || "General";
        }

        const totalMarks = sub.exam?.totalMarks || 100;
        const score = Number(sub.score) || 0;
        const calculatedPct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

        resultMap.set(sub.examId, {
          id: sub.id,
          examId: sub.examId,
          examTitle: sub.exam?.name || 'Online Exam',
          subject: subject,
          type: sub.exam?.type || 'ONLINE',
          totalMarks: totalMarks,
          score: score,
          total: score,
          mcqMarks: score,
          cqMarks: 0,
          sqMarks: 0,
          rank: undefined,
          grade: calculatedPct >= 80 ? 'A+' : calculatedPct >= 70 ? 'A' : calculatedPct >= 60 ? 'A-' : calculatedPct >= 50 ? 'B' : calculatedPct >= 40 ? 'C' : 'F',
          percentage: calculatedPct,
          comment: sub.evaluatorNotes || '',
          isPublished: true,
          publishedAt: sub.evaluatedAt || (sub as any).createdAt || new Date(),
          date: sub.evaluatedAt || (sub as any).createdAt || new Date(),
          className: sub.exam?.class?.name
        });
      }
    });

    const unifiedList = Array.from(resultMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(
      { results: unifiedList },
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