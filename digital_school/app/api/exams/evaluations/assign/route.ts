import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || (tokenData.user.role !== "SUPER_USER" && tokenData.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId, evaluatorId, notes } = await req.json();

    if (!examId || !evaluatorId) {
      return NextResponse.json({ error: "Exam ID and Evaluator ID are required" }, { status: 400 });
    }

    // Check if evaluator exists and is a TEACHER or ADMIN
    const evaluator = await prisma.user.findFirst({
      where: {
        id: evaluatorId,
        role: { in: ["TEACHER", "ADMIN"] }
      }
    });

    if (!evaluator) {
      return NextResponse.json({ error: "Invalid evaluator. Must be a TEACHER or ADMIN." }, { status: 400 });
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Create or update assignment
    const assignment = await prisma.examEvaluationAssignment.upsert({
      where: {
        examId_evaluatorId: {
          examId,
          evaluatorId
        }
      },
      update: {
        status: "PENDING",
        notes,
        assignedById: tokenData.user.id,
        assignedAt: new Date()
      },
      create: {
        examId,
        evaluatorId,
        assignedById: tokenData.user.id,
        notes,
        status: "PENDING"
      },
      include: {
        evaluator: {
          select: { name: true, email: true, role: true }
        },
        assignedBy: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: `Evaluator ${evaluator.name} assigned to exam ${exam.name}`
    });
  } catch (error) {
    console.error("Error assigning evaluator:", error);
    return NextResponse.json({ error: "Failed to assign evaluator" }, { status: 500 });
  }
} 