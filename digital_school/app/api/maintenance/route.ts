import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

let cachedStatus: { mode: boolean; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
    try {
        const now = Date.now();
        if (cachedStatus && (now - cachedStatus.timestamp < CACHE_TTL_MS)) {
            return NextResponse.json(
                { maintenanceMode: cachedStatus.mode },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
                    }
                }
            );
        }

        // Get the first institute's settings
        const settings = await db.settings.findFirst({
            select: {
                maintenanceMode: true
            }
        });

        const maintenanceMode = settings?.maintenanceMode || false;
        cachedStatus = { mode: maintenanceMode, timestamp: now };

        return NextResponse.json(
            { maintenanceMode },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
                }
            }
        );
    } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // Fail open (assume not in maintenance) to avoid blocking access on DB error
        return NextResponse.json({
            maintenanceMode: false,
            error: 'Failed to check status'
        });
    }
}
