import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

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

    // Merge annotation with original image and save as new file
    const mergeImageWithAnnotation = async (originalImagePath: string, annotationData: string) => {
      try {
        // Resolve the full path to the original image
        const fullImagePath = path.join(process.cwd(), 'public', originalImagePath);
        console.log('Loading original image from:', fullImagePath);
        
        // Check if the original image file exists
        if (!fs.existsSync(fullImagePath)) {
          throw new Error(`Original image file not found: ${fullImagePath}`);
        }
        
        // Load the original image
        const originalImage = await loadImage(fullImagePath);
        
        // Create canvas with original image dimensions
        const canvas = createCanvas(originalImage.width, originalImage.height);
        const ctx = canvas.getContext('2d');
        
        // Draw the original image
        ctx.drawImage(originalImage, 0, 0);
        
        // Parse the annotation data (base64 encoded canvas data)
        if (annotationData && annotationData.startsWith('data:image/')) {
          // Load the annotation image and draw it on top
          const annotationImage = await loadImage(annotationData);
          ctx.drawImage(annotationImage, 0, 0);
        }
        
        // Save the merged image
        const buffer = canvas.toBuffer('image/jpeg');
        const fileName = `annotated_${path.basename(originalImagePath)}`;
        const outputPath = path.join(process.cwd(), 'public', 'uploads', 'exam-answers', studentId, questionId, fileName);
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, buffer);
        
        return `/uploads/exam-answers/${studentId}/${questionId}/${fileName}`;
      } catch (error) {
        console.error('Error merging image with annotation:', error);
        throw error;
      }
    };

    // Merge annotation with original image
    const annotatedImagePath = await mergeImageWithAnnotation(originalImagePath, imageData);
    
    // Save the annotated image path instead of separate annotation data
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