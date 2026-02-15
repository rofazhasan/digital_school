
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const examId = process.argv[2];
    if (!examId) {
        console.error("Please provide Exam ID");
        process.exit(1);
    }

    console.log(`🚀 Benchmarking Seat Allocation Queries for Exam: ${examId}`);

    // 1. COUNT Query
    console.time("COUNT");
    const count = await prisma.seatAllocation.count({
        where: { examId: examId }
    });
    console.timeEnd("COUNT");
    console.log(`Total Records: ${count}`);

    // 2. PAGINATED FETCH (Limit 50)
    console.time("FETCH_PAGE_1");
    const page1 = await prisma.seatAllocation.findMany({
        where: { examId: examId },
        include: {
            student: { select: { user: { select: { name: true } } } },
            hall: { select: { name: true } }
        },
        orderBy: { seatLabel: 'asc' },
        take: 50
    });
    console.timeEnd("FETCH_PAGE_1");
    console.log(`Fetched ${page1.length} records`);

    // 3. FETCH SPECIFIC HALLS (Simulate User Clicking "Load Hall 1")
    console.log("\n--- SIMULATING USER CLICKS ---");

    const hall1 = await prisma.examHall.findFirst({ where: { name: "Load Hall 1" } });
    if (hall1) {
        console.time("FETCH_HALL_1");
        const recs = await prisma.seatAllocation.findMany({
            where: { examId: examId, hallId: hall1.id },
            orderBy: { seatLabel: 'asc' },
            take: 100 // Page 1
        });
        console.timeEnd("FETCH_HALL_1");
        console.log(`Fetched ${recs.length} students for ${hall1.name}`);
    }

    const hall50 = await prisma.examHall.findFirst({ where: { name: "Load Hall 50" } });
    if (hall50) {
        console.time("FETCH_HALL_50");
        const recs = await prisma.seatAllocation.findMany({
            where: { examId: examId, hallId: hall50.id },
            orderBy: { seatLabel: 'asc' },
            take: 100 // Page 1
        });
        console.timeEnd("FETCH_HALL_50");
        console.log(`Fetched ${recs.length} students for ${hall50.name}`);
    }

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
