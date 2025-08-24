import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing direct Appwrite file upload...');
    
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

    // Initialize Appwrite client directly
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68aa7b51002070dd9a73');

    const storage = new Storage(client);
    const bucketId = 'exam-images';

    console.log('📋 Uploading to bucket:', bucketId);

    // Upload the file directly - Appwrite SDK should handle FormData files
    try {
      const uploadedFile = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );

      console.log('✅ Direct upload successful:', uploadedFile);

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
          mimeType: fileDetails.mimeType || file.type,
          uploadedAt: new Date(uploadedFile.$createdAt)
        }
      });

    } catch (uploadError) {
      console.error('Direct upload failed:', uploadError);
      
      // If direct upload fails, try converting to a proper File object
      try {
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        const newFile = new File([blob], file.name, { type: file.type });
        
        console.log('🔄 Trying with converted File object...');
        
        const uploadedFile = await storage.createFile(
          bucketId,
          ID.unique(),
          newFile
        );

        console.log('✅ Converted File upload successful:', uploadedFile);

        // Get file details
        const fileDetails = await storage.getFile(bucketId, uploadedFile.$id);
        const url = storage.getFileView(bucketId, uploadedFile.$id);

        return NextResponse.json({
          success: true,
          message: "File uploaded to Appwrite successfully using converted File!",
          uploadedFile: {
            fileId: uploadedFile.$id,
            url: url.toString(),
            filename: file.name,
            size: file.size,
            mimeType: fileDetails.mimeType || file.type,
            uploadedAt: new Date(uploadedFile.$createdAt)
          }
        });
        
      } catch (conversionError) {
        console.error('Converted File upload also failed:', conversionError);
        throw new Error(`Both upload methods failed. Direct: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}, Converted: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }
    }

  } catch (error) {
    console.error("Direct Appwrite upload test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to upload file to Appwrite",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 