"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client, Storage, ID } from 'appwrite';

export default function TestClientUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleClientUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing client-side Appwrite upload...');
      
      // Initialize Appwrite client directly in browser
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68aa7b51002070dd9a73');
      
      const storage = new Storage(client);
      const bucketId = 'exam-images';
      
      console.log('📁 File to upload:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      console.log('📋 Uploading to bucket:', bucketId);
      
      // Upload file directly to Appwrite from browser
      const uploadedFile = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
      
      console.log('✅ Upload successful:', uploadedFile);
      
      // Get file details
      const fileDetails = await storage.getFile(bucketId, uploadedFile.$id);
      const url = storage.getFileView(bucketId, uploadedFile.$id);
      
      const uploadResult = {
        fileId: uploadedFile.$id,
        url: url.toString(),
        filename: file.name,
        size: file.size,
        mimeType: fileDetails.mimeType,
        uploadedAt: new Date(uploadedFile.$createdAt)
      };
      
      setResult(uploadResult);
      console.log('🎉 Upload completed successfully!', uploadResult);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleServerUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/test-appwrite-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-800">
              🧪 Test Appwrite File Upload - Client vs Server
            </CardTitle>
            <p className="text-gray-600">
              Compare client-side and server-side Appwrite integration
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file">Select Image File</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <div className="text-sm text-gray-600">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleClientUpload}
                disabled={!file || uploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploading ? '📤 Uploading...' : '🚀 Client-Side Upload'}
              </Button>
              
              <Button
                onClick={handleServerUpload}
                disabled={!file || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? '📤 Uploading...' : '⚙️ Server-Side Upload'}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">❌ Error</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-semibold">✅ Upload Successful!</div>
                <div className="space-y-2 text-sm text-green-700">
                  <div><strong>File ID:</strong> {result.fileId}</div>
                  <div><strong>Name:</strong> {result.name || result.filename}</div>
                  <div><strong>Size:</strong> {Math.round((result.size || 0) / 1024)} KB</div>
                  <div><strong>Type:</strong> {result.mimeType}</div>
                  <div><strong>URL:</strong> 
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-2"
                    >
                      View File
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-semibold mb-2">📋 Test Instructions</div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Select an image file (JPG, PNG, etc.)</li>
                <li>• Try Client-Side Upload first (direct browser to Appwrite)</li>
                <li>• Then try Server-Side Upload (through our API)</li>
                <li>• Compare the results and error messages</li>
                <li>• Check console for detailed logs</li>
              </ul>
            </div>

            {/* Environment Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-gray-800 font-semibold mb-2">🔧 Environment Check</div>
              <div className="text-sm text-gray-700 space-y-1">
                <li>• Endpoint: {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅ Set' : '❌ Missing'}</li>
                <li>• Project ID: {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</li>
                <li>• Bucket: exam-images</li>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 