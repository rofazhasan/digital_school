import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || auth.user.role !== 'STUDENT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const session = { user: auth.user }; // Mapping for compatibility

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            select: { classId: true }
        });

        if (!studentProfile) {
            return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
        }

        const notices = await prisma.notice.findMany({
            where: {
                isActive: true,
                OR: [
                    { targetType: 'ALL' },
                    { targetType: 'STUDENTS' },
                    {
                        targetType: 'SPECIFIC_CLASS',
                        targetClasses: {
                            some: {
                                id: studentProfile.classId
                            }
                        }
                    }
                ],
                // Optional: Filter by expiration date if expiresAt is set
                // expiresAt: { gte: new Date() } 
            },
            orderBy: [
                // Priority sorting logic could be added here if 'priority' was an enum-ordered field, 
                // but typically 'createdAt' desc is good for notices.
                { createdAt: 'desc' }
            ]
        });

        // Helper to sort by priority manually since Prisma sorting by enum is not direct in all DBs
        // Priority: HIGH > MEDIUM > LOW
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

        // Sort by priority then date (if needed, but usually date is more important for notices)
        // Let's stick to date for now, or client-side sort. 
        // Actually, let's just return them. The dashboard can sort or we can sort here.

        return NextResponse.json({ notices });
    } catch (error) {
        console.error("Error fetching student notices:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
