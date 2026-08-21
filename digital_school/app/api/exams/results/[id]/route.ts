import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { calculateGrade, calculateGPA, calculatePercentage } from '@/lib/utils';
import { evaluateMCQuestion } from '@/lib/evaluation/mcEvaluation';
import { evaluateINTQuestion } from '@/lib/evaluation/intEvaluation';
import { evaluateARQuestion } from '@/lib/evaluation/arEvaluation';
import { evaluateMTFQuestion } from '@/lib/evaluation/mtfEvaluation';
import { evaluateCMAQuestion } from '@/lib/evaluation/cmaEvaluation';
import { evaluateMPCQuestion } from '@/lib/evaluation/mpcEvaluation';
import { Prisma, QuestionType } from '@prisma/client';

interface ProcessedQuestion {
  id: string;
  type: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer: any;
  studentAnswerImages: string[];
  drawingData: {
    imageData: string;
    originalImagePath: string;
    drawingData?: any;
  } | null;
  allDrawings: {
    imageIndex: number;
    imageData: string;
    originalImagePath: string;
    drawingData?: any;
  }[];
  options: any[];
  modelAnswer: string;
  explanation: string;
  subQuestions: any[];
  feedback: string;
  images: string[];
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: string[];
  rightColumn?: string[];
  matches?: Record<string, number>;
  correctAnswer?: any;
  tolerance?: number;
}

