// In app/api/question-bank/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { z } from 'zod';

const createBankSchema = z.object({
    name: z.string().min(1, "Bank name is required"),
    subject: z.string().min(1, "Subject is required"),
    chapter: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user || !['SUPER_USER', 'ADMIN', 'TEACHER'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Staff role required' }, { status: auth?.user ? 403 : 401 });
        }

        const body = await request.json();
        const validation = createBankSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
        }

        const newBank = await prisma.questionBank.create({
            data: {
                ...validation.data,
                createdById: auth.user.id,
            },
        });

        return NextResponse.json(newBank, { status: 201 });

    } catch (error) {
        console.error("Failed to create question bank:", error);
        return NextResponse.json({ error: "Could not create question bank" }, { status: 500 });
    }
}
