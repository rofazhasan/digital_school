"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid3X3, 
  Target, 
  Settings, 
  Eye, 
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  confidence: number;
  isBubble: boolean;
  fillPercentage: number;
}

interface GridSettings {
  autoDetect: boolean;
  minBubbleSize: number;
  maxBubbleSize: number;
  tolerance: number;
  rows: number;
  columns: number;
  showGrid: boolean;
  showBubbles: boolean;
}

interface GridDetectorProps {
  imageData: string;
  settings: GridSettings;
  onGridDetected: (gridData: Record<string, unknown>) => void;
  onSettingsChange: (settings: GridSettings) => void;
}

export default function GridDetector({ 
  imageData, 
  settings, 
  onGridDetected, 
  onSettingsChange 
}: GridDetectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedGrid, setDetectedGrid] = useState<GridCell[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { toast } = useToast();

  const detectGrid = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Simulate grid detection processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock grid data
      const mockGrid: GridCell[] = [];
      const cellWidth = 100 / settings.columns;
      const cellHeight = 100 / settings.rows;
      
      for (let row = 0; row < settings.rows; row++) {
        for (let col = 0; col < settings.columns; col++) {
          const isBubble = Math.random() > 0.3; // 70% chance of being a bubble
          mockGrid.push({
            x: col * cellWidth,
            y: row * cellHeight,
            width: cellWidth,
            height: cellHeight,
            row,
            col,
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            isBubble,
            fillPercentage: isBubble ? Math.random() * 0.8 : 0, // 0-80% fill for bubbles
          });
        }
      }
      
      setDetectedGrid(mockGrid);
      
      const gridData: Record<string, unknown> = {
        rows: settings.rows,
        columns: settings.columns,
        cells: mockGrid,
        totalCells: mockGrid.length,
        bubbleCells: mockGrid.filter(cell => cell.isBubble).length,
        averageConfidence: mockGrid.reduce((sum, cell) => sum + cell.confidence, 0) / mockGrid.length,
        metadata: {
          processingTime: 3000,
          algorithm: 'contour_detection',
          tolerance: settings.tolerance,
        }
      };
      
      onGridDetected(gridData);
      
      toast({
        title: "Grid Detection Complete",
        description: `Detected ${gridData.totalCells} cells with ${gridData.bubbleCells} bubbles.`,
      });
    } catch (error) {
      console.error('Grid detection error:', error);
      toast({
        title: "Grid Detection Failed",
        description: "An error occurred during grid detection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [settings, onGridDetected, toast]);

  const resetDetection = () => {
    setDetectedGrid([]);
    toast({
      title: "Detection Reset",
      description: "Grid detection has been reset.",
    });
  };

  const getCellColor = (cell: GridCell) => {
    if (!cell.isBubble) return 'bg-gray-200 border-gray-300';
    if (cell.fillPercentage > 0.5) return 'bg-blue-500 border-blue-600';
    if (cell.fillPercentage > 0.2) return 'bg-yellow-400 border-yellow-500';
    return 'bg-white border-gray-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Grid Detection
          </CardTitle>
          <CardDescription>
            Detect and analyze bubble grid structure in the OMR sheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {detectedGrid.length} cells detected
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {settings.rows}×{settings.columns} grid
              </Badge>
              {detectedGrid.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {detectedGrid.filter(cell => cell.isBubble).length} bubbles
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
                onClick={detectGrid}
                disabled={isProcessing || !imageData}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Detect Grid
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
                  <label className="text-sm font-medium">Grid Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.rows}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      rows: parseInt(e.target.value)
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Grid Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.columns}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      columns: parseInt(e.target.value)
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Bubble Size</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={settings.minBubbleSize}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      minBubbleSize: parseInt(e.target.value)
                    })}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">
                    {settings.minBubbleSize}px
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Max Bubble Size</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.maxBubbleSize}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      maxBubbleSize: parseInt(e.target.value)
                    })}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">
                    {settings.maxBubbleSize}px
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Detection Tolerance</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.tolerance}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      tolerance: parseFloat(e.target.value)
                    })}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(settings.tolerance * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoDetect"
                    checked={settings.autoDetect}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      autoDetect: e.target.checked
                    })}
                    className="rounded"
                  />
                  <label htmlFor="autoDetect" className="text-sm">
                    Auto-detect grid
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Image Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grid Analysis</CardTitle>
          <CardDescription>
            Visual representation of detected grid and bubbles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white dark:bg-gray-700 rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <span className="text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Grid Overlay */}
            <div 
              className="relative"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            >
              {imageData && (
                <img 
                  src={imageData} 
                  alt="OMR Sheet" 
                  className="w-full h-auto"
                />
              )}
              
              {/* Detected Grid Overlay */}
              {detectedGrid.length > 0 && (
                <div className="absolute inset-0">
                  {detectedGrid.map((cell, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 ${getCellColor(cell)} ${
                        settings.showGrid ? 'border-dashed' : 'border-transparent'
                      }`}
                      style={{
                        left: `${cell.x}%`,
                        top: `${cell.y}%`,
                        width: `${cell.width}%`,
                        height: `${cell.height}%`,
                      }}
                      title={`Row ${cell.row + 1}, Col ${cell.col + 1}: ${Math.round(cell.confidence * 100)}% confidence`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Grid Statistics */}
          {detectedGrid.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{detectedGrid.length}</div>
                <div className="text-sm text-gray-600">Total Cells</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {detectedGrid.filter(cell => cell.isBubble).length}
                </div>
                <div className="text-sm text-gray-600">Bubble Cells</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor(detectedGrid.reduce((sum, cell) => sum + cell.confidence, 0) / detectedGrid.length)}`}>
                  {Math.round(detectedGrid.reduce((sum, cell) => sum + cell.confidence, 0) / detectedGrid.length * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {settings.rows}×{settings.columns}
                </div>
                <div className="text-sm text-gray-600">Grid Size</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {!imageData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No image data available. Please upload an image first.
          </AlertDescription>
        </Alert>
      )}
      
      {detectedGrid.length === 0 && imageData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No grid detected yet. Click "Detect Grid" to analyze the image.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 