import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
    generateInvoiceNumber,
    generateQRHash,
    generateVerificationUrl,
    calculateLateFee,
    calculateDiscount,
} from '@/utils/school-management';

// GET /api/invoices - List invoices with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const status = searchParams.get('status');
        const classId = searchParams.get('classId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        // Filter by student
        if (studentId) {
            where.studentId = studentId;
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by class (via student)
        if (classId) {
            where.student = {
                classId: classId,
            };
        }

        // Auto-update overdue invoices
        const today = new Date();
        await prisma.invoice.updateMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    lt: today,
                },
            },
            data: {
                status: 'OVERDUE',
            },
        });

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                            class: {
                                select: {
                                    name: true,
                                    section: true,
                                },
                            },
                        },
                    },
                    feeStructure: true,
                    payments: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.invoice.count({ where }),
        ]);

        return NextResponse.json({
            invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}

// POST /api/invoices - Generate new invoice
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !['ADMIN', 'SUPER_USER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { studentId, feeStructureId, dueDate, notes } = body;

        // Validate required fields
        if (!studentId || !feeStructureId || !dueDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get student and fee structure
        const [student, feeStructure] = await Promise.all([
            prisma.studentProfile.findUnique({
                where: { id: studentId },
                include: {
                    user: true,
                    class: true,
                },
            }),
            prisma.feeStructure.findUnique({
                where: { id: feeStructureId },
            }),
        ]);

        if (!student || !feeStructure) {
            return NextResponse.json(
                { error: 'Student or Fee Structure not found' },
                { status: 404 }
            );
        }

        // Check if invoice already exists for this period
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                studentId,
                feeStructureId,
                issueDate: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        });

        if (existingInvoice) {
            return NextResponse.json(
                { error: 'Invoice already exists for this period' },
                { status: 409 }
            );
        }

        // Generate invoice number
        const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true },
        });
        const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber);

        // Calculate amounts
        const subtotal = feeStructure.totalAmount;

        // Apply discounts (sibling, merit, etc.)
        let discount = 0;
        // TODO: Implement discount logic based on student profile

        const totalAmount = subtotal - discount;
        const balanceAmount = totalAmount;

        // Generate QR code hash and verification URL
        const qrCode = generateQRHash(invoiceNumber);
        const verificationUrl = generateVerificationUrl(qrCode);

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                studentId,
                feeStructureId,
                subtotal,
                discount,
                lateFee: 0,
                totalAmount,
                paidAmount: 0,
                balanceAmount,
                issueDate: new Date(),
                dueDate: new Date(dueDate),
                status: 'PENDING',
                qrCode,
                verificationUrl,
                notes,
                createdBy: session.user.id,
            },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
                feeStructure: true,
            },
        });

        // Create verifiable document
        await prisma.verifiableDocument.create({
            data: {
                documentType: 'INVOICE',
                documentNumber: invoiceNumber,
                referenceId: invoice.id,
                referenceType: 'INVOICE',
                qrHash: qrCode,
                verificationUrl,
                issuedDate: new Date(),
            },
        });

        return NextResponse.json({
            message: 'Invoice generated successfully',
            invoice,
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
}
