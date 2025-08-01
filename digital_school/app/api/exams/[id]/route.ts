// app/api/exams/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Question, QuestionType, Difficulty } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for query parameter validation
const getQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  subject: z.string().optional(),
});


// GET handler to fetch exam details and a paginated/filtered list of available questions
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: examId } = await params;
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // 1. Fetch the exam first to get its context (e.g., classId)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: {
          include: {
            // We can decide if we need the full questions here or just a count
            _count: { select: { questions: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 2. Validate and parse query parameters for filtering and pagination
    const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = getQuestionsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }
    const { page, limit, type, difficulty, subject } = validation.data;
    const skip = (page - 1) * limit;

    // 3. Construct a dynamic where clause for professional-grade filtering
    const whereClause: any = {
      classId: exam.classId, // CRITICAL: Only show questions for the exam's class
      // Add other filters if they are provided
      ...(type && { type }),
      ...(difficulty && { difficulty }),
      ...(subject && { subject: { contains: subject, mode: 'insensitive' } }),
    };

    // 4. Fetch the filtered and paginated questions and the total count for pagination UI
    const [availableQuestions, totalQuestions] = await prisma.$transaction([
      prisma.question.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.question.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      exam,
      questions: {
        data: availableQuestions,
        meta: {
          total: totalQuestions,
          page,
          limit,
          totalPages: Math.ceil(totalQuestions / limit),
        },
      },
    });

  } catch (error) {
    console.error('GET /api/exams/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT handler for MANUAL exam set creation
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const { id: examId } = await params;
    const body = await request.json();
    const { name, questionIds } = body;

    if (!examId || !name || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: examId, name, and a non-empty array of questionIds' }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const selectedQuestions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
    const totalMarksOfSelectedQuestions = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

    if (totalMarksOfSelectedQuestions !== exam.totalMarks) {
      return NextResponse.json({ error: `Marks mismatch. Exam requires ${exam.totalMarks}, but selected questions total ${totalMarksOfSelectedQuestions}.` }, { status: 400 });
    }

    const newExamSet = await prisma.examSet.create({
      data: {
        name,
        exam: { connect: { id: examId } },
        createdBy: { connect: { id: exam.createdById } },
        questionsJson: selectedQuestions,
        questions: { connect: questionIds.map((id: string) => ({ id })) },
      } as any, // Cast to any to avoid Prisma type error if needed
    });

    return NextResponse.json(newExamSet, { status: 201 });
  } catch (error: any) {
    console.error('PUT /api/exams/[id] Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An exam set with this name already exists for this exam.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// POST handler for AUTOMATIC exam set generation
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const { id: examId } = await params;
    const body = await request.json();
    const { name } = body; // Name for the new set

    if (!name) {
      return NextResponse.json({ error: 'A name for the new set is required.' }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Fetch all candidate questions from the correct class
    const candidateQuestions = await prisma.question.findMany({
      where: { classId: exam.classId },
    });

    // --- Knapsack-like problem to find a subset of questions that sums to totalMarks ---
    // This is a simplified greedy approach. A more complex dynamic programming solution
    // could be used for guaranteed optimal results, but is more computationally expensive.

    // Shuffle candidates to get unique sets each time
    const shuffledQuestions = candidateQuestions.sort(() => 0.5 - Math.random());

    const generatedSet: Question[] = [];
    let currentMarks = 0;

    // A simple greedy algorithm to find a matching set
    for (const question of shuffledQuestions) {
      if (currentMarks + question.marks <= exam.totalMarks) {
        generatedSet.push(question);
        currentMarks += question.marks;
      }
      if (currentMarks === exam.totalMarks) break;
    }

    if (currentMarks !== exam.totalMarks) {
      return NextResponse.json({ error: `Could not automatically generate a set with total marks of ${exam.totalMarks}. Please try again or create a set manually.` }, { status: 409 }); // 409 Conflict
    }

    const newExamSet = await prisma.examSet.create({
      data: {
        name,
        exam: { connect: { id: examId } },
        createdBy: { connect: { id: exam.createdById } },
        questionsJson: generatedSet,
        questions: { connect: generatedSet.map(q => ({ id: q.id })) },
      } as any, // Cast to any to avoid Prisma type error if needed
    });

    return NextResponse.json(newExamSet, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/exams/[id] Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An exam set with this name already exists for this exam.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
