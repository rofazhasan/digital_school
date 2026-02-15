
import { NextRequest, NextResponse } from 'next/server';
import { processOMR } from '@/lib/omr-processing';
import { safeDatabaseOperation, createApiResponse } from '@/lib/db-utils';
import { DatabaseClient } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return createApiResponse(null, "No file uploaded", 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;

        // Process OMR
        const result = await processOMR(buffer, mimeType);

        if (result.error) {
            return createApiResponse(null, result.error, 422);
        }

        // Auto-Grade if Set ID is found
        if (result.set && result.answers) {
            try {
                // Try to fetch exam ID from QR, or rely on active context if passed?
                // For now, we assume QR contained examId/setId
                // format: { examId: "...", setId: "...", set: "A" }

                const qr = result.qrData;
                if (qr && qr.examId && qr.setId) {
                    // Perform Grading via DB
                    const grade = await safeDatabaseOperation(async () => {
                        const db = await DatabaseClient.getInstance();
                        const examSet = await db.examSet.findUnique({
                            where: { id: qr.setId },
                            include: { exam: true }
                        });

                        if (!examSet) throw new Error("Exam Set not found");

                        let score = 0;
                        let total = 0;
                        const details: any[] = [];

                        // Parse MCQ Data
                        const questions = examSet.questionsJson as any[];
                        if (questions && Array.isArray(questions)) {
                            // Map OMR qNum to Array index (Assuming linear 1..N)
                            // OMR is 1-indexed

                            questions.forEach((q, idx) => {
                                if (q.type !== 'MCQ') return; // Only grade MCQ

                                const qNum = idx + 1; // Assuming Order matches OMR Row 1, 2, 3...
                                // Or does OMR have explicit Q nums? 
                                // The OMR logic assumes standard 1..100 flow.

                                const studentAns = result.answers[qNum];
                                const correctAns = q.correctAnswer; // Assuming "Option A" or just "A"
                                // Clean correct answer
                                const cleanCorrect = correctAns?.replace(/Option /i, '').trim() || '';

                                total += q.marks || 1;

                                if (studentAns === cleanCorrect) {
                                    score += q.marks || 1;
                                    details.push({ q: qNum, status: 'correct', mark: q.marks });
                                } else if (studentAns) {
                                    // Negative Marking
                                    const neg = q.negativeMarks || (examSet.exam.mcqNegativeMarking ? (q.marks * examSet.exam.mcqNegativeMarking / 100) : 0);
                                    score -= neg;
                                    details.push({ q: qNum, status: 'wrong', got: studentAns, expected: cleanCorrect, penalty: neg });
                                } else {
                                    details.push({ q: qNum, status: 'unanswered' });
                                }
                            });
                        }

                        return { score, total, details, examName: examSet.exam.name, setName: examSet.name };
                    }, "Grade OMR");

                    if (grade) {
                        result.grading = grade;
                    }
                }
            } catch (e) {
                console.error("Grading failed during processing:", e);
                // Don't fail the whole request, just return ungraded OMR data
            }
        }

        return createApiResponse(result);

    } catch (error: any) {
        console.error("OMR API Error:", error);
        // Handle PDF parsing errors specifically?
        return createApiResponse(null, `Internal Server Error: ${error.message}`, 500);
    }
}
