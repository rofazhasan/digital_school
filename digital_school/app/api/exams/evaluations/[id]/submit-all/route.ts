import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";

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

    // Check if user has access to this exam
    let exam;
    if (tokenData.user.role === "SUPER_USER") {
      exam = await prisma.exam.findUnique({
        where: { id: examId }
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
        }
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
    }

    // Get all submissions for this exam
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId
      }
    });

    // Process each submission
    for (const submission of submissions) {
      // Calculate total score and separate MCQ/CQ/SQ marks
      let totalScore = 0;
      let mcqMarks = 0;
      let cqMarks = 0;
      let sqMarks = 0;
      const answers = submission.answers as any;
      
      // Get exam sets to determine question types
      const examSets = await prisma.examSet.findMany({
        where: { examId: examId }
      });
      
      // Calculate marks by type from manually awarded marks (excluding MCQ which will be auto-graded)
      for (const key in answers) {
        if (key.endsWith('_marks') && typeof answers[key] === 'number') {
          const questionId = key.replace('_marks', '');
          
          // Determine question type
          let questionType = 'CQ'; // Default to CQ
          for (const examSet of examSets) {
            if (examSet.questionsJson) {
              const questions = typeof examSet.questionsJson === 'string' 
                ? JSON.parse(examSet.questionsJson) 
                : examSet.questionsJson;
              
              const question = questions.find((q: any) => q.id === questionId);
              if (question) {
                questionType = question.type?.toUpperCase() || 'CQ';
                break;
              }
            }
          }
          
          // Skip MCQ questions as they will be auto-graded
          if (questionType === 'SQ') {
            sqMarks += answers[key];
            totalScore += answers[key];
          } else if (questionType === 'CQ') {
            cqMarks += answers[key];
            totalScore += answers[key];
          }
          // MCQ questions are handled separately in auto-grading
        }
      }
      
      // Also calculate MCQ marks from auto-graded questions
      // Get the student's assigned exam set
      const studentExamMap = await prisma.examStudentMap.findFirst({
        where: {
          studentId: submission.studentId,
          examId: examId
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
                const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
                const userAns = normalize(studentAnswer);
                let isCorrect = false;
                
                // Enhanced MCQ answer comparison logic
                if (question.options && Array.isArray(question.options)) {
                  // Check if student answer matches any option marked as correct
                  const correctOption = question.options.find((opt: any) => opt.isCorrect);
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
                    isCorrect = userAns === normalize(correctAnswer.text || String(correctAnswer));
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
                  marks: question.marks,
                  negativeMarking: exam.mcqNegativeMarking
                });
                
                if (isCorrect) {
                  mcqMarks += question.marks;
                  totalScore += question.marks;
                } else {
                  // Apply negative marking for wrong answers
                  if (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                    const negativeMarks = (question.marks * exam.mcqNegativeMarking) / 100;
                    mcqMarks -= negativeMarks;
                    totalScore -= negativeMarks;
                    console.log(`❌ MCQ negative marking applied: -${negativeMarks.toFixed(2)} for question ${question.id}`);
                  }
                }
              }
            }
          }
        }
      }

      // Calculate percentage and grade
      const percentage = calculatePercentage(totalScore, exam.totalMarks);
      const grade = calculateGrade(percentage);

      // Update submission with final score and evaluation time
      await prisma.examSubmission.update({
        where: {
          studentId_examId: {
            studentId: submission.studentId,
            examId: submission.examId
          }
        },
        data: {
          score: totalScore,
          evaluatedAt: new Date()
        }
      });

      console.log(`💾 Saving Result for student ${submission.studentId} - MCQ: ${mcqMarks}, CQ: ${cqMarks}, SQ: ${sqMarks}, Total: ${totalScore}, Percentage: ${percentage}%, Grade: ${grade}`);
      
      try {
        // Update or create Result record
        const result = await prisma.result.upsert({
          where: {
            studentId_examId: {
              studentId: submission.studentId,
              examId: submission.examId
            }
          },
          update: {
            total: totalScore,
            mcqMarks: mcqMarks,
            cqMarks: cqMarks,
            sqMarks: sqMarks,
            percentage: percentage,
            grade: grade,
            isPublished: false,
            examSubmissionId: submission.id
          },
          create: {
            studentId: submission.studentId,
            examId: submission.examId,
            total: totalScore,
            mcqMarks: mcqMarks,
            cqMarks: cqMarks,
            sqMarks: sqMarks,
            percentage: percentage,
            grade: grade,
            isPublished: false,
            examSubmissionId: submission.id
          }
        });
        
        console.log(`✅ Result saved for student ${submission.studentId}:`, {
          id: result.id,
          mcqMarks: result.mcqMarks,
          total: result.total
        });
        
      } catch (error) {
        console.error(`❌ Error saving result for student ${submission.studentId}:`, error);
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting all evaluations:", error);
    return NextResponse.json({ error: "Failed to submit all evaluations" }, { status: 500 });
  }
} 