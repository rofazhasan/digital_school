import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { encryptData, encryptRowForExcel, AI_ENCRYPTED_EXCEL_PROMPT } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questions } = body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: 'questions must be a non-empty array' }, { status: 400 });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Digital School AI Vault';
        workbook.created = new Date();

        // 1. Instructions Sheet
        const infoSheet = workbook.addWorksheet('Instructions');
        infoSheet.columns = [
            { header: 'Property', key: 'prop', width: 25 },
            { header: 'Specification', key: 'spec', width: 85 }
        ];
        infoSheet.addRow(['Security Level', 'AES-256-GCM Authenticated Encryption']);
        infoSheet.addRow(['Origin', 'Digital School AI Encrypted Question Generator']);
        infoSheet.addRow(['Decryption Engine', 'Automatic on upload to Digital School']);
        infoSheet.addRow(['Protected Fields', 'Question Text, Options, Answers, Explanations, Test Cases']);
        infoSheet.getRow(1).font = { bold: true };

        // 2. Encrypted Template Sheet
        const sheet = workbook.addWorksheet('Encrypted Template');

        const baseColumns = [
            { header: "Type", key: "type", width: 12 },
            { header: "Class Name", key: "className", width: 25 },
            { header: "Subject", key: "subject", width: 18 },
            { header: "Topic", key: "topic", width: 20 },
            { header: "Difficulty", key: "difficulty", width: 12 },
            { header: "Marks", key: "marks", width: 8 },
            { header: "Question Text", key: "questionText", width: 45 },
            { header: "Option A", key: "optionA", width: 20 },
            { header: "Option B", key: "optionB", width: 20 },
            { header: "Option C", key: "optionC", width: 20 },
            { header: "Option D", key: "optionD", width: 20 },
            { header: "Option E", key: "optionE", width: 20 },
            { header: "Correct Option", key: "correctOption", width: 15 },
            { header: "Model Answer", key: "modelAnswer", width: 25 },
            { header: "Teacher Note / Explanation", key: "explanation", width: 30 },
            { header: "Assertion", key: "assertion", width: 20 },
            { header: "Reason", key: "reason", width: 20 },
            { header: "Constraints", key: "constraints", width: 25 },
            { header: "Allowed Languages", key: "allowedLanguages", width: 20 },
            { header: "Starter Code Python", key: "starterPython", width: 30 },
            { header: "Starter Code C", key: "starterC", width: 30 },
            { header: "Starter Code CPP", key: "starterCPP", width: 30 },
        ];

        // Add Test Cases
        for (let i = 1; i <= 5; i++) {
            baseColumns.push(
                { header: `Test ${i} Input`, key: `tc${i}Input`, width: 20 },
                { header: `Test ${i} Output`, key: `tc${i}Output`, width: 20 },
                { header: `Test ${i} Hidden`, key: `tc${i}Hidden`, width: 12 },
                { header: `Test ${i} Weight`, key: `tc${i}Weight`, width: 10 }
            );
        }

        // Add Sub Questions
        for (let i = 1; i <= 4; i++) {
            baseColumns.push(
                { header: `Sub ${i} Text`, key: `s${i}Text`, width: 25 },
                { header: `Sub ${i} Marks`, key: `s${i}Marks`, width: 10 },
                { header: `Sub ${i} Model Answer`, key: `s${i}ModelAnswer`, width: 25 },
                { header: `Sub ${i} Explanation`, key: `s${i}Explanation`, width: 25 }
            );
        }

        sheet.columns = baseColumns;

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }; // Deep Royal Purple
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Process and encrypt each question row
        for (const q of questions) {
            const rowData: Record<string, any> = {
                type: q.type || 'MCQ',
                className: q.className || 'Class 10 - A',
                subject: q.subject || 'General',
                topic: q.topic || '',
                difficulty: q.difficulty || 'MEDIUM',
                marks: q.marks || 1,
                questionText: q.questionText || '',
                modelAnswer: q.modelAnswer || '',
                explanation: q.explanation || '',
                assertion: q.assertion || '',
                reason: q.reason || '',
                correctOption: q.correctOption || ''
            };

            // Options mapping
            if (Array.isArray(q.options)) {
                q.options.forEach((opt: any, optIdx: number) => {
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    if (letters[optIdx]) {
                        rowData[`option${letters[optIdx]}`] = opt.text || opt.title || opt || '';
                        if (opt.isCorrect && !rowData.correctOption) {
                            rowData.correctOption = letters[optIdx];
                        }
                    }
                });
            }

            // Coding options / testcases
            if (q.type === 'CODING') {
                rowData.constraints = q.options?.constraints || q.constraints || '';
                rowData.allowedLanguages = Array.isArray(q.options?.allowedLanguages) ? q.options.allowedLanguages.join(', ') : 'Python, C, C++';
                rowData.starterPython = q.options?.starterCode?.python || q.starterPython || '';
                rowData.starterC = q.options?.starterCode?.c || q.starterC || '';
                rowData.starterCPP = q.options?.starterCode?.cpp || q.starterCPP || '';

                const testCases = q.options?.testCases || q.testCases || [];
                if (Array.isArray(testCases)) {
                    testCases.slice(0, 5).forEach((tc: any, tcIdx: number) => {
                        const num = tcIdx + 1;
                        rowData[`tc${num}Input`] = tc.input ?? '';
                        rowData[`tc${num}Output`] = tc.expectedOutput ?? tc.output ?? '';
                        rowData[`tc${num}Hidden`] = tc.isHidden ? 'TRUE' : 'FALSE';
                        rowData[`tc${num}Weight`] = tc.weight ?? 1;
                    });
                }
            }

            // Encrypt all sensitive cells
            const encryptedRow = encryptRowForExcel(rowData);
            sheet.addRow(encryptedRow);
        }

        sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="ai_encrypted_questions.xlsx"',
            },
        });
    } catch (err: any) {
        console.error('Error generating encrypted excel:', err);
        return NextResponse.json({ error: err.message || 'Failed to generate encrypted excel' }, { status: 500 });
    }
}
