import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
    try {
        const token = await getTokenFromRequest(request);

        // Only Super User can change maintenance mode
        if (!token || token.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { maintenanceMode } = body;

        if (typeof maintenanceMode !== 'boolean') {
            return NextResponse.json({ error: 'Invalid maintenance mode value' }, { status: 400 });
        }

        // Find the institute settings linked to this super user or the first one
        // Ideally, a super user manages one institute or system-wide settings
        let settings = await db.settings.findFirst();

        if (!settings) {
            // Create if doesn't exist (bootstrap)
            // We need an institute ID. If none exists, this might be tricky.
            // Assuming at least one institute exists.
            const institute = await db.institute.findFirst();
            if (!institute) {
                return NextResponse.json({ error: 'No institute found to apply settings' }, { status: 404 });
            }

            settings = await db.settings.create({
                data: {
                    instituteId: institute.id,
                    instituteName: institute.name,
                    maintenanceMode: maintenanceMode
                }
            });
        } else {
            settings = await db.settings.update({
                where: { id: settings.id },
                data: { maintenanceMode }
            });
        }

        return NextResponse.json({
            success: true,
            maintenanceMode: settings.maintenanceMode
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = await getTokenFromRequest(request);

        if (!token || token.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await db.settings.findFirst();

        return NextResponse.json({
            maintenanceMode: settings?.maintenanceMode || false
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
