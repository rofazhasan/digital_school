
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting STRESS database seed...');

    const instituteName = "Elite School & College";
    let institute = await prisma.institute.findFirst({
        where: { name: instituteName }
    });

    if (!institute) {
        console.log('❌ Institute not found. Please run normal seed first or ensure institute exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 12);
    const BATCH_SIZE = 50;
    const TOTAL_STUDENTS = 1005; // 1000+

    // 1. Create Stress Class
    console.log('Creating Stress Class...');
    const stressClass = await prisma.class.upsert({
        where: {
            name_section_instituteId: {
                name: "Class Stress Test",
                section: "A",
                instituteId: institute.id
            }
        },
        update: {},
        create: {
            name: "Class Stress Test",
            section: "A",
            instituteId: institute.id,
            capacity: 1200
        }
    });

    // 2. Create 25+ Exam Halls
    console.log('Creating 30 Exam Halls...');
    const halls = [];
    for (let i = 1; i <= 30; i++) {
        const hall = await prisma.examHall.create({
            data: {
                name: `Stress Hall ${i}`,
                roomNo: `R-${100 + i}`,
                capacity: 40, // 30 * 40 = 1200 seats
                rows: 8,
                columns: 5,
                seatsPerBench: 1,
                instituteId: institute.id
            }
        });
        halls.push(hall);
    }

    // 3. Create Stress Exam
    console.log('Creating Stress Exam...');
    const exam = await prisma.exam.create({
        data: {
            name: "Stress Test Final Exam",
            description: "Load testing exam",
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(Date.now() + 3 * 3600000),
            duration: 180,
            totalMarks: 100,
            passMarks: 33,
            isActive: true,
            classId: stressClass.id,
            createdById: institute.superUserId!, // Assuming SuperUser exists from main seed
            type: 'OFFLINE'
        }
    });

    // 4. Create Students and Linkings (Batched)
    console.log(`Creating ${TOTAL_STUDENTS} Students & Admit Cards...`);

    // Helper for consistent ID generation or just let Prisma do it.
    // We'll generate emails: stress_student_0@school.com

    for (let i = 0; i < TOTAL_STUDENTS; i += BATCH_SIZE) {
        const batchPromises = [];
        const currentBatchLimit = Math.min(i + BATCH_SIZE, TOTAL_STUDENTS);

        console.log(`Processing batch ${i} to ${currentBatchLimit}...`);

        for (let j = i; j < currentBatchLimit; j++) {
            batchPromises.push((async () => {
                const roll = (10000 + j).toString();
                const email = `stress_student_${j}@school.com`;

                // Create User
                const user = await prisma.user.create({
                    data: {
                        name: `Stress Student ${j}`,
                        email,
                        password: hashedPassword,
                        role: 'STUDENT',
                        instituteId: institute!.id,
                        isActive: true
                    }
                });

                // Create Profile
                const student = await prisma.studentProfile.create({
                    data: {
                        userId: user.id,
                        classId: stressClass.id,
                        roll: roll,
                        registrationNo: `REG-STRESS-${roll}`,
                        guardianName: `Parent ${j}`,
                        guardianPhone: `0171${String(j).padStart(7, '0')}`,
                    }
                });

                // Link Exam (ExamStudentMap)
                await prisma.examStudentMap.create({
                    data: {
                        studentId: student.id,
                        examId: exam.id
                    }
                });

                // Create Seat Allocation (Round Robin across Halls)
                const hallIndex = j % halls.length;
                const hall = halls[hallIndex];
                const insideSeatIndex = Math.floor(j / halls.length);
                const seatLabel = `S-${insideSeatIndex + 1}`;

                await prisma.seatAllocation.create({
                    data: {
                        examId: exam.id,
                        studentId: student.id,
                        hallId: hall.id,
                        seatLabel: seatLabel
                    }
                });

                // Create Admit Card
                await prisma.admitCard.create({
                    data: {
                        studentId: student.id,
                        examId: exam.id,
                        qrCode: `QR-STRESS-${roll}-${exam.id}`,
                        examCenter: "Main Campus",
                        roomNumber: hall.roomNo,
                        seatNumber: seatLabel,
                        isPrinted: Math.random() > 0.5 // Random print status
                    }
                });

            })());
        }

        await Promise.all(batchPromises);
    }

    console.log('🎉 STRESS SEEDING COMPLETE!');
    console.log(`Stats:
  - Class: ${stressClass.name}
  - Students: ${TOTAL_STUDENTS}
  - Halls: ${halls.length} (Capacity ~1200)
  - Exam: ${exam.name}
  `);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
