import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = token.user;
    const { id: examId } = await params;

    // Validate examId
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // Fetch exam and student's result
    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      include: {
        class: {
          include: {
            institute: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Find the student's profile first
    const studentProfile = await prismadb.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true
          }
        },
        class: true
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Find the student's result
    const result = await prismadb.result.findFirst({
      where: {
        examId,
        studentId: studentProfile.id
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            class: true
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Generate simple text result for individual student
    const content = generateIndividualResultText({
      exam,
      result,
      institute: exam.class.institute
    });

    // Sanitize filename
    const sanitizedFilename = `${result.student.user.name}_${exam.name}_Result.txt`
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`
      }
    });

  } catch (error) {
    console.error('Error generating individual result:', error);

    const err = error as any;

    // Handle specific database errors
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Database constraint violation' }, { status: 400 });
    }

    return NextResponse.json(
      { error: `Internal server error: ${err.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

interface IndividualResultData {
  exam: any;
  result: any;
  institute: any;
}

function generateIndividualResultText(data: IndividualResultData): string {
  const { exam, result, institute } = data;

  const content = `
EXAM RESULT - ${exam.name}
=====================================

STUDENT INFORMATION:
Name: ${result.student.user.name}
Roll: ${result.student.roll}
Registration: ${result.student.registrationNo || 'N/A'}
Class: ${result.student.class.name} ${result.student.class.section}

EXAM DETAILS:
Exam: ${exam.name}
Description: ${exam.description || 'N/A'}
Total Marks: ${exam.totalMarks}
Duration: ${exam.duration} minutes
Pass Marks: ${exam.passMarks}

RESULT SUMMARY:
MCQ Marks: ${result.mcqMarks || 0}
CQ Marks: ${result.cqMarks || 0}
SQ Marks: ${result.sqMarks || 0}
Total Score: ${result.total}/${exam.totalMarks}
Percentage: ${exam.totalMarks > 0 ? ((result.total / exam.totalMarks) * 100).toFixed(1) : '0.0'}%
Grade: ${result.grade || 'N/A'}
Rank: ${result.rank || 'N/A'}
Status: ${result.total >= exam.passMarks ? 'PASS' : 'FAIL'}

${result.comment ? `COMMENTS:
${result.comment}

` : ''}INSTITUTE INFORMATION:
Institute: ${institute?.name || 'Educational Institute'}
Class: ${result.student.class.name} ${result.student.class.section}

Generated on: ${new Date().toLocaleString()}
Verified by: ${institute?.name || 'Educational Institute'}
  `;

  return content;
} 