import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import cloudinary from '@/lib/cloudinary';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: examId } = await params;
    const { studentId, questionId, imageData, originalImagePath, imageIndex = 0 } = await req.json();

    // Validate user has permission to evaluate this exam
    const user = await prisma.user.findUnique({
      where: { id: tokenData.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can evaluate this exam
    if (user.role === 'SUPER_USER') {
      // Super user can evaluate any exam
    } else if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      // Check if teacher is assigned to this exam
      const assignment = await prisma.examEvaluationAssignment.findFirst({
        where: {
          examId,
          evaluatorId: tokenData.user.id
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Not assigned to evaluate this exam' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Save drawing directly to Cloudinary
    let annotatedImagePath = '';

    if (imageData && imageData.startsWith('data:image/')) {
      // Upload the raw canvas data (transparent PNG) directly to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(imageData, {
        folder: `digital_school/evaluations/${examId}/${studentId}`,
        resource_type: 'image',
        format: 'png',
      });
      annotatedImagePath = uploadResponse.secure_url;
    } else {
      return NextResponse.json({ error: 'Invalid or missing image data' }, { status: 400 });
    }

    const existingDrawing = await prisma.examSubmissionDrawing.findFirst({
      where: {
        studentId,
        questionId,
        imageIndex
      }
    });

    let drawingData;
    if (existingDrawing) {
      // Update existing drawing
      drawingData = await prisma.examSubmissionDrawing.update({
        where: { id: existingDrawing.id },
        data: {
          imageData: annotatedImagePath, // Save the path to the annotated image
          originalImagePath,
          evaluatorId: tokenData.user.id,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new drawing
      drawingData = await prisma.examSubmissionDrawing.create({
        data: {
          studentId,
          questionId,
          examId,
          imageIndex,
          imageData: annotatedImagePath, // Save the path to the annotated image
          originalImagePath,
          evaluatorId: tokenData.user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      drawingId: drawingData.id,
      annotatedImagePath
    });

  } catch (error) {
    console.error('Error saving drawing:', error);
    return NextResponse.json(
      { error: 'Failed to save drawing' },
      { status: 500 }
    );
  }
} 