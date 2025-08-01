import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params;
  const tokenData = await getTokenFromRequest(req);
  
  if (!tokenData || !tokenData.user || !tokenData.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // const studentId = tokenData.user.studentProfile?.id || tokenData.user.id;
  
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const questionId = formData.get("questionId") as string;
    const formStudentId = formData.get("studentId") as string;
    const studentName = formData.get("studentName") as string;
    const questionText = formData.get("questionText") as string;
    const timestamp = formData.get("timestamp") as string;
    
    if (!file || !questionId || !formStudentId) {
      return NextResponse.json({ error: "Missing file, questionId, or studentId" }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }
    
    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "exam-answers", examId, formStudentId, questionId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileTimestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${studentName}_${questionId}_${fileTimestamp}.${fileExtension}`;
    const filepath = join(uploadDir, filename);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/exam-answers/${examId}/${formStudentId}/${questionId}/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename,
      metadata: {
        studentId: formStudentId,
        studentName,
        questionId,
        questionText,
        timestamp,
        examId
      }
    });
    
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
} 