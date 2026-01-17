import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";

// Define locally to avoid import issues with agent's linter
type QuestionType = 'MCQ' | 'CQ' | 'SQ';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Helper to separate validation logic
const s = (val: any) => String(val || '').trim(); // Safe trim
// Safe number parsing
const n = (val: any) => {
    if (!val) return 0;
    const items = String(val).match(/\d+/);
    return items ? parseInt(items[0]) : 0;
}

async function validateAndMapRow(row: any, rowNum: number, classes: any[]) {
    // Initialize best-effort data structure to avoid frontend crashes
    // We try to interpret what we can even if validation fails later
    const typeRaw = s(row["Type (MCQ/CQ/SQ)"]).toUpperCase();
    const type: QuestionType = ['MCQ', 'CQ', 'SQ'].includes(typeRaw) ? typeRaw as QuestionType : 'MCQ';

    const diffRaw = s(row["Difficulty (EASY/MEDIUM/HARD)"]).toUpperCase();
    const difficulty: Difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(diffRaw) ? diffRaw as Difficulty : 'MEDIUM';

    const data: any = {
        type,
        className: s(row["Class Name"]),
        subject: s(row["Subject"]),
        topic: s(row["Topic"]),
        difficulty,
        marks: n(row["Marks"]),
        questionText: s(row["Question Text"]),
        modelAnswer: s(row["Model Answer"]),
        classId: null,      // Will resolve
        options: null,      // Will parse
        subQuestions: null, // Will parse
    };

    try {
        if (!['MCQ', 'CQ', 'SQ'].includes(typeRaw)) {
            // If row is completely empty, it might just be trailing whitespace in Excel
            const isEmpty = Object.values(row).every(v => !v);
            if (isEmpty) throw new Error("Empty Row");
            throw new Error(`Invalid Question Type: ${row["Type (MCQ/CQ/SQ)"] || 'Missing'}`);
        }

        if (!data.className) throw new Error("Class Name is required");

        // Class Resolution
        const normClassName = data.className.toLowerCase();
        const foundClass = classes.find((c: any) => {
            if (c.name.toLowerCase() === normClassName) return true;
            if (c.section) {
                return `${c.name} - ${c.section}`.toLowerCase() === normClassName;
            }
            return false;
        });

        if (!foundClass) throw new Error(`Class not found: ${data.className}. (Available: ${classes.slice(0, 3).map((c: any) => c.name).join(', ')}...)`);
        data.classId = foundClass.id;

        if (!data.subject) throw new Error("Subject is required");
        if (!data.questionText) throw new Error("Question Text is required");

        // Type-specific logic
        if (data.type === 'MCQ') {
            const optA = s(row["Option A"]);
            const optB = s(row["Option B"]);
            if (!optA || !optB) throw new Error("MCQ requires at least Option A and B");

            const correctOpt = s(row["Correct Option (A/B/C/D)"]).toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(correctOpt)) throw new Error("Valid Correct Option (A/B/C/D) required");

            data.options = [
                { text: optA, isCorrect: correctOpt === 'A', explanation: s(row["Explanation"]) },
                { text: optB, isCorrect: correctOpt === 'B', explanation: s(row["Explanation"]) },
                { text: s(row["Option C"]), isCorrect: correctOpt === 'C', explanation: s(row["Explanation"]) },
                { text: s(row["Option D"]), isCorrect: correctOpt === 'D', explanation: s(row["Explanation"]) },
            ].filter((o: any) => o.text !== '');
        } else if (data.type === 'CQ') {
            const sq1Text = s(row["Sub-Question 1 Text"]);
            const sq1Marks = n(row["Sub-Question 1 Marks"]);
            const sq2Text = s(row["Sub-Question 2 Text"]);
            const sq2Marks = n(row["Sub-Question 2 Marks"]);

            data.subQuestions = [];
            if (sq1Text) data.subQuestions.push({ question: sq1Text, marks: sq1Marks });
            if (sq2Text) data.subQuestions.push({ question: sq2Text, marks: sq2Marks });

            if (data.subQuestions.length === 0) throw new Error("CQ requires at least one Sub-Question");
        }

        return {
            isValid: true,
            data,
            _original: row
        };

    } catch (err: any) {
        // Skip empty rows silently
        if (err.message === "Empty Row") return null;

        return {
            isValid: false,
            error: err.message,
            data, // Return partial data so frontend can display/edit
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
            const norm = className.toLowerCase().trim();
            const found = classes.find(c =>
                c.name.toLowerCase() === norm ||
                `${c.name} - ${c.section}`.toLowerCase() === norm
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
                if (result) {
                    previewRows.push({ ...result, rowNum: i + 2 });
                }
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
                // Skip if q is null (shouldn't happen if filtered correctly on frontend but good to be safe)
                if (!q) continue;

                try {
                    let classId = q.classId;

                    // Resolve class ID if missing but className provided (fix-up scenario)
                    // We trust classId if present, assuming frontend/preview logic is correct. 
                    // But if it's missing, we try to resolve by name.
                    if (!classId && q.className) {
                        classId = findClassId(q.className);
                    }

                    if (!classId) throw new Error(`Class not found/resolved: ${q.className || 'Unknown'}`);

                    await prisma.question.create({
                        data: {
                            type: (q.type || 'MCQ') as any, // Cast to avoid TS enum issues
                            classId: classId,
                            subject: q.subject,
                            topic: q.topic,
                            difficulty: (q.difficulty || 'MEDIUM') as any,
                            marks: q.marks || 1,
                            questionText: q.questionText,
                            options: q.options || undefined,
                            subQuestions: q.subQuestions || undefined,
                            modelAnswer: q.modelAnswer,
                            createdById: creator.id,
                            hasMath: q.questionText.includes('\\') || (!!q.modelAnswer && q.modelAnswer.includes('\\'))
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
