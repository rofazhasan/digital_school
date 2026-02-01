"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

// --- Types ---
export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'semigloss' | 'laser' | 'select' | 'move' | 'line' | 'rect' | 'circle' | 'triangle' | 'right_triangle' | 'axis' | 'cube' | 'diamond';

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
    getCanvas: () => HTMLCanvasElement | null;
    getPaths: () => Stroke[];
    loadPaths: (paths: Stroke[]) => void;
}

interface SmartBoardProps {
    className?: string;
    onDrawEnd?: () => void;
    backgroundColor?: 'white' | 'black' | 'grid' | 'transparent';
}

type Point = { x: number; y: number };

// A stroke is a collection of points with style
export interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: ToolType;
    id: string;
}

interface LaserPoint extends Point {
    time: number;
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
    const [historyStep, setHistoryStep] = useState(0);

    // View Transform
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

    // Laser State (Ref for performance)
    const laserTrailRef = useRef<LaserPoint[]>([]);

    // Selection & Drag State
    const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
    const [isDraggingStroke, setIsDraggingStroke] = useState(false);
    const [dragStartPos, setDragStartPos] = useState<Point | null>(null); // World coordinates
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 }); // World delta

    // --- Helpers ---
    const getScreenPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
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
        return {
            x: (screenPoint.x - offset.x) / scale,
            y: (screenPoint.y - offset.y) / scale
        };
    };

    const isShapeTool = (t: ToolType) => {
        return ['line', 'rect', 'circle', 'triangle', 'right_triangle', 'axis', 'cube', 'diamond'].includes(t);
    };

    // --- Hit Testing ---
    const hitTest = (point: Point, strokes: Stroke[]): string | null => {
        // Reverse iterate to find top-most
        for (let i = strokes.length - 1; i >= 0; i--) {
            const stroke = strokes[i];
            if (stroke.tool === 'laser' || stroke.tool === 'eraser') continue;

            // Simple bounding box check first could optimize, but for now traverse points
            // Check distance to any point in the stroke
            // Threshold varies by stroke width
            const threshold = Math.max(10, stroke.width * 2) / scale;

            for (let j = 0; j < stroke.points.length; j += 2) { // Skip every other point for perf
                const sp = stroke.points[j];
                const dx = sp.x - point.x;
                const dy = sp.y - point.y;
                if (dx * dx + dy * dy < threshold * threshold) {
                    return stroke.id;
                }
            }
        }
        return null;
    };

    // --- Cursors ---
    const getCursor = () => {
        if (tool === 'select') return isDraggingStroke ? 'grabbing' : 'default';
        if (tool === 'move') return isPanning ? 'grabbing' : 'grab';

        const scaleFactor = 1; // standard
        // SVGs for Cursors
        const penSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
        const eraserSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
        const highlighterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 2-7 20-5-5-5-5 5-5 22 2z"/></svg>`; // Rotate or simplify?
        const crosshairSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

        const encode = (svg: string) => `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;

        if (tool === 'pen') return `${encode(penSvg)} 0 24, crosshair`;
        if (tool === 'highlighter') return `${encode(penSvg)} 0 24, crosshair`; // Reuse pen for now or distinctive
        if (tool === 'eraser') return `${encode(eraserSvg)} 12 12, crosshair`;
        if (tool === 'laser') return `${encode(crosshairSvg)} 12 12, crosshair`;

        return 'crosshair';
    };

    // --- Rendering ---
    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, offsetPos: Point = { x: 0, y: 0 }) => {
        if (stroke.points.length < 1) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.width;

        const p1 = { x: stroke.points[0].x + offsetPos.x, y: stroke.points[0].y + offsetPos.y };
        const rawLast = stroke.points[stroke.points.length - 1];
        const p2 = { x: rawLast.x + offsetPos.x, y: rawLast.y + offsetPos.y };

        // Highlighter Logic
        if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'multiply'; // Better blending
            ctx.strokeStyle = stroke.color;
            // Draw regular stroke
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            for (let i = 1; i < stroke.points.length - 1; i++) {
                const pt1 = stroke.points[i];
                const pt2 = stroke.points[i + 1];
                const mid = { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
                ctx.quadraticCurveTo(pt1.x, pt1.y, mid.x, mid.y);
            }
            ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
            ctx.stroke();

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            return;
        }

        if (stroke.tool === 'eraser') {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000000';
        } else {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }

        // Shape Logic
        if (isShapeTool(stroke.tool)) {
            const w = p2.x - p1.x;
            const h = p2.y - p1.y;

            ctx.beginPath();

            if (stroke.tool === 'line') {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            } else if (stroke.tool === 'rect') {
                ctx.rect(p1.x, p1.y, w, h);
            } else if (stroke.tool === 'circle') {
                // Ellipse based on bounding box
                const centerX = p1.x + w / 2;
                const centerY = p1.y + h / 2;
                ctx.ellipse(centerX, centerY, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
            } else if (stroke.tool === 'triangle') {
                // Isosceles
                ctx.moveTo(p1.x + w / 2, p1.y); // Top Middle
                ctx.lineTo(p1.x, p1.y + h);     // Bottom Left
                ctx.lineTo(p1.x + w, p1.y + h); // Bottom Right
                ctx.closePath();
            } else if (stroke.tool === 'right_triangle') {
                ctx.moveTo(p1.x, p1.y);        // Top Left
                ctx.lineTo(p1.x, p1.y + h);    // Bottom Left
                ctx.lineTo(p1.x + w, p1.y + h);// Bottom Right
                ctx.closePath();
            } else if (stroke.tool === 'diamond') {
                ctx.moveTo(p1.x + w / 2, p1.y);
                ctx.lineTo(p1.x + w, p1.y + h / 2);
                ctx.lineTo(p1.x + w / 2, p1.y + h);
                ctx.lineTo(p1.x, p1.y + h / 2);
                ctx.closePath();
            } else if (stroke.tool === 'cube') {
                // Simple 3D Cube
                const d = w * 0.25; // depth offset
                // Front face
                ctx.rect(p1.x, p1.y + d, w - d, h - d);
                // Back face (lines)
                ctx.moveTo(p1.x, p1.y + d); ctx.lineTo(p1.x + d, p1.y);
                ctx.moveTo(p1.x + w - d, p1.y + d); ctx.lineTo(p1.x + w, p1.y);
                ctx.moveTo(p1.x + w - d, p1.y + h); ctx.lineTo(p1.x + w, p1.y + h - d);
                ctx.moveTo(p1.x, p1.y + h); ctx.lineTo(p1.x + d, p1.y + h - d);
                // Back face rect part
                ctx.rect(p1.x + d, p1.y, w - d, h - d);
            } else if (stroke.tool === 'axis') {
                // Cartesian Plane Stencil (Always black/grey usually but uses color)
                // Draw Axis Lines
                ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2, p1.y + h); // Y
                ctx.moveTo(p1.x, p1.y + h / 2); ctx.lineTo(p1.x + w, p1.y + h / 2); // X
                // Arrows (Simple)
                // X Arrow
                ctx.moveTo(p1.x + w, p1.y + h / 2); ctx.lineTo(p1.x + w - 10, p1.y + h / 2 - 5);
                ctx.moveTo(p1.x + w, p1.y + h / 2); ctx.lineTo(p1.x + w - 10, p1.y + h / 2 + 5);
                // Y Arrow
                ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2 - 5, p1.y + 10);
                ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2 + 5, p1.y + 10);
            }

            ctx.stroke();

        } else if (stroke.tool === 'pen' || stroke.tool === 'semigloss' || stroke.tool === 'eraser') {
            // Standard Pen & Eraser
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);

            for (let i = 1; i < stroke.points.length - 1; i++) {
                const rawPt1 = stroke.points[i];
                const rawPt2 = stroke.points[i + 1];
                const pt1 = { x: rawPt1.x + offsetPos.x, y: rawPt1.y + offsetPos.y };
                const pt2 = { x: rawPt2.x + offsetPos.x, y: rawPt2.y + offsetPos.y };
                const mid = { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
                ctx.quadraticCurveTo(pt1.x, pt1.y, mid.x, mid.y);
            }
            const last = stroke.points[stroke.points.length - 1];
            ctx.lineTo(last.x + offsetPos.x, last.y + offsetPos.y);
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => {
        if (backgroundColor !== 'grid') return;

        const startX = -offset.x / scale;
        const startY = -offset.y / scale;
        const endX = (width / dpr - offset.x) / scale;
        const endY = (height / dpr - offset.y) / scale;

        const gridSize = 50;

        ctx.beginPath();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1 / scale;

        // Snap to grid
        const firstLineX = Math.floor(startX / gridSize) * gridSize;
        const firstLineY = Math.floor(startY / gridSize) * gridSize;

        for (let x = firstLineX; x <= endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = firstLineY; y <= endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    };

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        // 1. Clear Screen (Reset transform to identity relative to device pixels)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Background - REMOVED to allow Eraser to work (transparent strokes = show CSS background)
        // If we draw fillRect here, destination-out cuts a hole to the browser body (white).
        // Instead, we rely on the canvas container having the correct background-color via CSS.

        // 3. Apply View Transform (Including DPR!)
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offset.x * dpr, offset.y * dpr);

        if (backgroundColor === 'grid') {
            // drawGrid(ctx, canvas.width, canvas.height, dpr); // Using CSS background for grid now
        }

        // 4. Draw Paths
        const visiblePaths = paths.slice(0, historyStep);
        visiblePaths.forEach(path => {
            if (path.id === selectedStrokeId && isDraggingStroke) {
                // Draw with offset
                drawStroke(ctx, path, dragOffset);
                // Draw highlight box
                // (Optional: Implement bounding box highlight here)
            } else {
                drawStroke(ctx, path);
            }
        });

        // 5. Highlight Selected Static
        if (selectedStrokeId && !isDraggingStroke) {
            const selected = visiblePaths.find(p => p.id === selectedStrokeId);
            if (selected) {
                // Glow effect for selection
                ctx.save();
                ctx.shadowColor = 'blue';
                ctx.shadowBlur = 10;
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = selected.width + 2;
                ctx.globalAlpha = 0.5;
                drawStroke(ctx, selected); // overlay highlight
                ctx.restore();
            }
        }

        // 6. Draw Current Stroke
        if (currentStroke) {
            drawStroke(ctx, currentStroke);
        }

        // 6. Draw Laser Trail
        const now = Date.now();
        if (laserTrailRef.current.length > 0) {
            // Remove points older than 2s
            laserTrailRef.current = laserTrailRef.current.filter(p => now - p.time < 2000);

            if (laserTrailRef.current.length > 1) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                // Draw trail segments with fading opacity
                for (let i = 1; i < laserTrailRef.current.length; i++) {
                    const p1 = laserTrailRef.current[i - 1];
                    const p2 = laserTrailRef.current[i];
                    const age = now - p2.time;
                    const opacity = Math.max(0, 1 - age / 2000); // 2 seconds fade


                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
                    ctx.lineWidth = (10 / scale) * opacity;
                    ctx.stroke();
                }
            }

            // Draw Tip
            const last = laserTrailRef.current[laserTrailRef.current.length - 1];
            if (last) {
                ctx.beginPath();
                ctx.arc(last.x, last.y, 6 / scale, 0, Math.PI * 2);
                ctx.fillStyle = 'red';
                ctx.fill();
                // Glow
                ctx.beginPath();
                ctx.arc(last.x, last.y, 15 / scale, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fill();
            }
        }
    }, [scale, offset, paths, historyStep, currentStroke, backgroundColor, selectedStrokeId, dragOffset, isDraggingStroke]);

    // Laser Animation Loop
    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            const hasLaserTrail = laserTrailRef.current.length > 0;
            if (tool === 'laser' || hasLaserTrail) {
                redraw();
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        if (tool === 'laser') {
            animationFrameId = requestAnimationFrame(animate);
        } else if (laserTrailRef.current.length > 0) {
            // Finish fading out existing trail
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [tool, redraw]);

    // Draw on mount/update
    useEffect(() => {
        redraw();
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
            }
        };
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    // --- Inputs ---
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const screenPoint = getScreenPoint(e);
        const worldPoint = toWorldPoint(screenPoint);

        // Select Tool Logic
        if (tool === 'select') {
            // 1. Check if we clicked on an already selected object to drag it
            // OR 2. Try to hit test a new object

            const hitId = hitTest(worldPoint, paths.slice(0, historyStep));

            if (hitId) {
                setSelectedStrokeId(hitId);
                setIsDraggingStroke(true);
                setDragStartPos(worldPoint);
                setDragOffset({ x: 0, y: 0 });
            } else {
                setSelectedStrokeId(null);
            }
            return;
        }

        if (tool === 'move' || ('button' in e && e.button === 1)) {
            setIsPanning(true);
            setLastPanPoint(screenPoint);
            return;
        }

        if (tool === 'laser') {
            setIsDrawing(true);
            laserTrailRef.current.push({ ...worldPoint, time: Date.now() });
            return;
        }

        setIsDrawing(true);
        setCurrentStroke({
            points: [worldPoint],
            color: tool === 'eraser' ? '#000000' : color,
            width: lineWidth * (tool === 'highlighter' ? 10 : tool === 'eraser' ? 20 : 1),
            tool: tool === 'semigloss' ? 'pen' : tool,
            id: Date.now().toString()
        });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const screenPoint = getScreenPoint(e);
        const worldPoint = toWorldPoint(screenPoint);

        if (isPanning && lastPanPoint) {
            const dx = screenPoint.x - lastPanPoint.x;
            const dy = screenPoint.y - lastPanPoint.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPanPoint(screenPoint);
            return;
        }

        if (isDraggingStroke && dragStartPos && selectedStrokeId) {
            const dx = worldPoint.x - dragStartPos.x;
            const dy = worldPoint.y - dragStartPos.y;
            setDragOffset({ x: dx, y: dy });
            return;
        }

        if (tool === 'laser' && isDrawing) {
            laserTrailRef.current.push({ ...worldPoint, time: Date.now() });
            return;
        }

        if (isDrawing && currentStroke) {
            if (isShapeTool(currentStroke.tool)) {
                // For shapes, we just update the End Point (2nd point)
                setCurrentStroke({
                    ...currentStroke,
                    points: [currentStroke.points[0], worldPoint]
                });
            } else {
                // For freehand, we append
                setCurrentStroke(prev => prev ? {
                    ...prev,
                    points: [...prev.points, worldPoint]
                } : null);
            }
        }
    };

    const handlePointerUp = () => {

        if (isDraggingStroke && selectedStrokeId && dragOffset.x !== 0) {
            // Commit Transform
            const newPaths = paths.map(p => {
                if (p.id === selectedStrokeId) {
                    return {
                        ...p,
                        points: p.points.map(pt => ({ x: pt.x + dragOffset.x, y: pt.y + dragOffset.y }))
                    };
                }
                return p;
            });
            setPaths(newPaths);
            setDragOffset({ x: 0, y: 0 });
            setDragStartPos(null);
            setIsDraggingStroke(false);
            if (onDrawEnd) onDrawEnd();
        }

        setIsDrawing(false);
        setIsPanning(false);
        setLastPanPoint(null);
        setIsDraggingStroke(false);

        if (tool === 'laser') {
            return;
        }

        if (currentStroke) {
            const newPaths = paths.slice(0, historyStep);
            newPaths.push(currentStroke);
            setPaths(newPaths);
            setHistoryStep(newPaths.length);
            setCurrentStroke(null);

            if (onDrawEnd) onDrawEnd();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 5);
            setScale(newScale);
        } else {
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    useImperativeHandle(ref, () => ({
        clear: () => {
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
        getCanvas: () => canvasRef.current,
        getPaths: () => paths,
        loadPaths: (newPaths: Stroke[]) => {
            setPaths(newPaths);
            setHistoryStep(newPaths.length);
        }
    }));

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden touch-none ${className}`}
            style={{
                backgroundColor: backgroundColor === 'black' ? '#0f172a' : '#ffffff',
                backgroundImage: backgroundColor === 'grid' ? 'radial-gradient(#cbd5e1 1px, transparent 1px)' : undefined,
                backgroundSize: backgroundColor === 'grid' ? '20px 20px' : undefined
            }}
        >
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
                className={`block`}
                style={{ cursor: getCursor() }}
            />
        </div>
    );
});

