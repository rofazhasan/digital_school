import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";
import { processQuestionWithInlineFBDs } from '@/utils/fbd/inline-parser';

// Define locally to avoid import issues with agent's linter
// Define locally to avoid import issues with agent's linter
type QuestionType = 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ' | 'SMCQ' | 'DESCRIPTIVE';
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
    const type: QuestionType = ['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ', 'SMCQ', 'DESCRIPTIVE'].includes(typeRaw) ? typeRaw as QuestionType : 'MCQ';

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
        if (!['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ', 'SMCQ', 'DESCRIPTIVE'].includes(typeRaw)) {
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
                { text: optA, isCorrect: correctOpts.has('A'), explanation: correctOpts.has('A') ? data.explanation : "" },
                { text: optB, isCorrect: correctOpts.has('B'), explanation: correctOpts.has('B') ? data.explanation : "" },
            ];

            if (optC) optionsList.push({ text: optC, isCorrect: correctOpts.has('C'), explanation: correctOpts.has('C') ? data.explanation : "" });
            if (optD) optionsList.push({ text: optD, isCorrect: correctOpts.has('D'), explanation: correctOpts.has('D') ? data.explanation : "" });
            if (optE) optionsList.push({ text: optE, isCorrect: correctOpts.has('E'), explanation: correctOpts.has('E') ? data.explanation : "" });

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
            for (let i = 1; i <= 10; i++) {
                const prefix = `Sub ${i}`;
                const q = s(getValue(row, [`${prefix} Text`, `Sub-Question ${i} Text`, `SQ${i}`, `SQ ${i} Text`]));
                if (!q) continue;
                const m = n(getValue(row, [`${prefix} Marks`, `Sub-Question ${i} Marks`, `SQ${i} Marks`]));
                const a = s(getValue(row, [`${prefix} Model Answer`, `Sub-Question ${i} Model Answer`, `SQ${i} Answer`]));
                const e = s(getValue(row, [`${prefix} Explanation`, `Sub-Question ${i} Explanation`, `SQ${i} Explanation`]));
                data.subQuestions.push({ question: q, marks: m, modelAnswer: a, explanation: e });
            }

            if (data.subQuestions.length === 0) throw new Error("CQ requires at least one Sub-Question");
        } else if (data.type === 'SMCQ') {
            data.subQuestions = [];
            for (let i = 1; i <= 10; i++) {
                const prefix = `Sub ${i}`;
                const q = s(getValue(row, [`${prefix} Text`, `Sub-Question ${i} Text`, `SQ${i}`, `SQ ${i} Text`]));
                if (!q) continue;

                const m = n(getValue(row, [`${prefix} Marks`, `Sub-Question ${i} Marks`, `SQ${i} Marks`])) || 1;
                const optA = s(getValue(row, [`${prefix} Option A`, `Sub-Question ${i} Option A`, `SQ${i}A`]));
                const optB = s(getValue(row, [`${prefix} Option B`, `Sub-Question ${i} Option B`, `SQ${i}B`]));
                const optC = s(getValue(row, [`${prefix} Option C`, `Sub-Question ${i} Option C`, `SQ${i}C`]));
                const optD = s(getValue(row, [`${prefix} Option D`, `Sub-Question ${i} Option D`, `SQ${i}D`]));

                const correctOptRaw = s(getValue(row, [`${prefix} Correct Option`, `Sub-Question ${i} Correct Option`, `SQ${i} Correct`])).toUpperCase();
                let correctIdx = -1;
                if (/^[A-D]$/.test(correctOptRaw)) {
                    correctIdx = ['A', 'B', 'C', 'D'].indexOf(correctOptRaw);
                } else {
                    correctIdx = n(correctOptRaw) - 1;
                }

                if (correctIdx < 0 || correctIdx > 3) throw new Error(`SMCQ Sub-Question ${i} requires a correct option (A-D or 1-4)`);

                const options = [
                    { text: optA, isCorrect: correctIdx === 0 },
                    { text: optB, isCorrect: correctIdx === 1 },
                ];
                if (optC) options.push({ text: optC, isCorrect: correctIdx === 2 });
                if (optD) options.push({ text: optD, isCorrect: correctIdx === 3 });

                data.subQuestions.push({ question: q, marks: m, options });
            }

            if (data.subQuestions.length === 0) throw new Error("SMCQ requires at least one Sub-Question");
        } else if (data.type === 'DESCRIPTIVE') {
            data.subQuestions = [];
            for (let i = 1; i <= 10; i++) {
                const prefix = `Sub ${i}`;
                const text = s(getValue(row, [`${prefix} Text`, `${prefix} Question`]));
                if (!text && i > 1) continue;
                if (!text && i === 1) break; // Should have at least one

                const subType = s(getValue(row, [`${prefix} Type`])).toLowerCase() || 'writing';
                const marks = n(getValue(row, [`${prefix} Marks`]));
                const modelAnswer = s(getValue(row, [`${prefix} Model Answer`, `${prefix} Answer`]));
                const explanation = s(getValue(row, [`${prefix} Explanation`, `${prefix} Note`]));
                const label = s(getValue(row, [`${prefix} Label`]));
                const instructions = s(getValue(row, [`${prefix} Instructions`]));

                const subQ: any = { subType, text, questionText: text, marks, modelAnswer, explanation, label, instructions };
                subQ.imageUrl = s(getValue(row, [`${prefix} Image URL`, `${prefix} Diagram URL`, `${prefix} Image`]));

                // Handle Sub-type specific data from delimited strings
                if (subType === 'fill_in') {
                    subQ.fillType = s(getValue(row, [`${prefix} Fill Type`])) || 'gap_passage';
                    subQ.clueType = s(getValue(row, [`${prefix} Clue Type`])) || 'none';
                    subQ.passage = s(getValue(row, [`${prefix} Passage`]));
                    const wordBoxStr = s(getValue(row, [`${prefix} Word Box`]));
                    if (wordBoxStr) subQ.wordBox = wordBoxStr.split('|').map(x => x.trim());
                    const answersStr = s(getValue(row, [`${prefix} Answers`]));
                    if (answersStr) subQ.answers = answersStr.split('|').map(x => x.trim());
                } else if (subType === 'short_answer') {
                    const itemsStr = s(getValue(row, [`${prefix} Questions`, `${prefix} Items`]));
                    if (itemsStr) subQ.questions = itemsStr.split('|').map(x => x.trim());
                } else if (subType === 'error_correction') {
                    const itemsStr = s(getValue(row, [`${prefix} Sentences`, `${prefix} Items`]));
                    if (itemsStr) subQ.sentences = itemsStr.split('|').map(x => x.trim());
                } else if (subType === 'table') {
                    const headersStr = s(getValue(row, [`${prefix} Table Headers`]));
                    if (headersStr) subQ.tableHeaders = headersStr.split('|').map(x => x.trim());
                    const rowsStr = s(getValue(row, [`${prefix} Table Rows`]));
                    if (rowsStr) {
                        subQ.tableRows = rowsStr.split('||').map(r => r.split('|').map(x => x.trim()));
                    }
                } else if (subType === 'comprehension') {
                    subQ.stemPassage = s(getValue(row, [`${prefix} Stem Passage`, `${prefix} Stem`]));
                    subQ.passage = s(getValue(row, [`${prefix} Passage`])); // Fallback/Alternative
                    const questionsStr = s(getValue(row, [`${prefix} Questions`]));
                    if (questionsStr) subQ.questions = questionsStr.split('|').map(x => x.trim());
                    const answersStr = s(getValue(row, [`${prefix} Answers`]));
                    if (answersStr) subQ.answers = answersStr.split('|').map(x => x.trim());
                } else if (subType === 'matching' || subType === 'mtf') {
                    const getRoman = (num: number) => {
                        const lookup: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
                        let roman = '', i;
                        for (i in lookup) {
                            while (num >= lookup[i]) { roman += i; num -= lookup[i]; }
                        }
                        return roman;
                    };
                    const getSmallAlpha = (num: number) => String.fromCharCode(97 + num);

                    const leftStr = s(getValue(row, [`${prefix} Left`]));
                    if (leftStr) subQ.leftColumn = leftStr.split('|').map((t, idx) => ({ id: (idx + 1).toString(), text: t.trim() }));
                    const rightStr = s(getValue(row, [`${prefix} Right`]));
                    if (rightStr) subQ.rightColumn = rightStr.split('|').map((t, idx) => ({ id: String.fromCharCode(65 + idx), text: t.trim() }));
                    
                    const colCStr = s(getValue(row, [`${prefix} Column C`]));
                    if (colCStr) subQ.columnC = colCStr.split('|').map((t, idx) => ({ id: getRoman(idx + 1), text: t.trim() }));
                    const colDStr = s(getValue(row, [`${prefix} Column D`]));
                    if (colDStr) subQ.columnD = colDStr.split('|').map((t, idx) => ({ id: getSmallAlpha(idx), text: t.trim() }));

                    const matchesStr = s(getValue(row, [`${prefix} Matches`]));
                    if (matchesStr) {
                        const matchMap: any = {};
                        matchesStr.split(',').forEach(p => {
                            const pts = p.split('-');
                            if (pts.length >= 2) {
                                matchMap[pts[0].trim()] = pts.slice(1).map(x => x.trim()).join('-');
                            }
                        });
                        subQ.matches = matchMap;
                    }
                } else if (subType === 'rearranging' || subType === 'flowchart') {
                    const itemsStr = s(getValue(row, [`${prefix} Rearrange Items`, `${prefix} Items`]));
                    if (itemsStr) subQ.items = itemsStr.split('|').map(x => x.trim());
                    const correctOrderStr = s(getValue(row, [`${prefix} Correct Order`, `${prefix} Model Answer`]));
                    if (correctOrderStr) {
                        subQ.correctOrder = correctOrderStr.split('|').map(x => x.trim());
                        subQ.modelAnswers = correctOrderStr.split('|').map(x => x.trim()); // Double mapping for compatibility
                    }
                    subQ.flowchartStyle = s(getValue(row, [`${prefix} Flow Style`])) || 'vertical';
                } else if (subType === 'true_false') {
                    const statementsStr = s(getValue(row, [`${prefix} Statements`]));
                    if (statementsStr) subQ.statements = statementsStr.split('|').map(x => x.trim());
                    const correctAnswersStr = s(getValue(row, [`${prefix} Answers`]));
                    if (correctAnswersStr) {
                        subQ.correctAnswers = correctAnswersStr.split('|').map(x => {
                            const val = x.trim().toLowerCase();
                            return val === 'true' || val === 't' || val === '1';
                        });
                    }
                } else if (subType === 'label_diagram') {
                    const labelsStr = s(getValue(row, [`${prefix} Labels`]));
                    if (labelsStr) {
                        // Expect format: "Name1:x1:y1|Name2:x2:y2"
                        subQ.labels = labelsStr.split('|').map(item => {
                            const [text, x, y] = item.split(':').map(s => s.trim());
                            return { text, x: n(x), y: n(y) };
                        });
                    }
                } else if (subType === 'interpreting_graph') {
                    const chartType = s(getValue(row, [`${prefix} Chart Type`, `s${i}ChartType`])) || 'bar';
                    const chartLabels = s(getValue(row, [`${prefix} Chart Labels`, `s${i}ChartLabels`]));
                    const chartData = s(getValue(row, [`${prefix} Chart Data`, `s${i}ChartData`]));
                    const xAxisLabel = s(getValue(row, [`${prefix} X-Axis Label`, `s${i}XLabel`]));
                    const yAxisLabel = s(getValue(row, [`${prefix} Y-Axis Label`, `s${i}YLabel`]));
                    
                    if (chartLabels && chartData) {
                        subQ.chartConfig = {
                            type: chartType,
                            labels: chartLabels.split('|').map((x: string) => x.trim()),
                            data: chartData.split('|').map((x: string) => n(x.trim())),
                            xAxisLabel,
                            yAxisLabel
                        };
                    }
                } else if (subType === 'short_answer' || subType === 'error_correction') {
                    const ansStr = s(getValue(row, [`${prefix} Model Answers`, `${prefix} Correct Answers`]));
                    if (ansStr) subQ.modelAnswers = ansStr.split('|').map(x => x.trim());
                }

                data.subQuestions.push(subQ);
            }
            if (data.subQuestions.length === 0) throw new Error("DESCRIPTIVE requires at least one Sub-Question");
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
            const found = classes.find((c: any) =>
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
            const sheetName: string = workbook.SheetNames.find(n => n === "Template") || workbook.SheetNames[0];

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
                            (q.subQuestions ? q.subQuestions.some((sq: any) =>
                                /\\/.test(sq.question) ||
                                (sq.options ? sq.options.some((o: any) => /\\/.test(o.text)) : false)
                            ) : false)
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
