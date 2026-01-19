import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

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
      const answers = existingSubmission.answers as Record<string, any>;
      // It is finished if it does NOT have "in_progress" status OR if submittedAt is set
      return (!answers || answers._status !== 'in_progress') || !!existingSubmission.submittedAt;
    })();

    // Decision: Should we create a new submission?
    // Yes if: 
    // 1. No submission exists
    // 2. Latest is finished AND retake is allowed
    const shouldCreateNew = !existingSubmission || (isFinished && exam.allowRetake);

    // If no submission exists or we are retaking, create one
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
          // MARKER: Use _status to indicate in-progress since submittedAt has a default value
          answers: { _status: "in_progress" },
          startedAt: new Date(),
          examSetId: assignedExamSetId
        }
      });
    } else if (!existingSubmission.startedAt) {
      // If for some reason startedAt is missing on an existing active record, set it now
      existingSubmission = await prisma.examSubmission.update({
        where: { id: existingSubmission.id },
        data: { startedAt: new Date() }
      });
    } else {
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
      // ... existing fallback logic if needed, but above steps should cover it
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
    const answers = existingSubmission.answers as Record<string, any>;
    const isInProgress = answers && answers._status === 'in_progress';
    // If it's legacy (no _status), we assume it IS submitted because submittedAt is set by default.
    // Wait, for NEW exams it works. For OLD exams?
    // If an old exam was "started" but essentially "submitted" immediately due to the bug, the user is stuck.
    // If we want to unblock them, we might need to assume if answers is EMPTY (or just has _status), it's not submitted.
    // A simplified check: If answers is empty OR has _status='in_progress', it is NOT submitted.
    const hasAnswers = answers && Object.keys(answers).filter(k => k !== '_status').length > 0;

    // Final logic: It is submitted if it has answers AND not in progress.
    // If _status is missing but submittedAt is present, we consider it submitted (legacy behavior).
    // If _status is 'submitted', it is definitely submitted.
    // Ideally, we trust `submittedAt` check mainly because we only set it on final submission.

    const isSubmittedStatus = answers?._status === 'submitted';
    const isLegacySubmitted = !answers?._status && !!existingSubmission?.submittedAt;

    // So if it's explicitly submitted OR (legacy and has submittedAt time), it's done.
    // Also, if `isInProgress` is true, it's definitely NOT submitted (unless bugged, but we fixed submit route).
    // UPDATE: We now prioritize `submittedAt`. If `submittedAt` is set, it IS submitted, regardless of `_status`.
    // This fixes the case where an exam might have `_status: in_progress` but was actually submitted (bug state or legacy).

    const isActuallySubmitted = isSubmittedStatus || !!existingSubmission?.submittedAt;

    const hasSubmitted = isActuallySubmitted && !exam.allowRetake;

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