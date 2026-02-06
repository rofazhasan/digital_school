'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FBDRenderer } from './FBDRenderer';
import { snapAngle, snapToGrid, calculateAngle, calculateDistance } from '@/utils/fbd/calculations';
import { DEFAULT_FBD_CONFIG, type FBDDiagram, type FBDForce, type FBDPoint, type FBDBody, type ForceType } from '@/utils/fbd/types';
import { validateFBD } from '@/utils/fbd/generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Grid3x3, Axis3D, Download, Undo, Redo } from 'lucide-react';

type EditorMode = 'select' | 'add-point' | 'add-force' | 'add-moment';

interface FBDEditorProps {
    initialDiagram?: FBDDiagram;
    onSave?: (diagram: FBDDiagram) => void;
    width?: number;
    height?: number;
}

export function FBDEditor({
    initialDiagram,
    onSave,
    width = 600,
    height = 400,
}: FBDEditorProps) {
    const [diagram, setDiagram] = useState<FBDDiagram>(
        initialDiagram || {
            id: `fbd-${Date.now()}`,
            width,
            height,
            points: [],
            forces: [],
            moments: [],
            showAxes: true,
            showGrid: true,
        }
    );

    const [mode, setMode] = useState<EditorMode>('select');
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [selectedForceId, setSelectedForceId] = useState<string | null>(null);
    const [history, setHistory] = useState<FBDDiagram[]>([diagram]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
    const [snapAngleEnabled, setSnapAngleEnabled] = useState(true);

    const svgRef = useRef<SVGSVGElement>(null);

    // Force editing state
    const [forceConfig, setForceConfig] = useState({
        magnitude: 80,
        angle: 0,
        label: 'F',
        type: 'applied' as ForceType,
    });

    // Add to history
    const addToHistory = useCallback((newDiagram: FBDDiagram) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newDiagram);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setDiagram(newDiagram);
    }, [history, historyIndex]);

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setDiagram(history[historyIndex - 1]);
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setDiagram(history[historyIndex + 1]);
        }
    };

    // Handle SVG click
    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // Snap to grid if enabled
        if (snapToGridEnabled) {
            const snapped = snapToGrid(x, y, DEFAULT_FBD_CONFIG.gridSize);
            x = snapped.x;
            y = snapped.y;
        }

        if (mode === 'add-point') {
            const newPoint: FBDPoint = {
                id: `p${diagram.points.length + 1}`,
                x,
                y,
                label: `P${diagram.points.length + 1}`,
            };

            addToHistory({
                ...diagram,
                points: [...diagram.points, newPoint],
            });
        } else if (mode === 'add-force' && selectedPointId) {
            const point = diagram.points.find(p => p.id === selectedPointId);
            if (!point) return;

            let angle = calculateAngle(point.x, point.y, x, y);
            if (snapAngleEnabled) {
                angle = snapAngle(angle, DEFAULT_FBD_CONFIG.snapAngles);
            }

            const magnitude = calculateDistance(point.x, point.y, x, y);

            const newForce: FBDForce = {
                id: `f${diagram.forces.length + 1}`,
                pointId: selectedPointId,
                magnitude: forceConfig.magnitude,
                angle,
                label: forceConfig.label,
                type: forceConfig.type,
            };

            addToHistory({
                ...diagram,
                forces: [...diagram.forces, newForce],
            });

            setMode('select');
            setSelectedPointId(null);
        }
    };

    // Delete selected item
    const handleDelete = () => {
        if (selectedForceId) {
            addToHistory({
                ...diagram,
                forces: diagram.forces.filter(f => f.id !== selectedForceId),
            });
            setSelectedForceId(null);
        } else if (selectedPointId) {
            addToHistory({
                ...diagram,
                points: diagram.points.filter(p => p.id !== selectedPointId),
                forces: diagram.forces.filter(f => f.pointId !== selectedPointId),
            });
            setSelectedPointId(null);
        }
    };

    // Toggle axes
    const toggleAxes = () => {
        addToHistory({
            ...diagram,
            showAxes: !diagram.showAxes,
        });
    };

    // Toggle grid
    const toggleGrid = () => {
        addToHistory({
            ...diagram,
            showGrid: !diagram.showGrid,
        });
    };

    // Save diagram
    const handleSave = () => {
        const validation = validateFBD(diagram);
        if (!validation.valid) {
            alert(`Invalid diagram:\n${validation.errors.join('\n')}`);
            return;
        }

        if (onSave) {
            onSave(diagram);
        }
    };

    // Export as JSON
    const handleExport = () => {
        const json = JSON.stringify(diagram, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diagram.id}.json`;
        a.click();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Toolbar */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Mode Selection */}
                    <div className="space-y-2">
                        <Label>Mode</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={mode === 'select' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setMode('select')}
                            >
                                Select
                            </Button>
                            <Button
                                variant={mode === 'add-point' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setMode('add-point')}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Point
                            </Button>
                            <Button
                                variant={mode === 'add-force' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setMode('add-force');
                                    if (diagram.points.length > 0) {
                                        setSelectedPointId(diagram.points[0].id);
                                    }
                                }}
                                disabled={diagram.points.length === 0}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Force
                            </Button>
                        </div>
                    </div>

                    {/* Force Configuration */}
                    {mode === 'add-force' && (
                        <div className="space-y-3 p-3 border rounded-lg">
                            <Label>Force Settings</Label>

                            <div>
                                <Label className="text-xs">Point</Label>
                                <Select value={selectedPointId || ''} onValueChange={setSelectedPointId}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {diagram.points.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.label || p.id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Label</Label>
                                <Input
                                    value={forceConfig.label}
                                    onChange={(e) => setForceConfig({ ...forceConfig, label: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Magnitude</Label>
                                <Input
                                    type="number"
                                    value={forceConfig.magnitude}
                                    onChange={(e) => setForceConfig({ ...forceConfig, magnitude: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Type</Label>
                                <Select value={forceConfig.type} onValueChange={(v) => setForceConfig({ ...forceConfig, type: v as ForceType })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="applied">Applied</SelectItem>
                                        <SelectItem value="weight">Weight</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="friction">Friction</SelectItem>
                                        <SelectItem value="tension">Tension</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Display Options */}
                    <div className="space-y-2">
                        <Label>Display</Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Grid</Label>
                                <Switch checked={diagram.showGrid} onCheckedChange={toggleGrid} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Axes</Label>
                                <Switch checked={diagram.showAxes} onCheckedChange={toggleAxes} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Snap to Grid</Label>
                                <Switch checked={snapToGridEnabled} onCheckedChange={setSnapToGridEnabled} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Snap Angle</Label>
                                <Switch checked={snapAngleEnabled} onCheckedChange={setSnapAngleEnabled} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0}>
                                <Undo className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                                <Redo className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDelete} disabled={!selectedPointId && !selectedForceId}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleSave}>
                        Save Diagram
                    </Button>
                </CardContent>
            </Card>

            {/* Canvas */}
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Canvas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {mode === 'add-point' && 'Click to add a point'}
                        {mode === 'add-force' && 'Click to set force direction and magnitude'}
                        {mode === 'select' && 'Select mode - click items to select'}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <svg
                            ref={svgRef}
                            width={width}
                            height={height}
                            onClick={handleSvgClick}
                            className="cursor-crosshair"
                        >
                            <FBDRenderer diagram={diagram} />
                        </svg>
                    </div>

                    {/* Info */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <Label className="text-xs text-muted-foreground">Points</Label>
                            <p className="font-semibold">{diagram.points.length}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Forces</Label>
                            <p className="font-semibold">{diagram.forces.length}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Moments</Label>
                            <p className="font-semibold">{diagram.moments?.length || 0}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
