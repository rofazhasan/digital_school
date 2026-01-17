import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Fetch valid classes from the database for the sample data
        const classes = await prisma.class.findMany({
            select: { name: true, section: true },
            take: 3 // Get a few classes for examples
        });

        const getClassString = (index: number) => {
            if (classes[index]) {
                const c = classes[index];
                // Match the format expected by bulk upload: "Name" or "Name - Section"
                return c.section ? `${c.name} - ${c.section}` : c.name;
            }
            return "Example Class - Section A"; // Fallback if no classes exist
        };

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

        // Create some sample data rows with real class names
        const data = [
            [
                "MCQ",
                getClassString(0),
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
                getClassString(1), // Use a different class if available
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
                getClassString(0), // Reuse first class
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

        // Add a second sheet with ALL reference data (e.g. valid Classes)
        const allClasses = await prisma.class.findMany({ select: { name: true, section: true } });
        const referenceData = [
            ["Valid Class Names (Copy exact name to 'Class Name' column)"],
            ...allClasses.map((c: { name: string; section: string | null }) => [c.section ? `${c.name} - ${c.section}` : c.name])
        ];
        const refWorksheet = XLSX.utils.aoa_to_sheet(referenceData);
        refWorksheet['!cols'] = [{ wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, refWorksheet, "Valid Classes Reference");

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
