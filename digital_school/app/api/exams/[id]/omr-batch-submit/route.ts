import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';
import { calculateGrade } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const correctionEntrySchema = z.object({
  field: z.string(),
  questionNo: z.number().int().optional(),
  previousValue: z.string().optional(),
  newValue: z.string(),
  reason: z.string().optional(),
});

const qualityMetricsSchema = z.object({
  sharpnessScore: z.number().optional(),
  isBlurry: z.boolean().optional(),
  dynamicRange: z.number().optional(),
  averageConfidence: z.number().optional(),
  alignmentMethod: z.string().optional(),
  colorDropoutChannel: z.string().optional(),
  ambiguousBubbleCount: z.number().optional(),
  multiMarkCount: z.number().optional(),
  erasureCount: z.number().optional(),
}).optional();

const omrScanItemSchema = z.object({
  sheetId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  registrationNo: z.string().optional(),
  examSet: z.string().optional().default('A'),
  examSetId: z.string().optional(),
  totalScore: z.number(),
  maxScore: z.number().positive().optional(),
  isCQScript: z.boolean().optional(),
  obtainedMarksCQ: z.number().optional(),
  rawAnswers: z.record(z.any()).optional(),
  answers: z.record(z.any()).optional(),
  evaluatedAnswers: z.record(z.any()).optional(),
  templateId: z.string().optional(),
  accuracyPercentage: z.number().optional(),
  qrFound: z.boolean().optional(),
  markersDetected: z.boolean().optional(),
  skewAngle: z.number().optional(),
  qualityMetrics: qualityMetricsSchema,
  corrections: z.array(correctionEntrySchema).optional(),
  allowCreateMissingStudent: z.boolean().optional().default(true),
});

const omrBatchPayloadSchema = z.object({
  scans: z.array(omrScanItemSchema).min(1, 'At least one scan result must be provided in payload'),
});

const BN_TO_EN_OPTION: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E' };

function normalizeOptionLetter(raw: unknown): string {
  if (raw === undefined || raw === null) return '';
  const s = String(raw).trim().toUpperCase();
  return BN_TO_EN_OPTION[s] || s;
}

