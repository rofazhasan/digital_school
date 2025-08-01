import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    
    if (!authData || authData.user.role !== 'SUPER_USER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prismadb = await getDatabaseClient();

    // Get recent exams (last 10)
    const recentExams = await prismadb.exam.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        },
        class: {
          select: {
            name: true,
            institute: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    // Transform data to match frontend expectations
    const transformedExams = recentExams.map(exam => ({
      id: exam.id,
      title: exam.name,
      subject: exam.class?.name || 'Unknown',
      date: exam.createdAt,
      status: exam.isActive ? 'APPROVED' : 'PENDING',
      type: exam.type === 'ONLINE' ? 'CQ' : 'OMR',
      createdBy: exam.createdBy?.name || 'Unknown',
      totalStudents: 0 // This would need to be calculated from examStudentMaps
    }));

    return NextResponse.json(transformedExams);
  } catch (error) {
    console.error('Recent exams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent exams' },
      { status: 500 }
    );
  }
} 