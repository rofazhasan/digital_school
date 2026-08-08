import { NextRequest, NextResponse } from 'next/server';
import { Jimp, JimpInstance } from 'jimp';
import jsQR from 'jsqr';
import { detectCornerMarkers } from '@/lib/omr/marker-detector';
import { warpPerspectiveImage, CornerQuad } from '@/lib/omr/perspective-warp';
import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '@/lib/omr/geometry-template';
import { DigitBubbleReader } from '@/lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '@/lib/omr/question-classifier';
import { evaluateImageQuality } from '@/lib/omr/quality-engine';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Read Image
    const jimpImg = (await Jimp.read(buffer)) as unknown as JimpInstance;
    const srcW = jimpImg.bitmap.width;
    const srcH = jimpImg.bitmap.height;
    const srcData = new Uint8ClampedArray(jimpImg.bitmap.data);

    // 2. Corner Marker Detection
    const markerResult = detectCornerMarkers(srcData, srcW, srcH);
    if (!markerResult.isValid || !markerResult.quad) {
      return NextResponse.json({
        success: false,
        error: markerResult.error || 'Failed to detect 4 corner registration markers',
        markerResult
      }, { status: 422 });
    }

    // 3. Perspective Warp into Canonical Coordinates (2480x3508)
    const dstQuad: CornerQuad = {
      tl: { x: 145, y: 145 },
      tr: { x: 2335, y: 145 },
      bl: { x: 145, y: 3363 },
      br: { x: 2335, y: 3363 }
    };

    const warped = warpPerspectiveImage(
      srcData,
      srcW,
      srcH,
      markerResult.quad,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      dstQuad
    );

    // 4. Quality Evaluation
    const quality = evaluateImageQuality(warped.data, CANONICAL_WIDTH, CANONICAL_HEIGHT, markerResult.confidence);

    // 5. QR Code Decoding
    let qrDataObj: any = null;
    try {
      const qrCode = jsQR(warped.data, CANONICAL_WIDTH, CANONICAL_HEIGHT);
      if (qrCode && qrCode.data) {
        qrDataObj = JSON.parse(qrCode.data);
      }
    } catch (_qrErr) {
      // QR optional fallback
    }

    // 6. Template Identification & Geometry Lookup
    const templateId = qrDataObj?.templateId || 'C_11_12';
    const version = qrDataObj?.version || 1;
    const geometry = generateTemplateGeometry(templateId, version);

    // 7. Extract Roll Number (6 columns)
    const rollResult = DigitBubbleReader.readMatrix(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.roll.columns,
      geometry.roll.cells
    );

    // 8. Extract Registration Number (7 columns)
    const regResult = DigitBubbleReader.readMatrix(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.registration.columns,
      geometry.registration.cells
    );

    // 9. Extract Answers (100 Questions)
    const answerResult = QuestionClassifier.classifyQuestions(
      warped.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.answers.questionCount,
      geometry.answers.cells
    );

    // 10. Student Lookup by Roll/Registration
    let matchedStudent: any = null;
    if (rollResult.value && !rollResult.value.includes('?')) {
      try {
        matchedStudent = await prisma.studentProfile.findFirst({
          where: { roll: rollResult.value },
          include: { user: { select: { name: true, email: true } } }
        });
      } catch (_sErr) {}
    }

    return NextResponse.json({
      success: true,
      scan: {
        templateId: geometry.templateId,
        templateVersion: geometry.version,
        qrData: qrDataObj,
        rollNumber: rollResult.value,
        rollConfidence: rollResult.overallConfidence,
        rollDetails: rollResult.columns,
        registrationNo: regResult.value,
        regConfidence: regResult.overallConfidence,
        answers: answerResult.answers,
        answerConfidence: answerResult.overallConfidence,
        answerDetails: answerResult.details,
        stats: answerResult.stats,
        quality,
        student: matchedStudent
          ? {
              id: matchedStudent.id,
              name: matchedStudent.user?.name,
              roll: matchedStudent.roll,
              registrationNo: matchedStudent.registrationNo
            }
          : null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'OMR processing failed' },
      { status: 500 }
    );
  }
}
