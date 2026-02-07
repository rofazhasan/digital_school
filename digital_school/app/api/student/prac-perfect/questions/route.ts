import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get Student Profile to find their class
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            select: { classId: true }
        });

        if (!studentProfile || !studentProfile.classId) {
            return NextResponse.json({ error: "Class not assigned" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        const idsParam = searchParams.get('ids');

        // Build filter
        const where: any = {
            classId: studentProfile.classId,
            isForPractice: true, // SECURITY: Only allow questions explicitly marked for practice
        };

        if (idsParam) {
            const ids = idsParam.split(',').filter(Boolean);
            if (ids.length > 0) {
                where.id = { in: ids };
            }
        } else {
            // Only apply other filters if not fetching by specific IDs (optional choice, but logical)
            if (subject && subject !== 'all') where.subject = subject;
            if (type && type !== 'all') where.type = type;
            if (search) {
                where.questionText = {
                    contains: search,
                    mode: 'insensitive'
                };
            }
        }

        const questions = await prisma.question.findMany({
            where,
            select: {
                id: true,
                questionText: true,
                type: true,
                subject: true,
                topic: true,
                difficulty: true,
                marks: true,
                options: true,
                modelAnswer: true, // Used for answer checking
                // explanation: true, // Field does not exist in schema, omit for now or use another field if available
                class: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: idsParam ? 100 : 100 // Keep limit secure
        });

        // Also fetch available subjects for filtering (optimizable)
        // For now client can derive from list or we send distinct

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Failed to fetch student questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
