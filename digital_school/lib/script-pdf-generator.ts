import { jsPDF } from 'jspdf';
import { toBengaliNumerals } from '@/utils/numeralConverter';

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
}

export async function generateStudentScriptPDF(data: StudentScriptPDFData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let y = 25;

    // --- Helper for drawing lines ---
    const drawLine = (yPos: number, color = [200, 200, 200]) => {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // --- Header Section ---
    // Background for header
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Institute Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(data.institute.name.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

    // Institute Address
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    if (data.institute.address) {
        doc.text(data.institute.address, pageWidth / 2, 32, { align: 'center' });
    }

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248); // Sky 400
    doc.text('OFFICIAL ACADEMIC TRANSCRIPT', pageWidth / 2, 45, { align: 'center' });

    y = 75;

    // --- Student Info Grid ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    const infoRows = [
        ['Student Name:', data.studentName, 'Examination:', data.examName],
        ['Roll Number:', data.studentRoll, 'Subject:', data.subject],
        ['Class:', data.className, 'Date:', data.examDate]
    ];

    doc.setFont('helvetica', 'normal');
    infoRows.forEach(row => {
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(row[1]), margin + 30, y);

        doc.setFont('helvetica', 'bold');
        doc.text(row[2], pageWidth / 2 + 10, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(row[3]), pageWidth / 2 + 40, y);
        y += 8;
    });

    y += 10;

    // --- Performance Summary Cards ---
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE SUMMARY', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    // Draw 3 boxes
    const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
    const boxHeight = 25;

    // Total Score Box
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('TOTAL SCORE', margin + boxWidth / 2, y + 8, { align: 'center' });
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.setFontSize(16);
    doc.text(`${data.results.total} / ${data.results.totalMarks}`, margin + boxWidth / 2, y + 18, { align: 'center' });

    // Grade Box
    doc.roundedRect(margin + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('FINAL GRADE', margin + boxWidth + 5 + boxWidth / 2, y + 8, { align: 'center' });
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.setFontSize(16);
    doc.text(data.results.grade, margin + boxWidth + 5 + boxWidth / 2, y + 18, { align: 'center' });

    // Rank Box
    doc.roundedRect(margin + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('POSITION / RANK', margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 8, { align: 'center' });
    doc.setTextColor(245, 158, 11); // Amber 600
    doc.setFontSize(16);
    doc.text(data.results.rank ? `#${data.results.rank}` : 'N/A', margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 18, { align: 'center' });

    y += boxHeight + 20;

    // --- Component Breakdown ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPONENT BREAKDOWN', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    const breakdownHeaders = ['Component', 'Type', 'Score Obtained'];
    const componentWidths = [60, 60, 50];

    // Draw Header Table
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);

    let curX = margin + 5;
    breakdownHeaders.forEach((h, i) => {
        doc.text(h, curX, y + 7);
        curX += componentWidths[i];
    });

    y += 10;

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');

    const components = [
        { name: 'Multiple Choice Questions', type: 'Objective', score: data.results.mcqMarks },
        { name: 'Short Questions', type: 'Subjective', score: data.results.sqMarks },
        { name: 'Creative Questions', type: 'Subjective', score: data.results.cqMarks }
    ].filter(c => c.score !== undefined);

    components.forEach((comp, i) => {
        curX = margin + 5;
        doc.text(comp.name, curX, y + 7);
        curX += componentWidths[0];
        doc.text(comp.type, curX, y + 7);
        curX += componentWidths[1];
        doc.setFont('helvetica', 'bold');
        doc.text(String(comp.score), curX, y + 7);
        doc.setFont('helvetica', 'normal');

        y += 10;
        drawLine(y, [241, 245, 249]);
    });

    y += 20;

    // --- Remarks ---
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL SEAL & REMARKS', margin, y);
    y += 5;
    drawLine(y, [30, 41, 59]);
    y += 10;

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('This is a digitally generated document and does not require a physical signature.', margin, y);
    y += 15;

    // Placeholder for signature/seal
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth - margin - 40, y + 10, pageWidth - margin, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Authorized Signature', pageWidth - margin - 20, y + 15, { align: 'center' });

    // --- Footer ---
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()} | Digital School Academic System`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
}
