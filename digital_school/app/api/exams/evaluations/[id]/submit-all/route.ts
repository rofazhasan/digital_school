import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;

    // Check if user has access to this exam
    let exam;
    if (tokenData.user.role === "SUPER_USER") {
      exam = await prisma.exam.findUnique({
        where: { id: examId }
      });
    } else {
      exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          evaluationAssignments: {
            some: {
              evaluatorId: tokenData.user.id
            }
          }
        }
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
    }

    // Get all submissions for this exam
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId
      }
    });

    // Process each submission using centralized logic
    const { evaluateSubmission } = await import("@/lib/exam-logic");
    const examSets = await prisma.examSet.findMany({
      where: { examId: examId }
    });

    for (const submission of submissions) {
      try {
        const result = await evaluateSubmission(submission, exam, examSets);
        console.log(`✅ Result processed for student ${submission.studentId}:`, result);
      } catch (error) {
        console.error(`❌ Error processing result for student ${submission.studentId}:`, error);
        // Continue with other students even if one fails
      }
    }

    // Trigger Final Release & Emails after all evaluations are processed
    const { releaseExamResults } = await import("@/lib/exam-logic");
    await releaseExamResults(examId);
    console.log(`🚀 Manual release triggered for exam ${examId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting all evaluations:", error);
    return NextResponse.json({ error: "Failed to submit all evaluations" }, { status: 500 });
  }
} 