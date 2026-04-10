import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import prisma from '@/lib/db';

export async function GET(req: any) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('type') || 'all'; // 'objective', 'descriptive', or 'all'

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

        const commonInstructions = [
            ["Step 1", "Download this template and fill it with your questions."],
            ["Step 2", "Do not change the header names in the 'Template' sheet."],
            ["Step 3", "Select values from the dropdowns for Type, Class, Subject, Difficulty, etc."],
            ["Step 4", "For Class Name, you MUST pick from the dropdown (these match your system classes)."],
            ["Step 5", "Save and upload this file back to the system."],
            [""],
            ["FIELD GUIDE:", ""],
            ["Difficulty", "EASY, MEDIUM, HARD"],
            ["Marks", "Number only."],
            ["POETRY / PASSAGE", "For Poem/Passage, use '||' for forced line breaks or type with Newlines (Alt+Enter)."],
        ];

        const objectiveGuide = [
            ["MCQ / MC", "Fill 'Question Text', 'Option A-E', and 'Correct Option' (Single letter for MCQ, comma-separated letters for MC like 'A, C')."],
            ["INT (Integer)", "Fill 'Question Text' and 'Correct Answer' (numeric value)."],
            ["AR (Assertion-Reason)", "Fill 'Assertion', 'Reason', and 'Correct Option' (1-4 or 1-5)."],
            ["MTF (Match Following)", "Fill 'Left 1-5', 'Right A-E', and 'Matches' (e.g., '1-A, 2-B')."],
            ["CQ (Creative)", "Fill 'Question Text' (stem/passage). Use 'Sub X Text', 'Sub X Marks', 'Sub X Model Answer', and 'Sub X Explanation' for parts."],
            ["SMCQ (Scenario MCQ)", "Fill 'Question Text' (stem). Use 'Sub X Text', 'Sub X Marks', 'Sub X Option A-D', and 'Sub X Correct Option' for parts."],
        ];

        const descriptiveGuide = [
            ["Sub X Type", "writing, fill_in, comprehension, matching, rearranging, flowchart, interpreting_graph, label_diagram, true_false, error_correction."],
            ["MATCHING", "Use 'Sub X Questions' for Left Column (pipe | separated) and 'Sub X Answers' for Right Column. Use 'Sub X Matches' for pairing (e.g., 1-A, 2-C)."],
            ["  - 3/4-Way Match", "Use 'Sub X Column C' and 'Sub X Column D' for extra matching layers (pipe | separated). Matches remain IDs like '1-A'."],
            ["FILLING-IN", "Use 'Sub X Clue Type' (word_box, in_text, none). If word_box, use 'Sub X Word Box' (A|B|C). Use 'Sub X Passage' with '___' for gaps. 'Sub X Answers' for keys."],
            ["REARRANGING", "Use 'Sub X Items' for the SHUFFLED list (pipe | separated). Use 'Sub X Correct Order' (or 'Sub X Model Answer') for the correct sequence of texts."],
            ["FLOWCHART", "Use 'Sub X Items' (pipe | separated). The FIRST item is the starting prompt. Use 'Sub X Correct Order' for the full solved path."],
            ["COMPREHENSION", "Use 'Sub X Stem Passage' for the context. 'Sub X Questions' and 'Sub X Answers' for Q&A parts. OR used Option A-D for Passage MCQ."],
            ["GRAPHS", "Use 'Sub X Chart Type' (bar, line, pie, etc.), 'Sub X Chart Labels' (pipe |), 'Sub X Chart Data' (pipe | numbers), and Axis labels."],
            ["DIAGRAMS", "Use 'Sub X Label' for the object name. Labels in 'Sub X Labels' using 'Text:x:y' format."],
            ["IMAGES", "Use 'Primary Image URL' for the main question or 'Sub X Image URL' for specific parts (e.g., a diagram to be labeled)."],
            ["TIPS", "Always use Pipe symbol (|) to separate items in a list. Use 'Sub X Text' for the sub-question prompt (e.g., 'Analyze the graph')."],
        ];

        const instructions = mode === 'objective' 
            ? [...commonInstructions, ...objectiveGuide] 
            : mode === 'descriptive' 
                ? [...commonInstructions, ...descriptiveGuide] 
                : [...commonInstructions, ...objectiveGuide, ...descriptiveGuide];

        instructions.forEach(row => infoSheet.addRow(row));

        // Style the instructions
        infoSheet.getRow(1).font = { bold: true, size: 14 };
        infoSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.getCell(1).font = { bold: true };
                row.alignment = { vertical: 'middle', wrapText: true };
            }
        });

        // 2. REFERENCE SHEET
        const refSheet = workbook.addWorksheet('Valid Classes Reference');
        const classes = await prisma.class.findMany({ select: { name: true, section: true } });
        const classNames = classes.map((c: any) => c.section ? `${c.name} - ${c.section}` : c.name);
        refSheet.columns = [{ header: 'Valid Classes', key: 'class', width: 50 }];
        refSheet.addRows(classNames.map((c: string) => [c]));
        refSheet.state = 'hidden';

        // 3. TEMPLATE SHEET
        const templateSheet = workbook.addWorksheet('Template');

        // Headers Base
        const baseColumns = [
            { header: "Type", key: "type", width: 10 },
            { header: "Class Name", key: "className", width: 25 },
            { header: "Subject", key: "subject", width: 15 },
            { header: "Topic", key: "topic", width: 20 },
            { header: "Difficulty", key: "difficulty", width: 12 },
            { header: "Marks", key: "marks", width: 8 },
            { header: "Question Text", key: "questionText", width: 40 },
            { header: "Primary Image URL", key: "primaryImage", width: 25 },
            { header: "Teacher Note / Explanation", key: "explanation", width: 30 },
            { header: "Model Answer", key: "modelAnswer", width: 20 },
        ];

        const objectiveColumns = [
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
        ];

        // ADD CQ/SMCQ columns to Objective template for full coverage
        const commonSubCols: any[] = [];
        for (let i = 1; i <= 10; i++) {
            const prefix = `Sub ${i}`;
            const keyPrefix = `objSub${i}`;
            commonSubCols.push(
                { header: `${prefix} Text`, key: `${keyPrefix}Text`, width: 25 },
                { header: `${prefix} Marks`, key: `${keyPrefix}Marks`, width: 10 },
                { header: `${prefix} Model Answer`, key: `${keyPrefix}ModelAnswer`, width: 25 },
                { header: `${prefix} Explanation`, key: `${keyPrefix}Explanation`, width: 25 },
                { header: `${prefix} Option A`, key: `${keyPrefix}A`, width: 15 },
                { header: `${prefix} Option B`, key: `${keyPrefix}B`, width: 15 },
                { header: `${prefix} Option C`, key: `${keyPrefix}C`, width: 15 },
                { header: `${prefix} Option D`, key: `${keyPrefix}D`, width: 15 },
                { header: `${prefix} Correct Option`, key: `${keyPrefix}Correct`, width: 15 }
            );
        }

        const descriptiveColumns: any[] = [];
        for (let i = 1; i <= 10; i++) {
            const prefix = `Sub ${i}`;
            const keyPrefix = `s${i}`;
            descriptiveColumns.push(
                { header: `${prefix} Text`, key: `${keyPrefix}Text`, width: 25 },
                { header: `${prefix} Type`, key: `${keyPrefix}Type`, width: 15 },
                { header: `${prefix} Marks`, key: `${keyPrefix}Marks`, width: 10 },
                { header: `${prefix} Label`, key: `${keyPrefix}Label`, width: 15 },
                { header: `${prefix} Instructions`, key: `${keyPrefix}Instructions`, width: 25 },
                { header: `${prefix} Model Answer`, key: `${keyPrefix}ModelAnswer`, width: 25 },
                { header: `${prefix} Explanation`, key: `${keyPrefix}Explanation`, width: 25 },
                { header: `${prefix} Clue Type`, key: `${keyPrefix}ClueType`, width: 15 },
                { header: `${prefix} Word Box`, key: `${keyPrefix}WordBox`, width: 25 },
                { header: `${prefix} Passage`, key: `${keyPrefix}Passage`, width: 40 },
                { header: `${prefix} Column C`, key: `${keyPrefix}ColC`, width: 15 },
                { header: `${prefix} Column D`, key: `${keyPrefix}ColD`, width: 15 },
                { header: `${prefix} Items`, key: `${keyPrefix}Items`, width: 25 },
                { header: `${prefix} Correct Order`, key: `${keyPrefix}Order`, width: 25 },
                { header: `${prefix} Stem Passage`, key: `${keyPrefix}Stem`, width: 40 },
                { header: `${prefix} Questions`, key: `${keyPrefix}Questions`, width: 30 },
                { header: `${prefix} Answers`, key: `${keyPrefix}Answers`, width: 30 },
                { header: `${prefix} Image URL`, key: `${keyPrefix}Img`, width: 25 },
                { header: `${prefix} Matches`, key: `${keyPrefix}Matches`, width: 25 },
                { header: `${prefix} Option A`, key: `${keyPrefix}A`, width: 15 },
                { header: `${prefix} Option B`, key: `${keyPrefix}B`, width: 15 },
                { header: `${prefix} Option C`, key: `${keyPrefix}C`, width: 15 },
                { header: `${prefix} Option D`, key: `${keyPrefix}D`, width: 15 },
                { header: `${prefix} Correct Option`, key: `${keyPrefix}Correct`, width: 15 },
                { header: `${prefix} Chart Type`, key: `${keyPrefix}ChartType`, width: 12 },
                { header: `${prefix} Chart Labels`, key: `${keyPrefix}ChartLabels`, width: 25 },
                { header: `${prefix} Chart Data`, key: `${keyPrefix}ChartData`, width: 20 },
                { header: `${prefix} X-Axis Label`, key: `${keyPrefix}XLabel`, width: 15 },
                { header: `${prefix} Y-Axis Label`, key: `${keyPrefix}YLabel`, width: 15 }
            );
        }

        let finalColumns = [...baseColumns];
        if (mode === 'objective') {
            finalColumns.push(...objectiveColumns, ...commonSubCols);
        } else if (mode === 'descriptive') {
            finalColumns.push(...descriptiveColumns);
        } else {
            finalColumns.push(...objectiveColumns, ...commonSubCols, ...descriptiveColumns);
        }
        
        templateSheet.columns = finalColumns;

        // Header Styling
        const headerRow = templateSheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        headerRow.alignment = { horizontal: 'center' };

        // DATA VALIDATION
        const rowCount = 200;
        const sampleClass = classNames[0] || "Class 10";

        for (let i = 2; i <= rowCount; i++) {
            const row = templateSheet.getRow(i);
            row.getCell(1).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${mode === 'objective' ? 'MCQ,MC,INT,AR,MTF,CQ,SQ,SMCQ' : mode === 'descriptive' ? 'DESCRIPTIVE' : 'MCQ,MC,INT,AR,MTF,CQ,SQ,SMCQ,DESCRIPTIVE'}"`],
            };
            if (classNames.length > 0) {
                row.getCell(2).dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Valid Classes Reference'!$A$2:$A$${classNames.length + 1}`],
                };
            }
            row.getCell(5).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"EASY,MEDIUM,HARD"'],
            };
        }

        // Add Samples based on mode
        if (mode === 'objective' || mode === 'all') {
            templateSheet.addRow({
                type: "MCQ", className: sampleClass, subject: "Physics", topic: "Light", difficulty: "EASY", marks: 1,
                questionText: "What is the speed of light?", optionA: "3e8 m/s", optionB: "2e8 m/s", optionC: "1e8 m/s",
                correctOption: "A", explanation: "Speed of light in vacuum is approx 300,000 km/s."
            });
            templateSheet.addRow({
                type: "MTF", className: sampleClass, subject: "GK", topic: "Capitals", difficulty: "MEDIUM", marks: 5,
                questionText: "Match capitals:", l1: "France", l2: "Japan", ra: "Tokyo", rb: "Paris",
                matches: "1-B, 2-A"
            });
            // SAMPLE CQ
            templateSheet.addRow({
                type: "CQ", className: sampleClass, subject: "English", topic: "Grammar", difficulty: "MEDIUM", marks: 10,
                questionText: "Complete the following parts based on the context of 'Environment'.",
                objSub1Text: "Define Global Warming.", objSub1Marks: 2, objSub1ModelAnswer: "The rise in Earth's temperature.",
                objSub2Text: "Explain how plastic pollution affects oceans.", objSub2Marks: 3, objSub2ModelAnswer: "Harmful to marine life."
            });
            // SAMPLE SMCQ
            templateSheet.addRow({
                type: "SMCQ", className: sampleClass, subject: "Biology", topic: "Cells", difficulty: "MEDIUM", marks: 4,
                questionText: "Read the stem: A plant cell is different from an animal cell.",
                objSub1Text: "Which organelle is present only in plants?", objSub1Marks: 1, 
                objSub1A: "Chloroplast", objSub1B: "Mitochondria", objSub1C: "Ribosome", objSub1D: "Nucleus", 
                objSub1Correct: "A"
            });
        }

        if (mode === 'descriptive' || mode === 'all') {
            templateSheet.addRow({
                type: "DESCRIPTIVE",
                className: sampleClass,
                subject: "English",
                topic: "Comprehension",
                difficulty: "MEDIUM",
                marks: 10,
                questionText: "Read the passage and answer.",
                s1Text: "Passage Analysis",
                s1Type: "comprehension",
                s1Marks: 5,
                s1Stem: "21st February is a historical day for Bangladesh...",
                s1Questions: "What happened on this day?|Why is it important?",
                s1Answers: "Language movement|National identity"
            });
            templateSheet.addRow({
                type: "DESCRIPTIVE",
                className: sampleClass,
                subject: "English",
                topic: "Grammar",
                difficulty: "MEDIUM",
                marks: 5,
                questionText: "Fill in the blanks.",
                s1Text: "Article usage",
                s1Type: "fill_in",
                s1Marks: 5,
                s1ClueType: "word_box",
                s1WordBox: "a|an|the|none",
                s1Passage: "He is ___ honest man. ___ sun rises in the east.",
                s1Answers: "an|The"
            });
            templateSheet.addRow({
                type: "DESCRIPTIVE",
                className: sampleClass,
                subject: "Economics",
                topic: "Price Index",
                difficulty: "HARD",
                marks: 5,
                questionText: "Analyze the price trend.",
                s1Type: "interpreting_graph",
                s1Marks: 5,
                s1ChartType: "line",
                s1ChartLabels: "2020|2021|2022|2023",
                s1ChartData: "100|105|112|120",
                s1XLabel: "Year",
                s1YLabel: "Index",
                s1Explanation: "Graph shows steady inflation."
            });
            templateSheet.addRow({
                type: "DESCRIPTIVE", className: sampleClass, subject: "Biology", topic: "Plants", difficulty: "HARD", marks: 10,
                questionText: "Complete the Matching and Rearranging tasks.",
                s1Type: "matching", s1Text: "Match the Country to Capital and Currency.",
                s1Questions: "Bangladesh|USA|Japan", s1Answers: "Dhaka|Washington|Tokyo", s1ColC: "Taka|Dollar|Yen",
                s1Matches: "1-A, 2-B, 3-C",
                s2Type: "rearranging", s2Text: "Arrange the plant growth stages.",
                s2Items: "Sprout|Seed|Tree|Fruit", s2Order: "Seed|Sprout|Tree|Fruit"
            });
            templateSheet.addRow({
                type: "DESCRIPTIVE", className: sampleClass, subject: "ICT", topic: "Flowchart", difficulty: "MEDIUM", marks: 5,
                questionText: "Review the program logic.",
                s1Type: "flowchart", s1Text: "Find the largest of 3 numbers.",
                s1Items: "Start|Read A,B,C|Is A > B?|Is A > C?|Print A|Stop",
                s1Order: "Start|Read A,B,C|Is A > B?|Is A > C?|Print A|Stop"
            });
        }

        templateSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="question_template_${mode}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error creating sample template:", error);
        return NextResponse.json({ error: "Failed to generate sample template" }, { status: 500 });
    }
}

