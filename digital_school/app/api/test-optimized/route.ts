import { NextResponse } from 'next/server';
import ServerlessDatabaseManager from '@/lib/db-optimized';

export async function GET() {
    try {
        const startTime = Date.now();

        const result = await (prisma as any).executeWithConnection(async (db: any) => {
            // Simple query to test performance
            const examCount = await db.exam.count();
            const userCount = await db.user.count();

            return {
                examCount,
                userCount,
                timestamp: new Date().toISOString(),
            };
        });

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            data: result,
            responseTime: `${responseTime}ms`,
            message: 'Optimized database query completed successfully',
        });
    } catch (error) {
        console.error('Optimized test failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Database operation failed',
            },
            { status: 500 }
        );
    }
} 