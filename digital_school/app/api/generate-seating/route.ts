import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        // activeHalls: array of hall IDs selected for this exam seating

        if (!examId || !classId) {
            return NextResponse.json({ error: "Missing Exam or Class ID" }, { status: 400 });
        }

        // 1. Fetch Students
        const students = await prisma.studentProfile.findMany({
            where: {
                classId,
                // If sectionId is provided/used? Schema doesn't strictly link sectionId in StudentProfile unless embedded in class or separate?
                // StudentProfile has classId. Class model has name/section.
                // Assuming filtering by Class ID is sufficient as Class ID is unique to a Section usually in this schema (Class has name+section unique).
            },
            orderBy: { roll: 'asc' }, // Default sorting
            select: { id: true, roll: true, name: true, registrationNo: true }
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
            // Fallback: fetch all institute halls if activeHalls not validated?
            // Or return error "Please select halls". Let's return error.
            return NextResponse.json({ error: "No exam halls selected" }, { status: 400 });
        }

        // 3. Clear Existing Allocations for this Exam (Optional: or overwrite/update?)
        // Safer to clear for this Class+Exam combo. 
        // But Allocations are stored by studentId, so we can upsert or delete where studentId in students.map(id)
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
        let currentSeatCount = 0; // Seats used in current hall

        // Seat Label logic: varies by hall config?
        // Simple: 1, 2, 3... or R1-C1-B1? 
        // Let's use sequential "Seat 1, Seat 2..." for now, resetting per Hall.
        // Or "H1-001".

        // For stickers: We need nice labels.
        // Let's iterate students
        for (const student of students) {
            if (!currentHall) {
                break; // Run out of space
            }

            // Assign Seat
            const seatNumber = currentSeatCount + 1;
            const seatLabel = `Seat ${seatNumber}`; // Can be fancy: HallName-SeatNo

            allocations.push({
                examId,
                studentId: student.id,
                hallId: currentHall.id,
                seatLabel,
            });

            currentSeatCount++;

            // Check Capacity
            if (currentSeatCount >= currentHall.capacity) {
                // Move to next hall
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
            where: { examId },
            include: {
                student: true,
                hall: true
            },
            orderBy: { seatLabel: 'asc' } // or whatever logic
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
