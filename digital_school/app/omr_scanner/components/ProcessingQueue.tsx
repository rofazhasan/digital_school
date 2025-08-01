"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  RotateCcw,
  Eye,
  Pause,
  Play,
  Square,
  Loader2,
  BarChart3,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

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

interface ProcessingQueueProps {
  results: ScanResult[];
  onResultUpdate: (result: ScanResult) => void;
}

export default function ProcessingQueue({ results, onResultUpdate }: ProcessingQueueProps) {
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const pendingResults = results.filter(r => r.status === 'pending');
  const processingResults = results.filter(r => r.status === 'processing');
  const completedResults = results.filter(r => r.status === 'completed');
  const errorResults = results.filter(r => r.status === 'error');
  const flaggedResults = results.filter(r => r.status === 'flagged');

  const handleRetry = (result: ScanResult) => {
    const updatedResult: ScanResult = {
      ...result,
      status: 'pending',
      progress: 0,
      errors: undefined,
      warnings: undefined,
    };
    
    onResultUpdate(updatedResult);
    
    toast({
      title: "Retry Started",
      description: `Retrying processing for ${result.filename}`,
    });
  };

  const handleRemove = (result: ScanResult) => {
    // This would typically remove from the parent state
    toast({
      title: "File Removed",
      description: `${result.filename} has been removed from the queue.`,
    });
  };

  const handleViewDetails = (result: ScanResult) => {
    setSelectedResult(result);
    setShowDetails(true);
  };

  const getStatusColor = (status: ScanResult['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'flagged':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusIcon = (status: ScanResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processing Queue
          </CardTitle>
          <CardDescription>
            Monitor and manage file processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {results.length} total files
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {completedResults.length} completed
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errorResults.length + flaggedResults.length} issues
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No files in queue
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Upload files to start processing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{result.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.status}
                        </Badge>
                        {result.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      
                      {result.status === 'processing' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.progress}%` }}
                          />
                        </div>
                      )}
                      
                      {result.errors && result.errors.length > 0 && (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {result.errors[0]}
                          {result.errors.length > 1 && ` (+${result.errors.length - 1} more)`}
                        </div>
                      )}
                      
                      {result.warnings && result.warnings.length > 0 && (
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          {result.warnings[0]}
                          {result.warnings.length > 1 && ` (+${result.warnings.length - 1} more)`}
                        </div>
                      )}
                      
                      {result.processingTime && (
                        <div className="text-xs text-gray-500">
                          Processing time: {(result.processingTime / 1000).toFixed(1)}s
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(result)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {(result.status === 'error' || result.status === 'flagged') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(result)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(result)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{pendingResults.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{processingResults.length}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedResults.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorResults.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{flaggedResults.length}</div>
                <div className="text-sm text-gray-600">Flagged</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">File Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Filename:</span>
                    <p className="text-sm text-gray-600">{selectedResult.filename}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedResult.status}
                    </Badge>
                  </div>
                  
                  {selectedResult.progress > 0 && (
                    <div>
                      <span className="font-medium">Progress:</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedResult.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{selectedResult.progress}%</span>
                    </div>
                  )}
                  
                  {selectedResult.processingTime && (
                    <div>
                      <span className="font-medium">Processing Time:</span>
                      <p className="text-sm text-gray-600">
                        {(selectedResult.processingTime / 1000).toFixed(1)} seconds
                      </p>
                    </div>
                  )}
                  
                  {selectedResult.confidence && (
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <p className="text-sm text-gray-600">
                        {Math.round(selectedResult.confidence * 100)}%
                      </p>
                    </div>
                  )}
                  
                  {selectedResult.errors && selectedResult.errors.length > 0 && (
                    <div>
                      <span className="font-medium">Errors:</span>
                      <div className="space-y-1 mt-1">
                        {selectedResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.warnings && selectedResult.warnings.length > 0 && (
                    <div>
                      <span className="font-medium">Warnings:</span>
                      <div className="space-y-1 mt-1">
                        {selectedResult.warnings.map((warning, index) => (
                          <Alert key={index} variant="default">
                            <AlertDescription>{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 