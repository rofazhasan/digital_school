import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing direct Appwrite file upload with alternative method...');
    
    const formData = await req.formData();
    const file = formData.get("image");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Initialize Appwrite client directly
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68aa7b51002070dd9a73');

    const storage = new Storage(client);
    const bucketId = 'exam-images';

    console.log('📋 Uploading to bucket:', bucketId);

    // Convert file to Buffer first
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('✅ File converted to Buffer, size:', buffer.length);

    // Try to upload using the raw buffer
    try {
      const uploadedFile = await storage.createFile(
        bucketId,
        ID.unique(),
        buffer
      );

      console.log('✅ Upload successful:', uploadedFile);

      // Get file details
      const fileDetails = await storage.getFile(bucketId, uploadedFile.$id);
      const url = storage.getFileView(bucketId, uploadedFile.$id);

      return NextResponse.json({
        success: true,
        message: "File uploaded to Appwrite successfully!",
        uploadedFile: {
          fileId: uploadedFile.$id,
          url: url.toString(),
          filename: file.name,
          size: file.size,
          mimeType: fileDetails.mimeType,
          uploadedAt: new Date(uploadedFile.$createdAt)
        }
      });

    } catch (uploadError) {
      console.error('Direct upload failed:', uploadError);
      
      // Fallback: try to create a minimal file object
      const minimalFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        arrayBuffer: () => Promise.resolve(arrayBuffer)
      };

      console.log('🔄 Trying fallback method with minimal file object...');
      
      const uploadedFile = await storage.createFile(
        bucketId,
        ID.unique(),
        minimalFile
      );

      console.log('✅ Fallback upload successful:', uploadedFile);

      // Get file details
      const fileDetails = await storage.getFile(bucketId, uploadedFile.$id);
      const url = storage.getFileView(bucketId, uploadedFile.$id);

      return NextResponse.json({
        success: true,
        message: "File uploaded to Appwrite successfully using fallback method!",
        uploadedFile: {
          fileId: uploadedFile.$id,
          url: url.toString(),
          filename: file.name,
          size: file.size,
          mimeType: fileDetails.mimeType,
          uploadedAt: new Date(uploadedFile.$createdAt)
        }
      });
    }

  } catch (error) {
    console.error("Direct Appwrite upload test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to upload file to Appwrite",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 