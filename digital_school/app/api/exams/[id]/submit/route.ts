import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;
  const tokenData = await getTokenFromRequest(req);

  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;
  let data;

  try {
    data = await req.json();
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!data || !data.answers) {
    return NextResponse.json({ error: "Missing answers in payload" }, { status: 400 });
  }

  try {
    // Get the exam details to check question limits
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examSets: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Determine Exam Set ID
    // 1. Try finding it from the map
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      select: { examSetId: true }
    });

    let targetExamSetId = examStudentMap?.examSetId || null;

    // 2. If not in map or for validation, try finding it from existing submission
    const existingSubmission = (await prisma.examSubmission.findUnique({
      where: { studentId_examId: { studentId, examId } },
      select: {
        examSetId: true,
        startedAt: true,
        objectiveStartedAt: true,
        cqSqStartedAt: true,
        status: true
      } as any
    })) as any;

    if (!targetExamSetId && existingSubmission?.examSetId) {
      targetExamSetId = existingSubmission.examSetId;
    }

    // Determine current section being submitted
    const section = data.section || 'objective';
    const isObjective = section === 'objective';
    const isCqSq = section === 'cqsq';

    // TIME VALIDATION (Strict Enforcement)
    const bufferMs = 120 * 1000; // 2 minutes buffer
    const now = Date.now();

    // A. Section-Specific Timing
    if (isObjective && (exam as any).objectiveTime && existingSubmission?.objectiveStartedAt) {
      const objStartTime = new Date(existingSubmission.objectiveStartedAt).getTime();
      const objLimitMs = (exam as any).objectiveTime * 60 * 1000;
      if (now > objStartTime + objLimitMs + bufferMs) {
        console.warn(`[Submit] MCQ Time Limit Exceeded for student ${studentId}.`);
        return NextResponse.json({ error: "MCQ time limit exceeded. Submission rejected.", section: 'objective' }, { status: 403 });
      }
    }

    if (isCqSq && (exam as any).cqSqTime && existingSubmission?.cqSqStartedAt) {
      const cqStartTime = new Date(existingSubmission.cqSqStartedAt).getTime();
      const cqLimitMs = (exam as any).cqSqTime * 60 * 1000;
      if (now > cqStartTime + cqLimitMs + bufferMs) {
        console.warn(`[Submit] CQ/SQ Time Limit Exceeded for student ${studentId}.`);
        return NextResponse.json({ error: "CQ/SQ time limit exceeded. Submission rejected.", section: 'cqsq' }, { status: 403 });
      }
    }

    // B. Overall Timing
    if (existingSubmission?.startedAt) {
      const startTime = new Date(existingSubmission.startedAt).getTime();
      const durationMs = exam.duration * 60 * 1000;

      if (now > startTime + durationMs + bufferMs) {
        console.warn(`[Submit] Overall Time Limit Exceeded for user ${studentId}.`);
        return NextResponse.json({ error: "Overall exam time limit exceeded. Submission rejected." }, { status: 403 });
      }
    }

    // Check if student exceeded question limits
    let exceededQuestionLimit = false;
    let cqAnswered = 0;
    let sqAnswered = 0;

    // Process answers
    const processedAnswers = { ...data.answers, _status: 'submitted' };

    // Optimize: Pre-map question types for O(1) lookup
    const questionTypeMap = new Map<string, string>();

    // Build map from all sets (or just the target set if we knew it for sure)
    // If targetExamSetId is known, we optimize by only checking that set
    const setsToProcess = targetExamSetId
      ? exam.examSets.filter((s: any) => s.id === targetExamSetId)
      : exam.examSets;

    for (const examSet of setsToProcess) {
      if (!examSet.questionsJson) continue;
      const questions = Array.isArray(examSet.questionsJson)
        ? examSet.questionsJson
        : typeof examSet.questionsJson === "string"
          ? JSON.parse(examSet.questionsJson)
          : [];

      for (const q of questions) {
        if (q.id) questionTypeMap.set(q.id, (q.type || q.questionType || '').toLowerCase());
      }
    }

    // Analyze answers
    const answerKeys = Object.keys(data.answers).filter(k => !k.endsWith('_images'));

    for (const qId of answerKeys) {
      const val = data.answers[qId];
      const hasWritten = val && val !== "" && val !== "No answer provided";

      if (hasWritten) {
        const type = questionTypeMap.get(qId);
        if (type === 'cq') cqAnswered++;
        else if (type === 'sq') sqAnswered++;
      }
    }

    // Check limits
    if (exam.cqRequiredQuestions && cqAnswered > exam.cqRequiredQuestions) exceededQuestionLimit = true;
    if (exam.sqRequiredQuestions && sqAnswered > exam.sqRequiredQuestions) exceededQuestionLimit = true;

    // Check if there is a CQ/SQ section to follow
    const hasCqSqSection = (exam.cqTotalQuestions || 0) > 0 || (exam.sqTotalQuestions || 0) > 0;
    const isFinalSubmission = isCqSq || (!hasCqSqSection && isObjective);

    const updateData: any = {
      answers: processedAnswers,
      exceededQuestionLimit
    };

    if (isObjective) {
      updateData.objectiveStatus = 'SUBMITTED';
      updateData.objectiveSubmittedAt = new Date();
    }

    if (isCqSq) {
      updateData.cqSqStatus = 'SUBMITTED';
      updateData.cqSqSubmittedAt = new Date();
    }

    if (isFinalSubmission) {
      updateData.status = 'SUBMITTED';
      updateData.submittedAt = new Date();
    }

    // Save submission
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: updateData,
      create: {
        studentId,
        examId,
        examSetId: targetExamSetId,
        ...updateData
      },
    });

    console.log(`[Submit] Success for user ${studentId}, exam ${examId}, set ${targetExamSetId}`);

    // -------------------------------------------------------------------------
    // AUTO-GRADING & AUTO-RELEASE LOGIC
    // -------------------------------------------------------------------------

    // 1. If MCQ Only, evaluate immediately
    // Helper to check if MCQ only (improved check)
    let isMCQOnly = false;
    try {
      const { isMCQOnlyExam } = await import("@/lib/exam-logic");
      isMCQOnly = isMCQOnlyExam(exam, exam.examSets);
    } catch (e) {
      // Fallback if import fails (shouldn't happen)
      isMCQOnly = (exam.cqTotalQuestions === 0 || !exam.cqTotalQuestions) &&
        (exam.sqTotalQuestions === 0 || !exam.sqTotalQuestions);
    }

    if (isMCQOnly) {
      try {
        // Dynamically import to avoid circular dependency issues if any
        const { evaluateSubmission, finalizeAndReleaseExam } = await import("@/lib/exam-logic");

        // Evaluate THIS submission immediately
        await evaluateSubmission(submission, exam, exam.examSets);
        console.log(`✅ Auto-graded submission ${submission.id}`);

        // 2. Check Auto-Release Conditions
        // Condition A: All students in the class have submitted
        // Condition B: Time is over (and this submission might be the trigger)

        const totalStudentsCount = await prisma.studentProfile.count({
          where: { classId: exam.classId, user: { isActive: true } }
        });

        const submittedCount = await prisma.examSubmission.count({
          where: {
            examId: examId,
            // @ts-ignore
            status: 'SUBMITTED'
          }
        });

        const isTimeOver = new Date() > new Date(exam.endTime);
        const allSubmitted = submittedCount >= totalStudentsCount;

        console.log(`[Auto-Release Check] Exam ${examId}: Submitted ${submittedCount}/${totalStudentsCount}, TimeOver: ${isTimeOver}`);

        if (allSubmitted || isTimeOver) {
          console.log(`🚀 Triggering Auto-Release for Exam ${examId}`);
          // This will force-submit any pending ones (if time over) and release results
          await finalizeAndReleaseExam(examId);
        }

      } catch (evalError) {
        console.error("Auto-evaluation error:", evalError);
        // We don't block the response, just log error
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Exam submitted successfully",
    });

  } catch (error: any) {
    console.error("Submission Error:", error);
    // Return the specific error message for debugging
    return NextResponse.json(
      { error: error?.message || "Failed to submit exam" },
      { status: 500 }
    );
  }
} 