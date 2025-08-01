import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const { studentId, notes } = await req.json();

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

    // Update the submission with notes
    await prisma.examSubmission.update({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      },
      data: {
        evaluatorNotes: notes
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json({ error: "Failed to update notes" }, { status: 500 });
  }
} 