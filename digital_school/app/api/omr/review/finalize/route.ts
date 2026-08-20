import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { evaluateSubmission } from '@/lib/exam-logic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const isAuthorized = userRole === 'SUPER_USER' || userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'SHARED';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Teacher or Administrator access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { scanId, reason = 'Teacher Review Finalization', reviewerNotes } = body;

    if (!scanId) {
      return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
    }

    const scan = await prisma.oMRScan.findUnique({
      where: { id: scanId },
      include: {
        answers: true,
        quality: true
      }
    });

    if (!scan) {
      return NextResponse.json({ error: `Scan '${scanId}' not found.` }, { status: 404 });
    }

    // 1. Fetch Exam & ExamSets
    const exam = await prisma.exam.findUnique({
      where: { id: scan.examId },
      include: { examSets: true }
    });

    if (!exam) {
      return NextResponse.json({ error: `Exam '${scan.examId}' not found.` }, { status: 404 });
    }

    // 2. Fetch/Upsert Canonical ExamSubmission
    if (scan.studentId) {
      const submission = await prisma.examSubmission.findUnique({
        where: {
          studentId_examId: {
            studentId: scan.studentId,
            examId: scan.examId
          }
        }
      });

      if (submission) {
        // Run authoritative evaluation
        await evaluateSubmission(submission, exam as any, exam.examSets as any, true);
      }
    }

    // 3. Mark Scan APPROVED & Authoritative
    const updatedScan = await prisma.oMRScan.update({
      where: { id: scanId },
      data: {
        status: 'APPROVED',
        isAuthoritative: true,
        corrections: {
          create: {
            correctedBy: session?.user?.email || session?.user?.name || 'teacher',
            reason: `Finalized: ${reason}${reviewerNotes ? ` (${reviewerNotes})` : ''}`,
            previousValue: scan.status,
            newValue: 'APPROVED'
          }
        }
      },
      include: {
        answers: { orderBy: { questionNo: 'asc' } },
        quality: true,
        corrections: { orderBy: { createdAt: 'desc' } }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Scan officially finalized and canonical result published.',
      scan: updatedScan
    });

  } catch (error: any) {
    console.error('[OMRFinalizeAPI] Error finalizing OMR scan:', error);
    return NextResponse.json({ error: error.message || 'Failed to finalize OMR scan.' }, { status: 500 });
  }
}
