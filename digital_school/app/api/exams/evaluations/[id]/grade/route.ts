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
    const { studentId, questionId, marks, notes, subIndex } = await req.json();

    // Check if user has access to this exam
    let exam;
    if (tokenData.user.role === "SUPER_USER" || tokenData.user.role === "ADMIN") {
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

    const currentAnswers = (submission.answers as Record<string, any>) || {};

    const getQScore = (q: any, answers: Record<string, any>): number => {
      if (!answers || !q) return 0;
      const subQs = q.subQuestions || q.sub_questions || q.parts || [];
      if (subQs.length > 0) {
        let sum = 0;
        let hasAny = false;
        subQs.forEach((_: any, i: number) => {
          const m = answers[`${q.id}_sub_${i}_marks`] ?? answers[`${q.id}_desc_${i}_marks`];
          if (typeof m === 'number') {
            sum += m;
            hasAny = true;
          }
        });
        if (hasAny) return sum;
      }
      const top = answers[`${q.id}_marks`];
      return typeof top === 'number' ? top : 0;
    };

    const prevScore = getQScore(targetQuestion, currentAnswers);
    let projectedScore = marks;
    if (subIndex !== undefined) {
      const subQs = targetQuestion?.subQuestions || targetQuestion?.sub_questions || targetQuestion?.parts || [];
      let totalSub = 0;
      subQs.forEach((_: any, idx: number) => {
        if (idx === subIndex) {
          totalSub += marks;
        } else {
          const m = currentAnswers[`${questionId}_sub_${idx}_marks`] ?? currentAnswers[`${questionId}_desc_${idx}_marks`];
          if (typeof m === 'number') totalSub += m;
        }
      });
      projectedScore = totalSub;
    }

    if (prevScore === 0 && projectedScore > 0) {
      const allQuestionsList: any[] = questions || [];
      const cqQuestions = allQuestionsList.filter((q: any) => (q.type || '').toUpperCase() === 'CQ');
      const sqQuestions = allQuestionsList.filter((q: any) => (q.type || '').toUpperCase() === 'SQ');
      const qType = (targetQuestion?.type || '').toUpperCase();

      if (qType === 'CQ' && exam.cqRequiredQuestions && exam.cqRequiredQuestions > 0) {
        const markedCqs = cqQuestions.filter((q: any) => q.id !== questionId && getQScore(q, currentAnswers) > 0);
        if (markedCqs.length >= exam.cqRequiredQuestions) {
          return NextResponse.json({
            error: `ইতিমধ্যে ${exam.cqRequiredQuestions}টি CQ প্রশ্ন মূল্যায়ন করা হয়েছে। সর্বোচ্চ ${exam.cqRequiredQuestions}টি CQ-তে নম্বর দেওয়া যাবে।`
          }, { status: 400 });
        }

        // Section dependency validation
        const rawSubs = (exam as any).cqSubsections;
        const subsections = Array.isArray(rawSubs) ? rawSubs : (typeof rawSubs === 'string' ? JSON.parse(rawSubs || '[]') : []);
        if (Array.isArray(subsections) && subsections.length > 1) {
          const cqIndex = cqQuestions.findIndex((q: any) => q.id === questionId);
          const cqNumber = cqIndex + 1;
          const targetSub = subsections.find((s: any) => cqNumber >= s.startIndex && cqNumber <= s.endIndex);

          if (targetSub) {
            const remSlots = exam.cqRequiredQuestions - markedCqs.length;
            let slotsNeededByOthers = 0;
            let blockingSubName = '';

            subsections.forEach((sub: any) => {
              if (sub.startIndex !== targetSub.startIndex || sub.endIndex !== targetSub.endIndex) {
                const minReq = Number(sub.requiredQuestions) || 0;
                if (minReq > 0) {
                  const markedInOtherSub = markedCqs.filter((q: any) => {
                    const idx = cqQuestions.findIndex((x: any) => x.id === q.id);
                    const num = idx + 1;
                    return num >= sub.startIndex && num <= sub.endIndex;
                  }).length;
                  const needed = Math.max(0, minReq - markedInOtherSub);
                  slotsNeededByOthers += needed;
                  if (needed > 0 && !blockingSubName) {
                    blockingSubName = sub.name;
                  }
                }
              }
            });

            if (remSlots - 1 < slotsNeededByOthers) {
              return NextResponse.json({
                error: `বিভাগীয় শর্ত পূরণের জন্য ${blockingSubName || 'অন্য বিভাগ'}-এ অবশিষ্ট প্রশ্ন মূল্যায়ন করতে হবে।`
              }, { status: 400 });
            }
          }
        }
      }

      if (qType === 'SQ' && exam.sqRequiredQuestions && exam.sqRequiredQuestions > 0) {
        const markedSqs = sqQuestions.filter((q: any) => q.id !== questionId && getQScore(q, currentAnswers) > 0);
        if (markedSqs.length >= exam.sqRequiredQuestions) {
          return NextResponse.json({
            error: `ইতিমধ্যে ${exam.sqRequiredQuestions}টি SQ প্রশ্ন মূল্যায়ন করা হয়েছে। সর্বোচ্চ ${exam.sqRequiredQuestions}টি SQ-তে নম্বর দেওয়া যাবে।`
          }, { status: 400 });
        }
      }
    }

    // Update the submission with new marks and notes
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
    const { calculateGrade, calculatePercentage } = await import("@/lib/utils");
    const evaluation = await evaluateSubmission(
      { ...submission, answers: updatedAnswers as any },
      exam,
      exam.examSets,
      false
    ) as any;

    const totalScore = evaluation.totalScore ?? 0;
    const mcqMarks = evaluation.mcqMarks ?? 0;
    const cqMarks = evaluation.cqMarks ?? 0;
    const sqMarks = evaluation.sqMarks ?? 0;

    const passMark = Number(exam.passMarks) || 33;
    const computedPercentage = exam.totalMarks > 0
      ? calculatePercentage(totalScore, exam.totalMarks)
      : (evaluation.percentage || 0);
    const computedGrade = evaluation.grade === 'F (Disqualified)'
      ? 'F (Disqualified)'
      : calculateGrade(computedPercentage, passMark);

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

    console.log(`📊 Recalculated Results - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}, Pct: ${computedPercentage}%, Grade: ${computedGrade}`);

    console.log(`💾 Saving Result - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}`);

    try {
      // Update or create Result record with updated percentage and grade
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
          sqMarks: sqMarks,
          percentage: computedPercentage,
          grade: computedGrade
          // isPublished status is preserved from existing record
        },
        create: {
          studentId,
          examId,
          total: totalScore,
          mcqMarks: mcqMarks,
          cqMarks: cqMarks,
          sqMarks: sqMarks,
          percentage: computedPercentage,
          grade: computedGrade,
          isPublished: false
        }
      });

      console.log(`✅ Result saved successfully:`, {
        id: result.id,
        mcqMarks: result.mcqMarks,
        total: result.total,
        percentage: result.percentage,
        grade: result.grade
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
        total: savedResult?.total,
        percentage: savedResult?.percentage,
        grade: savedResult?.grade
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

    return NextResponse.json({
      success: true,
      result: {
        total: totalScore,
        mcqMarks,
        cqMarks,
        sqMarks,
        percentage: computedPercentage,
        grade: computedGrade
      }
    });
  } catch (error) {
    console.error("Error updating marks:", error);
    return NextResponse.json({ error: "Failed to update marks" }, { status: 500 });
  }
} 