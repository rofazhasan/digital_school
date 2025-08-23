import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ'];

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id: examId } = await context.params;
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

  // For each set, use questionsJson if present, else fallback to questions relation
  const sets = exam.examSets.map((set) => {
    let questionsArr: any[] = [];
    if (set['questionsJson'] && Array.isArray(set['questionsJson'])) {
      questionsArr = set['questionsJson'];
    } else if (set.questions && Array.isArray(set.questions)) {
      questionsArr = set.questions;
    }
    const mcq = questionsArr.filter((q: any) => q.type === 'MCQ').map((q: any) => {
      // Extract correct answer index from MCQ options and map to Bengali labels
      let correctAnswer = 'ক'; // Default fallback
      
      if (Array.isArray(q.options)) {
        const correctIndex = q.options.findIndex((opt: any) => opt.isCorrect);
        if (correctIndex !== -1 && correctIndex < MCQ_LABELS.length) {
          correctAnswer = MCQ_LABELS[correctIndex];
        }
      }
      
      return {
        q: q.questionText,
        options: Array.isArray(q.options) ? q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt) : [],
        marks: q.marks,
        correctAnswer: correctAnswer,
      };
    });
    // Process CQ questions with subsection-aware shuffling
    let cq = questionsArr.filter((q: any) => q.type === 'CQ');
    
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
    // If no subsections, keep original order
    
    const cqWithAnswers = cq.map((q: any) => {
      const subAnswers = (q.subQuestions || []).map((sub: any) => {
        // Try different possible field names for the answer
        const answer = sub.modelAnswer || sub.answer || sub.text || sub.content || 'উত্তর দেওয়া হবে';
        return answer;
      });
      
      return {
        questionText: q.questionText,
        marks: q.marks,
        modelAnswer: q.modelAnswer,
        subQuestions: q.subQuestions || [],
        subAnswers: subAnswers,
      };
    });
    
    cq = cqWithAnswers;
    const sq = questionsArr.filter((q: any) => q.type === 'SQ').map((q: any) => ({
      questionText: q.questionText,
      marks: q.marks,
      modelAnswer: q.modelAnswer,
    }));
    return {
      setId: set.id, // Use ExamSet.id for QR/barcode
      setName: set.name, // For display (A/B/C...)
      mcq,
      cq,
      sq,
      qrData: { examId, setId: set.id, classId: exam.classId },
      barcode: `${examId}|${set.id}|${exam.classId}`,
    };
  }).filter(set => (set.mcq && set.mcq.length) || (set.cq && set.cq.length) || (set.sq && set.sq.length));

  return NextResponse.json({ examInfo, sets });
} 