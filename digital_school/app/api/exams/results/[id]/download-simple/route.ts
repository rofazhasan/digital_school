import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

// Explicitly export dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 CSV Download API called:', {
      url: request.url,
      method: request.method,
    });

    // 1. Authentication
    const token = await getTokenFromRequest(request);

    if (!token) {
      console.warn('⚠️ CSV Download: Unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = token;
    const { id: examId } = await params;

    console.log('👤 User requesting CSV:', { userId: user.id, role: user.role, examId });

    // 2. Permission Check
    if (!['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role)) {
      console.warn('⛔ CSV Download: Insufficient permissions for user', user.id);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 3. Data Fetching
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
      console.error('❌ CSV Download: Exam not found', examId);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // 4. Institute Access Check
    if (user.role !== 'SUPER_USER' && user.instituteId !== exam.class.instituteId) {
      console.warn('⛔ CSV Download: Institute mismatch', {
        userInstitute: user.instituteId,
        examInstitute: exam.class.instituteId
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const results = await prismadb.result.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true }
            },
            class: true
          }
        }
      },
      orderBy: [
        { total: 'desc' },
        { rank: 'asc' }
      ]
    });

    if (results.length === 0) {
      console.warn('⚠️ CSV Download: No results found for exam', examId);
      return NextResponse.json({ error: 'No results found for this exam' }, { status: 404 });
    }

    // 5. Statistics Calculation
    const totalStudents = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = totalScore / totalStudents;
    const highestScore = Math.max(...results.map(r => r.total));
    const lowestScore = Math.min(...results.map(r => r.total));
    const passCount = results.filter(r => r.total >= exam.passMarks).length;
    const passRate = (passCount / totalStudents) * 100;

    // 6. CSV Generation
    console.log('📄 Generating CSV...');
    const csvContent = generateCSVResults({
      exam,
      results,
      statistics: {
        totalStudents,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        passCount
      },
      institute: exam.class.institute
    });
    console.log('✅ CSV Generated successfully, length:', csvContent.length);

    // 7. Response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="exam-results-${sanitizeFilename(exam.name)}.csv"`
      }
    });

  } catch (error) {
    console.error('💥 Error generating results CSV:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

interface CSVData {
  exam: any;
  results: any[];
  statistics: {
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    passCount: number;
  };
  institute: any;
}

function generateCSVResults(data: CSVData): string {
  const { exam, results, statistics, institute } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Helper function to escape CSV fields
  const escape = (text: string | number | null | undefined) => {
    if (text === null || text === undefined) return '""';
    const str = String(text);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  let csv = [];

  // Header Info
  csv.push([escape(institute?.name || 'Educational Institute')]);
  csv.push([escape(`Class: ${exam.class.name} ${exam.class.section}`)]);
  csv.push([escape(`Exam: ${exam.name}`)]);
  csv.push([escape(`Total Marks: ${exam.totalMarks} | Pass Marks: ${exam.passMarks}`)]);
  csv.push([]); // Empty line

  // Table Headers
  csv.push(['Serial No.', 'Roll No.', 'Student Name', 'Total Marks', 'Rank', 'Status'].map(escape).join(','));

  // Rows
  results.forEach((result, index) => {
    const comment = result.total >= exam.passMarks ? 'Pass' : 'Fail';
    csv.push([
      escape(index + 1),
      escape(result.student.roll),
      escape(result.student.user.name),
      escape(result.total),
      escape(result.rank || 'N/A'),
      escape(comment)
    ].join(','));
  });

  // Summary
  csv.push([]);
  csv.push([escape(`Summary: Out of ${statistics.totalStudents} students, ${statistics.passCount} students passed the examination.`)]);
  csv.push([escape(`Generated on: ${currentDate}`)]);

  return csv.join('\n');
} 