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

export async function generateStudentScriptPDF(data: StudentScriptPDFData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- Font Setup ---
    try {
        const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Regular.ttf');
        const fontBoldPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali-Bold.ttf');

        if (fs.existsSync(fontPath)) {
            const fontBase64 = fs.readFileSync(fontPath).toString('base64');
            doc.addFileToVFS('NotoSansBengali-Regular.ttf', fontBase64);
            doc.addFont('NotoSansBengali-Regular.ttf', 'Bengali', 'normal');
        }

        if (fs.existsSync(fontBoldPath)) {
            const fontBoldBase64 = fs.readFileSync(fontBoldPath).toString('base64');
            doc.addFileToVFS('NotoSansBengali-Bold.ttf', fontBoldBase64);
            doc.addFont('NotoSansBengali-Bold.ttf', 'Bengali', 'bold');
        }

        doc.setFont('Bengali', 'normal');
    } catch (e) {
        console.error('Error loading fonts for PDF:', e);
        doc.setFont('helvetica', 'normal');
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let y = 25;

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
            doc.setFont('Bengali', 'normal');
            return true;
        }
        return false;
    };

    // --- Header Section ---
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('Bengali', 'bold');
    doc.text(data.institute.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('Bengali', 'normal');
    doc.setTextColor(200, 200, 200);
    if (data.institute.address) {
        doc.text(data.institute.address, pageWidth / 2, 27, { align: 'center' });
    }

    doc.setFontSize(14);
    doc.setFont('Bengali', 'bold');
    doc.setTextColor(56, 189, 248); // Sky 400
    doc.text('OFFICIAL ANSWER SCRIPT', pageWidth / 2, 42, { align: 'center' });

    y = 65;

    // --- Student Info ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('Bengali', 'bold');
    doc.text('STUDENT & EXAM INFORMATION', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    const infoRows = [
        ['Student Name:', data.studentName, 'Exam:', data.examName],
        ['Roll Number:', data.studentRoll, 'Subject:', data.subject],
        ['Class:', data.className, 'Date:', data.examDate]
    ];

    doc.setFont('Bengali', 'normal');
    infoRows.forEach(row => {
        doc.setFont('Bengali', 'bold');
        doc.text(row[0], margin, y);
        doc.setFont('Bengali', 'normal');
        doc.text(String(row[1]), margin + 30, y);

        doc.setFont('Bengali', 'bold');
        doc.text(row[2], pageWidth / 2 + 10, y);
        doc.setFont('Bengali', 'normal');
        doc.text(String(row[3]), pageWidth / 2 + 40, y);
        y += 8;
    });

    y += 10;

    // --- Summary Box ---
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');
    doc.setFont('Bengali', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`RESULT SUMMARY: ${data.results.total} / ${data.results.totalMarks} (Rank #${data.results.rank || 'N/A'})`, pageWidth / 2, y + 12, { align: 'center' });

    y += 35;

    // --- Detailed Script ---
    if (data.questions && data.questions.length > 0 && data.submission) {
        doc.setFont('Bengali', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('ANSWER SCRIPT DETAILS', margin, y);
        y += 5;
        drawLine(y, [30, 41, 59]);
        y += 10;

        data.questions.forEach((q, idx) => {
            const answer = data.submission?.answers[q.id];
            const marks = data.submission?.answers[`${q.id}_marks`];

            checkPageBreak(30);

            doc.setFont('Bengali', 'bold');
            doc.setFontSize(10);
            doc.text(`${idx + 1}. ${q.questionText || q.text}`, margin, y, { maxWidth: pageWidth - margin * 2 });

            // Calculate height taken by question text
            const textLines = doc.splitTextToSize(`${idx + 1}. ${q.questionText || q.text}`, pageWidth - margin * 2);
            y += (textLines.length * 5) + 2;

            doc.setFont('Bengali', 'normal');
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
                    doc.text(`${prefix}${opt.text}${suffix}`, margin + 5, y);
                    y += 6;
                });
            } else {
                doc.text(`Answer: ${answer || 'No answer provided'}`, margin + 5, y, { maxWidth: pageWidth - margin * 2.5 });
                const ansLines = doc.splitTextToSize(`Answer: ${answer || 'No answer provided'}`, pageWidth - margin * 2.5);
                y += (ansLines.length * 5) + 2;
            }

            if (marks !== undefined) {
                doc.setFont('Bengali', 'bold');
                doc.setTextColor(16, 185, 129); // Emerald 600
                doc.text(`Marks Obtained: ${marks} / ${q.marks}`, margin + 5, y);
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
        doc.setFont('Bengali', 'bold');
        doc.text('EVALUATOR NOTES:', margin, y);
        y += 6;
        doc.setFont('Bengali', 'normal');
        doc.text(data.submission.evaluatorNotes, margin, y, { maxWidth: pageWidth - margin * 2 });
    }

    // --- Footer ---
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()} | Digital School Academic System`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
}
