import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: examId } = await params;
        const body = await request.json();
        const { studentId, questionId, originalImagePath, imageData, imageIndex } = body;

        if (!studentId || !questionId || !imageData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Upsert the drawing record
        const drawing = await prisma.examSubmissionDrawing.upsert({
            where: {
                studentId_questionId_imageIndex: {
                    studentId,
                    questionId,
                    imageIndex: imageIndex || 0
                }
            },
            update: {
                imageData,
                originalImagePath, // Update original if it changed for some reason, or keep it
                evaluatorId: session.user.id,
            },
            create: {
                studentId,
                questionId,
                examId,
                imageIndex: imageIndex || 0,
                imageData,
                originalImagePath: originalImagePath || '',
                evaluatorId: session.user.id,
            }
        });

        return NextResponse.json({ success: true, drawing });
    } catch (error) {
        console.error("Error saving annotation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
