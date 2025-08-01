import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

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
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!data.answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }
  try {
    // Get the assigned exam set for this student
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      select: { examSetId: true }
    });
    
    const examSetId = examStudentMap?.examSetId || null;
    
    // Save submission with examSetId
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: { answers: data.answers, submittedAt: new Date(), examSetId },
      create: { studentId, examId, answers: data.answers, examSetId },
    });
    // Fetch questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examSets: true },
    });
    let questions: Record<string, unknown>[] = [];
    const rawQuestions = exam?.examSets[0]?.questionsJson;
    if (Array.isArray(rawQuestions)) {
      questions = rawQuestions as Record<string, unknown>[];
    } else if (typeof rawQuestions === "string") {
      try {
        const parsed = JSON.parse(rawQuestions);
        if (Array.isArray(parsed)) {
          questions = parsed as Record<string, unknown>[];
        } else {
          questions = [];
        }
      } catch {
        questions = [];
      }
    } else {
      questions = [];
    }
    // Add 'correct' field to MCQ questions if missing (same as in /api/exams/online/[id]/route.ts)
    questions = questions.map((q: Record<string, unknown>) => {
      if (((q.type as string)?.toLowerCase?.() === 'mcq' || (q.questionType as string)?.toLowerCase?.() === 'mcq') && Array.isArray(q.options)) {
        const correctIndex = (q.options as Record<string, unknown>[]).findIndex((opt: Record<string, unknown>) => opt.isCorrect);
        if (correctIndex !== -1) {
                  const correctOpt = (q.options as Record<string, unknown>[])[correctIndex];
        return { ...q, correct: typeof correctOpt === 'object' && correctOpt !== null ? ((correctOpt as Record<string, unknown>).text as string || correctIndex) : correctIndex };
        }
      }
      return q;
    });
    const hasCQorSQ = questions.some((q: Record<string, unknown>) => (q.type as string) === "cq" || (q.type as string) === "sq");
    let result = null;
    if (!hasCQorSQ) {
      // Auto-grade MCQ (award question.marks for correct, else zero)
      let score = 0;
              questions.forEach((q: Record<string, unknown>) => {
          if ((q.type as string) && (q.type as string).toLowerCase() === "mcq" && typeof data.answers[q.id as string] !== "undefined") {
            const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
            const userAns = normalize(data.answers[q.id as string]);
            const correctAns = normalize(q.correct as string);
          const marks = Number(q.marks) || 1;
          const isCorrect = userAns === correctAns;
          if (isCorrect) {
            score += marks;
          }
        }
      });
      console.log("[Exam Submission] Calculated MCQ score:", score);
      // Save score to ExamSubmission
      await prisma.examSubmission.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { answers: data.answers, submittedAt: new Date(), score, examSetId },
        create: { studentId, examId, answers: data.answers, score, examSetId },
      });
      // Save score to Result (mcqMarks and total)
      result = await prisma.result.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { mcqMarks: score, total: score, isPublished: true, examSubmissionId: submission.id },
        create: { studentId, examId, mcqMarks: score, total: score, isPublished: true, examSubmissionId: submission.id },
      });
      // Attach answers to result for frontend scoring
      result = { ...result, answers: data.answers };
      console.log("[Exam Submission] Upserted result:", result);
      return NextResponse.json({ success: true, autoGraded: true, result });
    } else {
      // Needs teacher review
      await prisma.result.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { isPublished: false, examSubmissionId: submission.id },
        create: { studentId, examId, total: 0, isPublished: false, examSubmissionId: submission.id },
      });
      return NextResponse.json({ success: true, autoGraded: false, message: "Submission received. Awaiting teacher review." });
    }
  } catch (e) {
    console.error("Submission error:", {
      studentId,
      examId,
      answers: data.answers,
      error: e
    });
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
} 