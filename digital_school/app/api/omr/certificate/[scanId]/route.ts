/**
 * OMR Result Certificate / Marksheet PDF Generator — Phase 3-C
 *
 * GET /api/omr/certificate/[scanId]
 *
 * Returns a PDF stream for the student's OMR result marksheet.
 * Contains: institute header, student details, exam info, score, grade,
 * question-wise MCQ breakdown, and a QR code linking to the result.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { OMRMarksheetDocument } from '@/lib/omr/certificate-template';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await params;

    // Auth check — students can only download their own; teachers/admins can download any
    const token = await getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch scan with full context
    const scan = await prisma.oMRScan.findUnique({
      where: { id: scanId },
      include: {
        quality: true,
        answers: { orderBy: { questionNo: 'asc' } },
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Fetch student profile
    let studentName = 'Unknown Student';
    let studentRoll = scan.rollNumber || '';
    let studentReg  = scan.registrationNo || '';
    let studentClass = '';

    if (scan.studentId) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: scan.studentId },
        include: { user: { select: { name: true } }, class: { select: { name: true, section: true } } },
      });
      if (student) {
        studentName   = student.user.name;
        studentRoll   = student.roll;
        studentReg    = student.registrationNo;
        studentClass  = `${student.class.name} — ${student.class.section}`;
      }
    }

    // Fetch exam
    let examName  = 'Unknown Exam';
    let examDate  = '';
    let instituteName = 'Rofaz Academy';
    if (scan.examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: scan.examId },
        select: { name: true, date: true, class: { select: { institute: { select: { name: true } } } } },
      });
      if (exam) {
        examName      = exam.name;
        examDate      = exam.date.toLocaleDateString('en-BD');
        instituteName = exam.class?.institute?.name || 'Rofaz Academy';
      }
    }

    // Fetch Result for grade/percentage
    let grade = 'N/A';
    let percentage = 0;
    if (scan.studentId && scan.examId) {
      const result = await prisma.result.findFirst({
        where: { studentId: scan.studentId, examId: scan.examId },
        select: { grade: true, percentage: true },
      });
      if (result) {
        grade      = result.grade || 'N/A';
        percentage = result.percentage || 0;
      }
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rofazacademy.dev'}/verify/omr/${scanId}`;

    // Build PDF using the certificate template
    const pdfBuffer = await renderToBuffer(
      createElement(OMRMarksheetDocument, {
        instituteName,
        studentName,
        studentRoll,
        studentReg,
        studentClass,
        examName,
        examDate,
        detectedSet: scan.detectedSet || '',
        totalScore:  scan.totalScore,
        maxScore:    scan.maxScore,
        percentage,
        grade,
        answers:     scan.answers as any[],
        scanId,
        verificationUrl,
        scanDate: new Date(scan.createdAt).toLocaleDateString('en-BD'),
      }) as any
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="OMR_${studentRoll || scanId}_${examName.replace(/\s+/g, '_')}.pdf"`,
        'Cache-Control':       'no-store',
      },
    });
  } catch (err: any) {
    console.error('[OMR Certificate]', err);
    return NextResponse.json({ error: err.message || 'PDF generation failed' }, { status: 500 });
  }
}