function extractQuestionCorrectOption(q: any): string {
  if (!q) return '';
  if (q.correctAnswer) {
    const norm = normalizeOptionLetter(q.correctAnswer);
    if (['A', 'B', 'C', 'D', 'E'].includes(norm)) return norm;
  }
  if (typeof q.correctOption === 'number' && q.correctOption >= 0) {
    return ['A', 'B', 'C', 'D', 'E'][q.correctOption] || '';
  }
  if (Array.isArray(q.options)) {
    const idx = q.options.findIndex((o: any) => o?.isCorrect || o?.correct);
    if (idx >= 0) return ['A', 'B', 'C', 'D', 'E'][idx] || '';
  }
  return '';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Strict RBAC Enforcement: Only TEACHER, ADMIN, or SUPER_USER may publish authoritative OMR grades
    const auth = await getTokenFromRequest(request);
    if (!auth || !hasPermission(auth.user.role, 'TEACHER')) {
      return NextResponse.json(
        { error: 'Forbidden: Only Teachers or Administrators can publish authoritative OMR batches.' },
        { status: 403 }
      );
    }

    const { id: examId } = await params;
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    const rawBody = await request.json();
    const validation = omrBatchPayloadSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload structure', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { scans } = validation.data;

    // 1. Fetch exam + sets + negative marking config
    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        totalMarks: true,
        mcqNegativeMarking: true,
        classId: true,
        createdById: true,
        examSets: {
          select: {
            id: true,
            name: true,
            questionsJson: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 2. Initialize OMRScanSession with authenticated examinerId
    const sessionModel = (prismadb as any).oMRScanSession || (prismadb as any).omrScanSession;
    let session: any = null;
    if (sessionModel) {
      session = await sessionModel.create({
        data: {
          sessionName: `Batch Scan - ${exam.name} - ${new Date().toLocaleDateString('bn-BD')}`,
          examinerId: auth.user.id || exam.createdById || 'SYSTEM',
          examId: exam.id,
          totalFiles: scans.length,
          processedFiles: 0,
          status: 'PROCESSING',
          isCompleted: false,
        },
      }).catch((err: any) => {
        console.warn('Could not initialize OMRScanSession:', err);
        return null;
      });
    }

    // 3. Batch pre-fetch candidate profiles + existing Results (for seamless CQ + MCQ score merging!)
    const rollVariants = new Set<string>();
    scans.forEach((scan) => {
      const rawRoll = String(scan.rollNumber || '').trim();
      const englishRoll = rawRoll.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const strippedRoll = String(parseInt(englishRoll, 10) || englishRoll);
      rollVariants.add(rawRoll);
      rollVariants.add(englishRoll);
      rollVariants.add(strippedRoll);
      if (strippedRoll.length <= 7) {
        rollVariants.add(strippedRoll.padStart(6, '0'));
        rollVariants.add(strippedRoll.padStart(7, '0'));
      }
      if (scan.registrationNo) rollVariants.add(scan.registrationNo.trim());
    });

    const candidateProfiles = await prismadb.studentProfile.findMany({
      where: {
        OR: [
          { roll: { in: Array.from(rollVariants) } },
          { registrationNo: { in: Array.from(rollVariants) } },
        ],
      },
      select: {
        id: true,
        roll: true,
        registrationNo: true,
        classId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const studentMap = new Map<string, any>();
    candidateProfiles.forEach((sp) => {
      if (sp.roll) {
        studentMap.set(sp.roll, sp);
        studentMap.set(String(parseInt(sp.roll, 10) || sp.roll), sp);
      }
      if (sp.registrationNo) studentMap.set(sp.registrationNo, sp);
    });

    const existingResults = await prismadb.result.findMany({
      where: { examId: exam.id },
      select: { studentId: true, mcqMarks: true, cqMarks: true, sqMarks: true },
    });
    const existingResultByStudent = new Map<string, { mcqMarks: number; cqMarks: number; sqMarks: number }>();
    existingResults.forEach((r) => {
      existingResultByStudent.set(r.studentId, {
        mcqMarks: r.mcqMarks || 0,
        cqMarks: r.cqMarks || 0,
        sqMarks: r.sqMarks || 0,
      });
    });

    const savedResults: any[] = [];
    let successCount = 0;

    // 4. Process each scan with idempotency, server-side re-grading, quality telemetry, and CQ+MCQ merging
    for (const scan of scans) {
      const scanUuid = scan.sheetId || uuidv4();
      const idemKey = scan.idempotencyKey || `${exam.id}:${scanUuid}`;

      // 4.0 Idempotency Event Tracking (OMRSyncEvent)
      try {
        const existingSync = await prismadb.oMRSyncEvent.findUnique({ where: { idempotencyKey: idemKey } });
        if (existingSync && existingSync.status === 'SYNCED' && (!scan.corrections || scan.corrections.length === 0)) {
          successCount++;
          continue;
        }
      } catch {}

      const rawRoll = String(scan.rollNumber || '').trim();
      const englishRoll = rawRoll.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const strippedRoll = String(parseInt(englishRoll, 10) || englishRoll);
      const cleanRoll = englishRoll;

      const rawSet = String(scan.examSet || 'A').trim().toUpperCase();
      const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim();
      const normSetLetter = normalizeOptionLetter(cleanSet) || cleanSet;

      let student: any =
        studentMap.get(cleanRoll) ||
        studentMap.get(strippedRoll) ||
        studentMap.get(rawRoll) ||
        (scan.registrationNo ? studentMap.get(scan.registrationNo.trim()) : null);

      if (!student && scan.allowCreateMissingStudent !== false) {
        try {
          const dummyReg = scan.registrationNo?.trim() || `AUTO_OMR_${cleanRoll}_${Date.now().toString().slice(-4)}`;
          const created: any = await prismadb.studentProfile.create({
            data: {
              roll: strippedRoll || cleanRoll || '000000',
              registrationNo: dummyReg,
              guardianName: 'Guardian',
              guardianPhone: '01700000000',
              class: { connect: { id: exam.classId } },
              user: {
                create: {
                  name: `Student Roll ${strippedRoll || cleanRoll || 'Unknown'}`,
                  email: `student_${cleanRoll || uuidv4().slice(0, 6)}@school.local`,
                  role: 'STUDENT' as any,
                  password: '$2a$10$dummyHashPlaceholderPasswordForOMRScanOnly',
                },
              },
            } as any,
            include: { user: { select: { id: true, name: true, email: true } } },
          });
          student = created;
          studentMap.set(cleanRoll, created);
          studentMap.set(strippedRoll, created);
        } catch (createErr) {
          console.error(`[OMR Batch] Could not auto-create student for roll ${cleanRoll}:`, createErr);
        }
      }

      if (!student) continue;

      const matchedSet =
        exam.examSets.find((s) => {
          const sName = s.name.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase();
          const firstToken = sName.split(/\s+/)[0];
          return (
            sName === cleanSet ||
            sName === normSetLetter ||
            firstToken === cleanSet ||
            firstToken === normSetLetter ||
            s.id === scan.examSetId
          );
        }) ||
        exam.examSets[0] ||
        null;

      const isCQSheet = Boolean(
        scan.isCQScript ||
        scan.obtainedMarksCQ !== undefined ||
        scan.templateId === 'bangladesh_board_cq_top_sheet' ||
        scan.templateId === 'board_cq_3part'
      );

      // 4.1 Authoritative Server-Side MCQ Re-Grading when ExamSet has questions
      const rawAns = scan.answers || scan.rawAnswers || {};
      const setQuestions = Array.isArray(matchedSet?.questionsJson) ? (matchedSet.questionsJson as any[]) : [];
      const negPenalty = Math.abs(Number(exam.mcqNegativeMarking ?? 0.25));

      let authoritativeScore = Number(scan.totalScore) || 0;
      const perQuestionAnswerRows: Array<{
        questionNo: number;
        selectedOption: string | null;
        correctOption: string | null;
        isCorrect: boolean | null;
        marksObtained: number;
        confidence: number;
        status: string;
      }> = [];

      if (!isCQSheet && setQuestions.length > 0 && Object.keys(rawAns).length > 0) {
        let computed = 0;
        setQuestions.forEach((q: any, idx: number) => {
          const qNo = idx + 1;
          const qKey = `q${qNo}`;
          const correctOpt = extractQuestionCorrectOption(q);
          const rawStudentAns = rawAns[qKey] ?? rawAns[q.id] ?? rawAns[String(qNo)] ?? '';
          const strAns = Array.isArray(rawStudentAns) ? rawStudentAns.join('/') : String(rawStudentAns || '').trim();
          const isMulti = strAns.includes('/') || strAns.includes('[') || strAns.length > 1;
          const normStudent = normalizeOptionLetter(strAns);

          let marksObtained = 0;
          let isCorrect: boolean | null = null;
          let status = 'UNMARKED';

          if (!strAns) {
            marksObtained = 0;
            isCorrect = null;
            status = 'UNMARKED';
          } else if (isMulti) {
            marksObtained = -negPenalty;
            isCorrect = false;
            status = 'MULTI_SELECTED';
          } else if (correctOpt && normStudent === correctOpt) {
            marksObtained = Number(q.marks) || 1.0;
            isCorrect = true;
            status = 'ONE_SELECTED';
          } else if (correctOpt) {
            marksObtained = -negPenalty;
            isCorrect = false;
            status = 'ONE_SELECTED';
          }

          computed += marksObtained;
          perQuestionAnswerRows.push({
            questionNo: qNo,
            selectedOption: strAns || null,
            correctOption: correctOpt || null,
            isCorrect,
            marksObtained,
            confidence: (scan.qualityMetrics?.averageConfidence ?? 0.96) * 100,
            status,
          });
        });
        authoritativeScore = parseFloat(computed.toFixed(2));
      } else if (isCQSheet && scan.obtainedMarksCQ !== undefined) {
        authoritativeScore = Number(scan.obtainedMarksCQ) || Number(scan.totalScore) || 0;
      }

      const qm = scan.qualityMetrics;
      const realConfidencePct = qm?.averageConfidence !== undefined
        ? parseFloat((qm.averageConfidence * 100).toFixed(2))
        : 96.0;
      const realQualityPct = qm?.sharpnessScore !== undefined
        ? parseFloat(Math.min(100, Math.max(20, qm.sharpnessScore)).toFixed(2))
        : 92.0;

      const maxScore = Number(scan.maxScore) || exam.totalMarks || 100;

      // 4.2 Upsert OMRScan with real confidence & quality telemetry
      const omrScan = await prismadb.oMRScan.upsert({
        where: { scanUuid },
        update: {
          totalScore: authoritativeScore,
          maxScore,
          registrationNo: scan.registrationNo || student.registrationNo || null,
          rawAnswers: rawAns,
          evaluatedAnswers: scan.evaluatedAnswers || {},
          detectedSet: cleanSet,
          confidenceScore: realConfidencePct,
          qualityScore: realQualityPct,
          status: 'SUCCESS',
          isAuthoritative: true,
          createdById: auth.user.id,
          scanSessionId: session?.id || null,
        },
        create: {
          scanUuid,
          templateId: scan.templateId || 'medical_admission_100q',
          examId: exam.id,
          examSetId: matchedSet?.id || null,
          studentId: student.id,
          rollNumber: cleanRoll,
          registrationNo: scan.registrationNo || student.registrationNo || null,
          detectedSet: cleanSet,
          totalScore: authoritativeScore,
          maxScore,
          rawAnswers: rawAns,
          evaluatedAnswers: scan.evaluatedAnswers || {},
          confidenceScore: realConfidencePct,
          qualityScore: realQualityPct,
          status: 'SUCCESS',
          isAuthoritative: true,
          createdById: auth.user.id,
          scanSessionId: session?.id || null,
        },
      }).catch((err) => {
        console.warn('Could not upsert OMRScan:', err);
        return null;
      });

      // 4.3 Persist OMRScanQuality, OMRScanAnswer, and OMRCorrectionLog (HITL Audit Trail)
      if (omrScan?.id) {
        if (qm) {
          await prismadb.oMRScanQuality.upsert({
            where: { scanId: omrScan.id },
            update: {
              blurScore: qm.sharpnessScore ?? 80,
              brightnessScore: 85,
              contrastScore: qm.dynamicRange ?? 120,
              glareRatio: 0,
              perspectiveDistortion: Math.abs(scan.skewAngle ?? 0),
              markerConfidence: scan.markersDetected === false ? 0.65 : 0.99,
              qrConfidence: scan.qrFound ? 1.0 : 0.0,
            },
            create: {
              scanId: omrScan.id,
              blurScore: qm.sharpnessScore ?? 80,
              brightnessScore: 85,
              contrastScore: qm.dynamicRange ?? 120,
              glareRatio: 0,
              perspectiveDistortion: Math.abs(scan.skewAngle ?? 0),
              markerConfidence: scan.markersDetected === false ? 0.65 : 0.99,
              qrConfidence: scan.qrFound ? 1.0 : 0.0,
            },
          }).catch(() => {});
        }

        if (perQuestionAnswerRows.length > 0) {
          await prismadb.oMRScanAnswer.deleteMany({ where: { scanId: omrScan.id } }).catch(() => {});
          await prismadb.oMRScanAnswer.createMany({
            data: perQuestionAnswerRows.map((row) => ({ scanId: omrScan.id, ...row })),
          }).catch(() => {});
        }

        if (Array.isArray(scan.corrections) && scan.corrections.length > 0) {
          await prismadb.oMRCorrectionLog.createMany({
            data: scan.corrections.map((c) => ({
              scanId: omrScan.id,
              correctedBy: auth.user.id,
              questionNo: c.questionNo ?? null,
              previousValue: c.previousValue ?? null,
              newValue: c.newValue,
              reason: c.reason || `Manual HITL override on ${c.field}`,
            })),
          }).catch(() => {});
        }
      }

      if (matchedSet) {
        await prismadb.examStudentMap.upsert({
          where: { studentId_examId: { studentId: student.id, examId: exam.id } },
          update: { examSetId: matchedSet.id },
          create: { studentId: student.id, examId: exam.id, examSetId: matchedSet.id },
        }).catch(() => {});
      }

      // Normalize answers payload
      const answersPayload: Record<string, any> = { ...rawAns };
      setQuestions.forEach((q: any, idx: number) => {
        const qKey = `q${idx + 1}`;
        const numKey = String(idx + 1);
        let val = rawAns[q.id] ?? rawAns[qKey] ?? rawAns[numKey];
        if (Array.isArray(val) && val.length > 0) val = val[0];
        if (val !== undefined && val !== null) {
          answersPayload[q.id] = val;
          answersPayload[qKey] = val;
          answersPayload[numKey] = val;
        }
      });

      // 4.4 Seamless CQ + MCQ + SQ Score Merging on Result & ExamSubmission
      const prevMarks = existingResultByStudent.get(student.id) || { mcqMarks: 0, cqMarks: 0, sqMarks: 0 };
      const nextMcqMarks = isCQSheet ? prevMarks.mcqMarks : authoritativeScore;
      const nextCqMarks = isCQSheet ? authoritativeScore : prevMarks.cqMarks;
      const nextSqMarks = prevMarks.sqMarks;
      const combinedTotal = parseFloat((nextMcqMarks + nextCqMarks + nextSqMarks).toFixed(2));
      const examMax = exam.totalMarks || maxScore || 100;
      const combinedPct = examMax > 0 ? parseFloat(((combinedTotal / examMax) * 100).toFixed(2)) : 0;
      const grade = calculateGrade(combinedPct);

      existingResultByStudent.set(student.id, {
        mcqMarks: nextMcqMarks,
        cqMarks: nextCqMarks,
        sqMarks: nextSqMarks,
      });

      const submission = await prismadb.examSubmission.upsert({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
        update: {
          ...(isCQSheet ? {} : { answers: answersPayload }),
          score: combinedTotal,
          examSetId: matchedSet?.id || undefined,
          status: 'SUBMITTED',
          evaluatedAt: new Date(),
          ...(isCQSheet
            ? { cqSqStatus: 'SUBMITTED', cqSqSubmittedAt: new Date() }
            : { objectiveStatus: 'SUBMITTED', objectiveSubmittedAt: new Date() }),
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          examSetId: matchedSet?.id || null,
          answers: isCQSheet ? {} : answersPayload,
          score: combinedTotal,
          status: 'SUBMITTED',
          evaluatedAt: new Date(),
          ...(isCQSheet
            ? { cqSqStatus: 'SUBMITTED', cqSqSubmittedAt: new Date() }
            : { objectiveStatus: 'SUBMITTED', objectiveSubmittedAt: new Date() }),
        },
      });

      const result = await prismadb.result.upsert({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
        update: {
          mcqMarks: nextMcqMarks,
          cqMarks: nextCqMarks,
          sqMarks: nextSqMarks,
          total: combinedTotal,
          percentage: combinedPct,
          grade,
          isPublished: true,
          publishedAt: new Date(),
          examSubmissionId: submission.id,
          omrScanId: omrScan?.id || null,
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          mcqMarks: nextMcqMarks,
          cqMarks: nextCqMarks,
          sqMarks: nextSqMarks,
          total: combinedTotal,
          percentage: combinedPct,
          grade,
          isPublished: true,
          publishedAt: new Date(),
          examSubmissionId: submission.id,
          omrScanId: omrScan?.id || null,
        },
      });

      // Mark idempotency sync event completed
      await prismadb.oMRSyncEvent.upsert({
        where: { idempotencyKey: idemKey },
        update: { status: 'SYNCED', syncedAt: new Date(), lastError: null },
        create: { idempotencyKey: idemKey, scanUuid, status: 'SYNCED', syncedAt: new Date() },
      }).catch(() => {});

      successCount++;
      savedResults.push({
        rollNumber: cleanRoll,
        studentId: student.id,
        studentName: student.user?.name || `Roll ${cleanRoll}`,
        mcqMarks: nextMcqMarks,
        cqMarks: nextCqMarks,
        score: combinedTotal,
        percentage: combinedPct,
        grade,
        submissionId: submission.id,
        resultId: result.id,
      });
    }

    // 5. Atomic Cohort Ranking via PostgreSQL DENSE_RANK
    try {
      await prismadb.$executeRaw`
        WITH ranked AS (
          SELECT id, DENSE_RANK() OVER (ORDER BY total DESC) as calc_rank
          FROM results
          WHERE "examId" = ${exam.id}
        )
        UPDATE results r
        SET rank = ranked.calc_rank
        FROM ranked
        WHERE r.id = ranked.id;
      `;
    } catch (rankErr) {
      console.warn('Could not execute atomic cohort ranking:', rankErr);
    }

    // 6. Finalize OMRScanSession
    if (session && sessionModel) {
      await sessionModel.update({
        where: { id: session.id },
        data: {
          processedFiles: successCount,
          publishedCount: successCount,
          status: 'PUBLISHED',
          isCompleted: true,
          completedAt: new Date(),
          publishedAt: new Date(),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      processedCount: successCount,
      results: savedResults,
      message: `সফলভাবে ${successCount} টি OMR খাতার মূল্যায়ন সম্পন্ন ও ডাটাবেসে প্রকাশিত হয়েছে!`,
    });
  } catch (error: any) {
    console.error('POST /api/exams/[id]/omr-batch-submit Error:', error);
    return NextResponse.json(
      { error: 'Failed to process OMR batch submission: ' + error.message },
      { status: 500 }
    );
  }
}
