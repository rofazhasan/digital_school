"use client";

import React, { useState } from 'react';
import { Client, Storage, ID } from 'appwrite';

export default function TestUploadUIPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      console.log('🧪 Testing client-side Appwrite upload...');
      
      // Initialize Appwrite client
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

      // Upload file to Appwrite
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

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 Appwrite File Upload Test
          </h1>
          
          <div className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.txt,.pdf"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? '🔄 Uploading...' : '🚀 Upload to Appwrite'}
            </button>

            {/* Results */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  ✅ Upload Successful!
                </h3>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>File ID:</strong> {result.fileId}</p>
                  <p><strong>Filename:</strong> {result.filename}</p>
                  <p><strong>Size:</strong> {(result.size / 1024).toFixed(2)} KB</p>
                  <p><strong>MIME Type:</strong> {result.mimeType}</p>
                  <p><strong>Uploaded:</strong> {new Date(result.uploadedAt).toLocaleString()}</p>
                  <p><strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">{result.url}</a></p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  ❌ Upload Failed
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                📋 Test Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                <li>Select a test file (image, text, or PDF)</li>
                <li>Click the upload button</li>
                <li>Check the results below</li>
                <li>Verify the file appears in your Appwrite console</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 