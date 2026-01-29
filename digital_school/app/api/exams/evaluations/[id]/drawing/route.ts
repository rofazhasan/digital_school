import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getTokenFromRequest(request);
        if (!token?.user?.id) {
            console.error('[Drawing API] Unauthorized - no valid token');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('[Drawing API] Authenticated user:', token.user.id);

        const { id: examId } = await params;
        const body = await request.json();
        const { studentId, questionId, originalImagePath, imageData, imageIndex } = body;

        console.log('[Drawing API] Received data:', { studentId, questionId, imageIndex, hasImageData: !!imageData });

        if (!studentId || !questionId || !imageData) {
            console.error('[Drawing API] Missing required fields');
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
                evaluatorId: token.user.id,
            },
            create: {
                studentId,
                questionId,
                examId,
                imageIndex: imageIndex || 0,
                imageData,
                originalImagePath: originalImagePath || '',
                evaluatorId: token.user.id,
            }
        });

        console.log('[Drawing API] Annotation saved successfully:', drawing.id);

        return NextResponse.json({ success: true, drawing });
    } catch (error) {
        console.error("[Drawing API] Error saving annotation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
