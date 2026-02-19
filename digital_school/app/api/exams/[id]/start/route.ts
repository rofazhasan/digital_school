import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;
  console.log(`[Exam Start API] Request for exam: ${examId}`);

  const tokenData = await getTokenFromRequest(req);
  console.log(`[Exam Start API] Token data:`, {
    hasToken: !!tokenData,
    hasUser: !!tokenData?.user,
    userId: tokenData?.user?.id,
    userRole: tokenData?.user?.role,
    hasStudentProfile: !!tokenData?.user?.studentProfile
  });

  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    console.log(`[Exam Start API] Unauthorized - missing token or user data`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For students, use their student profile ID, otherwise use user ID
  const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;

  // Validate that this is a student
  if (tokenData.user.role !== 'STUDENT') {
    return NextResponse.json({ error: "Only students can start exams" }, { status: 403 });
  }

  try {
    console.log(`[Exam Start] Attempting to start exam ${examId} for student ${studentId}`);

    // Get the assigned exam set for this student
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      include: { examSet: true }
    });

    console.log(`[Exam Start] Exam student map:`, examStudentMap);

    // const examSetId = examStudentMap?.examSetId || null;

    // Create or update submission with startedAt timestamp
    const now = new Date();
    // Get section from body
    let section = 'objective';
    try {
      const body = await req.json();
      section = body.section || 'objective';
    } catch (e) { }

    const dataToUpdate: any = {
      status: 'IN_PROGRESS',
      examSetId: examStudentMap?.examSetId || null
    };

    if (section === 'objective') {
      dataToUpdate.objectiveStatus = 'IN_PROGRESS';
    } else if (section === 'cqsq') {
      dataToUpdate.cqSqStatus = 'IN_PROGRESS';
    }

    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: dataToUpdate,
      create: {
        studentId,
        examId,
        examSetId: examStudentMap?.examSetId || null,
        answers: {}, // Initialize with empty answers
        startedAt: now,
        objectiveStartedAt: section === 'objective' ? now : null,
        cqSqStartedAt: section === 'cqsq' ? now : null,
        status: 'IN_PROGRESS',
        objectiveStatus: section === 'objective' ? 'IN_PROGRESS' : 'IN_PROGRESS',
        cqSqStatus: 'IN_PROGRESS',
      },
    });

    // If it was an update and specific startedAt was null, update it now
    if (section === 'objective' && !submission.objectiveStartedAt) {
      await prisma.examSubmission.update({
        where: { id: submission.id },
        data: { objectiveStartedAt: now, startedAt: submission.startedAt || now }
      });
    } else if (section === 'cqsq' && !submission.cqSqStartedAt) {
      await prisma.examSubmission.update({
        where: { id: submission.id },
        data: { cqSqStartedAt: now }
      });
    }

    console.log(`[Exam Start] Student ${studentId} started exam ${examId} successfully`);

    return NextResponse.json({
      success: true,
      message: "Exam started successfully"
    });

  } catch (e) {
    console.error("Exam start error:", {
      studentId,
      examId,
      userRole: tokenData.user.role,
      hasStudentProfile: !!tokenData.user.studentProfile,
      error: e
    });
    return NextResponse.json({ error: "Failed to start exam" }, { status: 500 });
  }
} 