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
    const { studentId } = await req.json();

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

    const submission = await prisma.examSubmission.findUnique({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      }
    });

    if (submission) {
      // Find the student's assigned exam set
      const studentExamMap = await prisma.examStudentMap.findFirst({
        where: { examId, studentId }
      });

      const examSet = await prisma.examSet.findUnique({
        where: { id: studentExamMap?.examSetId || exam.examSets[0]?.id }
      });

      const questions = typeof examSet?.questionsJson === 'string'
        ? JSON.parse(examSet?.questionsJson)
        : examSet?.questionsJson;

      const answers = (submission.answers as Record<string, any>) || {};
      const allQuestionsList: any[] = questions || [];
      const cqQuestions = allQuestionsList.filter((q: any) => (q.type || '').toUpperCase() === 'CQ');
      const sqQuestions = allQuestionsList.filter((q: any) => (q.type || '').toUpperCase() === 'SQ');

      const getQScore = (q: any): number => {
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

      const isAttempted = (q: any): boolean => {
        if (getQScore(q) > 0) return true;
        if (answers[q.id] || answers[`${q.id}_image`] || answers[`${q.id}_images`]) return true;
        const subQs = q.subQuestions || q.sub_questions || q.parts || [];
        return subQs.some((_: any, i: number) => {
          const subAns = answers[`${q.id}_sub_${i}`] || answers[`${q.id}_desc_${i}`] || answers[`${q.id}_sub_${i}_image`];
          return subAns !== undefined && subAns !== null && subAns !== '';
        });
      };

      const cqReq = exam.cqRequiredQuestions;
      if (typeof cqReq === 'number' && cqReq > 0 && cqQuestions.length > 0) {
        const rawSubs = (exam as any).cqSubsections;
        const subsections = Array.isArray(rawSubs) ? rawSubs : (typeof rawSubs === 'string' ? JSON.parse(rawSubs || '[]') : []);
        if (Array.isArray(subsections) && subsections.length > 1) {
          for (const sub of subsections) {
            const minReq = Number(sub.requiredQuestions) || 0;
            if (minReq > 0) {
              const subCqs = cqQuestions.filter((_: any, idx: number) => {
                const num = idx + 1;
                return num >= sub.startIndex && num <= sub.endIndex;
              });
              const attemptedInSub = subCqs.filter((q: any) => isAttempted(q)).length;
              const markedInSub = subCqs.filter((q: any) => getQScore(q) > 0).length;
              const targetMin = Math.min(minReq, attemptedInSub);

              if (markedInSub < targetMin) {
                return NextResponse.json({
                  error: `"${sub.name}" বিভাগ থেকে কমপক্ষে ${targetMin}টি প্রশ্নের মূল্যায়ন আবশ্যক (বর্তমানে ${markedInSub}টি মূল্যায়িত)।`
                }, { status: 400 });
              }
            }
          }
        }

        const attemptedCqs = cqQuestions.filter((q: any) => isAttempted(q)).length;
        const markedCqs = cqQuestions.filter((q: any) => getQScore(q) > 0).length;
        const targetCq = Math.min(cqReq, attemptedCqs);
        if (markedCqs < targetCq) {
          return NextResponse.json({
            error: `CQ-তে মোট ${targetCq}টি প্রশ্নের মূল্যায়ন আবশ্যক (বর্তমানে ${markedCqs}টি মূল্যায়িত)।`
          }, { status: 400 });
        }
      }

      const sqReq = exam.sqRequiredQuestions;
      if (typeof sqReq === 'number' && sqReq > 0 && sqQuestions.length > 0) {
        const attemptedSqs = sqQuestions.filter((q: any) => isAttempted(q)).length;
        const markedSqs = sqQuestions.filter((q: any) => getQScore(q) > 0).length;
        const targetSq = Math.min(sqReq, attemptedSqs);
        if (markedSqs < targetSq) {
          return NextResponse.json({
            error: `SQ-তে মোট ${targetSq}টি প্রশ্নের মূল্যায়ন আবশ্যক (বর্তমানে ${markedSqs}টি মূল্যায়িত)।`
          }, { status: 400 });
        }
      }

      const { evaluateSubmission } = await import("@/lib/exam-logic");
      await evaluateSubmission(submission, exam as any, exam.examSets, true, true);
    }

    // Mark the submission as evaluated
    await prisma.examSubmission.update({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      },
      data: {
        evaluatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting student evaluation:", error);
    return NextResponse.json({ error: "Failed to submit student evaluation" }, { status: 500 });
  }
} 