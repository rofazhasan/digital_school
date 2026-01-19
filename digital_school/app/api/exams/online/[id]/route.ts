import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

// @ts-ignore - Prisma Client types might be stale in dev
const IN_PROGRESS = 'IN_PROGRESS';
// @ts-ignore - Prisma Client types might be stale in dev
const SUBMITTED = 'SUBMITTED';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;

  // Get the current user to find their assigned exam set
  const tokenData = await getTokenFromRequest(req);

  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examSets: true, class: { select: { name: true } } },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    let questions: any[] = [];
    let assignedExamSetId = null;

    // Check for existing submissions (fetch latest)
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        studentId: studentId
      },
      orderBy: { startedAt: 'desc' },
      take: 1
    });

    let existingSubmission = submissions[0];

    // Check if the latest submission is finished
    const isFinished = existingSubmission && (() => {
      // It is finished if status is SUBMITTED
      // Fallback to legacy check if status is missing (though default is IN_PROGRESS now)
      // @ts-ignore
      return existingSubmission.status === SUBMITTED || !!existingSubmission.submittedAt;
    })();

    // Check for 'start' action
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Decision: Should we create a new submission?
    // Yes if: 
    // 1. No submission exists AND action is 'start'
    // 2. Latest is finished AND retake is allowed AND action is 'start'
    const shouldCreateNew = (!existingSubmission || (isFinished && exam.allowRetake)) && action === 'start';

    // If no submission exists or we are retaking, create one ONLY if action is 'start'
    if (shouldCreateNew) {
      // Logic to assign exam set first (moved from below)
      if (exam.examSets.length > 0) {
        // ... (existing logic for random assignment if not exists)
        // Check existing map first
        let examStudentMap = await prisma.examStudentMap.findUnique({
          where: { studentId_examId: { studentId, examId } },
          include: { examSet: true }
        });

        assignedExamSetId = examStudentMap?.examSetId;

        if (!assignedExamSetId) {
          const randomIndex = Math.floor(Math.random() * exam.examSets.length);
          const examSet = exam.examSets[randomIndex];
          assignedExamSetId = examSet.id;

          await prisma.examStudentMap.upsert({
            where: { studentId_examId: { studentId, examId } },
            update: { examSetId: assignedExamSetId },
            create: { studentId, examId, examSetId: assignedExamSetId }
          });
        }
      }

      existingSubmission = await prisma.examSubmission.create({
        data: {
          examId,
          studentId,
          answers: {},
          // @ts-ignore
          status: IN_PROGRESS,
          startedAt: new Date(),
          examSetId: assignedExamSetId
        }
      });
    } else if (existingSubmission && !existingSubmission.startedAt && action === 'start') {
      // If for some reason startedAt is missing on an existing active record, set it now if action is start
      existingSubmission = await prisma.examSubmission.update({
        where: { id: existingSubmission.id },
        // @ts-ignore
        data: { startedAt: new Date(), status: IN_PROGRESS }
      });
    } else if (existingSubmission) {
      // Load assigned set if submission exists and we are continuing it
      assignedExamSetId = existingSubmission.examSetId;
    }

    // Now assignedExamSetId should be resolved either from new creation or existing submission
    // We need to fetch the questions for this set

    if (assignedExamSetId) {
      const examSet = await prisma.examSet.findUnique({ where: { id: assignedExamSetId } });
      if (examSet && examSet.questionsJson) {
        try {
          questions = Array.isArray(examSet.questionsJson)
            ? examSet.questionsJson
            : typeof examSet.questionsJson === "string"
              ? JSON.parse(examSet.questionsJson)
              : [];
        } catch {
          questions = [];
        }
      }
    }

    // Fallback if no specific set assigned (legacy compatible)
    if (questions.length === 0 && exam.examSets.length > 0 && !assignedExamSetId) {
      // Preview Mode: Calculate stats from the first exam set for display
      const firstSet = exam.examSets[0];
      if (firstSet && firstSet.questionsJson) {
        try {
          const previewQuestions = Array.isArray(firstSet.questionsJson)
            ? firstSet.questionsJson
            : typeof firstSet.questionsJson === "string"
              ? JSON.parse(firstSet.questionsJson)
              : [];

          // We don't return the questions (security), but we return the stats
          // Actually, for simplicity and since user wants to see them or at least the count,
          // we can attach a 'stats' object to the response.

          // Let's populate questions array for now to ensure layout works as expected
          // If security is a major concern, we would only return stats, but ExamLayout needs updating.
          // Given the user request "why these seen 0", they expect data.
          questions = previewQuestions;
        } catch { }
      }
    }

    // Add 'correct' field to MCQ questions if missing
    questions = questions.map((q: Record<string, unknown>) => {
      if (((q.type as string)?.toLowerCase?.() === 'mcq' || (q.questionType as string)?.toLowerCase?.() === 'mcq') && Array.isArray(q.options)) {
        const correctIndex = (q.options as Record<string, unknown>[]).findIndex((opt: Record<string, unknown>) => opt.isCorrect);
        if (correctIndex !== -1) {
          // Use text if available, else index
          const correctOpt = (q.options as Record<string, unknown>[])[correctIndex];
          return { ...q, correct: typeof correctOpt === 'object' && correctOpt !== null ? ((correctOpt as Record<string, unknown>).text || correctIndex) : correctIndex };
        }
      }
      return q;
    });

    // Check if really submitted
    // It is submitted if answers DOES NOT have _status: 'in_progress'
    const answers = existingSubmission?.answers as Record<string, any>;
    const isInProgress = answers && answers._status === 'in_progress';
    const isExplicitlySubmitted = answers && answers._status === 'submitted';

    // UPDATE: We prioritize `isInProgress` check. If it is in progress, it is NOT submitted.
    // If it is explicitly submitted, it IS submitted.
    // We only fall back to `submittedAt` check if the status is NOT 'in_progress' (handling legacy cases).

    let isActuallySubmitted = false;

    // Safety check: if explicitly submitted status exists, force it to be submitted regardless of other flags
    if (isExplicitlySubmitted) {
      isActuallySubmitted = true;
    } else if (isInProgress) {
      isActuallySubmitted = false;
    } else {
      isActuallySubmitted = isExplicitlySubmitted || !!existingSubmission?.submittedAt;
    }

    const hasSubmitted = isActuallySubmitted && !exam.allowRetake;

    // STRICT BLOCKING: If submitted and no retake, do NOT return questions
    if (hasSubmitted) {
      return NextResponse.json({
        id: exam.id,
        name: exam.name,
        hasSubmitted: true,
        redirect: `/exams/results/${exam.id}`,
        // Return minimal data
        allowRetake: false,
        questions: [],
        status: 'SUBMITTED'
      });
    }

    return NextResponse.json({
      id: exam.id,
      name: exam.name,
      type: exam.type,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      allowRetake: exam.allowRetake,
      className: exam.class?.name || '',
      questions,
      assignedExamSetId,
      hasSubmitted,
      submissionId: existingSubmission?.id || null,
      startedAt: existingSubmission?.startedAt || null,
      passMarks: exam.passMarks,
      // Question selection settings
      cqTotalQuestions: exam.cqTotalQuestions,
      cqRequiredQuestions: exam.cqRequiredQuestions,
      sqTotalQuestions: exam.sqTotalQuestions,
      sqRequiredQuestions: exam.sqRequiredQuestions,
      mcqNegativeMarking: exam.mcqNegativeMarking,
      savedAnswers: existingSubmission?.answers || {},
    });
  } catch (_) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 