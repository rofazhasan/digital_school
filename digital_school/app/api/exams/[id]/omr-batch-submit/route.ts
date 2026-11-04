import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { calculateGrade } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Strict Zod schema for batch OMR submission payload
const omrScanItemSchema = z.object({
  sheetId: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  examSet: z.string().optional().default('A'),
  examSetId: z.string().optional(),
  totalScore: z.number(),
  maxScore: z.number().positive().optional(),
  rawAnswers: z.record(z.any()).optional(),
  answers: z.record(z.any()).optional(),
  evaluatedAnswers: z.record(z.any()).optional(),
  templateId: z.string().optional(),
  accuracyPercentage: z.number().optional(),
});

const omrBatchPayloadSchema = z.object({
  scans: z.array(omrScanItemSchema).min(1, 'At least one scan result must be provided in payload'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 1. Fetch the exam details with minimal egress
    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        totalMarks: true,
        classId: true,
        createdById: true,
        examSets: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 2. Initialize OMRScanSession for audit and batch tracking
    const session = await prismadb.omrScanSession.create({
      data: {
        sessionName: `Batch Scan - ${exam.name} - ${new Date().toLocaleDateString('bn-BD')}`,
        examinerId: exam.createdById || 'SYSTEM',
        examId: exam.id,
        totalFiles: scans.length,
        processedFiles: 0,
        status: 'PROCESSING',
        isCompleted: false,
      },
    }).catch(err => {
      console.warn('Could not initialize OMRScanSession (continuing):', err);
      return null;
    });

    // 3. Batch Pre-fetch all candidate profiles in a single query (eliminates N+1 egress bottleneck)
    const rollVariants = new Set<string>();
    scans.forEach(scan => {
      const rawRoll = String(scan.rollNumber || '').trim();
      const englishRoll = rawRoll.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const strippedRoll = String(parseInt(englishRoll, 10) || englishRoll);
      rollVariants.add(rawRoll);
      rollVariants.add(englishRoll);
      rollVariants.add(strippedRoll);
      // Zero-padded variants
      if (strippedRoll.length <= 7) {
        rollVariants.add(strippedRoll.padStart(6, '0'));
        rollVariants.add(strippedRoll.padStart(7, '0'));
      }
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fast O(1) in-memory lookup map
    const studentMap = new Map<string, typeof candidateProfiles[0]>();
    candidateProfiles.forEach(sp => {
      if (sp.roll) {
        studentMap.set(sp.roll, sp);
        const stripped = String(parseInt(sp.roll, 10) || sp.roll);
        studentMap.set(stripped, sp);
      }
      if (sp.registrationNo) {
        studentMap.set(sp.registrationNo, sp);
      }
    });

    const savedResults: any[] = [];
    let successCount = 0;

    // 4. Process cohort evaluations
    for (const scan of scans) {
      const rawRoll = String(scan.rollNumber || '').trim();
      const englishRoll = rawRoll.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const strippedRoll = String(parseInt(englishRoll, 10) || englishRoll);
      const cleanRoll = englishRoll;

      const rawSet = String(scan.examSet || 'A').trim().toUpperCase();
      const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim();

      // Resolve student from pre-fetched map
      let student = studentMap.get(cleanRoll) || studentMap.get(strippedRoll) || studentMap.get(rawRoll);

      // Create placeholder student if not found in DB
      if (!student) {
        try {
          const dummyReg = `AUTO_OMR_${cleanRoll}_${Date.now().toString().slice(-4)}`;
          const created = await prismadb.studentProfile.create({
            data: {
              roll: strippedRoll || cleanRoll || '000000',
              registrationNo: dummyReg,
              guardianName: 'Guardian',
              guardianPhone: '01700000000',
              classId: exam.classId,
              user: {
                create: {
                  name: `Student Roll ${strippedRoll || cleanRoll || 'Unknown'}`,
                  email: `student_${cleanRoll || uuidv4().slice(0, 6)}@school.local`,
                  role: 'STUDENT',
                  password: '$2a$10$dummyHashPlaceholderPasswordForOMRScanOnly',
                },
              },
            },
            select: {
              id: true,
              roll: true,
              registrationNo: true,
              classId: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          });
          student = created;
          studentMap.set(cleanRoll, created);
          studentMap.set(strippedRoll, created);
        } catch (createErr) {
          console.error(`[OMR Batch] Failed to create student for roll ${cleanRoll}:`, createErr);
        }
      }

      if (!student) {
        console.error(`[OMR Batch] Skipped scan for roll ${cleanRoll}: student could not be resolved.`);
        continue;
      }

      // Match exam set (supports 'A', 'Set A', 'A A', 'B A', etc.)
      const matchedSet = exam.examSets.find((s) => {
        const sName = s.name.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase();
        const firstToken = sName.split(/\s+/)[0];
        return (
          sName === cleanSet ||
          firstToken === cleanSet ||
          sName.startsWith(cleanSet) ||
          s.id === scan.examSetId
        );
      }) || exam.examSets[0] || null;

      const score = Number(scan.totalScore) || 0;
      const maxScore = Number(scan.maxScore) || exam.totalMarks || 100;
      const percentage = maxScore > 0 ? parseFloat(((score / maxScore) * 100).toFixed(2)) : 0;
      const grade = calculateGrade(percentage);

      // 4a. Create OMRScan audit record
      const scanUuid = scan.sheetId || uuidv4();
      const omrScan = await prismadb.oMRScan.upsert({
        where: { scanUuid },
        update: {
          totalScore: score,
          maxScore,
          rawAnswers: scan.rawAnswers || scan.answers || {},
          evaluatedAnswers: scan.evaluatedAnswers || {},
          detectedSet: cleanSet,
          status: 'SUCCESS',
          isAuthoritative: true,
          scanSessionId: session?.id || null,
        },
        create: {
          scanUuid,
          templateId: scan.templateId || 'medical_admission_100q',
          examId: exam.id,
          examSetId: matchedSet?.id || null,
          studentId: student.id,
          rollNumber: cleanRoll,
          detectedSet: cleanSet,
          totalScore: score,
          maxScore,
          rawAnswers: scan.rawAnswers || scan.answers || {},
          evaluatedAnswers: scan.evaluatedAnswers || {},
          confidenceScore: 98.5,
          qualityScore: 95.0,
          status: 'SUCCESS',
          isAuthoritative: true,
          scanSessionId: session?.id || null,
        },
      }).catch(err => {
        console.warn('Could not upsert OMRScan record (continuing):', err);
        return null;
      });

      // 4b. Sync ExamStudentMap
      if (matchedSet) {
        await prismadb.examStudentMap.upsert({
          where: { studentId_examId: { studentId: student.id, examId: exam.id } },
          update: { examSetId: matchedSet.id },
          create: { studentId: student.id, examId: exam.id, examSetId: matchedSet.id },
        }).catch(err => console.warn('Could not sync examStudentMap:', err));
      }

      // 4c. Upsert ExamSubmission
      const submission = await prismadb.examSubmission.upsert({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
        update: {
          answers: scan.answers || {},
          score,
          examSetId: matchedSet?.id || null,
          status: 'SUBMITTED',
          evaluatedAt: new Date(),
          objectiveStatus: 'SUBMITTED',
          objectiveSubmittedAt: new Date(),
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          examSetId: matchedSet?.id || null,
          answers: scan.answers || {},
          score,
          status: 'SUBMITTED',
          evaluatedAt: new Date(),
          objectiveStatus: 'SUBMITTED',
          objectiveSubmittedAt: new Date(),
        },
      });

      // 4d. Upsert Result (Immediate Dashboard Visibility)
      const result = await prismadb.result.upsert({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
        update: {
          mcqMarks: score,
          total: score,
          percentage,
          grade,
          isPublished: true,
          publishedAt: new Date(),
          examSubmissionId: submission.id,
          omrScanId: omrScan?.id || null,
        },
        create: {
          studentId: student.id,
          examId: exam.id,
          mcqMarks: score,
          total: score,
          percentage,
          grade,
          isPublished: true,
          publishedAt: new Date(),
          examSubmissionId: submission.id,
          omrScanId: omrScan?.id || null,
        },
      });

      successCount++;
      savedResults.push({
        rollNumber: cleanRoll,
        studentName: student.user?.name || `Roll ${cleanRoll}`,
        score,
        percentage,
        grade,
        submissionId: submission.id,
        resultId: result.id,
      });
    }

    // 5. Atomic Cohort Ranking (Single Postgres window function query instead of N round-trips)
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

    // 6. Update OMRScanSession final status
    if (session) {
      await prismadb.omrScanSession.update({
        where: { id: session.id },
        data: {
          processedFiles: successCount,
          publishedCount: successCount,
          status: 'PUBLISHED',
          isCompleted: true,
          completedAt: new Date(),
          publishedAt: new Date(),
        },
      }).catch(err => console.warn('Could not finalize OMRScanSession:', err));
    }

    return NextResponse.json({
      success: true,
      processedCount: successCount,
      results: savedResults,
      message: `সাফল্যের সাথে ${successCount} টি OMR খাতার মূল্যায়ন সম্পন্ন ও ডাটাবেসে সিঙ্ক হয়েছে!`,
    });
  } catch (error: any) {
    console.error('POST /api/exams/[id]/omr-batch-submit Error:', error);
    return NextResponse.json(
      { error: 'Failed to process OMR batch submission: ' + error.message },
      { status: 500 }
    );
  }
}
