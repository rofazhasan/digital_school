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

    // Get pending approvals (users waiting for activation, exam evaluations, etc.)
    const pendingApprovals = await prismadb.user.findMany({
      where: {
        isActive: false,
        role: {
          in: ['ADMIN', 'TEACHER']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        institute: {
          select: {
            name: true,
          }
        }
      }
    });

    // Get pending exam evaluations
    const pendingEvaluations = await prismadb.examEvaluationAssignment.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        exam: {
          select: {
            name: true,
            description: true,
          }
        },
        evaluator: {
          select: {
            name: true,
            email: true,
          }
        },
        assignedAt: true,
      }
    });

    return NextResponse.json({
      pendingUsers: pendingApprovals,
      pendingEvaluations: pendingEvaluations
    });
  } catch (error) {
    console.error('Pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
} 