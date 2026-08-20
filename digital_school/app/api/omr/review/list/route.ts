import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const examId = searchParams.get('examId');

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }
    if (examId) {
      where.examId = examId;
    }

    const scans = await prisma.oMRScan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        answers: {
          orderBy: { questionNo: 'asc' }
        },
        quality: true,
        corrections: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Populate student names if available
    const studentIds = scans.map(s => s.studentId).filter((id): id is string => !!id);
    const students = studentIds.length > 0 ? await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { name: true } } }
    }) : [];

    const studentNameMap = new Map<string, string>();
    students.forEach(st => {
      if (st.user?.name) {
        studentNameMap.set(st.id, st.user.name);
      }
    });

    const formattedScans = scans.map(scan => ({
      id: scan.id,
      scanUuid: scan.scanUuid,
      studentId: scan.studentId,
      studentName: scan.studentId ? studentNameMap.get(scan.studentId) || null : null,
      rollNumber: scan.rollNumber,
      registrationNo: scan.registrationNo,
      examId: scan.examId,
      detectedSet: scan.detectedSet,
      totalScore: scan.totalScore,
      maxScore: scan.maxScore,
      confidenceScore: scan.confidenceScore,
      qualityScore: scan.qualityScore,
      status: scan.status,
      createdAt: scan.createdAt.toISOString(),
      rawAnswers: scan.rawAnswers,
      evaluatedAnswers: scan.evaluatedAnswers,
      quality: scan.quality,
      corrections: scan.corrections
    }));

    return NextResponse.json({
      success: true,
      scans: formattedScans,
      total: formattedScans.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list OMR scans' },
      { status: 500 }
    );
  }
}
