import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';
import { calculateGrade } from '@/lib/utils';
import {
  buildRosterIndex,
  matchStudentByRollOrReg,
  sanitizeNumericId,
} from '@/lib/omr/studentIdentityMatcher';
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
  /** When true, publishes Results immediately to Student Dashboard (/exams/online). When false, holds in /exams/evaluations for Superadmin Release. */
  autoRelease: z.boolean().optional().default(false),
  /** For 500+ chunked uploads: set true on intermediate chunks, false on final chunk so DENSE_RANK runs once atomically. */
  skipRanking: z.boolean().optional().default(false),
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

    const { scans, autoRelease, skipRanking } = validation.data;

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

    // 3. Pre-fetch full class roster + matching roll/reg profiles for fault-tolerant Roll/Reg recovery
    const rollVariants = new Set<string>();
    scans.forEach((scan) => {
      const rInfo = sanitizeNumericId(scan.rollNumber);
      const regInfo = sanitizeNumericId(scan.registrationNo);
      if (rInfo.digits) {
        rollVariants.add(rInfo.digits);
        rollVariants.add(rInfo.stripped);
        if (rInfo.stripped.length <= 7) {
          rollVariants.add(rInfo.stripped.padStart(6, '0'));
          rollVariants.add(rInfo.stripped.padStart(7, '0'));
        }
      }
      if (regInfo.digits) {
        rollVariants.add(regInfo.digits);
        rollVariants.add(regInfo.stripped);
      }
    });

    const candidateProfiles = await prismadb.studentProfile.findMany({
      where: {
        OR: [
          ...(exam.classId ? [{ classId: exam.classId }] : []),
          ...(rollVariants.size > 0
            ? [
                { roll: { in: Array.from(rollVariants) } },
                { registrationNo: { in: Array.from(rollVariants) } },
              ]
            : []),
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

    const rosterIndex = buildRosterIndex(candidateProfiles);

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

      // Strict numeric-only Roll & Registration sanitization + 3-tier fault-tolerant recovery
      const matchRes = matchStudentByRollOrReg(rosterIndex, scan.rollNumber, scan.registrationNo);
      const cleanRoll = matchRes.sanitizedRoll || '000000';
      const cleanReg = matchRes.sanitizedReg || undefined;

      const rawSet = String(scan.examSet || 'A').trim().toUpperCase();
      const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim();
      const normSetLetter = normalizeOptionLetter(cleanSet) || cleanSet;

      let student: any = matchRes.student;
      let resolvedMatchMethod: string = matchRes.matchMethod;

      if (!student && scan.allowCreateMissingStudent !== false) {
        try {
          const numericRollForCreate = cleanRoll.replace(/\D/g, '') || String(Date.now()).slice(-6);
          const numericRegForCreate =
            (cleanReg && cleanReg.replace(/\D/g, '')) ||
            `${new Date().getFullYear()}${numericRollForCreate.padStart(6, '0')}`;
          const created: any = await prismadb.studentProfile.create({
            data: {
              roll: numericRollForCreate,
              registrationNo: numericRegForCreate,
              guardianName: 'Guardian',
              guardianPhone: '01700000000',
              class: { connect: { id: exam.classId } },
              user: {
                create: {
                  name: `Student Roll ${numericRollForCreate}`,
                  email: `student_${numericRollForCreate}_${uuidv4().slice(0, 4)}@school.local`,
                  role: 'STUDENT' as any,
                  password: '$2a$10$dummyHashPlaceholderPasswordForOMRScanOnly',
                },
              },
            } as any,
            include: { user: { select: { id: true, name: true, email: true } } },
          });
          student = created;
          resolvedMatchMethod = 'AUTO_CREATED';
          rosterIndex.byRollExact.set(numericRollForCreate, created);
          rosterIndex.byRegExact.set(numericRegForCreate, created);
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

      const submissionNote = [
        isCQSheet ? 'OMR_OFFLINE_CQ_SCAN' : 'OMR_OFFLINE_MCQ_SCAN',
        matchRes.note ? `| ${matchRes.note}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const submission = await prismadb.examSubmission.upsert({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
        update: {
          ...(isCQSheet ? {} : { answers: answersPayload }),
          score: combinedTotal,
          examSetId: matchedSet?.id || undefined,
          status: 'SUBMITTED',
          evaluatedAt: new Date(),
          evaluatorNotes: submissionNote,
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
          evaluatorNotes: submissionNote,
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
          isPublished: autoRelease,
          publishedAt: autoRelease ? new Date() : null,
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
          isPublished: autoRelease,
          publishedAt: autoRelease ? new Date() : null,
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
        registrationNo: cleanReg || student.registrationNo || null,
        matchMethod: resolvedMatchMethod,
        matchNote: matchRes.note || null,
        studentId: student.id,
        studentName: student.user?.name || `Roll ${cleanRoll}`,
        mcqMarks: nextMcqMarks,
        cqMarks: nextCqMarks,
        score: combinedTotal,
        percentage: combinedPct,
        grade,
        isPublished: autoRelease,
        submissionId: submission.id,
        resultId: result.id,
      });
    }

    // 5. Atomic Cohort Ranking via PostgreSQL DENSE_RANK (run once on final chunk for 500+ speed)
    if (!skipRanking) {
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
    }

    // 6. Finalize OMRScanSession
    if (session && sessionModel) {
      await sessionModel.update({
        where: { id: session.id },
        data: {
          processedFiles: successCount,
          publishedCount: autoRelease ? successCount : 0,
          status: autoRelease ? 'PUBLISHED' : 'EVALUATED',
          isCompleted: true,
          completedAt: new Date(),
          publishedAt: autoRelease ? new Date() : null,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      processedCount: successCount,
      autoRelease,
      results: savedResults,
      message: autoRelease
        ? `সফলভাবে ${successCount} টি OMR খাতার ফলাফল প্রকাশিত (Auto-Released) হয়েছে — শিক্ষার্থীরা এখন /exams/online-এ দেখতে পারবে!`
        : `সফলভাবে ${successCount} টি OMR সাবমিশন সংরক্ষিত হয়েছে — সুপারঅ্যাডমিন /exams/evaluations থেকে রিলিজ করতে পারবেন!`,
    });
  } catch (error: any) {
    console.error('POST /api/exams/[id]/omr-batch-submit Error:', error);
    return NextResponse.json(
      { error: 'Failed to process OMR batch submission: ' + error.message },
      { status: 500 }
    );
  }
}
