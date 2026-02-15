import { NextRequest, NextResponse } from "next/server";
import '../../../lib/file-polyfill'; // Import File polyfill for server environment
import { Client, Storage, ID } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing direct Appwrite file upload...');
    
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

    // Create a proper file object that Appwrite SDK expects
    let fileToUpload: any;
    
    try {
      if (typeof File !== 'undefined' && file instanceof File) {
        // Browser environment - use as is
        fileToUpload = file;
      } else {
        // Server environment - create a file-like object
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Create a file-like object with the methods Appwrite expects
        fileToUpload = {
          name: file.name,
          size: file.size,
          type: file.type,
          arrayBuffer: () => Promise.resolve(arrayBuffer),
          stream: () => {
            const { Readable } = require('stream');
            return Readable.from(buffer);
          }
        };
        
        console.log('✅ File converted to file-like object for server-side processing');
      }
    } catch (e) {
      console.error('Failed to process file:', e);
      return NextResponse.json({ error: "Failed to process file" }, { status: 400 });
    }

    // Upload file directly to Appwrite
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      fileToUpload
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

  } catch (error) {
    console.error("Direct Appwrite upload test error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to upload file to Appwrite",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 