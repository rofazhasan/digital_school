"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Scan, 
  FileText, 
  Settings, 
  RotateCcw,
  Play,
  Loader2,
  BarChart3,
  QrCode,
  Grid3X3,
  Target,
  Zap,
  Shield,
  Brain
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

// OMR Scanner Components
import OMRScanner from './components/OMRScanner';
import ErrorReview from './components/ErrorReview';
import ProcessingQueue from './components/ProcessingQueue';
import ResultsViewer from './components/ResultsViewer';
import SettingsPanel from './components/SettingsPanel';

// Types
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
  metadata?: {
    examId?: string;
    setId?: string;
    studentId?: string;
    rollNumber?: string;
    setCode?: string;
    subjectCode?: string;
    registrationNo?: string;
  };
  results?: {
    mcqAnswers?: number[];
    rollNumber?: string;
    setCode?: string;
    subjectCode?: string;
    registrationNo?: string;
  };
  processingTime?: number;
  confidence?: number;
}

interface ProcessingSettings {
  // QR Detection
  qrEnabled: boolean;
  qrConfidence: number;
  
  // Grid Detection
  autoDetectGrid: boolean;
  minBubbleSize: number;
  maxBubbleSize: number;
  gridTolerance: number;
  
  // Bubble Classification
  classificationMethod: 'ml' | 'threshold' | 'hybrid';
  fillThreshold: number;
  mlModelPath?: string;
  
  // Image Processing
  preprocessing: {
    denoise: boolean;
    sharpen: boolean;
    contrast: number;
    brightness: number;
    skewCorrection: boolean;
    perspectiveCorrection: boolean;
  };
  
  // Performance
  useGPU: boolean;
  maxConcurrent: number;
  batchSize: number;
  
  // Error Handling
  autoCorrection: boolean;
  flagUncertain: boolean;
  minConfidence: number;
}

const defaultSettings: ProcessingSettings = {
  qrEnabled: true,
  qrConfidence: 0.8,
  autoDetectGrid: true,
  minBubbleSize: 12,
  maxBubbleSize: 30,
  gridTolerance: 0.1,
  classificationMethod: 'hybrid',
  fillThreshold: 0.6,
  preprocessing: {
    denoise: true,
    sharpen: true,
    contrast: 1.2,
    brightness: 1.1,
    skewCorrection: true,
    perspectiveCorrection: true,
  },
  useGPU: false,
  maxConcurrent: 4,
  batchSize: 10,
  autoCorrection: true,
  flagUncertain: true,
  minConfidence: 0.85,
};

