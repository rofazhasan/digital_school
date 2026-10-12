"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Pencil, Eraser, MousePointer2, Highlighter, Move,
    Undo, Redo, ZoomIn, ZoomOut, Layout,
    Box, Circle, Triangle, Square, Minus, Ruler, BarChart2,
    Palette, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Sun, Moon, Grid3X3, Check, Timer, Eye, EyeOff, Printer,
    ArrowRight, Trash2, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToolType, SmartBoardRef } from './SmartBoard';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from 'framer-motion';

interface SmartBoardToolbarProps {
    boardRef: React.RefObject<SmartBoardRef | null>;
    currentIndex: number;
    totalQuestions: number;
    onPrev: () => void;
    onNext: () => void;
    onExport?: () => void;
    bgMode: 'white' | 'black' | 'grid';
    onNavigateBg: () => void;
    isAnnotationMode?: boolean;
    onToggleAnnotation?: () => void;
}

// Stopwatch component
const Stopwatch = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => setTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={isRunning ? "default" : "ghost"}
                    size="icon"
                    className={`w-8 h-8 rounded-full ${isRunning ? 'bg-amber-500 text-white shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                    title="Stopwatch"
                >
                    {isRunning ? (
                        <span className="text-[10px] font-mono font-bold">{formatTime(time)}</span>
                    ) : (
                        <Timer className="w-4 h-4" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-36 p-3 mb-2 rounded-2xl shadow-xl">
                <div className="text-center font-mono text-2xl font-black mb-2 text-indigo-600 dark:text-indigo-400">
                    {formatTime(time)}
                </div>
                <div className="flex justify-center gap-1.5">
                    <Button
                        size="sm"
                        variant={isRunning ? "destructive" : "default"}
                        onClick={() => setIsRunning(!isRunning)}
                        className="h-7 text-xs rounded-full px-3"
                    >
                        {isRunning ? "Stop" : "Start"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setIsRunning(false); setTime(0); }}
                        className="h-7 text-xs rounded-full px-2.5"
                    >
                        Reset
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const SmartBoardToolbar: React.FC<SmartBoardToolbarProps> = ({
    boardRef,
    currentIndex,
    totalQuestions,
    onPrev,
    onNext,
    onExport,
    bgMode,
    onNavigateBg,
    isAnnotationMode = false,
    onToggleAnnotation
}) => {
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [activeColor, setActiveColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2.5);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Helpers
    const setTool = (t: ToolType) => {
        setActiveTool(t);
        boardRef.current?.setTool(t);
    };

    const setColor = (c: string) => {
        setActiveColor(c);
        boardRef.current?.setColor(c);
        if (activeTool === 'eraser' || activeTool === 'move') {
            setTool('pen');
        }
    };

    const setBackground = () => {
        onNavigateBg();
    };

    // Auto-switch contrast color when background changes
    useEffect(() => {
        const newColor = bgMode === 'black' ? '#ffffff' : '#000000';
        setActiveColor(newColor);
        boardRef.current?.setColor(newColor);
    }, [bgMode]);

    if (isCollapsed) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 no-print"
            >
                <Button
                    onClick={() => setIsCollapsed(false)}
                    className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center transition-transform hover:scale-110"
                    title="Open Teaching Toolbar"
                >
                    <Pencil className="w-6 h-6" />
                </Button>
            </motion.div>
        );
    }

    const colorPalette = [
        '#000000',
        '#2563EB',
        '#DC2626',
        '#16A34A',
        '#7C3AED',
        '#D97706',
        '#0891B2',
        '#FFFFFF'
    ];

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-end gap-1.5 no-print max-w-[98vw]"
        >
            {/* Main Dock - Sleek Capsule */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xl shadow-indigo-950/15 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">

                {/* 1. Question Navigator */}
                <div className="flex items-center gap-1 pr-1.5 border-r border-gray-200 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrev}
                        disabled={currentIndex === 0}
                        className="w-7 h-7 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Previous Question"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 min-w-[2.5ch] text-center">
                        {currentIndex + 1}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        disabled={currentIndex === totalQuestions - 1}
                        className="w-7 h-7 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Next Question"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* 2. Core Interactive Tools */}
                <div className="flex items-center gap-1">
                    <ToolButton
                        isActive={activeTool === 'move'}
                        onClick={() => setTool('move')}
                        icon={<Move className="w-4 h-4" />}
                        tooltip="Pan Canvas (Hold Spacebar or Drag)"
                    />

                    <ToolButton
                        isActive={activeTool === 'select'}
                        onClick={() => setTool('select')}
                        icon={<MousePointer2 className="w-4 h-4 rotate-[-45deg]" />}
                        tooltip="Select & Move Stroke"
                    />

                    {/* Butter-Smooth Pen with Quick Thickness */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative group">
                                <ToolButton
                                    isActive={activeTool === 'pen'}
                                    onClick={() => setTool('pen')}
                                    icon={<Pencil className="w-4 h-4" />}
                                    tooltip="Smooth Gel Pen (Click for Thickness)"
                                />
                                <div
                                    className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900 shadow-sm"
                                    style={{ backgroundColor: activeColor }}
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-56 p-3 mb-2 rounded-2xl shadow-xl">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                                    <span>Pen Thickness</span>
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{strokeWidth}px</span>
                                </div>
                                <div className="flex items-center gap-1.5 justify-between">
                                    {[1.5, 2.5, 4.5, 8].map(w => (
                                        <Button
                                            key={w}
                                            variant={strokeWidth === w ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setStrokeWidth(w);
                                                boardRef.current?.setLineWidth(w);
                                            }}
                                            className="h-7 text-[11px] px-2 rounded-lg font-bold"
                                        >
                                            {w === 1.5 ? 'Fine' : w === 2.5 ? 'Medium' : w === 4.5 ? 'Bold' : 'Thick'}
                                        </Button>
                                    ))}
                                </div>
                                <Slider
                                    value={[strokeWidth]}
                                    min={1}
                                    max={20}
                                    step={0.5}
                                    onValueChange={([v]) => {
                                        setStrokeWidth(v);
                                        boardRef.current?.setLineWidth(v);
                                    }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Highlighter Tool */}
                    <ToolButton
                        isActive={activeTool === 'highlighter'}
                        onClick={() => setTool('highlighter')}
                        icon={<Highlighter className="w-4 h-4" />}
                        tooltip="Highlighter (Soft multiply blend)"
                    />

                    {/* Smart Eraser with mode description */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative group">
                                <ToolButton
                                    isActive={activeTool === 'eraser'}
                                    onClick={() => setTool('eraser')}
                                    icon={<Eraser className="w-4 h-4" />}
                                    tooltip="Smart Eraser (Tap stroke to delete)"
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-52 p-3 mb-2 rounded-2xl shadow-xl">
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    <span>Eraser Mode</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                    💡 Tap any stroke to delete it instantly, or drag across strokes to wipe clean.
                                </p>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        boardRef.current?.clear();
                                    }}
                                    className="w-full h-8 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Clear Whole Board
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-0.5" />

                {/* 3. Shapes & Stencils Popover */}
                <div className="flex items-center gap-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={['line', 'arrow', 'rect', 'circle', 'triangle', 'cube', 'axis'].includes(activeTool) ? 'default' : 'ghost'}
                                size="icon"
                                className="rounded-xl w-8 h-8"
                                title="Shapes & Diagram Stencils"
                            >
                                <Box className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-auto p-2 mb-2 grid grid-cols-4 gap-1.5 rounded-2xl shadow-xl">
                            <ShapeBtn tool="line" current={activeTool} set={setTool} icon={<Minus className="w-4 h-4" />} title="Line" />
                            <ShapeBtn tool="arrow" current={activeTool} set={setTool} icon={<ArrowRight className="w-4 h-4" />} title="Arrow / Vector" />
                            <ShapeBtn tool="rect" current={activeTool} set={setTool} icon={<Square className="w-4 h-4" />} title="Rectangle" />
                            <ShapeBtn tool="circle" current={activeTool} set={setTool} icon={<Circle className="w-4 h-4" />} title="Circle" />
                            <ShapeBtn tool="triangle" current={activeTool} set={setTool} icon={<Triangle className="w-4 h-4" />} title="Triangle" />
                            <ShapeBtn tool="axis" current={activeTool} set={setTool} icon={<BarChart2 className="w-4 h-4" />} title="Cartesian Axes" />
                            <ShapeBtn tool="cube" current={activeTool} set={setTool} icon={<Box className="w-4 h-4" />} title="3D Cube" />
                        </PopoverContent>
                    </Popover>

                    {/* Curated Colors Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl w-8 h-8 relative hover:bg-gray-100 dark:hover:bg-slate-800"
                                title="Ink Color"
                            >
                                <Palette className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                <div
                                    className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow"
                                    style={{ backgroundColor: activeColor }}
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-52 p-3 mb-2 rounded-2xl shadow-xl">
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Curated Inks
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {colorPalette.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${activeColor === c ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200 dark:border-slate-700'}`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    >
                                        {activeColor === c && (
                                            <Check className={`w-3.5 h-3.5 ${c === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-0.5" />

                {/* 4. History (Undo / Redo) */}
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => boardRef.current?.undo()}
                        className="w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => boardRef.current?.redo()}
                        className="w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-3.5 h-3.5" />
                    </Button>
                </div>

                <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-0.5" />

                {/* 5. Utility Controls (Timer, Background, Export) */}
                <div className="flex items-center gap-1">
                    <Stopwatch />

                    {onToggleAnnotation && (
                        <Button
                            variant={isAnnotationMode ? "default" : "ghost"}
                            size="icon"
                            onClick={onToggleAnnotation}
                            className={`w-8 h-8 rounded-full ${isAnnotationMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                            title={isAnnotationMode ? "Exit Fullscreen Annotation" : "Live Pen Overlay on Whole Screen"}
                        >
                            {isAnnotationMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExport}
                        className="w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title="Export Board to PDF"
                    >
                        <Printer className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={setBackground}
                        className="w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        title={`Background: ${bgMode}`}
                    >
                        {bgMode === 'white' && <Sun className="w-4 h-4 text-amber-500" />}
                        {bgMode === 'black' && <Moon className="w-4 h-4 text-indigo-400" />}
                        {bgMode === 'grid' && <Grid3X3 className="w-4 h-4 text-emerald-500" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(true)}
                        className="w-7 h-7 rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-500 ml-0.5"
                        title="Collapse Toolbar"
                    >
                        <Minimize2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Quick Zoom Pod */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800 shadow-xl shadow-indigo-950/10 rounded-full p-1 flex flex-col gap-0.5 mb-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => boardRef.current?.zoomIn()}
                    className="w-6 h-6 rounded-full text-gray-600 dark:text-gray-300"
                    title="Zoom In"
                >
                    <ZoomIn className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => boardRef.current?.resetView()}
                    className="w-6 h-6 rounded-full text-gray-600 dark:text-gray-300"
                    title="Reset Zoom (100%)"
                >
                    <Layout className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => boardRef.current?.zoomOut()}
                    className="w-6 h-6 rounded-full text-gray-600 dark:text-gray-300"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-3 h-3" />
                </Button>
            </div>
        </motion.div>
    );
};

// Sub-components
const ToolButton = ({ isActive, onClick, icon, tooltip }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, tooltip: string }) => (
    <Button
        variant={isActive ? "default" : "ghost"}
        size="icon"
        onClick={onClick}
        className={`rounded-xl w-8 h-8 transition-all ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 shadow text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        title={tooltip}
    >
        {icon}
    </Button>
);

const ShapeBtn = ({ tool, current, set, icon, title }: { tool: ToolType, current: ToolType, set: (t: ToolType) => void, icon: React.ReactNode, title?: string }) => (
    <Button
        variant={current === tool ? "default" : "outline"}
        size="icon"
        className={`w-9 h-9 rounded-xl ${current === tool ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-slate-700'}`}
        onClick={() => set(tool)}
        title={title}
    >
        {icon}
    </Button>
);
