import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const tokenData = await getTokenFromRequest(request);

    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await DatabaseClient.getInstance();

    // 1. Fetch the exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 2. Check if the exam is expired
    const isExpired = new Date() > new Date(exam.endTime);
    if (!isExpired) {
      return NextResponse.json({ error: 'Practice exam is only available after the exam has ended.' }, { status: 403 });
    }

    // 3. Select a random exam set if available
    if (exam.examSets.length === 0) {
      return NextResponse.json({ error: 'No exam sets found for this exam.' }, { status: 404 });
    }

    const randomSetIndex = Math.floor(Math.random() * exam.examSets.length);
    const selectedSet = exam.examSets[randomSetIndex];

    // 4. Extract questions from the selected set
    const allQuestions = selectedSet.questionsJson ? (
      Array.isArray(selectedSet.questionsJson)
        ? selectedSet.questionsJson
        : JSON.parse(selectedSet.questionsJson as string)
    ) : [];

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        totalMarks: exam.totalMarks,
        subject: (exam as any).subject || 'Academic Exam',
        setName: (selectedSet as any).setName || (selectedSet as any).name || 'Default Set',
      },
      questions: allQuestions
    });

  } catch (error) {
    console.error('GET /api/exams/[id]/practice/questions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
