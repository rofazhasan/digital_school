import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
    try {
        const token = await getTokenFromRequest(request);

        // Only Super User can change settings
        if (!token || token.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        // Destructure all possible fields
        const {
            maintenanceMode,
            instituteName,
            address,
            phone,
            email,
            website,
            logoUrl,
            signatureUrl,
            colorTheme
        } = body;

        // Find existing settings or bootstrap
        let settings = await db.settings.findFirst({
            include: { institute: true }
        });

        if (!settings) {
            const institute = await db.institute.findFirst();
            if (!institute) {
                return NextResponse.json({ error: 'No institute found to apply settings' }, { status: 404 });
            }

            settings = await db.settings.create({
                data: {
                    instituteId: institute.id,
                    instituteName: instituteName || institute.name,
                    maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : false,
                    // valid json fields
                    colorTheme: colorTheme || undefined,
                    logoUrl: logoUrl || undefined,
                    signatureUrl: signatureUrl || undefined
                },
                include: { institute: true }
            });
        }

        // Update Institute Table (Source of truth for global app)
        if (settings.instituteId) {
            await db.institute.update({
                where: { id: settings.instituteId },
                data: {
                    name: instituteName,
                    address,
                    phone,
                    email,
                    website,
                    logoUrl,
                    signatureUrl,
                    colorTheme: colorTheme // Ensure strictly valid JSON or atomic value
                }
            });
        }

        // Update Settings Table (Sync redundant fields)
        settings = await db.settings.update({
            where: { id: settings.id },
            data: {
                maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : settings.maintenanceMode,
                instituteName,
                logoUrl,
                signatureUrl,
                colorTheme,
                contactInfo: { phone, email, website, address } // Store extra contact info in JSON if needed
            },
            include: { institute: true }
        });

        return NextResponse.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Authenticated users can read settings
        const token = await getTokenFromRequest(request);
        if (!token) {
            // Allow unauthenticated for some public data? Maybe, but sticking to logic.
            // Actually, layout might need it. Let's allowing public read for basic branding? 
            // Middleware blocks /api/settings for public.
            // For now, assume auth.
        }

        const settings = await db.settings.findFirst({
            include: { institute: true }
        });

        if (!settings) {
            return NextResponse.json({ maintenanceMode: false });
        }

        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode,
            instituteName: settings.institute?.name || settings.instituteName,
            address: settings.institute?.address,
            phone: settings.institute?.phone,
            email: settings.institute?.email,
            website: settings.institute?.website,
            logoUrl: settings.institute?.logoUrl || settings.logoUrl,
            signatureUrl: settings.institute?.signatureUrl || settings.signatureUrl,
            colorTheme: settings.institute?.colorTheme || settings.colorTheme
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
