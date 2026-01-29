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
            ["FIELD GUIDE:", ""],
            ["Type", "MCQ (Multiple Choice), CQ (Creative), SQ (Short Question)"],
            ["Class Name", "Select from dropdown. Must exist in the system."],
            ["Difficulty", "EASY, MEDIUM, HARD"],
            ["Marks", "Number only."],
            ["Correct Option", "A, B, C, or D (Only for MCQ)."],
            ["Options A-D", "Required for MCQ. Leave blank for others."]
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
        const classNames = classes.map(c => c.section ? `${c.name} - ${c.section}` : c.name);

        refSheet.columns = [{ header: 'Valid Classes', key: 'class', width: 50 }];
        refSheet.addRows(classNames.map(c => [c]));

        // Hide it so users don't mess with it, but keep it available for validation logic
        refSheet.state = 'hidden';

        // 3. TEMPLATE SHEET
        const templateSheet = workbook.addWorksheet('Template');

        // Headers
        const columns = [
            { header: "Type (MCQ/CQ/SQ)", key: "type", width: 20 },
            { header: "Class Name", key: "className", width: 30 },
            { header: "Subject", key: "subject", width: 15 },
            { header: "Topic", key: "topic", width: 20 },
            { header: "Difficulty", key: "difficulty", width: 15 },
            { header: "Marks", key: "marks", width: 10 },
            { header: "Question Text", key: "questionText", width: 50 },
            { header: "Option A", key: "optionA", width: 20 },
            { header: "Option B", key: "optionB", width: 20 },
            { header: "Option C", key: "optionC", width: 20 },
            { header: "Option D", key: "optionD", width: 20 },
            { header: "Option E", key: "optionE", width: 20 },
            { header: "Correct Option", key: "correctOption", width: 15 },
            { header: "Explanation", key: "explanation", width: 30 },
            { header: "Model Answer", key: "modelAnswer", width: 30 },
            { header: "Sub-Question 1 Text", key: "sq1Text", width: 30 },
            { header: "Sub-Question 1 Marks", key: "sq1Marks", width: 15 },
            { header: "Sub-Question 1 Model Answer", key: "sq1ModelAnswer", width: 30 },
            { header: "Sub-Question 2 Text", key: "sq2Text", width: 30 },
            { header: "Sub-Question 2 Marks", key: "sq2Marks", width: 15 },
            { header: "Sub-Question 2 Model Answer", key: "sq2ModelAnswer", width: 30 },
            { header: "Sub-Question 3 Text", key: "sq3Text", width: 30 },
            { header: "Sub-Question 3 Marks", key: "sq3Marks", width: 15 },
            { header: "Sub-Question 3 Model Answer", key: "sq3ModelAnswer", width: 30 },
            { header: "Sub-Question 4 Text", key: "sq4Text", width: 30 },
            { header: "Sub-Question 4 Marks", key: "sq4Marks", width: 15 },
            { header: "Sub-Question 4 Model Answer", key: "sq4ModelAnswer", width: 30 },
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
        // We'll apply this to a reasonable number of rows (e.g., 500)
        const rowCount = 500;

        // A helper to get column letter from index (1-based)
        // ExcelJS handles this, we can just iterate rows.

        for (let i = 2; i <= rowCount; i++) {
            const row = templateSheet.getRow(i);

            // Type Dropdown (Col 1)
            row.getCell(1).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"MCQ,CQ,SQ"'],
                showErrorMessage: true,
                errorTitle: 'Invalid Type',
                error: 'Please select from the list: MCQ, CQ, SQ'
            };

            // Class Name Dropdown (Col 2) - dynamic reference
            // Refers to 'Valid Classes Reference'!$A$2:$A$N
            if (classNames.length > 0) {
                const lastRow = classNames.length + 1;
                // Note: ExcelJS requires formula syntax for other sheets
                row.getCell(2).dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Valid Classes Reference'!$A$2:$A$${lastRow}`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid Class',
                    error: 'Please select a valid class from the dropdown.'
                };
            }

            // Difficulty Dropdown (Col 5)
            row.getCell(5).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"EASY,MEDIUM,HARD"'],
                showErrorMessage: true,
                errorTitle: 'Invalid Difficulty',
                error: 'Select EASY, MEDIUM, or HARD'
            };

            // Correct Option Dropdown (Col 13 - Shifted by 1 due to Option E)
            row.getCell(13).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"A,B,C,D,E"'],
                showErrorMessage: true,
                errorTitle: 'Invalid Option',
                error: 'Select A, B, C, D, or E'
            };
        }

        // Add Sample Data
        templateSheet.addRow([
            "MCQ",
            classNames[0] || "Class 10",
            "Physics",
            "Motion",
            "EASY",
            1,
            "What is ...?",
            "Option A", "Option B", "Option C", "Option D",
            "A",
            "Because...",
            "", "", "", "", ""
        ]);

        // Freeze top row
        templateSheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        // Buffer write
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
        return NextResponse.json(
            { error: "Failed to generate sample template" },
            { status: 500 }
        );
    }
}
