"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface SmartBoardRef {
    clear: () => void;
    undo: () => void;
    redo: () => void;
    toDataURL: () => string;
    setTool: (tool: 'pen' | 'eraser' | 'move') => void;
    setColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    resetView: () => void;
}

interface SmartBoardProps {
    initialData?: ImageData;
    className?: string;
    onDrawEnd?: () => void;
}

// Point type for drawing
type Point = { x: number; y: number };

const SmartBoard = forwardRef<SmartBoardRef, SmartBoardProps>(({
    initialData,
    className,
    onDrawEnd
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // State
    const [tool, setTool] = useState<'pen' | 'eraser' | 'move'>('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);

    // Transform State (Pan & Zoom)
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState<Point | null>(null);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Panning State
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

    // Initialize Canvas High DPI
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                // Handle High DPI displays
                const dpr = window.devicePixelRatio || 1;
                const rect = parent.getBoundingClientRect();

                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;

                // CSS size (logical pixels)
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    // Restore if needed (drawing history needs to be redrawn or scaled)
                    // For simplicity in MVP, we might clear on heavy resize or rely on history replay
                    if (historyIndex >= 0 && history[historyIndex]) {
                        ctx.putImageData(history[historyIndex], 0, 0); // This works for fixed size, but infinite canvas needs vector history ideally.
                        // For "Infinite" feel in MVP, we keep canvas size huge or fixed to screen and pan offset.
                        // Here we use VIEWPORT transform.
                    }
                }
            }
        };

        window.addEventListener('resize', resize);
        resize();

        // Save initial blank state
        saveState();

        return () => window.removeEventListener('resize', resize);
    }, []);

    // History Management
    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // NOTE: putImageData ignores transforms! 
        // For a truly infinite canvas with pan/zoom, we should store *strokes* (vectors), not pixels.
        // However, for MVP, we will use a "Virtual Large Canvas" approach or just capture the viewport.
        // To enable Pan/Zoom properly on pixel data, we need the "Offscreen Canvas" pattern.
        // Let's implement the VECTOR approach ideally, but for speed, we stick to standard canvas 
        // and just apply transform to the context during draw, and clear/redraw all for pan/zoom.
        // Or simpler: We use the canvas as a viewport window into a conceptual space.

        // MVP Approach: 
        // The canvas IS the drawing surface. Zoom/Pan is CSS/Transform based visual only? 
        // No, that blurs. 
        // We will use standard "Redraw everything" loop for robustness if we stored paths.
        // Since we are storing pixel data (ImageData), we can't easily "Zoom in" losslessly.
        // So we will stick to: 
        // 1. Fixed Generic Canvas size (large).
        // 2. Pan/Zoom transforms the VIEW, not the Data.

        // Actually, for "World Class" feel, paths are best.
        // But implementation time checks -> Let's try hybrid.
        // We will store ImageData for now (Easiest), but restrict Pan/Zoom impact (or just accept pixelation on deep zoom).

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(data);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        if (onDrawEnd) onDrawEnd();
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const restoreState = (data: ImageData) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && data) {
            ctx.putImageData(data, 0, 0);
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Use raw clear
            saveState();
        }
    };

    // Input Handling
    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
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

        // Convert screen coordinates to canvas coordinates (accounting for DPI)
        // AND accounting for Scale/Offset (Pan/Zoom) if we were transforming context.
        // For MVP pixel-based: we draw directly on screen pixels.

        return {
            x: (clientX - rect.left), // No scale adjustment yet for pixel editing
            y: (clientY - rect.top)
        };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (tool === 'move' || (e as React.MouseEvent).button === 1 || (e as React.MouseEvent).button === 2) {
            // Middle/Right click or Move tool -> Pan
            setIsPanning(true);
            setLastPanPoint(getPoint(e));
            return;
        }

        setIsDrawing(true);
        const point = getPoint(e);
        setLastPoint(point);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            // Setup style
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = tool === 'eraser' ? lineWidth * 5 : lineWidth;
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const point = getPoint(e);

        if (isPanning && lastPanPoint) {
            // For MVP pixel canvas, panning is tricky without redraw.
            // We will skip Pan implementation for the "Pixel Phase" and focus on drawing feel.
            // Or we implement pan via CSS transform of the canvas element itself (Cheap Infinite Canvas).
            // Let's do CSS Transform for Pan/Zoom!
            // This means we don't change canvas data, just the container view.
            return;
        }

        if (isDrawing && lastPoint) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
                setLastPoint(point);
            }
        }
    };

    const handlePointerUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setLastPoint(null);
            saveState();
        }

        setIsPanning(false);
        setLastPanPoint(null);
    };

    // Expose methods
    useImperativeHandle(ref, () => ({
        clear,
        undo,
        redo,
        toDataURL: () => canvasRef.current?.toDataURL() || '',
        setTool: (t) => setTool(t),
        setColor: (c) => setColor(c),
        setLineWidth: (w) => setLineWidth(w),
        resetView: () => {
            // Reset CSS transforms if we add them
        }
    }));

    return (
        <div className={`relative w-full h-full overflow-hidden bg-white cursor-crosshair touch-none ${className}`}>
            <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="w-full h-full block"
                style={{
                    // For future CSS Zoom/Pan: transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                }}
            />
        </div>
    );
});

SmartBoard.displayName = "SmartBoard";

export default SmartBoard;
