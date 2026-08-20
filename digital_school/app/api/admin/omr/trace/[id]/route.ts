import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ExamSetResolver } from '@/lib/omr/exam-set-resolver';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    // Ensure teacher / admin / superUser access
    const userRole = currentUser?.role;
    const isAuthorized = userRole === 'SUPER_USER' || userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'SHARED';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Administrator or Teacher access required.' }, { status: 403 });
    }

    // 1. Resolve OMRScan by id or scanUuid
    const scan = await db.oMRScan.findFirst({
      where: {
        OR: [
          { id },
          { scanUuid: id }
        ]
      },
      include: {
        quality: true,
        answers: { orderBy: { questionNo: 'asc' } },
        corrections: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: `OMR Scan '${id}' not found.` }, { status: 404 });
    }

    // 2. Fetch Exam & ExamSets
    const exam = await db.exam.findUnique({
      where: { id: scan.examId },
      include: {
        class: { select: { id: true, name: true, section: true } },
        examSets: true
      }
    });

    // 3. Resolve Target ExamSet
    let targetSet: any = null;
    if (scan.examSetId) {
      targetSet = exam?.examSets.find(s => s.id === scan.examSetId);
    } else if (scan.detectedSet) {
      targetSet = exam?.examSets.find(s => s.name === scan.detectedSet);
    }
    if (!targetSet && exam?.examSets && exam.examSets.length > 0) {
      targetSet = exam.examSets[0];
    }

    // Parse Canonical QuestionSet
    const canonicalQuestionSet = targetSet
      ? ExamSetResolver.parseRawQuestionsJson(targetSet.questionsJson, targetSet.id, targetSet.name, scan.examId)
      : null;

    // 4. Resolve Student Identity
    let studentProfile: any = null;
    if (scan.studentId) {
      studentProfile = await db.studentProfile.findUnique({
        where: { id: scan.studentId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, isActive: true } },
          class: { select: { id: true, name: true, section: true } }
        }
      });
    }

    // 5. Fetch Canonical ExamSubmission
    let submission: any = null;
    if (scan.studentId && scan.examId) {
      submission = await db.examSubmission.findUnique({
        where: {
          studentId_examId: {
            studentId: scan.studentId,
            examId: scan.examId
          }
        }
      });
    }

    // 6. Fetch Official Result
    let result: any = null;
    if (scan.studentId && scan.examId) {
      result = await db.result.findFirst({
        where: {
          studentId: scan.studentId,
          examId: scan.examId
        }
      });
    }

    // 7. Reconcile 100-Question Trace Lineage (Question Text, Selected Bubble, Correct Key, Awarded Mark, Explanation)
    const questionTrace = (canonicalQuestionSet?.questions || []).map((q) => {
      const qNo = q.sequenceNumber;
      const physicalAnswer = scan.answers.find(a => a.questionNo === qNo);
      const studentSubmissionValue = submission?.answers ? (submission.answers as any)[q.id] : undefined;
      const awardedMarks = submission?.answers ? (submission.answers as any)[`${q.id}_marks`] : undefined;

      const selectedOption = physicalAnswer?.selectedOption || (typeof studentSubmissionValue === 'string' ? studentSubmissionValue : null);
      let isCorrect = physicalAnswer?.isCorrect;
      if (isCorrect === undefined && awardedMarks !== undefined) {
        isCorrect = awardedMarks > 0;
      }

      return {
        sequenceNumber: qNo,
        questionId: q.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctOption: q.correctOption,
        explanation: q.explanation,
        physicalInput: selectedOption,
        bubbleConfidence: physicalAnswer?.confidence || scan.confidenceScore,
        status: physicalAnswer?.status || (selectedOption ? 'ONE_SELECTED' : 'BLANK'),
        canonicalValue: studentSubmissionValue,
        awardedMarks: awardedMarks !== undefined ? awardedMarks : (physicalAnswer?.marksObtained || 0),
        expectedMarks: q.marks,
        isCorrect: isCorrect || false
      };
    });

    // 8. Construct 13-Dimension Traceability Payload
    const tracePayload = {
      scan: {
        id: scan.id,
        scanUuid: scan.scanUuid,
        templateId: scan.templateId,
        templateVersion: scan.templateVersion,
        scannerVersion: '2.0.0 (Auto-Capture Zero-Manual)',
        scanTime: scan.createdAt,
        status: scan.status,
        confidenceScore: scan.confidenceScore,
        qualityScore: scan.qualityScore,
        isAuthoritative: scan.isAuthoritative,
        quality: scan.quality
      },
      qr: {
        raw: scan.qrCode || `exam:${scan.examId}|set:${targetSet?.name || 'A'}|class:${exam?.class?.id || ''}`,
        decoded: {
          examId: scan.examId,
          examSetId: targetSet?.id || scan.examSetId,
          setName: targetSet?.name || scan.detectedSet || 'A',
          classId: exam?.class?.id,
          className: exam?.class?.name,
          section: exam?.class?.section
        }
      },
      student: {
        id: studentProfile?.id || scan.studentId || 'UNKNOWN',
        name: studentProfile?.user?.name || 'Unidentified Candidate',
        email: studentProfile?.user?.email || null,
        image: studentProfile?.user?.image || null,
        roll: studentProfile?.roll || scan.rollNumber || 'N/A',
        registrationNo: studentProfile?.registrationNo || scan.registrationNo || 'N/A',
        class: studentProfile?.class?.name || exam?.class?.name || 'Class 12',
        section: studentProfile?.class?.section || exam?.class?.section || 'A'
      },
      exam: {
        id: exam?.id || scan.examId,
        name: exam?.name || 'Academic Examination',
        subject: exam?.subject || 'Physics',
        totalMarks: exam?.totalMarks || scan.maxScore || 100,
        passMarks: exam?.passMarks || 33,
        negativeMarking: exam?.mcqNegativeMarking || 0.25,
        type: exam?.type || 'OFFLINE'
      },
      examSet: {
        id: targetSet?.id || scan.examSetId || 'set-default',
        name: targetSet?.name || scan.detectedSet || 'A',
        totalQuestions: canonicalQuestionSet?.totalQuestions || questionTrace.length,
        totalObjectiveMarks: canonicalQuestionSet?.totalObjectiveMarks || 100
      },
      canonicalSubmission: {
        id: submission?.id || null,
        status: submission?.status || 'SUBMITTED',
        score: submission?.score || scan.totalScore || 0,
        submittedAt: submission?.objectiveSubmittedAt || submission?.createdAt || scan.createdAt
      },
      evaluation: {
        totalScore: result?.total ?? scan.totalScore ?? 0,
        maxScore: exam?.totalMarks ?? 100,
        percentage: result?.percentage ?? (exam?.totalMarks ? Math.round((scan.totalScore / exam.totalMarks) * 100) : 0),
        grade: result?.grade ?? 'A',
        rank: result?.rank ?? null,
        isPublished: result?.isPublished ?? true
      },
      result: {
        id: result?.id || null,
        studentResultUrl: `/exams/results/${scan.examId}`
      },
      questions: questionTrace,
      corrections: scan.corrections
    };

    return NextResponse.json({
      success: true,
      trace: tracePayload
    });

  } catch (error: any) {
    console.error('[OMRTraceAPI] Error fetching trace lineage:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch scan trace lineage.' }, { status: 500 });
  }
}
