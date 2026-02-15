import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // ... (lines 8-150 remain same)

        // ... (lines 8-150 remain same)
        if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "SUPER_USER")) {
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

            // Checkerboard Logic:
            // Calculate total seats in a row (cols * seatsPerBench)
            const seatsPerRow = cols * seatsPerBench;

            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    for (let s = 1; s <= seatsPerBench; s++) {

                        let student = null;
                        let queueIndex;

                        if (isSingleExam) {
                            // Single Exam: Alternate queues by Row (Odd vs Even Rows)
                            // Row 1: Q1, Row 2: Q2... 
                            // Simple row-based interleaving strategy (as strict A-B-A-B seat-by-seat is hard with one population type unless split strictly)
                            // Let's stick to strict Row alternating for single exam standard "Set A / Set B" separation if queues split
                            queueIndex = (r % 2 === 1) ? 0 : 1;
                        } else {
                            // Multi Exam: Standard Checkerboard (A-B-A-B)
                            // Formula: (RowIndex + GlobalLinearSeatIndex) % NumExams
                            // But GlobalLinearSeatIndex resets every row for visual checkerboard?
                            // Visual Checkerboard on Grid: (Row + Col) % 2
                            // Seat Index: (r + c*seatsPerBench + s) % numExams?

                            // Let's use a robust linear offset per row to ensure diagonal separation
                            // If exams=2:
                            // R1: 0 1 0 1
                            // R2: 1 0 1 0
                            // Offset = Row Index % NumExams

                            // Calculate "Seat Index in Row" (0-based)
                            const seatIdxInRow = ((c - 1) * seatsPerBench) + (s - 1);

                            // Calculate Queue Index
                            // (RowOffset + SeatIndex) % NumExams
                            // RowOffset = (r - 1)
                            queueIndex = ((r - 1) + seatIdxInRow) % queues.length;
                        }

                        // Try to get student from calculated queue
                        if (queues[queueIndex] && queues[queueIndex].length > 0) {
                            student = queues[queueIndex].shift();
                        } else {
                            // Fallback: If ideal queue empty, try next available (Round Robin search)
                            for (let i = 1; i < queues.length; i++) {
                                const fallbackIdx = (queueIndex + i) % queues.length;
                                if (queues[fallbackIdx] && queues[fallbackIdx].length > 0) {
                                    student = queues[fallbackIdx].shift();
                                    break;
                                }
                            }
                        }

                        if (!student) continue;

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

        // 8. Return Summary ONLY (Optimization for Large Datasets)
        const totalAllocated = await prisma.seatAllocation.count({
            where: {
                examId: { in: examIds }
            }
        });

        // Return Stats & Data
        return NextResponse.json({
            success: true,
            totalStudents: totalStudentCount,
            allocated: totalAllocated,
            hallsUsed: halls.length,
            message: "Allocations generated successfully. Please view by Hall."
        });

    } catch (error: any) {
        console.error("❌ FATAL SERVER ERROR in generate-seating:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
