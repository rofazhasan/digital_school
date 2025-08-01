import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET() {
  try {
    // Get basic stats
    const totalUsers = await prismadb.user.count();
    const totalExams = await prismadb.exam.count();
    const totalResults = await prismadb.result.count();
    const totalQuestions = await prismadb.question.count();

    return NextResponse.json({
      users: totalUsers,
      exams: totalExams,
      results: totalResults,
      questions: totalQuestions,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
} 