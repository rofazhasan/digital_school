import { parseDescriptiveSubQuestion } from '../utils/descriptive-parser';

// Mock helper functions (simplified versions of what's in bulk-upload/route.ts)
const s = (val: any) => (val === null || val === undefined) ? '' : String(val).trim();
const n = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const items = String(val).match(/-?\d+/);
    return items ? parseInt(items[0]) : 0;
};
const getValue = (row: any, keys: string[]) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
        }
    }
    return '';
};

function mockValidateAndMapRow(row: any) {
    const typeRaw = s(getValue(row, ["Type"])).toUpperCase();
    const data: any = {
        type: typeRaw,
        className: s(getValue(row, ["Class Name"])),
        subject: s(getValue(row, ["Subject"])),
        difficulty: s(getValue(row, ["Difficulty"])),
        marks: n(getValue(row, ["Marks"])),
        questionText: s(getValue(row, ["Question Text"])),
        modelAnswer: s(getValue(row, ["Model Answer"])),
        explanation: s(getValue(row, ["Teacher Note / Explanation"]))
    };

    if (typeRaw === 'MCQ' || typeRaw === 'MC') {
        const correct = s(getValue(row, ["Correct Option"])).toUpperCase();
        data.options = [
            { text: s(getValue(row, ["Option A"])), isCorrect: correct.includes('A') },
            { text: s(getValue(row, ["Option B"])), isCorrect: correct.includes('B') },
            { text: s(getValue(row, ["Option C"])), isCorrect: correct.includes('C') },
            { text: s(getValue(row, ["Option D"])), isCorrect: correct.includes('D') }
        ].filter(o => o.text);
    } else if (typeRaw === 'AR') {
        data.assertion = s(getValue(row, ["Assertion"]));
        data.reason = s(getValue(row, ["Reason"]));
        data.correctOption = n(getValue(row, ["Correct Option"]));
    } else if (typeRaw === 'MTF') {
        const lefts = [];
        for (let i = 1; i <= 5; i++) {
            const t = s(getValue(row, [`Left ${i}`]));
            if (t) lefts.push({ id: i.toString(), text: t });
        }
        const rights = [];
        const letters = ['A', 'B', 'C', 'D', 'E'];
        for (let i = 0; i < 5; i++) {
            const t = s(getValue(row, [`Right ${letters[i]}`]));
            if (t) rights.push({ id: letters[i], text: t });
        }
        data.leftColumn = lefts;
        data.rightColumn = rights;
        const matchStr = s(getValue(row, ["Matches"]));
        const matchMap: any = {};
        matchStr.split(/[\s,]+/).forEach(p => {
            const parts = p.split('-');
            if (parts.length === 2) matchMap[parts[0].trim()] = parts[1].trim().toUpperCase();
        });
        data.matches = matchMap;
    } else if (typeRaw === 'DESCRIPTIVE' || typeRaw === 'CQ' || typeRaw === 'SMCQ') {
        data.subQuestions = [];
        for (let i = 1; i <= 10; i++) {
            const subQ = parseDescriptiveSubQuestion(row, i);
            if (subQ) data.subQuestions.push(subQ);
        }
    }

    return data;
}

// TEST CASES
const testRows = [
    // 1. Objective: MCQ
    {
        Type: "MCQ", "Class Name": "Class 10", Subject: "Physics", Difficulty: "EASY", Marks: 1,
        "Question Text": "What is the speed of light?", "Option A": "3e8 m/s", "Option B": "2e8 m/s",
        "Correct Option": "A"
    },
    // 2. Objective: MTF
    {
        Type: "MTF", "Class Name": "Class 10", Subject: "GK", Marks: 5,
        "Question Text": "Match capitals:", "Left 1": "France", "Left 2": "Japan", 
        "Right A": "Tokyo", "Right B": "Paris", Matches: "1-B, 2-A"
    },
    // 3. CQ/SQ: Creative Question (simulated as DESCRIPTIVE with sub-parts)
    {
        Type: "DESCRIPTIVE", "Class Name": "Class 10", Subject: "English", Marks: 10,
        "Question Text": "Read the text and answer.",
        "Sub 1 Text": "Sub Part A", "Sub 1 Type": "writing", "Sub 1 Marks": 5, "Sub 1 Instructions": "Write a summary.",
        "Sub 2 Text": "Sub Part B", "Sub 2 Type": "short_answer", "Sub 2 Marks": 5, "Sub 2 Questions": "What is the theme?", "Sub 2 Answers": "Isolation"
    },
    // 4. Descriptive Complex: Comprehension MCQ
    {
        Type: "DESCRIPTIVE", "Class Name": "Class 10", Subject: "English", Marks: 5,
        "Question Text": "Comprehension Task",
        "Sub 1 Type": "comprehension", "Sub 1 Marks": 5, "Sub 1 Stem Passage": "Stem content here...", 
        "Sub 1 Option A": "Opt 1", "Sub 1 Option B": "Opt 2", "Sub 1 Correct Option": "A"
    },
    // 5. Descriptive Complex: Fill-in with Word Box
    {
        Type: "DESCRIPTIVE", "Class Name": "Class 10", Subject: "Grammar", Marks: 5,
        "Sub 1 Type": "fill_in", "Sub 1 Clue Type": "word_box", "Sub 1 Word Box": "a|an|the",
        "Sub 1 Passage": "He is ___ boy.", "Sub 1 Answers": "a"
    },
    // 6. Descriptive Complex: Interpreting Graph
    {
        Type: "DESCRIPTIVE", "Class Name": "Class 10", Subject: "Economics", Marks: 5,
        "Sub 1 Type": "interpreting_graph", "Sub 1 Chart Type": "line", 
        "Sub 1 Chart Labels": "2020|2021", "Sub 1 Chart Data": "10|20",
        "Sub 1 X-Axis Label": "Year", "Sub 1 Y-Axis Label": "Price"
    }
];

console.log("--- STARTING COMPREHENSIVE BULK UPLOAD VERIFICATION ---");
testRows.forEach((row, idx) => {
    console.log(`\n[Test Case ${idx + 1}] Testing Type: ${row.Type}`);
    const result = mockValidateAndMapRow(row);
    console.log(JSON.stringify(result, null, 2));
    
    // Some basic assertions
    if (row.Type === 'DESCRIPTIVE' && (!result.subQuestions || result.subQuestions.length === 0)) {
        console.error("FAIL: Descriptive question has no sub-questions!");
    }
    if (row.Type === 'MCQ' && result.options[0].isCorrect !== true) {
        console.error("FAIL: MCQ correct option mismatch!");
    }
});
console.log("\n--- VERIFICATION COMPLETE ---");
