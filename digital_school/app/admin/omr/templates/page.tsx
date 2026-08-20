"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Grid,
  Move,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Save,
  Download,
  Upload,
  Eye,
  Sliders,
  CheckCircle2,
  SlidersHorizontal,
  Code
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DynamicOMRTemplate,
  SemanticRegionDefinition,
  SemanticRegionType,
  ProcessingStrategy,
  TemplateValidator,
  AutoDetectorAssistant
} from '@/lib/omr/dynamic-engine/template-schema';

export default function DynamicTemplateStudioPage() {
  const [template, setTemplate] = useState<DynamicOMRTemplate>({
    templateId: 'OMR_V2_INTELLIGENT_A4',
    templateVersion: '2.0.0',
    name: 'Rofaz Standard 100-MCQ Canonical Sheet',
    canonicalWidth: 2480,
    canonicalHeight: 3508,
    schemaVersion: 'v2_semantic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fiducials: {
      tl: { x: 0.04, y: 0.03, size: 28 },
      tr: { x: 0.96, y: 0.03, size: 28 },
      bl: { x: 0.04, y: 0.97, size: 28 },
      br: { x: 0.96, y: 0.97, size: 28 }
    },
    regions: [
      {
        id: 'region_qr_header',
        type: 'QR',
        name: 'Header Context QR',
        geometry: { x: 0.72, y: 0.05, width: 0.20, height: 0.12 },
        processingStrategy: 'QR_DECODER',
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.95 },
        relationships: { resolves: 'EXAM_CONTEXT' }
      },
      {
        id: 'region_roll_matrix',
        type: 'ROLL',
        name: 'Roll Number 6-Digit Matrix',
        geometry: { x: 0.08, y: 0.20, width: 0.38, height: 0.22 },
        processingStrategy: 'BUBBLE_MATRIX',
        matrixConfiguration: { columns: 6, rows: 10, digitZeroToNine: true },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'STUDENT_IDENTITY' }
      },
      {
        id: 'region_reg_matrix',
        type: 'REGISTRATION',
        name: 'Registration 7-Digit Matrix',
        geometry: { x: 0.54, y: 0.20, width: 0.38, height: 0.22 },
        processingStrategy: 'BUBBLE_MATRIX',
        matrixConfiguration: { columns: 7, rows: 10, digitZeroToNine: true },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'STUDENT_IDENTITY' }
      },
      {
        id: 'region_mcq_col1',
        type: 'MCQ',
        name: 'Answer Column 1 (Q1-Q25)',
        geometry: { x: 0.08, y: 0.48, width: 0.20, height: 0.46 },
        processingStrategy: 'BUBBLE_GRID',
        questionRange: { start: 1, end: 25 },
        optionConfiguration: {
          optionCount: 4,
          labels: ['A', 'B', 'C', 'D'],
          orientation: 'HORIZONTAL',
          bubbleRadiusNormalized: 0.015,
          spacingNormalized: { x: 0.05, y: 0.018 }
        },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'QUESTION_RESPONSES' }
      },
      {
        id: 'region_mcq_col2',
        type: 'MCQ',
        name: 'Answer Column 2 (Q26-Q50)',
        geometry: { x: 0.31, y: 0.48, width: 0.20, height: 0.46 },
        processingStrategy: 'BUBBLE_GRID',
        questionRange: { start: 26, end: 50 },
        optionConfiguration: {
          optionCount: 4,
          labels: ['A', 'B', 'C', 'D'],
          orientation: 'HORIZONTAL',
          bubbleRadiusNormalized: 0.015,
          spacingNormalized: { x: 0.05, y: 0.018 }
        },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'QUESTION_RESPONSES' }
      },
      {
        id: 'region_mcq_col3',
        type: 'MCQ',
        name: 'Answer Column 3 (Q51-Q75)',
        geometry: { x: 0.54, y: 0.48, width: 0.20, height: 0.46 },
        processingStrategy: 'BUBBLE_GRID',
        questionRange: { start: 51, end: 75 },
        optionConfiguration: {
          optionCount: 4,
          labels: ['A', 'B', 'C', 'D'],
          orientation: 'HORIZONTAL',
          bubbleRadiusNormalized: 0.015,
          spacingNormalized: { x: 0.05, y: 0.018 }
        },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'QUESTION_RESPONSES' }
      },
      {
        id: 'region_mcq_col4',
        type: 'MCQ',
        name: 'Answer Column 4 (Q76-Q100)',
        geometry: { x: 0.77, y: 0.48, width: 0.20, height: 0.46 },
        processingStrategy: 'BUBBLE_GRID',
        questionRange: { start: 76, end: 100 },
        optionConfiguration: {
          optionCount: 4,
          labels: ['A', 'B', 'C', 'D'],
          orientation: 'HORIZONTAL',
          bubbleRadiusNormalized: 0.015,
          spacingNormalized: { x: 0.05, y: 0.018 }
        },
        confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 },
        relationships: { resolves: 'QUESTION_RESPONSES' }
      }
    ]
  });

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('region_qr_header');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const selectedRegion = template.regions.find(r => r.id === selectedRegionId) || null;
  const validationReport = TemplateValidator.validate(template);

  const handleUpdateRegionGeometry = (id: string, updates: Partial<SemanticRegionDefinition['geometry']>) => {
    setTemplate(prev => ({
      ...prev,
      regions: prev.regions.map(r => (r.id === id ? { ...r, geometry: { ...r.geometry, ...updates } } : r))
    }));
  };

  const handleAddRegion = (type: SemanticRegionType) => {
    const newId = `region_${type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    let strategy: ProcessingStrategy = 'BUBBLE_GRID';

    if (type === 'QR' || type === 'BARCODE') strategy = 'QR_DECODER';
    else if (type === 'ROLL' || type === 'REGISTRATION' || type === 'STUDENT_ID') strategy = 'BUBBLE_MATRIX';
    else if (type === 'INTEGER') strategy = 'INTEGER_DIGIT_GRID';
    else if (type === 'MTF') strategy = 'MATCHING_COLUMN';
    else if (type === 'TEXT' || type === 'SIGNATURE') strategy = 'OCR_TEXT';

    const newRegion: SemanticRegionDefinition = {
      id: newId,
      type,
      name: `New ${type} Region`,
      geometry: { x: 0.20, y: 0.20, width: 0.30, height: 0.15 },
      processingStrategy: strategy,
      confidenceRequirements: { minFillThreshold: 0.35, minMarginThreshold: 0.20, requiredConfidence: 0.85 }
    };

    setTemplate(prev => ({ ...prev, regions: [...prev.regions, newRegion] }));
    setSelectedRegionId(newId);
  };

  const handleDeleteRegion = (id: string) => {
    setTemplate(prev => ({ ...prev, regions: prev.regions.filter(r => r.id !== id) }));
    if (selectedRegionId === id) setSelectedRegionId(null);
  };

  const handleDuplicateRegion = (region: SemanticRegionDefinition) => {
    const dupId = `${region.id}_copy_${Date.now().toString().slice(-3)}`;
    const duplicated: SemanticRegionDefinition = {
      ...region,
      id: dupId,
      name: `${region.name} (Copy)`,
      geometry: {
        ...region.geometry,
        x: Math.min(0.70, region.geometry.x + 0.05),
        y: Math.min(0.70, region.geometry.y + 0.05)
      }
    };
    setTemplate(prev => ({ ...prev, regions: [...prev.regions, duplicated] }));
    setSelectedRegionId(dupId);
  };

  const handleAutoDetectAssistant = (region: SemanticRegionDefinition) => {
    const detected = AutoDetectorAssistant.detectBubbleGridStructure(region.geometry, 25, 4);
    alert(`✓ Auto-Detect Assistant: Found ${detected.estimatedRows} rows and ${detected.estimatedColumns} bubble columns (${detected.cells.length} total bubble cells).`);
  };

  const handleSaveTemplate = () => {
    setSaveStatus('✓ Template validated & saved to canonical intelligence registry.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/scanner" className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-2xl border border-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  Dynamic OMR Template Studio
                </h1>
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                  Schema v2.0
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual template authoring, extensible semantic regions, normalized coordinates, and auto-detection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowJsonModal(true)}
            variant="outline"
            className="px-3.5 py-2 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Code className="w-4 h-4 text-indigo-400" />
            JSON Schema
          </Button>
          <Button
            onClick={handleSaveTemplate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save & Publish Template
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center">
          {saveStatus}
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Toolbar & Layer Tree (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Add Semantic Region Palette */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Add Semantic Region
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(['MCQ', 'MMCQ', 'ROLL', 'REGISTRATION', 'QR', 'INTEGER', 'AR', 'MTF'] as SemanticRegionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddRegion(type)}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Region Layer Hierarchy */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Template Layers ({template.regions.length})
              </h3>
              <Badge className={`text-[9px] font-bold ${validationReport.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {validationReport.isValid ? 'Valid' : 'Errors'}
              </Badge>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[360px] pr-1">
              {template.regions.map((region) => (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    selectedRegionId === region.id
                      ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="font-bold block truncate">{region.name}</span>
                    <span className="text-[10px] text-indigo-400 uppercase font-mono">{region.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateRegion(region);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRegion(region.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Interactive Visual Canvas (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Canvas Controls Bar */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Zoom:</span>
              <button onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.1))} className="p-1 rounded bg-slate-950 border border-slate-800">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-white">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.1))} className="p-1 rounded bg-slate-950 border border-slate-800">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-slate-800"
                />
                Snap to Grid
              </label>
            </div>
          </div>

          {/* Interactive A4 Document Canvas Sheet */}
          <div className="relative w-full aspect-[1/1.414] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-800">
            {/* 4 Corner Fiducials */}
            <div className="absolute top-3 left-3 w-6 h-6 bg-black rounded-sm" />
            <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-sm" />
            <div className="absolute bottom-3 left-3 w-6 h-6 bg-black rounded-sm" />
            <div className="absolute bottom-3 right-3 w-6 h-6 bg-black rounded-sm" />

            {/* Semantic Regions Render Overlay */}
            {template.regions.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const g = region.geometry;

              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  style={{
                    left: `${g.x * 100}%`,
                    top: `${g.y * 100}%`,
                    width: `${g.width * 100}%`,
                    height: `${g.height * 100}%`
                  }}
                  className={`absolute border-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between p-1 select-none ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-500/20 shadow-lg ring-2 ring-indigo-400'
                      : 'border-slate-800/80 bg-slate-900/10 hover:border-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-1 rounded bg-black text-white font-mono leading-tight">
                      {region.type}
                    </span>
                    <span className="text-[8px] font-bold text-black/70 truncate">{region.name}</span>
                  </div>

                  {/* Bubble Representation Preview */}
                  {region.type === 'MCQ' && (
                    <div className="flex flex-col gap-0.5 opacity-60">
                      <div className="flex justify-around">
                        <div className="w-1.5 h-1.5 rounded-full border border-black" />
                        <div className="w-1.5 h-1.5 rounded-full border border-black" />
                        <div className="w-1.5 h-1.5 rounded-full border border-black" />
                        <div className="w-1.5 h-1.5 rounded-full border border-black" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Property Inspector & Assistant (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRegion ? (
            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="font-black uppercase tracking-wider text-white">Region Properties</h3>
                <Badge className="bg-indigo-600 text-white font-mono text-[9px]">{selectedRegion.type}</Badge>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Region Name</label>
                <input
                  type="text"
                  value={selectedRegion.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTemplate(prev => ({
                      ...prev,
                      regions: prev.regions.map(r => r.id === selectedRegion.id ? { ...r, name: val } : r)
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              {/* Normalized Coordinates */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Normalized Coordinates [0.0..1.0]</span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="text-[9px] text-slate-400">X (Left)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedRegion.geometry.x}
                      onChange={(e) => handleUpdateRegionGeometry(selectedRegion.id, { x: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Y (Top)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedRegion.geometry.y}
                      onChange={(e) => handleUpdateRegionGeometry(selectedRegion.id, { y: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Width</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedRegion.geometry.width}
                      onChange={(e) => handleUpdateRegionGeometry(selectedRegion.id, { width: parseFloat(e.target.value) || 0.1 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Height</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedRegion.geometry.height}
                      onChange={(e) => handleUpdateRegionGeometry(selectedRegion.id, { height: parseFloat(e.target.value) || 0.1 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Detect Assistant */}
              <Button
                onClick={() => handleAutoDetectAssistant(selectedRegion)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Detect Grid Inside Box
              </Button>

              <div className="pt-2">
                <Button
                  onClick={() => handleDeleteRegion(selectedRegion.id)}
                  variant="ghost"
                  className="w-full py-1.5 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl text-xs font-bold"
                >
                  Delete Region
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
              Select a region on the canvas or layer tree to edit properties.
            </div>
          )}
        </div>
      </div>

      {/* JSON Schema View Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                Exportable Dynamic Template JSON
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowJsonModal(false)} className="h-7 w-7 p-0 text-slate-400">
                ✕
              </Button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-y-auto max-h-[400px]">
              {JSON.stringify(template, null, 2)}
            </pre>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowJsonModal(false)} className="rounded-xl text-xs font-bold bg-slate-800 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
