import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { OMRSubmissionAdapter, OMRScanResult } from '@/lib/omr/omr-submission-adapter';
import { evaluateSubmission } from '@/lib/exam-logic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scanUuid,
      qrPayload,
      examId,
      examSetId,
      studentId,
      rollNumber,
      registrationNo,
      detectedSet,
      physicalAnswers = [],
      rawAnswers = {},
      confidenceScore = 1.0,
      qualityScore = 1.0,
      scanSessionId
    } = body;

    const scanId = scanUuid || body.scanId;

    if (!scanId) {
      return NextResponse.json(
        { success: false, error: 'scanUuid is required' },
        { status: 400 }
      );
    }

    // 1. Idempotency Check: Prevent duplicate submissions
    const existingScan = await db.oMRScan.findUnique({
      where: { scanUuid: scanId },
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

    // 2. Prepare normalized physical answers array
    let normalizedPhysicalAnswers = physicalAnswers;
    if ((!normalizedPhysicalAnswers || normalizedPhysicalAnswers.length === 0) && rawAnswers) {
      normalizedPhysicalAnswers = Object.entries(rawAnswers).map(([k, v]) => ({
        questionNo: parseInt(k, 10),
        selectedOption: typeof v === 'string' ? v : (v as any)?.selectedOption || null,
        confidence: typeof v === 'object' ? (v as any)?.confidence : 1.0,
        status: typeof v === 'object' ? (v as any)?.status : (v ? 'ONE_SELECTED' : 'BLANK')
      }));
    }

    const scanResultInput: OMRScanResult = {
      scanId,
      qrPayload: qrPayload || { examId, examSetId, setId: examSetId, classId: body.classId },
      roll: rollNumber || body.roll,
      registration: registrationNo || body.registration,
      detectedSet,
      physicalAnswers: normalizedPhysicalAnswers,
      confidence: confidenceScore,
      scannerVersion: body.scannerVersion || '2.0.0',
      templateVersion: body.templateVersion || 1,
      scannedAt: body.scannedAt || new Date()
    };

    // 3. Run OMRSubmissionAdapter Bridge
    const adaptResult = await OMRSubmissionAdapter.adapt(scanResultInput);

    if (!adaptResult.success || !adaptResult.canonicalSubmission) {
      // Record failed scan for teacher audit
      const failedScan = await db.oMRScan.create({
        data: {
          scanUuid: scanId,
          templateId: body.templateId || 'C_11_12',
          examId: examId || 'unknown',
          examSetId: examSetId || null,
          studentId: studentId || null,
          rollNumber: rollNumber || null,
          registrationNo: registrationNo || null,
          detectedSet: detectedSet || null,
          confidenceScore,
          qualityScore,
          status: 'FAILED',
          rawAnswers: rawAnswers as any
        }
      });

      return NextResponse.json({
        success: false,
        scanId: failedScan.id,
        status: 'FAILED',
        error: adaptResult.error || 'Failed to adapt physical scan.'
      }, { status: 422 });
    }

    const { canonicalSubmission, identity, mappingResult } = adaptResult;

    // 4. Load full Exam record
    const exam = await db.exam.findUnique({
      where: { id: canonicalSubmission.examId },
      include: { examSets: true }
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: `Exam '${canonicalSubmission.examId}' not found.` },
        { status: 404 }
      );
    }

    // 5. Upsert Canonical ExamSubmission (The same table used by online exams)
    const existingSub = await db.examSubmission.findUnique({
      where: {
        studentId_examId: {
          studentId: canonicalSubmission.studentId,
          examId: canonicalSubmission.examId
        }
      }
    });

    const submission = await db.examSubmission.upsert({
      where: {
        studentId_examId: {
          studentId: canonicalSubmission.studentId,
          examId: canonicalSubmission.examId
        }
      },
      update: {
        answers: canonicalSubmission.answers as any,
        examSetId: canonicalSubmission.examSetId,
        status: 'SUBMITTED',
        objectiveStatus: 'SUBMITTED',
        objectiveSubmittedAt: existingSub?.objectiveSubmittedAt || new Date()
      },
      create: {
        studentId: canonicalSubmission.studentId,
        examId: canonicalSubmission.examId,
        examSetId: canonicalSubmission.examSetId,
        answers: canonicalSubmission.answers as any,
        status: 'SUBMITTED',
        objectiveStatus: 'SUBMITTED',
        objectiveSubmittedAt: new Date()
      }
    });

    // 6. Invoke Authoritative Server-Side Evaluation
    const evalResult = await evaluateSubmission(submission, exam as any, exam.examSets as any, true);
    const finalScore = typeof evalResult?.totalScore === 'number' ? evalResult.totalScore : (submission.score || 0);

    // 7. Persist Traceable OMRScan record linked to submission
    const scanStatus = adaptResult.status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'APPROVED';

    const scanRecord = await db.oMRScan.create({
      data: {
        scanUuid: scanId,
        templateId: body.templateId || 'C_11_12',
        examId: canonicalSubmission.examId,
        examSetId: canonicalSubmission.examSetId,
        studentId: canonicalSubmission.studentId,
        rollNumber: identity.rollNumber || null,
        registrationNo: identity.registrationNo || null,
        detectedSet: canonicalSubmission.metadata.detectedSet || null,
        totalScore: finalScore,
        maxScore: exam.totalMarks || 100,
        confidenceScore,
        qualityScore,
        status: scanStatus,
        isAuthoritative: true,
        scanSessionId: scanSessionId || null,
        rawAnswers: rawAnswers as any,
        evaluatedAnswers: canonicalSubmission.answers as any,
        answers: {
          create: mappingResult.details.map(d => ({
            questionNo: d.questionNo,
            selectedOption: d.physicalInput,
            marksObtained: d.expectedMarks,
            confidence: d.confidence,
            status: d.status
          }))
        }
      }
    });

    // Link Result to omrScanId for paper traceability
    await db.result.updateMany({
      where: {
        studentId: canonicalSubmission.studentId,
        examId: canonicalSubmission.examId
      },
      data: {
        omrScanId: scanRecord.id
      }
    });

    return NextResponse.json({
      success: true,
      scanId: scanRecord.id,
      submissionId: submission.id,
      reviewRequired: scanStatus === 'REVIEW_REQUIRED',
      warnings: adaptResult.warnings,
      score: {
        totalScore: finalScore,
        maxScore: exam.totalMarks || 100,
        grade: evalResult?.grade,
        percentage: evalResult?.percentage
      }
    });

  } catch (error: any) {
    console.error('[OMRSubmitAPI] Error processing OMR submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
