import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// POST: Add multiple sets for an exam (do not delete previous sets)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { params } = context;
    const { id: examId } = await params;
    const body = await request.json();
    const { sets } = body; // [{ name, questions }]
    if (!Array.isArray(sets) || !examId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    // Add new sets (do not delete previous)
    const createdSets = await Promise.all(
      sets.map(async (set: { name: string; questions: Record<string, unknown>; description?: string }) => {
        // Optionally, skip or update if a set with the same name exists
        const existing = await prismadb.examSet.findFirst({ where: { examId, name: set.name } });
        if (existing) {
          // Optionally update existing set
          return await prismadb.examSet.update({
            where: { id: existing.id },
            data: {
              questionsJson: set.questions as any,
              description: set.description || '',
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new set
          return await prismadb.examSet.create({
            data: {
              name: set.name,
              description: set.description || '',
              examId,
              createdById: auth.user.id,
              questionsJson: set.questions as any,
            },
          });
        }
      })
    );

    // Update the exam's generatedSet column with the latest sets (as requested)
    await prismadb.exam.update({
      where: { id: examId },
      data: {
        generatedSet: sets as any
      }
    });

    return NextResponse.json({ success: true, sets: createdSets });
  } catch (error) {
    console.error('Failed to save exam sets:', error);
    return NextResponse.json({ error: 'Failed to save exam sets' }, { status: 500 });
  }
}

// GET: Fetch all sets for an exam
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: examId } = await params;
    const sets = await prismadb.examSet.findMany({
      where: { examId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        questionsJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Failed to fetch exam sets:', error);
    return NextResponse.json({ error: 'Failed to fetch exam sets' }, { status: 500 });
  }
}

// DELETE: Remove all sets for an exam
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { params } = context;
    const { id: examId } = await params;
    await prismadb.examSet.deleteMany({ where: { examId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exam sets:', error);
    return NextResponse.json({ error: 'Failed to delete exam sets' }, { status: 500 });
  }
} 