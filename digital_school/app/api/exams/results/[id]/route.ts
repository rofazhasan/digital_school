import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculatePercentage } from '@/lib/utils';
import { evaluateMCQuestion } from '@/lib/evaluation/mcEvaluation';
import { evaluateINTQuestion } from '@/lib/evaluation/intEvaluation';
import { evaluateARQuestion } from '@/lib/evaluation/arEvaluation';
import { evaluateMTFQuestion } from '@/lib/evaluation/mtfEvaluation';
import { Prisma, QuestionType } from '@prisma/client';

interface ProcessedQuestion {
  id: string;
  type: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer: any;
  studentAnswerImages: string[];
  drawingData: {
    imageData: string;
    originalImagePath: string;
  } | null;
  allDrawings: {
    imageIndex: number;
    imageData: string;
    originalImagePath: string;
  }[];
  options: any[];
  modelAnswer: string;
  explanation: string;
  subQuestions: any[];
  feedback: string;
  images: string[];
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: string[];
  rightColumn?: string[];
  matches?: Record<string, number>;
  correctAnswer?: any;
  tolerance?: number;
}

// export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;

    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { id: token.user.id },
      include: {
        studentProfile: {
          include: {
            class: true
          }
        }
      }
    });

    console.log(`[ResultAPI] User: ${token.user.email} (${token.user.role})`);

    if (!user) {
      console.log(`[ResultAPI] User not found in DB`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.studentProfile) {
      console.log(`[ResultAPI] Student profile not found for user ${user.id}`);
      // Allow admins to view if they really want, but this API is structure for student view. 
      // For now, strict 404 is correct for the logic, but let's log it.
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Fetch exam
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        class: true // Include class to get class name
      }
    });

    if (!exam) {
      console.log(`[ResultAPI] Exam not found: ${examId}`);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Fetch submission with exam set and drawings
    // -------------------------------------------------------------------------
    // LATE AUTO-RELEASE CHECK
    // -------------------------------------------------------------------------
    let isMCQOnly = false;
    try {
      const { isMCQOnlyExam } = await import("@/lib/exam-logic");
      // Need to pass exam sets, but here we fetched exam with class.
      // We need to fetch exam sets or rely on legacy check if not available.
      // Let's fetch sets quickly or use the single set if available (though fetch here is expensive)
      // Actually, for results page we might not want to fetch all sets if not necessary.
      // But we can check CQ/SQ counts first, and if 0, then we are good.
      // If non-zero, we might be blocked.
      // For Safety: Just use the imported function which handles the exam object properties first.

      // We need to fetch exam sets if we want robust check.
      const examSetsForCheck = await db.examSet.findMany({ where: { examId: exam.id } });
      isMCQOnly = isMCQOnlyExam(exam, examSetsForCheck);
    } catch (e) {
      isMCQOnly = ((exam.cqTotalQuestions === 0 || !exam.cqTotalQuestions) &&
        (exam.sqTotalQuestions === 0 || !exam.sqTotalQuestions));
    }

    const isTimeOver = (new Date() > new Date(exam.endTime));

    if (isMCQOnly && isTimeOver) {
      // Check if results are likely published (check current user's result or any result)
      // We'll check if any result exists and is published to avoid redundant calls
      const sampleResult = await db.result.findFirst({
        where: { examId: exam.id },
        select: { isPublished: true }
      });

      if (!sampleResult || !sampleResult.isPublished) {
        try {
          // Dynamically import to avoid circular dependencies
          const { finalizeAndReleaseExam } = await import("@/lib/exam-logic");
          console.log(`[ResultAPI] Time over and results not published. Triggering auto-release for ${exam.id}`);
          await finalizeAndReleaseExam(exam.id);
        } catch (e) {
          console.error("[ResultAPI] Error in late auto-release:", e);
        }
      }
    }
    // -------------------------------------------------------------------------

    const submission = await db.examSubmission.findFirst({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      },
      include: {
        drawings: true
      }
    });

    if (!submission) {
      console.log(`[ResultAPI] Submission not found for Exam: ${examId}, Student: ${user.studentProfile.id}`);
      return NextResponse.json({ error: 'No submission found for this exam' }, { status: 404 });
    }

    // Fetch the student's assigned exam set
    const studentExamMap = await db.examStudentMap.findFirst({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      }
    });

    // Fetch exam set to get questions
    let examSet = null;
    if (studentExamMap?.examSetId) {
      examSet = await db.examSet.findUnique({
        where: {
          id: studentExamMap.examSetId
        }
      });
    }

    // Fallback to first exam set if no specific assignment
    if (!examSet) {
      examSet = await db.examSet.findFirst({
        where: {
          examId: examId
        }
      });
    }

    // Fetch result
    const result = await db.result.findFirst({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      }
    });

    // Fetch review request for this exam and student
    const reviewRequest = await db.resultReview.findFirst({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      },
      include: {
        reviewer: {
          select: { id: true, name: true }
        }
      }
    });

    // Statistics calculation moved to after result processing to ensure accuracy
    // kept placeholder variables if needed or just initialize later
    let totalStudents = 0;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let rank = 0;

    // Parse questions from exam set
    let questions = [];
    if (examSet && examSet.questionsJson) {
      try {
        // Check if it's already an object or needs parsing
        questions = typeof examSet.questionsJson === 'string'
          ? JSON.parse(examSet.questionsJson)
          : examSet.questionsJson;
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
      }
    }

    // Parse student answers
    let studentAnswers: any = {};
    if (submission.answers) {
      try {
        studentAnswers = typeof submission.answers === 'string'
          ? JSON.parse(submission.answers)
          : submission.answers;
      } catch (error) {
        console.error('Error parsing student answers:', error);
      }
    }


    // For students, if result is not published, we might want to hide details
    const isTeacher = token.user.role !== 'STUDENT';
    const hideDetails = !isTeacher && result && !result.isPublished;

    // Process questions with student answers and marking details
    const processedQuestions: ProcessedQuestion[] = questions.map((question: any) => {
      const questionId = question.id;
      const studentAnswer = studentAnswers[questionId];

      const processedImages: string[] = [];

      // Check for main image (old format - single image)
      if (studentAnswers[`${questionId}_image`]) {
        processedImages.push(studentAnswers[`${questionId}_image`]);
      }

      // Check for main images (new format - multiple images)
      if (studentAnswers[`${questionId}_images`] && Array.isArray(studentAnswers[`${questionId}_images`])) {
        processedImages.push(...studentAnswers[`${questionId}_images`]);
      }

      // Check for sub-question images (CQ type)
      for (let i = 0; i < 10; i++) {
        const subImageKey = `${questionId}_sub_${i}_image`;
        if (studentAnswers[subImageKey]) {
          processedImages.push(studentAnswers[subImageKey]);
        }

        const subImagesKey = `${questionId}_sub_${i}_images`;
        if (studentAnswers[subImagesKey] && Array.isArray(studentAnswers[subImagesKey])) {
          processedImages.push(...studentAnswers[subImagesKey]);
        }
      }

      const drawingData = submission?.drawings?.find((d: any) => d.questionId === questionId && d.imageIndex === 0);
      const allDrawingsForQuestion = submission?.drawings?.filter((d: any) => d.questionId === questionId) || [];

      let isCorrect = false;
      let awardedMarks = 0;
      const maxMarks = Number(question.marks) || 0;
      const feedback = '';

      const type = (question.type || '').toUpperCase();

      if (type === 'MCQ') {
        if (studentAnswer) {
          if (question.options && Array.isArray(question.options)) {
            const correctOption = question.options.find((opt: any) => opt.isCorrect);
            if (correctOption) {
              isCorrect = studentAnswer === correctOption.text;
            }
          }

          if (!isCorrect && (question.correctAnswer !== undefined && question.correctAnswer !== null)) {
            const correctAnswer = question.correctAnswer;
            if (typeof correctAnswer === 'number') {
              isCorrect = studentAnswer === correctAnswer;
            } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
              isCorrect = studentAnswer === (correctAnswer as any).text;
            } else if (Array.isArray(correctAnswer)) {
              isCorrect = correctAnswer.includes(studentAnswer);
            } else {
              isCorrect = studentAnswer === String(correctAnswer);
            }
          }

          if (isCorrect) {
            awardedMarks = maxMarks;
          } else {
            if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
              const negativeMarks = (maxMarks * exam.mcqNegativeMarking) / 100;
              awardedMarks = -negativeMarks;
            } else {
              awardedMarks = 0;
            }
          }
        }
      } else if (['MC', 'AR', 'INT', 'SMCQ', 'NUMERIC', 'MTF'].includes(type)) {
        if (type === 'SMCQ') {
          if (!question.subQuestions) {
            awardedMarks = 0;
            isCorrect = false;
          } else {
            let smcqScore = 0;
            (question.subQuestions as any[]).forEach((subQ: any, sIdx: number) => {
              const subAnswer = studentAnswers[`${questionId}_sub_${sIdx}`];
              if (!subAnswer) return;

              const normalize = (s: any) => String(s || "").trim().toLowerCase();
              const userAns = normalize(subAnswer);
              let isSubCorrect = false;

              if (subQ.options && Array.isArray(subQ.options)) {
                const correctOption = subQ.options.find((opt: any) => opt.isCorrect);
                if (correctOption) {
                  const correctOptionText = normalize(typeof correctOption === 'object' ? correctOption.text : correctOption);
                  isSubCorrect = userAns === correctOptionText;
                }
              }

              if (!isSubCorrect && (subQ.correctAnswer !== undefined && subQ.correctAnswer !== null)) {
                const correctIndex = Number(subQ.correctAnswer);
                if (!isNaN(correctIndex) && subQ.options && subQ.options[correctIndex]) {
                  const opt = subQ.options[correctIndex];
                  const correctText = normalize(typeof opt === 'object' ? opt.text : opt);
                  isSubCorrect = userAns === correctText;
                } else {
                  isSubCorrect = userAns === normalize(subQ.correctAnswer);
                }
              }

              if (isSubCorrect) {
                smcqScore += Number(subQ.marks) || 1;
              } else if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                smcqScore -= ((Number(subQ.marks || 1) * exam.mcqNegativeMarking) / 100);
              }
            });
            awardedMarks = smcqScore;
            isCorrect = awardedMarks === maxMarks;
          }
        } else if (type === 'MC') {
          awardedMarks = evaluateMCQuestion(question, studentAnswer || { selectedOptions: [] }, {
            negativeMarking: exam.mcqNegativeMarking || 0,
            partialMarking: true,
            hasAttempted: !!studentAnswer
          });
          isCorrect = awardedMarks === maxMarks;
        } else if (type === 'INT' || type === 'NUMERIC') {
          const hasAnswer = studentAnswer && (studentAnswer.answer !== undefined && studentAnswer.answer !== null && studentAnswer.answer !== '');
          if (!hasAnswer) {
            awardedMarks = 0;
            isCorrect = false;
          } else {
            const res = evaluateINTQuestion(question, studentAnswer);
            awardedMarks = res.score;
            isCorrect = res.isCorrect;
            if (!isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
              awardedMarks = -((maxMarks * exam.mcqNegativeMarking) / 100);
            }
          }
        } else if (type === 'AR') {
          const hasAnswer = studentAnswer && (studentAnswer.selectedOption !== undefined && studentAnswer.selectedOption !== null && studentAnswer.selectedOption !== 0);
          if (!hasAnswer) {
            awardedMarks = 0;
            isCorrect = false;
          } else {
            const res = evaluateARQuestion(question, studentAnswer);
            awardedMarks = res.score;
            isCorrect = res.isCorrect;
            if (!isCorrect && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
              awardedMarks = -((maxMarks * exam.mcqNegativeMarking) / 100);
            }
          }
        } else if (type === 'MTF') {
          const res = evaluateMTFQuestion(question, studentAnswer || {});
          awardedMarks = Math.max(0, res.score);
          isCorrect = res.isCorrect;
        }
      } else {
        awardedMarks = Number(studentAnswers[`${questionId}_marks`]) || 0;
        if ((!studentAnswer || String(studentAnswer).trim() === '' || studentAnswer === 'No answer') && awardedMarks === 0) {
          awardedMarks = 0;
        }
      }

      let explanation = '';
      let modelAnswer = question.modelAnswer || '';

      if (type === 'MCQ') {
        if (question.options && Array.isArray(question.options)) {
          const correctOption = question.options.find((opt: any) => opt.isCorrect);
          if (correctOption) {
            explanation = correctOption.explanation || '';
            modelAnswer = correctOption.text;
          }
        }
      } else if (type === 'SQ') {
        modelAnswer = question.modelAnswer || question.answer || '';
      } else if (type === 'INT' || type === 'NUMERIC') {
        modelAnswer = question.modelAnswer || question.answer || question.correctAnswer || '';
      } else if (type === 'AR') {
        modelAnswer = `Option ${question.correctOption || question.correct}`;
      } else if (type === 'MTF') {
        modelAnswer = "See matches below";
      }

      if (!explanation) {
        explanation = question.explanation || question.reason || '';
      }

      return {
        id: question.id,
        type: question.type,
        questionText: question.questionText,
        marks: maxMarks,
        awardedMarks,
        isCorrect,
        studentAnswer,
        studentAnswerImages: processedImages,
        drawingData: drawingData ? {
          imageData: drawingData.imageData,
          originalImagePath: drawingData.originalImagePath
        } : null,
        allDrawings: allDrawingsForQuestion.map((d: any) => ({
          imageIndex: d.imageIndex,
          imageData: d.imageData,
          originalImagePath: d.originalImagePath
        })),
        options: question.options || [],
        modelAnswer: modelAnswer,
        explanation: explanation,
        subQuestions: question.subQuestions ? (question.subQuestions as any[]).map((subQ: any, idx: number) => {
          const subAnswer = studentAnswers[`${questionId}_sub_${idx}`];
          const normalize = (s: any) => String(s || "").trim().toLowerCase();

          let isSubCorrect = false;
          if (subAnswer) {
            const userAns = normalize(subAnswer);
            if (subQ.options && Array.isArray(subQ.options)) {
              const correctOption = subQ.options.find((opt: any) => opt.isCorrect);
              if (correctOption) {
                const correctOptionText = normalize(typeof correctOption === 'object' ? correctOption.text : correctOption);
                isSubCorrect = userAns === correctOptionText;
              }
            }
            if (!isSubCorrect && (subQ.correctAnswer !== undefined && subQ.correctAnswer !== null)) {
              const correctIndex = Number(subQ.correctAnswer);
              if (!isNaN(correctIndex) && subQ.options && subQ.options[correctIndex]) {
                const opt = subQ.options[correctIndex];
                const correctText = normalize(typeof opt === 'object' ? opt.text : opt);
                isSubCorrect = userAns === correctText;
              } else {
                isSubCorrect = userAns === normalize(subQ.correctAnswer);
              }
            }
          }

          return {
            ...subQ,
            studentAnswer: subAnswer || "",
            studentImages: studentAnswers[`${questionId}_sub_${idx}_images`] || (studentAnswers[`${questionId}_sub_${idx}_image`] ? [studentAnswers[`${questionId}_sub_${idx}_image`]] : []),
            awardedMarks: Number(studentAnswers[`${questionId}_sub_${idx}_marks`]) || 0,
            isCorrect: isSubCorrect
          };
        }) : [],
        feedback,
        images: question.images || [],
        assertion: (question as any).assertion,
        reason: (question as any).reason,
        correctOption: Number((question as any).correctOption || (question as any).correct) || undefined,
        leftColumn: (question as any).leftColumn,
        rightColumn: (question as any).rightColumn,
        matches: (question as any).matches,
        correctAnswer: (question as any).correctAnswer || (question as any).answer,
        tolerance: (question as any).tolerance
      };
    });

    // Use stored result values if available, otherwise calculate from processed questions
    let mcqMarks = result?.mcqMarks || 0;
    let cqMarks = result?.cqMarks || 0;
    let sqMarks = result?.sqMarks || 0;
    let totalMarks = result?.total || 0;
    let percentage = result?.percentage || 0;
    let grade = result?.grade || 'F';

    // Check if student is suspended (either from submission or result)
    const isSuspended = submission.exceededQuestionLimit || (result as any)?.status === 'SUSPENDED';

    // If suspended, give zero marks in all sections
    if (isSuspended) {
      mcqMarks = 0;
      cqMarks = 0;
      sqMarks = 0;
      totalMarks = 0;
      percentage = 0;
      grade = 'F';

      console.log(`🚫 Student suspended - giving zero marks in all sections`);
    } else {
      // Always recalculate percentage and grade to ensure accuracy
      if (totalMarks > 0 || (result && result.total > 0)) {
        const currentTotal = totalMarks || result?.total || 0;
        percentage = calculatePercentage(currentTotal, exam.totalMarks);
        grade = calculateGrade(percentage);

        console.log(`📊 Grade Recalculation Debug:`, {
          totalMarks,
          examTotalMarks: exam.totalMarks,
          percentage,
          grade,
          mcqMarks,
          cqMarks,
          sqMarks,
          hasResult: !!result
        });
      }

      // Recalculate marks from processed questions to ensure data consistency
      // This acts as a "lazy fix" for any corrupted negative marking data in the DB
      // Optimization: Only recalculate if result is missing or explicitly needed
      const hasStoredResult = !!result && result.total !== null && result.total !== undefined && !isNaN(result.total);

      if (!hasStoredResult) {
        console.log('🔄 Re/calculating marks from processed questions (Missing or Initial)...');
        const allCqScores: number[] = [];
        const allSqScores: number[] = [];

        let calculatedMcqMarks = 0;
        let calculatedCqMarks = 0;
        let calculatedSqMarks = 0;

        processedQuestions.forEach((question: any) => {
          const type = (question.type || '').toUpperCase();
          if (type === 'MCQ' || type === 'MC' || type === 'INT' || type === 'NUMERIC' || type === 'AR' || type === 'MTF') {
            calculatedMcqMarks += question.awardedMarks || 0;
          } else if (type === 'CQ') {
            allCqScores.push(question.awardedMarks || 0);
          } else if (type === 'SQ') {
            allSqScores.push(question.awardedMarks || 0);
          }
        });

        // Pick best scores based on limits
        const cqReq = exam.cqRequiredQuestions || allCqScores.length;
        const sqReq = exam.sqRequiredQuestions || allSqScores.length;

        calculatedCqMarks = allCqScores.sort((a, b) => b - a).slice(0, cqReq).reduce((sum, s) => sum + s, 0);
        calculatedSqMarks = allSqScores.sort((a, b) => b - a).slice(0, sqReq).reduce((sum, s) => sum + s, 0);

        let calculatedTotalMarks = calculatedMcqMarks + calculatedCqMarks + calculatedSqMarks;
        calculatedTotalMarks = Math.max(0, calculatedTotalMarks);

        mcqMarks = calculatedMcqMarks;
        cqMarks = calculatedCqMarks;
        sqMarks = calculatedSqMarks;
        totalMarks = calculatedTotalMarks;

        // Recalculate percentage and grade
        percentage = calculatePercentage(totalMarks, exam.totalMarks);
        grade = calculateGrade(percentage);

        // Update result if it exists but was empty/invalid
        if (result) {
          await db.result.update({
            where: { id: result.id },
            data: {
              mcqMarks: mcqMarks,
              cqMarks: cqMarks,
              sqMarks: sqMarks,
              total: totalMarks,
              percentage: percentage,
              grade: grade,
              examSubmissionId: submission.id
            }
          });
        }
      } else {
        // Use stored values if they look correct
        mcqMarks = result.mcqMarks ?? 0;
        cqMarks = result.cqMarks ?? 0;
        sqMarks = result.sqMarks ?? 0;
        totalMarks = result.total ?? 0;
        percentage = result.percentage ?? 0;
        grade = result.grade ?? 'F';
      }
    }

    // -------------------------------------------------------------------------
    // CALCULATE STATISTICS (Moved here to include potential updates)
    // -------------------------------------------------------------------------
    // Use totalMarks (which is either from DB or recalculated)
    const finalStudentTotal = totalMarks;

    // We can't rely on 'result' object being up-to-date if we just updated the DB without refetching
    // But since we updated the DB, the aggregate query WILL see the new values.

    // Check if result actually exists (it might have been created/updated above)
    // If we have totalMarks > 0, we assume valid result needs to be counted

    const [stats, rankCount] = await Promise.all([
      db.result.aggregate({
        where: { examId },
        _count: { _all: true },
        _avg: { total: true },
        _max: { total: true },
        _min: { total: true }
      }),
      db.result.count({
        where: {
          examId,
          total: { gt: finalStudentTotal }
        }
      })
    ]);

    totalStudents = stats._count._all;
    averageScore = stats._avg.total || 0;
    highestScore = stats._max.total || 0;
    lowestScore = stats._min.total || 0;
    rank = rankCount + 1;

    console.log(`📊 Results API - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalMarks}, Suspended: ${isSuspended}`);

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        totalMarks: exam.totalMarks,
        allowRetake: exam.allowRetake,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        isActive: exam.isActive,
        createdAt: exam.createdAt,
        // Added fields for Print View
        subject: (exam as any).subject || "General",
        class: exam.class?.name || "N/A",
        set: examSet?.name || "A",
        mcqNegativeMarking: (exam as any).mcqNegativeMarking || 0,
        cqRequiredQuestions: (exam as any).cqRequiredQuestions,
        sqRequiredQuestions: (exam as any).sqRequiredQuestions
      },
      student: {
        id: user.studentProfile.id,
        name: user.name,
        roll: user.studentProfile.roll,
        registrationNo: user.studentProfile.registrationNo,
        class: user.studentProfile.class.name
      },
      submission: {
        id: submission.id,
        submittedAt: submission.objectiveSubmittedAt || submission.cqSqSubmittedAt,
        startedAt: submission.objectiveStartedAt || submission.cqSqStartedAt,
        score: submission.score,
        evaluatorNotes: submission.evaluatorNotes,
        evaluatedAt: submission.evaluatedAt,
        exceededQuestionLimit: submission.exceededQuestionLimit,
        status: isSuspended ? 'SUSPENDED' : submission.status,
        objectiveStatus: submission.objectiveStatus,
        objectiveStartedAt: submission.objectiveStartedAt,
        objectiveSubmittedAt: submission.objectiveSubmittedAt,
        cqSqStatus: submission.cqSqStatus,
        cqSqStartedAt: submission.cqSqStartedAt,
        cqSqSubmittedAt: submission.cqSqSubmittedAt,
      },
      result: (result && (result.isPublished || token.user.role !== 'STUDENT')) ? {
        id: result.id,
        mcqMarks: mcqMarks,
        cqMarks: cqMarks,
        sqMarks: sqMarks,
        total: totalMarks,
        rank: rank,
        grade: grade,
        percentage: percentage,
        comment: result.comment,
        isPublished: result.isPublished || false,
        publishedAt: result.publishedAt,
        status: isSuspended ? 'SUSPENDED' : (result as any).status,
        suspensionReason: isSuspended ? 'Student answered more questions than allowed' : (result as any).suspensionReason
      } : (result ? { isPublished: false, status: (result as any).status } : null),
      reviewRequest: reviewRequest ? {
        id: reviewRequest.id,
        status: (result as any)?.status || 'PUBLISHED',
        suspensionReason: (result as any)?.suspensionReason,
        studentComment: reviewRequest.studentComment,
        evaluatorComment: reviewRequest.evaluatorComment,
        requestedAt: reviewRequest.requestedAt,
        reviewedAt: reviewRequest.reviewedAt,
        reviewer: reviewRequest.reviewer ? {
          id: reviewRequest.reviewer.id,
          name: reviewRequest.reviewer.name
        } : null
      } : null,
      questions: hideDetails ? [] : processedQuestions,
      statistics: {
        totalStudents,
        averageScore,
        highestScore,
        lowestScore
      }
    });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 