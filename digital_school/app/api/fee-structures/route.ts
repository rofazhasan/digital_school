import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/fee-structures - List fee structures
export async function GET(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('classId');
        const active = searchParams.get('active');

        const where: any = {};

        if (classId) {
            where.classId = classId;
        }

        if (active !== null) {
            where.active = active === 'true';
        }

        const feeStructures = await prisma.feeStructure.findMany({
            where,
            include: {
                class: {
                    select: {
                        name: true,
                        section: true,
                    },
                },
                _count: {
                    select: {
                        invoices: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ feeStructures });
    } catch (error) {
        console.error('Error fetching fee structures:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fee structures' },
            { status: 500 }
        );
    }
}

// POST /api/fee-structures - Create fee structure
export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);
        if (!auth?.user || !['ADMIN', 'SUPER_USER'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            classId,
            tuitionFee = 0,
            admissionFee = 0,
            examFee = 0,
            libraryFee = 0,
            labFee = 0,
            sportsFee = 0,
            transportFee = 0,
            otherFees = 0,
            frequency = 'ANNUAL',
            dueDay,
            siblingDiscount = 0,
            meritDiscount = 0,
        } = body;

        // Validate required fields
        if (!name || !classId) {
            return NextResponse.json(
                { error: 'Name and classId are required' },
                { status: 400 }
            );
        }

        // Calculate total amount
        const totalAmount =
            tuitionFee +
            admissionFee +
            examFee +
            libraryFee +
            labFee +
            sportsFee +
            transportFee +
            otherFees;

        // Create fee structure
        const feeStructure = await prisma.feeStructure.create({
            data: {
                name,
                classId,
                tuitionFee,
                admissionFee,
                examFee,
                libraryFee,
                labFee,
                sportsFee,
                transportFee,
                otherFees,
                totalAmount,
                frequency,
                dueDay,
                siblingDiscount,
                meritDiscount,
                active: true,
            },
            include: {
                class: {
                    select: {
                        name: true,
                        section: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: 'Fee structure created successfully',
            feeStructure,
        });
    } catch (error) {
        console.error('Error creating fee structure:', error);
        return NextResponse.json(
            { error: 'Failed to create fee structure' },
            { status: 500 }
        );
    }
}
