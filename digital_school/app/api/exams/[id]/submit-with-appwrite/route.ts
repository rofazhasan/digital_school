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
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!data || !data.answers) {
    return NextResponse.json({ error: "Missing answers in payload" }, { status: 400 });
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

    // Determine Exam Set ID
    // 1. Try finding it from the map
    const examStudentMap = await prisma.examStudentMap.findUnique({
      where: { studentId_examId: { studentId, examId } },
      select: { examSetId: true }
    });

    let targetExamSetId = examStudentMap?.examSetId || null;

    // 2. If not in map, try finding it from existing submission (preserve it)
    if (!targetExamSetId) {
      const existingSubmission = await prisma.examSubmission.findUnique({
        where: { studentId_examId: { studentId, examId } },
        select: { examSetId: true }
      });
      if (existingSubmission?.examSetId) {
        targetExamSetId = existingSubmission.examSetId;
      }
    }

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

    // Helper to count answers
    const countAnswer = (questionId: string, isImageOnly: boolean = false) => {
      let foundQuestion = null;
      for (const examSet of exam.examSets) {
        if (examSet.questionsJson) {
          const questions = Array.isArray(examSet.questionsJson)
            ? examSet.questionsJson
            : typeof examSet.questionsJson === "string"
              ? JSON.parse(examSet.questionsJson)
              : [];

          foundQuestion = questions.find((q: any) => q.id === questionId);
          if (foundQuestion) break;
        }
      }

      if (foundQuestion) {
        const questionType = (foundQuestion.type || foundQuestion.questionType || "").toLowerCase();
        if (questionType === "cq") cqAnswered++;
        else if (questionType === "sq") sqAnswered++;
        return { found: true, type: questionType };
      }
      return { found: false, type: null };
    };

    // Analyze answers for limits
    const answerKeys = Object.keys(data.answers).filter(k => !k.endsWith('_images'));

    for (const qId of answerKeys) {
      const val = data.answers[qId];
      const hasWritten = val && val !== "" && val !== "No answer provided";
      const imagesKey = `${qId}_images`;
      const hasImages = Array.isArray(data.answers[imagesKey]) && data.answers[imagesKey].length > 0;

      if (hasWritten || hasImages) {
        const result = countAnswer(qId);

        // Extract images
        if (hasImages) {
          data.answers[imagesKey].forEach((img: any) => {
            if (img.appwriteFileId && img.appwriteUrl) {
              appwriteImages.push({
                questionId: qId,
                fileId: img.appwriteFileId,
                url: img.appwriteUrl,
                filename: img.appwriteFilename || img.filename,
                questionType: result.type as 'cq' | 'sq' || 'cq',
                timestamp: img.timestamp,
                uploadedAt: img.uploadedAt || img.timestamp
              });
            }
          });
        }
      }
    }

    // Check limits
    if (exam.cqRequiredQuestions && cqAnswered > exam.cqRequiredQuestions) exceededQuestionLimit = true;
    if (exam.sqRequiredQuestions && sqAnswered > exam.sqRequiredQuestions) exceededQuestionLimit = true;

    // Save submission
    const submission = await prisma.examSubmission.upsert({
      where: { studentId_examId: { studentId, examId } },
      update: {
        answers: processedAnswers,
        submittedAt: new Date(),
        examSetId: targetExamSetId, // Use preserved or found ID
        exceededQuestionLimit
      },
      create: {
        studentId,
        examId,
        answers: processedAnswers,
        examSetId: targetExamSetId,
        exceededQuestionLimit
      },
    });

    // Store Appwrite image metadata if any
    if (appwriteImages.length > 0) {
      await prisma.examSubmission.update({
        where: { id: submission.id },
        data: {
          answers: {
            ...processedAnswers,
            _appwriteImages: appwriteImages
          }
        }
      });
    }

    console.log(`[Submit] Success for user ${studentId}, exam ${examId}, set ${targetExamSetId}`);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Exam submitted successfully",
    });

  } catch (error: any) {
    console.error("Submission Error:", error);
    // Return the specific error message for debugging
    return NextResponse.json(
      { error: error?.message || "Failed to submit exam" },
      { status: 500 }
    );
  }
} 