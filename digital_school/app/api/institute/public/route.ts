import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET() {
    try {
        const institutes = await prismadb.institute.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({
            institutes,
        });
    } catch (error) {
        console.error('Error fetching institutes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch institutes' },
            { status: 500 }
        );
    }
} 