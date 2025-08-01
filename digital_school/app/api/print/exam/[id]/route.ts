import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id: examId } = await context.params;
  // Fetch exam with sets and questionsJson
  const exam = await prismadb.exam.findUnique({
    where: { id: examId },
    include: {
      class: true,
      examSets: {
        include: {
          questions: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  const examInfo = {
    id: exam.id,
    title: exam.name,
    subject: exam.description || '',
    class: exam.class?.name || '',
    date: exam.date.toISOString().split('T')[0],
    duration: exam.duration ? `${exam.duration} মিনিট` : '',
    totalMarks: exam.totalMarks?.toString() || '',
    invigilator: '', // Add if available
    room: '', // Add if available
    schoolName: '', // Add if available
    schoolAddress: '', // Add if available
  };

  // For each set, use questionsJson if present, else fallback to questions relation
  const sets = exam.examSets.map((set) => {
    let questionsArr: any[] = [];
    if (set['questionsJson'] && Array.isArray(set['questionsJson'])) {
      questionsArr = set['questionsJson'];
    } else if (set.questions && Array.isArray(set.questions)) {
      questionsArr = set.questions;
    }
    const mcq = questionsArr.filter((q: any) => q.type === 'MCQ').map((q: any) => ({
      q: q.questionText,
      options: Array.isArray(q.options) ? q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt) : [],
      marks: q.marks,
    }));
    const cq = questionsArr.filter((q: any) => q.type === 'CQ').map((q: any) => ({
      questionText: q.questionText,
      marks: q.marks,
      modelAnswer: q.modelAnswer,
      subQuestions: q.subQuestions || [],
    }));
    const sq = questionsArr.filter((q: any) => q.type === 'SQ').map((q: any) => ({
      questionText: q.questionText,
      marks: q.marks,
      modelAnswer: q.modelAnswer,
    }));
    return {
      setId: set.id, // Use ExamSet.id for QR/barcode
      setName: set.name, // For display (A/B/C...)
      mcq,
      cq,
      sq,
      qrData: { examId, setId: set.id, classId: exam.classId },
      barcode: `${examId}|${set.id}|${exam.classId}`,
    };
  }).filter(set => (set.mcq && set.mcq.length) || (set.cq && set.cq.length) || (set.sq && set.sq.length));

  return NextResponse.json({ examInfo, sets });
} 