SmartBoard.displayName = "SmartBoard";

// --- Helper Functions for PDF Export ---

/**
 * Calculates the bounding box of a set of strokes.
 * Returns null if no paths or valid points.
 */
export function getPathBoundingBox(paths: Stroke[]) {
    if (!paths || paths.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasPoints = false;

    paths.forEach(p => {
        if (p.tool === 'eraser' || p.tool === 'laser') return; // Ignore eraser/laser
        p.points.forEach(pt => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
            hasPoints = true;
        });
    });

    if (!hasPoints) return null;
    return { minX, minY, maxX, maxY };
}

/**
 * Generates a Data URL image of the given paths, cropped to their bounding box with padding.
 */
export function exportPathsToImage(paths: Stroke[], padding = 20, invertColors = false): string | null {
    const bbox = getPathBoundingBox(paths);
    if (!bbox) return null;

    const width = bbox.maxX - bbox.minX + (padding * 2);
    const height = bbox.maxY - bbox.minY + (padding * 2);

    // Create off-screen canvas (not attached to DOM, purely for export)
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill white background if inverting colors (simulating paper)
    if (invertColors) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    // Translate context to center the drawing in the cropped canvas
    ctx.translate(-bbox.minX + padding, -bbox.minY + padding);

    // Set consistent styling for export (e.g. rounded caps)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach(stroke => {
        if (stroke.tool === 'eraser' || stroke.tool === 'laser') return;

        ctx.beginPath();
        let strokeColor = stroke.color;

        if (invertColors) {
            // Simple color mapping for dark mode -> print mode
            if (strokeColor.toLowerCase() === '#ffffff' || strokeColor.toLowerCase() === '#fff') {
                strokeColor = '#000000'; // White -> Black
            } else if (strokeColor.toLowerCase() === '#ffff00' || strokeColor.toLowerCase() === 'yellow') {
                strokeColor = '#eab308'; // Bright Yellow -> Darker Yellow/Gold
            } else if (strokeColor.toLowerCase() === '#00ff00' || strokeColor.toLowerCase() === 'lime') {
                strokeColor = '#16a34a'; // Bright Green -> Darker Green
            } else if (strokeColor.toLowerCase() === '#00ffff' || strokeColor.toLowerCase() === 'cyan') {
                strokeColor = '#0891b2'; // Cyan -> Teal
            }
            // Add more mappings as needed or use a color manipulation lib if available
        }

        ctx.strokeStyle = strokeColor;

        // Handle highlighter transparency
        if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = stroke.width * 2; // Highlighter is wider
        } else {
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = stroke.width;
        }

        if (stroke.points.length > 0) {
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                // Use quadratic curves for smoothness (matching SmartBoard rendering)
                const p1 = stroke.points[i - 1];
                const p2 = stroke.points[i];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                if (i === 1) { ctx.lineTo(p1.x, p1.y); }
                ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
            if (stroke.points.length > 1) {
                const last = stroke.points[stroke.points.length - 1];
                ctx.lineTo(last.x, last.y);
            }
        }
        ctx.stroke();
    });

    return canvas.toDataURL('image/png');
}

export default SmartBoard;
