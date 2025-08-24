import { NextRequest, NextResponse } from "next/server";
import '../../../lib/file-polyfill'; // Import File polyfill for server environment
import { appwriteService } from "@/lib/appwrite";

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing Appwrite file upload...');
    
    const formData = await req.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Test metadata
    const metadata = {
      examId: 'test-exam-123',
      studentId: 'test-student-456',
      questionId: 'test-question-789',
      questionType: 'cq' as const,
      timestamp: new Date().toISOString(),
      originalFilename: file.name,
      studentName: 'Test Student',
      questionText: 'Test Question for Appwrite Integration'
    };

    console.log('📋 Uploading with metadata:', metadata);

    // Convert FormData file to proper format for Appwrite
    let fileToUpload = file;
    
    // If we're on the server side, convert to Buffer
    if (typeof File === 'undefined') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        fileToUpload = Buffer.from(arrayBuffer);
      } catch (e) {
        console.error('Failed to convert file to Buffer:', e);
        return NextResponse.json({ error: "Failed to process file" }, { status: 400 });
      }
    }

    // Upload to Appwrite
    const uploadedImage = await appwriteService.uploadExamImage(fileToUpload, metadata);

    console.log('✅ Upload successful:', uploadedImage);

    return NextResponse.json({
      success: true,
      message: "File uploaded to Appwrite successfully!",
      uploadedFile: uploadedImage,
      metadata: metadata
    });

  } catch (error) {
    console.error("Appwrite upload test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to upload file to Appwrite",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 