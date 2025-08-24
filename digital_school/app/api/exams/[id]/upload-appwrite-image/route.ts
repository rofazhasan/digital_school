import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { appwriteService } from "@/lib/appwrite";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;
  const tokenData = await getTokenFromRequest(req);
  
  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const questionId = formData.get("questionId") as string;
    const formStudentId = formData.get("studentId") as string;
    const studentName = formData.get("studentName") as string;
    const questionText = formData.get("questionText") as string;
    const questionType = formData.get("questionType") as string;
    const timestamp = formData.get("timestamp") as string;
    
    if (!file || !questionId || !formStudentId || !questionType) {
      return NextResponse.json({ 
        error: "Missing required fields: file, questionId, studentId, or questionType" 
      }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    
    // Validate file size (max 10MB for Appwrite)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }
    
    // Validate question type
    if (!['cq', 'sq'].includes(questionType.toLowerCase())) {
      return NextResponse.json({ error: "Question type must be 'cq' or 'sq'" }, { status: 400 });
    }
    
    // Prepare metadata for Appwrite
    const metadata: any = {
      examId,
      studentId: formStudentId,
      questionId,
      questionType: questionType.toLowerCase() as 'cq' | 'sq',
      timestamp: timestamp || new Date().toISOString(),
      originalFilename: file.name,
      studentName,
      questionText
    };
    
    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Convert FormData file to Buffer for server-side processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔄 Converted to Buffer:', {
      bufferSize: buffer.length,
      isBuffer: Buffer.isBuffer(buffer)
    });
    
    // Upload to Appwrite using Buffer
    const uploadedImage = await appwriteService.uploadExamImage(buffer, metadata);
    
    return NextResponse.json({ 
      success: true, 
      fileId: uploadedImage.fileId,
      url: uploadedImage.url,
      filename: uploadedImage.filename,
      size: uploadedImage.size,
      mimeType: uploadedImage.mimeType,
      uploadedAt: uploadedImage.uploadedAt,
      metadata: {
        studentId: formStudentId,
        studentName,
        questionId,
        questionText,
        questionType: questionType.toLowerCase(),
        timestamp: metadata.timestamp,
        examId
      }
    });
    
  } catch (error) {
    console.error("Appwrite image upload error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to upload image to Appwrite" 
    }, { status: 500 });
  }
} 