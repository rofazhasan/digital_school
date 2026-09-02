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
        objectiveStartedAt: true,
        cqSqStartedAt: true,
        status: true
      } as any
    })) as any;

    if (!targetExamSetId) {
      if (existingSubmission?.examSetId) {
        targetExamSetId = existingSubmission.examSetId;
      } else {
        // Final fallback: Assign if still missing
        const { assignBalancedExamSet } = await import("@/lib/exam-logic");
        targetExamSetId = await assignBalancedExamSet(studentId, examId);
      }
    }

    // Determine current section being submitted
    const section = data.section || 'objective';
    const isObjective = section === 'objective';
    const isCqSq = section === 'cqsq';

    // TIME VALIDATION & AUTO-SUBMISSION HANDLING
    const now = Date.now();
    let isOverallTimeExceeded = false;
    let isSectionTimeExceeded = false;

    // A. Section-Specific Timing
    if (isObjective && (exam as any).objectiveTime && existingSubmission?.objectiveStartedAt) {
      const objStartTime = new Date(existingSubmission.objectiveStartedAt).getTime();
      const objLimitMs = (exam as any).objectiveTime * 60 * 1000;
      if (now > objStartTime + objLimitMs) {
        console.log(`[Submit] MCQ Time Limit reached for student ${studentId}. Auto-finalizing objective section.`);
        isSectionTimeExceeded = true;
      }
    }

    if (isCqSq && (exam as any).cqSqTime && existingSubmission?.cqSqStartedAt) {
      const cqStartTime = new Date(existingSubmission.cqSqStartedAt).getTime();
      const cqLimitMs = (exam as any).cqSqTime * 60 * 1000;
      if (now > cqStartTime + cqLimitMs) {
        console.log(`[Submit] CQ/SQ Time Limit reached for student ${studentId}. Auto-finalizing subjective section.`);
        isSectionTimeExceeded = true;
      }
    }

    // B. Overall Timing (Based on first section started)
    const overallStartTime = existingSubmission?.objectiveStartedAt || existingSubmission?.cqSqStartedAt;
    if (overallStartTime) {
      const startTime = new Date(overallStartTime).getTime();
      const durationMs = (Number(exam.duration) || 0) * 60 * 1000;

      if (durationMs > 0 && now > startTime + durationMs) {
        console.log(`[Submit] Overall Time Limit reached for user ${studentId}. Auto-finalizing exam.`);
        isOverallTimeExceeded = true;
      }
    }

    // C. Exam Absolute End Time
    if (exam.endTime && now > new Date(exam.endTime).getTime()) {
      console.log(`[Submit] Scheduled exam end time reached for user ${studentId}. Auto-finalizing exam.`);
      isOverallTimeExceeded = true;
    }

    // Check if student exceeded question limits
    let exceededQuestionLimit = false;
    let cqAnswered = 0;
    let sqAnswered = 0;

    // Process answers - merge existing answers if any
    const existingAnswers = typeof existingSubmission?.answers === 'object' && existingSubmission?.answers !== null
      ? existingSubmission.answers
      : {};
    const processedAnswers = { ...existingAnswers, ...data.answers, _status: 'submitted' };

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

    // For Multiple Subject (MS) exams: check optional subject limit
    const isMS = (exam as any).subjectType === 'MS' || ((exam as any).subjectsConfig && ((exam as any).subjectsConfig?.subjects || []).length > 0);
    if (isMS && (exam as any).subjectsConfig) {
      const msConfig = (exam as any).subjectsConfig as any;
      const optionalSubjectNames = (msConfig.subjects || [])
        .filter((s: any) => !s.isMandatory)
        .map((s: any) => (s.name || '').toLowerCase().trim());
      const maxAllowedOptional = Number(msConfig.requiredOptionalCount) || 1;

      // Build questionId -> subject mapping
      const questionSubjectMap = new Map<string, string>();
      for (const examSet of setsToProcess) {
        if (!examSet.questionsJson) continue;
        const questions = Array.isArray(examSet.questionsJson)
          ? examSet.questionsJson
          : typeof examSet.questionsJson === "string"
            ? JSON.parse(examSet.questionsJson)
            : [];
        for (const q of questions) {
          if (q.id && q.subject) {
            questionSubjectMap.set(q.id, (q.subject || '').toLowerCase().trim());
          }
        }
      }

      const attemptedOptionalSubjects = new Set<string>();
      for (const qId of answerKeys) {
        const val = data.answers[qId];
        const hasAttempted = val !== undefined && val !== null && val !== "" && val !== "No answer provided" && (typeof val !== 'object' || Object.keys(val).length > 0);
        if (hasAttempted) {
          const rawId = qId.split('_')[0];
          const subj = questionSubjectMap.get(qId) || questionSubjectMap.get(rawId);
          if (subj && optionalSubjectNames.includes(subj)) {
            attemptedOptionalSubjects.add(subj);
          }
        }
      }

      if (attemptedOptionalSubjects.size > maxAllowedOptional) {
        console.warn(`[Submit] User ${studentId} answered ${attemptedOptionalSubjects.size} optional subjects (max ${maxAllowedOptional}). Scoring engine will count top ${maxAllowedOptional} subjects.`);
      }
    }

    // Check if there is a CQ/SQ section to follow
    const hasCqSqSection = (exam.cqTotalQuestions || 0) > 0 ||
      (exam.sqTotalQuestions || 0) > 0 ||
      Array.from(questionTypeMap.values()).some(t => ['cq', 'sq', 'descriptive'].includes(t));
    const isFinalSubmission = isCqSq || (!hasCqSqSection && isObjective) || isOverallTimeExceeded;

    const updateData: any = {
      answers: processedAnswers,
      exceededQuestionLimit
    };

    if (isObjective || isOverallTimeExceeded) {
      updateData.objectiveStatus = 'SUBMITTED';
      updateData.objectiveSubmittedAt = existingSubmission?.objectiveSubmittedAt || new Date();
    }

    if (isCqSq || isOverallTimeExceeded) {
      updateData.cqSqStatus = 'SUBMITTED';
      updateData.cqSqSubmittedAt = existingSubmission?.cqSqSubmittedAt || new Date();
    }

    if (isFinalSubmission) {
      updateData.status = 'SUBMITTED';
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
    try {
      const { evaluateSubmission, finalizeAndReleaseExam } = await import("@/lib/exam-logic");

      // Auto-evaluate this submission
      await evaluateSubmission(submission, exam, exam.examSets, true, isFinalSubmission);
      console.log(`✅ Auto-graded/evaluated submission ${submission.id} (isFinal: ${isFinalSubmission})`);

      if (isFinalSubmission) {
        // Check Auto-Release Conditions for all exam types:
        // Condition A: All active students in the class have submitted
        // Condition B: Time is over
        const totalStudentsCount = await prisma.studentProfile.count({
          where: { classId: exam.classId, user: { isActive: true } }
        });

        const submittedCount = await prisma.examSubmission.count({
          where: {
            examId: examId,
            status: 'SUBMITTED'
          }
        });

        const isTimeOver = new Date() > new Date(exam.endTime);
        const allSubmitted = totalStudentsCount > 0 && submittedCount >= totalStudentsCount;

        console.log(`[Auto-Release Check] Exam ${examId}: Submitted ${submittedCount}/${totalStudentsCount}, TimeOver: ${isTimeOver}`);

        if (allSubmitted || isTimeOver) {
          console.log(`🚀 Triggering Auto-Release for Exam ${examId}`);
          await finalizeAndReleaseExam(examId);
        }
      }

    } catch (evalError) {
      console.error("Auto-evaluation/release error:", evalError);
      // We don't block the response, just log error
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