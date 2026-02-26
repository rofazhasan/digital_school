import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

// POST /api/notices/[id]/read — mark a notice as read by the current user
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = auth.user.id;
        const noticeId = params.id;

        // Check if already read to avoid duplicates
        const notice = await prisma.notice.findUnique({
            where: { id: noticeId },
            select: { readBy: true }
        });

        if (!notice) {
            return NextResponse.json({ message: "Notice not found" }, { status: 404 });
        }

        if (notice.readBy.includes(userId)) {
            return NextResponse.json({ message: "Already marked as read" });
        }

        // Append userId to readBy array
        await prisma.notice.update({
            where: { id: noticeId },
            data: { readBy: { push: userId } }
        });

        return NextResponse.json({ message: "Marked as read" });
    } catch (error) {
        console.error("Error marking notice as read:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
