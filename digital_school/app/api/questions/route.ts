import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user || !['SUPER_USER', 'ADMIN', 'TEACHER'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Staff role required' }, { status: auth?.user ? 403 : 401 });
        }
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
        const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10) || 200));
        const skip = (page - 1) * limit;

        const where: any = {};
        const subject = searchParams.get('subject');
        const type = searchParams.get('type');
        const classId = searchParams.get('classId');
        const search = searchParams.get('search')?.trim();
        if (subject) where.subject = subject;
        if (type) where.type = type;
        if (classId) where.classId = classId;
        if (search) {
            where.OR = [
                { questionText: { contains: search, mode: 'insensitive' } },
                { topic: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    class: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    QuestionToQuestionBank: {
                        include: {
                            question_banks: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.question.count({ where }),
        ]);

        // Return wrapped in 'questions' key to match frontend expectation + pagination metadata
        return NextResponse.json({
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + questions.length < total,
            },
        });
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
