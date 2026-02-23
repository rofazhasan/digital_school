import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { evaluateMCQuestion } from "@/lib/evaluation/mcEvaluation";
import { evaluateMTFQuestion } from "@/lib/evaluation/mtfEvaluation";

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
    // IMPORTANT: Only filter to a specific set when we have a confirmed examSetId.
    // If the student has no examSetId (not mapped to a set), fall back to fetching all
    // exam sets (same as the initial load) so evaluation still works correctly.
    const examSetWhere = (studentId && targetExamSetId)
      ? { id: targetExamSetId }
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
          objectiveSubmittedAt: true,
          cqSqSubmittedAt: true,
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
        orderBy: { id: 'asc' }
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

      // Trigger full sweep and release if time is over
      if (isTimeOver) {
        // Run in background to avoid blocking initial load, but ensures DB is consistent
        await finalizeAndReleaseExam(exam.id);
      } else if (isMCQOnly) {
        // For MCQ only, we might want to release earlier if all submitted, 
        // but typically time-over is the safest trigger for auto-release.
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



    // RESULT & MAP PROCESSING ------------------
    let examStudentMaps: { studentId: string, examSetId: string | null }[] = [];

    if (preFetchedStudentMap) {
      examStudentMaps = [preFetchedStudentMap];
    } else {
      examStudentMaps = await prisma.examStudentMap.findMany({
        where: auxiliaryWhere,
        select: {
          studentId: true,
          examSetId: true
        }
      });
    }

    const studentExamSetMap = new Map<string, string>();
    examStudentMaps.forEach(map => {
      if (map.examSetId) studentExamSetMap.set(map.studentId, map.examSetId);
    });

    const examResults = await resultsPromise;
    const studentResultMap = new Map<string, any>();
    examResults.forEach(res => {
      studentResultMap.set(res.studentId, res);
    });

    // Collect and fetch fresh question details
    const questionIds = new Set<string>();
    allQuestions.forEach(q => {
      if (q && q.id) questionIds.add(q.id);
    });

    const questionDetailsMap = new Map<string, string>();
    if (questionIds.size > 0) {
      try {
        const dbQuestions = await prisma.question.findMany({
          where: { id: { in: Array.from(questionIds) } },
          select: { id: true, explanation: true }
        });
        dbQuestions.forEach(q => {
          if (q.explanation) questionDetailsMap.set(q.id, q.explanation);
        });
      } catch (error) {
        console.error("Error fetching question details:", error);
      }
    }

    // Process submissions using the centralized logic
    const { evaluateSubmission } = await import("@/lib/exam-logic");
    const processedSubmissions = [];
    const examSets = (exam as any).examSets || [];

    for (const submission of (exam as any).examSubmissions) {
      try {
        const evaluation = await evaluateSubmission(submission, exam, examSets);

        let evaluationStatus = 'PENDING';
        const hasManualGrading = Object.keys(submission.answers).some(key =>
          key.endsWith('_marks') && typeof submission.answers[key] === 'number' && submission.answers[key] > 0
        );

        if (submission.evaluatedAt) {
          evaluationStatus = 'COMPLETED';
        } else if (hasManualGrading || submission.evaluatorNotes) {
          evaluationStatus = 'IN_PROGRESS';
        }

        let studentTotalMarks = 0;
        const examSetId = studentExamSetMap.get(submission.studentId);
        const studentQuestions = (examSetId && studentQuestionsMap.has(examSetId))
          ? studentQuestionsMap.get(examSetId)
          : allQuestions;

        studentQuestions.forEach((q: any) => studentTotalMarks += (q.marks || 0));

        processedSubmissions.push({
          id: submission.id,
          student: {
            id: submission.student.id,
            name: submission.student.user.name,
            roll: submission.student.roll,
            registrationNo: submission.student.registrationNo
          },
          answers: { ...submission.answers },
          submittedAt: (submission.objectiveSubmittedAt || submission.cqSqSubmittedAt || new Date()).toISOString(),
          totalMarks: studentTotalMarks,
          earnedMarks: evaluation.totalScore,
          status: evaluationStatus,
          evaluatorNotes: submission.evaluatorNotes || null,
          result: {
            mcqMarks: evaluation.mcqMarks,
            cqMarks: evaluation.cqMarks,
            sqMarks: evaluation.sqMarks,
            total: evaluation.totalScore
          },
          submissionStatus: submission.status
        });
      } catch (error) {
        console.error(`Error processing submission for ${submission.studentId}:`, error);
        processedSubmissions.push({
          id: submission.id,
          student: { id: submission.student.id, name: submission.student.user.name },
          answers: submission.answers,
          submittedAt: (submission.objectiveSubmittedAt || submission.cqSqSubmittedAt || new Date()).toISOString(),
          earnedMarks: 0,
          status: 'ERROR'
        });
      }
    }

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

    // Final fallback: Use all unique questions collected from all sets
    if (baseQuestions.length === 0 && allQuestions.length > 0) {
      // Remove duplicates by ID for the base questions view
      const uniqueMap = new Map();
      allQuestions.forEach(q => uniqueMap.set(q.id, q));
      baseQuestions = Array.from(uniqueMap.values());
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
          explanation: explanation || null,
          assertion: q.assertion || null,
          reason: q.reason || null,
          correctOption: q.correctOption || q.correct || null,
          pairs: typeof q.pairs === 'string' ? JSON.parse(q.pairs) : (q.pairs || null),
          // New fields for MTF
          leftColumn: q.leftColumn,
          rightColumn: q.rightColumn,
          matches: q.matches,
          // New INT field
          correctAnswer: q.correctAnswer || q.answer
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