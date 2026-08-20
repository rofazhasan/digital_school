import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTemplateGeometry } from '@/lib/omr/geometry-template';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch Exam with Sets and Questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examSets: {
          include: {
            questions: true
          }
        },
        class: {
          include: {
            students: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    // 2. Generate canonical template geometry
    const geometry = generateTemplateGeometry('C_11_12', 1, examId);

    // 3. Build answer keys per set
    const sets = exam.examSets.map(s => {
      const answerKey: Record<number, string> = {};
      
      // Extract from questionsKey json or individual questions
      if (s.questionsJson) {
        const qJson = s.questionsJson as any;
        if (Array.isArray(qJson)) {
          qJson.forEach((q: any, idx: number) => {
            const opt = q.correctOption !== undefined ? ['A', 'B', 'C', 'D'][q.correctOption] : (q.answer || 'A');
            answerKey[idx + 1] = opt;
          });
        }
      } else if (s.questions && s.questions.length > 0) {
        s.questions.forEach((q, idx) => {
          const opt = q.correctOption !== null && q.correctOption !== undefined ? ['A', 'B', 'C', 'D'][q.correctOption] : 'A';
          answerKey[idx + 1] = opt;
        });
      } else if (exam.generatedSet) {
        const genSet = exam.generatedSet as any;
        if (Array.isArray(genSet.mcq)) {
          genSet.mcq.forEach((q: any, idx: number) => {
            const opt = q.correctOption !== undefined ? ['A', 'B', 'C', 'D'][q.correctOption] : (q.answer || 'A');
            answerKey[idx + 1] = opt;
          });
        }
      }

      return {
        setId: s.id,
        setName: s.name || 'A',
        answerKey
      };
    });

    // 4. Build Student Identity Roster
    const students = exam.class?.students.map(st => ({
      id: st.id,
      roll: st.roll,
      registrationNo: st.registrationNo,
      name: st.user?.name || 'Student',
      classId: st.classId
    })) || [];

    const packagePayload = {
      exam: {
        id: exam.id,
        title: exam.name,
        description: exam.description,
        date: exam.date ? exam.date.toISOString() : undefined,
        duration: exam.duration,
        passMarks: exam.passMarks,
        totalMarks: exam.totalMarks,
        mcqNegativeMarking: exam.mcqNegativeMarking || 0,
        type: exam.type
      },
      template: {
        templateId: 'C_11_12',
        version: 1,
        name: 'Rofaz Academy OMR Template C(11,12)',
        geometry
      },
      sets,
      students,
      packageVersion: 1,
      downloadedAt: new Date().toISOString()
    };

    return NextResponse.json(packagePayload);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate exam package' },
      { status: 500 }
    );
  }
}
