import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id: examId } = params;
  // Fetch exam with sets and questionsJson
  const exam = await prismadb.exam.findUnique({
    where: { id: examId },
    include: {
      class: true,
      examSets: {
        include: {
          questions: {
            select: {
              subject: true,
              type: true,
              questionText: true,
              marks: true,
              options: true,
              subQuestions: true,
              modelAnswer: true,

            }
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Extract subject from questions - get the most common subject or first available
  let examSubject = '';
  const allQuestions = exam.examSets.flatMap(set => set.questions);
  if (allQuestions.length > 0) {
    // Get the most common subject from questions
    const subjectCounts: { [key: string]: number } = {};
    allQuestions.forEach(q => {
      if (q.subject) {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      }
    });

    // Find the subject with the highest count
    const mostCommonSubject = Object.entries(subjectCounts).reduce((a, b) =>
      (subjectCounts[a[0]] || 0) > (subjectCounts[b[0]] || 0) ? a : b
    );

    examSubject = mostCommonSubject[0] || '';
  }

  // If no subject found from questions relation, try to get from questionsJson
  if (!examSubject) {
    for (const set of exam.examSets) {
      if (set.questionsJson && Array.isArray(set.questionsJson)) {
        const jsonQuestions = set.questionsJson;
        for (const q of jsonQuestions) {
          if (q && typeof q === 'object' && 'subject' in q && typeof q.subject === 'string') {
            examSubject = q.subject;
            break;
          }
        }
        if (examSubject) break;
      }
    }
  }

  // If still no subject, try to get from the first question's subject
  if (!examSubject && allQuestions.length > 0) {
    examSubject = allQuestions[0].subject || '';
  }

  const examInfo = {
    id: exam.id,
    title: exam.name,
    subject: examSubject, // Use the actual subject from questions
    class: exam.class?.name || '',
    date: exam.date.toISOString().split('T')[0],
    duration: exam.duration ? `${exam.duration} মিনিট` : '',
    totalMarks: exam.totalMarks?.toString() || '',
    invigilator: '', // Add if available
    room: '', // Add if available
    schoolName: '', // Add if available
    schoolAddress: '', // Add if available
    // Add negative marking and question selection info
    mcqNegativeMarking: exam.mcqNegativeMarking || 0,
    cqRequiredQuestions: exam.cqRequiredQuestions || 0,
    sqRequiredQuestions: exam.sqRequiredQuestions || 0,
    cqSubsections: exam.cqSubsections || null,
  };

  // Collect all question IDs to fetch fresh difficultyDetail/explanation
  const questionIds = new Set<string>();

  exam.examSets.forEach(set => {
    let questionsArr: any[] = [];
    if (set['questionsJson'] && Array.isArray(set['questionsJson'])) {
      questionsArr = set['questionsJson'];
    } else if (set.questions && Array.isArray(set.questions)) {
      questionsArr = set.questions;
    }

    questionsArr.forEach((q: any) => {
      if (q && q.id) {
        questionIds.add(q.id);
      }
    });
  });

  // Fetch fresh details from DB
  let questionDetailsMap = new Map<string, string>();
  if (questionIds.size > 0) {
    try {
      const dbQuestions = await prismadb.question.findMany({
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

  // For each set, use questionsJson if present, else fallback to questions relation
  const sets = exam.examSets.map((set) => {
    let questionsArr: any[] = [];
    if (set['questionsJson'] && Array.isArray(set['questionsJson'])) {
      questionsArr = set['questionsJson'];
    } else if (set.questions && Array.isArray(set.questions)) {
      questionsArr = set.questions;
    }
    const mcq = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'MCQ').map((q: any) => {
      // Extract correct answer index from MCQ options and map to Bengali labels
      let correctAnswer = 'ক'; // Default fallback

      if (Array.isArray(q.options)) {
        const correctIndex = q.options.findIndex((opt: any) => opt.isCorrect);
        if (correctIndex !== -1 && correctIndex < MCQ_LABELS.length) {
          correctAnswer = MCQ_LABELS[correctIndex];
        }
      }

      // Extract explanation from correct option if not found at top level
      let explanation = questionDetailsMap.get(q.id) || q.explanation;

      if (!explanation && Array.isArray(q.options)) {
        const correctOpt = q.options.find((opt: any) => opt.isCorrect);
        if (correctOpt && correctOpt.explanation) {
          explanation = correctOpt.explanation;
        }
      }

      return {
        ...q,
        q: q.questionText,
        options: Array.isArray(q.options) ? q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt) : [],
        correctAnswer: correctAnswer,
        explanation: explanation,
      };
    });

    const mc = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'MC').map((q: any) => ({
      ...q,
      q: q.questionText,
      options: Array.isArray(q.options) ? q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt) : [],
    }));

    const int = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'INT' || (q.type || "").toUpperCase() === 'NUMERIC').map((q: any) => ({
      ...q,
      q: q.questionText,
    }));

    const ar = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'AR').map((q: any) => ({
      ...q,
      q: q.questionText || q.assertion,
    }));

    const mtf = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'MTF').map((q: any) => ({
      ...q,
      q: q.questionText,
    }));

    // Process CQ questions with subsection-aware shuffling
    let cq = questionsArr.filter((q: any) => (q.type || "").toUpperCase() === 'CQ');

    // If there are subsections, process them according to subsection rules
    if (exam.cqSubsections && Array.isArray(exam.cqSubsections) && exam.cqSubsections.length > 1) {
      // Multiple subsections - maintain order but shuffle within each subsection
      const processedCq: any[] = [];

      exam.cqSubsections.forEach((subsection: any) => {
        const startIdx = subsection.startIndex - 1; // Convert to 0-based index
        const endIdx = subsection.endIndex;
        const subsectionQuestions = cq.slice(startIdx, endIdx);

        if (subsectionQuestions.length > 0) {
          // Shuffle questions within this subsection only
          const shuffledSubsection = shuffleArray([...subsectionQuestions]);
          processedCq.push(...shuffledSubsection);
        }
      });

      cq = processedCq;
    } else if (exam.cqSubsections && Array.isArray(exam.cqSubsections) && exam.cqSubsections.length === 1) {
      // Single subsection - can shuffle all CQ questions
      cq = shuffleArray([...cq]);
    }

    const cqWithAnswers = cq.map((q: any) => {
      const subAnswers = (q.subQuestions || []).map((sub: any) => {
        const answer = sub.modelAnswer || sub.answer || sub.text || sub.content || 'উত্তর দেওয়া হবে';
        return answer;
      });

      return {
        ...q,
        subAnswers: subAnswers,
      };
    });

    cq = cqWithAnswers;

    const sq = questionsArr.filter((q: any) => q.type === 'SQ').map((q: any) => ({
      ...q,
    }));

    return {
      setId: set.id,
      setName: set.name,
      mcq,
      mc,
      int,
      ar,
      mtf,
      cq,
      sq,
      qrData: { examId, setId: set.id, classId: exam.classId },
      barcode: `${examId}|${set.id}|${exam.classId}`,
    };
  }).filter(set =>
    set.mcq?.length ||
    set.mc?.length ||
    set.int?.length ||
    set.ar?.length ||
    set.mtf?.length ||
    set.cq?.length ||
    set.sq?.length
  );

  return NextResponse.json({ examInfo, sets });
}
