import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scanUuid,
      templateId = 'C_11_12',
      templateVersion = 1,
      examId,
      examSetId,
      studentId,
      rollNumber,
      registrationNo,
      detectedSet,
      rawAnswers = {},
      confidenceScore = 1.0,
      qualityScore = 1.0,
      scanSessionId
    } = body;

    if (!scanUuid || !examId) {
      return NextResponse.json(
        { success: false, error: 'scanUuid and examId are required' },
        { status: 400 }
      );
    }

    // 1. Idempotency Check: Prevent duplicate submissions
    const existingScan = await prisma.oMRScan.findUnique({
      where: { scanUuid },
      include: { answers: true, quality: true }
    });

    if (existingScan) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        scanId: existingScan.id,
        reviewRequired: existingScan.status === 'REVIEW_REQUIRED',
        score: {
          totalScore: existingScan.totalScore,
          maxScore: existingScan.maxScore,
          evaluatedAnswers: existingScan.evaluatedAnswers
        }
      });
    }

    // 2. Fetch Exam & Questions / Answer Key from Database
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: true
      }
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 444 }
      );
    }

    // Resolve Student Profile if not provided directly
    let resolvedStudentId = studentId;
    if (!resolvedStudentId && (rollNumber || registrationNo)) {
      const student = await prisma.studentProfile.findFirst({
        where: {
          OR: [
            rollNumber ? { roll: rollNumber } : {},
            registrationNo ? { registrationNo } : {}
          ]
        }
      });
      if (student) {
        resolvedStudentId = student.id;
      }
    }

    // 3. Authoritative Scoring Calculation
    let targetSet: any = null;
    if (examSetId) {
      targetSet = exam.examSets.find(s => s.id === examSetId);
    } else if (detectedSet) {
      targetSet = exam.examSets.find((s: any) => s.setName === detectedSet || s.name === detectedSet || s.setLabel === detectedSet);
    }
    if (!targetSet && exam.examSets.length > 0) {
      targetSet = exam.examSets[0];
    }

    const questionKeyMap: Record<number, string> = {}; // qNo -> correctOption
    let maxMarks = 0;
    const negativeMark = exam.mcqNegativeMarking || exam.mcNegativeMarking || 0;

    if (targetSet && targetSet.questionsKey) {
      const keyObj = targetSet.questionsKey as Record<string, string>;
      Object.entries(keyObj).forEach(([qStr, correctOpt]) => {
        const qNo = parseInt(qStr, 10);
        if (!isNaN(qNo)) {
          questionKeyMap[qNo] = correctOpt;
          maxMarks += 1.0;
        }
      });
    } else if (exam.generatedSet) {
      const genSet = exam.generatedSet as any;
      if (Array.isArray(genSet.mcq)) {
        genSet.mcq.forEach((q: any, idx: number) => {
          questionKeyMap[idx + 1] = q.answer || q.correctOption || 'A';
          maxMarks += 1.0;
        });
      }
    }

    if (maxMarks === 0) maxMarks = 100; // Default to 100 questions

    let totalScore = 0;
    const evaluatedAnswers: Record<number, { selected: string | null; correct: string | null; isCorrect: boolean; mark: number }> = {};
    const answerRecords: any[] = [];
    let hasAmbiguousOrError = false;

    for (let qNo = 1; qNo <= 100; qNo++) {
      const selected = rawAnswers[qNo] || null;
      const correct = questionKeyMap[qNo] || null;

      let isCorrect = false;
      let mark = 0;

      if (selected && correct) {
        if (selected.toUpperCase() === correct.toUpperCase()) {
          isCorrect = true;
          mark = 1.0;
        } else {
          isCorrect = false;
          mark = -Math.abs(negativeMark);
        }
      } else if (selected && !correct) {
        mark = 0;
      } else {
        mark = 0; // Blank
      }

      totalScore += mark;

      evaluatedAnswers[qNo] = {
        selected,
        correct,
        isCorrect,
        mark
      };

      answerRecords.push({
        questionNo: qNo,
        selectedOption: selected,
        correctOption: correct,
        isCorrect,
        marksObtained: mark,
        confidence: selected ? 0.90 : 1.0,
        status: selected ? 'ONE_SELECTED' : 'BLANK'
      });
    }

    const reviewRequired = confidenceScore < 0.75 || qualityScore < 0.70 || hasAmbiguousOrError;
    const status = reviewRequired ? 'REVIEW_REQUIRED' : 'APPROVED';

    // 4. Save to Database
    const newScan = await prisma.oMRScan.create({
      data: {
        scanUuid,
        templateId,
        templateVersion,
        examId,
        examSetId: targetSet?.id || null,
        studentId: resolvedStudentId || null,
        rollNumber: rollNumber || null,
        registrationNo: registrationNo || null,
        detectedSet: targetSet?.setName || detectedSet || null,
        totalScore,
        maxScore: maxMarks,
        rawAnswers,
        evaluatedAnswers,
        confidenceScore,
        qualityScore,
        status,
        isAuthoritative: true,
        scanSessionId: scanSessionId || null,
        quality: {
          create: {
            blurScore: 100,
            brightnessScore: 180,
            contrastScore: 50,
            glareRatio: 0,
            perspectiveDistortion: 0,
            markerConfidence: 1.0,
            qrConfidence: 1.0
          }
        },
        answers: {
          create: answerRecords
        }
      }
    });

    // Record Sync Event
    await prisma.oMRSyncEvent.create({
      data: {
        idempotencyKey: scanUuid,
        scanUuid,
        status: 'SYNCED',
        syncedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      scanId: newScan.id,
      scanUuid,
      reviewRequired,
      score: {
        totalScore,
        maxScore: maxMarks,
        evaluatedAnswers
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record OMR submission' },
      { status: 500 }
    );
  }
}
