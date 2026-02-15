import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";
import { processQuestionWithInlineFBDs } from '@/utils/fbd/inline-parser';

// Define locally to avoid import issues with agent's linter
// Define locally to avoid import issues with agent's linter
type QuestionType = 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Helper to separate validation logic
const s = (val: any) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
}
// Safe number parsing
const n = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const items = String(val).match(/-?\d+/);
    return items ? parseInt(items[0]) : 0;
}

// Helper to get value from multiple possible keys
const getValue = (row: any, keys: string[]) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
        }
    }
    return '';
}

async function validateAndMapRow(row: any, rowNum: number, classes: any[]) {
    // Initialize best-effort data structure to avoid frontend crashes
    const typeRaw = s(getValue(row, ["Type", "Question Type", "QuestionType"])).toUpperCase();
    const type: QuestionType = ['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ'].includes(typeRaw) ? typeRaw as QuestionType : 'MCQ';

    const diffRaw = s(getValue(row, ["Difficulty", "Level", "Diff"])).toUpperCase();
    const difficulty: Difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(diffRaw) ? diffRaw as Difficulty : 'MEDIUM';

    const data: any = {
        type,
        className: s(getValue(row, ["Class Name", "Class"])),
        subject: s(getValue(row, ["Subject", "Subject Name"])),
        topic: s(getValue(row, ["Topic", "Chapter"])),
        difficulty,
        marks: n(getValue(row, ["Marks", "Mark"])),
        questionText: s(getValue(row, ["Question Text", "Question", "Title"])),
        modelAnswer: s(getValue(row, ["Model Answer", "Answer"])),
        modelAnswer: s(getValue(row, ["Model Answer", "Answer"])),
        explanation: s(getValue(row, ["Explanation", "Rationale", "Exp", "Solution", "Explaination"])),
        classId: null,
        options: null,
        subQuestions: null,
        assertion: null,
        reason: null,
        correctOption: null,
        leftColumn: null,
        rightColumn: null,
        matches: null,
    };

    try {
        if (!['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ'].includes(typeRaw)) {
            const isEmpty = Object.values(row).every(v => !v);
            if (isEmpty) throw new Error("Empty Row");
            throw new Error(`Invalid Question Type: ${typeRaw || 'Missing'}`);
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

        if (!foundClass) throw new Error(`Class not found: ${data.className}.`);
        data.classId = foundClass.id;

        if (!data.subject) throw new Error("Subject is required");
        if (!data.questionText && type !== 'AR') throw new Error("Question Text is required");

        // Type-specific logic
        if (data.type === 'MCQ' || data.type === 'MC') {
            const optA = s(getValue(row, ["Option A", "A"]));
            const optB = s(getValue(row, ["Option B", "B"]));
            const optC = s(getValue(row, ["Option C", "C"]));
            const optD = s(getValue(row, ["Option D", "D"]));
            const optE = s(getValue(row, ["Option E", "E"]));

            if (!optA || !optB) throw new Error(`${data.type} requires at least Option A and B`);

            const correctOptRaw = s(getValue(row, ["Correct Option", "Correct Answer", "Answer"])).toUpperCase();

            // For MC, we accept comma-separated or space-separated (e.g. "A,B" or "A B" or "1, 2")
            const correctOptsRaw = correctOptRaw.split(/[,\s]+/).map(o => o.trim()).filter(Boolean);
            const correctOpts = new Set<string>();

            correctOptsRaw.forEach(opt => {
                if (/^[A-E]$/.test(opt)) {
                    correctOpts.add(opt);
                } else {
                    const idx = n(opt);
                    if (idx >= 1 && idx <= 5) {
                        correctOpts.add(['A', 'B', 'C', 'D', 'E'][idx - 1]);
                    }
                }
            });

            if (correctOpts.size === 0) throw new Error("Correct option(s) required (e.g. A, B or 1, 2)");

            const optionsList = [
                { text: optA, isCorrect: correctOpts.has('A') },
                { text: optB, isCorrect: correctOpts.has('B') },
            ];

            if (optC) optionsList.push({ text: optC, isCorrect: correctOpts.has('C') });
            if (optD) optionsList.push({ text: optD, isCorrect: correctOpts.has('D') });
            if (optE) optionsList.push({ text: optE, isCorrect: correctOpts.has('E') });

            data.options = optionsList;
        } else if (data.type === 'INT') {
            const ansStr = s(getValue(row, ["Correct Answer", "Answer", "Result"]));
            const ans = n(ansStr);
            data.modelAnswer = ans.toString();
        } else if (data.type === 'AR') {
            data.assertion = s(getValue(row, ["Assertion", "Statement A", "A"]));
            data.reason = s(getValue(row, ["Reason", "Statement R", "R"]));
            data.correctOption = n(getValue(row, ["Correct Option", "Answer"]));

            if (!data.assertion || !data.reason) throw new Error("AR requires both Assertion and Reason");
            if (!data.correctOption || data.correctOption < 1 || data.correctOption > 5) throw new Error("AR correct option must be 1-5");

            // Mock question text if empty for DB requirement
            if (!data.questionText) data.questionText = "Assertion-Reason Question";
        } else if (data.type === 'MTF') {
            // MTF Expects columns Left 1, Left 2, Left 3... and Right A, Right B, Right C...
            // And a matches string "1-A, 2-C, 3-B"
            const lefts = [];
            for (let i = 1; i <= 5; i++) {
                const txt = s(getValue(row, [`Left ${i}`, `L${i}`, `Column A ${i}`]));
                if (txt) lefts.push({ id: i.toString(), text: txt });
            }

            const rights = [];
            const letters = ['A', 'B', 'C', 'D', 'E'];
            for (let i = 0; i < 5; i++) {
                const txt = s(getValue(row, [`Right ${letters[i]}`, `R${letters[i]}`, `Column B ${letters[i]}`]));
                if (txt) rights.push({ id: letters[i], text: txt });
            }

            if (lefts.length < 2 || rights.length < 2) throw new Error("MTF requires at least 2 items in each column");

            data.leftColumn = lefts;
            data.rightColumn = rights;

            const matchStr = s(getValue(row, ["Matches", "Correct Matches"]));
            const matchMap: Record<string, string> = {};
            // Parse "1-A, 2-B" or "1:A 2:B" or even "1 - A"
            const matchPairs = matchStr.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
            matchPairs.forEach(p => {
                const parts = p.split(/[-:]/);
                if (parts.length === 2) {
                    const k = parts[0].trim();
                    const v = parts[1].trim().toUpperCase();
                    if (k && v) matchMap[k] = v;
                }
            });

            if (Object.keys(matchMap).length === 0) throw new Error("MTF requires matches (e.g. 1-A, 2-B)");
            data.matches = matchMap;
        } else if (data.type === 'CQ') {
            data.subQuestions = [];
            for (let i = 1; i <= 4; i++) {
                const q = s(getValue(row, [`Sub-Question ${i} Text`, `Sub-Question ${i}`, `SQ${i}`, `SQ ${i} Text`]));
                const m = n(getValue(row, [`Sub-Question ${i} Marks`, `SQ${i} Marks`]));
                const a = s(getValue(row, [`Sub-Question ${i} Model Answer`, `Sub-Question ${i} Answer`, `SQ${i} Answer`]));
                if (q) data.subQuestions.push({ question: q, marks: m, modelAnswer: a });
            }

            if (data.subQuestions.length === 0) throw new Error("CQ requires at least one Sub-Question");
        }

        const { processedData } = processQuestionWithInlineFBDs(data);
        Object.assign(data, processedData);

        return { isValid: true, data, _original: row };

    } catch (err: any) {
        if (err.message === "Empty Row") return null;
        return { isValid: false, error: err.message, data, _original: row };
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

            // Prefer "Template" sheet, fallback to first sheet
            let sheetName: string = workbook.SheetNames.find(n => n === "Template") || workbook.SheetNames[0];

            if (!sheetName) {
                return NextResponse.json({ error: "Excel file has no sheets" }, { status: 400 });
            }

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

            const preparedQuestions = [];
            let failedCount = 0;
            const errors: string[] = [];

            // TODO: Replace with actual auth user
            const creator = await prisma.user.findFirst();
            if (!creator) throw new Error("No user found to assign creator");

            // 1. Prepare and Validate all questions in memory
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q) continue;

                try {
                    let classId = q.classId;

                    // Resolve class ID if missing but className provided
                    if (!classId && q.className) {
                        classId = findClassId(q.className);
                    }

                    if (!classId) throw new Error(`Class not found/resolved: ${q.className || 'Unknown'}`);

                    preparedQuestions.push({
                        type: (q.type || 'MCQ') as any,
                        classId: classId,
                        subject: q.subject,
                        topic: q.topic,
                        difficulty: (q.difficulty || 'MEDIUM') as any,
                        marks: q.marks || 1,
                        questionText: q.questionText,
                        options: q.options || undefined,
                        subQuestions: q.subQuestions || undefined,
                        modelAnswer: q.modelAnswer,
                        explanation: q.explanation,
                        assertion: q.assertion || undefined,
                        reason: q.reason || undefined,
                        correctOption: q.correctOption || undefined,
                        leftColumn: q.leftColumn || undefined,
                        rightColumn: q.rightColumn || undefined,
                        matches: q.matches || undefined,
                        createdById: creator.id,
                        hasMath: Boolean(
                            /\\/.test(q.questionText || '') ||
                            /\\/.test(q.modelAnswer || '') ||
                            /\\/.test(q.assertion || '') ||
                            /\\/.test(q.reason || '') ||
                            (q.options ? q.options.some((o: any) => /\\/.test(o.text)) : false) ||
                            (q.subQuestions ? q.subQuestions.some((sq: any) => /\\/.test(sq.question)) : false)
                        )
                    });
                } catch (err: any) {
                    // Capture pre-validation errors
                    failedCount++;
                    errors.push(`Item ${i + 1}: ${err.message}`);
                }
            }

            // 2. Batch Insert
            if (preparedQuestions.length > 0) {
                await prisma.question.createMany({
                    data: preparedQuestions
                });
            }

            return NextResponse.json({
                success: preparedQuestions.length,
                failed: failedCount,
                errors: errors
            });
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });

    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
