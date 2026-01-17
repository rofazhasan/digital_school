import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const workbook = XLSX.utils.book_new();

        // 1. INSTRUCTIONS SHEET
        const instructionsData = [
            ["Digital School - Bulk Question Upload Instructions"],
            [""],
            ["Step 1", "Download this template and filling it with your questions."],
            ["Step 2", "Do not change the header names in the 'Template' sheet."],
            ["Step 3", "Consult the 'Valid Classes Reference' sheet for exact Class Names."],
            ["Step 4", "Select values from dropdowns where available (Type, Difficulty, etc.)."],
            ["Step 5", "Save and upload this file."],
            [""],
            ["Column Guide:"],
            ["Type", "MCQ (Multiple Choice), CQ (Creative), SQ (Short Question)"],
            ["Class Name", "Must EXACTLY match a class in the system (see Reference sheet)."],
            ["Subject", "e.g., Physics, Math, English"],
            ["Difficulty", "EASY, MEDIUM, or HARD"],
            ["Options", "Required for MCQ. Leave empty for CQ/SQ."],
            ["Correct Option", "A, B, C, or D (MCQ only)."],
            ["Sub-Question X", "Required for CQ. Format: Text in one col, Marks in next."]
        ];
        const instructionSheet = XLSX.utils.aoa_to_sheet(instructionsData);
        instructionSheet['!cols'] = [{ wch: 20 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

        // 2. TEMPLATE SHEET
        // Fetch valid classes from the database
        const classes = await prisma.class.findMany({
            select: { name: true, section: true },
            take: 3
        });

        const getClassString = (index: number) => {
            if (classes[index]) {
                const c = classes[index];
                return c.section ? `${c.name} - ${c.section}` : c.name;
            }
            return "Class 10 - Section A";
        };

        const headers = [
            "Type (MCQ/CQ/SQ)", "Class Name", "Subject", "Topic", "Difficulty (EASY/MEDIUM/HARD)", "Marks", "Question Text",
            "Option A", "Option B", "Option C", "Option D", "Correct Option (A/B/C/D)", "Explanation", "Model Answer",
            "Sub-Question 1 Text", "Sub-Question 1 Marks", "Sub-Question 2 Text", "Sub-Question 2 Marks"
        ];

        const sampleData = [
            ["MCQ", getClassString(0), "Physics", "Motion", "EASY", 1, "Unit of velocity?", "m/s", "m/s^2", "N", "J", "A", "Displacement/Time", "", "", "", "", ""],
            ["SQ", getClassString(1), "Biology", "Cell", "MEDIUM", 3, "Define Mitochondria.", "", "", "", "", "", "", "Powerhouse of cell", "", "", "", ""],
            ["CQ", getClassString(0), "Math", "Algebra", "HARD", 10, "Solve equations.", "", "", "", "", "", "", "", "2x+5=15", 2, "3y-2=10", 3]
        ];

        const worksheetData = [headers, ...sampleData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Column Widths
        worksheet['!cols'] = headers.map(h => ({ wch: h.length + 5 }));

        // Data Validation (Note: SheetJS Basic implementation often limits writing validation, 
        // but we assume standard structure here attempt specific cell ranges)
        // Range for 100 rows
        const rows = 100;

        // Helper to add validation
        const addValidation = (colIndex: number, options: string[]) => {
            const letter = XLSX.utils.encode_col(colIndex);
            for (let r = 1; r < rows; r++) { // Start from row 1 (after header)
                const cellRef = `${letter}${r + 1}`;
                if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' }; // Ensure cell exists
                // Note: SheetJS Community edition doesn't fully support writing DataValidation metadata 
                // to the file. This might be ignored by some writers but it's the standard internal rep.
                // For fully working dropdowns, we rely on the user following instructions usually.
            }
        };

        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        // 3. REFERENCE SHEET
        const allClasses = await prisma.class.findMany({ select: { name: true, section: true } });
        const referenceData = [
            ["Valid Class Names (Copy these exactly)"],
            ...allClasses.map((c: any) => [c.section ? `${c.name} - ${c.section}` : c.name])
        ];
        const refWorksheet = XLSX.utils.aoa_to_sheet(referenceData);
        refWorksheet['!cols'] = [{ wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, refWorksheet, "Valid Classes Reference");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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
