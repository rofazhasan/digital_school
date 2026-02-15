
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "SUPER_USER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const examId = searchParams.get("examId");
        const hallId = searchParams.get("hallId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        if (!examId) {
            return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
        }

        const whereClause: any = {
            examId: examId
        };

        if (hallId && hallId !== 'all') {
            whereClause.hallId = hallId;
        }

        // 1. Get Total Count for Pagination
        const total = await prisma.seatAllocation.count({
            where: whereClause
        });

        // 2. Fetch Data with Pagination
        const allocations = await prisma.seatAllocation.findMany({
            where: whereClause,
            include: {
                student: {
                    select: {
                        id: true,
                        roll: true,
                        registrationNo: true,
                        userId: true,
                        classId: true,
                        user: { select: { name: true, avatar: true } },
                        class: { select: { name: true, section: true } } // Fetch class name
                    }
                },
                hall: {
                    select: { name: true, roomNo: true }
                },
                exam: {
                    select: { name: true, date: true, startTime: true }
                }
            },
            orderBy: [
                { hall: { name: 'asc' } }, // Sort by Hall First
                { seatLabel: 'asc' }       // Then by Seat Label
            ],
            skip,
            take: limit
        });

        // 3. Format Response
        const formatted = allocations.map(a => ({
            id: a.id,
            studentName: a.student.user.name,
            studentRoll: a.student.roll,
            studentReg: a.student.registrationNo,
            studentImage: a.student.user.avatar,
            className: `${a.student.class.name} (${a.student.class.section})`,
            examName: a.exam.name,
            examDate: a.exam.date,
            hallName: a.hall.name,
            roomNo: a.hall.roomNo,
            seatLabel: a.seatLabel,
            studentId: a.studentId, // Essential for matching ID-based templates
            examId: a.examId
        }));

        return NextResponse.json({
            data: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("❌ API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
