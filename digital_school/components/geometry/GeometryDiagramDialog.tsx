"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  GEOMETRY_TEMPLATES,
  type GeometryTemplateMeta,
  parseSingleGeometryDiagram,
  type DiagramSize,
  type DiagramStyleMode,
} from '@/utils/diagrams/geometry';

interface GeometryDiagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (diagramSyntax: string) => void;
}

// Pre-made custom geometry examples for instant 1-click loading in Freeform mode
const CUSTOM_EXAMPLES = [
  {
    name: 'Kite (ঘুড়ি)',
    dsl: 'points: A(75,15), B(130,55), C(75,115), D(20,55); lines: A-B, B-C, C-D, D-A; dash: A-C, B-D; right: B-D; tick: A-B(1), A-D(1), B-C(2), C-D(2); shade: A-B-D',
  },
  {
    name: 'Trapezoid with Diagonals (কর্ণসহ ট্রাপিজিয়াম)',
    dsl: 'points: A(40,25), B(110,25), C(135,95), D(15,95), O(75,60); lines: A-B, B-C, C-D, D-A; dash: A-C, B-D; parallel: A-B, D-C; angle: D-A-B(115°); shade: A-B-O',
  },
  {
    name: 'Star Polygon (তারকা বহুভুজ)',
    dsl: 'points: A(75,15), B(95,50), C(135,55), D(105,85), E(115,125), F(75,100), G(35,125), H(45,85), I(15,55), J(55,50); lines: A-B, B-C, C-D, D-E, E-F, F-G, G-H, H-I, I-J, J-A; shade: A-C-E-G-I',
  },
  {
    name: 'Triangle + Median + Altitude',
    dsl: 'points: A(70,20), B(20,100), C(140,100), D(70,100), M(80,100); lines: A-B, B-C, C-A; dash: A-D, A-M; right: A-D-C; tick: B-M(1), M-C(1); angle: A-B-C(45°)',
  },
  {
    name: 'Circle with Chord & Secant',
    dsl: 'points: O(65,65), A(25,95), B(105,95), P(150,95); circle: O(r=45); lines: A-B, B-P; dash: O-A, O-B; angle: A-O-B(80°)',
  },
];

