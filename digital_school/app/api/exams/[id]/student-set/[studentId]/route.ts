import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; studentId: string }> }) {
    const { id: examId, studentId } = await params;

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
