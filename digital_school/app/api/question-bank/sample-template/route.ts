import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        // Define the headers based on the schema and requirements
        const headers = [
            "Type (MCQ/CQ/SQ)",
            "Class Name",
            "Subject",
            "Topic",
            "Difficulty (EASY/MEDIUM/HARD)",
            "Marks",
            "Question Text",
            "Option A",
            "Option B",
            "Option C",
            "Option D",
            "Correct Option (A/B/C/D)",
            "Explanation",
            "Model Answer",
            "Sub-Question 1 Text",
            "Sub-Question 1 Marks",
            "Sub-Question 2 Text",
            "Sub-Question 2 Marks"
        ];

        // Create some sample data rows
        const data = [
            [
                "MCQ",
                "Class 10 - Science",
                "Physics",
                "Motion",
                "EASY",
                1,
                "What is the unit of velocity?",
                "m/s",
                "m/s^2",
                "N",
                "J",
                "A",
                "Velocity is displacement over time.",
                "",
                "",
                "",
                "",
                ""
            ],
            [
                "SQ",
                "Class 9 - Biology",
                "Biology",
                "Cell",
                "MEDIUM",
                3,
                "Define Mitochondria.",
                "",
                "",
                "",
                "",
                "",
                "",
                "Mitochondria is the powerhouse of the cell.",
                "",
                "",
                "",
                ""
            ],
            [
                "CQ",
                "Class 10 - Math",
                "Math",
                "Algebra",
                "HARD",
                10,
                "Solve the following equations.",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "Solve for x: 2x + 5 = 15",
                2,
                "Solve for y: 3y - 2 = 10",
                3
            ]
        ];

        // Combine headers and data
        const worksheetData = [headers, ...data];

        // Create a worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths for better readability
        const wscols = headers.map(h => ({ wch: h.length + 5 }));
        worksheet['!cols'] = wscols;

        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Return the response with proper headers for file download
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