export function GeometryDiagramDialog({
  open,
  onOpenChange,
  onInsert,
}: GeometryDiagramDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<GeometryTemplateMeta>(
    () => GEOMETRY_TEMPLATES[0]
  );
  const [category, setCategory] = useState<string>('triangles');

  // Custom freeform DSL state
  const [customDsl, setCustomDsl] = useState<string>(
    'points: A(25,95), B(130,95), C(80,20), D(80,95); lines: A-B, B-C, C-A; dash: C-D; right: C-D-B; angle: A-B-C(45°); tick: A-C, B-C; shade: A-D-C'
  );

  // Template customization fields
  const [labels, setLabels] = useState<Record<string, string>>({
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    O: 'O',
    P: 'P',
  });
  const [sides, setSides] = useState<Record<string, string>>({
    a: '3',
    b: '4',
    c: '5',
    h: 'h',
    r: 'r',
    s: '5',
  });
  const [angles, setAngles] = useState<Record<string, string>>({
    angle: '30°',
    theta: 'θ',
    x: 'x',
  });

  const [size, setSize] = useState<DiagramSize>('small');
  const [styleMode, setStyleMode] = useState<DiagramStyleMode>('drafting');
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  // Indicators toggle
  const [showRightAngle, setShowRightAngle] = useState<boolean>(true);
  const [showEqualTicks, setShowEqualTicks] = useState<boolean>(true);
  const [showAltitude, setShowAltitude] = useState<boolean>(true);
  const [showShading, setShowShading] = useState<boolean>(false);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    return GEOMETRY_TEMPLATES.filter(t => t.category === category);
  }, [category]);

  // Handle template selection
  const handleSelectTemplate = (t: GeometryTemplateMeta) => {
    setSelectedTemplate(t);
    setShowShading(t.category === 'shaded');
  };

  // Generate the syntax based on active options
  const generatedSyntax = useMemo(() => {
    let sizeMod = '';
    if (size !== 'small') sizeMod = `[size:${size}]`;
    let styleMod = '';
    if (styleMode === 'hand-drawn') styleMod = `[style:hand-drawn]`;

    // 1. Freeform custom geometry
    if (category === 'custom') {
      return `##GEO:custom[${customDsl.replace(/[\r\n]+/g, ' ').trim()}]${sizeMod}${styleMod}##`;
    }

    // 2. Pre-made template geometry
    const params: string[] = [];

    if (selectedTemplate.category === 'triangles') {
      params.push(`A=${labels.A || 'A'}`);
      params.push(`B=${labels.B || 'B'}`);
      params.push(`C=${labels.C || 'C'}`);
      if (selectedTemplate.id === 'triangle-altitude') params.push(`D=${labels.D || 'D'}`);
    } else if (selectedTemplate.category === 'quadrilaterals') {
      params.push(`A=${labels.A || 'A'}`);
      params.push(`B=${labels.B || 'B'}`);
      params.push(`C=${labels.C || 'C'}`);
      params.push(`D=${labels.D || 'D'}`);
    } else if (selectedTemplate.category === 'circles') {
      params.push(`O=${labels.O || 'O'}`);
      if (selectedTemplate.id === 'circle-tangent') {
        params.push(`T=${labels.T || 'T'}`);
        params.push(`P=${labels.P || 'P'}`);
      } else {
        params.push(`A=${labels.A || 'A'}`);
        params.push(`B=${labels.B || 'B'}`);
      }
    }

    if (selectedTemplate.id === 'right-triangle') {
      if (sides.a) params.push(`a=${sides.a}`);
      if (sides.b) params.push(`b=${sides.b}`);
      if (sides.c) params.push(`c=${sides.c}`);
    } else if (selectedTemplate.id === 'equilateral-triangle' || selectedTemplate.id === 'square' || selectedTemplate.id === 'rhombus' || selectedTemplate.id === 'cube') {
      if (sides.s) params.push(`s=${sides.s}`);
    } else if (selectedTemplate.id === 'rectangle') {
      if (sides.a) params.push(`l=${sides.a}`);
      if (sides.b) params.push(`w=${sides.b}`);
    } else if (selectedTemplate.id === 'parallelogram') {
      if (sides.a) params.push(`b=${sides.a}`);
      if (sides.h) params.push(`h=${sides.h}`);
    } else if (selectedTemplate.id === 'trapezium') {
      if (sides.a) params.push(`a=${sides.a}`);
      if (sides.b) params.push(`b=${sides.b}`);
      if (sides.h) params.push(`h=${sides.h}`);
    } else if (selectedTemplate.category === 'circles' || selectedTemplate.id === 'cone' || selectedTemplate.id === 'cylinder' || selectedTemplate.id === 'sphere' || selectedTemplate.id === 'shaded-sector') {
      if (sides.r) params.push(`r=${sides.r}`);
      if (sides.h && (selectedTemplate.id === 'cone' || selectedTemplate.id === 'cylinder')) params.push(`h=${sides.h}`);
    }

    if (angles.angle) params.push(`angle=${angles.angle}`);

    if (showShading) params.push('shaded=true');
    if (!showAltitude) params.push('altitude=false');
    if (!showEqualTicks) params.push('ticks=false');

    return `##GEO:${selectedTemplate.id}[${params.join(',')}]${sizeMod}${styleMod}##`;
  }, [
    category,
    customDsl,
    selectedTemplate,
    labels,
    sides,
    angles,
    size,
    styleMode,
    showShading,
    showAltitude,
    showEqualTicks,
  ]);

  // Live SVG rendered from the current syntax
  const previewSvg = useMemo(() => {
    const raw = generatedSyntax.replace(/^##|##$/g, '');
    const svg = parseSingleGeometryDiagram(raw);
    return svg || '<div class="text-xs text-muted-foreground p-4 text-center">Invalid syntax or incomplete points</div>';
  }, [generatedSyntax]);

  const handleInsert = () => {
    onInsert(generatedSyntax);
    onOpenChange(false);
  };

  const insertHelperToDsl = (snippet: string) => {
    setCustomDsl(prev => prev ? `${prev.trim().replace(/;$/, '')}; ${snippet}` : snippet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 font-sans">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>📐</span>
                <span>Universal Geometry Engine / জ্যামিতিক চিত্র নির্মাতা</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Renders ANY geometry diagram with hand-drawn pen aesthetic or crisp textbook precision.
                Takes minimal space, prints razor-sharp, and displays all geometric indicators.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex bg-primary/5 text-primary border-primary/20 text-xs">
              Print & Online Ready
            </Badge>
          </div>
        </DialogHeader>

        {/* Category Navigation Tabs */}
        <Tabs value={category} onValueChange={setCategory} className="w-full mt-2">
          <TabsList className="grid grid-cols-4 sm:grid-cols-7 h-auto p-1 bg-muted/60">
            <TabsTrigger value="triangles" className="text-xs py-1.5 flex items-center gap-1">
              <span>🔺</span> <span>ত্রিভুজ</span>
            </TabsTrigger>
            <TabsTrigger value="quadrilaterals" className="text-xs py-1.5 flex items-center gap-1">
              <span>🟩</span> <span>চতুর্ভুজ</span>
            </TabsTrigger>
            <TabsTrigger value="circles" className="text-xs py-1.5 flex items-center gap-1">
              <span>⭕</span> <span>বৃত্ত</span>
            </TabsTrigger>
            <TabsTrigger value="lines" className="text-xs py-1.5 flex items-center gap-1">
              <span>📏</span> <span>কোণ</span>
            </TabsTrigger>
            <TabsTrigger value="shaded" className="text-xs py-1.5 flex items-center gap-1">
              <span>🎨</span> <span>ছায়াবৃত</span>
            </TabsTrigger>
            <TabsTrigger value="solids" className="text-xs py-1.5 flex items-center gap-1">
              <span>🧊</span> <span>ঘনবস্তু</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs py-1.5 flex items-center gap-1 bg-primary/10 text-primary font-bold">
              <span>✍️</span> <span>যেকোনো চিত্র</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content Area: Left = Controls, Right = Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-3">
          {/* Left Column: Template Selection or Freeform DSL (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {category === 'custom' ? (
              /* Custom Freeform Draw Editor */
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>✍️</span>
                      <span>Freeform Geometry Commands / কাস্টম জ্যামিতি কোড</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Any points, lines, circles, angles & shading</span>
                  </div>

                  {/* Quick Examples */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-[10px] text-muted-foreground py-0.5">Quick Examples:</span>
                    {CUSTOM_EXAMPLES.map(ex => (
                      <button
                        key={ex.name}
                        type="button"
                        onClick={() => setCustomDsl(ex.dsl)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground border border-border"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    value={customDsl}
                    onChange={e => setCustomDsl(e.target.value)}
                    rows={5}
                    className="font-mono text-xs leading-relaxed"
                    placeholder="points: A(20,90), B(120,90), C(70,25); lines: A-B, B-C, C-A; right: B-A-C; angle: A-B-C(45°); tick: A-B, A-C"
                  />
                </div>

                {/* Quick Syntax Helper Buttons */}
                <div className="p-2.5 border rounded-lg bg-muted/20">
                  <div className="text-[11px] font-semibold mb-1.5 text-muted-foreground">
                    Quick Command Helpers / সহজে কমান্ড যুক্ত করুন:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('points: E(60,60)')}
                    >
                      + Point
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('lines: A-C')}
                    >
                      + Line
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('dash: A-D')}
                    >
                      + Dashed Line
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('circle: O(r=35)')}
                    >
                      + Circle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('right: B')}
                    >
                      + 90° Marker
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('angle: B(30°)')}
                    >
                      + Angle Arc
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('tick: A-B(1)')}
                    >
                      + Tick Mark
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => insertHelperToDsl('shade: A-B-C')}
                    >
                      + Shaded Area
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Preset Selection & Parameters */
              <>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Shape / চিত্র নির্বাচন করুন ({filteredTemplates.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 max-h-44 overflow-y-auto p-1 border rounded-lg bg-card">
                    {filteredTemplates.map(t => {
                      const isSelected = selectedTemplate.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTemplate(t)}
                          className={`text-left p-2 rounded-md border text-xs transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border/60 hover:border-primary/40 hover:bg-accent/40 text-foreground'
                          }`}
                        >
                          <div className="font-semibold line-clamp-1">{t.nameBn}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{t.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Parameters & Labels / মান ও সূচক
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedTemplate.nameBn} ({selectedTemplate.name})
                    </span>
                  </div>

                  {/* Vertices */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[11px]">শীর্ষবিন্দু A</Label>
                      <Input
                        value={labels.A || ''}
                        onChange={e => setLabels(p => ({ ...p, A: e.target.value }))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">শীর্ষবিন্দু B</Label>
                      <Input
                        value={labels.B || ''}
                        onChange={e => setLabels(p => ({ ...p, B: e.target.value }))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">শীর্ষবিন্দু C / O</Label>
                      <Input
                        value={labels.C || labels.O || ''}
                        onChange={e => setLabels(p => ({ ...p, C: e.target.value, O: e.target.value }))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">শীর্ষবিন্দু D / P</Label>
                      <Input
                        value={labels.D || labels.P || ''}
                        onChange={e => setLabels(p => ({ ...p, D: e.target.value, P: e.target.value }))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Side measurements & Angles */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[11px]">বাহু / মান (a, s, r)</Label>
                      <Input
                        value={sides.a || sides.s || sides.r || ''}
                        onChange={e => setSides(p => ({ ...p, a: e.target.value, s: e.target.value, r: e.target.value }))}
                        className="h-7 text-xs"
                        placeholder="e.g. 5 cm"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">দ্বিতীয় বাহু (b, h, l)</Label>
                      <Input
                        value={sides.b || sides.h || ''}
                        onChange={e => setSides(p => ({ ...p, b: e.target.value, h: e.target.value }))}
                        className="h-7 text-xs"
                        placeholder="e.g. 12 cm"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">কোণ / Angle (θ)</Label>
                      <Input
                        value={angles.angle || ''}
                        onChange={e => setAngles(p => ({ ...p, angle: e.target.value }))}
                        className="h-7 text-xs"
                        placeholder="e.g. 30°, 60°"
                      />
                    </div>
                  </div>

                  {/* Indicator Toggles */}
                  <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">সমান দাগ (Ticks)</span>
                      <Switch checked={showEqualTicks} onCheckedChange={setShowEqualTicks} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">উচ্চতা (Altitude)</span>
                      <Switch checked={showAltitude} onCheckedChange={setShowAltitude} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">ছায়াবৃত এলাকা (Hatch)</span>
                      <Switch checked={showShading} onCheckedChange={setShowShading} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">হাতে আঁকা স্টাইল (Sketch)</span>
                      <Switch
                        checked={styleMode === 'hand-drawn'}
                        onCheckedChange={c => setStyleMode(c ? 'hand-drawn' : 'drafting')}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sizing Selector */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Size Mode / সাইজ (কম জায়গা নেওয়ার জন্য)
              </Label>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {(['tiny', 'small', 'medium', 'large'] as DiagramSize[]).map(s => {
                  const labelMap: Record<string, string> = {
                    tiny: 'Tiny (অতি ছোট)',
                    small: 'Compact (MCQ)',
                    medium: 'Medium (CQ)',
                    large: 'Large (বড়)',
                  };
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`py-1.5 px-2 rounded border text-xs font-medium transition-all ${
                        size === s
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {labelMap[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between border rounded-xl p-4 bg-muted/10 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Preview / সরাসরি চিত্র
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Print View</span>
                  <Switch
                    checked={isPrintPreview}
                    onCheckedChange={setIsPrintPreview}
                    title="Toggle print simulation (pure monochrome on white)"
                  />
                </div>
              </div>

              {/* Rendered SVG Preview Card */}
              <div
                className={`min-h-[170px] flex items-center justify-center p-3 rounded-lg border transition-all ${
                  isPrintPreview
                    ? 'bg-white text-black border-gray-300 shadow-sm'
                    : 'bg-background border-border/70 shadow-xs'
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  className="flex items-center justify-center w-full"
                />
              </div>

              {/* Live Syntax Snippet */}
              <div className="mt-3">
                <Label className="text-[11px] text-muted-foreground">Generated Syntax / কোড</Label>
                <div className="p-2 mt-1 rounded bg-muted font-mono text-[11px] text-foreground break-all select-all border border-border/60 max-h-24 overflow-y-auto">
                  {generatedSyntax}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-1/3"
                onClick={() => onOpenChange(false)}
              >
                Cancel / বাতিল
              </Button>
              <Button
                type="button"
                size="sm"
                className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                onClick={handleInsert}
              >
                <span>➕</span>
                <span>Insert Diagram / যুক্ত করুন</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GeometryDiagramDialog;
