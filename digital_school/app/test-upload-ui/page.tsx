"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestUploadUI() {
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

  const handleUpload = async () => {
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
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-800">
              🧪 Test Appwrite File Upload
            </CardTitle>
            <p className="text-gray-600">
              Test the Appwrite integration for exam image uploads
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

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? '📤 Uploading...' : '🚀 Upload to Appwrite'}
            </Button>

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
                  <div><strong>Name:</strong> {result.name}</div>
                  <div><strong>Size:</strong> {Math.round(result.size / 1024)} KB</div>
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
                <li>• File size should be less than 10MB</li>
                <li>• Click Upload to test Appwrite integration</li>
                <li>• Check console for detailed logs</li>
                <li>• Verify file appears in Appwrite console</li>
              </ul>
            </div>

            {/* Environment Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-gray-800 font-semibold mb-2">🔧 Environment Check</div>
              <div className="text-sm text-gray-700 space-y-1">
                <li>• Endpoint: {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅ Set' : '❌ Missing'}</li>
                <li>• Project ID: {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</li>
                <li>• API Key: {process.env.APPWRITE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
                <li>• Bucket: exam-images</li>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 