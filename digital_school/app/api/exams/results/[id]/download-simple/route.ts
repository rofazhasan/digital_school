import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 CSV Download API called:', { 
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    const token = await getTokenFromRequest(request);
    
    console.log('🔍 CSV Token result:', { 
      hasToken: !!token,
      userRole: token?.user?.role,
      userId: token?.user?.id
    });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = token.user;
    const { id: examId } = await params;

    // Check permissions - only teachers, admins, and super users can download results
    if (!['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch exam and results data
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

    // Check institute access for teachers and admins
    if (user.role !== 'SUPER_USER' && user.instituteId !== exam.class.instituteId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const results = await prismadb.result.findMany({
      where: { examId },
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
      },
      orderBy: [
        { total: 'desc' },
        { rank: 'asc' }
      ]
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No results found for this exam' }, { status: 404 });
    }

    // Calculate statistics
    const totalStudents = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const averageScore = totalScore / totalStudents;
    const highestScore = Math.max(...results.map(r => r.total));
    const lowestScore = Math.min(...results.map(r => r.total));
    const passCount = results.filter(r => r.total >= exam.passMarks).length;
    const passRate = (passCount / totalStudents) * 100;

    // Generate CSV instead of PDF for simplicity
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

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="exam-results-${exam.name}-${exam.class.name}-${exam.class.section}.csv"`
      }
    });

  } catch (error) {
    console.error('Error generating results CSV:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
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

  // Helper function to sanitize text for CSV
  function sanitizeText(text: string): string {
    if (!text) return '';
    // Remove or replace Unicode characters that cause issues
    return text.replace(/[^\x00-\x7F]/g, (char) => {
      // Replace Bengali/Unicode characters with ASCII equivalents or remove them
      const replacements: { [key: string]: string } = {
        'আ': 'A', 'ব': 'B', 'গ': 'G', 'ঘ': 'Gh', 'ঙ': 'Ng',
        'চ': 'Ch', 'ছ': 'Chh', 'জ': 'J', 'ঝ': 'Jh', 'ঞ': 'Ny',
        'ট': 'T', 'ঠ': 'Th', 'ড': 'D', 'ঢ': 'Dh', 'ণ': 'N',
        'ত': 'T', 'থ': 'Th', 'দ': 'D', 'ধ': 'Dh', 'ন': 'N',
        'প': 'P', 'ফ': 'Ph', 'ব': 'B', 'ভ': 'Bh', 'ম': 'M',
        'য': 'Y', 'র': 'R', 'ল': 'L', 'শ': 'Sh', 'ষ': 'Sh',
        'স': 'S', 'হ': 'H', 'ড়': 'R', 'ঢ়': 'Rh', 'য়': 'Y',
        'ৎ': 'K', 'ং': 'Ng', 'ঃ': 'H', 'ঁ': 'N',
        // Add more replacements as needed
      };
      return replacements[char] || '?';
    });
  }

  // Create English CSV header
  let csv = `"${sanitizeText(institute?.name || 'Educational Institute')}"\n`;
  csv += `"Class: ${sanitizeText(exam.class.name)} ${sanitizeText(exam.class.section)}"\n`;
  csv += `"Exam: ${sanitizeText(exam.name)}"\n`;
  csv += `"Total Marks: ${exam.totalMarks} | Pass Marks: ${exam.passMarks}"\n\n`;
  
  // Add results table with English headers
  csv += `"Serial No.","Roll No.","Student Name","Total Marks","Rank","Comments"\n`;
  
  results.forEach((result, index) => {
    const comment = result.total >= exam.passMarks ? 'Pass' : 'Fail';
    csv += `"${index + 1}","${sanitizeText(result.student.roll)}","${sanitizeText(result.student.user.name)}","${result.total}","${result.rank || 'N/A'}","${comment}"\n`;
  });
  
  // Add summary in English
  csv += `\n"Summary: Out of ${statistics.totalStudents} students, ${statistics.passCount} students passed the examination."\n`;
  csv += `"Generated on: ${currentDate}"\n`;
  csv += `"Head Master: ${sanitizeText(institute?.name || 'Educational Institute')}"\n`;
  csv += `"QR Code for verification: ${exam.id}"\n`;
  
  return csv;
} 