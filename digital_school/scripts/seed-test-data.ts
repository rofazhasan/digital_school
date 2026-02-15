import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
    generateInvoiceNumber,
    generateReceiptNumber,
    generateQRHash,
    generateVerificationUrl,
} from '../utils/school-management';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
    STUDENTS_COUNT: 1000,
    TRANSACTIONS_PER_YEAR: 10000,
    CLASSES: [
        { name: 'Class 6', section: 'A', capacity: 50 },
        { name: 'Class 6', section: 'B', capacity: 50 },
        { name: 'Class 7', section: 'A', capacity: 50 },
        { name: 'Class 7', section: 'B', capacity: 50 },
        { name: 'Class 8', section: 'A', capacity: 50 },
        { name: 'Class 8', section: 'B', capacity: 50 },
        { name: 'Class 9', section: 'A', capacity: 50 },
        { name: 'Class 9', section: 'B', capacity: 50 },
        { name: 'Class 10', section: 'A', capacity: 50 },
        { name: 'Class 10', section: 'B', capacity: 50 },
    ],
    FEE_STRUCTURES: [
        {
            name: 'Monthly Fee - Class 6-7',
            tuitionFee: 2000,
            examFee: 500,
            libraryFee: 200,
            sportsFee: 300,
            frequency: 'MONTHLY',
        },
        {
            name: 'Monthly Fee - Class 8-9',
            tuitionFee: 2500,
            examFee: 600,
            libraryFee: 250,
            sportsFee: 350,
            frequency: 'MONTHLY',
        },
        {
            name: 'Monthly Fee - Class 10',
            tuitionFee: 3000,
            examFee: 800,
            libraryFee: 300,
            sportsFee: 400,
            frequency: 'MONTHLY',
        },
    ],
};

