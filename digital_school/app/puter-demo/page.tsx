"use client";

import React, { useState } from 'react';
import { PuterFileUpload } from '@/components/ui/puter-file-upload';
import { PuterFileBrowser } from '@/components/ui/puter-file-browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Cloud, Upload, Folder, File, Download, Eye } from 'lucide-react';

interface PuterFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  path: string;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export default function PuterDemoPage() {
  const [selectedFiles, setSelectedFiles] = useState<PuterFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<PuterFile[]>([]);

  const handleFileSelect = (files: PuterFile[]) => {
    setSelectedFiles(files);
    console.log('Selected files:', files);
  };

  const handleFileUpload = (files: PuterFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Uploaded files:', files);
  };

  const handleFileOpen = (file: PuterFile) => {
    console.log('Opening file:', file);
    // You can implement custom file opening logic here
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Puter Integration Demo</h1>
        <p className="text-lg text-muted-foreground">
          Experience seamless file management with Puter's cloud storage
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            Cloud Storage
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Upload className="h-3 w-3" />
            File Upload
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            File Browser
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            File Browser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cloud Upload */}
            <PuterFileUpload
              title="Cloud Storage Upload"
              description="Upload files to your Puter cloud storage"
              storageType="cloud"
              onFileSelect={handleFileSelect}
              onFileUpload={handleFileUpload}
              multiple={true}
              accept="*"
              maxSize={100 * 1024 * 1024} // 100MB
            />

            {/* Local Upload */}
            <PuterFileUpload
              title="Local Storage Upload"
              description="Upload files to your local storage"
              storageType="local"
              onFileSelect={handleFileSelect}
              onFileUpload={handleFileUpload}
              multiple={true}
              accept="image/*,application/pdf"
              maxSize={50 * 1024 * 1024} // 50MB
            />
          </div>

          {/* Uploaded Files Summary */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Uploaded Files Summary
                </CardTitle>
                <CardDescription>
                  {uploadedFiles.length} files uploaded successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {file.isDirectory ? (
                        <Folder className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <File className="h-5 w-5 text-blue-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.isDirectory ? 'Folder' : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="browser" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cloud Browser */}
            <PuterFileBrowser
              title="Cloud Storage Browser"
              description="Browse and manage files in your cloud storage"
              storageType="cloud"
              viewMode="grid"
              showToolbar={true}
              onFileOpen={handleFileOpen}
            />

            {/* Local Browser */}
            <PuterFileBrowser
              title="Local Storage Browser"
              description="Browse and manage files in your local storage"
              storageType="local"
              viewMode="list"
              showToolbar={true}
              onFileOpen={handleFileOpen}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Puter Integration Features</CardTitle>
          <CardDescription>
            Discover what you can do with Puter in your digital school application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Cloud Storage</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Store files securely in the cloud with automatic sync and backup
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Easy Upload</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload files with progress tracking
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">File Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse, organize, and manage files with an intuitive interface
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Download & Share</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Download files or share them with others easily
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Preview Files</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Preview documents, images, and other files directly in the browser
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Multiple Formats</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Support for various file types including documents, images, and more
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>
            How to use Puter components in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Basic File Upload</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`<PuterFileUpload
  onFileSelect={handleFileSelect}
  onFileUpload={handleFileUpload}
  multiple={true}
  accept="image/*"
/>`}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">File Browser</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`<PuterFileBrowser
  onFileOpen={handleFileOpen}
  storageType="cloud"
  viewMode="grid"
/>`}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Custom Configuration</h4>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`<PuterFileUpload
  title="Upload Documents"
  description="Upload PDF and Word documents"
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  storageType="cloud"
  showFileList={true}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 