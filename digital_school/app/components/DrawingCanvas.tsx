"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Undo, 
  Save, 
  Eraser, 
  PenTool, 
  X, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Trash2,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: 'pen' | 'eraser';
}

interface TextAnnotation {
    x: number;
    y: number;
    text: string;
    color: string;
    size: number;
    id: string;
}

interface DrawingCanvasProps {
    backgroundImage: string;
    onSave?: (blob: Blob, drawingData: { strokes: Stroke[], texts: TextAnnotation[] }) => void;
    onCancel: () => void;
    readOnly?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    currentIndex?: number;
    totalImages?: number;
    initialStrokes?: Stroke[];
    initialTexts?: TextAnnotation[];
}

export default function DrawingCanvas({ 
    backgroundImage, 
    onSave, 
    onCancel, 
    readOnly = false,
    onNext,
    onPrev,
    currentIndex = 0,
    totalImages = 0,
    initialStrokes = [],
    initialTexts = []
}: DrawingCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#EF4444');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState<'pen' | 'eraser' | 'text'>('pen');
    
    // Zoom & Pan State
    const [scale, setScale] = useState(1);
    const [baseFitScale, setBaseFitScale] = useState(1); // Scale to fit into container
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 }); // Current displayed size
    const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 }); // Original image size
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    
    // Data State
    const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
    const [texts, setTexts] = useState<TextAnnotation[]>(initialTexts);
    const [history, setHistory] = useState<{ strokes: Stroke[], texts: TextAnnotation[] }[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);
    
    // UI State
    const [imgLoaded, setImgLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [activeTextInput, setActiveTextInput] = useState<{ x: number, y: number } | null>(null);
    const [currentText, setCurrentText] = useState("");
    const imgRef = useRef<HTMLImageElement | null>(null);
    const canvasSizeRef = useRef({ width: 0, height: 0 });
    const renderReqRef = useRef<number | null>(null);

    // Refs for real-time listener values (to avoid stale closures in handleWheel)
    const scaleRef = useRef(scale);
    const offsetRef = useRef(offset);
    
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { offsetRef.current = offset; }, [offset]);

    // Initialize Canvas & Image
    useEffect(() => {
        if (!backgroundImage) {
            setImgLoaded(false);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = backgroundImage;
        setImgLoaded(false); // Reset loading state when source changes
        
        img.onload = () => {
            const container = containerRef.current;
            if (!container) return;

            const maxWidth = container.clientWidth - 40;
            const maxHeight = container.clientHeight - 40;
            
            const nw = img.width;
            const nh = img.height;
            const ratio = Math.min(maxWidth / nw, maxHeight / nh);
            
            setNaturalDimensions({ width: nw, height: nh });
            setImageDimensions({ width: nw * ratio, height: nh * ratio });
            setBaseFitScale(ratio); // Keep record of how we fitted it
            
            imgRef.current = img;
            canvasSizeRef.current = { width: nw, height: nh };
            setImgLoaded(true);
            resetZoom();
        };

        img.onerror = () => {
            console.error("Failed to load image:", backgroundImage);
            setImgLoaded(false);
        };
    }, [backgroundImage]);

    // Redraw loop using requestAnimationFrame for butter-smooth performance
    useEffect(() => {
        if (!imgLoaded) return;
        
        const requestRender = () => {
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
            renderReqRef.current = requestAnimationFrame(drawEverything);
        };

        requestRender();
        return () => {
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current);
        };
    }, [imgLoaded, strokes, texts, showAnnotations, scale, offset]);

    const drawEverything = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imgLoaded) return;

        const qCtx = canvas.getContext('2d');
        if (!qCtx) return;

        // Clear Current Annotation Layer
        qCtx.clearRect(0, 0, canvas.width, canvas.height);

        if (!showAnnotations) return;

        // Draw Strokes with Professional Smoothing
        strokes.forEach(stroke => {
            if (stroke.points.length === 0) return;

            qCtx.beginPath();
            qCtx.strokeStyle = stroke.color;
            qCtx.lineWidth = stroke.width;
            qCtx.lineCap = 'round';
            qCtx.lineJoin = 'round';
            
            if (stroke.tool === 'eraser') {
                qCtx.globalCompositeOperation = 'destination-out';
            } else {
                qCtx.globalCompositeOperation = 'source-over';
            }

            qCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
            
            if (stroke.points.length < 3) {
                stroke.points.forEach(p => qCtx.lineTo(p.x, p.y));
            } else {
                for (let i = 1; i < stroke.points.length - 2; i++) {
                    const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
                    const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
                    qCtx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
                }
                const n = stroke.points.length;
                qCtx.quadraticCurveTo(
                    stroke.points[n - 2].x, 
                    stroke.points[n - 2].y, 
                    stroke.points[n - 1].x, 
                    stroke.points[n - 1].y
                );
            }
            qCtx.stroke();
        });

        // Draw Texts with Visibility Halo
        qCtx.globalCompositeOperation = 'source-over';
        texts.forEach(t => {
            qCtx.font = `bold ${t.size}px Arial, "Nikosh", sans-serif`;
            
            // Text shadow/halo for visibility on any background
            qCtx.strokeStyle = 'white';
            qCtx.lineWidth = Math.max(1, t.size / 10);
            qCtx.strokeText(t.text, t.x, t.y);
            
            qCtx.fillStyle = t.color;
            qCtx.fillText(t.text, t.x, t.y);
        });
    }, [strokes, texts, showAnnotations, imgLoaded]);

    const saveToHistory = (newStrokes: Stroke[], newTexts: TextAnnotation[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push({ strokes: [...newStrokes], texts: [...newTexts] });
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const prev = history[historyStep - 1];
            setStrokes(prev.strokes);
            setTexts(prev.texts);
            setHistoryStep(historyStep - 1);
        } else if (historyStep === 0) {
            setStrokes([]);
            setTexts([]);
            setHistoryStep(-1);
        }
    };

    const resetZoom = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleZoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
    };

    const getMousePos = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Map screen coordinates to original image pixel coordinates
        // (clientX - rect.left) / (baseFitScale * scale)
        return {
            x: (clientX - rect.left) / (baseFitScale * scale),
            y: (clientY - rect.top) / (baseFitScale * scale)
        };
    };

    const startAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        
        if (tool === 'text') {
            const pos = getMousePos(e);
            setActiveTextInput({ x: pos.x, y: pos.y });
            return;
        }

        setIsDrawing(true);
        const pos = getMousePos(e);
        const newStroke: Stroke = {
            points: [pos],
            color: color,
            width: lineWidth,
            tool: tool as 'pen' | 'eraser'
        };
        setStrokes(prev => [...prev, newStroke]);
    };

    const performAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || tool === 'text') return;
        const pos = getMousePos(e);
        setStrokes(prev => {
            const last = [...prev];
            const current = last[last.length - 1];
            current.points.push(pos);
            return last;
        });
    };

    const endAction = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory(strokes, texts);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentText.trim() && activeTextInput) {
            const newText: TextAnnotation = {
                ...activeTextInput,
                text: currentText,
                color: color,
                size: lineWidth * 5, // Scaling font size with line width
                id: Date.now().toString()
            };
            const updatedTexts = [...texts, newText];
            setTexts(updatedTexts);
            saveToHistory(strokes, updatedTexts);
            setCurrentText("");
            setActiveTextInput(null);
        }
    };

    const handleSaveFlattened = () => {
        const canvas = canvasRef.current;
        if (!canvas || !onSave) return;

        setIsSaving(true);
        
        // Create a temporary canvas to combine them
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = naturalDimensions.width;
        finalCanvas.height = naturalDimensions.height;
        const fCtx = finalCanvas.getContext('2d');
        if (!fCtx) return;

        // Draw background image
        if (imgRef.current) {
            fCtx.drawImage(imgRef.current, 0, 0, naturalDimensions.width, naturalDimensions.height);
        }
        
        // Draw annotations
        if (showAnnotations) {
            fCtx.drawImage(canvas, 0, 0);
        }

        finalCanvas.toBlob((blob) => {
            if (blob) {
                onSave(blob, { strokes, texts });
            }
            setIsSaving(false);
        }, 'image/jpeg', 0.85);
    };

    // Zoom & Pan Event Listeners (Professional Feel)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (activeTextInput) return;
            e.preventDefault();
            
            const currentScale = scaleRef.current;
            const currentOffset = offsetRef.current;
            
            const delta = -e.deltaY * 0.001; 
            const newScale = Math.min(Math.max(0.5, currentScale + delta), 5);
            
            if (newScale !== currentScale) {
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Position relative to scaled image
                const imageX = (mouseX - offset.x) / (baseFitScale * scale);
                const imageY = (mouseY - offset.y) / (baseFitScale * scale);

                // New offset to keep the same point under the cursor
                const newOffsetX = mouseX - imageX * (baseFitScale * newScale);
                const newOffsetY = mouseY - imageY * (baseFitScale * newScale);

                setOffset({ x: newOffsetX, y: newOffsetY });
                setScale(newScale);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isPanning && !activeTextInput) {
                e.preventDefault();
                setIsPanning(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') setIsPanning(false);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPanning, activeTextInput, baseFitScale]);

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900 border-b border-slate-800 gap-3 z-20">
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onPrev} 
                            disabled={!onPrev || currentIndex === 0}
                            className="h-8 w-8 hover:bg-slate-700"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-x border-slate-700">
                            {currentIndex !== undefined ? `${currentIndex + 1} / ${totalImages}` : 'Image'}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onNext} 
                            disabled={!onNext || (currentIndex !== undefined && totalImages !== undefined && currentIndex === totalImages - 1)}
                            className="h-8 w-8 hover:bg-slate-700"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                    <div className="flex gap-1 items-center bg-slate-800/50 p-1 rounded-lg">
                        <Button variant="ghost" size="icon" onClick={() => handleZoom(0.2)} className="h-8 w-8 text-slate-300">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.2)} className="h-8 w-8 text-slate-300">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={resetZoom} className="h-8 w-8 text-slate-300">
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button
                                onClick={() => setTool('pen')}
                                className={cn("p-2 rounded-md transition-all", tool === 'pen' ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-slate-700 text-slate-400")}
                            >
                                <PenTool className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={cn("p-2 rounded-md transition-all", tool === 'eraser' ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-slate-700 text-slate-400")}
                            >
                                <Eraser className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setTool('text')}
                                className={cn("p-2 rounded-md transition-all", tool === 'text' ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-slate-700 text-slate-400")}
                            >
                                <Type className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 px-2 bg-slate-800/50 rounded-lg h-10 border border-slate-700/50">
                            {['#EF4444', '#10B981', '#3B82F6', '#F59E0B'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 transition-transform", 
                                        color === c ? "scale-125 border-white shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="w-24 px-2 hidden md:block">
                            <Slider value={[lineWidth]} onValueChange={(v) => setLineWidth(v[0])} min={1} max={10} step={1} />
                        </div>

                        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyStep < 0} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <Undo className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowAnnotations(!showAnnotations)} className="text-slate-400 hover:bg-slate-800">
                        {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" onClick={onCancel} className="hidden sm:inline-flex text-slate-400 hover:text-white">
                        Close
                    </Button>
                    {!readOnly && (
                        <Button 
                            onClick={handleSaveFlattened} 
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 shadow-lg px-6"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Canvas Viewport */}
            <div 
                ref={containerRef}
                className={cn(
                    "flex-1 relative overflow-hidden flex items-center justify-center p-8 transition-colors duration-300",
                    isPanning ? "cursor-grabbing bg-slate-900" : "bg-slate-950"
                )}
                onMouseDown={(e) => {
                    if (e.button === 1 || isPanning) {
                        setIsPanning(true);
                        setLastPanPos({ x: e.clientX, y: e.clientY });
                    }
                }}
                onMouseMove={(e) => {
                    if (isPanning) {
                        const dx = e.clientX - lastPanPos.x;
                        const dy = e.clientY - lastPanPos.y;
                        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                        setLastPanPos({ x: e.clientX, y: e.clientY });
                    }
                }}
                onMouseUp={() => {
                    if (!isPanning) return;
                    setIsPanning(false);
                }}
            >
                {!imgLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Loading Document...</span>
                    </div>
                )}

                <div 
                    style={{ 
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${baseFitScale * scale})`,
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        visibility: imgLoaded ? 'visible' : 'hidden',
                        opacity: imgLoaded ? 1 : 0
                    }}
                    className="relative shadow-2xl ring-1 ring-white/10 rounded-sm overflow-hidden bg-white"
                >
                    {/* Tooltip for Panning */}
                    {!readOnly && scale > 1 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            Hold SPACE to Pan
                        </div>
                    )}

                    {/* Native Background Layer */}
                    <img 
                        src={backgroundImage}
                        alt="Question"
                        style={{ 
                            width: naturalDimensions.width, 
                            height: naturalDimensions.height,
                            display: 'block'
                        }}
                        className="bg-white pointer-events-none"
                    />

                    {/* Annotation Canvas Layers */}
                    <canvas
                        ref={canvasRef}
                        width={naturalDimensions.width}
                        height={naturalDimensions.height}
                        onMouseDown={startAction}
                        onMouseMove={performAction}
                        onMouseUp={endAction}
                        onMouseLeave={endAction}
                        onTouchStart={startAction}
                        onTouchMove={performAction}
                        onTouchEnd={endAction}
                        className={cn(
                            "absolute inset-0 z-10 touch-none",
                            readOnly ? "cursor-default" : isPanning ? "cursor-grabbing" : tool === 'text' ? "cursor-text" : "cursor-crosshair"
                        )}
                    />

                    {/* Active Text Input Overlay */}
                    {activeTextInput && (
                        <div 
                            className="absolute z-20 pointer-events-auto"
                            style={{ 
                                left: `${activeTextInput.x}px`, 
                                top: `${activeTextInput.y}px`,
                                transform: 'translateY(-100%)'
                            }}
                        >
                            <form onSubmit={handleTextSubmit} className="flex flex-col bg-slate-900 border border-indigo-500 rounded-lg p-2 shadow-2xl min-w-[200px]">
                                <input 
                                    autoFocus
                                    className="bg-transparent text-white border-none outline-none p-1 text-sm mb-2"
                                    placeholder="Type feedback here..."
                                    value={currentText}
                                    onChange={(e) => setCurrentText(e.target.value)}
                                    // Language support notes: Bengali works natively in HTML inputs
                                />
                                <div className="flex justify-end gap-1">
                                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setActiveTextInput(null)}>Cancel</Button>
                                    <Button type="submit" size="sm" className="h-6 px-2 text-[10px] bg-indigo-600">Add Text</Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                
                {/* Navigation Floating UI for Results Page */}
                {readOnly && totalImages && totalImages > 1 && (
                   <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 gap-4 shadow-2xl z-30">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onPrev} 
                            disabled={currentIndex === 0}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex gap-1 overflow-x-auto max-w-[200px] py-1">
                            {Array.from({ length: totalImages }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        i === currentIndex ? "bg-indigo-500 scale-125 w-4" : "bg-white/30"
                                    )}
                                />
                            ))}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onNext} 
                            disabled={currentIndex === totalImages - 1}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                   </div>
                )}
            </div>
            
            {/* Footer Attribution / Controls */}
            <div className="p-2 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">HD Rendering</span>
                    <span>Supports Bengali & Math Typing</span>
                </div>
                <div className="hidden sm:block italic">
                    Press Spacebar to Pan • Scroll to Zoom
                </div>
            </div>
        </div>
    );
}
