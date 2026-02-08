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

    // Fast-path: Define filters early
    const submissionWhere = studentId ? { studentId: studentId } : {};
    const auxiliaryWhere = studentId ? { examId: examId, studentId: studentId } : { examId: examId };

    // PARALLELIZATION START ---------------------

    // 1. Kick off Results fetch immediately (Independent query)
    const resultsPromise = prisma.result.findMany({
      where: auxiliaryWhere,
      select: {
        studentId: true,
        mcqMarks: true,
        cqMarks: true,
        sqMarks: true,
        total: true
      }
    });

    // 2. Pre-fetch Map (Needed for Exam Set filtering)
    // We selecting studentId too so we can reuse this record later
    let preFetchedStudentMap: { studentId: string, examSetId: string | null } | null = null;
    let targetExamSetId: string | undefined = undefined;

    if (studentId) {
      preFetchedStudentMap = await prisma.examStudentMap.findUnique({
        where: {
          studentId_examId: {
            studentId,
            examId
          }
        },
        select: {
          studentId: true,
          examSetId: true
        }
      });
      if (preFetchedStudentMap?.examSetId) {
        targetExamSetId = preFetchedStudentMap.examSetId;
      }
    }

    // -------------------------------------------

    // Dynamic ExamSet filtering
    const examSetWhere = studentId
      ? (targetExamSetId ? { id: targetExamSetId } : { id: 'none' })
      : {};

    // Common selection object for sub-relations to reuse
    const examInclude = {
      class: true,
      createdBy: {
        select: {
          name: true,
          email: true
        }
      },
      examSets: {
        // Optimize: Filter by specific set ID if known
        where: examSetWhere,
        // Optimize: Only fetch ID and questions, skip metadata
        select: {
          id: true,
          questionsJson: true
        }
      },
      examSubmissions: {
        where: submissionWhere, // Filter by studentId if present
        select: {
          id: true,
          studentId: true,
          answers: true,
          status: true,
          submittedAt: true,
          score: true,
          evaluatorNotes: true,
          evaluatedAt: true,
          student: {
            select: {
              id: true,
              roll: true,
              registrationNo: true,
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
    };

    if (tokenData.user.role === "SUPER_USER") {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: examInclude as any // Type assertion for complex include
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
        include: examInclude as any
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // -------------------------------------------------------------------------
    // AUTO-RELEASE TRIGGER (Teacher View Fallback)
    // -------------------------------------------------------------------------
    try {
      const { isMCQOnlyExam, finalizeAndReleaseExam } = await import("@/lib/exam-logic");
      const isMCQOnly = isMCQOnlyExam(exam, (exam as any).examSets);
      const isTimeOver = (new Date() > new Date(exam.endTime));

      // If MCQ only and time is over, trigger release (handled safely/idempotently by lib)
      if (isMCQOnly && isTimeOver) {
        // Run in background but await to ensure consistency if this is the first view
        await finalizeAndReleaseExam(exam.id);
      }
    } catch (e) {
      console.error("Auto-release trigger failed in evaluation API:", e);
      // Continue loading page even if trigger fails
    }
    // -------------------------------------------------------------------------

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

    // Collect all question IDs to fetch fresh difficultyDetail/explanation
    const questionIds = new Set<string>();
    allQuestions.forEach(q => {
      if (q && q.id) {
        questionIds.add(q.id);
      }
    });

    // Fetch fresh details from DB
    const questionDetailsMap = new Map<string, string>();
    if (questionIds.size > 0) {
      try {
        const dbQuestions = await prisma.question.findMany({
          where: {
            id: {
              in: Array.from(questionIds)
            }
          },
          select: {
            id: true,

          }
        });

        dbQuestions.forEach(q => {

        });
      } catch (error) {
        console.error("Error fetching question details:", error);
      }
    }

    // RESULT & MAP PROCESSING ------------------

    // Reuse or Fetch Maps:
    // If we have a preFetched map, use it. Otherwise fetch (Teacher View).
    let examStudentMaps: { studentId: string, examSetId: string | null }[] = [];

    if (preFetchedStudentMap) {
      // Zero-Cost: Reuse the already fetched record
      examStudentMaps = [preFetchedStudentMap];
    } else {
      // Teacher View: Fetch all maps
      examStudentMaps = await prisma.examStudentMap.findMany({
        where: auxiliaryWhere,
        select: {
          studentId: true,
          examSetId: true
        }
      });
    }

    // Create lookup map: studentId -> examSetId
    const studentExamSetMap = new Map<string, string>();
    examStudentMaps.forEach(map => {
      if (map.examSetId) studentExamSetMap.set(map.studentId, map.examSetId);
    });

    // Await parallel results
    const examResults = await resultsPromise;

    // Create lookup map: studentId -> Result
    const studentResultMap = new Map<string, any>();
    examResults.forEach(res => {
      studentResultMap.set(res.studentId, res);
    });

    // Process submissions using in-memory lookups
    const processedSubmissions = (exam as any).examSubmissions.map((submission: any) => {
      // Get questions for this specific student based on their exam set
      let studentQuestions = allQuestions;

      // Efficient Lookup
      const examSetId = studentExamSetMap.get(submission.studentId);
      if (examSetId && studentQuestionsMap.has(examSetId)) {
        studentQuestions = studentQuestionsMap.get(examSetId);
      }

      // Calculate total marks and earned marks
      let totalMarks = 0;
      let earnedMarks = 0;

      // Use submission answers directly as Cloudinary URLs are now authoritative
      const fixedAnswers = { ...submission.answers };

      for (const question of studentQuestions) {
        totalMarks += question.marks;

        const answer = fixedAnswers[question.id];
        if (question.type === 'MCQ') {
          // Auto-grade MCQ
          if (answer) {
            const normalize = (s: string) => String(s).trim().toLowerCase().normalize();
            const userAns = normalize(answer);
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
                isCorrect = userAns === normalize(correctAnswer.text || String(correctAnswer));
              } else if (Array.isArray(correctAnswer)) {
                // Handle array format (e.g., ["answer1", "answer2"])
                isCorrect = correctAnswer.some(ans => normalize(String(ans)) === userAns);
              } else {
                isCorrect = userAns === normalize(String(correctAnswer));
              }
            }

            // Final fallback: use question.correct
            if (!isCorrect && question.correct) {
              const correctAns = normalize(String(question.correct));
              isCorrect = userAns === correctAns;
            }

            if (isCorrect) {
              earnedMarks += question.marks;
            } else {
              // Apply negative marking for wrong answers
              if ((exam as any).mcqNegativeMarking && (exam as any).mcqNegativeMarking > 0) {
                const negativeMarks = (question.marks * (exam as any).mcqNegativeMarking) / 100;
                earnedMarks -= negativeMarks;
              }
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

      // Efficient Result Lookup
      const result = studentResultMap.get(submission.studentId);

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
        } : null,
        submissionStatus: submission.status // Expose raw submission status (IN_PROGRESS/SUBMITTED)
      };

      return submissionData;
    });

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
      class: exam.class,
      subject: (exam as any).subject || null,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      mcqNegativeMarking: (exam as any).mcqNegativeMarking || 0,
      cqRequiredQuestions: (exam as any).cqRequiredQuestions,
      sqRequiredQuestions: (exam as any).sqRequiredQuestions,
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

        // Extract explanation: DB > Question Level > Option Level
        let explanation = questionDetailsMap.get(q.id) || q.explanation;

        if (!explanation && Array.isArray(q.options)) {
          const correctOpt = q.options.find((opt: any) => opt.isCorrect);
          if (correctOpt && correctOpt.explanation) {
            explanation = correctOpt.explanation;
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
          modelAnswer: q.modelAnswer || null,
          explanation: explanation || null
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