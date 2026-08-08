import { NextRequest, NextResponse } from 'next/server';
import { generateTemplateGeometry } from '@/lib/omr/geometry-template';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId') || 'C_11_12';
    const version = parseInt(searchParams.get('version') || '1', 10);
    const examId = searchParams.get('examId') || undefined;
    const setId = searchParams.get('setId') || undefined;

    // Check DB cache first
    try {
      const dbTemplate = await prisma.oMRTemplateDefinition.findUnique({
        where: { templateId }
      });

      if (dbTemplate && dbTemplate.geometry) {
        return NextResponse.json({
          success: true,
          source: 'database',
          template: dbTemplate.geometry
        });
      }
    } catch (_dbErr) {
      // Fall back to dynamic generator if DB is unreachable or empty
    }

    const geometry = generateTemplateGeometry(templateId, version, examId, setId);

    return NextResponse.json({
      success: true,
      source: 'generator',
      template: geometry
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch OMR template geometry' },
      { status: 500 }
    );
  }
}
