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
      const allQuestions = (exam.examSets || []).flatMap(set => set.questions || []);
      if (allQuestions.length > 0) {
        const subjectCounts: { [key: string]: number } = {};
        allQuestions.forEach(q => {
          if (q.subject) {
            subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          }
        });

        const entries = Object.entries(subjectCounts);
        if (entries.length > 0) {
          const mostCommonSubject = entries.reduce((a, b) =>
            (subjectCounts[a[0]] || 0) > (subjectCounts[b[0]] || 0) ? a : b
          );
          examSubject = mostCommonSubject[0] || '';
        }
      }

      const examData = {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
        subject: examSubject || (exam.class as any)?.name || '',
        totalMarks: exam.totalMarks,
        isActive: exam.isActive,
        createdBy: (exam.createdBy as any)?.name || '',
        classId: exam.classId,
        createdAt: exam.createdAt,
        generatedSet: exam.generatedSet || null,
        type: exam.type,
        allowRetake: exam.allowRetake || false,
        mcqNegativeMarking: exam.mcqNegativeMarking,
        cqTotalQuestions: exam.cqTotalQuestions || 0,
        cqRequiredQuestions: exam.cqRequiredQuestions || 0,
        sqTotalQuestions: exam.sqTotalQuestions || 0,
        sqRequiredQuestions: exam.sqRequiredQuestions || 0,
        objectiveTime: exam.objectiveTime || null,
        cqSqTime: exam.cqSqTime || null,
        cqSubsections: exam.cqSubsections || null,
      };

      // Cache the result for 5 minutes (TTL)
      DatabaseCache.set(cacheKey, examData, 300000);

      return createApiResponse(examData, undefined, 200, {
        cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
      });
    } catch (error) {
      console.error('Failed to fetch exam:', error);
      if (cached) {
        return createApiResponse(cached.data, undefined, 200, {
          cacheControl: 'public, s-maxage=60, stale-while-revalidate=300'
        });
      }
      return createApiResponse(null, 'Failed to fetch exam', 500);
    }
  }

  // Fetch exams with caching and pagination (SWR)
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '1000');
  const summary = url.searchParams.get('summary') === 'true';
  const skip = (page - 1) * limit;

  // Filter parameters
  const search = url.searchParams.get('search') || '';
  const classId = url.searchParams.get('classId') || '';
  const typeFilter = url.searchParams.get('type') || '';
  const subjectFilter = url.searchParams.get('subject') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const sortBy = url.searchParams.get('sortBy') || 'date';
  const sortOrder = url.searchParams.get('sortOrder') || 'asc';

  const cacheKey = `exams:all:${page}:${limit}:${summary}:${search}:${classId}:${typeFilter}:${subjectFilter}:${statusFilter}:${sortBy}:${sortOrder}`;
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

        // Build where clause
        const where: any = {};
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }
        if (classId && classId !== 'all') where.classId = classId;
        if (typeFilter && typeFilter !== 'all') where.type = typeFilter;
        if (statusFilter === 'active') where.isActive = true;
        if (statusFilter === 'pending') where.isActive = false;

        const selectFields: any = {
          id: true,
          name: true,
          date: true,
          startTime: true,
          endTime: true,
          totalMarks: true,
          isActive: true,
          classId: true,
          type: true,
          allowRetake: true,
          duration: true,
          mcqNegativeMarking: true, // Always include for cards
          mcNegativeMarking: true,  // Include for redundancy
          class: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        };

        if (!summary) {
          Object.assign(selectFields, {
            description: true,
            createdAt: true,
            cqTotalQuestions: true,
            cqRequiredQuestions: true,
            sqTotalQuestions: true,
            sqRequiredQuestions: true,
            objectiveTime: true,
            cqSqTime: true,
            cqSubsections: true,
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
          });
        }

        let orderByClause: any = { date: 'asc' };
        if (sortBy === 'created') {
          orderByClause = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        } else if (sortBy === 'name') {
          orderByClause = { name: sortOrder === 'desc' ? 'desc' : 'asc' };
        } else if (sortBy === 'marks') {
          orderByClause = { totalMarks: sortOrder === 'desc' ? 'desc' : 'asc' };
        } else {
          orderByClause = { date: sortOrder === 'desc' ? 'desc' : 'asc' };
        }

        const [data, count] = await Promise.all([
          db.exam.findMany({
            where,
            orderBy: orderByClause,
            skip,
            take: limit,
            select: selectFields,
          }),
          db.exam.count({ where })
        ]);

        return [data, count];
      },
      'Fetch exams page'
    );

    const examsData = (exams as any[]).map((exam) => {
      let examSubject = '';
      if (!summary) {
        const sampleQuestions = (exam.examSets || []).flatMap((set: any) => set.questions || []);
        if (sampleQuestions.length > 0) {
          const subjectCounts: { [key: string]: number } = {};
          sampleQuestions.forEach((q: any) => {
            if (q.subject) subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          });

          const entries = Object.entries(subjectCounts);
          if (entries.length > 0) {
            const mostCommonSubject = entries.reduce((a, b) =>
              (subjectCounts[a[0]] || 0) > (subjectCounts[b[0]] || 0) ? a : b
            );
            examSubject = mostCommonSubject[0] || '';
          }
        }
      }

      return {
        id: exam.id,
        name: exam.name,
        description: summary ? undefined : exam.description,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
        subject: examSubject || exam.class?.name || '',
        totalMarks: exam.totalMarks,
        isActive: exam.isActive,
        createdBy: exam.createdBy?.name || '',
        classId: exam.classId,
        createdAt: summary ? undefined : exam.createdAt,
        type: exam.type,
        allowRetake: exam.allowRetake || false,
        duration: exam.duration,
        mcqNegativeMarking: exam.mcqNegativeMarking,
        mcNegativeMarking: exam.mcNegativeMarking,
        cqTotalQuestions: summary ? undefined : exam.cqTotalQuestions,
        cqRequiredQuestions: summary ? undefined : exam.cqRequiredQuestions,
        sqTotalQuestions: summary ? undefined : exam.sqTotalQuestions,
        sqRequiredQuestions: summary ? undefined : exam.sqRequiredQuestions,
        objectiveTime: summary ? undefined : exam.objectiveTime,
        cqSqTime: summary ? undefined : exam.cqSqTime,
        cqSubsections: summary ? undefined : exam.cqSubsections,
      };
    });

    // Post-fetch filtering by subject if requested
    let finalExamsData = examsData;
    if (subjectFilter && subjectFilter !== 'all') {
      finalExamsData = examsData.filter(e => e.subject && e.subject.toLowerCase() === subjectFilter.toLowerCase());
    }

    // Cache the result for 5 minutes
    const responseData = {
      exams: finalExamsData,
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

    const body = await request.json().catch(() => ({}));

    // Support both single exam object and bulk array in POST /api/exams
    const isBulk = Array.isArray(body) || Array.isArray(body?.exams);
    const examList: any[] = Array.isArray(body) ? body : Array.isArray(body?.exams) ? body.exams : [body];

    if (examList.length === 0) {
      return createApiResponse(null, 'No exam data provided', 400);
    }

    const parseExamData = (item: any) => {
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
      } = item;

      if (!name || !date || !classId) {
        throw new Error(`Missing required fields for exam "${name || 'Unnamed'}" (name, date, classId are required)`);
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format for exam "${name}"`);
      }

      const dur = duration !== undefined && duration !== null ? Number(duration) : 60;
      const startObj = startTime ? new Date(startTime) : dateObj;
      const endObj = endTime ? new Date(endTime) : new Date(startObj.getTime() + dur * 60000);

      return {
        name,
        description: description || '',
        date: dateObj,
        startTime: isNaN(startObj.getTime()) ? dateObj : startObj,
        endTime: isNaN(endObj.getTime()) ? new Date(dateObj.getTime() + dur * 60000) : endObj,
        duration: dur,
        type: (type || 'OFFLINE').toUpperCase(),
        totalMarks: totalMarks !== undefined && totalMarks !== null ? Number(totalMarks) : 100,
        passMarks: passMarks !== undefined && passMarks !== null ? Number(passMarks) : 33,
        isActive: false,
        allowRetake: !!allowRetake,
        instructions: instructions || null,
        mcqNegativeMarking: mcqNegativeMarking !== undefined ? Number(mcqNegativeMarking) : 0,
        cqTotalQuestions: cqTotalQuestions ? Number(cqTotalQuestions) : 0,
        cqRequiredQuestions: cqRequiredQuestions ? Number(cqRequiredQuestions) : 0,
        sqTotalQuestions: sqTotalQuestions ? Number(sqTotalQuestions) : 0,
        sqRequiredQuestions: sqRequiredQuestions ? Number(sqRequiredQuestions) : 0,
        objectiveTime: objectiveTime ? Number(objectiveTime) : null,
        cqSqTime: cqSqTime ? Number(cqSqTime) : null,
        cqSubsections: cqSubsections || null,
        classId,
        createdById: auth.user.id,
      };
    };

    if (isBulk && examList.length > 1) {
      const parsedList = examList.map(parseExamData);
      const db = await DatabaseClient.getInstance();
      const createdExams = await db.$transaction(
        parsedList.map(data => db.exam.create({ data }))
      );

      DatabaseCache.invalidate('exams');

      return createApiResponse(
        { count: createdExams.length, exams: createdExams },
        `${createdExams.length} exams created successfully`,
        201
      );
    }

    // Single exam creation
    const examData = parseExamData(examList[0]);
    const db = await DatabaseClient.getInstance();
    const createdExam = await db.exam.create({ data: examData });

    DatabaseCache.invalidate('exams');

    return createApiResponse(
      {
        id: createdExam.id,
        name: createdExam.name,
        date: createdExam.date,
        type: createdExam.type,
        message: 'Exam created successfully',
      },
      'Exam created successfully',
      201
    );
  } catch (error: any) {
    console.error('Failed to create exam:', error);
    return createApiResponse(null, error.message || 'Failed to create exam', 500);
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
    const body = await request.json().catch(() => ({}));
    const { id: bodyId, ...rawUpdateData } = body;

    // Use ID from query parameter or request body
    const examId = queryId || bodyId;

    if (!examId) {
      return createApiResponse(null, 'Exam ID is required', 400);
    }

    // Sanitize and format data for Prisma
    const updateData: any = {};
    if (typeof rawUpdateData.name === 'string') updateData.name = rawUpdateData.name;
    if (typeof rawUpdateData.description === 'string') updateData.description = rawUpdateData.description;
    if (rawUpdateData.date) updateData.date = new Date(rawUpdateData.date);
    if (rawUpdateData.startTime !== undefined) updateData.startTime = rawUpdateData.startTime ? new Date(rawUpdateData.startTime) : null;
    if (rawUpdateData.endTime !== undefined) updateData.endTime = rawUpdateData.endTime ? new Date(rawUpdateData.endTime) : null;
    if (typeof rawUpdateData.duration === 'number') updateData.duration = rawUpdateData.duration;
    if (typeof rawUpdateData.allowRetake === 'boolean') updateData.allowRetake = rawUpdateData.allowRetake;
    if (typeof rawUpdateData.isActive === 'boolean') updateData.isActive = rawUpdateData.isActive;
    if (rawUpdateData.type) updateData.type = rawUpdateData.type;
    if (rawUpdateData.objectiveTime !== undefined) updateData.objectiveTime = rawUpdateData.objectiveTime ? Number(rawUpdateData.objectiveTime) : null;
    if (rawUpdateData.cqSqTime !== undefined) updateData.cqSqTime = rawUpdateData.cqSqTime ? Number(rawUpdateData.cqSqTime) : null;
    if (typeof rawUpdateData.totalMarks === 'number') updateData.totalMarks = rawUpdateData.totalMarks;
    if (typeof rawUpdateData.passMarks === 'number') updateData.passMarks = rawUpdateData.passMarks;

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
      isActive: updatedExam.isActive,
      type: updatedExam.type,
      message: 'Exam updated successfully',
    });
  } catch (error) {
    console.error('Failed to update exam:', error);
    return createApiResponse(null, 'Failed to update exam', 500);
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
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