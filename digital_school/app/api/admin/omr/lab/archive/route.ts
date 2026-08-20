import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageName = 'omr_failure_sample.png',
      imageBase64,
      templateVersion = 1,
      scannerVersion = '2.0.0-Lab',
      failureReason = 'Manual Diagnostic Flag',
      detectedGeometry,
      confidenceValues,
      bubbleScores
    } = body;

    const archiveDir = path.join(process.cwd(), '.omr_diagnostic_archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `diagnostic_${timestamp}_${imageName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const logFilename = `diagnostic_${timestamp}.json`;

    if (imageBase64) {
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(path.join(archiveDir, filename), buffer);
    }

    const diagnosticPayload = {
      timestamp: new Date().toISOString(),
      imagePath: filename,
      templateVersion,
      scannerVersion,
      failureReason,
      detectedGeometry,
      confidenceValues,
      bubbleScores
    };

    fs.writeFileSync(path.join(archiveDir, logFilename), JSON.stringify(diagnosticPayload, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Diagnostic sample permanently archived for regression benchmark.',
      archiveId: `ARCHIVE_${timestamp}`,
      path: filename
    });
  } catch (error: any) {
    console.error('[OMRLabArchive] Failed to archive failure sample:', error);
    return NextResponse.json({ error: error.message || 'Failed to archive diagnostic sample.' }, { status: 500 });
  }
}
