import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";
import { QuestionType, Difficulty } from '@prisma/client';

// Helper to separate validation logic
async function validateAndMapRow(row: any, rowNum: number, classes: any[]) {
    try {
        const typeStr = row["Type (MCQ/CQ/SQ)"]?.toUpperCase();
        if (!['MCQ', 'CQ', 'SQ'].includes(typeStr)) {
            throw new Error(`Invalid Question Type: ${row["Type (MCQ/CQ/SQ)"]}`);
        }
        const type = typeStr as QuestionType;

        const className = row["Class Name"];
        if (!className) throw new Error("Class Name is required");

        let classId = null;
        const foundClass = classes.find(c =>
            c.name.toLowerCase() === className.toLowerCase().trim() ||
            `${c.name} - ${c.section}`.toLowerCase() === className.toLowerCase().trim()
        );

        if (!foundClass) throw new Error(`Class not found: ${className}`);
        classId = foundClass.id;

        const subject = row["Subject"];
        if (!subject) throw new Error("Subject is required");

        const questionText = row["Question Text"];
        if (!questionText) throw new Error("Question Text is required");

        const marks = parseInt(row["Marks"] || '0');

        let difficulty: Difficulty = 'MEDIUM';
        const diffStr = row["Difficulty (EASY/MEDIUM/HARD)"]?.toUpperCase();
        if (['EASY', 'MEDIUM', 'HARD'].includes(diffStr)) {
            difficulty = diffStr as Difficulty;
        }

        // Type-specific logic
        let options = null;
        let subQuestions = null;
        let modelAnswer = row["Model Answer"];

        if (type === 'MCQ') {
            const optA = row["Option A"];
            const optB = row["Option B"];
            if (!optA || !optB) throw new Error("MCQ requires at least Option A and B");

            const correctOpt = row["Correct Option (A/B/C/D)"]?.toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(correctOpt)) throw new Error("Valid Correct Option (A/B/C/D) required");

            options = [
                { text: String(optA), isCorrect: correctOpt === 'A', explanation: row["Explanation"] },
                { text: String(optB), isCorrect: correctOpt === 'B', explanation: row["Explanation"] },
                { text: String(row["Option C"] || ''), isCorrect: correctOpt === 'C', explanation: row["Explanation"] },
                { text: String(row["Option D"] || ''), isCorrect: correctOpt === 'D', explanation: row["Explanation"] },
            ].filter(o => o.text.trim() !== '');
        } else if (type === 'CQ') {
            const sq1Text = row["Sub-Question 1 Text"];
            const sq1Marks = row["Sub-Question 1 Marks"];
            const sq2Text = row["Sub-Question 2 Text"];
            const sq2Marks = row["Sub-Question 2 Marks"];

            subQuestions = [];
            if (sq1Text) subQuestions.push({ question: sq1Text, marks: parseInt(sq1Marks || '0') });
            if (sq2Text) subQuestions.push({ question: sq2Text, marks: parseInt(sq2Marks || '0') });

            if (subQuestions.length === 0) throw new Error("CQ requires at least one Sub-Question");
        }

        return {
            isValid: true,
            data: {
                type,
                classId,
                className, // Exposed for fallback loopup
                subject,
                topic: row["Topic"] || null,
                difficulty,
                marks,
                questionText,
                options,
                subQuestions,
                modelAnswer,
            },
            _original: row // Consistent top-level placement
        };

    } catch (err: any) {
        return {
            isValid: false,
            error: err.message,
            _original: row
        };
    }
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // Common data fetch
        const classes = await prisma.class.findMany({
            select: { id: true, name: true, section: true }
        });

        // Helper
        const findClassId = (className: string) => {
            const found = classes.find(c =>
                c.name.toLowerCase() === className.toLowerCase().trim() ||
                `${c.name} - ${c.section}`.toLowerCase() === className.toLowerCase().trim()
            );
            return found?.id;
        };

        // MODE 1: FILE PREVIEW (Dry Run)
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get('file') as File;

            if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });

            const previewRows = [];
            for (let i = 0; i < jsonData.length; i++) {
                const result = await validateAndMapRow(jsonData[i], i + 2, classes);
                previewRows.push({ ...result, rowNum: i + 2 });
            }

            return NextResponse.json({ mode: 'preview', rows: previewRows });
        }

        // MODE 2: JSON COMMIT (Final Insert)
        else if (contentType.includes("application/json")) {
            const body = await req.json();
            const { questions } = body; // Expects { questions: [ ... ] }

            if (!Array.isArray(questions) || questions.length === 0) {
                return NextResponse.json({ error: "No questions provided for insertion" }, { status: 400 });
            }

            const results = { success: 0, failed: 0, errors: [] as string[] };

            // TODO: Replace with actual auth user
            const creator = await prisma.user.findFirst();
            if (!creator) throw new Error("No user found to assign creator");

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                try {
                    let classId = q.classId;

                    // Resolve class ID if missing but className provided (fix-up scenario)
                    if (!classId && q.className) {
                        classId = findClassId(q.className);
                    }

                    if (!classId) throw new Error(`Class not found/resolved: ${q.className || 'Unknown'}`);

                    await prisma.question.create({
                        data: {
                            type: q.type || 'MCQ', // Fallback defaults if data is partial
                            classId: classId,
                            subject: q.subject,
                            topic: q.topic,
                            difficulty: q.difficulty || 'MEDIUM',
                            marks: q.marks || 1,
                            questionText: q.questionText,
                            options: q.options || undefined,
                            subQuestions: q.subQuestions || undefined,
                            modelAnswer: q.modelAnswer,
                            createdById: creator.id,
                            hasMath: q.questionText.includes('\\') || (q.modelAnswer && q.modelAnswer.includes('\\'))
                        }
                    });
                    results.success++;
                } catch (err: any) {
                    console.error("Insert error:", err);
                    results.failed++;
                    results.errors.push(`Item ${i + 1}: ${err.message}`);
                }
            }

            return NextResponse.json(results);
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });

    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
