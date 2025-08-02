import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { safeDatabaseOperation, createApiResponse, DatabaseCache } from '@/lib/db-utils';
import { DatabaseClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (id) {
    // Fetch single exam by ID with caching
    const cacheKey = `exam:${id}`;
    const cached = DatabaseCache.get(cacheKey);
    
    if (cached) {
      return createApiResponse(cached);
    }

    try {
      const exam = await safeDatabaseOperation(
        async () => {
          const db = await DatabaseClient.getInstance();
          return await db.exam.findUnique({
            where: { id },
            include: {
              class: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true } },
            },
          });
        },
        'Fetch single exam'
      );

      if (!exam) {
        return createApiResponse(null, 'Exam not found', 404);
      }

      const examData = {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        date: exam.date,
        subject: exam.class?.name || '',
        totalMarks: exam.totalMarks,
        isActive: exam.isActive,
        createdBy: exam.createdBy?.name || '',
        classId: exam.classId,
        createdAt: exam.createdAt,
        generatedSet: exam.generatedSet || null,
        type: exam.type,
        allowRetake: exam.allowRetake || false,
        mcqNegativeMarking: exam.mcqNegativeMarking || 0,
        cqTotalQuestions: exam.cqTotalQuestions || 0,
        cqRequiredQuestions: exam.cqRequiredQuestions || 0,
        sqTotalQuestions: exam.sqTotalQuestions || 0,
        sqRequiredQuestions: exam.sqRequiredQuestions || 0,
      };

      // Cache the result for 2 minutes
      DatabaseCache.set(cacheKey, examData, 120000);
      
      return createApiResponse(examData);
    } catch (error) {
      console.error('Failed to fetch exam:', error);
      return createApiResponse(null, 'Failed to fetch exam', 500);
    }
  }

  // Fetch all exams with caching
  const cacheKey = 'exams:all';
  const cached = DatabaseCache.get(cacheKey);
  
  if (cached) {
    return createApiResponse(cached);
  }

  try {
    const exams = await safeDatabaseOperation(
      async () => {
        const db = await DatabaseClient.getInstance();
        return await db.exam.findMany({
          orderBy: { date: 'desc' },
          include: {
            class: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        });
      },
      'Fetch all exams'
    );

    const examsData = exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      description: exam.description,
      date: exam.date,
      subject: exam.class?.name || '',
      totalMarks: exam.totalMarks,
      isActive: exam.isActive,
      createdBy: exam.createdBy?.name || '',
      classId: exam.classId,
      createdAt: exam.createdAt,
      type: exam.type,
      allowRetake: exam.allowRetake || false,
      mcqNegativeMarking: exam.mcqNegativeMarking || 0,
      cqTotalQuestions: exam.cqTotalQuestions || 0,
      cqRequiredQuestions: exam.cqRequiredQuestions || 0,
      sqTotalQuestions: exam.sqTotalQuestions || 0,
      sqRequiredQuestions: exam.sqRequiredQuestions || 0,
    }));

    // Cache the result for 1 minute
    DatabaseCache.set(cacheKey, examsData, 60000);
    
    return createApiResponse(examsData);
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return createApiResponse(null, 'Failed to fetch exams', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return createApiResponse(null, 'Not authenticated', 401);
    }

    const body = await request.json();
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      duration,
      type,
      totalMarks,
      passMarks,
      classId,
      allowRetake,
      instructions,
      mcqNegativeMarking,
      cqTotalQuestions,
      cqRequiredQuestions,
      sqTotalQuestions,
      sqRequiredQuestions,
    } = body;

    if (!name || !date || !startTime || !endTime || !duration || !type || !totalMarks || !passMarks || !classId) {
      return createApiResponse(null, 'Missing required fields', 400);
    }

            const createdExam = await safeDatabaseOperation(
          async () => {
            const db = await DatabaseClient.getInstance();
            return await db.exam.create({
              data: {
                name,
                description,
                date: new Date(date),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                type,
                totalMarks,
                passMarks,
                isActive: false,
                allowRetake: allowRetake || false,
                instructions,
                mcqNegativeMarking: mcqNegativeMarking || 0,
                cqTotalQuestions: cqTotalQuestions ?? 8,
                cqRequiredQuestions: cqRequiredQuestions ?? 5,
                sqTotalQuestions: sqTotalQuestions ?? 15,
                sqRequiredQuestions: sqRequiredQuestions ?? 5,
                classId,
                createdById: auth.user.id,
              },
            });
          },
          'Create exam'
        );

    // Invalidate exams cache
    DatabaseCache.invalidate('exams');

    return createApiResponse({
      id: createdExam.id,
      name: createdExam.name,
      message: 'Exam created successfully',
    });
  } catch (error) {
    console.error('Failed to create exam:', error);
    return createApiResponse(null, 'Failed to create exam', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return createApiResponse(null, 'Not authenticated', 401);
    }

    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');
    const body = await request.json();
    const { id: bodyId, ...updateData } = body;

    // Use ID from query parameter or request body
    const examId = queryId || bodyId;

    if (!examId) {
      return createApiResponse(null, 'Exam ID is required', 400);
    }

    const updatedExam = await safeDatabaseOperation(
      async () => {
        const db = await DatabaseClient.getInstance();
        return await db.exam.update({
          where: { id: examId },
          data: updateData,
        });
      },
      'Update exam'
    );

    // Invalidate caches
    DatabaseCache.invalidate('exams');
    DatabaseCache.invalidate(`exam:${examId}`);

    return createApiResponse({
      id: updatedExam.id,
      name: updatedExam.name,
      message: 'Exam updated successfully',
    });
  } catch (error) {
    console.error('Failed to update exam:', error);
    return createApiResponse(null, 'Failed to update exam', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return createApiResponse(null, 'Not authenticated', 401);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return createApiResponse(null, 'Exam ID is required', 400);
    }

    await safeDatabaseOperation(
      async () => {
        const db = await DatabaseClient.getInstance();
        return await db.exam.delete({
          where: { id },
        });
      },
      'Delete exam'
    );

    // Invalidate caches
    DatabaseCache.invalidate('exams');
    DatabaseCache.invalidate(`exam:${id}`);

    return createApiResponse({
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete exam:', error);
    return createApiResponse(null, 'Failed to delete exam', 500);
  }
} 