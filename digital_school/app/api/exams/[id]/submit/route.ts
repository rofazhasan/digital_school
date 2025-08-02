import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getTokenFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;
  const tokenData = await getTokenFromRequest(req);
  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!data.answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }
  try {
    // Get the exam details to check question limits
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examSets: true },
    });
    
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    
    // Get the assigned exam set for this student
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      select: { examSetId: true }
    });
    
    const examSetId = examStudentMap?.examSetId || null;
    
    // Check if student exceeded question limits
    let exceededQuestionLimit = false;
    let cqAnswered = 0;
    let sqAnswered = 0;
    
    // Count answered CQ and SQ questions (both written answers and uploaded photos)
    for (const [questionId, answer] of Object.entries(data.answers)) {
      // Skip image fields as they are handled separately
      if (questionId.endsWith('_images')) {
        continue;
      }
      
      // Check if student provided any answer (written text or uploaded images)
      const hasWrittenAnswer = answer && answer !== "" && answer !== null && answer !== undefined && answer !== "No answer provided";
      const hasUploadedImages = data.answers[`${questionId}_images`] && Array.isArray(data.answers[`${questionId}_images`]) && data.answers[`${questionId}_images`].length > 0;
      
      if (hasWrittenAnswer || hasUploadedImages) {
        // Find the question to determine its type
        let foundQuestion = null;
        
        // Search through all exam sets to find the question
        for (const examSet of exam.examSets) {
          if (examSet.questionsJson) {
            const questions = Array.isArray(examSet.questionsJson) 
              ? examSet.questionsJson 
              : typeof examSet.questionsJson === "string" 
                ? JSON.parse(examSet.questionsJson) 
                : [];
            
            foundQuestion = questions.find((q: any) => q.id === questionId);
            if (foundQuestion) {
              break;
            }
          }
        }
        
        if (foundQuestion) {
          const questionType = (foundQuestion.type || foundQuestion.questionType || "").toLowerCase();
          console.log(`📝 Question ${questionId}: type=${questionType}, hasWritten=${hasWrittenAnswer}, hasImages=${hasUploadedImages}`);
          
          if (questionType === "cq") {
            cqAnswered++;
            console.log(`   ✅ Counted as CQ answer (${cqAnswered}/${exam.cqRequiredQuestions || 'unlimited'})`);
          } else if (questionType === "sq") {
            sqAnswered++;
            console.log(`   ✅ Counted as SQ answer (${sqAnswered}/${exam.sqRequiredQuestions || 'unlimited'})`);
          }
        } else {
          console.log(`⚠️  Question ${questionId} not found in any exam set`);
        }
      }
    }
    
    // Also check for image-only submissions (where no written answer was provided)
    for (const [questionId, answer] of Object.entries(data.answers)) {
      if (questionId.endsWith('_images')) {
        const baseQuestionId = questionId.replace('_images', '');
        
        // Check if this question was already counted (has written answer)
        const hasWrittenAnswer = data.answers[baseQuestionId] && 
          data.answers[baseQuestionId] !== "" && 
          data.answers[baseQuestionId] !== null && 
          data.answers[baseQuestionId] !== undefined && 
          data.answers[baseQuestionId] !== "No answer provided";
        
        // Only count if no written answer was provided (image-only submission)
        if (!hasWrittenAnswer && Array.isArray(answer) && answer.length > 0) {
          // Find the question to determine its type
          let foundQuestion = null;
          
          // Search through all exam sets to find the question
          for (const examSet of exam.examSets) {
            if (examSet.questionsJson) {
              const questions = Array.isArray(examSet.questionsJson) 
                ? examSet.questionsJson 
                : typeof examSet.questionsJson === "string" 
                  ? JSON.parse(examSet.questionsJson) 
                  : [];
              
              foundQuestion = questions.find((q: any) => q.id === baseQuestionId);
              if (foundQuestion) {
                break;
              }
            }
          }
          
          if (foundQuestion) {
            const questionType = (foundQuestion.type || foundQuestion.questionType || "").toLowerCase();
            console.log(`📝 Image-only Question ${baseQuestionId}: type=${questionType}, hasImages=true`);
            
            if (questionType === "cq") {
              cqAnswered++;
              console.log(`   ✅ Counted as CQ answer (${cqAnswered}/${exam.cqRequiredQuestions || 'unlimited'})`);
            } else if (questionType === "sq") {
              sqAnswered++;
              console.log(`   ✅ Counted as SQ answer (${sqAnswered}/${exam.sqRequiredQuestions || 'unlimited'})`);
            }
          } else {
            console.log(`⚠️  Image-only Question ${baseQuestionId} not found in any exam set`);
          }
        }
      }
    }
    
    // Check if exceeded limits
    if (exam.cqRequiredQuestions && cqAnswered > exam.cqRequiredQuestions) {
      exceededQuestionLimit = true;
      console.log(`🚫 Student exceeded CQ limit: answered ${cqAnswered}, required ${exam.cqRequiredQuestions}`);
    }
    if (exam.sqRequiredQuestions && sqAnswered > exam.sqRequiredQuestions) {
      exceededQuestionLimit = true;
      console.log(`🚫 Student exceeded SQ limit: answered ${sqAnswered}, required ${exam.sqRequiredQuestions}`);
    }
    
    // Save submission with examSetId and exceededQuestionLimit flag
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: { 
        answers: data.answers, 
        submittedAt: new Date(), 
        examSetId,
        exceededQuestionLimit 
      },
      create: { 
        studentId, 
        examId, 
        answers: data.answers, 
        examSetId,
        exceededQuestionLimit 
      },
    });
    
    console.log("[Exam Submission] Exam data loaded:", {
      examId,
      mcqNegativeMarking: exam.mcqNegativeMarking,
      cqRequiredQuestions: exam.cqRequiredQuestions,
      sqRequiredQuestions: exam.sqRequiredQuestions,
      cqAnswered,
      sqAnswered,
      exceededQuestionLimit
    });
    let questions: Record<string, unknown>[] = [];
    const rawQuestions = exam?.examSets[0]?.questionsJson;
    if (Array.isArray(rawQuestions)) {
      questions = rawQuestions as Record<string, unknown>[];
    } else if (typeof rawQuestions === "string") {
      try {
        const parsed = JSON.parse(rawQuestions);
        if (Array.isArray(parsed)) {
          questions = parsed as Record<string, unknown>[];
        } else {
          questions = [];
        }
      } catch {
        questions = [];
      }
    } else {
      questions = [];
    }
    // Add 'correct' field to MCQ questions if missing (same as in /api/exams/online/[id]/route.ts)
    questions = questions.map((q: Record<string, unknown>) => {
      if (((q.type as string)?.toLowerCase?.() === 'mcq' || (q.questionType as string)?.toLowerCase?.() === 'mcq') && Array.isArray(q.options)) {
        const correctIndex = (q.options as Record<string, unknown>[]).findIndex((opt: Record<string, unknown>) => opt.isCorrect);
        if (correctIndex !== -1) {
                  const correctOpt = (q.options as Record<string, unknown>[])[correctIndex];
        return { ...q, correct: typeof correctOpt === 'object' && correctOpt !== null ? ((correctOpt as Record<string, unknown>).text as string || correctIndex) : correctIndex };
        }
      }
      return q;
    });
    const hasCQorSQ = questions.some((q: Record<string, unknown>) => (q.type as string) === "cq" || (q.type as string) === "sq");
    
    // If student exceeded question limits, give zero marks and mark as suspended
    if (exceededQuestionLimit) {
      // Update submission with zero score and suspension status
      await prisma.examSubmission.update({
        where: { studentId_examId: { studentId, examId } },
        data: { 
          score: 0,
          exceededQuestionLimit: true
        }
      });
      
      // Create or update result with zero marks and suspension status
      const result = await prisma.result.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { 
          mcqMarks: 0, 
          cqMarks: 0, 
          sqMarks: 0, 
          total: 0, 
          isPublished: true, 
          examSubmissionId: submission.id,
          status: 'SUSPENDED',
          comment: 'Exam suspended: Student answered more questions than allowed'
        },
        create: { 
          studentId, 
          examId, 
          mcqMarks: 0, 
          cqMarks: 0, 
          sqMarks: 0, 
          total: 0, 
          isPublished: true, 
          examSubmissionId: submission.id,
          status: 'SUSPENDED',
          comment: 'Exam suspended: Student answered more questions than allowed'
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        autoGraded: true, 
        result: { ...result, answers: data.answers },
        exceededQuestionLimit: true,
        suspended: true,
        message: "পরীক্ষা বাতিল হয়েছে। আপনি নির্ধারিত প্রশ্নের চেয়ে বেশি প্রশ্নের উত্তর দিয়েছেন।"
      });
    }
    
    if (!hasCQorSQ) {
      // Auto-grade MCQ with negative marking support
      let score = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      let negativeMarksApplied = 0;
      
      questions.forEach((q: Record<string, unknown>) => {
        if ((q.type as string) && (q.type as string).toLowerCase() === "mcq" && typeof data.answers[q.id as string] !== "undefined") {
          const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
          const userAns = normalize(data.answers[q.id as string]);
          const marks = Number(q.marks) || 1;
          let isCorrect = false;
          
          // Enhanced MCQ answer comparison logic
          if (q.options && Array.isArray(q.options)) {
            // Check if student answer matches any option marked as correct
            const correctOption = q.options.find((opt: any) => opt.isCorrect);
            if (correctOption) {
              const correctOptionText = normalize(correctOption.text || String(correctOption));
              isCorrect = userAns === correctOptionText;
            }
          }
          
          // Fallback: Check if there's a direct correctAnswer field
          if (!isCorrect && q.correctAnswer) {
            const correctAnswer = q.correctAnswer;
            let correctAns = '';
            
            if (typeof correctAnswer === 'number') {
              correctAns = normalize(String(correctAnswer));
            } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
              correctAns = normalize(correctAnswer.text || String(correctAnswer));
            } else if (Array.isArray(correctAnswer)) {
              // Handle array format (e.g., ["answer1", "answer2"])
              isCorrect = correctAnswer.some(ans => normalize(String(ans)) === userAns);
            } else {
              correctAns = normalize(String(correctAnswer));
            }
            
            if (!Array.isArray(correctAnswer)) {
              isCorrect = userAns === correctAns;
            }
          }
          
          // Final fallback: use q.correct
          if (!isCorrect && q.correct) {
            const correctAns = normalize(String(q.correct));
            isCorrect = userAns === correctAns;
          }
          
          console.log(`MCQ Question ${q.id}:`, {
            userAnswer: userAns,
            correctAnswer: q.correct,
            isCorrect,
            marks,
            negativeMarking: exam.mcqNegativeMarking
          });
          
          if (isCorrect) {
            score += marks;
            totalCorrect++;
          } else {
            totalWrong++;
            // Apply negative marking for wrong answers if enabled
            if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
              const negativeMarks = (marks * exam.mcqNegativeMarking) / 100;
              score -= negativeMarks;
              negativeMarksApplied += negativeMarks;
              console.log(`❌ Negative marking applied: -${negativeMarks.toFixed(2)} for question ${q.id}`);
            }
          }
        }
      });
      
      // Ensure score doesn't go below 0
      score = Math.max(0, score);
      
      console.log("[Exam Submission] MCQ Grading Summary:", {
        totalCorrect,
        totalWrong,
        negativeMarksApplied,
        finalScore: score,
        mcqNegativeMarking: exam.mcqNegativeMarking,
        examId,
        studentId
      });
      
      // Save score to ExamSubmission
      await prisma.examSubmission.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { answers: data.answers, submittedAt: new Date(), score, examSetId },
        create: { studentId, examId, answers: data.answers, score, examSetId },
      });
      
      // Save score to Result (mcqMarks and total)
      const result = await prisma.result.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { mcqMarks: score, total: score, isPublished: true, examSubmissionId: submission.id },
        create: { studentId, examId, mcqMarks: score, total: score, isPublished: true, examSubmissionId: submission.id },
      });
      
      // Attach answers to result for frontend scoring
      const resultWithAnswers = { ...result, answers: data.answers };
      console.log("[Exam Submission] Upserted result:", resultWithAnswers);
      
      return NextResponse.json({ 
        success: true, 
        autoGraded: true, 
        result: resultWithAnswers,
        gradingSummary: {
          totalCorrect,
          totalWrong,
          negativeMarksApplied,
          finalScore: score,
          mcqNegativeMarking: exam.mcqNegativeMarking
        }
      });
    } else {
      // Needs teacher review
      await prisma.result.upsert({
        where: { studentId_examId: { studentId, examId } },
        update: { isPublished: false, examSubmissionId: submission.id },
        create: { studentId, examId, total: 0, isPublished: false, examSubmissionId: submission.id },
      });
      return NextResponse.json({ success: true, autoGraded: false, message: "Submission received. Awaiting teacher review." });
    }
  } catch (e) {
    console.error("Submission error:", {
      studentId,
      examId,
      answers: data.answers,
      error: e
    });
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
} 