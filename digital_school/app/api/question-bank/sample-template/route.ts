import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import prisma from '@/lib/db';

export async function GET(req: any) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('type') || 'all'; // 'objective', 'descriptive', 'coding', or 'all'

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Digital School';
        workbook.created = new Date();

        // 1. INSTRUCTIONS SHEET
        const infoSheet = workbook.addWorksheet('Instructions', {
            views: [{ showGridLines: false }]
        });

        infoSheet.columns = [
            { header: 'Step', key: 'step', width: 22 },
            { header: 'Instruction', key: 'instruction', width: 85 }
        ];

        const commonInstructions = [
            ["Step 1", "Download this template and fill it with your questions."],
            ["Step 2", "Do not change the header names in the 'Template' or 'Coding' sheets."],
            ["Step 3", "Select values from the dropdowns for Type, Class, Subject, Difficulty, etc."],
            ["Step 4", "For Class Name, you MUST pick from the dropdown (these match your system classes)."],
            ["Step 5", "Save and upload this file back to the system."],
            [""],
            ["CRITICAL ANSWER FIELD GUIDE", "MUST READ: MODEL ANSWER VS EXPLANATION"],
            ["Model Answer", "OFFICIAL ANSWER KEY: Required for INT (numeric answer, e.g., '42') and SQ (expected solution text). Also used for Sub X Model Answer in CQ, Descriptive & Coding. This is rendered as the correct answer in exams, result sheets, evaluations, and printed answer keys."],
            ["Teacher Note / Explanation", "EXPLANATION & RATIONALE: Optional step-by-step reasoning or teacher notes explaining WHY the answer is correct. Used for MCQ, MC, AR, MTF, or as extra solution steps for INT/SQ/Coding."],
            [""],
            ["FIELD GUIDE:", ""],
            ["Difficulty", "EASY, MEDIUM, HARD"],
            ["Marks", "Number only."],
            ["POETRY / PASSAGE", "For Poem/Passage, use '||' for forced line breaks or type with Newlines (Alt+Enter)."],
        ];

        // SPECIAL ENCRYPTION INSTRUCTIONS (For all 3 templates: Objective, Descriptive, and Coding)
        const encryptionGuide = [
            ["", ""],
            ["🔒 AI & QUESTION MAKER ENCRYPTION GUIDE", "CRITICAL SPECIFICATION FOR SECURE QUESTION CREATION"],
            ["Purpose", "Allows AI agents, superadmins, or question authors to encrypt sensitive questions with AES-256-GCM / RSA modern encryption before upload. Content stays completely private until exam commencement."],
            ["Format", "Encrypted fields or entire question rows must be prefixed with 'ENC:' followed by the base64-encoded JSON payload (e.g., 'ENC:eyJhbGciOiJBRVMtMjU2LUdDTSIsIml2Ijoi...')."],
            ["In-App Encryption Tool", "You can also encrypt questions in one click using the built-in 'Encrypt Payload' utility inside the Bulk Upload Dialog or by calling the API endpoint POST /api/questions/encrypt with { data: '...' }."],
            ["Decryption & Integrity", "Only this application possesses the authorized secret keys to decrypt the questions. When uploaded, the app automatically decrypts and verifies the payload seamlessly!"]
        ];

        const objectiveGuide = [
            ["MCQ / MC", "Fill 'Question Text', 'Option A-E', and 'Correct Option' (Single letter for MCQ e.g., 'A', comma-separated letters for MC like 'A, C'). Explanation is optional."],
            ["INT (Integer)", "Fill 'Question Text' and 'Model Answer' (or 'Correct Answer') with the numeric value (e.g., 5 or 42). Use 'Teacher Note / Explanation' ONLY for solution steps."],
            ["SQ (Short Question)", "Fill 'Question Text' and 'Model Answer' with the expected answer text. Use 'Teacher Note / Explanation' ONLY for optional teacher notes."],
            ["AR (Assertion-Reason)", "Fill 'Assertion', 'Reason', and 'Correct Option' (1-5). Explanation is optional teacher rationale."],
            ["MTF (Match Following)", "Fill 'Left 1-5', 'Right A-E', and 'Matches' (e.g., '1-A, 2-B'). Explanation is optional."],
            ["CQ (Creative)", "Fill 'Question Text' (stem/passage). Use 'Sub X Text', 'Sub X Marks', 'Sub X Model Answer' (for part answer), and 'Sub X Explanation' (for part rationale)."],
            ["SMCQ (Scenario MCQ)", "Fill 'Question Text' (stem). Use 'Sub X Text', 'Sub X Marks', 'Sub X Option A-D', and 'Sub X Correct Option' for parts."],
            ["", ""],
            ["ADVANCED OBJECTIVE TYPES INSTRUCTION GUIDE (AI & HUMAN COMPATIBLE)", "CRITICAL SPECIFICATIONS FOR CMA AND MPC"],
            ["CMA (Constructed Multi-Answer)", "1. Set Type = 'CMA'. 2. Fill 'Question Text' (problem description). 3. For each sub-part (Sub 1, Sub 2, etc.): Fill 'Sub X Text' (field label/prompt e.g., 'Velocity (m/s)'), 'Sub X Marks' (part marks), and 'Sub X Model Answer' (exact key e.g., '20' or '2*v0*sin(theta)/g'). 4. Optional: 'Sub X Type' (integer, decimal, expression, fraction, text; default is decimal), 'Sub X Tolerance' (e.g., 0.05), 'Sub X Unit' (e.g., 'm/s')."],
            ["MPC (Multi-Step Problem Chain)", "1. Set Type = 'MPC'. 2. Fill 'Question Text' (scenario stem). 3. For each stage (Sub 1, Sub 2, etc.): Fill 'Sub X Text' (stage title e.g., 'Stage 1: Calculate acceleration'), 'Sub X Marks', and 'Sub X Model Answer' (stage key e.g., '10'). 4. Optional Error Propagation (EPH): 'Sub X Depends On' (e.g., 's1' or '1') and 'Sub X Formula' (dynamic target formula e.g., '0.5 * 1200 * (prev * 8)^2'). If Stage 1 is wrong, Stage 2 evaluates methodology dynamically via this formula so students aren't double-penalized!"],
            ["AI QUESTION GENERATION NOTE", "When generating questions via AI or scripts: Always output Type as 'MCQ', 'MC', 'INT', 'AR', 'MTF', 'CQ', 'SQ', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC', or 'CODING'."],
        ];

        const descriptiveGuide = [
            ["Sub X Type", "writing, fill_in, comprehension, comprehension_mcq, matching, rearranging, flowchart, interpreting_graph, label_diagram, true_false, error_correction, short_answer."],
            ["Sub X Model Answer", "Fill the model answer / answer key for this sub-question part."],
            ["Sub X Explanation", "Optional teacher note or step-by-step explanation for this sub-question part."],
            ["MATCHING (Simple)", "Use 'Sub X Questions' for Left (A|B|C) and 'Sub X Answers' for Right. 'Sub X Matches' for pairing (e.g., 1-A, 2-B)."],
            ["MATCHING (3/4-Way)", "Use 'Sub X Column C' (I|II|III) and 'Sub X Column D' (i|ii|iii). 'Sub X Matches' must include all parts (e.g., 1-A-I or 1-A-I-i)."],
            ["FILLING-IN", "Use 'Sub X Clue Type' (word_box, in_text, none). If word_box, use 'Sub X Word Box' (A|B|C). 'Sub X Passage' should use '___' for gaps. 'Sub X Answers' for keys."],
            ["REARRANGING / FLOW", "Use 'Sub X Items' for the shuffled list (A|B|C). Use 'Sub X Correct Order' for the full string of items in correct sequence (e.g., Seed|Sprout|Tree)."],
            ["COMPREHENSION (Q&A)", "Use 'Sub X Stem Passage' for context. 'Sub X Questions' and 'Sub X Answers' for short questions."],
            ["COMPREHENSION (MCQ)", "For Passage MCQs: Use 'Sub X Stem Passage' for context. Use 'Sub X Questions' and 'Option A-D' to list questions and options. Use 'Sub X Correct Option' for keys. To add MULTIPLE MCQs under one passage, use Pipe symbol (|) in all MCQ columns."],
            ["GRAPHS", "Use 'Sub X Chart Type' (bar, line, pie). 'Sub X Chart Labels' (Jan|Feb|Mar), 'Sub X Chart Data' (100|200|300). Use Axis labels for clarity."],
            ["DIAGRAMS / TF", "For 'label_diagram', use 'Sub X Questions' for label texts. For 'true_false', use 'Sub X Questions' for the list of statements. Answers go in 'Sub X Answers'."],
            ["IMAGES", "Use 'Primary Image URL' for the main question or 'Sub X Image URL' for specific parts."],
            ["IMPORTANT (PIPE |)", "Always use the Pipe symbol (|) to separate items in a list (Options, Answers, Questions, Items) within a single cell."],
        ];

        const codingGuide = [
            ["", ""],
            ["💻 CODING CONTEST & CSE QUESTIONS SPECIFICATIONS", "CRITICAL SPECIFICATIONS FOR CODING TYPE QUESTIONS"],
            ["Question Type", "Set Type = 'CODING'."],
            ["Problem Statement", "Fill 'Question Text' with the problem title and description (supports Markdown & MathJax formulas!)."],
            ["Execution Limits", "Fill 'Constraints' (e.g., '1 <= N <= 10^5') and 'Allowed Languages' (e.g., 'Python, C, C++')."],
            ["Starter Templates", "Optional starter codes: 'Starter Code Python', 'Starter Code C', 'Starter Code CPP'. If blank, standard starter templates will be provided."],
            ["Model Answer / Key", "Provide reference code or solution under 'Model Answer'."],
            ["Auto-Scored Test Cases", "Fill Test 1 through Test 10 with: 'Test X Input', 'Test X Output', 'Test X Hidden (TRUE/FALSE)' and 'Test X Weight' (e.g., 1)."],
            ["Partial Marking", "During the exam, code is executed against these test cases. Students receive proportional marks for passing test cases or full marks if all tests pass!"]
        ];

        let instructions: any[] = [];
        if (mode === 'objective') {
            instructions = [...commonInstructions, ...objectiveGuide, ...encryptionGuide];
        } else if (mode === 'descriptive') {
            instructions = [...commonInstructions, ...descriptiveGuide, ...encryptionGuide];
        } else if (mode === 'coding') {
            instructions = [...commonInstructions, ...codingGuide, ...encryptionGuide];
        } else {
            instructions = [...commonInstructions, ...objectiveGuide, ...descriptiveGuide, ...codingGuide, ...encryptionGuide];
        }

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
        let classes: any[] = [];
        try {
            classes = await prisma.class.findMany({ select: { name: true, section: true } });
        } catch (dbError) {
            console.error("Database error fetching classes for template:", dbError);
        }
        const classNames = classes.map((c: any) => c.section ? `${c.name} - ${c.section}` : c.name);
        refSheet.columns = [{ header: 'Valid Classes', key: 'class', width: 50 }];
        refSheet.addRows(classNames.map((c: string) => [c]));
        refSheet.state = 'hidden';

        const sampleClass = classNames[0] || "Class 10 - A";

        // Helper to setup Coding Sheet
        const setupCodingSheet = (sheet: ExcelJS.Worksheet) => {
            const codingCols = [
                { header: "Type", key: "type", width: 12 },
                { header: "Class Name", key: "className", width: 25 },
                { header: "Subject", key: "subject", width: 18 },
                { header: "Topic", key: "topic", width: 20 },
                { header: "Difficulty", key: "difficulty", width: 12 },
                { header: "Marks", key: "marks", width: 8 },
                { header: "Question Text", key: "questionText", width: 45 },
                { header: "Constraints", key: "constraints", width: 25 },
                { header: "Allowed Languages", key: "allowedLanguages", width: 20 },
                { header: "Starter Code Python", key: "starterPython", width: 30 },
                { header: "Starter Code C", key: "starterC", width: 30 },
                { header: "Starter Code CPP", key: "starterCPP", width: 30 },
                { header: "Model Answer", key: "modelAnswer", width: 35 },
                { header: "Teacher Note / Explanation", key: "explanation", width: 30 },
            ];

            // Add Test Cases 1 through 10
            for (let i = 1; i <= 10; i++) {
                codingCols.push(
                    { header: `Test ${i} Input`, key: `tc${i}Input`, width: 22 },
                    { header: `Test ${i} Output`, key: `tc${i}Output`, width: 22 },
                    { header: `Test ${i} Hidden`, key: `tc${i}Hidden`, width: 15 },
                    { header: `Test ${i} Weight`, key: `tc${i}Weight`, width: 12 },
                    { header: `Test ${i} Explanation`, key: `tc${i}Explanation`, width: 25 }
                );
            }

            sheet.columns = codingCols;

            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Emerald Green
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

            // Add sample coding questions
            sheet.addRow({
                type: "CODING",
                className: sampleClass,
                subject: "Computer Science",
                topic: "Array Operations",
                difficulty: "EASY",
                marks: 10,
                questionText: "Sum of Array Elements\n\nGiven an integer N followed by N space-separated integers, compute and output their sum.",
                constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
                allowedLanguages: "Python, C, C++",
                starterPython: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    print(sum(nums))\nsolve()",
                modelAnswer: "def solve():\n    import sys\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    print(sum(nums))\nsolve()",
                explanation: "Time Complexity: O(N), Space Complexity: O(1)",
                tc1Input: "5\n1 2 3 4 5",
                tc1Output: "15",
                tc1Hidden: "FALSE",
                tc1Weight: 2,
                tc1Explanation: "1+2+3+4+5 = 15",
                tc2Input: "3\n10 20 30",
                tc2Output: "60",
                tc2Hidden: "FALSE",
                tc2Weight: 2,
                tc3Input: "4\n-5 5 -10 10",
                tc3Output: "0",
                tc3Hidden: "TRUE",
                tc3Weight: 3,
                tc4Input: "1\n999",
                tc4Output: "999",
                tc4Hidden: "TRUE",
                tc4Weight: 3
            });

            sheet.addRow({
                type: "CODING",
                className: sampleClass,
                subject: "Computer Science",
                topic: "Strings",
                difficulty: "MEDIUM",
                marks: 10,
                questionText: "Reverse String\n\nRead a single string from standard input and output the reversed string.",
                constraints: "1 <= length(S) <= 1000",
                allowedLanguages: "Python, C, C++",
                tc1Input: "hello",
                tc1Output: "olleh",
                tc1Hidden: "FALSE",
                tc1Weight: 5,
                tc2Input: "racecar",
                tc2Output: "racecar",
                tc2Hidden: "TRUE",
                tc2Weight: 5
            });

            sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        };

        // IF MODE IS CODING ONLY:
        if (mode === 'coding') {
            const codingSheet = workbook.addWorksheet('Coding Template');
            setupCodingSheet(codingSheet);
        } else {
            // Objective, Descriptive, or All
            const templateSheet = workbook.addWorksheet('Template');

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

            const headerRow = templateSheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

            // Add sample objective rows
            if (mode === 'objective' || mode === 'all') {
                templateSheet.addRow({
                    type: "MCQ", className: sampleClass, subject: "Physics", topic: "Kinematics", difficulty: "EASY", marks: 1,
                    questionText: "What is the unit of force in SI system?", optionA: "Newton", optionB: "Joule", optionC: "Watt", optionD: "Pascal",
                    correctOption: "A", explanation: "1 Newton = 1 kg*m/s^2"
                });
                templateSheet.addRow({
                    type: "MC", className: sampleClass, subject: "Physics", topic: "Forces", difficulty: "MEDIUM", marks: 2,
                    questionText: "Which of the following are vector quantities?", optionA: "Velocity", optionB: "Speed", optionC: "Acceleration", optionD: "Mass",
                    correctOption: "A, C", explanation: "Velocity and acceleration have both magnitude and direction."
                });
                templateSheet.addRow({
                    type: "INT", className: sampleClass, subject: "Mathematics", topic: "Algebra", difficulty: "EASY", marks: 2,
                    questionText: "Find the value of x if 2x + 4 = 10.",
                    modelAnswer: "3", explanation: "2x = 6 => x = 3."
                });
            }

            if (mode === 'descriptive' || mode === 'all') {
                templateSheet.addRow({
                    type: "DESCRIPTIVE", className: sampleClass, subject: "English", topic: "Comprehension", difficulty: "MEDIUM", marks: 10,
                    questionText: "Read the passage and answer.", s1Text: "Passage Analysis", s1Type: "comprehension", s1Marks: 5,
                    s1Stem: "21st February is a historical day for Bangladesh...", s1Questions: "What happened on this day?|Why is it important?",
                    s1Answers: "Language movement|National identity"
                });
            }

            templateSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

            // Also add dedicated Coding Sheet to 'all' mode!
            if (mode === 'all') {
                const codingSheet = workbook.addWorksheet('Coding Template');
                setupCodingSheet(codingSheet);
            }
        }

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
        return NextResponse.json({ 
            error: "Failed to generate sample template",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
