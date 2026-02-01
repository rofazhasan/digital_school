"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Pencil, Eraser, MousePointer2, Highlighter, Move,
    Undo, Redo, ZoomIn, ZoomOut, Layout,
    Box, Circle, Triangle, Square, Minus, Ruler, BarChart2,
    Palette, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Sun, Moon, Grid3X3, Check, Timer, Eye, EyeOff, Printer
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

// Define Stopwatch before usage
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
                <Button variant={isRunning ? "default" : "ghost"} size="icon" className={`w-8 h-8 rounded-full ${isRunning ? 'bg-amber-100 text-amber-700 border-amber-200' : 'text-gray-500'}`}>
                    {isRunning ? <span className="text-[10px] font-mono font-bold">{formatTime(time)}</span> : <Timer className="w-4 h-4" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-32 p-2">
                <div className="text-center font-mono text-xl font-bold mb-2">{formatTime(time)}</div>
                <div className="flex justify-center gap-1">
                    <Button size="sm" variant={isRunning ? "destructive" : "default"} onClick={() => setIsRunning(!isRunning)} className="h-7 text-xs">
                        {isRunning ? "Stop" : "Start"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsRunning(false); setTime(0); }} className="h-7 text-xs">
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
    isAnnotationMode = false,
    onToggleAnnotation
}) => {
    // Local State to track Active Tool for UI highlighting
    // (Actual state is effectively in SmartBoard, but we mirror it here for UI)
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [activeColor, setActiveColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [bgMode, setBgMode] = useState<'white' | 'black' | 'grid'>('white');

    // Collapse State
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Ref for hidden PDF container
    const hiddenPDFContainerRef = useRef<HTMLDivElement>(null);

    // Helpers
    const setTool = (t: ToolType) => {
        setActiveTool(t);
        boardRef.current?.setTool(t);
    };

    const setColor = (c: string) => {
        setActiveColor(c);
        boardRef.current?.setColor(c);
        // Auto-switch to pen if eraser/move was active
        if (activeTool === 'eraser' || activeTool === 'move') {
            setTool('pen');
        }
    };

    const setBackground = () => {
        const next = bgMode === 'white' ? 'grid' : bgMode === 'grid' ? 'black' : 'white';
        setBgMode(next);

        // Auto-contrast color
        const newColor = next === 'black' ? '#ffffff' : '#000000';
        setActiveColor(newColor);
        boardRef.current?.setColor(newColor);
        setTool('pen');
    };

    // Keyboard Shortcuts (optional, can add later)

    if (isCollapsed) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 no-print"
            >
                <Button
                    onClick={() => setIsCollapsed(false)}
                    className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 flex items-center justify-center transition-transform hover:scale-110"
                    title="Open Toolbar"
                >
                    <Pencil className="w-6 h-6" />
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-end gap-2 no-print"
        >
            {/* Main Dock */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl shadow-indigo-900/10 rounded-2xl p-2 flex items-center gap-2">

                {/* 1. Navigation Group */}
                <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                    <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentIndex === 0} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-xs font-mono font-medium text-gray-400 min-w-[3ch] text-center">
                        {currentIndex + 1}
                    </span>
                    <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex === totalQuestions - 1} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* 2. Primary Tools */}
                <div className="flex items-center gap-1">
                    <ToolButton
                        isActive={activeTool === 'move'}
                        onClick={() => setTool('move')}
                        icon={<Move className="w-5 h-5" />}
                        tooltip="Pan (Move Canvas)"
                    />

                    <ToolButton
                        isActive={activeTool === 'select'}
                        onClick={() => setTool('select')}
                        icon={<MousePointer2 className="w-5 h-5 rotate-[-45deg]" />}
                        tooltip="Select & Move Object"
                    />

                    {/* Pen with Size Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative group">
                                <ToolButton
                                    isActive={activeTool === 'pen'}
                                    onClick={() => setTool('pen')}
                                    icon={<Pencil className="w-5 h-5" />}
                                    tooltip="Pen (Hold for Size)"
                                />
                                {/* Color dot indicator */}
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full border border-white/50" style={{ backgroundColor: activeColor }} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-48 p-3 mb-2">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Stroke Width</span>
                                    <span>{strokeWidth}px</span>
                                </div>
                                <Slider
                                    value={[strokeWidth]}
                                    min={1} max={20} step={1}
                                    onValueChange={([v]) => { setStrokeWidth(v); boardRef.current?.setLineWidth(v); }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    <ToolButton
                        isActive={activeTool === 'highlighter'}
                        onClick={() => setTool('highlighter')}
                        icon={<Highlighter className="w-5 h-5" />}
                        tooltip="Highlighter"
                    />

                    {/* Eraser with Size */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative group">
                                <ToolButton
                                    isActive={activeTool === 'eraser'}
                                    onClick={() => setTool('eraser')}
                                    icon={<Eraser className="w-5 h-5" />}
                                    tooltip="Eraser (Hold for Size)"
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-48 p-3 mb-2">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Eraser Width</span>
                                    <span>{strokeWidth}px</span>
                                </div>
                                <Slider
                                    value={[strokeWidth]}
                                    min={5} max={50} step={5}
                                    onValueChange={([v]) => { setStrokeWidth(v); boardRef.current?.setLineWidth(v); }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* 3. Dropdowns (Shapes & Colors) */}
                <div className="flex items-center gap-1">
                    {/* Shapes Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={['line', 'rect', 'circle', 'triangle', 'cube', 'axis'].includes(activeTool) ? 'default' : 'ghost'} size="icon" className="rounded-xl w-9 h-9">
                                <Box className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-auto p-2 mb-2 grid grid-cols-4 gap-1">
                            <ShapeBtn tool="line" current={activeTool} set={setTool} icon={<Ruler className="w-4 h-4" />} />
                            <ShapeBtn tool="rect" current={activeTool} set={setTool} icon={<Square className="w-4 h-4" />} />
                            <ShapeBtn tool="circle" current={activeTool} set={setTool} icon={<Circle className="w-4 h-4" />} />
                            <ShapeBtn tool="triangle" current={activeTool} set={setTool} icon={<Triangle className="w-4 h-4" />} />
                            <ShapeBtn tool="cube" current={activeTool} set={setTool} icon={<Box className="w-4 h-4" />} />
                            <ShapeBtn tool="axis" current={activeTool} set={setTool} icon={<BarChart2 className="w-4 h-4" />} />
                        </PopoverContent>
                    </Popover>

                    {/* Colors Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 relative">
                                <Palette className="w-5 h-5 text-gray-600" />
                                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: activeColor }} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-48 p-3 mb-2 grid grid-cols-4 gap-2">
                            {['#000000', '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EC4899', '#FFFFFF'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === c ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* 4. Actions & Minimize */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => boardRef.current?.undo()} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100">
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => boardRef.current?.redo()} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100">
                        <Redo className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    {/* Stopwatch */}
                    <Stopwatch />

                    {/* Annotation Toggle */}
                    {onToggleAnnotation && (
                        <Button
                            variant={isAnnotationMode ? "default" : "ghost"}
                            size="icon"
                            onClick={onToggleAnnotation}
                            className={`w-8 h-8 rounded-full ${isAnnotationMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            title={isAnnotationMode ? "Exit Annotation Mode" : "Annotate Over Content"}
                        >
                            {isAnnotationMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                    )}

                    {/* Printer / Export */}
                    <Button variant="ghost" size="icon" onClick={onExport} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100" title="Export PDF">
                        <Printer className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={setBackground} className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100">
                        {bgMode === 'white' && <Sun className="w-4 h-4" />}
                        {bgMode === 'black' && <Moon className="w-4 h-4 text-indigo-400" />}
                        {bgMode === 'grid' && <Grid3X3 className="w-4 h-4" />}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="w-8 h-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 ml-1">
                        <Minimize2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* View Controls (Zoom/Reset) - Separate small pill */}
            <div className="bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-full p-1 flex flex-col gap-1 mb-2">
                <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomIn()} className="w-6 h-6 rounded-full">
                    <ZoomIn className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => boardRef.current?.resetView()} className="w-6 h-6 rounded-full">
                    <Layout className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => boardRef.current?.zoomOut()} className="w-6 h-6 rounded-full">
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
        className={`rounded-xl w-10 h-10 transition-all ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        title={tooltip}
    >
        {icon}
    </Button>
);

const ShapeBtn = ({ tool, current, set, icon }: { tool: ToolType, current: ToolType, set: (t: ToolType) => void, icon: React.ReactNode }) => (
    <Button
        variant={current === tool ? "default" : "outline"}
        size="icon"
        className={`w-full h-9 ${current === tool ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'}`}
        onClick={() => set(tool)}
    >
        {icon}
    </Button>
);
