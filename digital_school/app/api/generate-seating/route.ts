import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // ... (lines 8-150 remain same)

        // ... (lines 8-150 remain same)
        if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse Inputs
        const body = await req.json();
        const { examIds, activeHalls } = body; // Changed to examIds (Array)

        if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
            return NextResponse.json({ error: "Missing or invalid Exam IDs" }, { status: 400 });
        }

        // 1. Fetch Exams to get Class IDs
        const exams = await prisma.exam.findMany({
            where: { id: { in: examIds } },
            include: { class: true }
        });

        if (exams.length === 0) {
            return NextResponse.json({ error: "No exams found" }, { status: 404 });
        }

        // 2. Fetch Students for each Exam (Grouped by Exam)
        const studentPools: any[][] = [];
        let totalStudentCount = 0;

        for (const exam of exams) {
            const students = await prisma.studentProfile.findMany({
                where: { classId: exam.classId },
                select: {
                    id: true,
                    roll: true,
                    registrationNo: true,
                    classId: true,
                    user: { select: { name: true } }
                }
            });

            // Numeric Sort
            students.sort((a, b) => {
                const rollA = parseInt(a.roll) || 0;
                const rollB = parseInt(b.roll) || 0;
                return rollA - rollB;
            });

            // Map to Include Exam ID Context
            const studentsWithExam = students.map(s => ({ ...s, examId: exam.id }));
            studentPools.push(studentsWithExam);
            totalStudentCount += students.length;
        }

        if (totalStudentCount === 0) {
            return NextResponse.json({ error: "No students found for allocated exams" }, { status: 404 });
        }

        // 3. Fetch Selected Halls
        const halls = await prisma.examHall.findMany({
            where: {
                id: { in: activeHalls && activeHalls.length > 0 ? activeHalls : [] }
            },
            orderBy: { name: 'asc' }
        });

        if (halls.length === 0) {
            return NextResponse.json({ error: "No exam halls selected" }, { status: 400 });
        }

        // 4. Clear Existing Allocations for THESE Exams
        // Note: This might clear properly if same students are taken.
        // If a student is in multiple selected exams (impossible unless multi-class student), it's fine.
        const allStudentIds = studentPools.flat().map(s => s.id);

        await prisma.seatAllocation.deleteMany({
            where: {
                examId: { in: examIds },
                studentId: { in: allStudentIds }
            }
        });

        // Flatten all students from all exams into a single list, then sort
        const allStudents = studentPools.flat();

        // 3. Sort Students Numerically (1, 2, ... 10)
        allStudents.sort((a, b) => {
            const rollA = parseInt(a.roll) || 0;
            const rollB = parseInt(b.roll) || 0;
            return rollA - rollB;
        });

        // 4. Prepare Student Queues
        let queues: any[][] = [];
        let isSingleExam = examIds.length === 1;

        if (isSingleExam) {
            // Split into Odd and Even Rolls for "Interleaved" Single Class
            const examStudents = allStudents; // Already sorted by roll
            const odds = examStudents.filter((_, i) => i % 2 === 0); // 1st, 3rd... (Indices 0, 2...) -> Effectively "Odd" positions in sorted list
            const evens = examStudents.filter((_, i) => i % 2 !== 0);
            queues = [odds, evens];
        } else {
            // Multi-Class: Group by Exam
            // We want strict rotation: Class 7, Class 8, Class 9...
            for (const eid of examIds) {
                queues.push(allStudents.filter(s => s.examId === eid));
            }
        }

        // 5. Allocation Loop
        const allocations = [];
        let globalQueueIndex = 0; // Rotates through queues

        for (const hall of halls) {
            const rows = hall.rows || 10;
            const cols = hall.columns || 4;
            const seatsPerBench = hall.seatsPerBench || 2;

            // Iterate strictly by Row first (to fill Front-to-Back mentally, but user wants Row-based patterns)
            // User Pattern: R1C1S1(7), R1C1S2(8)...
            // Loop: Row -> Col -> Seat
            for (let r = 1; r <= rows; r++) {

                // For Single Exam: Switch Parity based on Row?
                // R1: Odds (Queue 0), R2: Evens (Queue 1)
                // BUT user wants specific scrambling.
                // Let's stick to strict Round Robin across columns to maximize distance.
                // If Single Exam:
                // Row 1: Take from Queue 0 (Odds)? 
                // Row 2: Take from Queue 1 (Evens)?
                // This matches the "R1 all odds, R2 all evens" observation.

                let rowQueueIndex = 0;
                if (isSingleExam) {
                    // If Single Exam, we lock the queue for the entire ROW
                    // Even Rows (2,4) -> Queue 1. Odd Rows (1,3) -> Queue 0.
                    // Note: 'r' is 1-based.
                    rowQueueIndex = (r % 2 === 1) ? 0 : 1;
                }

                for (let c = 1; c <= cols; c++) {
                    for (let s = 1; s <= seatsPerBench; s++) {

                        let student = null;

                        if (isSingleExam) {
                            // Single Exam: Pull from the specific Queue for this Row
                            if (queues[rowQueueIndex].length > 0) {
                                student = queues[rowQueueIndex].shift();
                            } else {
                                // Fallback: If one parity runs out, try the other
                                const other = (rowQueueIndex + 1) % 2;
                                if (queues[other].length > 0) student = queues[other].shift();
                            }
                        } else {
                            // Multi Exam: Round Robin per SEAT
                            // Seat 1: Class 7, Seat 2: Class 8...
                            // We try to find a queue with students
                            let attempts = 0;
                            while (attempts < queues.length) {
                                const qIdx = (globalQueueIndex + attempts) % queues.length;
                                if (queues[qIdx].length > 0) {
                                    student = queues[qIdx].shift();
                                    // Advance global index for next seat
                                    globalQueueIndex = (qIdx + 1) % queues.length;
                                    break;
                                }
                                attempts++;
                            }
                            // If we broke, we found a student. If loop finished, no students left in any queue?
                        }

                        if (!student) continue; // Skip empty seat if no students left

                        const seatLabel = `C${c}-R${r}-S${s}`;

                        allocations.push({
                            studentId: student.id,
                            examId: student.examId,
                            hallId: hall.id,
                            seatLabel: `Seat ${allocations.length + 1} (${seatLabel})`
                        });
                    }
                }
            }
        }

        // 7. Save to DB (Transaction)
        if (allocations.length > 0) {
            await prisma.seatAllocation.createMany({
                data: allocations
            });
        }

        // 8. Fetch Full Data for Frontend Return
        // We fetch allocations for all involved exams and students to be safe
        const finalAllocations = await prisma.seatAllocation.findMany({
            where: {
                examId: { in: examIds },
                studentId: { in: allStudentIds }
            },
            include: {
                student: {
                    include: { user: true }
                },
                hall: true
            },
            orderBy: { seatLabel: 'asc' }
        });

        // Flatten for Frontend
        const flatAllocations = finalAllocations.map(a => ({
            ...a,
            student: {
                ...a.student,
                name: a.student.user.name
            }
        }));

        // Return Stats & Data
        return NextResponse.json({
            totalStudents: totalStudentCount,
            allocated: flatAllocations.length,
            unallocated: totalStudentCount - flatAllocations.length,
            hallsUsed: halls.length, // Simplified
            allocations: flatAllocations
        });

    } catch (error: any) {
        console.error("❌ FATAL SERVER ERROR in generate-seating:", error);
        console.error("Stack:", error.stack);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
