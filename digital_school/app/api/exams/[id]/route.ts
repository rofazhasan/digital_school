// app/api/exams/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Question, QuestionType, Difficulty } from '@prisma/client';
import { z } from 'zod';
import { shuffleArray } from '@/lib/utils';
import { DatabaseClient } from '@/lib/db';

// Zod schema for query parameter validation
const getQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// GET handler to fetch exam details and a paginated/filtered list of available questions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: examId } = await params;
    console.log('[API GET] Fetching exam with ID:', examId);

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    const prisma = await DatabaseClient.getInstance();

    // 1. Fetch the exam first to get its context (e.g., classId)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: {
          include: {
            _count: { select: { questions: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    console.log('[API GET] Found exam:', exam ? `ID: ${exam.id}, Name: ${exam.name}` : 'null (404)');

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 2. Validate and parse query parameters for filtering and pagination
    const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = getQuestionsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }
    const { page, limit, type, difficulty, subject, topic, startDate, endDate } = validation.data;
    const skip = (page - 1) * limit;

    // 3. Construct a dynamic where clause for professional-grade filtering
    const whereClause: any = {
      classId: exam.classId, // CRITICAL: Only show questions for the exam's class
      // Add other filters if they are provided
      ...(type && { type }),
      ...(difficulty && { difficulty }),
      ...(subject && { subject: { contains: subject, mode: 'insensitive' } }),
      ...(topic && { topic: { contains: topic, mode: 'insensitive' } }),
      ...(startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      } : (startDate ? {
        createdAt: { gte: new Date(startDate) }
      } : (endDate ? {
        createdAt: { lte: new Date(endDate) }
      } : {}))),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await request.json();
    const { name, questionIds, questionsWithNegativeMarks } = body;

    console.log('[API PUT] Updating exam set for ID:', examId, 'Set Name:', name);

    if (!examId || !name || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: examId, name, and a non-empty array of questionIds' }, { status: 400 });
    }

    const prisma = await DatabaseClient.getInstance();
    const exam = await prisma.exam.findUnique({ where: { id: examId } });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const selectedQuestions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
    const totalMarksOfSelectedQuestions = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

    if (totalMarksOfSelectedQuestions !== exam.totalMarks) {
      return NextResponse.json({ error: `Marks mismatch. Exam requires ${exam.totalMarks}, but selected questions total ${totalMarksOfSelectedQuestions}.` }, { status: 400 });
    }

    // Use questionsWithNegativeMarks if provided, otherwise use selectedQuestions
    let questionsToSave = questionsWithNegativeMarks || selectedQuestions;

    // Sanitize and Shuffle: Ensure MTF questions do not have negative marks AND shuffle options for all types
    questionsToSave = questionsToSave.map((q: any) => {
      const processedQuestion = { ...q };

      // 1. Shuffle options for MCQ and MC
      if (processedQuestion.type === 'MCQ' || processedQuestion.type === 'MC') {
        if (processedQuestion.options && Array.isArray(processedQuestion.options)) {
          // Preserve original index before shuffling
          processedQuestion.options = processedQuestion.options.map((opt: any, idx: number) => {
            if (typeof opt === 'string') return { text: opt, originalIndex: idx };
            return { ...opt, originalIndex: idx };
          });
          processedQuestion.options = shuffleArray(processedQuestion.options);
        }
      }

      // 2. Shuffle right column for MTF
      if (processedQuestion.type === 'MTF') {
        if (processedQuestion.rightColumn && Array.isArray(processedQuestion.rightColumn)) {
          // Preserve original index before shuffling
          processedQuestion.rightColumn = processedQuestion.rightColumn.map((item: any, idx: number) => ({
            ...item,
            originalIndex: idx
          }));
          processedQuestion.rightColumn = shuffleArray(processedQuestion.rightColumn);
        }

        // Remove negative marks for MTF (sanitization)
        const { negativeMarks, ...rest } = processedQuestion;
        return rest;
      }

      return processedQuestion;
    });

    const newExamSet = await prisma.examSet.create({
      data: {
        name,
        exam: { connect: { id: examId } },
        createdBy: { connect: { id: exam.createdById } },
        questionsJson: questionsToSave,
        questions: { connect: questionIds.map((id: string) => ({ id })) },
      } as any,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await request.json();
    const { name } = body;

    console.log('[API POST] Auto-generating exam set for ID:', examId, 'Set Name:', name);

    if (!name) {
      return NextResponse.json({ error: 'A name for the new set is required.' }, { status: 400 });
    }

    const prisma = await DatabaseClient.getInstance();
    const exam = await prisma.exam.findUnique({ where: { id: examId } });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Fetch all candidate questions from the correct class
    const candidateQuestions = await prisma.question.findMany({
      where: { classId: exam.classId },
    });

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
      return NextResponse.json({ error: `Could not automatically generate a set with total marks of ${exam.totalMarks}. Please try again or create a set manually.` }, { status: 409 });
    }

    // Process questions: Shuffle options and calculate negative marks
    const generatedSetWithNegativeMarks = generatedSet.map(q => {
      const processedQuestion = { ...q } as any;

      if (processedQuestion.type === 'MCQ' || processedQuestion.type === 'MC') {
        if (processedQuestion.options && Array.isArray(processedQuestion.options)) {
          processedQuestion.options = processedQuestion.options.map((opt: any, idx: number) => {
            if (typeof opt === 'string') return { text: opt, originalIndex: idx };
            return { ...opt, originalIndex: idx };
          });
          processedQuestion.options = shuffleArray(processedQuestion.options);
        }
      }

      if (processedQuestion.type === 'MTF') {
        if (processedQuestion.rightColumn && Array.isArray(processedQuestion.rightColumn)) {
          processedQuestion.rightColumn = processedQuestion.rightColumn.map((item: any, idx: number) => ({
            ...item,
            originalIndex: idx
          }));
          processedQuestion.rightColumn = shuffleArray(processedQuestion.rightColumn);
        }
      }

      if (processedQuestion.type === 'MCQ' && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
        const negativeMarks = (processedQuestion.marks * exam.mcqNegativeMarking) / 100;
        processedQuestion.negativeMarks = parseFloat(negativeMarks.toFixed(2));
      }

      return processedQuestion;
    });

    const newExamSet = await prisma.examSet.create({
      data: {
        name,
        exam: { connect: { id: examId } },
        createdBy: { connect: { id: exam.createdById } },
        questionsJson: generatedSetWithNegativeMarks,
        questions: { connect: generatedSet.map(q => ({ id: q.id })) },
      } as any,
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
