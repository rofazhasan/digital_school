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
            ["CRITICAL ANSWER FIELD GUIDE", "MUST READ: MODEL ANSWER VS EXPLANATION"],
            ["Model Answer", "OFFICIAL ANSWER KEY: Required for INT (numeric answer, e.g., '42') and SQ (expected solution text). Also used for Sub X Model Answer in CQ & Descriptive. This is rendered as the correct answer in exams, result sheets, evaluations, and printed answer keys."],
            ["Teacher Note / Explanation", "EXPLANATION & RATIONALE: Optional step-by-step reasoning or teacher notes explaining WHY the answer is correct. Used for MCQ, MC, AR, MTF, or as extra solution steps for INT/SQ."],
            [""],
            ["FIELD GUIDE:", ""],
            ["Difficulty", "EASY, MEDIUM, HARD"],
            ["Marks", "Number only."],
            ["POETRY / PASSAGE", "For Poem/Passage, use '||' for forced line breaks or type with Newlines (Alt+Enter)."],
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
            ["ADVANCED OBJECTIVE TYPES INSTRUCTION GUIDE (AI & HUMAN COMPATIBLE)", "CRITICAL SPECIFICATIONS FOR CMA, MPC, AND DR"],
            ["CMA (Constructed Multi-Answer)", "1. Set Type = 'CMA'. 2. Fill 'Question Text' (problem description). 3. For each sub-part (Sub 1, Sub 2, etc.): Fill 'Sub X Text' (field label/prompt e.g., 'Velocity (m/s)'), 'Sub X Marks' (part marks), and 'Sub X Model Answer' (exact key e.g., '20' or '2*v0*sin(theta)/g'). 4. Optional: 'Sub X Type' (integer, decimal, expression, fraction, text; default is decimal), 'Sub X Tolerance' (e.g., 0.05), 'Sub X Unit' (e.g., 'm/s')."],
            ["MPC (Multi-Step Problem Chain)", "1. Set Type = 'MPC'. 2. Fill 'Question Text' (scenario stem). 3. For each stage (Sub 1, Sub 2, etc.): Fill 'Sub X Text' (stage title e.g., 'Stage 1: Calculate acceleration'), 'Sub X Marks', and 'Sub X Model Answer' (stage key e.g., '10'). 4. Optional Error Propagation (EPH): 'Sub X Depends On' (e.g., 's1' or '1') and 'Sub X Formula' (dynamic target formula e.g., '0.5 * 1200 * (prev * 8)^2'). If Stage 1 is wrong, Stage 2 evaluates methodology dynamically via this formula so students aren't double-penalized!"],
            ["DR (Diagnostic Reasoning)", "1. Set Type = 'DR'. 2. Fill 'Question Text' (Part A question stem) and 'Model Answer' (Part A key value). 3. For Part B Reason choices: Fill 'Sub 1 Text', 'Sub 2 Text', 'Sub 3 Text', etc. with justification statements. 4. Specify the correct justification reason via 'Sub X Correct' = 'TRUE' (or set 'Correct Option' = 'A', 'B', 'C', or '1', '2', '3'). The system auto-maps student responses to 7 Cognitive Diagnostic Tags (MASTERY, MISCONCEPTION, EXECUTION_SLIP, etc.)."],
            ["AI QUESTION GENERATION NOTE", "When generating questions via AI or scripts: Always output Type as 'CMA', 'MPC', or 'DR'. For CMA & MPC, populate 'subQuestions' array with { label/stageTitle, marks, modelAnswer, type, tolerance, unit, dependsOnStageId, formula }. For DR, populate Part A 'modelAnswer' and 'reasonOptions' array with { id, text, isCorrect }."],
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
        let classes: any[] = [];
        try {
            classes = await prisma.class.findMany({ select: { name: true, section: true } });
        } catch (dbError) {
            console.error("Database error fetching classes for template:", dbError);
            // Non-fatal: continue with empty classes
        }
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

        const getColumnByKey = (key: string) => {
            const exists = finalColumns.some((col: any) => col.key === key);
            return exists ? templateSheet.getColumn(key) : null;
        };

        // Header Styling & Data Validation
        const headerRow = templateSheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Indigo
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        const subTypeFormula = '"writing,fill_in,comprehension,comprehension_mcq,matching,rearranging,flowchart,interpreting_graph,label_diagram,true_false,error_correction,short_answer"';
        const chartTypeFormula = '"bar,line,pie,scatter,area"';
        const typeFormula = mode === 'objective' ? '"MCQ,MC,INT,AR,MTF,CQ,SQ,SMCQ,CMA,MPC,DR"' : mode === 'descriptive' ? '"DESCRIPTIVE"' : '"MCQ,MC,INT,AR,MTF,CQ,SQ,SMCQ,DESCRIPTIVE,CMA,MPC,DR"';

        // Apply column-level validation + styles
        const typeCol = getColumnByKey('type');
        if (typeCol) (typeCol as any).dataValidation = { type: 'list', allowBlank: true, formulae: [typeFormula] };
        
        const diffCol = getColumnByKey('difficulty');
        if (diffCol) (diffCol as any).dataValidation = { type: 'list', allowBlank: true, formulae: ['"EASY,MEDIUM,HARD"'] };
        
        if (classNames.length > 0) {
            const classCol = getColumnByKey('className');
            if (classCol) {
                (classCol as any).dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Valid Classes Reference'!$A$2:$A$${classNames.length + 1}`],
                };
            }
        }

        // Apply validations and styling for sub-columns (both Objective objSub and Descriptive s prefixes)
        for (let i = 1; i <= 10; i++) {
            // Objective Sub-columns styling
            const objSubMarks = getColumnByKey(`objSub${i}Marks`);
            if (objSubMarks && objSubMarks.number > 0) {
                const cell = headerRow.getCell(objSubMarks.number);
                if (cell) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
            }

            // Descriptive Sub-columns validations & styling
            const descTypeCol = getColumnByKey(`s${i}Type`);
            if (descTypeCol && descTypeCol.number > 0) {
                (descTypeCol as any).dataValidation = { type: 'list', allowBlank: true, formulae: [subTypeFormula] };
                const cell = headerRow.getCell(descTypeCol.number);
                if (cell) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
            }
            
            const descChartCol = getColumnByKey(`s${i}ChartType`);
            if (descChartCol && descChartCol.number > 0) {
                (descChartCol as any).dataValidation = { type: 'list', allowBlank: true, formulae: [chartTypeFormula] };
            }
        }

        const sampleClass = classNames[0] || "Class 10";

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
            templateSheet.addRow({
                type: "INT", className: sampleClass, subject: "Mathematics", topic: "Algebra", difficulty: "EASY", marks: 2,
                questionText: "Find the value of x if 2x + 4 = 10.",
                modelAnswer: "3",
                explanation: "2x = 10 - 4 => 2x = 6 => x = 3."
            });
            templateSheet.addRow({
                type: "SQ", className: sampleClass, subject: "ICT", topic: "Hardware", difficulty: "MEDIUM", marks: 3,
                questionText: "What is CPU?",
                modelAnswer: "CPU (Central Processing Unit) is the main component of a computer that performs instructions and calculations.",
                explanation: "Often referred to as the brain of the computer."
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
            // SAMPLE CMA
            templateSheet.addRow({
                type: "CMA", className: sampleClass, subject: "Physics", topic: "Kinematics", difficulty: "HARD", marks: 5,
                questionText: "A body moves from rest with acceleration 4 m/s² for 5 seconds.",
                objSub1Text: "Velocity (m/s)", objSub1Marks: 2, objSub1ModelAnswer: "20",
                objSub2Text: "Displacement (m)", objSub2Marks: 3, objSub2ModelAnswer: "50",
                explanation: "v = u + at = 0 + 4*5 = 20 m/s; s = ut + 0.5at² = 0 + 0.5*4*25 = 50m"
            });
            // SAMPLE MPC
            templateSheet.addRow({
                type: "MPC", className: sampleClass, subject: "Physics", topic: "Kinematics", difficulty: "HARD", marks: 10,
                questionText: "A rocket accelerates upward. Solve the multi-step problem chain below.",
                objSub1Text: "Stage 1: Calculate acceleration", objSub1Marks: 5, objSub1ModelAnswer: "10",
                objSub2Text: "Stage 2: Calculate velocity after 5 sec", objSub2Marks: 5, objSub2ModelAnswer: "50",
                explanation: "Multi-step chain with Error Propagation Protection."
            });
            // SAMPLE DR
            templateSheet.addRow({
                type: "DR", className: sampleClass, subject: "Biology", topic: "Renal System", difficulty: "MEDIUM", marks: 5,
                questionText: "What is the structural and functional unit of the human kidney?",
                canonicalAnswer: "NEPHRON",
                acceptedAnswers: "nephron, নেফ্রন, functional unit of kidney",
                drSubtype: "TEXT",
                objSub1Text: "Nephrons filter blood and produce urine in the renal cortex and medulla", objSub1Marks: 5, objSub1Correct: "A",
                explanation: "Each human kidney contains approximately 1 million nephrons."
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
                topic: "Comprehension",
                difficulty: "MEDIUM",
                marks: 10,
                questionText: "Read the following passage carefully and answer the questions that follow.",
                s1Text: "Passage MCQs",
                s1Type: "comprehension_mcq",
                s1Marks: 10,
                s1Stem: "The Sundarbans, a UNESCO World Heritage site, is the largest mangrove forest in the world... It spans between Bangladesh and India.",
                s1Questions: "Where is the Sundarbans located?|Which organization declared it a heritage site?",
                s1A: "Amazon Delta|UNESCO",
                s1B: "Ganges-Brahmaputra Delta|UNICEF",
                s1C: "The Nile Delta|WHO",
                s1D: "Everglades|UNDP",
                s1Correct: "B|A"
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
                s1Matches: "1-A-I, 2-B-II, 3-C-III",
                s2Type: "rearranging", s2Text: "Arrange the plant growth stages.",
                s2Items: "Sprout|Seed|Tree|Fruit", s2Order: "Seed|Sprout|Tree|Fruit"
            });
            templateSheet.addRow({
                type: "DESCRIPTIVE", className: sampleClass, subject: "Science", topic: "Facts", difficulty: "MEDIUM", marks: 5,
                questionText: "Evaluate the following statements.",
                s1Type: "true_false", s1Text: "Identify if the statements are True or False.",
                s1Questions: "Water boils at 100°C.|Earth is flat.|Light travels faster than sound.",
                s1Answers: "TRUE|FALSE|TRUE"
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
        return NextResponse.json({ 
            error: "Failed to generate sample template",
            message: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, { status: 500 });
    }
}

