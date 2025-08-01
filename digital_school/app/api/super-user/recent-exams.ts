import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exams = await prismadb.exam.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        createdBy: true,
        examStudentMaps: true,
      },
    });

    const result = exams.map(exam => ({
      id: exam.id,
      title: exam.name,
      subject: exam.description || '',
      date: exam.date.toISOString().split('T')[0],
      status: exam.isActive ? 'PENDING' : 'COMPLETED',
      type: exam.type,
      createdBy: exam.createdBy?.name || '',
      totalStudents: exam.examStudentMaps?.length || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Recent exams error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent exams' }, { status: 500 });
  }
} 