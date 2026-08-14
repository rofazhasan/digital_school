import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from "@/lib/db";
import { processQuestionWithInlineFBDs } from '@/utils/fbd/inline-parser';
import { parseDescriptiveSubQuestion } from '@/utils/descriptive-parser';
import { s, n, getValue } from '@/utils/parser-utils';

// Define locally to avoid import issues with agent's linter
// Define locally to avoid import issues with agent's linter
type QuestionType = 'MCQ' | 'MC' | 'INT' | 'AR' | 'MTF' | 'CQ' | 'SQ' | 'SMCQ' | 'DESCRIPTIVE' | 'CMA' | 'MPC' | 'SRA' | 'DR';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

async function validateAndMapRow(row: any, classes: any[]) {
    // Initialize best-effort data structure to avoid frontend crashes
    const typeRaw = s(getValue(row, ["Type", "Question Type", "QuestionType"])).toUpperCase();
    const type: QuestionType = ['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC', 'SRA', 'DR'].includes(typeRaw) ? typeRaw as QuestionType : 'MCQ';

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
        modelAnswer: s(getValue(row, ["Model Answer", "ModelAnswer", "Answer", "Correct Answer"])),
        explanation: s(getValue(row, ["Teacher Note / Explanation", "Explanation", "Rationale", "Exp", "Solution", "Explaination"])),
        classId: null,
        options: [],
        subQuestions: [],
        assertion: null,
        reason: null,
        correctOption: null,
        leftColumn: [],
        rightColumn: [],
        matches: {},
    };

    try {
        if (!['MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC', 'SRA', 'DR'].includes(typeRaw)) {
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
            const ansStr = data.modelAnswer || s(getValue(row, ["Correct Answer", "Answer", "Result"])) || data.explanation;
            if (!ansStr) throw new Error("INT question requires a numeric Model Answer / Correct Answer");
            const ans = n(ansStr);
            data.modelAnswer = ans.toString();
        } else if (data.type === 'SQ') {
            if (!data.modelAnswer && data.explanation) {
                data.modelAnswer = data.explanation;
            }
            if (!data.modelAnswer) throw new Error("SQ question requires a Model Answer");
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
        } else if (data.type === 'CMA') {
            data.subQuestions = [];
            for (let i = 1; i <= 10; i++) {
                const prefix = `Sub ${i}`;
                const label = s(getValue(row, [`${prefix} Text`, `Sub-Question ${i} Text`, `SQ${i}`, `SQ ${i} Text`, `${prefix} Label`]));
                if (!label) continue;
                const m = n(getValue(row, [`${prefix} Marks`, `Sub-Question ${i} Marks`, `SQ${i} Marks`])) || 1;
                const a = s(getValue(row, [`${prefix} Model Answer`, `Sub-Question ${i} Model Answer`, `SQ${i} Answer`]));
                const e = s(getValue(row, [`${prefix} Explanation`, `Sub-Question ${i} Explanation`, `SQ${i} Explanation`]));
                const pType = s(getValue(row, [`${prefix} Type`, `Sub-Question ${i} Type`])) || 'decimal';
                const tol = n(getValue(row, [`${prefix} Tolerance`, `Sub-Question ${i} Tolerance`])) || 0.01;
                const unit = s(getValue(row, [`${prefix} Unit`, `Sub-Question ${i} Unit`]));

                data.subQuestions.push({
                    id: `p${i}`,
                    label,
                    text: label,
                    question: label,
                    marks: m,
                    modelAnswer: a,
                    expectedAnswer: a,
                    type: pType,
                    tolerance: tol,
                    unit,
                    explanation: e
                });
            }
            if (data.subQuestions.length === 0) throw new Error("CMA requires at least one Sub-Question part (Sub 1 Text & Sub 1 Model Answer)");
        } else if (data.type === 'MPC') {
            data.subQuestions = [];
            for (let i = 1; i <= 10; i++) {
                const prefix = `Sub ${i}`;
                const title = s(getValue(row, [`${prefix} Text`, `Sub-Question ${i} Text`, `SQ${i}`, `SQ ${i} Text`, `${prefix} Title`]));
                if (!title) continue;
                const m = n(getValue(row, [`${prefix} Marks`, `Sub-Question ${i} Marks`, `SQ${i} Marks`])) || 1;
                const a = s(getValue(row, [`${prefix} Model Answer`, `Sub-Question ${i} Model Answer`, `SQ${i} Answer`]));
                const e = s(getValue(row, [`${prefix} Explanation`, `Sub-Question ${i} Explanation`, `SQ${i} Explanation`]));
                const tol = n(getValue(row, [`${prefix} Tolerance`, `Sub-Question ${i} Tolerance`])) || 0.01;
                const dependsOn = s(getValue(row, [`${prefix} Depends On`, `Sub-Question ${i} Depends On`]));
                const formula = s(getValue(row, [`${prefix} Formula`, `Sub-Question ${i} Formula`]));

                data.subQuestions.push({
                    id: `s${i}`,
                    stageTitle: title,
                    text: title,
                    question: title,
                    marks: m,
                    modelAnswer: a,
                    expectedAnswer: a,
                    tolerance: tol,
                    dependsOnStageId: dependsOn || (i > 1 ? `s${i - 1}` : undefined),
                    formula,
                    explanation: e
                });
            }
            if (data.subQuestions.length === 0) throw new Error("MPC requires at least one Stage (Sub 1 Text & Sub 1 Model Answer)");
        } else if (data.type === 'SRA' || data.type === 'DR') {
            const rawComponents = getValue(row, ["Components", "SRA Components", "sraComponents"]);
            if (rawComponents && typeof rawComponents === 'string') {
                try {
                    const parsed = JSON.parse(rawComponents);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        (data as any).components = parsed;
                        data.subQuestions = parsed;
                    }
                } catch {}
            }

            if (!(data as any).components) {
                const mainAnswer = data.modelAnswer || s(getValue(row, ["Canonical Answer", "Model Answer", "Correct Answer", "Answer", "Result", "Sub 1 Model Answer"]));
                const components: any[] = [];

                // Component 1: CONSTRUCT or INTERMEDIATE_CONSTRUCT
                if (mainAnswer || getValue(row, ["Sub 1 Text"])) {
                    const c1Text = s(getValue(row, ["Sub 1 Text"])) || "Constructed Value";
                    const c1Marks = n(getValue(row, ["Sub 1 Marks"])) || 2;
                    const c1Tol = n(getValue(row, ["Sub 1 Tolerance", "Tolerance Value", "Tolerance"])) || 0.01;
                    const c1Unit = s(getValue(row, ["Sub 1 Unit", "Expected Unit", "Unit"]));
                    components.push({
                        id: 'comp_1',
                        kind: 'CONSTRUCT',
                        label: 'Step 1: Construct / Calculation',
                        prompt: c1Text,
                        expectedAnswer: mainAnswer || '',
                        marks: c1Marks,
                        tolerance: c1Tol,
                        unit: c1Unit,
                        evaluationMode: /^[0-9.-]+$/.test(mainAnswer || '') ? 'NUMERIC' : 'TEXT'
                    });
                }

                // Component 2: EVIDENCE_SELECT / REASONING (from Sub 2 or options)
                const reasonOpts: Array<{ id: string; text: string; isCorrect: boolean }> = [];
                const correctReasonOptRaw = s(getValue(row, ["Correct Option", "Correct Answer", "Sub 2 Correct Option", "Sub 2 Correct", "Sub 1 Correct", "Correct Reason"])).toUpperCase();

                // Option columns from Sub 2 A-D or Sub X
                const optA = s(getValue(row, ["Sub 2 Option A", "Sub 2 A", "Option A", "Sub 1 Option A"]));
                const optB = s(getValue(row, ["Sub 2 Option B", "Sub 2 B", "Option B", "Sub 1 Option B"]));
                const optC = s(getValue(row, ["Sub 2 Option C", "Sub 2 C", "Option C", "Sub 1 Option C"]));
                const optD = s(getValue(row, ["Sub 2 Option D", "Sub 2 D", "Option D", "Sub 1 Option D"]));

                if (optA && optB) {
                    [optA, optB, optC, optD].filter(Boolean).forEach((txt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        reasonOpts.push({
                            id: `opt_${letter}`,
                            text: txt,
                            isCorrect: correctReasonOptRaw.includes(letter) || correctReasonOptRaw === String(idx + 1)
                        });
                    });
                } else {
                    for (let i = 1; i <= 10; i++) {
                        const prefix = `Sub ${i}`;
                        const reasonText = s(getValue(row, [`${prefix} Text`, `Sub-Question ${i} Text`, `Reason ${i}`, `${prefix} Reason`]));
                        if (!reasonText || (i === 1 && components.length > 0 && mainAnswer)) continue;

                        const isSubCorrect = s(getValue(row, [`${prefix} Correct`, `${prefix} Correct Option`])).toUpperCase();
                        let isCorrect = isSubCorrect === 'TRUE' || isSubCorrect === 'YES' || isSubCorrect === '1';

                        const letter = String.fromCharCode(64 + i);
                        if (correctReasonOptRaw === letter || correctReasonOptRaw === String(i)) {
                            isCorrect = true;
                        }

                        reasonOpts.push({
                            id: `r${i}`,
                            text: reasonText,
                            isCorrect
                        });
                    }
                }

                if (reasonOpts.length > 0) {
                    const c2Marks = n(getValue(row, ["Sub 2 Marks"])) || 2;
                    components.push({
                        id: 'comp_2',
                        kind: 'EVIDENCE_SELECT',
                        label: 'Step 2: Justification / Principle Selection',
                        prompt: s(getValue(row, ["Sub 2 Text"])) || "Select the governing law or evidence:",
                        marks: c2Marks,
                        scoring: 'ALL_OR_NOTHING',
                        options: reasonOpts
                    });
                }

                if (components.length === 0) {
                    throw new Error("SRA requires at least one component (Model Answer or Sub 1/2 Text)");
                }

                (data as any).components = components;
                data.subQuestions = components;
                data.options = reasonOpts;
            }
        } else if (data.type === 'DESCRIPTIVE') {
            data.subQuestions = [];
            for (let i = 1; i <= 10; i++) {
                const subQ = parseDescriptiveSubQuestion(row, i);
                if (subQ) data.subQuestions.push(subQ);
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
                const result = await validateAndMapRow(jsonData[i], classes);
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
                            /\\/.test(String(q.questionText || '')) ||
                            /\\/.test(String(q.modelAnswer || '')) ||
                            /\\/.test(String(q.assertion || '')) ||
                            /\\/.test(String(q.reason || '')) ||
                            (Array.isArray(q.options) ? q.options.some((o: any) => /\\/.test(String(o.text))) : false) ||
                            (Array.isArray(q.subQuestions) ? q.subQuestions.some((sq: any) =>
                                /\\/.test(String(sq.question || sq.text || '')) ||
                                (Array.isArray(sq.options) ? sq.options.some((o: any) => /\\/.test(String(o.text))) : false)
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
