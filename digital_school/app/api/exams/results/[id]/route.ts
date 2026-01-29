import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculatePercentage } from '@/lib/utils';

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

    // Get all results for this exam to calculate rank
    const allResults = await db.result.findMany({
      where: { examId },
      orderBy: { total: 'desc' }
    });

    const rank = allResults.findIndex(r => r.studentId === user.studentProfile!.id) + 1;

    // Calculate statistics with safe defaults
    const totalStudents = allResults.length;
    const averageScore = totalStudents > 0
      ? allResults.reduce((sum, r) => sum + (r.total || 0), 0) / totalStudents
      : 0;
    const highestScore = totalStudents > 0 ? Math.max(...allResults.map(r => r.total || 0)) : 0;
    const lowestScore = totalStudents > 0 ? Math.min(...allResults.map(r => r.total || 0)) : 0;

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
      let processedImages: string[] = [];

      // Check for main image
      if (studentAnswers[`${questionId}_image`]) {
        processedImages.push(studentAnswers[`${questionId}_image`]);
      }

      // Check for sub-question images (CQ type)
      for (let i = 0; i < 10; i++) { // Check up to 10 sub-questions
        const subImageKey = `${questionId}_sub_${i}_image`;
        if (studentAnswers[subImageKey]) {
          processedImages.push(studentAnswers[subImageKey]);
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
        // Fallback to question-level explanation if no option explanation
        if (!explanation) {
          explanation = question.explanation || question.reason || '';
        }
      } else if (question.type === 'CQ') {
        // For CQ, get model answers for each sub-question
        if (question.subQuestions && Array.isArray(question.subQuestions)) {
          question.subQuestions = question.subQuestions.map((subQ: any) => ({
            ...subQ,
            modelAnswer: subQ.modelAnswer || subQ.answer || ''
          }));
        }
      } else if (question.type === 'SQ') {
        // For SQ, model answer is already in question.modelAnswer
        modelAnswer = question.modelAnswer || question.answer || '';
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
        images: question.images || []
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
    const isSuspended = submission.exceededQuestionLimit || result?.status === 'SUSPENDED';

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
      if (totalMarks > 0) {
        percentage = calculatePercentage(totalMarks, exam.totalMarks);
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

      // Only recalculate if result doesn't have proper values
      if (!result || result.total === 0) {
        console.log('🔄 Recalculating marks from processed questions...');

        mcqMarks = 0;
        cqMarks = 0;
        sqMarks = 0;
        totalMarks = 0;

        processedQuestions.forEach((question: any) => {
          if (question.type === 'MCQ') {
            mcqMarks += question.awardedMarks;
            totalMarks += question.awardedMarks;
            console.log(`MCQ Question ${question.id} marks: ${question.awardedMarks} (running total: ${mcqMarks})`);
          } else if (question.type === 'CQ') {
            cqMarks += question.awardedMarks;
            totalMarks += question.awardedMarks;
          } else if (question.type === 'SQ') {
            sqMarks += question.awardedMarks;
            totalMarks += question.awardedMarks;
          }
        });

        // Ensure total marks doesn't go below 0
        totalMarks = Math.max(0, totalMarks);

        // Calculate percentage and grade
        percentage = calculatePercentage(totalMarks, exam.totalMarks);
        grade = calculateGrade(percentage);

        console.log(`📊 Grade Calculation Debug:`, {
          totalMarks,
          examTotalMarks: exam.totalMarks,
          percentage,
          grade,
          mcqMarks,
          cqMarks,
          sqMarks
        });

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
        status: isSuspended ? 'SUSPENDED' : result.status,
        suspensionReason: isSuspended ? 'Student answered more questions than allowed' : result.suspensionReason
      } : null,
      reviewRequest: reviewRequest ? {
        id: reviewRequest.id,
        status: reviewRequest.status,
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