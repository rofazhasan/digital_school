import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// Explicitly export dynamic to prevent static optimization issues with headers/cookies
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 PDF Download API called:', {
      url: request.url,
      method: request.method,
    });

    // 1. Authentication
    const token = await getTokenFromRequest(request);

    if (!token) {
      console.warn('⚠️ PDF Download: Unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = token;
    const { id: examId } = await params;

    console.log('👤 User requesting PDF:', { userId: user.id, role: user.role, examId });

    // 2. Permission Check
    if (!['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role)) {
      console.warn('⛔ PDF Download: Insufficient permissions for user', user.id);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 3. Data Fetching
    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          include: {
            institute: true
          }
        }
      }
    });

    if (!exam) {
      console.error('❌ PDF Download: Exam not found', examId);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 4. Institute Access Check
    if (user.role !== 'SUPER_USER' && user.instituteId !== exam.class.instituteId) {
      console.warn('⛔ PDF Download: Institute mismatch', {
        userInstitute: user.instituteId,
        examInstitute: exam.class.instituteId
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const results = await prismadb.result.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true }
            },
            class: true
          }
        }
      },
      orderBy: [
        { total: 'desc' },
        { rank: 'asc' }
      ]
    });

    if (results.length === 0) {
      console.warn('⚠️ PDF Download: No results found for exam', examId);
      return NextResponse.json({ error: 'No results found for this exam' }, { status: 404 });
    }

    // 5. Statistics Calculation
    const totalStudents = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = totalScore / totalStudents;
    const highestScore = Math.max(...results.map(r => r.total));
    const lowestScore = Math.min(...results.map(r => r.total));
    const passCount = results.filter(r => r.total >= exam.passMarks).length;
    const passRate = (passCount / totalStudents) * 100;

    // 6. PDF Generation
    console.log('📄 Generating PDF...');
    const pdfBuffer = await generateResultsPDF({
      exam,
      results,
      statistics: {
        totalStudents,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        passCount
      },
      institute: exam.class.institute
    });
    console.log('✅ PDF Generated successfully, size:', pdfBuffer.byteLength);

    // 7. Response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="exam-results-${sanitizeFilename(exam.name)}.pdf"`
      }
    });

  } catch (error) {
    console.error('💥 Error in PDF Download API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

interface PDFData {
  exam: any;
  results: any[];
  statistics: {
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    passCount: number;
  };
  institute: any;
}

async function generateResultsPDF(data: PDFData): Promise<Buffer> {
  const { exam, results, statistics, institute } = data;

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // Helper to safely add text
  const safeText = (text: string, x: number, y: number, options?: any) => {
    try {
      // Basic sanitization to ascii if needed, keeping simple for now
      // jsPDF default fonts support limited unicode. For full support we'd need custom fonts.
      // We'll replace problematic characters if any.
      const cleanText = text || '';
      doc.text(cleanText, x, y, options);
    } catch (e) {
      console.warn('Error drawing text:', text, e);
    }
  };

  // Header
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  safeText(institute?.name || 'Educational Institute', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  safeText(`Class: ${exam.class.name} ${exam.class.section}`, margin, 40);
  safeText(`Exam: ${exam.name}`, margin, 50);
  safeText(`Date: ${new Date(exam.date).toLocaleDateString()}`, margin, 60);

  // QR Code
  try {
    const qrDataURL = await QRCode.toDataURL(exam.id, { width: 100, margin: 1 });
    doc.addImage(qrDataURL, 'PNG', pageWidth - margin - 30, 25, 25, 25);
  } catch (e) {
    console.error('QR Code generation failed', e);
  }

  // Table Config
  const startY = 75;
  const headers = ['SL', 'Roll', 'Name', 'Total', 'Rank', 'Status'];
  const colWidths = [15, 35, 65, 25, 20, 25]; // Total approx 185 (allows for margins)
  let currentY = startY;
  let currentX = margin;

  // Draw Header
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  headers.forEach((h, i) => {
    doc.rect(currentX, currentY, colWidths[i], 10);
    doc.text(h, currentX + 2, currentY + 7);
    currentX += colWidths[i];
  });
  currentY += 10;

  // Draw Rows
  doc.setFont('times', 'normal');
  doc.setFontSize(9);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // Page break check
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    currentX = margin;
    const rowHeight = 8;

    // Data preparation
    const rowData = [
      String(i + 1),
      result.student.roll || '-',
      result.student.user.name || 'Unknown',
      String(result.total),
      result.rank ? String(result.rank) : '-',
      result.total >= exam.passMarks ? 'Pass' : 'Fail'
    ];

    rowData.forEach((text, colIndex) => {
      doc.rect(currentX, currentY, colWidths[colIndex], rowHeight);
      // Truncate name if too long
      let cellText = text;
      if (colIndex === 2 && text.length > 30) {
        cellText = text.substring(0, 27) + '...';
      }
      safeText(cellText, currentX + 2, currentY + 5);
      currentX += colWidths[colIndex];
    });

    currentY += rowHeight;
  }

  // Footer / Summary
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 15;
  }

  doc.setFontSize(10);
  safeText(`Summary: Total Students: ${statistics.totalStudents}, Passed: ${statistics.passCount} (${statistics.passRate.toFixed(1)}%)`, margin, currentY);
  currentY += 10;
  safeText(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);

  return Buffer.from(doc.output('arraybuffer'));
}