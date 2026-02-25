import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: examId } = await params;
        const { searchParams } = new URL(request.url);
        const resultId = searchParams.get('resultId');

        if (!resultId) {
            return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
        }

        const tokenData = await getTokenFromRequest(request);
        if (!tokenData || !tokenData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prisma = await DatabaseClient.getInstance();

        const practiceResult = await prisma.practiceResult.findUnique({
            where: { id: resultId },
            include: {
                exam: {
                    select: {
                        name: true,
                        totalMarks: true,
                        subject: true,
                    }
                }
            }
        });

        if (!practiceResult) {
            return NextResponse.json({ error: 'Practice result not found' }, { status: 404 });
        }

        return NextResponse.json(practiceResult);

    } catch (error) {
        console.error('GET /api/exams/practice/results Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
