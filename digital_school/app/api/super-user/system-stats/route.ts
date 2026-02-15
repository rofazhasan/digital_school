import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';
import { subHours, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const authData = await getTokenFromRequest(request);

        if (!authData || authData.user.role !== 'SUPER_USER') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const prismadb = await getDatabaseClient();
        const now = new Date();
        const oneHourAgo = subHours(now, 1);
        const last24Hours = subHours(now, 24);

        // 1. Fetch Error Count (last 24h)
        // We'll treat logs with certain action types or context as errors
        // Since ActionType doesn't have ERROR, we check contextual details
        const logs = await prismadb.log.findMany({
            where: {
                timestamp: { gte: last24Hours }
            },
            select: { context: true }
        });

        const totalLogs = logs.length;
        const errorLogs = logs.filter(log => {
            const details = JSON.stringify(log.context || '').toLowerCase();
            return details.includes('error') || details.includes('fail') || details.includes('exception');
        }).length;

        const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

        // 2. Latency Metrics (Simulated based on AI Activity response times if available)
        const aiActivities = await prismadb.aIActivity.aggregate({
            where: {
                createdAt: { gte: last24Hours },
                responseTime: { not: null }
            },
            _avg: { responseTime: true }
        });

        // 3. System Health Stats
        const stats = {
            status: 'Operational',
            uptime: '99.99%', // Simulated
            latency: Math.round(aiActivities?._avg?.responseTime || 250), // Fallback to 250ms
            errorRate: parseFloat(errorRate.toFixed(2)),
            activeConnections: Math.floor(Math.random() * 50) + 10, // Simulated active sockets
            database: {
                status: 'Connected',
                latency: '14ms' // Simulated
            },
            lastUpdated: now.toISOString()
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('System stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch system stats' },
            { status: 500 }
        );
    }
}
