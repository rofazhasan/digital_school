import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';

const saveTemplateSchema = z.object({
  templateId: z.string().min(2).max(120),
  name: z.string().min(2).max(200),
  canonicalWidth: z.number().int().positive().default(1240),
  canonicalHeight: z.number().int().positive().default(1754),
  geometry: z.record(z.any()),
  isApproved: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const templateId = request.nextUrl.searchParams.get('templateId');
    if (templateId) {
      const tpl = await prismadb.oMRTemplateDefinition.findUnique({
        where: { templateId },
      });
      if (!tpl) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, template: tpl });
    }

    const templates = await prismadb.oMRTemplateDefinition.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('GET /api/omr-templates error:', error);
    return NextResponse.json({ error: 'Failed to load OMR templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !hasPermission(auth.user.role, 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden: TEACHER or ADMIN role required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = saveTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid template payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { templateId, name, canonicalWidth, canonicalHeight, geometry, isApproved } = parsed.data;
    const existing = await prismadb.oMRTemplateDefinition.findUnique({ where: { templateId } });

    const saved = await prismadb.oMRTemplateDefinition.upsert({
      where: { templateId },
      update: {
        name,
        canonicalWidth,
        canonicalHeight,
        geometry,
        isApproved,
        isActive: true,
        version: (existing?.version || 1) + 1,
      },
      create: {
        templateId,
        name,
        canonicalWidth,
        canonicalHeight,
        geometry,
        isApproved,
        isActive: true,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    console.error('POST /api/omr-templates error:', error);
    return NextResponse.json({ error: 'Failed to save OMR template' }, { status: 500 });
  }
}
