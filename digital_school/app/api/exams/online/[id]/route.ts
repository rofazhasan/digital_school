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

    // Fetch real student profile and user details
    const user = await prisma.user.findUnique({
      where: { id: tokenData.user.id },
      include: {
        studentProfile: {
          include: {
            class: true
          }
        }
      }
    });

    const studentProfile = user?.studentProfile || (studentId ? await prisma.studentProfile.findUnique({ where: { id: studentId }, include: { class: true } }) : null);
    const studentName = user?.name || (user as any)?.username || tokenData.user.name || "পরীক্ষার্থী";
    const studentRoll = studentProfile?.roll || tokenData.user.studentProfile?.roll || tokenData.user.roll || "01";
    const studentReg = studentProfile?.registrationNo || tokenData.user.studentProfile?.registrationNo || "";

    let questions: any[] = [];
    let assignedExamSetId = null;

    // PROACTIVE SET ASSIGNMENT: Ensure student has a set even before starting
    const { assignBalancedExamSet } = await import("@/lib/exam-logic");
    assignedExamSetId = await assignBalancedExamSet(studentId, examId);

    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        studentId: studentId
      },
      orderBy: [{ objectiveStartedAt: 'desc' }, { cqSqStartedAt: 'desc' }],
      take: 1
    });

    let existingSubmission = submissions[0];

    // AUTO-SUBMIT SWEEP: Check if time expired while away
    if (existingSubmission && existingSubmission.status === 'IN_PROGRESS') {
      const { autoSubmitExpiredSections } = await import("@/lib/exam-logic");
      existingSubmission = await autoSubmitExpiredSections(existingSubmission, exam);
    }

    const hasCqSq = (Number(exam.cqSqTime) > 0) || 
      (exam.examSets && exam.examSets.some((s: any) => {
        try {
          const qs = typeof s.questionsJson === 'string' ? JSON.parse(s.questionsJson) : s.questionsJson;
          return Array.isArray(qs) && qs.some((q: any) => ['cq', 'sq', 'descriptive'].includes((q.type || q.questionType || '').toLowerCase()));
        } catch { return false; }
      })) || (Number(exam.cqTotalQuestions || 0) > 0) || (Number(exam.sqTotalQuestions || 0) > 0);

    // ACCIDENTAL / PROCTORING AUTO-SUBMIT RECOVERY:
    // If submission is SUBMITTED, but NOT manually confirmed by the student,
    // AND the exam's duration and scheduled end time have not passed,
    // recover the session to IN_PROGRESS so student can resume from another device.
    if (existingSubmission && !exam.allowRetake) {
      const answersObj = (typeof existingSubmission.answers === 'object' && existingSubmission.answers !== null)
        ? (existingSubmission.answers as any)
        : {};
      const now = Date.now();

      const firstStartTime = existingSubmission.objectiveStartedAt
        ? new Date(existingSubmission.objectiveStartedAt).getTime()
        : existingSubmission.cqSqStartedAt
          ? new Date(existingSubmission.cqSqStartedAt).getTime()
          : null;

      const effectiveTotalMinutes = (Number(exam.objectiveTime || 0) > 0 && Number(exam.cqSqTime || 0) > 0)
        ? Number(exam.objectiveTime) + Number(exam.cqSqTime)
        : (Number(exam.duration) || 0);

      const isOverallTimeValid = firstStartTime && effectiveTotalMinutes > 0
        ? (now < firstStartTime + effectiveTotalMinutes * 60 * 1000)
        : true;

      const isEndTimeValid = exam.endTime
        ? (now < new Date(exam.endTime).getTime())
        : true;

      // Check CQ/SQ validity
      const cqStart = existingSubmission.cqSqStartedAt ? new Date(existingSubmission.cqSqStartedAt).getTime() : null;
      const cqDurationMin = Number(exam.cqSqTime) > 0 
        ? Number(exam.cqSqTime) 
        : (Number(exam.duration) > Number(exam.objectiveTime || 0) ? Number(exam.duration) - Number(exam.objectiveTime || 0) : Number(exam.duration));
      const isCqValid = cqStart && cqDurationMin > 0 ? (now < cqStart + cqDurationMin * 60 * 1000) : true;

      // Is CQ/SQ manually finalized?
      const isCqManuallyFinalized = answersObj._manualCqSqSubmit === true || (answersObj._manualSubmit === true && existingSubmission.cqSqStatus === 'SUBMITTED');

      // Check if CQ/SQ is pending or can be resumed
      const canResumeCqSq = hasCqSq && !isCqManuallyFinalized && isEndTimeValid && isOverallTimeValid && (
        existingSubmission.cqSqStatus === 'PENDING' || 
        (existingSubmission.cqSqStatus === 'IN_PROGRESS' && isCqValid) ||
        (existingSubmission.cqSqStatus === 'SUBMITTED' && isCqValid && !answersObj._manualCqSqSubmit)
      );

      // Objective recovery
      const objStart = existingSubmission.objectiveStartedAt ? new Date(existingSubmission.objectiveStartedAt).getTime() : null;
      const objDurationMin = Number(exam.objectiveTime) > 0 ? Number(exam.objectiveTime) : (Number(exam.duration) || 0);
      const isObjValid = objStart && objDurationMin > 0 ? (now < objStart + objDurationMin * 60 * 1000) : true;
      const isObjManuallyFinalized = answersObj._manualObjectiveSubmit === true || (answersObj._manualSubmit === true && !hasCqSq);

      const canResumeObjective = !isObjManuallyFinalized && isObjValid && isOverallTimeValid && isEndTimeValid && (
        existingSubmission.objectiveStatus === 'IN_PROGRESS' || 
        (existingSubmission.objectiveStatus === 'SUBMITTED' && !answersObj._manualObjectiveSubmit)
      );

      if (canResumeCqSq || canResumeObjective) {
        console.log(`[OnlineExamAPI] Interrupted session detected for student ${studentId} on exam ${examId}. Recovering to IN_PROGRESS...`);

        const recoveredData: any = {
          status: 'IN_PROGRESS'
        };
        if (canResumeObjective && existingSubmission.objectiveStatus === 'SUBMITTED') {
          recoveredData.objectiveStatus = 'IN_PROGRESS';
        }
        if (canResumeCqSq && existingSubmission.cqSqStatus === 'SUBMITTED') {
          recoveredData.cqSqStatus = existingSubmission.cqSqStartedAt ? 'IN_PROGRESS' : 'PENDING';
        }

        existingSubmission = await prisma.examSubmission.update({
          where: { id: existingSubmission.id },
          data: recoveredData
        });

        // Delete unfinalized result so student can resume seamlessly
        await prisma.result.deleteMany({
          where: {
            studentId: studentId,
            examId: examId,
            isPublished: false
          }
        });
      }
    }

    // Check for existing result (queried after potential recovery cleanup)
    const existingResult = await prisma.result.findUnique({
      where: {
        studentId_examId: { studentId: studentId, examId: examId }
      }
    });

    // Check if the latest submission is finished
    // An exam with CQ/SQ is only finished if CQ/SQ is submitted (or time expired)
    const isCqSqStillPending = hasCqSq && (existingSubmission?.cqSqStatus === 'PENDING' || existingSubmission?.cqSqStatus === 'IN_PROGRESS');
    const isFinished = !isCqSqStillPending && (((existingSubmission && existingSubmission.status === 'SUBMITTED') || !!existingResult));

    // Check for 'action' param
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    // 1. STRICT REDIRECTION LOGIC
    // If retake is allowed and user hasn't explicitly clicked 'start', we show the preview/instructions
    // If retake is NOT allowed:
    // - If submission exists and is SUBMITTED, redirect to results.
    // - If submission exists and is IN_PROGRESS, allow entry (resume).
    // - If no submission exists, allow entry (first time).

    if (!exam.allowRetake && isFinished) {
      console.log(`➡️ Redirecting student ${studentId} to results for exam ${examId} (Already submitted/finished)`);
      return NextResponse.json({
        id: exam.id,
        name: exam.name,
        hasSubmitted: true,
        redirect: `/exams/results/${exam.id}`,
        status: 'SUBMITTED'
      });
    }

    // 2. RETAKE LOGIC: If retake is allowed and user clicks start, delete old data
    const shouldCreateNew = (!existingSubmission || (isFinished && exam.allowRetake)) && action === 'start';

    if (shouldCreateNew) {
      // Set is already assigned proactively above
      // But we still need to ensure it's in the submission

      // DELETE PREVIOUS SUBMISSION BEFORE STARTING NEW ONE (RETAKE CLEANUP)
      if (existingSubmission) {
        console.log(`♻️ Retake cleanup: Wiping previous records for student ${studentId} (Exam: ${examId})`);

        await prisma.$transaction([
          prisma.examSubmissionDrawing.deleteMany({ where: { examId, studentId } }),
          prisma.result.deleteMany({ where: { examId, studentId } }),
          prisma.examSubmission.deleteMany({ where: { examId, studentId } })
        ]);

        console.log("✅ Cleanup complete");
      }

      existingSubmission = await prisma.examSubmission.create({
        data: {
          examId,
          studentId,
          answers: {},
          // @ts-ignore
          status: IN_PROGRESS,
          examSetId: assignedExamSetId,
          objectiveStatus: 'PENDING',
          cqSqStatus: 'PENDING'
        }
      });
    } else if (existingSubmission && !existingSubmission.objectiveStartedAt && !existingSubmission.cqSqStartedAt && action === 'start') {
      existingSubmission = await prisma.examSubmission.update({
        where: { id: existingSubmission.id },
        // @ts-ignore
        data: { status: IN_PROGRESS } // Section specific starts will happen in start API
      });
    } else if (existingSubmission) {
      assignedExamSetId = existingSubmission.examSetId;
    }

    // Now assignedExamSetId should be resolved either from new creation or existing submission
    // We need to fetch the questions for this set

    let assignedExamSet = null;
    if (assignedExamSetId) {
      assignedExamSet = await prisma.examSet.findUnique({ where: { id: assignedExamSetId } });
      if (assignedExamSet && assignedExamSet.questionsJson) {
        try {
          questions = Array.isArray(assignedExamSet.questionsJson)
            ? assignedExamSet.questionsJson
            : typeof assignedExamSet.questionsJson === "string"
              ? JSON.parse(assignedExamSet.questionsJson)
              : [];
        } catch {
          questions = [];
        }
      }
    } else if (exam.examSets && exam.examSets.length > 0) {
      assignedExamSet = exam.examSets[0];
      assignedExamSetId = assignedExamSet.id;
    }

    const setName = assignedExamSet?.name || (exam.examSets && exam.examSets.length > 0 ? exam.examSets[0].name : "A");

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

          questions = previewQuestions;
        } catch { }
      }
    }

    // Collect all question IDs needing subject lookup
    const allQuestionIdsToLookup = new Set<string>();
    questions.forEach((q: any) => {
      if (q?.id && (!q.subject || typeof q.subject !== 'string' || !q.subject.trim())) {
        allQuestionIdsToLookup.add(q.id);
      }
    });

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

    const hasSubmitted = isFinished && !exam.allowRetake;

    // Fetch all sets for this exam so students can switch sets seamlessly on OMR sheet
    const fullExamSets = await prisma.examSet.findMany({
      where: { examId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        questionsJson: true,
      }
    });

    const allSetsRaw = fullExamSets.map(s => {
      let setQuestions: any[] = [];
      try {
        setQuestions = Array.isArray(s.questionsJson)
          ? s.questionsJson
          : typeof s.questionsJson === "string"
            ? JSON.parse(s.questionsJson)
            : [];
      } catch {
        setQuestions = [];
      }
      setQuestions.forEach((q: any) => {
        if (q?.id && (!q.subject || typeof q.subject !== 'string' || !q.subject.trim())) {
          allQuestionIdsToLookup.add(q.id);
        }
      });
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        questions: setQuestions
      };
    });

    // Backfill missing subjects from database if any questions lack subject
    if (allQuestionIdsToLookup.size > 0) {
      try {
        const dbQuestions = await prisma.question.findMany({
          where: { id: { in: Array.from(allQuestionIdsToLookup) } },
          select: { id: true, subject: true }
        });
        const subMap = new Map(dbQuestions.map(dq => [dq.id, dq.subject]));
        questions = questions.map((q: any) => {
          if ((!q.subject || !String(q.subject).trim()) && subMap.has(q.id)) {
            return { ...q, subject: subMap.get(q.id) };
          }
          return q;
        });
        allSetsRaw.forEach(set => {
          set.questions = set.questions.map((q: any) => {
            if ((!q.subject || !String(q.subject).trim()) && subMap.has(q.id)) {
              return { ...q, subject: subMap.get(q.id) };
            }
            return q;
          });
        });
      } catch (e) {
        console.warn("[OnlineExamAPI] Could not backfill question subjects:", e);
      }
    }

    const allSets = allSetsRaw;

    const isExamMS = exam.subjectType ? exam.subjectType === 'MS' : Boolean(
      exam.subjectsConfig && ((exam.subjectsConfig as any)?.subjects || []).length > 0
    );

    return NextResponse.json({
      id: exam.id,
      name: exam.name,
      title: exam.name,
      type: exam.type,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      totalMarks: exam.totalMarks,
      allowRetake: exam.allowRetake,
      className: exam.class?.name || studentProfile?.class?.name || '',
      studentName,
      studentRoll,
      studentReg,
      setName,
      assignedExamSetId,
      assignedSet: assignedExamSet ? { id: assignedExamSet.id, name: assignedExamSet.name } : null,
      examSets: exam.examSets?.map(s => ({ id: s.id, name: s.name })),
      allSets,
      subject: isExamMS ? 'বহু-বিষয়ক পরীক্ষা (Multi-Subject)' : ((questions[0] as any)?.subject || exam.class?.name || ''),
      subjectType: exam.subjectType || (isExamMS ? 'MS' : 'SS'),
      subjectsConfig: isExamMS ? (exam.subjectsConfig || null) : null,
      questions,
      hasSubmitted,
      submissionId: existingSubmission?.id || null,
      // Derive startedAt from either objective or cqSq start time
      startedAt: (existingSubmission as any)?.objectiveStartedAt || (existingSubmission as any)?.cqSqStartedAt || null,
      passMarks: exam.passMarks,
      // Question selection settings
      cqTotalQuestions: exam.cqTotalQuestions,
      cqRequiredQuestions: exam.cqRequiredQuestions,
      sqTotalQuestions: exam.sqTotalQuestions,
      sqRequiredQuestions: exam.sqRequiredQuestions,
      mcqNegativeMarking: exam.mcqNegativeMarking,
      savedAnswers: existingSubmission?.answers || {},
      objectiveTime: (exam as any).objectiveTime,
      cqSqTime: (exam as any).cqSqTime,
      objectiveStatus: (existingSubmission as any)?.objectiveStatus || 'PENDING',
      objectiveStartedAt: (existingSubmission as any)?.objectiveStartedAt || null,
      cqSqStatus: (existingSubmission as any)?.cqSqStatus || 'PENDING',
      cqSqStartedAt: (existingSubmission as any)?.cqSqStartedAt || null,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[OnlineExamAPI] Error loading exam ${examId}:`, error);
    return NextResponse.json({
      error: "Server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 