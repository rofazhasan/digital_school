"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Target, 
  Settings, 
  Eye, 
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface QRData {
  text: string;
  x: number;
  y: number;
  size: number;
  confidence: number;
  format: string;
  errorCorrection: string;
}

interface QRDetectionSettings {
  enabled: boolean;
  minConfidence: number;
  maxQRCodes: number;
  showOverlay: boolean;
  autoDecode: boolean;
}

interface QRDetectorProps {
  imageData: string;
  settings: QRDetectionSettings;
  onQRDetected: (qrData: Record<string, unknown>) => void;
  onSettingsChange: (settings: QRDetectionSettings) => void;
}

export default function QRDetector({ 
  imageData, 
  settings, 
  onQRDetected, 
  onSettingsChange 
}: QRDetectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedQRs, setDetectedQRs] = useState<QRData[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const detectQR = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Simulate QR detection processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock QR data
      const mockQRs: QRData[] = [
        {
          text: "EXAM:2024-001|STUDENT:12345|SET:A",
          x: 50,
          y: 30,
          size: 80,
          confidence: 0.95,
          format: "QR_CODE",
          errorCorrection: "M"
        },
        {
          text: "TIMESTAMP:2024-01-15T10:30:00Z",
          x: 80,
          y: 70,
          size: 60,
          confidence: 0.88,
          format: "QR_CODE",
          errorCorrection: "L"
        }
      ];
      
      setDetectedQRs(mockQRs);
      
      const qrData: Record<string, unknown> = {
        totalQRCodes: mockQRs.length,
        qrCodes: mockQRs,
        averageConfidence: mockQRs.reduce((sum, qr) => sum + qr.confidence, 0) / mockQRs.length,
        metadata: {
          processingTime: 2000,
          algorithm: 'zxing',
          minConfidence: settings.minConfidence,
        }
      };
      
      onQRDetected(qrData);
      
      toast({
        title: "QR Detection Complete",
        description: `Detected ${mockQRs.length} QR codes with ${Math.round(qrData.averageConfidence as number * 100)}% average confidence.`,
      });
      } catch (error) {
        console.error('QR detection error:', error);
      toast({
        title: "QR Detection Failed",
        description: "An error occurred during QR code detection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [settings, onQRDetected, toast]);

  const resetDetection = () => {
    setDetectedQRs([]);
    toast({
      title: "Detection Reset",
      description: "QR detection has been reset.",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportQRData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      qrCodes: detectedQRs,
      settings: settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-detection-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "QR Data Exported",
      description: "QR detection results exported successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Detection
          </CardTitle>
          <CardDescription>
            Detect and decode QR codes embedded in the OMR sheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {detectedQRs.length} QR codes detected
              </Badge>
              {detectedQRs.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {Math.round(detectedQRs.reduce((sum, qr) => sum + qr.confidence, 0) / detectedQRs.length * 100)}% avg confidence
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetDetection}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button
                onClick={detectQR}
                disabled={isProcessing || !imageData}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Detect QR Codes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Minimum Confidence</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.minConfidence}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      minConfidence: parseFloat(e.target.value)
                    })}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(settings.minConfidence * 100)}%
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Max QR Codes</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxQRCodes}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      maxQRCodes: parseInt(e.target.value)
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={settings.enabled}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      enabled: e.target.checked
                    })}
                    className="rounded"
                  />
                  <label htmlFor="enabled" className="text-sm">
                    Enable QR detection
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showOverlay"
                    checked={settings.showOverlay}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showOverlay: e.target.checked
                    })}
                    className="rounded"
                  />
                  <label htmlFor="showOverlay" className="text-sm">
                    Show overlay
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* QR Code Results */}
      {detectedQRs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detected QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detectedQRs.map((qr, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="font-medium">QR Code #{index + 1}</span>
                      <Badge variant="outline" className={`text-xs ${getConfidenceColor(qr.confidence)}`}>
                        {Math.round(qr.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {qr.format} • {qr.errorCorrection}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Content:</span>
                      <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded mt-1 font-mono text-xs break-all">
                        {qr.text}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <p>X: {Math.round(qr.x)}%, Y: {Math.round(qr.y)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <p>{Math.round(qr.size)}px</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <p>{qr.format}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportQRData}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {detectedQRs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detection Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{detectedQRs.length}</div>
                <div className="text-sm text-gray-600">Total QR Codes</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor(detectedQRs.reduce((sum, qr) => sum + qr.confidence, 0) / detectedQRs.length)}`}>
                  {Math.round(detectedQRs.reduce((sum, qr) => sum + qr.confidence, 0) / detectedQRs.length * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {detectedQRs.filter(qr => qr.confidence >= 0.9).length}
                </div>
                <div className="text-sm text-gray-600">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {detectedQRs.filter(qr => qr.format === 'QR_CODE').length}
                </div>
                <div className="text-sm text-gray-600">QR Format</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {!imageData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No image data available. Please upload an image first.
          </AlertDescription>
        </Alert>
      )}
      
      {detectedQRs.length === 0 && imageData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No QR codes detected yet. Click "Detect QR Codes" to analyze the image.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 