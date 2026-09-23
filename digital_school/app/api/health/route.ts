import { createApiResponse } from '@/lib/db-utils';
import { DatabaseClient } from '@/lib/db';

export async function GET() {
    try {
        const prisma = await DatabaseClient.getInstance();
        await prisma.$queryRaw`SELECT 1`;

        return createApiResponse({
            status: 'healthy',
            database: { healthy: true, message: 'Database connected successfully' },
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        });
    } catch (error: any) {
        console.error('Health check failed:', error);
        return createApiResponse(
            null,
            error.message || 'Health check failed',
            500
        );
    }
} 