// export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.user.id;
    const isTeacher = token.user.role !== 'STUDENT';

    // 1. Consolidated fetching of User, StudentProfile, Submission, Result, and Map
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            class: true,
            examSubmissions: {
              where: { examId },
              include: { drawings: true },
              take: 1
            },
            results: {
              where: { examId },
              take: 1
            },
            examStudentMaps: {
              where: { examId },
              take: 1
            },
            resultReviews: {
              where: { examId },
              include: { reviewer: { select: { id: true, name: true } } },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    const studentProfile = user.studentProfile;
    let submission: any = studentProfile.examSubmissions[0];
    let result = studentProfile.results[0];
    const studentExamMap = studentProfile.examStudentMaps[0];
    const reviewRequest = studentProfile.resultReviews[0];
    const drawings = submission?.drawings || [];

    if (!submission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 });
    }

    // 2. Fetch Exam with min fields
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: { class: { select: { name: true } }, examSets: true }
    });

    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // Auto-finalize and evaluate if expired or if result is missing
    if (submission && (submission.status === 'IN_PROGRESS' || !result)) {
      const { autoSubmitExpiredSections, evaluateSubmission } = await import('@/lib/exam-logic');
      const updatedSub = await autoSubmitExpiredSections(submission, exam as any);
      submission = Object.assign(submission, updatedSub, { drawings });
      if (!result && submission.status === 'SUBMITTED') {
        const examSets = exam.examSets || await db.examSet.findMany({ where: { examId } });
        await evaluateSubmission(submission, exam as any, examSets, true);
        result = await db.result.findUnique({
          where: { studentId_examId: { studentId: studentProfile.id, examId } }
        }) as any;
      }
    }

    // 3. Optimized Exam Set Fetching — check submission.examSetId FIRST (most accurate)
    // then fall back to exam_student_maps, then any set for the exam
    const examSetId = (submission as any).examSetId || studentExamMap?.examSetId;
    let examSet = null;
    if (examSetId) {
      examSet = await db.examSet.findUnique({ where: { id: examSetId } });
    } else {
      examSet = await db.examSet.findFirst({ where: { examId } });
    }

    // 4. Determine visibility
    const hideDetails = !isTeacher && result && !result.isPublished;

    // 5. Statistics (Aggregated) - Moved up to include in both private/public views
    const [stats, rankCount] = await Promise.all([
      db.result.aggregate({
        where: { examId },
        _count: { _all: true },
        _avg: { total: true },
        _max: { total: true },
        _min: { total: true }
      }),
      db.result.count({
        where: { examId, total: { gt: result?.total || 0 } }
      })
    ]);

    // 6. Return minimal data if hidden
    if (hideDetails) {
      return NextResponse.json({
        exam: { ...exam, class: exam.class.name },
        student: {
          id: studentProfile.id,
          name: user.name,
          roll: studentProfile.roll,
          registrationNo: studentProfile.registrationNo,
          class: studentProfile.class.name
        },
        submission: {
          id: submission.id,
          submittedAt: (submission as any).submittedAt,
          status: submission.status
        },
        result: (result) ? { isPublished: false } : null,
        reviewRequest,
        questions: [], // STRICT PRIVACY: No questions
        statistics: {
          totalStudents: stats._count._all,
          averageScore: 0, // Hide score-related stats
          highestScore: 0,
          lowestScore: 0
        }
      });
    }

    // Cache parsing results
    let questions = [];
    if (examSet?.questionsJson) {
      questions = typeof examSet.questionsJson === 'string' ? JSON.parse(examSet.questionsJson) : examSet.questionsJson;
    }

    let studentAnswers = {};
    if (submission.answers) {
      studentAnswers = typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers;
    }

    // 7. Process questions (Full View)
    const processedQuestions = (questions as any[]).map((question: any) => {
      const questionId = question.id;
      const studentAnswer = (studentAnswers as any)[questionId];

      // Extract images efficiently
      const studentAnswerImages = [];
      if ((studentAnswers as any)[`${questionId}_image`]) studentAnswerImages.push((studentAnswers as any)[`${questionId}_image`]);
      if (Array.isArray((studentAnswers as any)[`${questionId}_images`])) studentAnswerImages.push(...(studentAnswers as any)[`${questionId}_images`]);

      const allDrawings = submission.drawings.filter(d => d.questionId === questionId);
      const drawingData = allDrawings.find(d => d.imageIndex === 0) || null;

      const type = (question.type || '').toUpperCase();
      let awardedMarks = 0;
      const maxMarks = Number(question.marks) || 0;

      // --- BUTTERY FALLBACK EVALUATION START ---
      const normalize = (s: any) => String(s !== undefined && s !== null ? s : "").trim().toLowerCase();

      // 1. Process sub-questions (for SMCQ, CQ, SQ)
      let processedSubQuestions: any[] = [];
      const rawSubQuestions = question.subQuestions || question.sub_questions || [];

      if (rawSubQuestions.length > 0) {
        processedSubQuestions = rawSubQuestions.map((subQ: any, subIdx: number) => {
          const subId = `${questionId}_sub_${subIdx}`;
          const descPrefix = `${questionId}_desc_${subIdx}_`;
          
          let subAns = (studentAnswers as any)[subId];
          
          // Check for advanced descriptive keys (aggregated object)
          // 1. Check in nested questionId object
          const nested = (studentAnswers as any)[questionId];
          if (typeof nested === 'object' && nested !== null) {
            const descKeys = Object.keys(nested).filter(k => k.startsWith(descPrefix));
            if (descKeys.length > 0) {
              const aggregated: Record<string, any> = {};
              descKeys.forEach(k => {
                aggregated[k.replace(descPrefix, '')] = (nested as any)[k];
              });
              subAns = aggregated;
            } else if (typeof nested === 'string' && subIdx === 0) {
              subAns = nested;
            }
          }
          
          // 2. Fallback to flat studentAnswers keys
          if (!subAns) {
            const descKeys = Object.keys(studentAnswers).filter(k => k.startsWith(descPrefix));
            if (descKeys.length > 0) {
              const aggregated: Record<string, any> = {};
              descKeys.forEach(k => {
                aggregated[k.replace(descPrefix, '')] = (studentAnswers as any)[k];
              });
              subAns = aggregated;
            }
          }

          // MAP SUB-QUESTION IMAGES (Robust prefix-based collection)
          const subImages: string[] = [];
          
          // Scan for all images associated with this specific sub-question/part
          Object.keys(studentAnswers).forEach(key => {
            if (key.startsWith(subId) || key.startsWith(descPrefix)) {
              const val = (studentAnswers as any)[key];
              if (typeof val === 'string' && (val.startsWith('http') || val.includes('/uploads/'))) {
                subImages.push(val);
              } else if (Array.isArray(val)) {
                val.forEach(v => {
                  if (typeof v === 'string' && (v.startsWith('http') || v.includes('/uploads/'))) {
                    subImages.push(v);
                  }
                });
              }
            }
          });

          // Ensure unique images
          const uniqueSubImages = Array.from(new Set(subImages));

          // MAP SUB-QUESTION DRAWINGS (Match by original path for accuracy)
          const subDrawingsForPart = allDrawings.filter(d =>
            uniqueSubImages.includes(d.originalImagePath) || d.imageIndex === subIdx
          );


          // Try pre-calculated marks
          let subAwarded = (studentAnswers as any)[`${subId}_marks`];

          // Re-calculate if MCQ/SMCQ fallback needed
          if ((subAwarded === undefined || subAwarded === null) && type === 'SMCQ') {
            if (subAns !== undefined && subAns !== null && subAns !== '' && subAns !== 'No answer provided') {
              const subOptions = subQ.options || [];
              const userAns = normalize(subAns);
              let isSubCorrect = false;

              if (Array.isArray(subOptions)) {
                const correctOption = subOptions.find((opt: any) => opt.isCorrect);
                if (correctOption) {
                  isSubCorrect = userAns === normalize(typeof correctOption === 'object' ? correctOption.text : correctOption);
                }
              }

              if (!isSubCorrect && subQ.correctAnswer !== undefined && subQ.correctAnswer !== null) {
                const correctIdx = Number(subQ.correctAnswer);
                if (!isNaN(correctIdx) && subOptions[correctIdx]) {
                  isSubCorrect = userAns === normalize(typeof subOptions[correctIdx] === 'object' ? subOptions[correctIdx].text : subOptions[correctIdx]);
                } else {
                  isSubCorrect = userAns === normalize(subQ.correctAnswer);
                }
              }
              subAwarded = isSubCorrect ? (Number(subQ.marks) || 0) : 0;
            } else {
              subAwarded = 0;
            }
          }

          const subTotalMarks = Number(subQ.marks) || 0;
          return {
            ...subQ,
            studentAnswer: subAns,
            studentImages: subImages, // Properly mapped now!
            allDrawings: subDrawingsForPart, // For annotations on sub-questions
            awardedMarks: Number(subAwarded) || 0,
            isCorrect: Number(subAwarded) >= subTotalMarks && subTotalMarks > 0
          };
        });
      }

      // 2. Main awarded marks
      // For objective types (MCQ, AR, INT, MC), ALWAYS re-calculate from the current examSet questions
      // to avoid stale pre-saved marks from a different examSet mapping.
      // For manual-graded types (CQ, SQ, SMCQ), trust pre-saved marks.
      const preSavedMarks = (studentAnswers as any)[`${questionId}_marks`];
      const isObjectiveType = ['MCQ', 'MC', 'AR', 'INT', 'NUMERIC', 'MTF', 'CMA', 'MPC'].includes(type);
      let calculatedMarks: number | undefined = isObjectiveType ? undefined : preSavedMarks;

      if (calculatedMarks === undefined || calculatedMarks === null) {
        if (type === 'MCQ') {
          if (studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '' && studentAnswer !== 'No answer provided') {
            const options = question.options || [];
            const userAns = normalize(studentAnswer);
            let isCorrect = false;

            if (Array.isArray(options)) {
              const correctIdx = options.findIndex((opt: any) => opt && (opt.isCorrect || (typeof opt === 'object' && opt.isCorrect)));
              if (correctIdx !== -1) {
                const correctOpt = options[correctIdx];
                const correctText = normalize(typeof correctOpt === 'object' ? correctOpt.text : correctOpt);
                const letter = String.fromCharCode(97 + correctIdx);
                isCorrect = userAns === correctText || userAns === String(correctIdx) || userAns === letter;
              }

              if (!isCorrect) {
                const num = parseInt(userAns, 10);
                if (!isNaN(num) && num >= 0 && num < options.length) {
                  isCorrect = Boolean(options[num]?.isCorrect);
                }
              }
            }

            if (!isCorrect) {
              const rawC = question.correctOption !== undefined ? question.correctOption : (question.correct !== undefined ? question.correct : question.correctAnswer);
              if (rawC !== undefined && rawC !== null) {
                const cAns = normalize(String(rawC));
                if (userAns === cAns) {
                  isCorrect = true;
                } else if (Array.isArray(options)) {
                  const cNum = parseInt(cAns, 10);
                  if (!isNaN(cNum)) {
                    if (cNum >= 0 && cNum < options.length) {
                      const opt = options[cNum];
                      const optText = normalize(typeof opt === 'object' ? opt.text : opt);
                      if (userAns === optText || userAns === String(cNum)) isCorrect = true;
                    }
                    if (!isCorrect && cNum >= 1 && cNum <= options.length) {
                      const opt = options[cNum - 1];
                      const optText = normalize(typeof opt === 'object' ? opt.text : opt);
                      if (userAns === optText || userAns === String(cNum - 1)) isCorrect = true;
                    }
                  }
                  const uNum = parseInt(userAns, 10);
                  if (!isCorrect && !isNaN(uNum)) {
                    if (uNum >= 0 && uNum < options.length) {
                      const opt = options[uNum];
                      const optText = normalize(typeof opt === 'object' ? opt.text : opt);
                      if (optText === cAns) isCorrect = true;
                    }
                  }
                }
              }
            }
            calculatedMarks = isCorrect ? maxMarks : (exam.mcqNegativeMarking ? -((maxMarks * exam.mcqNegativeMarking) / 100) : 0);
          }
        } else if (type === 'MC') {
          const mcAnswer = studentAnswer;
          if (mcAnswer !== undefined && mcAnswer !== null) {
            const mcAns = typeof mcAnswer === 'object' && mcAnswer !== null && Array.isArray((mcAnswer as any).selectedOptions)
              ? mcAnswer as { selectedOptions: number[] }
              : { selectedOptions: Array.isArray(mcAnswer) ? mcAnswer : [] };
            calculatedMarks = evaluateMCQuestion(question as any, mcAns, {
              negativeMarking: exam.mcqNegativeMarking || 0,
              partialMarking: true
            });
          }
        } else if (type === 'SMCQ') {
          calculatedMarks = processedSubQuestions.reduce((acc, sq) => acc + (Number(sq.awardedMarks) || 0), 0);
        } else if (type === 'INT' || type === 'NUMERIC') {
          const intResult = evaluateINTQuestion(question, studentAnswer);
          if (!intResult.isCorrect && studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '' && studentAnswer !== 'No answer provided') {
            // Apply negative marking for wrong INT/NUMERIC answers
            calculatedMarks = exam.mcqNegativeMarking ? -((maxMarks * exam.mcqNegativeMarking) / 100) : 0;
          } else {
            calculatedMarks = intResult.score;
          }
        } else if (type === 'AR') {
          const arResult = evaluateARQuestion(question, studentAnswer);
          if (arResult.isCorrect) {
            calculatedMarks = arResult.score;
          } else if (arResult.isAttempted && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
            calculatedMarks = -((maxMarks * exam.mcqNegativeMarking) / 100);
          } else {
            calculatedMarks = 0;
          }
        } else if (type === 'MTF') {
          const hasMatchSet = studentAnswer && (Array.isArray((studentAnswer as any).matches) ? (studentAnswer as any).matches.length > 0 : Object.keys(studentAnswer as any).length > 0);
          calculatedMarks = hasMatchSet ? evaluateMTFQuestion(question, studentAnswer || {}).score : 0;
        } else if (type === 'CMA') {
          let parsedAns = studentAnswer;
          if (typeof parsedAns === 'string') {
            try { parsedAns = JSON.parse(parsedAns); } catch {}
          }
          const hasAttempt = parsedAns !== undefined && parsedAns !== null && (typeof parsedAns === 'object' ? Object.values(parsedAns).some(v => v !== undefined && v !== null && v !== '') : parsedAns !== '');
          if (!hasAttempt) {
            calculatedMarks = 0;
          } else {
            const cmaRes = evaluateCMAQuestion(question as any, (typeof parsedAns === 'object' ? parsedAns : {}) as any);
            calculatedMarks = cmaRes.score;
          }
        } else if (type === 'MPC') {
          let parsedAns = studentAnswer;
          if (typeof parsedAns === 'string') {
            try { parsedAns = JSON.parse(parsedAns); } catch {}
          }
          const hasAttempt = parsedAns !== undefined && parsedAns !== null && (typeof parsedAns === 'object' ? Object.values(parsedAns).some(v => v !== undefined && v !== null && v !== '') : parsedAns !== '');
          if (!hasAttempt) {
            calculatedMarks = 0;
          } else {
            const mpcRes = evaluateMPCQuestion(question as any, (typeof parsedAns === 'object' ? parsedAns : {}) as any);
            calculatedMarks = mpcRes.score;
          }
        }
      }

      awardedMarks = Number(calculatedMarks) || 0;
      // --- BUTTERY FALLBACK EVALUATION END ---

      const resolvedCorrectOption = question.correctOption !== undefined ? question.correctOption : (question.correct !== undefined ? question.correct : null);

      return {
        id: question.id,
        type: question.type,
        questionText: question.questionText || question.text || "",
        marks: maxMarks,
        awardedMarks,
        isCorrect: awardedMarks >= maxMarks && maxMarks > 0,
        studentAnswer,
        studentAnswerImages,
        drawingData,
        allDrawings,
        options: question.options || [],
        subQuestions: processedSubQuestions,
        modelAnswer: question.modelAnswer || "",
        explanation: question.explanation || "",
        // AR fields
        assertion: question.assertion || null,
        reason: question.reason || null,
        // MTF fields
        leftColumn: question.leftColumn || null,
        rightColumn: question.rightColumn || null,
        matches: question.matches || null,
        correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : resolvedCorrectOption,
        correctOption: resolvedCorrectOption,
        correct: resolvedCorrectOption,
      };
    });


    const isSuspended = submission.exceededQuestionLimit || (result as any)?.status === 'SUSPENDED';
    const source = (result as any)?.omrScanId ? 'OMR' : 'ONLINE';
    const setName = examSet?.name || 'A';

    return NextResponse.json({
      exam: {
        ...exam,
        class: exam.class.name,
        source,
        set: setName,
        setName
      },
      source,
      setName,
      omrScanId: (result as any)?.omrScanId || null,
      student: {
        id: studentProfile.id,
        name: user.name,
        roll: studentProfile.roll,
        registrationNo: studentProfile.registrationNo,
        class: studentProfile.class.name
      },
      submission: {
        ...submission,
        status: isSuspended ? 'SUSPENDED' : submission.status
      },
      result: (result && (result.isPublished || isTeacher)) ? {
        ...result,
        source,
        setName,
        grade: calculateGrade(result.percentage || 0, Number(exam.passMarks) || 33),
        gpa: calculateGPA(result.percentage || 0, Number(exam.passMarks) || 33),
        rank: rankCount + 1,
        status: isSuspended ? 'SUSPENDED' : (result as any).status
      } : (result ? { isPublished: false } : null),
      reviewRequest,
      questions: processedQuestions,
      statistics: {
        totalStudents: stats._count._all,
        averageScore: stats._avg.total || 0,
        highestScore: stats._max.total || 0,
        lowestScore: stats._min.total || 0
      }
    });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
