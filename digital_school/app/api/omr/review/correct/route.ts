import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeOMRResult } from '@/lib/omr/result-writer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scanId,
      questionNo,
      newOption,
      reason = 'Manual Teacher Override',
      userId = 'teacher-admin'
    } = body;

    if (!scanId || questionNo === undefined) {
      return NextResponse.json(
        { success: false, error: 'scanId and questionNo are required' },
        { status: 400 }
      );
    }

    const scan = await prisma.oMRScan.findUnique({
      where: { id: scanId },
      include: {
        answers: true
      }
    });

    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    // 1. Fetch Exam for Answer Key and Negative Marking Rules
    const exam = await prisma.exam.findUnique({
      where: { id: scan.examId },
      include: { examSets: true }
    });

    const negativeMark = exam?.mcqNegativeMarking || 0;
    const targetSet = exam?.examSets.find(s => s.id === scan.examSetId || s.name === scan.detectedSet) || exam?.examSets[0];

    let correctOption: string | null = null;
    if (targetSet?.questionsJson) {
      const qJson = targetSet.questionsJson as any;
      if (Array.isArray(qJson) && qJson[questionNo - 1]) {
        correctOption = qJson[questionNo - 1].correctOption !== undefined
          ? ['A', 'B', 'C', 'D'][qJson[questionNo - 1].correctOption]
          : qJson[questionNo - 1].answer;
      }
    } else if (exam?.generatedSet) {
      const gen = exam.generatedSet as any;
      if (Array.isArray(gen.mcq) && gen.mcq[questionNo - 1]) {
        correctOption = gen.mcq[questionNo - 1].answer || gen.mcq[questionNo - 1].correctOption;
      }
    }

    // 2. Update rawAnswers and evaluatedAnswers
    const rawAnswers = (scan.rawAnswers as Record<string, string>) || {};
    const oldOption = rawAnswers[questionNo] || null;
    rawAnswers[questionNo] = newOption || '';

    const evaluatedAnswers = (scan.evaluatedAnswers as Record<string, any>) || {};

    let isCorrect = false;
    let mark = 0;
    if (newOption && correctOption) {
      if (newOption.toUpperCase() === correctOption.toUpperCase()) {
        isCorrect = true;
        mark = 1.0;
      } else {
        isCorrect = false;
        mark = -Math.abs(negativeMark);
      }
    }

    evaluatedAnswers[questionNo] = {
      selected: newOption || null,
      correct: correctOption,
      isCorrect,
      mark
    };

    // 3. Recalculate total score
    let newTotalScore = 0;
    Object.values(evaluatedAnswers).forEach((ev: any) => {
      newTotalScore += (ev.mark || 0);
    });

    // 4. Update OMRScan record & Answer record
    const updatedScan = await prisma.oMRScan.update({
      where: { id: scanId },
      data: {
        rawAnswers,
        evaluatedAnswers,
        totalScore: newTotalScore,
        status: 'APPROVED', // Manually reviewed and approved
        answers: {
          upsert: {
            where: {
              id: scan.answers.find(a => a.questionNo === questionNo)?.id || 'temp-id'
            },
            create: {
              questionNo,
              selectedOption: newOption || null,
              correctOption,
              isCorrect,
              marksObtained: mark,
              confidence: 1.0,
              status: 'MANUALLY_OVERRIDDEN'
            },
            update: {
              selectedOption: newOption || null,
              isCorrect,
              marksObtained: mark,
              confidence: 1.0,
              status: 'MANUALLY_OVERRIDDEN'
            }
          }
        },
        corrections: {
          create: {
            correctedBy: userId,
            questionNo,
            previousValue: oldOption,
            newValue: newOption,
            reason
          }
        }
      },
      include: {
        answers: { orderBy: { questionNo: 'asc' } },
        quality: true,
        corrections: { orderBy: { createdAt: 'desc' } }
      }
    });

    // 5. Update official Result in database
    if (scan.studentId) {
      try {
        await writeOMRResult({
          scanId: scan.id,
          studentId: scan.studentId,
          examId: scan.examId,
          totalScore: newTotalScore,
          maxScore: scan.maxScore
        }, prisma);
      } catch (rErr: any) {
        console.error('[Review Correct] Result update error:', rErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      updatedScan
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record manual correction' },
      { status: 500 }
    );
  }
}
