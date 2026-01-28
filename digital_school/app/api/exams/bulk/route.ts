
import { NextRequest } from "next/server";
import prismadb from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { createApiResponse, DatabaseCache } from "@/lib/db-utils";
import { z } from "zod";

const cqSubsectionSchema = z.object({
    name: z.string().optional(),
    startIndex: z.coerce.number().min(1),
    endIndex: z.coerce.number().min(1),
    requiredQuestions: z.coerce.number().min(1),
});

const examSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    duration: z.coerce.number().min(1),
    type: z.enum(["ONLINE", "OFFLINE", "MIXED"]),
    totalMarks: z.coerce.number().min(1),
    passMarks: z.coerce.number().min(0),
    classId: z.string().min(1),
    allowRetake: z.boolean().optional(),
    instructions: z.string().optional(),
    mcqNegativeMarking: z.coerce.number().min(0).max(100).optional(),
    cqTotalQuestions: z.coerce.number().optional(),
    cqRequiredQuestions: z.coerce.number().optional(),
    sqTotalQuestions: z.coerce.number().optional(),
    sqRequiredQuestions: z.coerce.number().optional(),
    cqSubsections: z.array(cqSubsectionSchema).optional(),
});

const bulkCreateSchema = z.array(examSchema);

export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth || !auth.user) {
            return createApiResponse(null, "Not authenticated", 401);
        }

        const json = await request.json();
        const validation = bulkCreateSchema.safeParse(json);

        if (!validation.success) {
            return createApiResponse(null, validation.error.message, 400);
        }

        const examsData = validation.data;

        const createdExams = await prismadb.$transaction(
            examsData.map((exam) =>
                prismadb.exam.create({
                    data: {
                        ...exam,
                        createdById: auth.user.id,
                        isActive: false, // Default to inactive
                    },
                })
            )
        );

        // Invalidate cache
        DatabaseCache.invalidate("exams");

        // Also invalidate individual exam caches? No need as they are new.
        // Invalidate class-specific exam lists if any

        return createApiResponse(
            { count: createdExams.length, exams: createdExams },
            "Exams created successfully",
            201
        );
    } catch (error: any) {
        console.error("POST /api/exams/bulk Error:", error);
        return createApiResponse(null, "Internal Server Error", 500);
    }
}
