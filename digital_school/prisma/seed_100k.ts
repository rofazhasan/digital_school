
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting 100k LOAD TEST database seed...');

    const instituteName = "Elite School & College";
    let institute = await prisma.institute.findFirst({
        where: { name: instituteName }
    });

    if (!institute) {
        console.log('❌ Institute not found. Please run normal seed first.');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10); // Lower rounds for speed
    const TOTAL_STUDENTS = 100000;
    const BATCH_SIZE = 1000; // Safe batch size
    const TOTAL_BATCHES = Math.ceil(TOTAL_STUDENTS / BATCH_SIZE);

    // 1. Create Class
    console.log('Creating Load Test Class...');
    const loadClass = await prisma.class.upsert({
        where: {
            name_section_instituteId: {
                name: "Class Load Test",
                section: "A",
                instituteId: institute.id
            }
        },
        update: {},
        create: {
            name: "Class Load Test",
            section: "A",
            instituteId: institute.id,
            capacity: TOTAL_STUDENTS + 1000
        }
    });

    // 2. Create 100 Exam Halls (Capacity 1000 each)
    console.log('Creating 100 Exam Halls...');
    const hallInputs = [];
    for (let i = 1; i <= 100; i++) {
        hallInputs.push({
            name: `Load Hall ${i}`,
            roomNo: `LH-${100 + i}`,
            capacity: 1001,
            rows: 25,
            columns: 20,
            seatsPerBench: 2,
            instituteId: institute.id
        });
    }
    // Delete existing load halls to avoid duplicates/confusion
    await prisma.examHall.deleteMany({ where: { name: { startsWith: "Load Hall" } } });
    await prisma.examHall.createMany({ data: hallInputs });

    const halls = await prisma.examHall.findMany({
        where: { name: { startsWith: "Load Hall" } },
        orderBy: { name: 'asc' }
    });

    // 3. Create Exam
    console.log('Creating Load Test Exam...');
    const exam = await prisma.exam.create({
        data: {
            name: "National Load Test Exam",
            description: "100k Student Test",
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(Date.now() + 3 * 3600000),
            duration: 180,
            totalMarks: 100,
            passMarks: 33,
            isActive: true,
            classId: loadClass.id,
            createdById: institute.superUserId!,
            type: 'OFFLINE'
        }
    });

    // 4. Batch Create Students
    console.log(`🚀 Generating ${TOTAL_STUDENTS} students in ${TOTAL_BATCHES} batches...`);

    for (let batch = 0; batch < TOTAL_BATCHES; batch++) {
        const start = batch * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, TOTAL_STUDENTS);
        const currentBatchSize = end - start;

        // A. Create Users
        const userInputs = [];
        const emails = [];
        for (let i = start; i < end; i++) {
            const email = `load_std_${i}@test.com`;
            emails.push(email);
            userInputs.push({
                name: `Load Student ${i}`,
                email,
                password: hashedPassword,
                role: 'STUDENT',
                instituteId: institute.id,
                isActive: true, // Enum issue? Role is enum.
                updatedAt: new Date()
            });
        }

        // Fast Insert Users
        // Note: Prisma createMany doesn't return IDs. 
        // We rely on fetching by email.
        await prisma.user.createMany({ data: userInputs as any }); // Cast if needed for enum

        // Fetch back Users
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, email: true }
        });

        // B. Create Profiles
        const profileInputs = [];
        // Map email -> User ID to keep order (though not strictly necessary if we generate independent data)
        const userMap = new Map(users.map(u => [u.email, u.id]));

        for (let i = start; i < end; i++) {
            const email = `load_std_${i}@test.com`;
            const userId = userMap.get(email);
            if (!userId) continue;

            const roll = (200000 + i).toString();
            profileInputs.push({
                userId,
                classId: loadClass.id,
                roll: roll,
                registrationNo: `REG-LOAD-${roll}`,
                guardianName: `Parent ${i}`,
                guardianPhone: `019${String(i).padStart(8, '0')}`,
                updatedAt: new Date()
            });
        }

        await prisma.studentProfile.createMany({ data: profileInputs });

        // Fetch back Profiles for Linking
        const profiles = await prisma.studentProfile.findMany({
            where: { userId: { in: users.map(u => u.id) } },
            select: { id: true, roll: true }
        });

        // C. Create Exam Maps, Allocations, Admit Cards
        const mapInputs = [];
        const allocationInputs = [];
        const cardInputs = [];

        // Sort profiles by roll to be deterministic with loop index if needed, 
        // but simple mapping is fine.

        let localIdx = 0;
        for (const profile of profiles) {
            const globalIndex = start + localIdx;

            // Exam Map
            mapInputs.push({
                studentId: profile.id,
                examId: exam.id,
                updatedAt: new Date()
            });

            // Allocation (Round Robin)
            const hallIndex = globalIndex % halls.length;
            const hall = halls[hallIndex];

            // Calculate seat in hall
            // Simple sequential seat filling per hall
            // Each hall gets ~1000 students.
            // Student 0 -> Hall 0 (Seat 1)
            // Student 1 -> Hall 1 (Seat 1) ...
            // Student 100 -> Hall 0 (Seat 2)
            const seatIndexInHall = Math.floor(globalIndex / halls.length);

            // Convert linear index to R/C/S
            // Hall: 25 rows, 20 cols, 2 seats = 1000 seats.
            // C1-R1-S1, C1-R1-S2, C1-R2-S1...
            // Let's just use linear label for speed
            const seatLabel = `Seat ${seatIndexInHall + 1}`;

            allocationInputs.push({
                examId: exam.id,
                studentId: profile.id,
                hallId: hall.id,
                seatLabel: seatLabel
            });

            // Admit Card
            cardInputs.push({
                studentId: profile.id,
                examId: exam.id,
                qrCode: `QR-LOAD-${profile.roll}-${exam.id}`,
                examCenter: "Main Validation Center",
                roomNumber: hall.roomNo,
                seatNumber: seatLabel,
                isPrinted: false,
                updatedAt: new Date()
            });

            localIdx++;
        }

        await prisma.examStudentMap.createMany({ data: mapInputs });
        await prisma.seatAllocation.createMany({ data: allocationInputs });
        await prisma.admitCard.createMany({ data: cardInputs });

        if ((batch + 1) % 5 === 0) {
            console.log(`✅ Batch ${batch + 1}/${TOTAL_BATCHES} completed (${end} students)`);
        }
    }

    console.log('🎉 100k SEED COMPLETED!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
