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
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: {
        // Only set startedAt if it's currently null to prevent resetting time on re-entry
        // Also ensure status is IN_PROGRESS
        status: 'IN_PROGRESS',
        examSetId: examStudentMap?.examSetId || null
      },
      create: {
        studentId,
        examId,
        examSetId: examStudentMap?.examSetId || null,
        answers: {}, // Initialize with empty answers
        startedAt: now,
        status: 'IN_PROGRESS',
      },
    });

    // If it was an update and startedAt was null, update it now
    if (submission && !submission.startedAt) {
      await prisma.examSubmission.update({
        where: { id: submission.id },
        data: { startedAt: now, status: 'IN_PROGRESS' }
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