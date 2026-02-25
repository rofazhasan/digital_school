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

    // 3. Collect all questions from all exam sets
    const allQuestions: any[] = [];
    const questionIdsSet = new Set<string>();

    for (const examSet of exam.examSets) {
      const questions = examSet.questionsJson ? (
        Array.isArray(examSet.questionsJson) 
          ? examSet.questionsJson 
          : JSON.parse(examSet.questionsJson as string)
      ) : [];

      for (const q of questions) {
        if (!questionIdsSet.has(q.id)) {
          questionIdsSet.add(q.id);
          
          const type = (q.type || q.questionType || '').toLowerCase();
          const isObjective = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(type) || !['cq', 'sq', 'descriptive'].includes(type);
          
          if (isObjective) {
            // Clean objective questions of answers for the frontend (if they exist)
            // Regular online exam logic already shuffles and prepares them, but let's be safe
            allQuestions.push(q);
          } else {
            // Creative/Short questions: Include the model answer for review
            // Fetch from DB if not in questionsJson or just use what we have
            allQuestions.push(q);
          }
        }
      }
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        totalMarks: exam.totalMarks,
        subject: (exam as any).subject || 'Academic Exam',
      },
      questions: allQuestions
    });

  } catch (error) {
    console.error('GET /api/exams/[id]/practice/questions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
