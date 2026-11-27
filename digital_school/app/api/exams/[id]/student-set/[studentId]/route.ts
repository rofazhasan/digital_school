import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; studentId: string }> }) {
    const auth = await getTokenFromRequest(req);
    if (!auth?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const { id: examId, studentId } = await params;

    if (auth.user.role === "STUDENT") {
        const ownProfile = await prisma.studentProfile.findUnique({
            where: { userId: auth.user.id },
            select: { id: true },
        });
        if (!ownProfile || ownProfile.id !== studentId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    if (!examId || !studentId) {
        return NextResponse.json({ error: "Missing examId or studentId" }, { status: 400 });
    }

    try {
        const examStudentMap = await prisma.examStudentMap.findUnique({
            where: {
                studentId_examId: {
                    studentId,
                    examId
                }
            },
            include: {
                examSet: true
            }
        });

        if (!examStudentMap) {
            return NextResponse.json({ error: "Student not assigned to this exam" }, { status: 404 });
        }

        return NextResponse.json({
            setName: examStudentMap.examSet?.name || null
        });

    } catch (error) {
        console.error("[Student Set API] Error fetching student set:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
