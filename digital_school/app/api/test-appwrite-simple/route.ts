import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from 'appwrite';

export async function GET() {
  try {
    console.log('🧪 Testing basic Appwrite connection...');
    
    // Check environment variables
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    console.log('📋 Environment check:', {
      hasEndpoint: !!endpoint,
      hasProjectId: !!projectId,
      hasApiKey: !!apiKey
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
    
    console.log('✅ Appwrite client initialized successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Appwrite connection successful',
      environment: {
        endpoint: endpoint ? 'Set' : 'Missing',
        projectId: projectId ? 'Set' : 'Missing',
        apiKey: apiKey ? 'Set' : 'Missing'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Appwrite test error:', error);
    return NextResponse.json({ 
      error: 'Appwrite test failed',
      details: error.message 
    }, { status: 500 });
  }
} 