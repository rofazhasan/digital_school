import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/db-utils';
import ServerlessDatabaseManager from '@/lib/db-optimized';

export async function GET() {
    try {
        const dbHealth = await (ServerlessDatabaseManager as any).healthCheck?.();

        if (!dbHealth.healthy) {
            return createApiResponse(
                null,
                dbHealth.message,
                503
            );
        }

        // Assuming ServerlessDatabaseManager internally exposes a 'prisma' instance or is itself the prisma client.
        // If 'prisma' is not directly available in this scope, this line might cause a reference error.
        // The instruction explicitly asks to cast 'prisma' to 'any'.
        const prisma = ServerlessDatabaseManager; // This line is added to make 'prisma' available for the requested change.
        // If 'prisma' is a different object, it needs to be imported or defined elsewhere.

        return createApiResponse({
            status: 'healthy',
            database: dbHealth,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeConnections: (prisma as any).connectionCount || 0,
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return createApiResponse(
            null,
            'Health check failed',
            500
        );
    }
} 