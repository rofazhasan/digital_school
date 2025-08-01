import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/db-utils';
import ServerlessDatabaseManager from '@/lib/db-optimized';

export async function GET() {
    try {
        const dbHealth = await ServerlessDatabaseManager.healthCheck();
        
        if (!dbHealth.healthy) {
            return createApiResponse(
                null,
                dbHealth.message,
                503
            );
        }

        return createApiResponse({
            status: 'healthy',
            database: dbHealth,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connectionCount: ServerlessDatabaseManager['connectionCount'] || 0,
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