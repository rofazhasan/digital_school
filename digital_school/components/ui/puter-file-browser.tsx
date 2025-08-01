"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  File, 
  Folder, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Copy, 
  Move, 
  Plus,
  ArrowLeft,
  RefreshCw,
  Grid,
  List,
  HardDrive,
  Cloud
} from 'lucide-react';

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

interface PuterFileBrowserProps {
  onFileSelect?: (file: PuterFile) => void;
  onFileOpen?: (file: PuterFile) => void;
  className?: string;
  title?: string;
  description?: string;
  viewMode?: 'grid' | 'list';
  storageType?: 'cloud' | 'local';
  showToolbar?: boolean;
}

export function PuterFileBrowser({
  onFileSelect,
  onFileOpen,
  className = '',
  title = 'File Browser',
  description = 'Browse and manage your files',
  viewMode = 'grid',
  storageType = 'cloud',
  showToolbar = true
}: PuterFileBrowserProps) {
  const [files, setFiles] = useState<PuterFile[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [puterReady, setPuterReady] = useState(false);
  const [viewModeState, setViewModeState] = useState<'grid' | 'list'>(viewMode);
  const { toast } = useToast();

  // Check if Puter is available
  useEffect(() => {
    const checkPuter = () => {
      if (typeof window !== 'undefined' && window.puter) {
        setPuterReady(true);
      } else {
        setTimeout(checkPuter, 100);
      }
    };
    checkPuter();
  }, []);

  // Load files from current path
  const loadFiles = useCallback(async (path: string = currentPath) => {
    if (!puterReady) return;

    try {
      setIsLoading(true);
      const items = await window.puter.fs.list(path);
      setFiles(items);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [puterReady, currentPath, toast]);

  // Load files when Puter is ready or path changes
  useEffect(() => {
    if (puterReady) {
      loadFiles();
    }
  }, [puterReady, currentPath, loadFiles]);

  const handleFileClick = useCallback((file: PuterFile) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      setSelectedFiles(new Set());
    } else {
      onFileOpen?.(file);
    }
  }, [onFileOpen]);

  const handleFileSelect = useCallback((fileId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
        return newSet;
      });
    } else {
      setSelectedFiles(new Set([fileId]));
    }
  }, []);

  const handleNavigateUp = useCallback(() => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
    setCurrentPath(newPath);
  }, [currentPath]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    try {
      setIsLoading(true);
      const results = await window.puter.fs.search(searchQuery);
      setFiles(results);
    } catch (error) {
      console.error('Error searching files:', error);
      toast({
        title: "Search failed",
        description: "Unable to search files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, loadFiles, toast]);

  const handleUpload = useCallback(async () => {
    try {
      const uploadedFiles = await window.puter.ui.chooseFiles({
        multiple: true,
        startIn: storageType === 'cloud' ? 'cloud' : 'local'
      });
      
      if (uploadedFiles && uploadedFiles.length > 0) {
        // Upload files to current directory
        for (const file of uploadedFiles) {
          await window.puter.fs.upload(file, currentPath);
        }
        
        toast({
          title: "Upload complete",
          description: `Uploaded ${uploadedFiles.length} file(s)`
        });
        
        loadFiles(); // Refresh file list
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  }, [currentPath, storageType, loadFiles, toast]);

  const handleCreateFolder = useCallback(async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
      await window.puter.fs.createDirectory(newPath);
      
      toast({
        title: "Folder created",
        description: `Created folder: ${folderName}`
      });
      
      loadFiles(); // Refresh file list
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  }, [currentPath, loadFiles, toast]);

  const handleDeleteFiles = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedFiles.size} item(s)?`);
    if (!confirmed) return;

    try {
      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId);
        if (file) {
          await window.puter.fs.delete(file.path);
        }
      }
      
      toast({
        title: "Files deleted",
        description: `Deleted ${selectedFiles.size} item(s)`
      });
      
      setSelectedFiles(new Set());
      loadFiles(); // Refresh file list
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete files",
        variant: "destructive"
      });
    }
  }, [selectedFiles, files, loadFiles, toast]);

  const handleDownloadFiles = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    try {
      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId);
        if (file && !file.isDirectory) {
          await window.puter.fs.download(file);
        }
      }
      
      toast({
        title: "Download started",
        description: `Downloading ${selectedFiles.size} file(s)`
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: "Download failed",
        description: "Failed to download files",
        variant: "destructive"
      });
    }
  }, [selectedFiles, files, toast]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {/* Toolbar */}
          {showToolbar && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateUp}
                  disabled={currentPath === '/'}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFiles()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewModeState(prev => prev === 'grid' ? 'list' : 'grid')}
                >
                  {viewModeState === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateFolder}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Path:</span>
            {currentPath.split('/').map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                <span className={index === currentPath.split('/').length - 1 ? 'font-medium' : ''}>
                  {part || 'root'}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedFiles.size} item(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFiles}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteFiles}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {/* Files Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found</p>
            </div>
          ) : (
            <div className={viewModeState === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`
                    ${viewModeState === 'grid' 
                      ? 'p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors' 
                      : 'flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
                    }
                    ${selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                  onClick={() => handleFileClick(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleFileSelect(file.id, true);
                  }}
                >
                  {viewModeState === 'grid' ? (
                    <div className="text-center">
                      {file.isDirectory ? (
                        <Folder className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                      ) : (
                        <File className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                      )}
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.isDirectory ? 'Folder' : formatFileSize(file.size)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        {file.isDirectory ? (
                          <Folder className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <File className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.isDirectory ? 'Folder' : formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(file.modifiedAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file.id, true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 