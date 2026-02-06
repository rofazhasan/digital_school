import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/verify/[qrHash] - Public verification endpoint
export async function GET(
    request: NextRequest,
    { params }: { params: { qrHash: string } }
) {
    try {
        const { qrHash } = params;

        if (!qrHash) {
            return NextResponse.json(
                { error: 'QR hash is required' },
                { status: 400 }
            );
        }

        // Find verifiable document
        const document = await prisma.verifiableDocument.findUnique({
            where: { qrHash },
        });

        if (!document) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Document not found or invalid QR code',
                },
                { status: 404 }
            );
        }

        // Check if document is revoked
        if (!document.isValid || document.revokedAt) {
            return NextResponse.json({
                valid: false,
                message: 'Document has been revoked',
                document: {
                    documentType: document.documentType,
                    documentNumber: document.documentNumber,
                    revokedAt: document.revokedAt,
                },
            });
        }

        // Check if document is expired
        if (document.expiryDate && new Date() > document.expiryDate) {
            return NextResponse.json({
                valid: false,
                message: 'Document has expired',
                document: {
                    documentType: document.documentType,
                    documentNumber: document.documentNumber,
                    expiryDate: document.expiryDate,
                },
            });
        }

        // Fetch related data based on document type
        let relatedData: any = null;

        if (document.documentType === 'INVOICE') {
            relatedData = await prisma.invoice.findUnique({
                where: { id: document.referenceId },
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
                    feeStructure: {
                        select: {
                            name: true,
                        },
                    },
                    payments: {
                        select: {
                            amount: true,
                            paymentDate: true,
                            paymentMethod: true,
                        },
                    },
                },
            });
        } else if (document.documentType === 'RECEIPT') {
            relatedData = await prisma.payment.findUnique({
                where: { id: document.referenceId },
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
                },
            });
        }

        return NextResponse.json({
            valid: true,
            message: 'Document verified successfully',
            document: {
                documentType: document.documentType,
                documentNumber: document.documentNumber,
                issuedDate: document.issuedDate,
                expiryDate: document.expiryDate,
                metadata: document.metadata,
            },
            data: relatedData,
        });
    } catch (error) {
        console.error('Error verifying document:', error);
        return NextResponse.json(
            { error: 'Failed to verify document' },
            { status: 500 }
        );
    }
}
