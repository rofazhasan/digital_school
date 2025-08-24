import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing Appwrite file upload...');
    
    // Check environment variables
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const bucketId = 'exam-images';
    
    console.log('📋 Environment check:', {
      hasEndpoint: !!endpoint,
      hasProjectId: !!projectId,
      hasApiKey: !!apiKey,
      bucketId
    });
    
    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ 
        error: 'Missing Appwrite environment variables',
        details: { endpoint: !!endpoint, projectId: !!projectId, apiKey: !!apiKey }
      }, { status: 500 });
    }
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(apiKey);
    
    const storage = new Storage(client);
    
    console.log('✅ Appwrite client initialized');
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Convert to Buffer for server-side processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔄 Buffer created:', {
      size: buffer.length,
      isBuffer: Buffer.isBuffer(buffer)
    });
    
    // Test bucket access first
    try {
      console.log('🔍 Testing bucket access...');
      const buckets = await storage.listBuckets();
      console.log('📦 Available buckets:', buckets.buckets.map((b: any) => b.name));
      
      const examBucket = buckets.buckets.find((b: any) => b.name === bucketId);
      if (!examBucket) {
        return NextResponse.json({ 
          error: `Bucket '${bucketId}' not found. Available buckets: ${buckets.buckets.map((b: any) => b.name).join(', ')}` 
        }, { status: 404 });
      }
      
      console.log('✅ Bucket found:', examBucket.name);
    } catch (bucketError: any) {
      console.error('❌ Bucket access error:', bucketError);
      return NextResponse.json({ 
        error: 'Failed to access bucket',
        details: bucketError.message 
      }, { status: 500 });
    }
    
    // Upload file
    try {
      console.log('📤 Uploading file to Appwrite...');
      
      const uploadedFile = await storage.createFile(
        bucketId,
        ID.unique(),
        buffer
      );
      
      console.log('✅ File uploaded successfully:', {
        fileId: uploadedFile.$id,
        name: uploadedFile.name,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType
      });
      
      // Get file details
      const fileDetails = await storage.getFile(bucketId, uploadedFile.$id);
      const fileUrl = storage.getFileView(bucketId, uploadedFile.$id);
      
      return NextResponse.json({
        success: true,
        fileId: uploadedFile.$id,
        name: uploadedFile.name,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        url: fileUrl.toString(),
        createdAt: uploadedFile.$createdAt,
        details: fileDetails
      });
      
    } catch (uploadError: any) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message,
        code: uploadError.code
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 