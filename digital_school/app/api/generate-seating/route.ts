import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse Inputs
        const body = await req.json();
        const { examId, classId, sectionId, hallIds, activeHalls } = body;

        if (!examId || !classId) {
            return NextResponse.json({ error: "Missing Exam or Class ID" }, { status: 400 });
        }

        // 1. Fetch Students
        const students = await prisma.studentProfile.findMany({
            where: { classId },
            orderBy: { roll: 'asc' },
            select: { id: true, roll: true, name: true, registrationNo: true, classId: true }
        });

        if (students.length === 0) {
            return NextResponse.json({ error: "No students found for this class" }, { status: 404 });
        }

        // 2. Fetch Selected Halls
        const halls = await prisma.examHall.findMany({
            where: {
                id: { in: activeHalls && activeHalls.length > 0 ? activeHalls : [] }
            },
            orderBy: { name: 'asc' }
        });

        if (halls.length === 0) {
            return NextResponse.json({ error: "No exam halls selected" }, { status: 400 });
        }

        // 3. Clear Existing Allocations
        const studentIds = students.map(s => s.id);
        await prisma.seatAllocation.deleteMany({
            where: {
                examId,
                studentId: { in: studentIds }
            }
        });

        // 4. Allocation Algorithm
        const allocations = [];
        let currentHallIndex = 0;
        let currentHall = halls[0];
        let currentSeatCount = 0;

        for (const student of students) {
            if (!currentHall) break;

            const seatNumber = currentSeatCount + 1;
            const seatLabel = `Seat ${seatNumber}`;

            allocations.push({
                examId,
                studentId: student.id,
                hallId: currentHall.id,
                seatLabel,
            });

            currentSeatCount++;

            if (currentSeatCount >= currentHall.capacity) {
                currentHallIndex++;
                currentHall = halls[currentHallIndex];
                currentSeatCount = 0;
            }
        }

        // 5. Save Allocations (Bulk Create)
        if (allocations.length > 0) {
            await prisma.seatAllocation.createMany({
                data: allocations
            });
        }

        // 6. Fetch Full Data for Frontend Return
        const finalAllocations = await prisma.seatAllocation.findMany({
            where: {
                examId,
                studentId: { in: studentIds }
            },
            include: {
                student: true,
                hall: true
            },
            orderBy: { seatLabel: 'asc' }
        });

        // Return Stats & Data
        return NextResponse.json({
            totalStudents: students.length,
            allocated: finalAllocations.length,
            unallocated: students.length - finalAllocations.length,
            hallsUsed: currentHall ? currentHallIndex + 1 : halls.length + " (Full)",
            allocations: finalAllocations
        });

    } catch (error) {
        console.error("Error generating seating:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
