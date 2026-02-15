import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check Auth
        if (!session || !session.user || !['ADMIN', 'TEACHER', 'SUPER_USER'].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { questionId, isForPractice } = body;

        if (!questionId || typeof isForPractice !== 'boolean' || typeof questionId !== 'string') {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Verify ownership if Teacher?
        // Usually teachers can edit any question in their class or subject, but for now allow strict role check above.
        // If we want to restrict teachers to only their own questions:
        /*
        if (session.user.role === 'TEACHER') {
            const q = await prisma.question.findUnique({ where: { id: questionId }, select: { createdById: true } });
            if (q?.createdById !== session.user.id) return 403...
        }
        */
        // For simplicity in this codebase context, we trust the role check.

        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: { isForPractice } as any // Type cast if generation hasn't picked up field yet, though pushing should have fix it.
        });

        return NextResponse.json({ success: true, question: updatedQuestion });
    } catch (error) {
        console.error("Failed to toggle practice status:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}
