import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user || !['SUPER_USER', 'ADMIN', 'TEACHER'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Staff role required' }, { status: auth?.user ? 403 : 401 });
        }
        const questions = await prisma.question.findMany({
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
        });

        // Return wrapped in 'questions' key to match frontend expectation
        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
