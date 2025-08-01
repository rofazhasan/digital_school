"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Target, 
  Zap, 
  Brain, 
  Shield,
  RotateCcw,
  Save,
  Eye,
  AlertTriangle,
  Info,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

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

interface SettingsPanelProps {
  settings: ProcessingSettings;
  onSettingsChange: (settings: ProcessingSettings) => void;
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: keyof ProcessingSettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    setHasUnsavedChanges(true);
  };

  const handlePreprocessingChange = (key: keyof ProcessingSettings['preprocessing'], value: unknown) => {
    const newSettings = {
      ...settings,
      preprocessing: { ...settings.preprocessing, [key]: value }
    };
    onSettingsChange(newSettings);
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = () => {
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
    
    onSettingsChange(defaultSettings);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  const saveSettings = () => {
    setHasUnsavedChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Settings
          </CardTitle>
          <CardDescription>
            Configure OMR processing parameters and algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {settings.classificationMethod.toUpperCase()} classification
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {settings.useGPU ? 'GPU' : 'CPU'} processing
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {Math.round(settings.minConfidence * 100)}% min confidence
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset to Defaults
              </Button>
              
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  onClick={saveSettings}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'general' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>General</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'qr' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>QR Detection</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'grid' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Grid Detection</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('classification')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'classification' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Classification</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('preprocessing')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'preprocessing' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Image Processing</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'performance' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Performance</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('error-handling')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === 'error-handling' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Error Handling</span>
                  </div>
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Auto-correction</label>
                          <p className="text-sm text-gray-600">Automatically correct minor issues</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.autoCorrection}
                          onChange={(e) => handleSettingChange('autoCorrection', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Flag uncertain results</label>
                          <p className="text-sm text-gray-600">Mark low-confidence results for review</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.flagUncertain}
                          onChange={(e) => handleSettingChange('flagUncertain', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Detection Settings */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">QR Code Detection</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Enable QR detection</label>
                          <p className="text-sm text-gray-600">Detect and decode QR codes in images</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.qrEnabled}
                          onChange={(e) => handleSettingChange('qrEnabled', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="font-medium">Minimum confidence</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.qrConfidence}
                          onChange={(e) => handleSettingChange('qrConfidence', parseFloat(e.target.value))}
                          className="w-full mt-1"
                        />
                        <span className="text-xs text-gray-500">
                          {Math.round(settings.qrConfidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

      {/* Grid Detection Settings */}
              {activeTab === 'grid' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Grid Detection</h3>
                    <div className="space-y-4">
          <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Auto-detect grid</label>
                          <p className="text-sm text-gray-600">Automatically detect bubble grid layout</p>
            </div>
                        <input
                          type="checkbox"
              checked={settings.autoDetectGrid}
                          onChange={(e) => handleSettingChange('autoDetectGrid', e.target.checked)}
                          className="rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium">Min bubble size</label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                value={settings.minBubbleSize}
                            onChange={(e) => handleSettingChange('minBubbleSize', parseInt(e.target.value))}
                            className="w-full mt-1"
              />
                          <span className="text-xs text-gray-500">{settings.minBubbleSize}px</span>
            </div>
                        
                        <div>
                          <label className="font-medium">Max bubble size</label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                value={settings.maxBubbleSize}
                            onChange={(e) => handleSettingChange('maxBubbleSize', parseInt(e.target.value))}
                            className="w-full mt-1"
              />
                          <span className="text-xs text-gray-500">{settings.maxBubbleSize}px</span>
            </div>
          </div>
          
                      <div>
                        <label className="font-medium">Grid tolerance</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.gridTolerance}
                          onChange={(e) => handleSettingChange('gridTolerance', parseFloat(e.target.value))}
                          className="w-full mt-1"
              />
                        <span className="text-xs text-gray-500">
                          {Math.round(settings.gridTolerance * 100)}%
                        </span>
                      </div>
                    </div>
            </div>
          </div>
              )}

              {/* Classification Settings */}
              {activeTab === 'classification' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Bubble Classification</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="font-medium">Classification method</label>
                        <select
              value={settings.classificationMethod}
                          onChange={(e) => handleSettingChange('classificationMethod', e.target.value as 'ml' | 'threshold' | 'hybrid')}
                          className="w-full mt-1 p-2 border rounded-md"
                        >
                          <option value="threshold">Threshold-based</option>
                          <option value="ml">Machine Learning</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
          </div>
          
                      <div>
                        <label className="font-medium">Fill threshold</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.fillThreshold}
                          onChange={(e) => handleSettingChange('fillThreshold', parseFloat(e.target.value))}
                          className="w-full mt-1"
              />
                        <span className="text-xs text-gray-500">
                          {Math.round(settings.fillThreshold * 100)}%
                        </span>
          </div>
          
                      {settings.classificationMethod === 'ml' && (
                        <div>
                          <label className="font-medium">ML model path</label>
                          <input
                            type="text"
                            value={settings.mlModelPath || ''}
                            onChange={(e) => handleSettingChange('mlModelPath', e.target.value)}
                            placeholder="/path/to/model.pkl"
                            className="w-full mt-1 p-2 border rounded-md"
                          />
                        </div>
                      )}
                    </div>
            </div>
          </div>
              )}

              {/* Image Processing Settings */}
              {activeTab === 'preprocessing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Image Preprocessing</h3>
                    <div className="space-y-4">
            <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Denoise</label>
                          <p className="text-sm text-gray-600">Remove noise from images</p>
              </div>
                        <input
                          type="checkbox"
                checked={settings.preprocessing.denoise}
                          onChange={(e) => handlePreprocessingChange('denoise', e.target.checked)}
                          className="rounded"
              />
            </div>
                      
            <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Sharpen</label>
                          <p className="text-sm text-gray-600">Enhance image sharpness</p>
              </div>
                        <input
                          type="checkbox"
                checked={settings.preprocessing.sharpen}
                          onChange={(e) => handlePreprocessingChange('sharpen', e.target.checked)}
                          className="rounded"
              />
            </div>
                      
            <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Skew correction</label>
                          <p className="text-sm text-gray-600">Correct image rotation</p>
              </div>
                        <input
                          type="checkbox"
                checked={settings.preprocessing.skewCorrection}
                          onChange={(e) => handlePreprocessingChange('skewCorrection', e.target.checked)}
                          className="rounded"
              />
            </div>
                      
            <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Perspective correction</label>
                          <p className="text-sm text-gray-600">Correct perspective distortion</p>
              </div>
                        <input
                          type="checkbox"
                checked={settings.preprocessing.perspectiveCorrection}
                          onChange={(e) => handlePreprocessingChange('perspectiveCorrection', e.target.checked)}
                          className="rounded"
              />
            </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium">Contrast</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={settings.preprocessing.contrast}
                            onChange={(e) => handlePreprocessingChange('contrast', parseFloat(e.target.value))}
                            className="w-full mt-1"
                          />
                          <span className="text-xs text-gray-500">{settings.preprocessing.contrast}x</span>
          </div>
          
                        <div>
                          <label className="font-medium">Brightness</label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={settings.preprocessing.brightness}
                            onChange={(e) => handlePreprocessingChange('brightness', parseFloat(e.target.value))}
                            className="w-full mt-1"
                />
                          <span className="text-xs text-gray-500">{settings.preprocessing.brightness}x</span>
              </div>
            </div>
              </div>
            </div>
          </div>
              )}

      {/* Performance Settings */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Performance Settings</h3>
                    <div className="space-y-4">
          <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Use GPU acceleration</label>
                          <p className="text-sm text-gray-600">Enable GPU processing for faster results</p>
            </div>
                        <input
                          type="checkbox"
              checked={settings.useGPU}
                          onChange={(e) => handleSettingChange('useGPU', e.target.checked)}
                          className="rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium">Max concurrent processes</label>
                          <input
                type="number"
                            min="1"
                            max="16"
                value={settings.maxConcurrent}
                            onChange={(e) => handleSettingChange('maxConcurrent', parseInt(e.target.value))}
                            className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
                        
                        <div>
                          <label className="font-medium">Batch size</label>
                          <input
                type="number"
                            min="1"
                            max="50"
                value={settings.batchSize}
                            onChange={(e) => handleSettingChange('batchSize', parseInt(e.target.value))}
                            className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>
                    </div>
                  </div>
                </div>
              )}

      {/* Error Handling Settings */}
              {activeTab === 'error-handling' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Error Handling</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="font-medium">Minimum confidence threshold</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.minConfidence}
                          onChange={(e) => handleSettingChange('minConfidence', parseFloat(e.target.value))}
                          className="w-full mt-1"
                        />
                        <span className="text-xs text-gray-500">
                          {Math.round(settings.minConfidence * 100)}%
                        </span>
          </div>
          
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Results below this confidence threshold will be flagged for manual review.
                        </AlertDescription>
                      </Alert>
                    </div>
            </div>
          </div>
              )}
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Device Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Compatibility</CardTitle>
          <CardDescription>
            Optimize settings for your device type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Monitor className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Desktop</p>
                <p className="text-sm text-gray-600">High performance, full features</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Mobile</p>
                <p className="text-sm text-gray-600">Optimized for battery life</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Tablet className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Tablet</p>
                <p className="text-sm text-gray-600">Balanced performance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 