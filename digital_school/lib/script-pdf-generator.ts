import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';

interface StudentScriptPDFData {
    studentName: string;
    studentRoll: string;
    examName: string;
    examDate: string;
    subject: string;
    className: string;
    results: {
        total: number;
        totalMarks: number;
        grade: string;
        rank?: number;
        mcqMarks?: number;
        sqMarks?: number;
        cqMarks?: number;
        percentage?: number;
    };
    institute: {
        name: string;
        address?: string;
        logoUrl?: string;
    };
    questions?: any[];
    submission?: {
        answers: Record<string, any>;
        evaluatorNotes?: string;
    };
}

interface FontData {
    regular?: string;
    bold?: string;
}

export async function generateStudentScriptPDF(data: StudentScriptPDFData, fonts?: FontData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- Font Setup ---
    try {
        let regularBase64 = fonts?.regular;
        let boldBase64 = fonts?.bold;

        if (!regularBase64 || !boldBase64) {
            const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Regular.ttf');
            const fontBoldPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Bold.ttf');

            if (!regularBase64 && fs.existsSync(fontPath)) {
                regularBase64 = fs.readFileSync(fontPath).toString('base64');
            }

            if (!boldBase64 && fs.existsSync(fontBoldPath)) {
                boldBase64 = fs.readFileSync(fontBoldPath).toString('base64');
            }
        }

        if (regularBase64) {
            doc.addFileToVFS('Bengali-Regular.ttf', regularBase64);
            doc.addFont('Bengali-Regular.ttf', 'Bengali', 'normal');
        }

        if (boldBase64) {
            doc.addFileToVFS('Bengali-Bold.ttf', boldBase64);
            doc.addFont('Bengali-Bold.ttf', 'Bengali', 'bold');
        }

        // Set default font
        try {
            if (regularBase64) {
                doc.setFont('Bengali', 'normal');
            } else {
                doc.setFont('helvetica', 'normal');
            }
        } catch (fontErr) {
            console.warn('[PDF] Failed to set Bengali font, falling back to helvetica');
            doc.setFont('helvetica', 'normal');
        }
    } catch (e) {
        console.error('Error loading fonts for PDF:', e);
        doc.setFont('helvetica', 'normal');
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let y = 25;

    // --- Helper for safe text drawing ---
    const drawText = (text: string, x: number, yPos: number, options?: any) => {
        try {
            doc.text(text || '', x, yPos, options);
        } catch (e) {
            console.warn(`[PDF] Error drawing text "${text}":`, e);
            // Fallback to helvetica and try again
            const currentFont = doc.getFont();
            doc.setFont('helvetica', currentFont.fontStyle || 'normal');
            try {
                doc.text(text || '', x, yPos, options);
            } catch (e2) {
                console.error('[PDF] Critical error drawing text even with fallback:', e2);
            }
            // Restore previous font if possible (though it's likely causing issues)
            try { doc.setFont(currentFont.fontName, currentFont.fontStyle); } catch (e3) { }
        }
    };

    // --- Helper for drawing lines ---
    const drawLine = (yPos: number, color = [200, 200, 200]) => {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
            doc.addPage();
            y = 20;
            // Re-apply font on new page
            try {
                doc.setFont('Bengali', 'normal');
            } catch (e) {
                doc.setFont('helvetica', 'normal');
            }
            return true;
        }
        return false;
    };

    // --- Header Section ---
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
    drawText(data.institute.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9);
    try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
    doc.setTextColor(200, 200, 200);
    if (data.institute.address) {
        drawText(data.institute.address, pageWidth / 2, 27, { align: 'center' });
    }

    doc.setFontSize(14);
    try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
    doc.setTextColor(56, 189, 248); // Sky 400
    drawText('OFFICIAL ANSWER SCRIPT', pageWidth / 2, 42, { align: 'center' });

    y = 65;

    // --- Student Info ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
    drawText('STUDENT & EXAM INFORMATION', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    const infoRows = [
        ['Student Name:', data.studentName, 'Exam:', data.examName],
        ['Roll Number:', data.studentRoll, 'Subject:', data.subject],
        ['Class:', data.className, 'Date:', data.examDate]
    ];

    try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
    infoRows.forEach(row => {
        try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
        drawText(row[0], margin, y);
        try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
        drawText(String(row[1]), margin + 30, y);

        try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
        drawText(row[2], pageWidth / 2 + 10, y);
        try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
        drawText(String(row[3]), pageWidth / 2 + 40, y);
        y += 8;
    });

    y += 10;

    // --- Summary Box ---
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');
    try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    drawText(`RESULT SUMMARY: ${data.results.total} / ${data.results.totalMarks} (Rank #${data.results.rank || 'N/A'})`, pageWidth / 2, y + 12, { align: 'center' });

    y += 35;

    // --- Detailed Script ---
    if (data.questions && data.questions.length > 0 && data.submission) {
        try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        drawText('ANSWER SCRIPT DETAILS', margin, y);
        y += 5;
        drawLine(y, [30, 41, 59]);
        y += 10;

        data.questions.forEach((q, idx) => {
            const answer = data.submission?.answers[q.id];
            const marks = data.submission?.answers[`${q.id}_marks`];

            checkPageBreak(30);

            try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
            doc.setFontSize(10);
            drawText(`${idx + 1}. ${q.questionText || q.text}`, margin, y, { maxWidth: pageWidth - margin * 2 });

            // Calculate height taken by question text - Safely measure text
            let textLines = [];
            try {
                textLines = doc.splitTextToSize(`${idx + 1}. ${q.questionText || q.text}`, pageWidth - margin * 2);
            } catch (e) {
                console.warn('[PDF] Error splitting text, using fallback');
                textLines = [String(`${idx + 1}. ${q.questionText || q.text}`)];
            }
            y += (textLines.length * 5) + 2;

            try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);

            if (q.type === 'MCQ' || q.type === 'MC') {
                const options = Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : []);
                const selectedIdx = typeof answer === 'number' ? answer : (options.findIndex((o: any) => o.text === answer));
                const correctIdx = options.findIndex((o: any) => o.isCorrect);

                options.forEach((opt: any, oIdx: number) => {
                    checkPageBreak(8);
                    const prefix = oIdx === selectedIdx ? '[X] ' : '[ ] ';
                    const suffix = oIdx === correctIdx ? ' (Correct)' : '';
                    drawText(`${prefix}${opt.text}${suffix}`, margin + 5, y);
                    y += 6;
                });
            } else {
                drawText(`Answer: ${answer || 'No answer provided'}`, margin + 5, y, { maxWidth: pageWidth - margin * 2.5 });
                let ansLines = [];
                try {
                    ansLines = doc.splitTextToSize(`Answer: ${answer || 'No answer provided'}`, pageWidth - margin * 2.5);
                } catch (e) {
                    ansLines = [String(`Answer: ${answer || 'No answer provided'}`)];
                }
                y += (ansLines.length * 5) + 2;
            }

            if (marks !== undefined) {
                try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
                doc.setTextColor(16, 185, 129); // Emerald 600
                drawText(`Marks Obtained: ${marks} / ${q.marks}`, margin + 5, y);
                y += 10;
            } else {
                y += 5;
            }

            doc.setTextColor(30, 41, 59);
        });
    }

    if (data.submission?.evaluatorNotes) {
        checkPageBreak(25);
        y += 5;
        try { doc.setFont('Bengali', 'bold'); } catch (e) { doc.setFont('helvetica', 'bold'); }
        drawText('EVALUATOR NOTES:', margin, y);
        y += 6;
        try { doc.setFont('Bengali', 'normal'); } catch (e) { doc.setFont('helvetica', 'normal'); }
        drawText(data.submission.evaluatorNotes, margin, y, { maxWidth: pageWidth - margin * 2 });
    }

    // --- Footer ---
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    drawText(`Generated on ${new Date().toLocaleString()} | Digital School Academic System`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
}