export default function OMRScannerPage() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [settings, setSettings] = useState<ProcessingSettings>(defaultSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [processingStats, setProcessingStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    flagged: 0,
    averageTime: 0,
  });
  
  const { toast } = useToast();
  const scannerRef = useRef<React.ComponentRef<typeof OMRScanner>>(null);

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newResults: ScanResult[] = acceptedFiles.map((file, index) => ({
      id: `scan-${Date.now()}-${index}`,
      filename: file.name,
      status: 'pending',
      progress: 0,
    }));
    
    setScanResults(prev => [...prev, ...newResults]);
    toast({
      title: "Files Added",
      description: `${acceptedFiles.length} files added to processing queue.`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
    },
    multiple: true,
  });

  // Start processing
  const startProcessing = async () => {
    if (scanResults.length === 0) {
      toast({
        title: "No Files",
        description: "Please add files to process first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStats(prev => ({ ...prev, total: scanResults.length }));

    try {
      // Process files in batches
      const batchSize = settings.batchSize;
      const batches = [];
      
      for (let i = 0; i < scanResults.length; i += batchSize) {
        batches.push(scanResults.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (result) => {
            await processSingleFile(result);
          })
        );
      }

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${scanResults.length} files.`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred during processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process a single file
  const processSingleFile = async (result: ScanResult) => {
    const startTime = Date.now();
    
    try {
      // Update status to processing
      setScanResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, status: 'processing', progress: 10 } : r)
      );

      // Step 1: QR Detection (if enabled)
      if (settings.qrEnabled) {
        setScanResults(prev => 
          prev.map(r => r.id === result.id ? { ...r, progress: 30 } : r)
        );
        // QR detection logic will be implemented in QRDetector component
      }

      // Step 2: Grid Detection
      setScanResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, progress: 50 } : r)
      );
      // Grid detection logic will be implemented in GridDetector component

      // Step 3: Bubble Classification
      setScanResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, progress: 80 } : r)
      );
      // Bubble classification logic will be implemented in BubbleClassifier component

      // Step 4: Results Compilation
      setScanResults(prev => 
        prev.map(r => r.id === result.id ? { 
          ...r, 
          status: 'completed', 
          progress: 100,
          processingTime: Date.now() - startTime,
          confidence: 0.95, // This will be calculated based on actual results
        } : r)
      );

      // Update stats
      setProcessingStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        averageTime: (prev.averageTime * (prev.completed) + (Date.now() - startTime)) / (prev.completed + 1),
      }));

    } catch (error) {
      console.error(`Error processing ${result.filename}:`, error);
      setScanResults(prev => 
        prev.map(r => r.id === result.id ? { 
          ...r, 
          status: 'error', 
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        } : r)
      );
      
      setProcessingStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
    }
  };

  // Export results
  const exportResults = (format: 'json' | 'excel' | 'pdf') => {
    const completedResults = scanResults.filter(r => r.status === 'completed');
    
    if (completedResults.length === 0) {
      toast({
        title: "No Results",
        description: "No completed results to export.",
        variant: "destructive",
      });
      return;
    }

    // Export logic will be implemented
    toast({
      title: "Export Started",
      description: `Exporting ${completedResults.length} results as ${format.toUpperCase()}.`,
    });
  };

  // Clear all results
  const clearResults = () => {
    setScanResults([]);
    setProcessingStats({
      total: 0,
      completed: 0,
      errors: 0,
      flagged: 0,
      averageTime: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Universal OMR Scanner
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Advanced template-free OMR processing with QR integration, dynamic grid detection, 
              and high-accuracy bubble classification powered by machine learning.
            </p>
          </motion.div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
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

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Scanner */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Universal OMR Scanner
                    </CardTitle>
                    <CardDescription>
                      Upload images, PDFs, or ZIP files for processing. Supports any bubble layout.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OMRScanner
                      ref={scannerRef}
                      settings={settings}
                      onFileProcessed={(result) => {
                        setScanResults(prev => [...prev, result]);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Processing Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processing Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Files</p>
                        <p className="text-2xl font-bold">{processingStats.total}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{processingStats.completed}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Errors</p>
                        <p className="text-2xl font-bold text-red-600">{processingStats.errors}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Flagged</p>
                        <p className="text-2xl font-bold text-yellow-600">{processingStats.flagged}</p>
                      </div>
                    </div>
                    
                    {processingStats.averageTime > 0 && (
                      <div>
                        <p className="text-gray-500 text-sm">Avg. Processing Time</p>
                        <p className="text-lg font-semibold">
                          {(processingStats.averageTime / 1000).toFixed(1)}s
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={startProcessing}
                      disabled={isProcessing || scanResults.length === 0}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Processing
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={clearResults}
                      disabled={scanResults.length === 0}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <ProcessingQueue 
              results={scanResults}
              onResultUpdate={(updatedResult) => {
                setScanResults(prev => 
                  prev.map(r => r.id === updatedResult.id ? updatedResult : r)
                );
              }}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <ResultsViewer 
              results={scanResults.filter(r => r.status === 'completed')}
              onExport={exportResults}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsPanel 
              settings={settings}
              onSettingsChange={setSettings}
            />
          </TabsContent>
        </Tabs>

        {/* Error Review Modal */}
        <ErrorReview 
          results={scanResults.filter(r => r.status === 'flagged' || r.status === 'error')}
          onResultUpdate={(updatedResult: ScanResult) => {
            setScanResults(prev => 
              prev.map(r => r.id === updatedResult.id ? updatedResult : r)
            );
          }}
        />
      </div>
    </div>
  );
}
