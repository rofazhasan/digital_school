import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculatePercentage } from '@/lib/utils';
import { evaluateMCQuestion } from '@/lib/evaluation/mcEvaluation';
import { evaluateINTQuestion } from '@/lib/evaluation/intEvaluation';
import { evaluateARQuestion } from '@/lib/evaluation/arEvaluation';
import { evaluateMTFQuestion } from '@/lib/evaluation/mtfEvaluation';

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

    const submission = await (db.examSubmission as any).findFirst({
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
    const reviewRequest = await (db as any).resultReview.findFirst({
      where: {
        examId: examId,
        studentId: user.studentProfile.id
      }
    });

    // Optimized: Parallelize independent queries
    const studentTotal = result?.total || 0;

    const [stats, rankCount] = await Promise.all([
      db.result.aggregate({
        where: { examId },
        _count: { _all: true },
        _avg: { total: true },
        _max: { total: true },
        _min: { total: true }
      }),
      result ? db.result.count({
        where: {
          examId,
          total: { gt: studentTotal }
        }
      }) : Promise.resolve(-1)
    ]);
    const totalStudents = stats._count._all;
    const averageScore = stats._avg.total || 0;
    const highestScore = stats._max.total || 0;
    const lowestScore = stats._min.total || 0;
    const rank = result ? rankCount + 1 : 0;

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


    // Process questions with student answers and marking details
    const processedQuestions = questions.map((question: any) => {
      const questionId = question.id;
      const studentAnswer = studentAnswers[questionId];

      // Collect all image URLs for this question
      // Images can be stored as:
      // - ${questionId}_image (main SQ/CQ image)
      // - ${questionId}_sub_0_image, ${questionId}_sub_1_image, etc. (CQ sub-question images)
      // - ${questionId}_images (NEW: array of multiple images for SQ)
      // - ${questionId}_sub_0_images, ${questionId}_sub_1_images, etc. (NEW: arrays for CQ sub-questions)
      let processedImages: string[] = [];

      // Check for main image (old format - single image)
      if (studentAnswers[`${questionId}_image`]) {
        processedImages.push(studentAnswers[`${questionId}_image`]);
      }

      // Check for main images (new format - multiple images)
      if (studentAnswers[`${questionId}_images`] && Array.isArray(studentAnswers[`${questionId}_images`])) {
        processedImages.push(...studentAnswers[`${questionId}_images`]);
      }

      // Check for sub-question images (CQ type)
      for (let i = 0; i < 10; i++) { // Check up to 10 sub-questions
        // Old format - single image per sub-question
        const subImageKey = `${questionId}_sub_${i}_image`;
        if (studentAnswers[subImageKey]) {
          processedImages.push(studentAnswers[subImageKey]);
        }

        // New format - multiple images per sub-question
        const subImagesKey = `${questionId}_sub_${i}_images`;
        if (studentAnswers[subImagesKey] && Array.isArray(studentAnswers[subImagesKey])) {
          processedImages.push(...studentAnswers[subImagesKey]);
        }
      }

      // Debug logging
      if (processedImages.length > 0) {
        console.log(`[ResultAPI] Found ${processedImages.length} images for question ${questionId}:`, processedImages);
      }

      // Get drawing data for this question (support multiple images)
      const drawingData = submission?.drawings?.find((d: any) => d.questionId === questionId && d.imageIndex === 0);
      const allDrawingsForQuestion = submission?.drawings?.filter((d: any) => d.questionId === questionId) || [];

      let isCorrect = false;
      let awardedMarks = 0;
      const maxMarks = question.marks || 0;
      const feedback = '';

      // Check if answer is correct based on question type
      if (question.type === 'MCQ') {
        if (studentAnswer) {
          // Check if student answer matches any option marked as correct
          if (question.options && Array.isArray(question.options)) {
            const correctOption = question.options.find((opt: any) => opt.isCorrect);
            if (correctOption) {
              isCorrect = studentAnswer === correctOption.text;
            }
          }

          // Fallback: Check if there's a direct correctAnswer field
          if (!isCorrect && question.correctAnswer) {
            const correctAnswer = question.correctAnswer;

            // Handle different correct answer formats
            if (typeof correctAnswer === 'number') {
              isCorrect = studentAnswer === correctAnswer;
            } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
              // Handle object format (e.g., {text: "answer"})
              isCorrect = studentAnswer === correctAnswer.text;
            } else if (Array.isArray(correctAnswer)) {
              // Handle array format (e.g., ["answer1", "answer2"])
              isCorrect = correctAnswer.includes(studentAnswer);
            } else {
              // Handle string format
              isCorrect = studentAnswer === String(correctAnswer);
            }
          }

          if (isCorrect) {
            awardedMarks = maxMarks;
          } else {
            // Apply negative marking for wrong answers if enabled
            if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
              const negativeMarks = (maxMarks * exam.mcqNegativeMarking) / 100;
              awardedMarks = -negativeMarks;
            } else {
              awardedMarks = 0;
            }
          }

          console.log(`MCQ Question ${question.id}:`, {
            studentAnswer,
            correctOptionText: question.options?.find((opt: any) => opt.isCorrect)?.text || 'No correct option found',
            isCorrect,
            awardedMarks,
            maxMarks,
            negativeMarking: exam.mcqNegativeMarking
          });
        }
      } else if (question.type === 'MC' || question.type === 'AR' || question.type === 'INT' || question.type === 'NUMERIC' || question.type === 'MTF') {
        const type = question.type.toUpperCase();
        if (type === 'MC') {
          awardedMarks = evaluateMCQuestion(question, studentAnswer || { selectedOptions: [] }, {
            negativeMarking: (exam as any).mcqNegativeMarking || 0,
            partialMarking: true,
            hasAttempted: !!studentAnswer // Only apply negative marking if attempted
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
            if (!isCorrect && (exam as any).mcqNegativeMarking && (exam as any).mcqNegativeMarking > 0) {
              awardedMarks = -((maxMarks * (exam as any).mcqNegativeMarking) / 100);
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
            if (!isCorrect && (exam as any).mcqNegativeMarking && (exam as any).mcqNegativeMarking > 0) {
              awardedMarks = -((maxMarks * (exam as any).mcqNegativeMarking) / 100);
            }
          }
        } else if (type === 'MTF') {
          const res = evaluateMTFQuestion(question, studentAnswer || {});
          // Ensure no negative marking for MTF (Partial marking only)
          awardedMarks = Math.max(0, res.score);
          isCorrect = res.isCorrect;
        }
      } else {
        // For CQ/SQ, marks are manually awarded
        // Get marks from submission answers
        awardedMarks = studentAnswers[`${questionId}_marks`] || 0;

        // If student didn't answer and no marks were manually awarded, award 0 marks
        if ((!studentAnswer || studentAnswer.trim() === '' || studentAnswer === 'No answer') && awardedMarks === 0) {
          awardedMarks = 0;
        }
        // Otherwise, keep the manually awarded marks (even if student didn't answer but teacher gave partial marks)
      }

      // Get explanations and model answers based on question type
      let explanation = '';
      let modelAnswer = question.modelAnswer || '';

      if (question.type === 'MCQ') {
        // For MCQ, get explanation from the correct option
        if (question.options && Array.isArray(question.options)) {
          const correctOption = question.options.find((opt: any) => opt.isCorrect);
          if (correctOption) {
            explanation = correctOption.explanation || '';
            modelAnswer = correctOption.text;
          }
        }
      } else if (question.type === 'CQ') {
        // ... (existing CQ logic handled elsewhere or uses question.explanation)
      } else if (question.type === 'SQ') {
        modelAnswer = question.modelAnswer || question.answer || '';
      } else if (question.type === 'INT' || question.type === 'NUMERIC') {
        modelAnswer = question.modelAnswer || question.answer || question.correctAnswer || '';
      } else if (question.type === 'AR') {
        modelAnswer = `Option ${question.correctOption || question.correct}`;
      } else if (question.type === 'MTF') {
        modelAnswer = "See matches below";
      }

      // Universal fallback for explanation
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
        subQuestions: question.subQuestions,
        feedback,
        images: question.images || [],
        // AR Specific Fields
        assertion: (question as any).assertion,
        reason: (question as any).reason,
        correctOption: (question as any).correctOption || (question as any).correct,
        // MTF Specific Fields
        leftColumn: (question as any).leftColumn,
        rightColumn: (question as any).rightColumn,
        matches: (question as any).matches,
        // INT Specific Fields
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
      console.log('🔄 Verifying/Recalculating marks from processed questions...');

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

      // Check if we need to update stored result
      // We update if result is missing, total is 0, OR if there's a significant mismatch (e.g. due to negative marking fix)
      const needsUpdate = !result || result.total === 0 || Math.abs(calculatedTotalMarks - (result.total || 0)) > 0.01;

      if (needsUpdate) {
        console.log(`⚠️ Mark Mismatch Detected (Stored: ${result?.total}, Calc: ${calculatedTotalMarks}) - Triggering Auto-Repair`);

        mcqMarks = calculatedMcqMarks;
        cqMarks = calculatedCqMarks;
        sqMarks = calculatedSqMarks;
        totalMarks = calculatedTotalMarks;

        // Recalculate percentage and grade
        percentage = calculatePercentage(totalMarks, exam.totalMarks);
        grade = calculateGrade(percentage);

        // Update result with calculated marks if it exists
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
      }

      // Removed the old strict if (!result || result.total === 0) block as it's subsumed by the logic above
    }

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
        submittedAt: submission.submittedAt,
        startedAt: submission.startedAt,
        score: submission.score,
        evaluatorNotes: submission.evaluatorNotes,
        evaluatedAt: submission.evaluatedAt,
        exceededQuestionLimit: submission.exceededQuestionLimit,
        status: isSuspended ? 'SUSPENDED' : submission.status
      },
      result: result ? {
        id: result.id,
        mcqMarks: mcqMarks,
        cqMarks: cqMarks,
        sqMarks: sqMarks,
        total: totalMarks,
        rank: result.rank || null,
        grade: grade,
        percentage: percentage,
        comment: result.comment,
        isPublished: result.isPublished || false,
        publishedAt: result.publishedAt,
        status: isSuspended ? 'SUSPENDED' : (result as any).status,
        suspensionReason: isSuspended ? 'Student answered more questions than allowed' : (result as any).suspensionReason
      } : null,
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
      questions: processedQuestions,
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