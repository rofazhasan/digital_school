import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
    generateReceiptNumber,
    generateQRHash,
    generateVerificationUrl,
} from '@/utils/school-management';

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoiceId');
        const studentId = searchParams.get('studentId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (invoiceId) {
            where.invoiceId = invoiceId;
        }

        if (studentId) {
            where.invoice = {
                studentId: studentId,
            };
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    invoice: {
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    collector: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.payment.count({ where }),
        ]);

        return NextResponse.json({
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        );
    }
}

// POST /api/payments - Record new payment
export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user || !['ADMIN', 'SUPER_USER'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            invoiceId,
            amount,
            paymentMethod,
            transactionId,
            bankReference,
            notes,
        } = body;

        // Validate required fields
        if (!invoiceId || !amount || !paymentMethod) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Validate payment amount
        if (amount <= 0 || amount > invoice.balanceAmount) {
            return NextResponse.json(
                { error: 'Invalid payment amount' },
                { status: 400 }
            );
        }

        // Generate receipt number
        const lastPayment = await prisma.payment.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { receiptNumber: true },
        });
        const receiptNumber = generateReceiptNumber(lastPayment?.receiptNumber);

        // Generate QR code hash and verification URL
        const qrCode = generateQRHash(receiptNumber);
        const verificationUrl = generateVerificationUrl(qrCode);

        // Create payment and update invoice in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create payment
            const payment = await tx.payment.create({
                data: {
                    receiptNumber,
                    invoiceId,
                    amount,
                    paymentMethod,
                    paymentDate: new Date(),
                    transactionId,
                    bankReference,
                    status: 'COMPLETED',
                    qrCode,
                    verificationUrl,
                    notes,
                    collectedBy: auth.user.id,
                },
                include: {
                    invoice: {
                        include: {
                            student: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });

            // Update invoice
            const newPaidAmount = invoice.paidAmount + amount;
            const newBalanceAmount = invoice.totalAmount - newPaidAmount;
            const newStatus =
                newBalanceAmount === 0
                    ? 'PAID'
                    : newPaidAmount > 0
                        ? 'PARTIALLY_PAID'
                        : 'PENDING';

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: newStatus,
                },
            });

            // Create verifiable document
            await tx.verifiableDocument.create({
                data: {
                    documentType: 'RECEIPT',
                    documentNumber: receiptNumber,
                    referenceId: payment.id,
                    referenceType: 'RECEIPT',
                    qrHash: qrCode,
                    verificationUrl,
                    issuedDate: new Date(),
                },
            });

            return payment;
        });

        return NextResponse.json({
            message: 'Payment recorded successfully',
            payment: result,
        });
    } catch (error) {
        console.error('Error recording payment:', error);
        return NextResponse.json(
            { error: 'Failed to record payment' },
            { status: 500 }
        );
    }
}
