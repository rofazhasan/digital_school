import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { NoticeEmail } from "@/components/emails/NoticeEmail";

const ADMIN_ROLES = ['SUPER_USER', 'ADMIN'];

// GET — list all notices (admin/super-user management panel)
export async function GET(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || !ADMIN_ROLES.includes(auth.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const notices = await prisma.notice.findMany({
            include: {
                postedBy: { select: { id: true, name: true, role: true, avatar: true } },
                targetClasses: { select: { id: true, name: true, section: true } },
            },
            orderBy: [
                // URGENT first, then by date
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json({ notices });
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// POST — create a new notice
export async function POST(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || !ADMIN_ROLES.includes(auth.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const session = { user: auth.user };

        const body = await req.json();
        const {
            title,
            description,
            targetType,
            priority = 'MEDIUM',
            category = 'General',
            targetClassIds,
            expiresAt,
            links,
            attachments
        } = body;

        if (!title || !description || !targetType) {
            return NextResponse.json({ message: "Missing required fields: title, description, targetType" }, { status: 400 });
        }

        const noticeData: Record<string, unknown> = {
            title,
            description,
            targetType,
            priority,
            category,
            postedById: session.user.id,
        };

        if (links && Array.isArray(links) && links.length > 0) {
            noticeData.links = links;
        }
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            noticeData.attachments = attachments;
        }
        if (expiresAt) {
            noticeData.expiresAt = new Date(expiresAt);
        }

        if (targetType === 'SPECIFIC_CLASS' && targetClassIds && Array.isArray(targetClassIds) && targetClassIds.length > 0) {
            noticeData.targetClassIds = targetClassIds;
            (noticeData as any).targetClasses = {
                connect: targetClassIds.map((id: string) => ({ id }))
            };
        }

        const notice = await prisma.notice.create({ data: noticeData as any });

        // Send email notifications in background (non-blocking)
        sendNoticeEmailsAsync({ title, description, priority, targetType, targetClassIds, postedByName: session.user.name });

        return NextResponse.json({ notice }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating notice:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error?.message }, { status: 500 });
    }
}

async function sendNoticeEmailsAsync({
    title,
    description,
    priority,
    targetType,
    targetClassIds,
    postedByName
}: {
    title: string;
    description: string;
    priority: string;
    targetType: string;
    targetClassIds?: string[];
    postedByName: string;
}) {
    try {
        const institute = await prisma.institute.findFirst({
            select: { name: true, address: true, phone: true, logoUrl: true }
        });

        let targetUsers: { id: string, name: string, email: string | null }[] = [];

        if (targetType === 'ALL') {
            targetUsers = await prisma.user.findMany({
                where: { role: { in: ['STUDENT', 'TEACHER'] }, email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        } else if (targetType === 'STUDENTS') {
            targetUsers = await prisma.user.findMany({
                where: { role: 'STUDENT', email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        } else if (targetType === 'TEACHERS') {
            targetUsers = await prisma.user.findMany({
                where: { role: 'TEACHER', email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        } else if (targetType === 'TEACHERS_AND_ADMINS') {
            targetUsers = await prisma.user.findMany({
                where: { role: { in: ['TEACHER', 'ADMIN', 'SUPER_USER'] }, email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        } else if (targetType === 'ADMINS') {
            targetUsers = await prisma.user.findMany({
                where: { role: { in: ['ADMIN', 'SUPER_USER'] }, email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        } else if (targetType === 'SPECIFIC_CLASS' && targetClassIds?.length) {
            targetUsers = await prisma.user.findMany({
                where: { studentProfile: { classId: { in: targetClassIds } }, email: { not: null }, isActive: true },
                select: { id: true, name: true, email: true }
            });
        }

        const emailPromises = targetUsers.filter(u => u.email).map(user =>
            sendEmail({
                to: user.email!,
                subject: `[${priority}] Notice: ${title}`,
                react: NoticeEmail({
                    title,
                    description,
                    postedBy: postedByName,
                    publishDate: new Date().toLocaleDateString('en-BD'),
                    priority: priority as any,
                    institute: institute as any
                }) as any
            })
        );

        await Promise.allSettled(emailPromises);
    } catch (err) {
        console.error('Failed to send notice emails:', err);
    }
}
