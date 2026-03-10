import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/db";
import { createApiResponse } from "@/lib/db-utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { examId, setId, studentId, roll, registration, answers, score, confidence } = body;

        if (!examId || !setId) {
            return createApiResponse(null, "Missing exam or set identification", 400);
        }

        // 1. Resolve Student
        let targetStudentId = studentId;
        if (!targetStudentId && (roll || registration)) {
            const student = await prismadb.studentProfile.findFirst({
                where: {
                    OR: [
                        { roll: roll || undefined },
                        { registrationNo: registration || undefined }
                    ]
                }
            });
            if (student) {
                targetStudentId = student.id;
            }
        }

        if (!targetStudentId) {
            return createApiResponse(null, "Student could not be identified by Roll/Registration", 404);
        }

        // 2. Create or Update ExamSubmission
        const submission = await prismadb.examSubmission.upsert({
            where: {
                studentId_examId: {
                    studentId: targetStudentId,
                    examId: examId
                }
            },
            update: {
                answers: answers,
                score: score || 0,
                examSetId: setId,
                status: 'COMPLETED',
                evaluatedAt: new Date()
            },
            create: {
                studentId: targetStudentId,
                examId: examId,
                examSetId: setId,
                answers: answers,
                score: score || 0,
                status: 'COMPLETED',
                evaluatedAt: new Date()
            }
        });

        // 3. Sync to Results Table
        await prismadb.result.upsert({
            where: {
                studentId_examId: {
                    studentId: targetStudentId,
                    examId: examId
                }
            },
            update: {
                mcqMarks: score || 0,
                total: score || 0,
                examSubmissionId: submission.id
            },
            create: {
                studentId: targetStudentId,
                examId: examId,
                mcqMarks: score || 0,
                total: score || 0,
                examSubmissionId: submission.id
            }
        });

        return createApiResponse({ success: true, submissionId: submission.id });

    } catch (error: any) {
        console.error("OMR Submission API Error:", error);
        return createApiResponse(null, `Submission failed: ${error.message}`, 500);
    }
}
