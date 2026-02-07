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
    let examAccess;
    if (tokenData.user.role === "SUPER_USER") {
      examAccess = await prisma.exam.findUnique({
        where: { id: examId }
      });
    } else {
      examAccess = await prisma.exam.findFirst({
        where: {
          id: examId,
          evaluationAssignments: {
            some: {
              evaluatorId: tokenData.user.id
            }
          }
        }
      });
    }

    if (!examAccess) {
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

    // Update the submission with new marks and notes
    const updatedAnswers = {
      ...(submission.answers as Record<string, unknown>),
      [`${questionId}_marks`]: marks
    };

    // Calculate total score from all marked questions
    let totalScore = 0;
    let mcqMarks = 0;
    let cqMarks = 0;
    let sqMarks = 0;
    const answers = updatedAnswers as Record<string, unknown>;

    // Get the question to determine if it's CQ or SQ
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: true
      }
    });

    // Find the question in exam sets
    // let questionType = 'CQ'; // Default to CQ
    if (exam?.examSets) {
      for (const examSet of exam.examSets) {
        if (examSet.questionsJson) {
          const questions = typeof examSet.questionsJson === 'string'
            ? JSON.parse(examSet.questionsJson)
            : examSet.questionsJson;

          const question = questions.find((q: Record<string, unknown>) => q.id === questionId);
          if (question) {
            // questionType = question.type?.toUpperCase() || 'CQ';
            break;
          }
        }
      }
    }

    // Calculate marks by type (excluding MCQ which will be auto-graded)
    for (const key in answers) {
      if (key.endsWith('_marks') && typeof answers[key] === 'number') {
        const qId = key.replace('_marks', '');

        // Determine question type for this specific question
        let qType = 'CQ';
        if (exam?.examSets) {
          for (const examSet of exam.examSets) {
            if (examSet.questionsJson) {
              const questions = typeof examSet.questionsJson === 'string'
                ? JSON.parse(examSet.questionsJson)
                : examSet.questionsJson;

              const q = questions.find((q: Record<string, unknown>) => q.id === qId);
              if (q) {
                qType = (q.type as string)?.toUpperCase() || 'CQ';
                break;
              }
            }
          }
        }

        // Skip MCQ questions as they will be auto-graded
        if (qType === 'SQ') {
          sqMarks += answers[key] as number;
          totalScore += answers[key] as number;
        } else if (qType === 'CQ') {
          cqMarks += answers[key] as number;
          totalScore += answers[key] as number;
        }
        // MCQ questions are handled separately in auto-grading
      }
    }

    // Also calculate MCQ marks from auto-graded questions
    // First, get the student's assigned exam set
    const studentExamMap = await prisma.examStudentMap.findFirst({
      where: {
        studentId,
        examId
      }
    });

    if (studentExamMap?.examSetId) {
      // Get the specific exam set assigned to this student
      const assignedExamSet = await prisma.examSet.findUnique({
        where: {
          id: studentExamMap.examSetId
        }
      });

      if (assignedExamSet?.questionsJson) {
        const questions = typeof assignedExamSet.questionsJson === 'string'
          ? JSON.parse(assignedExamSet.questionsJson)
          : assignedExamSet.questionsJson;

        for (const question of questions) {
          if (question.type?.toUpperCase() === 'MCQ') {
            const studentAnswer = answers[question.id];
            if (studentAnswer) {
              const normalize = (s: unknown) => String(s || '').trim().toLowerCase().normalize();
              const userAns = normalize(studentAnswer);
              let isCorrect = false;

              // Enhanced MCQ answer comparison logic
              if (question.options && Array.isArray(question.options)) {
                // Check if student answer matches any option marked as correct
                const correctOption = question.options.find((opt: Record<string, unknown>) => opt.isCorrect);
                if (correctOption) {
                  const correctOptionText = normalize(correctOption.text || String(correctOption));
                  isCorrect = userAns === correctOptionText;
                }
              }

              // Fallback: Check if there's a direct correctAnswer field
              if (!isCorrect && question.correctAnswer) {
                const correctAnswer = question.correctAnswer;

                if (typeof correctAnswer === 'number') {
                  isCorrect = userAns === normalize(String(correctAnswer));
                } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
                  // Handle object format (e.g., {text: "answer"})
                  isCorrect = userAns === normalize(String((correctAnswer as Record<string, unknown>).text || String(correctAnswer)));
                } else if (Array.isArray(correctAnswer)) {
                  // Handle array format (e.g., ["answer1", "answer2"])
                  isCorrect = correctAnswer.some(ans => normalize(String(ans)) === userAns);
                } else {
                  // Handle string format
                  isCorrect = userAns === normalize(String(correctAnswer));
                }
              }

              // Final fallback: use question.correct
              if (!isCorrect && question.correct) {
                const correctAns = normalize(String(question.correct));
                isCorrect = userAns === correctAns;
              }

              console.log(`MCQ Question ${question.id}:`, {
                userAnswer: userAns,
                correctAnswer: question.correct,
                isCorrect,
                questionMarks: question.marks,
                previousMcqMarks: mcqMarks
              });

              if (isCorrect) {
                mcqMarks += question.marks;
                totalScore += question.marks;
                console.log(`✅ MCQ marks awarded: +${question.marks}, Total MCQ: ${mcqMarks}, Total Score: ${totalScore}`);
              } else {
                // Apply negative marking for wrong answers
                if (exam && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                  const negativeMarks = (question.marks * exam.mcqNegativeMarking) / 100;
                  mcqMarks -= negativeMarks;
                  totalScore -= negativeMarks;
                  console.log(`❌ MCQ negative marking applied: -${negativeMarks.toFixed(2)} for question ${question.id}, Total MCQ: ${mcqMarks}, Total Score: ${totalScore}`);
                } else {
                  console.log(`❌ MCQ marks not awarded: 0, Total MCQ: ${mcqMarks}, Total Score: ${totalScore}`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`📊 Final Results - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}`);

    await prisma.examSubmission.update({
      where: {
        studentId_examId: {
          studentId,
          examId
        }
      },
      data: {
        answers: updatedAnswers,
        evaluatorNotes: notes || submission.evaluatorNotes,
        score: totalScore
      }
    });

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
          sqMarks: sqMarks,
          isPublished: false
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