import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

const ADMIN_ROLES = ['SUPER_USER', 'ADMIN'];

// GET /api/super-user/notices/[id] — get single notice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || !ADMIN_ROLES.includes(auth.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const notice = await prisma.notice.findUnique({
            where: { id },
            include: {
                postedBy: { select: { id: true, name: true, role: true, avatar: true } },
                targetClasses: { select: { id: true, name: true, section: true } },
            }
        });

        if (!notice) {
            return NextResponse.json({ message: "Notice not found" }, { status: 404 });
        }

        return NextResponse.json({ notice });
    } catch (error) {
        console.error("Error fetching notice:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/super-user/notices/[id] — update notice
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || !ADMIN_ROLES.includes(auth.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            title,
            description,
            targetType,
            priority,
            category,
            isActive,
            expiresAt,
            links,
            attachments,
            targetClassIds
        } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (targetType !== undefined) updateData.targetType = targetType;
        if (priority !== undefined) updateData.priority = priority;
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (links !== undefined) updateData.links = links;
        if (attachments !== undefined) updateData.attachments = attachments;

        // Handle class connections
        if (targetClassIds !== undefined) {
            updateData.targetClassIds = targetClassIds;
            (updateData as any).targetClasses = {
                set: targetClassIds.map((classId: string) => ({ id: classId }))
            };
        }

        const notice = await prisma.notice.update({
            where: { id },
            data: updateData as any,
            include: {
                postedBy: { select: { id: true, name: true } },
                targetClasses: { select: { id: true, name: true, section: true } },
            }
        });

        return NextResponse.json({ notice });
    } catch (error: any) {
        console.error("Error updating notice:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error?.message }, { status: 500 });
    }
}

// DELETE /api/super-user/notices/[id] — delete notice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user || !ADMIN_ROLES.includes(auth.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await prisma.notice.delete({ where: { id } });

        return NextResponse.json({ message: "Notice deleted successfully" });
    } catch (error) {
        console.error("Error deleting notice:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
