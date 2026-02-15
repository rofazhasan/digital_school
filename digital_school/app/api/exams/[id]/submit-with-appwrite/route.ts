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
    
    // Process answers and extract Appwrite image information
    const processedAnswers = { ...data.answers };
    const appwriteImages: Array<{
      questionId: string;
      fileId: string;
      url: string;
      filename: string;
      questionType: 'cq' | 'sq';
      timestamp: string;
      uploadedAt: string;
    }> = [];
    
    // Count answered CQ and SQ questions and collect Appwrite image data
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
          
          // Collect Appwrite image data for this question
          if (hasUploadedImages && Array.isArray(data.answers[`${questionId}_images`])) {
            data.answers[`${questionId}_images`].forEach((img: any) => {
              if (img.appwriteFileId && img.appwriteUrl) {
                appwriteImages.push({
                  questionId,
                  fileId: img.appwriteFileId,
                  url: img.appwriteUrl,
                  filename: img.appwriteFilename || img.filename,
                  questionType: questionType as 'cq' | 'sq',
                  timestamp: img.timestamp,
                  uploadedAt: img.uploadedAt || img.timestamp
                });
              }
            });
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
            
            // Collect Appwrite image data for image-only questions
            if (Array.isArray(answer)) {
              answer.forEach((img: any) => {
                if (img.appwriteFileId && img.appwriteUrl) {
                  appwriteImages.push({
                    questionId: baseQuestionId,
                    fileId: img.appwriteFileId,
                    url: img.appwriteUrl,
                    filename: img.appwriteFilename || img.filename,
                    questionType: questionType as 'cq' | 'sq',
                    timestamp: img.timestamp,
                    uploadedAt: img.uploadedAt || img.timestamp
                  });
                }
              });
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
        answers: processedAnswers, 
        submittedAt: new Date(), 
        examSetId,
        exceededQuestionLimit 
      },
      create: { 
        studentId, 
        examId, 
        answers: processedAnswers, 
        examSetId,
        exceededQuestionLimit 
      },
    });
    
    // Store Appwrite image information in the database
    if (appwriteImages.length > 0) {
      // You might want to create a new table for storing Appwrite image metadata
      // For now, we'll store it in the answers JSON, but you could create a separate table
      console.log(`📸 Storing ${appwriteImages.length} Appwrite images for submission ${submission.id}`);
      
      // Update the submission with processed image data
      await prisma.examSubmission.update({
        where: { id: submission.id },
        data: {
          answers: {
            ...processedAnswers,
            _appwriteImages: appwriteImages // Store Appwrite image metadata
          }
        }
      });
    }
    
    console.log("[Exam Submission with Appwrite] Completed:", {
      examId,
      submissionId: submission.id,
      cqAnswered,
      sqAnswered,
      exceededQuestionLimit,
      appwriteImagesCount: appwriteImages.length
    });
    
    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      message: "Exam submitted successfully with Appwrite images",
      stats: {
        cqAnswered,
        sqAnswered,
        exceededQuestionLimit,
        appwriteImagesCount: appwriteImages.length
      }
    });
    
  } catch (error) {
    console.error("Error submitting exam with Appwrite images:", error);
    return NextResponse.json(
      { error: "Failed to submit exam" }, 
      { status: 500 }
    );
  }
} 