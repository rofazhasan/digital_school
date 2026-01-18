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

    let questions: any[] = [];
    let assignedExamSetId = null;

    // Check if student has already submitted this exam or has an active session
    let existingSubmission = await prisma.examSubmission.findFirst({
      where: {
        examId: examId,
        studentId: studentId
      }
    });

    // If no submission exists, create one to mark start time
    if (!existingSubmission) {
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
          startedAt: new Date(),
          examSetId: assignedExamSetId
        }
      });
    } else if (!existingSubmission.startedAt) {
      // If for some reason startedAt is missing on an existing record, set it now
      existingSubmission = await prisma.examSubmission.update({
        where: { id: existingSubmission.id },
        data: { startedAt: new Date() }
      });
    } else {
      // Load assigned set if submission exists
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
      hasSubmitted: !!existingSubmission?.submittedAt && !exam.allowRetake, // If submittedAt is present, they are done
      submissionId: existingSubmission?.id || null,
      startedAt: existingSubmission?.startedAt || null,
      // Question selection settings
      cqTotalQuestions: exam.cqTotalQuestions,
      cqRequiredQuestions: exam.cqRequiredQuestions,
      sqTotalQuestions: exam.sqTotalQuestions,
      sqRequiredQuestions: exam.sqRequiredQuestions,
      mcqNegativeMarking: exam.mcqNegativeMarking,
    });
  } catch (_) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 