// In app/api/question-bank/manage/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// --- Helper function to get a valid user for development ---
// This ensures a valid user exists before any operation that needs one.
const getDeveloperUserId = async () => {
    const email = 'developer@example.com';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("Creating a dummy developer user for testing...");
        user = await prisma.user.create({
            data: {
                email: email,
                name: 'Developer User',
                password: 'a-secure-password-for-dev', // This is required by your schema
                role: 'ADMIN',
            },
        });
    }
    return user.id;
};

const createBankSchema = z.object({
    name: z.string().min(1, "Bank name is required"),
    subject: z.string().min(1, "Subject is required"),
    chapter: z.string().optional(),
    // NOTE: createdById is now handled by the server
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // FIX: Get a guaranteed valid user ID from the database on the server
        const developerUserId = await getDeveloperUserId();

        const validation = createBankSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
        }

        const newBank = await prisma.questionBank.create({
            data: {
                ...validation.data,
                createdById: developerUserId, // Use the valid ID
            },
        });

        return NextResponse.json(newBank, { status: 201 });

    } catch (error) {
        console.error("Failed to create question bank:", error);
        return NextResponse.json({ error: "Could not create question bank" }, { status: 500 });
    }
}
