import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { safeDatabaseOperation, createApiResponse, DatabaseCache } from '@/lib/db-utils';
import { DatabaseClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    // Fetch single exam by ID with caching (Stale-While-Revalidate)
    const cacheKey = `exam:${id}`;
    const cached = DatabaseCache.getSWR(cacheKey);

    if (cached && !cached.isStale) {
      return createApiResponse(cached.data, undefined, 200, {
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
      });
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
              examSets: {
                include: {
                  questions: {
                    select: {
                      subject: true,
                    }
                  }
                }
              }
            },
          });
        },
        'Fetch single exam'
      );

      if (!exam) {
        return createApiResponse(null, 'Exam not found', 404);
      }

      // Extract subject from questions - get the most common subject
      let examSubject = '';
      const allQuestions = exam.examSets.flatMap(set => set.questions);
      if (allQuestions.length > 0) {
        const subjectCounts: { [key: string]: number } = {};
        allQuestions.forEach(q => {
          if (q.subject) {
            subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          }
        });

        // Find the subject with the highest count
        const entries = Object.entries(subjectCounts);
        if (entries.length > 0) {
          const mostCommonSubject = entries.reduce((a, b) =>
            (subjectCounts[a[0]] || 0) > (subjectCounts[b[0]] || 0) ? a : b
          );
          examSubject = mostCommonSubject[0] || '';
        }
      }

      const examAny = exam as any;
      const examData = {
        id: examAny.id,
        name: examAny.name,
        description: examAny.description,
        date: examAny.date,
        startTime: examAny.startTime,
        endTime: examAny.endTime,
        subject: examSubject || examAny.class?.name || '', // Use actual subject, fallback to class name
        totalMarks: examAny.totalMarks,
        isActive: examAny.isActive,
        createdBy: examAny.createdBy?.name || '',
        classId: examAny.classId,
        createdAt: examAny.createdAt,
        generatedSet: examAny.generatedSet || null,
        type: examAny.type,
        allowRetake: examAny.allowRetake || false,
        mcqNegativeMarking: examAny.mcqNegativeMarking,
        cqTotalQuestions: examAny.cqTotalQuestions || 0,
        cqRequiredQuestions: examAny.cqRequiredQuestions || 0,
        sqTotalQuestions: examAny.sqTotalQuestions || 0,
        sqRequiredQuestions: examAny.sqRequiredQuestions || 0,
        objectiveTime: examAny.objectiveTime || null,
        cqSqTime: examAny.cqSqTime || null,
        cqSubsections: examAny.cqSubsections || null,
      };

      // Cache the result for 5 minutes (TTL)
      DatabaseCache.set(cacheKey, examData, 300000);

      // Return fresh data (or SWR stale match if we had one but updated in bg? No, this is fresh fetch)
      return createApiResponse(examData, undefined, 200, {
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
      });
    } catch (error) {
      console.error('Failed to fetch exam:', error);
      // If we have stale data, return it as fallback even on error
      if (cached) {
        return createApiResponse(cached.data, undefined, 200, {
          cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
        });
      }
      return createApiResponse(null, 'Failed to fetch exam', 500);
    }
  }

  // Fetch exams with caching and pagination (SWR)
  // url is already defined at line 8
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '1000');
  const skip = (page - 1) * limit;

  const cacheKey = `exams:all:${page}:${limit}`;
  const cached = DatabaseCache.getSWR(cacheKey);

  // If valid cache exists, return immediately (Edge will handle SWR)
  if (cached && !cached.isStale) {
    return createApiResponse(cached.data, undefined, 200, {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
    });
  }

  try {
    const [exams, total] = await safeDatabaseOperation(
      async () => {
        const db = await DatabaseClient.getInstance();
        const [data, count] = await Promise.all([
          db.exam.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              description: true,
              date: true,
              startTime: true,
              endTime: true,
              totalMarks: true,
              isActive: true,
              classId: true,
              createdAt: true,
              type: true,
              allowRetake: true,
              mcqNegativeMarking: true,
              cqTotalQuestions: true,
              cqRequiredQuestions: true,
              sqTotalQuestions: true,
              sqRequiredQuestions: true,
              objectiveTime: true,
              cqSqTime: true,
              cqSubsections: true,
              class: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true } },
              examSets: {
                take: 1,
                select: {
                  questions: {
                    take: 5,
                    select: {
                      subject: true,
                    }
                  }
                }
              }
            } as any,
          }),
          db.exam.count()
        ]);
        return [data, count];
      },
      'Fetch exams page'
    );

    const examsData = (exams as any[]).map((exam) => {
      // Extract subject from questions - get the most common subject from sample
      let examSubject = '';
      const examAny = exam as any;
      const sampleQuestions = (examAny.examSets || []).flatMap((set: any) => set.questions || []);
      if (sampleQuestions.length > 0) {
        const subjectCounts: { [key: string]: number } = {};
        sampleQuestions.forEach((q: any) => {
          if (q.subject) {
            subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          }
        });

        // Find the subject with the highest count
        const entries = Object.entries(subjectCounts);
        if (entries.length > 0) {
          const mostCommonSubject = entries.reduce((a, b) =>
            (subjectCounts[a[0]] || 0) > (subjectCounts[b[0]] || 0) ? a : b
          );
          examSubject = mostCommonSubject[0] || '';
        }
      }

      return {
        id: examAny.id,
        name: examAny.name,
        description: examAny.description,
        date: examAny.date,
        startTime: examAny.startTime,
        endTime: examAny.endTime,
        subject: examSubject || examAny.class?.name || '', // Use actual subject, fallback to class name
        totalMarks: examAny.totalMarks,
        isActive: examAny.isActive,
        createdBy: examAny.createdBy?.name || '',
        classId: examAny.classId,
        createdAt: examAny.createdAt,
        type: examAny.type,
        allowRetake: examAny.allowRetake || false,
        mcqNegativeMarking: examAny.mcqNegativeMarking,
        cqTotalQuestions: examAny.cqTotalQuestions || 0,
        cqRequiredQuestions: examAny.cqRequiredQuestions || 0,
        sqTotalQuestions: examAny.sqTotalQuestions || 0,
        sqRequiredQuestions: examAny.sqRequiredQuestions || 0,
        objectiveTime: examAny.objectiveTime || null,
        cqSqTime: examAny.cqSqTime || null,
        cqSubsections: examAny.cqSubsections || null,
      };
    });

    // Cache the result for 5 minutes
    const responseData = {
      exams: examsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    DatabaseCache.set(cacheKey, responseData, 300000);

    return createApiResponse(responseData, undefined, 200, {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
    });
  } catch (error: any) {
    console.error('Failed to fetch exams:', error);
    console.error('Error stack:', error.stack);
    if (cached) {
      return createApiResponse(cached.data, undefined, 200, {
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
      });
    }
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
      objectiveTime,
      cqSqTime,
      cqSubsections,
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
            mcqNegativeMarking: mcqNegativeMarking ?? 0,
            cqTotalQuestions: cqTotalQuestions ?? 0,
            cqRequiredQuestions: cqRequiredQuestions ?? 0,
            sqTotalQuestions: sqTotalQuestions ?? 0,
            sqRequiredQuestions: sqRequiredQuestions ?? 0,
            objectiveTime: objectiveTime ?? null,
            cqSqTime: cqSqTime ?? null,
            cqSubsections: cqSubsections || null,
            classId,
            createdById: auth.user.id,
          } as any,
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
  } catch (error: any) {
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

    // Check for bulk delete in body
    let idsToDelete: string[] = [];
    if (id) {
      idsToDelete = [id];
    } else {
      try {
        const body = await request.json();
        if (body.ids && Array.isArray(body.ids)) {
          idsToDelete = body.ids;
        }
      } catch (e) {
        // Body might be empty if just checking params
      }
    }

    if (idsToDelete.length === 0) {
      return createApiResponse(null, 'Exam ID or IDs are required', 400);
    }

    await safeDatabaseOperation(
      async () => {
        const db = await DatabaseClient.getInstance();
        return await db.exam.deleteMany({
          where: {
            id: {
              in: idsToDelete
            }
          },
        });
      },
      `Delete ${idsToDelete.length} exams`
    );

    // Invalidate caches
    DatabaseCache.invalidate('exams');
    idsToDelete.forEach(examId => {
      DatabaseCache.invalidate(`exam:${examId}`);
    });

    return createApiResponse({
      message: `${idsToDelete.length} exam(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Failed to delete exam(s):', error);
    return createApiResponse(null, 'Failed to delete exam(s)', 500);
  }
} 