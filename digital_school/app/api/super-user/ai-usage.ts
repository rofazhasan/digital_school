import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const aiUsage = await prismadb.aIActivity.groupBy({
      by: ['userId'],
      _sum: { tokenCost: true },
      _count: { id: true },
      orderBy: { _sum: { tokenCost: 'desc' } },
      take: 5,
    });

    const users = await prismadb.user.findMany({
      where: { id: { in: aiUsage.map(u => u.userId) } },
    });

    const result = aiUsage.map(u => ({
      userId: u.userId,
      userName: users.find(us => us.id === u.userId)?.name || '',
      tokensUsed: u._sum.tokenCost || 0,
      requests: u._count.id,
      lastUsed: '',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI usage' }, { status: 500 });
  }
} 