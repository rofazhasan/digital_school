"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, File, Folder, X, Download, Eye, Trash2, Cloud, HardDrive } from 'lucide-react';

declare global {
  interface Window {
    puter: any;
  }
}

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

interface PuterFileUploadProps {
  onFileSelect?: (files: PuterFile[]) => void;
  onFileUpload?: (files: PuterFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  title?: string;
  description?: string;
  showFileList?: boolean;
  storageType?: 'cloud' | 'local';
}

export function PuterFileUpload({
  onFileSelect,
  onFileUpload,
  multiple = true,
  accept = '*',
  maxSize,
  className = '',
  title = 'Upload Files',
  description = 'Select files from your computer or cloud storage',
  showFileList = true,
  storageType = 'cloud'
}: PuterFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<PuterFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<PuterFile[]>([]);
  const [puterReady, setPuterReady] = useState(false);
  const { toast } = useToast();

  // Check if Puter is available
  useEffect(() => {
    const checkPuter = () => {
      if (typeof window !== 'undefined' && window.puter) {
        setPuterReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkPuter, 100);
      }
    };
    checkPuter();
  }, []);

  const handleFileSelect = useCallback(async () => {
    if (!puterReady) {
      toast({
        title: "Puter not ready",
        description: "Please wait for Puter to initialize",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use Puter's file picker
      const files = await window.puter.ui.chooseFiles({
        multiple,
        accept,
        startIn: storageType === 'cloud' ? 'cloud' : 'local'
      });

      if (files && files.length > 0) {
        const validFiles = files.filter((file: PuterFile) => {
          if (maxSize && file.size > maxSize) {
            toast({
              title: "File too large",
              description: `${file.name} exceeds the maximum size limit`,
              variant: "destructive"
            });
            return false;
          }
          return true;
        });

        setSelectedFiles(validFiles);
        onFileSelect?.(validFiles);
        
        toast({
          title: "Files selected",
          description: `${validFiles.length} file(s) selected successfully`
        });
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      toast({
        title: "Error",
        description: "Failed to select files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [puterReady, multiple, accept, maxSize, onFileSelect, storageType, toast]);

  const handleFileUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      const uploaded: PuterFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          // Upload to Puter cloud storage
          const uploadedFile = await window.puter.fs.upload(file);
          uploaded.push(uploadedFile);
          
          // Update progress
          const progress = ((i + 1) / selectedFiles.length) * 100;
          setUploadProgress(progress);
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        }
      }

      setUploadedFiles(prev => [...prev, ...uploaded]);
      onFileUpload?.(uploaded);
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${uploaded.length} file(s)`
      });

      // Clear selected files after successful upload
      setSelectedFiles([]);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error during upload:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles, onFileUpload, toast]);

  const handleFilePreview = useCallback(async (file: PuterFile) => {
    try {
      if (file.isDirectory) {
        // Open directory in Puter
        await window.puter.ui.openDirectory(file.path);
      } else {
        // Open file in Puter
        await window.puter.ui.openFile(file.path);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast({
        title: "Preview failed",
        description: "Unable to preview this file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleFileDownload = useCallback(async (file: PuterFile) => {
    try {
      await window.puter.fs.download(file);
      toast({
        title: "Download started",
        description: `${file.name} is being downloaded`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Unable to download this file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleFileDelete = useCallback(async (file: PuterFile) => {
    try {
      await window.puter.fs.delete(file.path);
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: "File deleted",
        description: `${file.name} has been deleted`
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete this file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const removeSelectedFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!puterReady) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Initializing Puter...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Files will be stored in your {storageType === 'cloud' ? 'cloud storage' : 'local storage'}
            </p>
            <Button 
              onClick={handleFileSelect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Selecting...' : 'Choose Files'}
            </Button>
          </div>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleFileUpload}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Uploading...' : 'Upload to Cloud'}
              </Button>
            </div>
          )}

          {/* Uploaded Files List */}
          {showFileList && uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.isDirectory ? (
                        <Folder className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <File className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.isDirectory ? 'Folder' : 'File'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilePreview(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 