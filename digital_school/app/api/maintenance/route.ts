import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get the first institute's settings
        const settings = await db.settings.findFirst({
            select: {
                maintenanceMode: true
            }
        });

        return NextResponse.json({
            maintenanceMode: settings?.maintenanceMode || false
        });
    } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // Fail open (assume not in maintenance) to avoid blocking access on DB error
        return NextResponse.json({
            maintenanceMode: false,
            error: 'Failed to check status'
        });
    }
}