async function main() {
    console.log('🚀 Starting test data seeding...\n');

    // Step 1: Get or create institute
    console.log('📍 Step 1: Setting up institute...');
    let institute = await prisma.institute.findFirst();

    if (!institute) {
        const superUser = await prisma.user.create({
            data: {
                email: 'admin@testschool.com',
                password: await bcrypt.hash('admin123', 10),
                name: 'Test Admin',
                role: 'SUPER_USER',
            },
        });

        institute = await prisma.institute.create({
            data: {
                name: 'Test Digital School',
                address: '123 Test Street, Dhaka',
                phone: '+880123456789',
                email: 'info@testschool.com',
                superUserId: superUser.id,
            },
        });
        console.log(`✅ Created institute: ${institute.name}`);
    } else {
        console.log(`✅ Using existing institute: ${institute.name}`);
    }

    // Step 2: Create classes
    console.log('\n📚 Step 2: Creating classes...');
    const classes = [];
    for (const classData of CONFIG.CLASSES) {
        let classRecord = await prisma.class.findFirst({
            where: {
                name: classData.name,
                section: classData.section,
                instituteId: institute.id,
            },
        });

        if (!classRecord) {
            classRecord = await prisma.class.create({
                data: {
                    ...classData,
                    instituteId: institute.id,
                },
            });
            console.log(`  ✅ Created: ${classData.name} - ${classData.section}`);
        } else {
            console.log(`  ℹ️  Exists: ${classData.name} - ${classData.section}`);
        }
        classes.push(classRecord);
    }

    // Step 3: Create fee structures
    console.log('\n💰 Step 3: Creating fee structures...');
    const feeStructures: any[] = [];

    for (let i = 0; i < classes.length; i++) {
        const classRecord = classes[i];
        const feeTemplate = CONFIG.FEE_STRUCTURES[Math.floor(i / 2) % CONFIG.FEE_STRUCTURES.length];

        const totalAmount =
            feeTemplate.tuitionFee +
            feeTemplate.examFee +
            feeTemplate.libraryFee +
            feeTemplate.sportsFee;

        let feeStructure = await prisma.feeStructure.findFirst({
            where: {
                classId: classRecord.id,
                name: feeTemplate.name,
            },
        });

        if (!feeStructure) {
            feeStructure = await prisma.feeStructure.create({
                data: {
                    name: feeTemplate.name,
                    classId: classRecord.id,
                    tuitionFee: feeTemplate.tuitionFee,
                    examFee: feeTemplate.examFee,
                    libraryFee: feeTemplate.libraryFee,
                    sportsFee: feeTemplate.sportsFee,
                    totalAmount,
                    frequency: feeTemplate.frequency as any,
                },
            });
            console.log(`  ✅ Created fee structure for ${classRecord.name}-${classRecord.section}`);
        } else {
            console.log(`  ℹ️  Fee structure exists for ${classRecord.name}-${classRecord.section}`);
        }
        feeStructures.push({ classId: classRecord.id, feeStructure });
    }

    // Step 4: Create students
    console.log(`\n👥 Step 4: Creating ${CONFIG.STUDENTS_COUNT} students...`);
    const students = [];
    const studentsPerClass = Math.ceil(CONFIG.STUDENTS_COUNT / classes.length);

    for (let i = 0; i < classes.length; i++) {
        const classRecord = classes[i];
        const classStudentCount = Math.min(studentsPerClass, CONFIG.STUDENTS_COUNT - students.length);

        for (let j = 0; j < classStudentCount; j++) {
            const studentNum: number = students.length + 1;
            const email: string = `student${studentNum}@test.com`;

            // Check if student already exists
            let user: any = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        password: await bcrypt.hash('student123', 10),
                        name: `Test Student ${studentNum}`,
                        role: 'STUDENT',
                        instituteId: institute.id,
                    },
                });

                // Check if student profile exists
                let studentProfile: any = await prisma.studentProfile.findFirst({
                    where: { userId: user.id }
                });

                if (!studentProfile) {
                    studentProfile = await prisma.studentProfile.create({
                        data: {
                            userId: user.id,
                            classId: classRecord.id,
                            roll: `${j + 1}`.padStart(3, '0'),
                            registrationNo: `REG-2026-${studentNum.toString().padStart(5, '0')}`,
                            guardianName: `Guardian ${studentNum}`,
                            guardianPhone: `+8801${(1000000000 + studentNum).toString().slice(1)}`,
                            guardianEmail: `guardian${studentNum}@test.com`,
                            address: `${studentNum} Test Address, Dhaka`,
                        },
                    });
                }

                students.push(studentProfile);
            } else {
                const studentProfile = await prisma.studentProfile.findUnique({
                    where: { userId: user.id },
                });
                if (studentProfile) {
                    students.push(studentProfile);
                }
            }

            if ((studentNum) % 100 === 0) {
                console.log(`  ⏳ Created ${studentNum}/${CONFIG.STUDENTS_COUNT} students...`);
            }
        }
    }
    console.log(`✅ Total students created: ${students.length}`);

    // Step 5: Generate invoices and payments
    console.log(`\n📄 Step 5: Generating ${CONFIG.TRANSACTIONS_PER_YEAR} transactions...`);

    const invoicesPerStudent = Math.ceil(CONFIG.TRANSACTIONS_PER_YEAR / students.length);
    let totalInvoices = 0;
    let totalPayments = 0;

    // Get last invoice and payment numbers
    const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
    });
    const lastPayment = await prisma.payment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { receiptNumber: true },
    });

    let currentInvoiceNum = lastInvoice?.invoiceNumber || 'INV-2026-00000';
    let currentReceiptNum = lastPayment?.receiptNumber || 'RCP-2026-00000';

    for (const student of students) {
        const feeStructureData = feeStructures.find(fs => fs.classId === student.classId);
        if (!feeStructureData) continue;

        // Generate invoices for past 12 months
        for (let month = 0; month < invoicesPerStudent && totalInvoices < CONFIG.TRANSACTIONS_PER_YEAR; month++) {
            const issueDate = new Date();
            issueDate.setMonth(issueDate.getMonth() - month);

            const dueDate = new Date(issueDate);
            dueDate.setDate(dueDate.getDate() + 30);

            currentInvoiceNum = generateInvoiceNumber(currentInvoiceNum);
            const qrCode = generateQRHash(currentInvoiceNum);
            const verificationUrl = generateVerificationUrl(qrCode);

            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: currentInvoiceNum,
                    studentId: student.id,
                    feeStructureId: feeStructureData.feeStructure.id,
                    subtotal: feeStructureData.feeStructure.totalAmount,
                    discount: 0,
                    lateFee: 0,
                    totalAmount: feeStructureData.feeStructure.totalAmount,
                    paidAmount: 0,
                    balanceAmount: feeStructureData.feeStructure.totalAmount,
                    issueDate,
                    dueDate,
                    status: 'PENDING',
                    qrCode,
                    verificationUrl,
                },
            });

            await prisma.verifiableDocument.create({
                data: {
                    documentType: 'INVOICE',
                    documentNumber: currentInvoiceNum,
                    referenceId: invoice.id,
                    referenceType: 'INVOICE',
                    qrHash: qrCode,
                    verificationUrl,
                    issuedDate: issueDate,
                },
            });

            totalInvoices++;

            // 70% chance of payment
            if (Math.random() < 0.7) {
                const paymentAmount = invoice.totalAmount;
                const paymentDate = new Date(issueDate);
                paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 25));

                currentReceiptNum = generateReceiptNumber(currentReceiptNum);
                const receiptQR = generateQRHash(currentReceiptNum);
                const receiptUrl = generateVerificationUrl(receiptQR);

                const payment = await prisma.payment.create({
                    data: {
                        receiptNumber: currentReceiptNum,
                        invoiceId: invoice.id,
                        amount: paymentAmount,
                        paymentMethod: ['CASH', 'ONLINE', 'BANK_TRANSFER'][Math.floor(Math.random() * 3)] as any,
                        paymentDate,
                        status: 'COMPLETED',
                        qrCode: receiptQR,
                        verificationUrl: receiptUrl,
                    },
                });

                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        paidAmount: paymentAmount,
                        balanceAmount: 0,
                        status: 'PAID',
                    },
                });

                await prisma.verifiableDocument.create({
                    data: {
                        documentType: 'RECEIPT',
                        documentNumber: currentReceiptNum,
                        referenceId: payment.id,
                        referenceType: 'RECEIPT',
                        qrHash: receiptQR,
                        verificationUrl: receiptUrl,
                        issuedDate: paymentDate,
                    },
                });

                totalPayments++;
            }

            if (totalInvoices % 500 === 0) {
                console.log(`  ⏳ Generated ${totalInvoices} invoices, ${totalPayments} payments...`);
            }
        }
    }

    console.log(`✅ Total invoices: ${totalInvoices}`);
    console.log(`✅ Total payments: ${totalPayments}`);

    // Step 6: Display statistics
    console.log('\n📊 Final Statistics:');
    const stats = await prisma.$transaction([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.studentProfile.count(),
        prisma.class.count(),
        prisma.feeStructure.count(),
        prisma.invoice.count(),
        prisma.payment.count(),
        prisma.verifiableDocument.count(),
    ]);

    console.log(`  👥 Students: ${stats[1]}`);
    console.log(`  📚 Classes: ${stats[2]}`);
    console.log(`  💰 Fee Structures: ${stats[3]}`);
    console.log(`  📄 Invoices: ${stats[4]}`);
    console.log(`  💳 Payments: ${stats[5]}`);
    console.log(`  🔐 Verifiable Documents: ${stats[6]}`);

    // Calculate totals
    const financialStats = await prisma.invoice.aggregate({
        _sum: {
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
        },
    });

    console.log('\n💵 Financial Summary:');
    console.log(`  Total Billed: ৳${financialStats._sum.totalAmount?.toLocaleString()}`);
    console.log(`  Total Collected: ৳${financialStats._sum.paidAmount?.toLocaleString()}`);
    console.log(`  Outstanding: ৳${financialStats._sum.balanceAmount?.toLocaleString()}`);

    console.log('\n✨ Test data seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
