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
            ["MCQ / MC", "Fill 'Question Text', 'Option A-E', and 'Correct Option' (Single letter for MCQ, comma-separated letters for MC like 'A, C'). Use 'Teacher Note / Explanation' for general notes."],
            ["INT (Integer)", "Fill 'Question Text' and 'Correct Answer' (numeric value)."],
            ["AR (Assertion-Reason)", "Fill 'Assertion', 'Reason', and 'Correct Option' (1-4 or 1-5)."],
            ["MTF (Match Following)", "Fill 'Left 1-5', 'Right A-E', and 'Matches' (e.g., '1-A, 2-B')."],
            ["CQ (Creative)", "Fill 'Question Text' (passage), 'Sub-Question' fields, and 'Sub-Question Explanation' for each part."],
            ["SMCQ (Scenario MCQ)", "Fill 'Question Text' (stem), 'Sub-Question' fields 1-5 including 'Option A-D' and 'Correct Option' for each part."],
            ["SQ (Short Question)", "Fill 'Question Text' and 'Model Answer'."],
            ["DESCRIPTIVE", "Flexible format. Use 'Sub 1 Text', 'Sub 1 Type', etc. Use 'Sub 1 Explanation' for per-part notes."],
            ["Sub-Type Delimiters:", "Use '|' to separate items. For matching/mtf, use '|' for columns and '-' for mapping (e.g. 1-A). For labels: 'Text:x:y|Text:x:y'."],
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
            { header: "Sub-Question 1 Text", key: "sq1Text", width: 25 },
            { header: "Sub-Question 1 Marks", key: "sq1Marks", width: 12 },
            { header: "Sub-Question 1 Option A", key: "sq1A", width: 15 },
            { header: "Sub-Question 1 Option B", key: "sq1B", width: 15 },
            { header: "Sub-Question 1 Option C", key: "sq1C", width: 15 },
            { header: "Sub-Question 1 Option D", key: "sq1D", width: 15 },
            { header: "Sub-Question 1 Correct Option", key: "sq1Correct", width: 15 },
            { header: "Sub-Question 1 Model Answer", key: "sq1ModelAnswer", width: 25 },
            { header: "Sub-Question 1 Explanation", key: "sq1Explanation", width: 25 },

            { header: "Sub-Question 2 Text", key: "sq2Text", width: 25 },
            { header: "Sub-Question 2 Marks", key: "sq2Marks", width: 12 },
            { header: "Sub-Question 2 Option A", key: "sq2A", width: 15 },
            { header: "Sub-Question 2 Option B", key: "sq2B", width: 15 },
            { header: "Sub-Question 2 Option C", key: "sq2C", width: 15 },
            { header: "Sub-Question 2 Option D", key: "sq2D", width: 15 },
            { header: "Sub-Question 2 Correct Option", key: "sq2Correct", width: 15 },
            { header: "Sub-Question 2 Model Answer", key: "sq2ModelAnswer", width: 25 },
            { header: "Sub-Question 2 Explanation", key: "sq2Explanation", width: 25 },

            { header: "Sub-Question 3 Text", key: "sq3Text", width: 25 },
            { header: "Sub-Question 3 Marks", key: "sq3Marks", width: 12 },
            { header: "Sub-Question 3 Option A", key: "sq3A", width: 15 },
            { header: "Sub-Question 3 Option B", key: "sq3B", width: 15 },
            { header: "Sub-Question 3 Option C", key: "sq3C", width: 15 },
            { header: "Sub-Question 3 Option D", key: "sq3D", width: 15 },
            { header: "Sub-Question 3 Correct Option", key: "sq3Correct", width: 15 },
            { header: "Sub-Question 3 Model Answer", key: "sq3ModelAnswer", width: 25 },
            { header: "Sub-Question 3 Explanation", key: "sq3Explanation", width: 25 },

            { header: "Sub-Question 4 Text", key: "sq4Text", width: 25 },
            { header: "Sub-Question 4 Marks", key: "sq4Marks", width: 12 },
            { header: "Sub-Question 4 Option A", key: "sq4A", width: 15 },
            { header: "Sub-Question 4 Option B", key: "sq4B", width: 15 },
            { header: "Sub-Question 4 Option C", key: "sq4C", width: 15 },
            { header: "Sub-Question 4 Option D", key: "sq4D", width: 15 },
            { header: "Sub-Question 4 Correct Option", key: "sq4Correct", width: 15 },
            { header: "Sub-Question 4 Model Answer", key: "sq4ModelAnswer", width: 25 },
            { header: "Sub-Question 4 Explanation", key: "sq4Explanation", width: 25 },

            { header: "Sub-Question 5 Text", key: "sq5Text", width: 25 },
            { header: "Sub-Question 5 Marks", key: "sq5Marks", width: 12 },
            { header: "Sub-Question 5 Option A", key: "sq5A", width: 15 },
            { header: "Sub-Question 5 Option B", key: "sq5B", width: 15 },
            { header: "Sub-Question 5 Option C", key: "sq5C", width: 15 },
            { header: "Sub-Question 5 Option D", key: "sq5D", width: 15 },
            { header: "Sub-Question 5 Correct Option", key: "sq5Correct", width: 15 },
            { header: "Sub-Question 5 Model Answer", key: "sq5ModelAnswer", width: 25 },
            { header: "Sub-Question 5 Explanation", key: "sq5Explanation", width: 25 },
            // Descriptive Dynamic Sub-fields (Prefixes used in loop below)
            { header: "Sub 1 Explanation", key: "s1Explanation", width: 20 },
            { header: "Sub 2 Explanation", key: "s2Explanation", width: 20 },
            { header: "Sub 3 Explanation", key: "s3Explanation", width: 20 },
            { header: "Sub 4 Explanation", key: "s4Explanation", width: 20 },
        ];
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
        templateSheet.addRow(["DESCRIPTIVE", sampleClass, "Bangla 2nd", "Grammar", "MEDIUM", 10, "Writing & Grammar Part", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Various sub-parts..."]);

        // Detailed Descriptive samples are usually easier via JSON, but we can add more specific columns if we expand the template.
        // For now, these rows demonstrate the type exists.

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
