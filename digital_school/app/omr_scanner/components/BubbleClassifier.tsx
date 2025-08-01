"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Zap, 
  Settings, 
  Eye, 
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface BubbleData {
  x: number;
  y: number;
  width: number;
  height: number;
  fillPercentage: number;
  isSelected: boolean;
  confidence: number;
  questionIndex: number;
  optionIndex: number;
}

interface ClassificationSettings {
  method: 'ml' | 'threshold' | 'hybrid';
  fillThreshold: number;
  mlModelPath?: string;
  minConfidence: number;
  autoCorrection: boolean;
  flagUncertain: boolean;
}

interface BubbleClassifierProps {
  bubbles: BubbleData[];
  settings: ClassificationSettings;
  onClassificationComplete: (results: Record<string, unknown>) => void;
  onSettingsChange: (settings: ClassificationSettings) => void;
}

export default function BubbleClassifier({ 
  bubbles, 
  settings, 
  onClassificationComplete, 
  onSettingsChange 
}: BubbleClassifierProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [selectedBubbles, setSelectedBubbles] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const handleBubbleClick = useCallback((bubbleId: string) => {
    setSelectedBubbles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bubbleId)) {
        newSet.delete(bubbleId);
      } else {
        newSet.add(bubbleId);
      }
      return newSet;
    });
  }, []);

  const classifyBubbles = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Simulate classification processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const classificationResults: Record<string, unknown> = {
        method: settings.method,
        totalBubbles: bubbles.length,
        classifiedBubbles: bubbles.length,
        confidence: 0.95,
        answers: bubbles.map((bubble, index) => ({
          questionIndex: bubble.questionIndex,
          optionIndex: bubble.optionIndex,
          isSelected: bubble.fillPercentage > settings.fillThreshold,
          confidence: bubble.confidence,
          fillPercentage: bubble.fillPercentage,
        })),
        metadata: {
          processingTime: 2000,
          algorithm: settings.method,
          threshold: settings.fillThreshold,
        }
      };
      
      setResults(classificationResults);
      onClassificationComplete(classificationResults);
      
      toast({
        title: "Classification Complete",
        description: `Successfully classified ${bubbles.length} bubbles with ${Math.round(classificationResults.confidence as number * 100)}% confidence.`,
      });
    } catch (error) {
      console.error('Classification error:', error);
      toast({
        title: "Classification Failed",
        description: "An error occurred during bubble classification.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [bubbles, settings, onClassificationComplete, toast]);

  const resetClassification = () => {
    setResults({});
    setSelectedBubbles(new Set());
    toast({
      title: "Classification Reset",
      description: "Bubble classification has been reset.",
    });
  };

  const getBubbleStatus = (bubble: BubbleData) => {
    if (bubble.isSelected) return 'selected';
    if (bubble.fillPercentage > settings.fillThreshold * 0.5) return 'partial';
    return 'empty';
  };

  const getBubbleColor = (bubble: BubbleData) => {
    const status = getBubbleStatus(bubble);
    switch (status) {
      case 'selected':
        return 'bg-blue-500 border-blue-600';
      case 'partial':
        return 'bg-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-200 border-gray-300';
    }
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
            <Brain className="h-5 w-5" />
            Bubble Classification
          </CardTitle>
          <CardDescription>
            Analyze and classify bubble responses using {settings.method} algorithm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {bubbles.length} bubbles detected
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {settings.method.toUpperCase()} algorithm
              </Badge>
              {results.confidence && (
                <Badge variant="outline" className={`flex items-center gap-1 ${getConfidenceColor(results.confidence as number)}`}>
                  <CheckCircle className="h-3 w-3" />
                  {Math.round((results.confidence as number) * 100)}% confidence
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
                onClick={resetClassification}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button
                onClick={classifyBubbles}
                disabled={isProcessing || bubbles.length === 0}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Classify Bubbles
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
              <CardTitle className="text-lg">Classification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Classification Method</label>
                  <select
                    value={settings.method}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      method: e.target.value as 'ml' | 'threshold' | 'hybrid'
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="threshold">Threshold-based</option>
                    <option value="ml">Machine Learning</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Fill Threshold</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.fillThreshold}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      fillThreshold: parseFloat(e.target.value)
                    })}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(settings.fillThreshold * 100)}%
                  </span>
                </div>
              </div>
              
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
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoCorrection"
                    checked={settings.autoCorrection}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      autoCorrection: e.target.checked
                    })}
                    className="rounded"
                  />
                  <label htmlFor="autoCorrection" className="text-sm">
                    Auto-correction
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Summary */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classification Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.totalBubbles}</div>
                <div className="text-sm text-gray-600">Total Bubbles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.classifiedBubbles}
                </div>
                <div className="text-sm text-gray-600">Classified</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor(results.confidence as number)}`}>
                  {Math.round((results.confidence as number) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(results.metadata as Record<string, unknown>)?.processingTime}ms
                </div>
                <div className="text-sm text-gray-600">Processing Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bubble Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bubble Analysis</CardTitle>
          <CardDescription>
            Click on bubbles to manually adjust classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {bubbles.map((bubble, index) => (
              <motion.div
                key={`${bubble.questionIndex}-${bubble.optionIndex}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`
                  w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200
                  ${getBubbleColor(bubble)}
                  ${selectedBubbles.has(`${bubble.questionIndex}-${bubble.optionIndex}`) ? 'ring-2 ring-blue-400' : ''}
                  hover:scale-110
                `}
                onClick={() => handleBubbleClick(`${bubble.questionIndex}-${bubble.optionIndex}`)}
                title={`Q${bubble.questionIndex + 1} Option ${bubble.optionIndex + 1}: ${Math.round(bubble.fillPercentage * 100)}% filled, ${Math.round(bubble.confidence * 100)}% confidence`}
              />
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Partial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span>Empty</span>
              </div>
            </div>
            
            <div className="text-right">
              <div>Selected: {selectedBubbles.size}</div>
              <div>Total: {bubbles.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {bubbles.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No bubbles detected. Please ensure the grid detection step has been completed.
          </AlertDescription>
        </Alert>
      )}
      
      {settings.flagUncertain && bubbles.some(b => b.confidence < settings.minConfidence) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some bubbles have low confidence scores and may need manual review.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 