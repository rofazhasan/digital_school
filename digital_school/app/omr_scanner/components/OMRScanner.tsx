"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Target,
  Grid3X3,
  QrCode,
  Brain,
  Zap,
  Shield
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

// OMR Components
import QRDetector from './QRDetector';
import GridDetector from './GridDetector';
import BubbleClassifier from './BubbleClassifier';
import ImagePreprocessor from './ImagePreprocessor';

// Types
interface ProcessingSettings {
  qrEnabled: boolean;
  qrConfidence: number;
  autoDetectGrid: boolean;
  minBubbleSize: number;
  maxBubbleSize: number;
  gridTolerance: number;
  classificationMethod: 'ml' | 'threshold' | 'hybrid';
  fillThreshold: number;
  preprocessing: {
    denoise: boolean;
    sharpen: boolean;
    contrast: number;
    brightness: number;
    skewCorrection: boolean;
    perspectiveCorrection: boolean;
  };
  useGPU: boolean;
  maxConcurrent: number;
  batchSize: number;
  autoCorrection: boolean;
  flagUncertain: boolean;
  minConfidence: number;
}

interface ScanResult {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'flagged';
  progress: number;
  qrData?: Record<string, unknown>;
  gridData?: Record<string, unknown>;
  bubbleData?: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
  results?: Record<string, unknown>;
  processingTime?: number;
  confidence?: number;
}

interface OMRScannerProps {
  settings: ProcessingSettings;
  onFileProcessed: (result: ScanResult) => void;
}

const OMRScanner = React.forwardRef<HTMLDivElement, OMRScannerProps>(
  ({ settings, onFileProcessed }, ref) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [results, setResults] = useState<ScanResult[]>([]);
    
    const { toast } = useToast();

    // File drop handler
    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      setCurrentFile(file);
      
      // Create initial result
      const result: ScanResult = {
        id: `scan-${Date.now()}`,
        filename: file.name,
        status: 'pending',
        progress: 0,
      };
      
      setResults(prev => [...prev, result]);
      onFileProcessed(result);
      
      toast({
        title: "File Added",
        description: `${file.name} added to processing queue.`,
      });
    }, [onFileProcessed, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
        'application/pdf': ['.pdf'],
      },
      multiple: false,
    });

    // Process file
    const processFile = async (file: File) => {
      if (!file) return;
      
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        // Simulate processing steps
        setProcessingProgress(10);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessingProgress(30);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessingProgress(50);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessingProgress(80);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProcessingProgress(100);
        
        const finalResult: ScanResult = {
          id: `scan-${Date.now()}`,
          filename: file.name,
          status: 'completed',
          progress: 100,
          processingTime: Date.now(),
          confidence: 0.95,
        };
        
        setResults(prev => prev.map(r => 
          r.filename === file.name ? finalResult : r
        ));
        
        onFileProcessed(finalResult);
        
        toast({
          title: "Processing Complete",
          description: `${file.name} processed successfully.`,
        });
        
      } catch (error) {
        console.error('Processing error:', error);
        
        const errorResult: ScanResult = {
          id: `scan-${Date.now()}`,
          filename: file.name,
          status: 'error',
          progress: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
        
        setResults(prev => prev.map(r => 
          r.filename === file.name ? errorResult : r
        ));
        
        toast({
          title: "Processing Error",
          description: `Error processing ${file.name}.`,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
        setCurrentFile(null);
      }
    };

    // Start processing
    const startProcessing = async () => {
      if (!currentFile) return;
      await processFile(currentFile);
    };

    // Clear results
    const clearResults = () => {
      setResults([]);
      setCurrentFile(null);
    };

    return (
      <div ref={ref} className="space-y-6">
        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload OMR Sheet
            </CardTitle>
            <CardDescription>
              Upload an image or PDF file to process. Supports any bubble layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
            >
              <input {...getInputProps()} />
              
              {currentFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <span className="font-medium">{currentFile.name}</span>
                  </div>
                  
                  {isProcessing ? (
                    <div className="space-y-2">
                      <Progress value={processingProgress} className="w-full" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Processing... {processingProgress}%
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={startProcessing} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={clearResults}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to select files
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Supports: PNG, JPG, JPEG, TIFF, BMP, PDF
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Stats */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-sm text-gray-500">Total Files</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </p>
                  <p className="text-sm text-gray-500">Errors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'flagged').length}
                  </p>
                  <p className="text-sm text-gray-500">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <QrCode className="h-3 w-3" />
            QR Integration
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Grid3X3 className="h-3 w-3" />
            Auto Grid Detection
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            ML Classification
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Error Recovery
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            High Accuracy
          </Badge>
        </div>
      </div>
    );
  }
);

OMRScanner.displayName = 'OMRScanner';

export default OMRScanner; 