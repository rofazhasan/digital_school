"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

// --- Types ---
export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'semigloss' | 'laser' | 'move';

export interface SmartBoardRef {
    clear: () => void;
    undo: () => void;
    redo: () => void;
    setTool: (tool: ToolType) => void;
    setColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    resetView: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
}

interface SmartBoardProps {
    className?: string;
    onDrawEnd?: () => void;
    backgroundColor?: string; // 'white', 'black', 'grid'
}

type Point = { x: number; y: number };

// A stroke is a collection of points with style
interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: ToolType;
    id: string; // Unique ID for eraser logic if needed
}

const SmartBoard = forwardRef<SmartBoardRef, SmartBoardProps>(({
    className,
    onDrawEnd,
    backgroundColor = 'white'
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- State ---
    const [tool, setTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);

    // History (Vector Paths)
    const [paths, setPaths] = useState<Stroke[]>([]);
    const [historyStep, setHistoryStep] = useState(0); // Points to the *next* empty slot
    // We store ALL paths in `paths`, but render up to `historyStep`.

    // View Transform
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
    const [laserPoint, setLaserPoint] = useState<Point | null>(null);

    // --- Helpers ---
    const getScreenPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        // Returns coordinates relative to the Canvas DOM element (top-left 0,0)
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
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const toWorldPoint = (screenPoint: Point): Point => {
        // Convert screen coordinates to world (infinite canvas) coordinates
        return {
            x: (screenPoint.x - offset.x) / scale,
            y: (screenPoint.y - offset.y) / scale
        };
    };

    // --- Rendering ---
    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        // Smooth curves using quadratic Bezier
        for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        }
        // Connect last point
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.width;

        if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.3;
            ctx.globalCompositeOperation = 'source-over'; // Multiply often looks better but source-over is standard
            ctx.strokeStyle = stroke.color;
        } else if (stroke.tool === 'eraser') {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'destination-out'; // Masking!
            ctx.strokeStyle = '#000000'; // Color doesn't matter for destination-out
        } else {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }

        ctx.stroke();

        // Reset composite for safety
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (backgroundColor !== 'grid') return;

        const gridSize = 50 * scale;
        const offsetX = offset.x % gridSize;
        const offsetY = offset.y % gridSize;

        ctx.beginPath();
        ctx.strokeStyle = '#e2e8f0'; // slate-200
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = offsetX; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        // Horizontal lines
        for (let y = offsetY; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    };

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Clear Screen
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to clear full buffer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Background
        if (backgroundColor === 'black') {
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backgroundColor === 'grid') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawGrid(ctx, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. Apply View Transform
        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

        // 4. Draw Paths (up to historyStep)
        // We use an offscreen buffer strategy implicitly by just redrawing fast.
        // For 'eraser' to work as true erasure, we might need layers, but 'destination-out' 
        // works on the accumulated canvas content.

        const visiblePaths = paths.slice(0, historyStep);
        visiblePaths.forEach(path => drawStroke(ctx, path));

        // 5. Draw Current Stroke (Preview)
        if (currentStroke) {
            drawStroke(ctx, currentStroke);
        }

        // 6. Draw Laser (Transient)
        if (laserPoint) {
            ctx.beginPath();
            ctx.arc(laserPoint.x, laserPoint.y, 5 / scale, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            // Glow
            ctx.beginPath();
            ctx.arc(laserPoint.x, laserPoint.y, 15 / scale, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fill();
        }

    }, [scale, offset, paths, historyStep, currentStroke, backgroundColor, laserPoint]);

    // Animation Loop
    useEffect(() => {
        let animationFrameId: number;
        const renderLoop = () => {
            redraw();
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [redraw]);

    // Handle Resize
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            const parent = containerRef.current;
            if (canvas && parent) {
                const rect = parent.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            }
        };
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    // --- Inputs ---
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on touch
        const screenPoint = getScreenPoint(e);
        const worldPoint = toWorldPoint(screenPoint);

        // Middle Click or Spacebar (simulated) -> Pan
        // Or Tool == Move
        if (tool === 'move' || ('button' in e && e.button === 1)) {
            setIsPanning(true);
            setLastPanPoint(screenPoint);
            return;
        }

        if (tool === 'laser') {
            setIsDrawing(true); // Treat as drawing for capture
            setLaserPoint(worldPoint);
            return;
        }

        // Start Drawing
        setIsDrawing(true);
        setCurrentStroke({
            points: [worldPoint],
            color: tool === 'eraser' ? '#000000' : color,
            width: lineWidth * (tool === 'highlighter' ? 5 : tool === 'eraser' ? 5 : 1),
            tool: tool === 'semigloss' ? 'pen' : tool, // Map semi? No, custom logic if needed.
            id: Date.now().toString()
        });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const screenPoint = getScreenPoint(e);
        const worldPoint = toWorldPoint(screenPoint);

        if (isPanning && lastPanPoint) {
            const dx = screenPoint.x - lastPanPoint.x;
            const dy = screenPoint.y - lastPanPoint.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPanPoint(screenPoint);
            return;
        }

        if (tool === 'laser' && isDrawing) {
            setLaserPoint(worldPoint);
            return;
        }

        if (isDrawing && currentStroke) {
            // Append point
            setCurrentStroke(prev => prev ? {
                ...prev,
                points: [...prev.points, worldPoint]
            } : null);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        setIsPanning(false);
        setLastPanPoint(null);
        setLaserPoint(null);

        if (currentStroke) {
            // Commit stroke to history
            // Remove any "redo" history if we diverged
            const newPaths = paths.slice(0, historyStep);
            newPaths.push(currentStroke);
            setPaths(newPaths);
            setHistoryStep(newPaths.length);
            setCurrentStroke(null);

            if (onDrawEnd) onDrawEnd();
        }
    };

    // Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 5);

            // Zoom towards mouse pointer logic could go here
            // distinct zoom-center logic omitted for brevity, focusing on center-screen or simple scale
            setScale(newScale);
        } else {
            // Pan
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // --- Exposed Methods ---
    useImperativeHandle(ref, () => ({
        clear: () => {
            // We don't delete history, we act like "clear" is a big erase? 
            // Or actually clear? Standard clear usually wipes.
            setPaths([]);
            setHistoryStep(0);
        },
        undo: () => setHistoryStep(prev => Math.max(0, prev - 1)),
        redo: () => setHistoryStep(prev => Math.min(paths.length, prev + 1)),
        setTool,
        setColor,
        setLineWidth,
        resetView: () => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        },
        zoomIn: () => setScale(s => Math.min(s * 1.2, 5)),
        zoomOut: () => setScale(s => Math.max(s / 1.2, 0.1)),
    }));

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden touch-none ${className}`}>
            <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onWheel={handleWheel}
                className="block cursor-crosshair"
            />
        </div>
    );
});

SmartBoard.displayName = "SmartBoard";

export default SmartBoard;
