"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Eye, 
  RotateCcw,
  Download,
  AlertCircle,
  Info
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

interface ErrorReviewProps {
  results: ScanResult[];
  onResultUpdate: (result: ScanResult) => void;
}

export default function ErrorReview({ results, onResultUpdate }: ErrorReviewProps) {
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

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

  const handleManualCorrection = (result: ScanResult) => {
    // This would open a manual correction interface
    toast({
      title: "Manual Correction",
      description: "Manual correction interface would open here.",
    });
  };

  const handleExportIssues = () => {
    const issuesData = {
      timestamp: new Date().toISOString(),
      issues: results.map(r => ({
        filename: r.filename,
        status: r.status,
        errors: r.errors,
        warnings: r.warnings,
        confidence: r.confidence,
      }))
    };
    
    const blob = new Blob([JSON.stringify(issuesData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omr-issues-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Issues Exported",
      description: "Issues report exported successfully.",
    });
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <>
      {/* Issues Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Issues Review ({results.length})
          </CardTitle>
          <CardDescription>
            Review and resolve processing issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    
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
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedResult(result);
                        setShowModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(result)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualCorrection(result)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleExportIssues}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Issues Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <AnimatePresence>
        {showModal && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
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
                  <h3 className="text-lg font-semibold">Issue Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(false)}
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
    </>
  );
} 