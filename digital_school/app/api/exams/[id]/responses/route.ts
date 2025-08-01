import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: { answers: data.answers },
      create: { studentId, examId, answers: data.answers },
    });
    return NextResponse.json({ success: true, submission });
  } catch (e) {
    console.error("Autosave error:", { studentId, examId, answers: data.answers, error: e });
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }
} 