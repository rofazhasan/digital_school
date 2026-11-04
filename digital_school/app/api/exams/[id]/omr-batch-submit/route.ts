import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { calculateGrade } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await request.json();
    const { scans } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({ error: 'No scan items provided in payload' }, { status: 400 });
    }

    // 1. Fetch the exam details and all its sets
    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: true,
        class: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Create a new OMRScanSession for this batch
    const session = await prismadb.omrScanSession.create({
      data: {
        sessionName: `Batch Scan - ${exam.name} - ${new Date().toLocaleDateString('bn-BD')}`,
        examinerId: exam.createdById || 'SYSTEM',
        examId: exam.id,
        totalFiles: scans.length,
        processedFiles: scans.length,
        status: 'PUBLISHED',
        isCompleted: true,
        completedAt: new Date(),
        publishedAt: new Date(),
        publishedCount: scans.length,
      },
    }).catch(err => {
      console.warn('Could not create OMRScanSession (continuing):', err);
      return null;
    });

    const savedResults: any[] = [];
    let successCount = 0;

    for (const scan of scans) {
      const cleanRoll = String(scan.rollNumber || '').trim();
      const rawSet = String(scan.examSet || 'A').trim().toUpperCase();
      const cleanSet = rawSet.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim();

      // Find student by roll or registration number
      let student = await prismadb.studentProfile.findFirst({
        where: {
          OR: [
            { roll: cleanRoll },
            { roll: String(parseInt(cleanRoll, 10) || cleanRoll) },
            { registrationNo: cleanRoll },
          ],
        },
        include: { user: true },
      });

      // If student not found in global, try finding in class
      if (!student && exam.classId) {
        student = await prismadb.studentProfile.findFirst({
          where: {
            classId: exam.classId,
            OR: [
              { roll: cleanRoll },
              { registrationNo: cleanRoll },
            ],
          },
          include: { user: true },
        });
      }

      // If still not found, look for any student or create an emergency placeholder
      if (!student) {
        console.warn(`[OMR Batch] Student with Roll/Reg '${cleanRoll}' not found in DB. Creating placeholder profile.`);
        // Try finding or creating a placeholder user
        const dummyReg = `AUTO_OMR_${cleanRoll}_${Date.now().toString().slice(-4)}`;
        student = await prismadb.studentProfile.create({
          data: {
            roll: cleanRoll || '000000',
            registrationNo: dummyReg,
            guardianName: 'Guardian',
            guardianPhone: '01700000000',
            classId: exam.classId,
            user: {
              create: {
                name: `Student Roll ${cleanRoll || 'Unknown'}`,
                email: `student_${cleanRoll || uuidv4().slice(0, 6)}@school.local`,
                role: 'STUDENT',
                password: '$2a$10$dummyHashPlaceholderPasswordForOMRScanOnly',
              },
            },
          },
          include: { user: true },
        }).catch(err => {
          console.error(`[OMR Batch] Error creating emergency student profile:`, err);
          return null;
        });
      }

      if (!student) {
        console.error(`[OMR Batch] Skipped scan for roll ${cleanRoll}: Could not associate student.`);
        continue;
      }

      // Match exam set
      let matchedSet = exam.examSets.find((s: any) => {
        const sName = s.name.replace(/^(set|সেট)\s*[-:]?\s*/i, '').trim().toUpperCase();
        return sName === cleanSet || s.id === scan.examSetId;
      }) || exam.examSets[0] || null;

      const score = Number(scan.totalScore) || 0;
      const maxScore = Number(scan.maxScore) || exam.totalMarks || 100;
      const percentage = maxScore > 0 ? parseFloat(((score / maxScore) * 100).toFixed(2)) : 0;
      const grade = calculateGrade(percentage);

      // 1. Create OMRScan record for audit
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

      // 2. Upsert ExamStudentMap to persist set assignment
      if (matchedSet) {
        await prismadb.examStudentMap.upsert({
          where: { studentId_examId: { studentId: student.id, examId: exam.id } },
          update: { examSetId: matchedSet.id },
          create: { studentId: student.id, examId: exam.id, examSetId: matchedSet.id },
        }).catch(err => console.warn('Could not sync examStudentMap on OMR batch:', err));
      }

      // 3. Upsert ExamSubmission
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

      // 4. Upsert Result (Instant Dashboard Visibility!)
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

    // 5. Update Cohort Rankings in Result table
    try {
      const allResults = await prismadb.result.findMany({
        where: { examId: exam.id },
        orderBy: { total: 'desc' },
      });

      for (let i = 0; i < allResults.length; i++) {
        await prismadb.result.update({
          where: { id: allResults[i].id },
          data: { rank: i + 1 },
        });
      }
    } catch (rankErr) {
      console.warn('Could not recalculate cohort ranks:', rankErr);
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

