import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: examId } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    // Check if user has access to this exam
    let exam;
    if (tokenData.user.role === "SUPER_USER") {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          class: true,
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          examSets: true,
          examSubmissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { submittedAt: 'asc' }
          },
          evaluationAssignments: {
            include: {
              evaluator: {
                select: {
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });
    } else {
      // For TEACHER/ADMIN, only show if assigned
      exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          evaluationAssignments: {
            some: {
              evaluatorId: tokenData.user.id
            }
          }
        },
        include: {
          class: true,
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          examSets: true,
          examSubmissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { submittedAt: 'asc' }
          },
          evaluationAssignments: {
            include: {
              evaluator: {
                select: {
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get questions from exam sets - each student might have different questions
    const allQuestions: any[] = [];
    const studentQuestionsMap = new Map();
    
    // First try to get questions from generatedSet
    if (exam.generatedSet && typeof exam.generatedSet === 'object') {
      const generatedSet = exam.generatedSet as any;
      if (generatedSet.questions && Array.isArray(generatedSet.questions)) {
        allQuestions.push(...generatedSet.questions);
      }
    }
    
    // Get questions from examSets
    if ((exam as any).examSets) {
      for (const examSet of (exam as any).examSets) {
        if (examSet.questionsJson) {
          try {
            const questionsJson = typeof examSet.questionsJson === 'string' 
              ? JSON.parse(examSet.questionsJson) 
              : examSet.questionsJson;
            if (Array.isArray(questionsJson)) {
              // Store questions by examSet ID
              studentQuestionsMap.set(examSet.id, questionsJson);
              allQuestions.push(...questionsJson);
            }
          } catch (e) {
            console.error('Error parsing questionsJson:', e);
          }
        }
      }
    }
    


    // Process submissions to include evaluation data
    const processedSubmissions = await Promise.all(
      (exam as any).examSubmissions.map(async (submission: any) => {
        // Get questions for this specific student based on their exam set
        let studentQuestions = allQuestions;
        
        // Try to get student's specific exam set questions
        const examStudentMap = await prisma.examStudentMap.findUnique({
          where: {
            studentId_examId: {
              studentId: submission.studentId,
              examId: examId
            }
          }
        });
        
        if (examStudentMap?.examSetId && studentQuestionsMap.has(examStudentMap.examSetId)) {
          studentQuestions = studentQuestionsMap.get(examStudentMap.examSetId);
        }
        
        // Calculate total marks and earned marks
        let totalMarks = 0;
        let earnedMarks = 0;

        // Fix image answers by mapping blob URLs to actual file paths
        const fixedAnswers = { ...submission.answers };
        for (const [questionId, answer] of Object.entries(submission.answers)) {
          if (questionId.endsWith('_images') && Array.isArray(answer)) {
            const questionBaseId = questionId.replace('_images', '');
            // Look for uploaded images for this question
            const uploadDir = `public/uploads/exam-answers/${examId}/${submission.studentId}/${questionBaseId}`;
            try {
              const fs = require('fs');
              const path = require('path');
              if (fs.existsSync(uploadDir)) {
                const files = fs.readdirSync(uploadDir);
                const imageFiles = files.filter((file: string) => 
                  file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                );
                if (imageFiles.length > 0) {
                  // Replace blob URLs with actual file paths
                  fixedAnswers[questionId] = imageFiles.map((file: string) => 
                    `/uploads/exam-answers/${examId}/${submission.studentId}/${questionBaseId}/${file}`
                  );
                }
              }
            } catch (error) {
              console.error('Error fixing image paths:', error);
            }
          }
        }

        for (const question of studentQuestions) {
          totalMarks += question.marks;
          
          const answer = fixedAnswers[question.id];
          if (question.type === 'MCQ') {
            // Auto-grade MCQ
            if (answer && question.correct) {
              const correctAnswer = question.correct;
              let isCorrect = false;
              
              if (typeof correctAnswer === 'number') {
                isCorrect = answer === correctAnswer;
              } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
                isCorrect = answer === correctAnswer.text;
              } else {
                isCorrect = answer === String(correctAnswer);
              }
              
              if (isCorrect) {
                earnedMarks += question.marks;
              }
            }
          } else {
            // For CQ/SQ, get manually assigned marks
            const manualMarks = submission.answers[`${question.id}_marks`] || 0;
            earnedMarks += manualMarks;
          }
        }

        // Get evaluation status - check if submission has evaluation data
        let evaluationStatus = 'PENDING';
        
        // Check if any questions have been manually graded
        const hasManualGrading = Object.keys(submission.answers).some(key => 
          key.endsWith('_marks') && typeof submission.answers[key] === 'number' && submission.answers[key] > 0
        );
        
        if (submission.evaluatedAt) {
          evaluationStatus = 'COMPLETED';
        } else if (hasManualGrading || submission.evaluatorNotes) {
          evaluationStatus = 'IN_PROGRESS';
        }

        // Get result data for this submission
        const result = await prisma.result.findFirst({
          where: {
            studentId: submission.studentId,
            examId: examId
          }
        });

        const submissionData = {
          id: submission.id,
          student: {
            id: submission.student.id,
            name: submission.student.user.name,
            roll: submission.student.roll,
            registrationNo: submission.student.registrationNo
          },
          answers: fixedAnswers,
          submittedAt: submission.submittedAt.toISOString(),
          totalMarks,
          earnedMarks: result ? result.total : earnedMarks, // Use result total if available
          status: evaluationStatus,
          evaluatorNotes: submission.evaluatorNotes || null,
          result: result ? {
            mcqMarks: result.mcqMarks,
            cqMarks: result.cqMarks,
            sqMarks: result.sqMarks,
            total: result.total
          } : null
        };

        console.log(`📊 Submission ${submission.id} result data:`, {
          mcqMarks: result?.mcqMarks,
          total: result?.total,
          hasResult: !!result
        });

        return submissionData;
      })
    );

    // Get questions from any available source
    let baseQuestions: any[] = [];
    
    // First try to get questions from generatedSet
    if (exam.generatedSet && typeof exam.generatedSet === 'object') {
      const generatedSet = exam.generatedSet as any;
      if (generatedSet.questions && Array.isArray(generatedSet.questions)) {
        baseQuestions = generatedSet.questions;
      }
    }
    
    // If no questions from generatedSet, try to get from exam sets
    if (baseQuestions.length === 0 && studentQuestionsMap.size > 0) {
      // Use the first available exam set's questions
      const firstExamSetId = Array.from(studentQuestionsMap.keys())[0];
      baseQuestions = studentQuestionsMap.get(firstExamSetId);
    }
    
    // If still no questions, try to get from a specific student's exam set
    if (baseQuestions.length === 0 && processedSubmissions.length > 0) {
      const firstStudent = processedSubmissions[0];
      const studentMap = await prisma.examStudentMap.findUnique({
        where: {
          studentId_examId: {
            studentId: firstStudent.student.id,
            examId: examId
          }
        }
      });
      
      if (studentMap?.examSetId && studentQuestionsMap.has(studentMap.examSetId)) {
        baseQuestions = studentQuestionsMap.get(studentMap.examSetId);
      }
    }
    

    
    const examData = {
      id: exam.id,
      name: exam.name,
      description: exam.description || '',
      totalMarks: exam.totalMarks,
      questions: baseQuestions.map((q: any) => {
        // Parse subQuestions if it's a JSON string
        let parsedSubQuestions = null;
        if (q.subQuestions) {
          try {
            parsedSubQuestions = typeof q.subQuestions === 'string' 
              ? JSON.parse(q.subQuestions) 
              : q.subQuestions;
          } catch (e) {
            console.error('Error parsing subQuestions:', e);
            parsedSubQuestions = null;
          }
        }
        
        return {
          id: q.id,
          type: q.type.toLowerCase(),
          text: q.questionText || q.text || '',
          marks: q.marks,
          correct: q.correct,
          options: q.options,
          subQuestions: parsedSubQuestions,
          modelAnswer: q.modelAnswer || null
        };
      }),
      submissions: processedSubmissions
    };

    return NextResponse.json(examData);
  } catch (error) {
    console.error("Error fetching exam evaluation data:", error);
    return NextResponse.json({ error: "Failed to fetch exam data" }, { status: 500 });
  }
} 