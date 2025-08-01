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

    // Check if student has already submitted this exam
    const existingSubmission = await prisma.examSubmission.findFirst({
      where: {
        examId: examId,
        studentId: studentId
      }
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    let questions = [];
    let assignedExamSetId = null;
    
    // First, try to get the assigned exam set from ExamStudentMap
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      include: { examSet: true }
    });
    
    if (examStudentMap?.examSetId && examStudentMap.examSet) {
      // Use the assigned exam set
      assignedExamSetId = examStudentMap.examSetId;
      const examSet = examStudentMap.examSet;
      
      if (examSet.questionsJson) {
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
    } else {
      // Fallback: randomly select an examSet and create/update the mapping
      if (exam.examSets.length > 0) {
        const randomIndex = Math.floor(Math.random() * exam.examSets.length);
        const examSet = exam.examSets[randomIndex];
        assignedExamSetId = examSet.id;
        
        // Create or update the ExamStudentMap
        await prisma.examStudentMap.upsert({
          where: { studentId_examId: { studentId, examId } },
          update: { examSetId: assignedExamSetId },
          create: { studentId, examId, examSetId: assignedExamSetId }
        });
        
        if (examSet.questionsJson) {
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
      hasSubmitted: !!existingSubmission,
      submissionId: existingSubmission?.id || null,
    });
  } catch (_) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 