import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";
import { QuestionType, Difficulty } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Fetch all classes for validation mapping
        const classes = await prisma.class.findMany({
            select: { id: true, name: true, section: true }
        });

        // Helper to find class ID
        const findClassId = (className: string) => {
            // Simple matching logic - can be enhanced
            // Assuming className in Excel matches "name" or "name - section"
            const found = classes.find(c =>
                c.name.toLowerCase() === className.toLowerCase().trim() ||
                `${c.name} - ${c.section}`.toLowerCase() === className.toLowerCase().trim()
            );
            return found?.id;
        };

        // Process each row
        for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            const rowNum = i + 2; // Excel row number (1-indexed, +1 for header)

            try {
                // 1. Basic Validation
                const typeStr = row["Type (MCQ/CQ/SQ)"]?.toUpperCase();
                if (!['MCQ', 'CQ', 'SQ'].includes(typeStr)) {
                    throw new Error(`Invalid Question Type: ${row["Type (MCQ/CQ/SQ)"]}`);
                }
                const type = typeStr as QuestionType;

                const className = row["Class Name"];
                if (!className) throw new Error("Class Name is required");
                const classId = findClassId(className);
                if (!classId) throw new Error(`Class not found: ${className}`);

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

                // 2. Type-specific logic
                let options = null;
                let subQuestions = null;
                let modelAnswer = row["Model Answer"];

                if (type === 'MCQ') {
                    const optA = row["Option A"];
                    const optB = row["Option B"];
                    // Enforce at least 2 options
                    if (!optA || !optB) throw new Error("MCQ requires at least Option A and Option B");

                    const correctOpt = row["Correct Option (A/B/C/D)"]?.toUpperCase();
                    if (!['A', 'B', 'C', 'D'].includes(correctOpt)) throw new Error("Valid Correct Option (A/B/C/D) is required for MCQ");

                    options = [
                        { text: String(optA), isCorrect: correctOpt === 'A', explanation: row["Explanation"] },
                        { text: String(optB), isCorrect: correctOpt === 'B', explanation: row["Explanation"] },
                        { text: String(row["Option C"] || ''), isCorrect: correctOpt === 'C', explanation: row["Explanation"] },
                        { text: String(row["Option D"] || ''), isCorrect: correctOpt === 'D', explanation: row["Explanation"] },
                    ].filter(o => o.text.trim() !== '');
                } else if (type === 'CQ') {
                    // Basic CQ support: looks for Sub-Question 1 and 2 cols
                    const sq1Text = row["Sub-Question 1 Text"];
                    const sq1Marks = row["Sub-Question 1 Marks"];
                    const sq2Text = row["Sub-Question 2 Text"];
                    const sq2Marks = row["Sub-Question 2 Marks"];

                    subQuestions = [];
                    if (sq1Text) subQuestions.push({ question: sq1Text, marks: parseInt(sq1Marks || '0') });
                    if (sq2Text) subQuestions.push({ question: sq2Text, marks: parseInt(sq2Marks || '0') });

                    if (subQuestions.length === 0) throw new Error("CQ requires at least one Sub-Question");
                }

                // 3. Database Insertion
                // We'll use a placeholder user ID effectively since we don't have auth context here easily without headers
                // ideally, get user from session. For now, we will look for an admin or first user.
                // TODO: Replace with actual logged-in user ID
                const creator = await prisma.user.findFirst();
                if (!creator) throw new Error("No user found to assign creator");

                await prisma.question.create({
                    data: {
                        type,
                        classId,
                        subject,
                        topic: row["Topic"] || null,
                        difficulty,
                        marks,
                        questionText,
                        options: options || undefined,
                        subQuestions: subQuestions || undefined,
                        modelAnswer: modelAnswer || null,
                        createdById: creator.id,
                        // Simple Math detection
                        hasMath: questionText.includes('\\') || (modelAnswer && modelAnswer.includes('\\'))
                    }
                });

                results.success++;

            } catch (err: any) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: ${err.message}`);
            }
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
