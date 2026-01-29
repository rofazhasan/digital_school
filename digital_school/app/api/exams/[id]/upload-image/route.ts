import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `exam-answers/${examId}/${formStudentId}/${questionId}`,
          resource_type: "auto",
          // Generate a consistent filename or let Cloudinary generating random ID
          // We'll let Cloudinary handle the naming but organize by folder
          context: {
            student_name: studentName,
            question_text: questionText,
            exam_id: examId
          }
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      filename: result.public_id, // Use public_id as filename reference
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