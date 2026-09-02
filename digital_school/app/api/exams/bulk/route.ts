
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
    name: z.string().min(1, "Exam name is required"),
    description: z.string().optional().nullable(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    duration: z.coerce.number().min(1).default(60),
    type: z.enum(["ONLINE", "OFFLINE", "MIXED"]).default("OFFLINE"),
    totalMarks: z.coerce.number().min(1).default(100),
    passMarks: z.coerce.number().min(0).default(33),
    classId: z.string().min(1, "Class is required"),
    allowRetake: z.boolean().optional().default(false),
    instructions: z.string().optional().nullable(),
    mcqNegativeMarking: z.coerce.number().min(0).max(100).optional().default(0),
    cqTotalQuestions: z.coerce.number().optional().default(0),
    cqRequiredQuestions: z.coerce.number().optional().default(0),
    sqTotalQuestions: z.coerce.number().optional().default(0),
    sqRequiredQuestions: z.coerce.number().optional().default(0),
    objectiveTime: z.coerce.number().optional().nullable(),
    cqSqTime: z.coerce.number().optional().nullable(),
    cqSubsections: z.array(cqSubsectionSchema).optional().nullable(),
    subjectType: z.enum(["SS", "MS"]).optional().default("SS"),
    subjectsConfig: z.any().optional().nullable(),
});

const bulkCreateSchema = z.array(examSchema);

export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth || !auth.user) {
            return createApiResponse(null, "Not authenticated", 401);
        }

        const json = await request.json();
        const validation = bulkCreateSchema.safeParse(Array.isArray(json) ? json : json?.exams || []);

        if (!validation.success) {
            return createApiResponse(null, validation.error.message, 400);
        }

        const examsData = validation.data;

        if (examsData.length === 0) {
            return createApiResponse(null, "No valid exams found in payload", 400);
        }

        const createdExams = await prismadb.$transaction(
            examsData.map((exam) => {
                const dateObj = new Date(exam.date);
                if (isNaN(dateObj.getTime())) {
                    throw new Error(`Invalid date format for exam: ${exam.name}`);
                }

                const dur = Number(exam.duration) || 60;
                const startObj = exam.startTime ? new Date(exam.startTime) : dateObj;
                const endObj = exam.endTime ? new Date(exam.endTime) : new Date(startObj.getTime() + dur * 60000);

                return prismadb.exam.create({
                    data: {
                        name: exam.name,
                        description: exam.description || "",
                        date: dateObj,
                        startTime: isNaN(startObj.getTime()) ? dateObj : startObj,
                        endTime: isNaN(endObj.getTime()) ? new Date(dateObj.getTime() + dur * 60000) : endObj,
                        duration: dur,
                        type: exam.type,
                        subjectType: (exam.subjectType === "MS") ? "MS" : "SS",
                        subjectsConfig: (exam.subjectType === "MS") ? ((exam.subjectsConfig as any) || null) : null,
                        totalMarks: Number(exam.totalMarks) || 100,
                        passMarks: Number(exam.passMarks) || 33,
                        classId: exam.classId,
                        allowRetake: !!exam.allowRetake,
                        instructions: exam.instructions || null,
                        mcqNegativeMarking: Number(exam.mcqNegativeMarking) || 0,
                        cqTotalQuestions: Number(exam.cqTotalQuestions) || 0,
                        cqRequiredQuestions: Number(exam.cqRequiredQuestions) || 0,
                        sqTotalQuestions: Number(exam.sqTotalQuestions) || 0,
                        sqRequiredQuestions: Number(exam.sqRequiredQuestions) || 0,
                        objectiveTime: exam.objectiveTime ? Number(exam.objectiveTime) : null,
                        cqSqTime: exam.cqSqTime ? Number(exam.cqSqTime) : null,
                        cqSubsections: (exam.cqSubsections as any) || null,
                        createdById: auth.user.id,
                        isActive: false,
                    },
                });
            })
        );

        // Invalidate cache
        DatabaseCache.invalidate("exams");

        return createApiResponse(
            { count: createdExams.length, exams: createdExams },
            `${createdExams.length} exams imported successfully`,
            201
        );
    } catch (error: any) {
        console.error("POST /api/exams/bulk Error:", error);
        return createApiResponse(null, error.message || "Internal Server Error", 500);
    }
}
