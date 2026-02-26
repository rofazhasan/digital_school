import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;
    const { studentId, questionId, marks, notes } = await req.json();

    // Check if user has access to this exam
    let exam;
    if (tokenData.user.role === "SUPER_USER") {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { examSets: true }
      });
    } else {
      exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          evaluationAssignments: {
            some: {
              evaluatorId: tokenData.user.id
            }
          }
        },
        include: { examSets: true }
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
    }

    // Find the submission
    const submission = await prisma.examSubmission.findUnique({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Find the student's assigned exam set to check question type
    const studentExamMap = await prisma.examStudentMap.findFirst({
      where: { examId, studentId }
    });

    const examSet = await prisma.examSet.findUnique({
      where: { id: studentExamMap?.examSetId || exam.examSets[0]?.id }
    });

    const questions = typeof examSet?.questionsJson === 'string'
      ? JSON.parse(examSet?.questionsJson)
      : examSet?.questionsJson;

    const targetQuestion = (questions || []).find((q: any) => q.id === questionId);
    const isManualType = ['CQ', 'SQ', 'DESCRIPTIVE'].includes(targetQuestion?.type?.toUpperCase());

    // Update the submission with new marks and notes
    const { subIndex } = await req.json().catch(() => ({ subIndex: undefined }));
    const updatedAnswers = {
      ...(submission.answers as Record<string, unknown>),
    };

    if (subIndex !== undefined) {
      // Update specific sub-question mark
      updatedAnswers[`${questionId}_sub_${subIndex}_marks`] = marks;

      // For manual types, sum up all sub-marks to update the main question mark
      if (isManualType && targetQuestion?.subQuestions) {
        let questionTotal = 0;
        targetQuestion.subQuestions.forEach((_: any, idx: number) => {
          const m = updatedAnswers[`${questionId}_sub_${idx}_marks`];
          if (typeof m === 'number') questionTotal += m;
        });
        updatedAnswers[`${questionId}_marks`] = questionTotal;
      }
    } else {
      // Update main question mark directly
      updatedAnswers[`${questionId}_marks`] = marks;
    }

    // Use centralized evaluation logic to recalculate total score and marks by type
    const { evaluateSubmission } = await import("@/lib/exam-logic");
    const { totalScore, mcqMarks, cqMarks, sqMarks } = await evaluateSubmission(
      { ...submission, answers: updatedAnswers },
      exam,
      exam.examSets
    ) as any;

    await prisma.examSubmission.update({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      },
      data: {
        answers: updatedAnswers as any,
        evaluatorNotes: notes || submission.evaluatorNotes,
        score: totalScore
      }
    });

    console.log(`📊 Recalculated Results - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}`);

    console.log(`💾 Saving Result - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}`);

    try {
      // Update or create Result record
      const result = await prisma.result.upsert({
        where: {
          studentId_examId: {
            studentId,
            examId
          }
        },
        update: {
          total: totalScore,
          mcqMarks: mcqMarks,
          cqMarks: cqMarks,
          sqMarks: sqMarks
          // isPublished status is preserved from existing record
        },
        create: {
          studentId,
          examId,
          total: totalScore,
          mcqMarks: mcqMarks,
          cqMarks: cqMarks,
          sqMarks: sqMarks,
          isPublished: false
        }
      });

      console.log(`✅ Result saved successfully:`, {
        id: result.id,
        mcqMarks: result.mcqMarks,
        total: result.total
      });

      // Verify the result was saved correctly
      const savedResult = await (prisma.result as any).findUnique({
        where: {
          studentId_examId: {
            studentId,
            examId
          }
        }
      });

      console.log(`🔍 Verification - Saved result:`, {
        mcqMarks: savedResult?.mcqMarks,
        total: savedResult?.total
      });

    } catch (error) {
      console.error(`❌ Error saving result:`, error);
      throw error;
    }

    // If there's a pending review request for this student, mark it as UNDER_REVIEW
    const pendingReview = await (prisma as any).resultReview.findFirst({
      where: {
        examId,
        studentId,
        status: 'PENDING'
      }
    });

    if (pendingReview) {
      console.log('Marking review as UNDER_REVIEW:', pendingReview.id);
      await (prisma as any).resultReview.update({
        where: { id: pendingReview.id },
        data: {
          status: 'UNDER_REVIEW',
          reviewedById: tokenData.user.id
        }
      });
      console.log('Review status updated to UNDER_REVIEW');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating marks:", error);
    return NextResponse.json({ error: "Failed to update marks" }, { status: 500 });
  }
} 