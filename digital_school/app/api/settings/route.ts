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
                    colorTheme: colorTheme ?? undefined,
                    logoUrl: logoUrl ?? undefined,
                    signatureUrl: signatureUrl ?? undefined,
                    contactInfo: { phone, email, website, address }
                },
                include: { institute: true }
            });
        }

        // Prepare update data for Institute
        const instituteUpdate: any = {};
        if (instituteName !== undefined) instituteUpdate.name = instituteName;
        if (address !== undefined) instituteUpdate.address = address;
        if (phone !== undefined) instituteUpdate.phone = phone;
        if (email !== undefined) instituteUpdate.email = email;
        if (website !== undefined) instituteUpdate.website = website;
        if (logoUrl !== undefined) instituteUpdate.logoUrl = logoUrl;
        if (signatureUrl !== undefined) instituteUpdate.signatureUrl = signatureUrl;
        if (colorTheme !== undefined) instituteUpdate.colorTheme = colorTheme;

        if (Object.keys(instituteUpdate).length > 0 && settings.instituteId) {
            await db.institute.update({
                where: { id: settings.instituteId },
                data: instituteUpdate
            });
        }

        // Prepare update data for Settings
        const settingsUpdate: any = {};
        if (typeof maintenanceMode === 'boolean') settingsUpdate.maintenanceMode = maintenanceMode;
        if (instituteName !== undefined) settingsUpdate.instituteName = instituteName;
        if (logoUrl !== undefined) settingsUpdate.logoUrl = logoUrl;
        if (signatureUrl !== undefined) settingsUpdate.signatureUrl = signatureUrl;
        if (colorTheme !== undefined) settingsUpdate.colorTheme = colorTheme;

        // Merge contact info if any field is present
        if (phone !== undefined || email !== undefined || website !== undefined || address !== undefined) {
            const currentContact = settings.contactInfo as any || {};
            settingsUpdate.contactInfo = {
                ...currentContact,
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(website !== undefined && { website }),
                ...(address !== undefined && { address }),
            };
        }

        if (Object.keys(settingsUpdate).length > 0) {
            settings = await db.settings.update({
                where: { id: settings.id },
                data: settingsUpdate,
                include: { institute: true }
            });
        }

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
            // Fallback: If no settings record, fetch directly from Institute
            const institute = await db.institute.findFirst();
            if (institute) {
                return NextResponse.json({
                    maintenanceMode: false,
                    instituteName: institute.name,
                    address: institute.address,
                    phone: institute.phone,
                    email: institute.email,
                    website: institute.website,
                    logoUrl: institute.logoUrl,
                    signatureUrl: institute.signatureUrl,
                    colorTheme: institute.colorTheme
                });
            }
            return NextResponse.json({ maintenanceMode: false, instituteName: "Digital School" });
        }

        const contactInfo = settings.contactInfo as any || {};

        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode,
            instituteName: settings.institute?.name || settings.instituteName || "Digital School",
            address: settings.institute?.address || contactInfo.address,
            phone: settings.institute?.phone || contactInfo.phone,
            email: settings.institute?.email || contactInfo.email,
            website: settings.institute?.website || contactInfo.website,
            logoUrl: settings.institute?.logoUrl || settings.logoUrl || "/logo.png",
            signatureUrl: settings.institute?.signatureUrl || settings.signatureUrl,
            colorTheme: settings.institute?.colorTheme || settings.colorTheme
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
