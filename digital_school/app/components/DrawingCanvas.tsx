"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Undo, Redo, Save, Eraser, PenTool, X, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
    backgroundImage: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
    initialData?: string; // For future edit support
}

export default function DrawingCanvas({ backgroundImage, onSave, onCancel }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#EF4444'); // Default red for grading
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
    const [isTrafficSaving, setIsTrafficSaving] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = backgroundImage;
        img.onload = () => {
            // Fit to screen but keep aspect ratio, and enforce max storage dimensions
            const screenMaxWidth = window.innerWidth * 0.8;
            const screenMaxHeight = window.innerHeight * 0.7;
            const MAX_STORAGE_DIM = 1280; // Limit processing/storage size

            let w = img.width;
            let h = img.height;

            const ratio = Math.min(screenMaxWidth / w, screenMaxHeight / h, MAX_STORAGE_DIM / w, MAX_STORAGE_DIM / h);
            w = w * ratio;
            h = h * ratio;

            canvas.width = w;
            canvas.height = h;
            setImageSize({ width: w, height: h });

            ctx.drawImage(img, 0, 0, w, h);
            saveHistory(); // Save initial state
        };
    }, [backgroundImage]);

    const saveHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(data);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            // Eraser acts as white paint for simple implementation over image
            // But over an image, "erasing" usually means restoring the image?
            // A true layer system is complex. Simple approach: Eraser paints white (assuming white paper) 
            // OR we just use it as white paint which covers the text.
            // Usually for grading, "erasing" implies removing the *annotation* not the paper.
            // But single canvas combines them.
            // Let's stick to "white paint" for eraser for now, as splitting layers is harder.
            // Actually, standard grading behavior is often just painting white to cover mistakes or red for marks.
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (tool === 'eraser') {
                // hack for erasing over image: we can't easily restore underneath without layers.
                // Maybe just don't support eraser or make it clear it paints white.
            }
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.closePath();
            saveHistory();
        }
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const step = historyStep - 1;
            setHistoryStep(step);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx && history[step]) {
                ctx.putImageData(history[step], 0, 0);
            }
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsTrafficSaving(true);
        canvas.toBlob((blob) => {
            if (blob) {
                onSave(blob);
            }
            setIsTrafficSaving(false);
        }, 'image/jpeg', 0.6); // Reduced quality for storage optimization
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-700 rounded-md p-1">
                        <button
                            onClick={() => { setTool('pen'); setColor('#EF4444'); }}
                            className={cn("p-2 rounded transition-colors", tool === 'pen' && color === '#EF4444' ? "bg-red-500 text-white" : "hover:bg-gray-600")}
                            title="Red Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-red-500 border border-white/20"></div>
                        </button>
                        <button
                            onClick={() => { setTool('pen'); setColor('#10B981'); }}
                            className={cn("p-2 rounded transition-colors", tool === 'pen' && color === '#10B981' ? "bg-green-500 text-white" : "hover:bg-gray-600")}
                            title="Green Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-green-500 border border-white/20"></div>
                        </button>
                        <button
                            onClick={() => { setTool('pen'); setColor('#3B82F6'); }}
                            className={cn("p-2 rounded transition-colors", tool === 'pen' && color === '#3B82F6' ? "bg-blue-500 text-white" : "hover:bg-gray-600")}
                            title="Blue Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-blue-500 border border-white/20"></div>
                        </button>
                    </div>

                    <div className="w-32 px-2">
                        <Slider
                            value={[lineWidth]}
                            onValueChange={(v) => setLineWidth(v[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="cursor-pointer"
                        />
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyStep <= 0} className="text-white hover:bg-gray-700">
                        <Undo className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white hover:bg-gray-700">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isTrafficSaving} className="bg-indigo-600 hover:bg-indigo-700">
                        {isTrafficSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Annotation</>}
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-gray-900 overflow-auto flex items-center justify-center p-4 relative touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="border border-gray-700 rounded bg-white shadow-xl max-w-full max-h-full cursor-crosshair"
                />
            </div>
        </div>
    );
}
