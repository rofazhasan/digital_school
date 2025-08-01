import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import QRCode from 'qrcode';

// Dynamic import for jsPDF to avoid SSR issues
let jsPDF: any;

async function loadPDFLibraries() {
  if (!jsPDF) {
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
    } catch (error) {
      console.error('Failed to load jsPDF:', error);
      throw new Error('PDF generation library not available');
    }
  }
  return { jsPDF };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = token.user;
    const { id: examId } = await params;

    // Check permissions - only teachers, admins, and super users can download results
    if (!['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch exam and results data
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
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check institute access for teachers and admins
    if (user.role !== 'SUPER_USER' && user.instituteId !== exam.class.instituteId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const results = await prismadb.result.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
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
      return NextResponse.json({ error: 'No results found for this exam' }, { status: 404 });
    }

    // Calculate statistics
    const totalStudents = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = totalScore / totalStudents;
    const highestScore = Math.max(...results.map(r => r.total));
    const lowestScore = Math.min(...results.map(r => r.total));
    const passCount = results.filter(r => r.total >= exam.passMarks).length;
    const passRate = (passCount / totalStudents) * 100;

    // Load PDF libraries
    const { jsPDF: PDFClass } = await loadPDFLibraries();
    
    // Generate PDF
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
    }, PDFClass);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="exam-results-${exam.name}-${exam.class.name}-${exam.class.section}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating results PDF:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
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

async function generateResultsPDF(data: PDFData, PDFClass: any): Promise<Buffer> {
  const { exam, results, statistics, institute } = data;
  
  // Create new PDF document (A4 size)
  const doc = new PDFClass('p', 'mm', 'a4');
  
  // Set page margins and dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  
  // Simple black and white color scheme
  const colors = {
    black: [0, 0, 0],
    white: [255, 255, 255]
  };
  
  // Helper function to draw header section with English text
  async function drawHeader() {
    // School name at top
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setTextColor(...colors.black);
    doc.text(institute?.name || 'Educational Institute', pageWidth/2, 25, { align: 'center' });
    
    // Class and exam name
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text(`Class: ${exam.class.name} ${exam.class.section}`, margin, 40);
    doc.text(`Exam: ${exam.name}`, margin, 50);
    
    // QR Code in front right corner with better positioning
    const qrX = pageWidth - margin - 30;
    const qrY = 25;
    await generateQRCode(exam.id, qrX, qrY, 25);
  }
  
  // Helper function to draw the main table with English headers
  function drawMainTable() {
    const startY = 70;
    
    // Table headers in English
    const headers = [
      { text: 'Serial No.', width: 20 },
      { text: 'Roll No.', width: 40 },
      { text: 'Student Name', width: 60 },
      { text: 'Total Marks', width: 25 },
      { text: 'Rank', width: 20 },
      { text: 'Comments', width: 35 }
    ];
    
    const headerY = startY;
    let currentX = margin;
    
    // Draw header row
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.setTextColor(...colors.black);
    
    headers.forEach((header) => {
      doc.rect(currentX, headerY, header.width, 10, 'S');
      doc.text(header.text, currentX + 2, headerY + 7);
      currentX += header.width;
    });
    
    // Draw student data rows
    let currentY = headerY + 10;
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    
    results.forEach((result, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 30;
      }
      
      currentX = margin;
      
      // Serial Number
      doc.rect(currentX, currentY, 20, 8, 'S');
      doc.text(String(index + 1), currentX + 2, currentY + 5);
      currentX += 20;
      
      // Roll Number
      doc.rect(currentX, currentY, 40, 8, 'S');
      doc.text(result.student.roll, currentX + 2, currentY + 5);
      currentX += 40;
      
      // Student Name
      doc.rect(currentX, currentY, 60, 8, 'S');
      doc.text(result.student.user.name, currentX + 2, currentY + 5);
      currentX += 60;
      
      // Total Marks
      doc.rect(currentX, currentY, 25, 8, 'S');
      doc.text(String(result.total), currentX + 2, currentY + 5);
      currentX += 25;
      
      // Rank
      doc.rect(currentX, currentY, 20, 8, 'S');
      doc.text(result.rank ? String(result.rank) : 'N/A', currentX + 2, currentY + 5);
      currentX += 20;
      
      // Comments
      doc.rect(currentX, currentY, 40, 8, 'S');
      const comment = result.total >= exam.passMarks ? 'Pass' : 'Fail';
      doc.text(comment, currentX + 2, currentY + 5);
      
      currentY += 8;
    });
    
    return currentY + 15;
  }
  
  // Helper function to generate QR code
  async function generateQRCode(text: string, x: number, y: number, size: number = 20) {
    try {
      // Generate QR code as data URL with better settings
      const qrDataURL = await QRCode.toDataURL(text, {
        width: size * 4,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      // Add QR code image to PDF with better positioning
      doc.addImage(qrDataURL, 'PNG', x, y, size, size);
      
      // Add text below QR code
      doc.setFontSize(7);
      doc.setFont('times', 'bold');
      doc.setTextColor(...colors.black);
      doc.text('Scan for verification', x + size/2, y + size + 8, { align: 'center' });
    } catch (error) {
      console.error('QR code generation failed:', error);
      // Fallback: visible square with text
      doc.setFillColor(...colors.black);
      doc.rect(x, y, size, size, 'F');
      doc.setFontSize(7);
      doc.setFont('times', 'bold');
      doc.setTextColor(...colors.white);
      doc.text('QR', x + size/2, y + size/2, { align: 'center' });
      doc.setFontSize(6);
      doc.setTextColor(...colors.black);
      doc.text('Verification', x + size/2, y + size + 8, { align: 'center' });
    }
  }
  
  // Helper function to draw footer with head master signature
  async function drawFooter(finalY: number) {
    // Head Master signature section on left side bottom
    const signatureY = finalY + 20;
    
    // Signature line (above Head Master text)
    const signatureWidth = 60;
    const signatureX = margin; // Left side
    
    doc.setDrawColor(...colors.black);
    doc.setLineWidth(0.5);
    doc.line(signatureX, signatureY + 10, signatureX + signatureWidth, signatureY + 10);
    
    // Head Master label in English (below signature line)
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.setTextColor(...colors.black);
    doc.text('Head Master', signatureX + signatureWidth/2, signatureY + 20, { align: 'center' });
    
    // Institute name under Head Master text
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.setTextColor(...colors.black);
    doc.text(institute?.name || 'Educational Institute', signatureX + signatureWidth/2, signatureY + 35, { align: 'center' });
    
    // Generation date in English
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.setTextColor(...colors.black);
    const englishDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated on: ${englishDate}`, pageWidth/2, signatureY + 50, { align: 'center' });
  }
  
  // Generate the PDF
  await drawHeader();
  const tableEndY = drawMainTable();
  await drawFooter(tableEndY);
  
  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}

 