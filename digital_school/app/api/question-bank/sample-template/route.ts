import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Digital School';
        workbook.created = new Date();

        // 1. INSTRUCTIONS SHEET
        const infoSheet = workbook.addWorksheet('Instructions', {
            views: [{ showGridLines: false }]
        });

        infoSheet.columns = [
            { header: 'Step', key: 'step', width: 20 },
            { header: 'Instruction', key: 'instruction', width: 80 }
        ];

        const instructions = [
            ["Step 1", "Download this template and fill it with your questions."],
            ["Step 2", "Do not change the header names in the 'Template' sheet."],
            ["Step 3", "Select values from the dropdowns for Type, Class, Subject, Difficulty, etc."],
            ["Step 4", "For Class Name, you MUST pick from the dropdown (these match your system classes)."],
            ["Step 5", "Save and upload this file back to the system."],
            [""],
            ["FIELD GUIDE BY TYPE:", ""],
            ["MCQ / MC", "Fill 'Question Text', 'Option A-E', and 'Correct Option' (Single letter for MCQ, comma-separated letters for MC like 'A, C')."],
            ["INT (Integer)", "Fill 'Question Text' and 'Correct Answer' (numeric value)."],
            ["AR (Assertion-Reason)", "Fill 'Assertion', 'Reason', and 'Correct Option' (1-4 or 1-5)."],
            ["MTF (Match Following)", "Fill 'Left 1-5', 'Right A-E', and 'Matches' (e.g., '1-A, 2-B'). For 3+ columns, use 'Sub X Column C/D' in DESCRIPTIVE mode."],
            ["CQ (Creative)", "Fill 'Question Text' (passage), 'Sub-Question' fields 1-10. For poetry, use '||' for line breaks or just use Alt+Enter in Excel."],
            ["SMCQ (Scenario MCQ)", "Fill 'Question Text' (stem), 'Sub-Question' fields 1-10 including 'Option A-D' and 'Correct Option'. Provides automated marking."],
            ["SQ (Short Question)", "Fill 'Question Text' and 'Model Answer'. Supports 'Sub X Type' for specialized layout."],
            ["DESCRIPTIVE", "Flexible format. Use 'Sub X Type' (writing, fill_in, matching, rearranging, flowchart, comprehension, label_diagram, etc.)."],
            ["  - Flowchart", "Use 'Sub X Items' for nodes (pipe separated '|') and 'Sub X Correct Order' for sequence."],
            ["  - Fill-in", "Use 'Sub X Clue Type' (word_box, in_text, none) and 'Sub X Word Box' (pipe separated). Use 'Sub X Passage' with '___' for gaps."],
            ["  - Labels", "Use 'Sub X Labels' with 'Text|Text' or 'Text:x:y|Text:x:y' format."],
            ["POETRY / PASSAGE", "For Poem/Passage, use '||' for forced line breaks or type with Newlines (Alt+Enter). The system will preserve the poetic format."],
            ["EXPLANATIONS", "Fill 'Teacher Note / Explanation' for the main question or 'Sub X Explanation' for each part. These show in Results/Evaluations."],
            [""],
            ["Difficulty", "EASY, MEDIUM, HARD"],
            ["Marks", "Number only."]
        ];

        instructions.forEach(row => infoSheet.addRow(row));

        // Style the instructions
        infoSheet.getRow(1).font = { bold: true, size: 14 };
        infoSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.getCell(1).font = { bold: true };
                row.alignment = { vertical: 'middle', wrapText: true };
            }
        });

        // 2. REFERENCE SHEET (Hidden logic for dropdowns)
        const refSheet = workbook.addWorksheet('Valid Classes Reference');
        // Retrieve classes
        const classes = await prisma.class.findMany({ select: { name: true, section: true } });
        const classNames = classes.map((c: any) => c.section ? `${c.name} - ${c.section}` : c.name);

        refSheet.columns = [{ header: 'Valid Classes', key: 'class', width: 50 }];
        refSheet.addRows(classNames.map((c: string) => [c]));

        // Hide it so users don't mess with it, but keep it available for validation logic
        refSheet.state = 'hidden';

        // 3. TEMPLATE SHEET
        const templateSheet = workbook.addWorksheet('Template');

        // Headers
        const columns = [
            { header: "Type", key: "type", width: 10 },
            { header: "Class Name", key: "className", width: 25 },
            { header: "Subject", key: "subject", width: 15 },
            { header: "Topic", key: "topic", width: 20 },
            { header: "Difficulty", key: "difficulty", width: 12 },
            { header: "Marks", key: "marks", width: 8 },
            { header: "Question Text", key: "questionText", width: 40 },
            { header: "Option A", key: "optionA", width: 15 },
            { header: "Option B", key: "optionB", width: 15 },
            { header: "Option C", key: "optionC", width: 15 },
            { header: "Option D", key: "optionD", width: 15 },
            { header: "Option E", key: "optionE", width: 15 },
            { header: "Correct Option", key: "correctOption", width: 15 },
            { header: "Correct Answer", key: "correctAnswer", width: 15 },
            { header: "Assertion", key: "assertion", width: 20 },
            { header: "Reason", key: "reason", width: 20 },
            { header: "Left 1", key: "l1", width: 15 },
            { header: "Left 2", key: "l2", width: 15 },
            { header: "Left 3", key: "l3", width: 15 },
            { header: "Left 4", key: "l4", width: 15 },
            { header: "Left 5", key: "l5", width: 15 },
            { header: "Right A", key: "ra", width: 15 },
            { header: "Right B", key: "rb", width: 15 },
            { header: "Right C", key: "rc", width: 15 },
            { header: "Right D", key: "rd", width: 15 },
            { header: "Right E", key: "re", width: 15 },
            { header: "Matches", key: "matches", width: 15 },
            { header: "Teacher Note / Explanation", key: "explanation", width: 30 },
            { header: "Model Answer", key: "modelAnswer", width: 20 },
        ];

        // ADD SUB-QUESTION COLUMNS (1-10)
        for (let i = 1; i <= 10; i++) {
            const prefix = `Sub ${i}`;
            const keyPrefix = `s${i}`;
            columns.push(
                { header: `${prefix} Text`, key: `${keyPrefix}Text`, width: 25 },
                { header: `${prefix} Type`, key: `${keyPrefix}Type`, width: 15 },
                { header: `${prefix} Marks`, key: `${keyPrefix}Marks`, width: 10 },
                { header: `${prefix} Label`, key: `${keyPrefix}Label`, width: 15 },
                { header: `${prefix} Instructions`, key: `${keyPrefix}Instructions`, width: 25 },
                { header: `${prefix} Model Answer`, key: `${keyPrefix}ModelAnswer`, width: 25 },
                { header: `${prefix} Explanation`, key: `${keyPrefix}Explanation`, width: 25 },
                // Special fields for sub-types
                { header: `${prefix} Clue Type`, key: `${keyPrefix}ClueType`, width: 12 },
                { header: `${prefix} Word Box`, key: `${keyPrefix}WordBox`, width: 20 },
                { header: `${prefix} Passage`, key: `${keyPrefix}Passage`, width: 30 },
                { header: `${prefix} Column C`, key: `${keyPrefix}ColC`, width: 15 },
                { header: `${prefix} Column D`, key: `${keyPrefix}ColD`, width: 15 },
                { header: `${prefix} Items`, key: `${keyPrefix}Items`, width: 20 },
                { header: `${prefix} Correct Order`, key: `${keyPrefix}Order`, width: 20 },
                { header: `${prefix} Stem Passage`, key: `${keyPrefix}Stem`, width: 30 },
                { header: `${prefix} Questions`, key: `${keyPrefix}Questions`, width: 25 },
                { header: `${prefix} Answers`, key: `${keyPrefix}Answers`, width: 25 },
                { header: `${prefix} Image URL`, key: `${keyPrefix}Img`, width: 20 },
                // MCQ specific in SMCQ/CQ
                { header: `${prefix} Option A`, key: `${keyPrefix}A`, width: 15 },
                { header: `${prefix} Option B`, key: `${keyPrefix}B`, width: 15 },
                { header: `${prefix} Option C`, key: `${keyPrefix}C`, width: 15 },
                { header: `${prefix} Option D`, key: `${keyPrefix}D`, width: 15 },
                { header: `${prefix} Correct Option`, key: `${keyPrefix}Correct`, width: 15 }
            );
        }
        templateSheet.columns = columns;


        // Header Styling
        const headerRow = templateSheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Indigo-600 ish
        };
        headerRow.alignment = { horizontal: 'center' };

        // DATA VALIDATION & DROPDOWNS
        const rowCount = 200;

        for (let i = 2; i <= rowCount; i++) {
            const row = templateSheet.getRow(i);

            // Type Dropdown (Col 1)
            row.getCell(1).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"MCQ,MC,INT,AR,MTF,CQ,SQ,SMCQ,DESCRIPTIVE"'],
                showErrorMessage: true,
                errorTitle: 'Invalid Type',
                error: 'Select: MCQ, MC, INT, AR, MTF, CQ, SQ, SMCQ'
            };

            // Class Name Dropdown (Col 2)
            if (classNames.length > 0) {
                const lastRow = classNames.length + 1;
                row.getCell(2).dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Valid Classes Reference'!$A$2:$A$${lastRow}`],
                    showErrorMessage: true
                };
            }

            // Difficulty Dropdown (Col 5)
            row.getCell(5).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"EASY,MEDIUM,HARD"'],
                showErrorMessage: true
            };

            // Correct Option Dropdown (Col 13)
            row.getCell(13).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"A,B,C,D,E,1,2,3,4,5"'],
                showErrorMessage: true
            };
        }

        // Add Samples
        const sampleClass = classNames[0] || "Class 10";
        templateSheet.addRow(["MCQ", sampleClass, "Physics", "Light", "EASY", 1, "What is light?", "Wave", "Particle", "Both", "None", "", "C", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Both theories are correct."]);
        templateSheet.addRow(["MC", sampleClass, "Math", "Primes", "MEDIUM", 4, "Pick primes:", "2", "3", "4", "5", "9", "A, B, D", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "2, 3, 5 are primes."]);
        templateSheet.addRow(["INT", sampleClass, "Math", "Algebra", "EASY", 2, "2+2=?", "", "", "", "", "", "", "4"]);
        templateSheet.addRow(["AR", sampleClass, "History", "Events", "MEDIUM", 1, "", "", "", "", "", "", "1", "", "S1 is true", "S2 is reason"]);
        templateSheet.addRow(["MTF", sampleClass, "GK", "Capitals", "MEDIUM", 5, "Match capitals:", "", "", "", "", "", "", "", "", "", "India", "USA", "France", "", "", "Delhi", "Washington", "Paris", "", "", "1-A, 2-B, 3-C"]);
        templateSheet.addRow(["SMCQ", sampleClass, "Physics", "Thermodynamics", "HARD", 5, "Consider a heat engine...", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Explanation for stem", "", "What is efficiency?", 1, "0.5", "0.5", "0.3", "0.2", "A", "", "Efficiency formula..."]);
        // Detailed Descriptive Examples
        const descriptiveCommon = {
            class: sampleClass,
            subject: "English 2nd",
            difficulty: "MEDIUM",
            status: "PUBLISHED",
            complexity: "CONCEPTUAL"
        };

        // 1. Matching
        templateSheet.addRow({
            type: "DESCRIPTIVE",
            ...descriptiveCommon,
            topic: "Matching",
            marks: 5,
            text: "Match the parts of sentences from Column A and Column B.",
            explanation: "Model matching answer demonstrating Left:Right syntax.",
            D1_SubType: "matching",
            D1_Label: "A",
            D1_Marks: 5,
            D1_Instructions: "Match the following items.",
            D1_Questions: "Row 1:Val 1|Row 2:Val 2|Row 3:Val 3",
            D1_Answers: "Row 1:Val 1|Row 2:Val 2|Row 3:Val 3"
        });

        // 2. Fill in the gaps (Cloze Test)
        templateSheet.addRow({
            type: "DESCRIPTIVE",
            ...descriptiveCommon,
            topic: "Fill in the gaps",
            marks: 5,
            text: "Read the following passage and fill in the blanks with suitable words.",
            explanation: "Model gap-fill answer demonstrating triple underscore syntax.",
            D1_SubType: "fill_in",
            D1_Label: "B",
            D1_Marks: 5,
            D1_Instructions: "Use words from the box if necessary.",
            D1_WordBox: "honest|hardworking|sincere|truth",
            D1_Passage: "A man is known by the ___ he keeps. One should be ___ in life.",
            D1_Answers: "company|honest"
        });

        // 3. Short Answer (New)
        templateSheet.addRow({
            type: "DESCRIPTIVE",
            ...descriptiveCommon,
            topic: "Short Questions",
            marks: 10,
            text: "Answer the following questions in one or two sentences.",
            explanation: "Model short answer demonstrating piped questions and model answers.",
            D1_SubType: "short_answer",
            D1_Label: "C",
            D1_Marks: 10,
            D1_Instructions: "Write concise answers.",
            D1_Questions: "What is the capital of Bangladesh?|Name the national fruit.",
            D1_Answers: "Dhaka|Jackfruit"
        });

        // 4. Error Correction (New)
        templateSheet.addRow({
            type: "DESCRIPTIVE",
            ...descriptiveCommon,
            topic: "Error Correction",
            marks: 10,
            text: "The following sentences contain grammatical errors. Correct them.",
            explanation: "Model error correction demonstrating piped sentences and corrections.",
            D1_SubType: "error_correction",
            D1_Label: "D",
            D1_Marks: 10,
            D1_Instructions: "Underline the change.",
            D1_Questions: "She don't like apples.|He are a good boy.",
            D1_Answers: "She doesn't like apples.|He is a good boy."
        });

        // 5. Rearranging
        templateSheet.addRow({
            type: "DESCRIPTIVE",
            ...descriptiveCommon,
            topic: "Rearranging",
            marks: 10,
            text: "The following sentences are in jumbled order. Rearrange them.",
            D1_SubType: "rearranging",
            D1_Label: "E",
            D1_Marks: 10,
            D1_Instructions: "Put the numbers in correct order.",
            D1_Questions: "Once there was a king.|He had a beautiful daughter.|Her name was Lily.",
            D1_Answers: "1,2,3"
        });

        // Freeze top row
        templateSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="question_upload_template.xlsx"',
            },
        });
    } catch (error) {
        console.error("Error creating sample template:", error);
        return NextResponse.json({ error: "Failed to generate sample template" }, { status: 500 });
    }
}
