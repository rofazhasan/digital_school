"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  FileText, 
  CheckCircle, 
  X, 
  Eye,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  FileSpreadsheet,
  FileImage,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence } from 'framer-motion';

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

interface ResultsViewerProps {
  results: ScanResult[];
  onExport: (format: 'json' | 'excel' | 'pdf') => void;
}

export default function ResultsViewer({ results, onExport }: ResultsViewerProps) {
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'filename' | 'confidence' | 'processingTime'>('filename');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  const filteredResults = results.filter(result => 
    result.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.metadata?.examId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.metadata?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aValue: string | number | undefined;
    let bValue: string | number | undefined;

    switch (sortBy) {
      case 'filename':
        aValue = a.filename;
        bValue = b.filename;
        break;
      case 'confidence':
        aValue = a.confidence || 0;
        bValue = b.confidence || 0;
        break;
      case 'processingTime':
        aValue = a.processingTime || 0;
        bValue = b.processingTime || 0;
        break;
      default:
        aValue = a.filename;
        bValue = b.filename;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExport = (format: 'json' | 'excel' | 'pdf') => {
    onExport(format);
  };

  const handleViewDetails = (result: ScanResult) => {
    setSelectedResult(result);
    setShowDetails(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Results Viewer
          </CardTitle>
          <CardDescription>
            View and export completed processing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {results.length} completed results
              </Badge>
              {results.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {Math.round(results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length * 100)}% avg confidence
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
              >
                <Printer className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename, exam ID, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'filename' | 'confidence' | 'processingTime')}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="filename">Filename</option>
                <option value="confidence">Confidence</option>
                <option value="processingTime">Processing Time</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No completed results
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Process some files to see results here
              </p>
            </CardContent>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Try adjusting your search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedResults.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{result.filename}</span>
                        {result.confidence && (
                          <Badge className={`text-xs ${getConfidenceBadge(result.confidence)}`}>
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        {result.metadata?.examId && (
                          <div>
                            <span className="font-medium">Exam ID:</span> {result.metadata.examId}
                          </div>
                        )}
                        {result.metadata?.studentId && (
                          <div>
                            <span className="font-medium">Student ID:</span> {result.metadata.studentId}
                          </div>
                        )}
                        {result.metadata?.setCode && (
                          <div>
                            <span className="font-medium">Set Code:</span> {result.metadata.setCode}
                          </div>
                        )}
                        {result.processingTime && (
                          <div>
                            <span className="font-medium">Time:</span> {(result.processingTime / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                      
                      {result.results?.mcqAnswers && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">MCQ Answers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.results.mcqAnswers.slice(0, 10).map((answer, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                Q{index + 1}: {answer === -1 ? 'No Answer' : `Option ${answer + 1}`}
                              </Badge>
                            ))}
                            {result.results.mcqAnswers.length > 10 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.results.mcqAnswers.length - 10} more
                              </Badge>
                            )}
                          </div>
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
            <CardTitle className="text-lg">Results Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor(results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length)}`}>
                  {Math.round(results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => (r.confidence || 0) >= 0.9).length}
                </div>
                <div className="text-sm text-gray-600">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length / 1000 * 10) / 10}s
                </div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Result Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* File Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">File Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
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
                            <p className={`text-sm ${getConfidenceColor(selectedResult.confidence)}`}>
                              {Math.round(selectedResult.confidence * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  {selectedResult.metadata && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedResult.metadata.examId && (
                            <div>
                              <span className="font-medium">Exam ID:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.examId}</p>
                            </div>
                          )}
                          {selectedResult.metadata.studentId && (
                            <div>
                              <span className="font-medium">Student ID:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.studentId}</p>
                            </div>
                          )}
                          {selectedResult.metadata.setId && (
                            <div>
                              <span className="font-medium">Set ID:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.setId}</p>
                            </div>
                          )}
                          {selectedResult.metadata.rollNumber && (
                            <div>
                              <span className="font-medium">Roll Number:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.rollNumber}</p>
                            </div>
                          )}
                          {selectedResult.metadata.setCode && (
                            <div>
                              <span className="font-medium">Set Code:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.setCode}</p>
                            </div>
                          )}
                          {selectedResult.metadata.subjectCode && (
                            <div>
                              <span className="font-medium">Subject Code:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.subjectCode}</p>
                            </div>
                          )}
                          {selectedResult.metadata.registrationNo && (
                            <div>
                              <span className="font-medium">Registration No:</span>
                              <p className="text-sm text-gray-600">{selectedResult.metadata.registrationNo}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Results */}
                  {selectedResult.results && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Processing Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedResult.results.rollNumber && (
                            <div>
                              <span className="font-medium">Roll Number:</span>
                              <p className="text-sm text-gray-600">{selectedResult.results.rollNumber}</p>
                            </div>
                          )}
                          {selectedResult.results.setCode && (
                            <div>
                              <span className="font-medium">Set Code:</span>
                              <p className="text-sm text-gray-600">{selectedResult.results.setCode}</p>
                            </div>
                          )}
                          {selectedResult.results.subjectCode && (
                            <div>
                              <span className="font-medium">Subject Code:</span>
                              <p className="text-sm text-gray-600">{selectedResult.results.subjectCode}</p>
                            </div>
                          )}
                          {selectedResult.results.registrationNo && (
                            <div>
                              <span className="font-medium">Registration No:</span>
                              <p className="text-sm text-gray-600">{selectedResult.results.registrationNo}</p>
                            </div>
                          )}
                          
                          {selectedResult.results.mcqAnswers && (
                            <div>
                              <span className="font-medium">MCQ Answers:</span>
                              <div className="grid grid-cols-5 gap-2 mt-2">
                                {selectedResult.results.mcqAnswers.map((answer, index) => (
                                  <Badge 
                                    key={index} 
                                    variant={answer === -1 ? "outline" : "default"}
                                    className="text-xs"
                                  >
                                    Q{index + 1}: {answer === -1 ? 'No Answer' : `Option ${answer + 1}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Raw Data */}
                  {(selectedResult.qrData || selectedResult.gridData || selectedResult.bubbleData) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Raw Processing Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedResult.qrData && (
                            <div>
                              <span className="font-medium">QR Data:</span>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(selectedResult.qrData, null, 2)}
                              </pre>
                            </div>
                          )}
                          {selectedResult.gridData && (
                            <div>
                              <span className="font-medium">Grid Data:</span>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(selectedResult.gridData, null, 2)}
                              </pre>
                            </div>
                          )}
                          {selectedResult.bubbleData && (
                            <div>
                              <span className="font-medium">Bubble Data:</span>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(selectedResult.bubbleData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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