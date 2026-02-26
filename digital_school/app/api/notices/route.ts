import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

/**
 * Universal GET /api/notices endpoint.
 * Filters notices based on the authenticated user's role:
 *  - STUDENT        → ALL, STUDENTS, SPECIFIC_CLASS (matching their class)
 *  - TEACHER        → ALL, TEACHERS, TEACHERS_AND_ADMINS
 *  - ADMIN/SUPER    → all active notices
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { role, id: userId } = auth.user;
        const now = new Date();

        let whereClause: Record<string, unknown> = {
            isActive: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gte: now } }
            ]
        };

        if (role === 'STUDENT') {
            // Get student's class
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId },
                select: { classId: true }
            });

            if (!studentProfile) {
                return NextResponse.json({ notices: [] });
            }

            whereClause = {
                isActive: true,
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gte: now } }
                        ]
                    },
                    {
                        OR: [
                            { targetType: 'ALL' },
                            { targetType: 'STUDENTS' },
                            {
                                targetType: 'SPECIFIC_CLASS',
                                targetClasses: { some: { id: studentProfile.classId } }
                            }
                        ]
                    }
                ]
            };
        } else if (role === 'TEACHER') {
            whereClause = {
                isActive: true,
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gte: now } }
                        ]
                    },
                    {
                        OR: [
                            { targetType: 'ALL' },
                            { targetType: 'TEACHERS' },
                            { targetType: 'TEACHERS_AND_ADMINS' }
                        ]
                    }
                ]
            };
        }
        // ADMIN / SUPER_USER see all active notices (default whereClause)

        const notices = await prisma.notice.findMany({
            where: whereClause as any,
            include: {
                postedBy: { select: { id: true, name: true, role: true, avatar: true } },
                targetClasses: { select: { id: true, name: true, section: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        // Sort: URGENT > HIGH > MEDIUM > LOW, then by date
        const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const sorted = notices.sort((a, b) => {
            const pa = priorityOrder[a.priority] ?? 2;
            const pb = priorityOrder[b.priority] ?? 2;
            if (pb !== pa) return pb - pa;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Count unread for this user
        const unreadCount = sorted.filter(n => !n.readBy.includes(userId)).length;

        return NextResponse.json({ notices: sorted, unreadCount });
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
