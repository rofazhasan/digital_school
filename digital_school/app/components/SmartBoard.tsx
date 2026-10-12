"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback, memo } from 'react';

// --- Types ---
export type ToolType =
    | 'pen'
    | 'highlighter'
    | 'eraser'
    | 'semigloss'
    | 'laser'
    | 'select'
    | 'move'
    | 'line'
    | 'arrow'
    | 'rect'
    | 'circle'
    | 'triangle'
    | 'right_triangle'
    | 'axis'
    | 'cube'
    | 'diamond';

export interface Point {
    x: number;
    y: number;
    pressure?: number;
    time?: number;
}

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
    canUndo?: () => boolean;
    canRedo?: () => boolean;
}

interface SmartBoardProps {
    className?: string;
    onDrawEnd?: () => void;
    backgroundColor?: 'white' | 'black' | 'grid' | 'transparent';
}

const isShapeTool = (t: ToolType) => {
    return ['line', 'arrow', 'rect', 'circle', 'triangle', 'right_triangle', 'axis', 'cube', 'diamond'].includes(t);
};

// Natural stroke drawing with Bezier smoothing and velocity/pressure dynamics
function drawSmoothStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    offsetPos: Point = { x: 0, y: 0 }
) {
    if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const p0 = stroke.points[0];
    const p1 = { x: p0.x + offsetPos.x, y: p0.y + offsetPos.y };
    const rawLast = stroke.points[stroke.points.length - 1];
    const p2 = { x: rawLast.x + offsetPos.x, y: rawLast.y + offsetPos.y };

    // --- 1. Highlighter Mode ---
    if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 2.5;

        if (stroke.points.length === 1) {
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, (stroke.width * 2.5) / 2, 0, Math.PI * 2);
            ctx.fillStyle = stroke.color;
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
            const pt1 = stroke.points[i];
            const pt2 = stroke.points[i + 1];
            const mid = { x: (pt1.x + pt2.x) / 2 + offsetPos.x, y: (pt1.y + pt2.y) / 2 + offsetPos.y };
            ctx.quadraticCurveTo(pt1.x + offsetPos.x, pt1.y + offsetPos.y, mid.x, mid.y);
        }
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
        return;
    }

    // --- 2. Eraser Mode ---
    if (stroke.tool === 'eraser') {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = stroke.width;

        if (stroke.points.length === 1) {
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, stroke.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            ctx.lineTo(pt.x + offsetPos.x, pt.y + offsetPos.y);
        }
        ctx.stroke();
        ctx.restore();
        return;
    }

    // --- 3. Geometric Shapes & Stencils ---
    if (isShapeTool(stroke.tool)) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;

        const w = p2.x - p1.x;
        const h = p2.y - p1.y;

        ctx.beginPath();

        if (stroke.tool === 'line') {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        } else if (stroke.tool === 'arrow') {
            // Draw Main Shaft
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Draw crisp Arrowhead
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const headLen = Math.max(12, stroke.width * 3.5);
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(
                p2.x - headLen * Math.cos(angle - Math.PI / 6),
                p2.y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(
                p2.x - headLen * Math.cos(angle + Math.PI / 6),
                p2.y - headLen * Math.sin(angle + Math.PI / 6)
            );
        } else if (stroke.tool === 'rect') {
            ctx.rect(p1.x, p1.y, w, h);
        } else if (stroke.tool === 'circle') {
            const centerX = p1.x + w / 2;
            const centerY = p1.y + h / 2;
            ctx.ellipse(centerX, centerY, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
        } else if (stroke.tool === 'triangle') {
            ctx.moveTo(p1.x + w / 2, p1.y);
            ctx.lineTo(p1.x, p1.y + h);
            ctx.lineTo(p1.x + w, p1.y + h);
            ctx.closePath();
        } else if (stroke.tool === 'right_triangle') {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p1.x, p1.y + h);
            ctx.lineTo(p1.x + w, p1.y + h);
            ctx.closePath();
        } else if (stroke.tool === 'diamond') {
            ctx.moveTo(p1.x + w / 2, p1.y);
            ctx.lineTo(p1.x + w, p1.y + h / 2);
            ctx.lineTo(p1.x + w / 2, p1.y + h);
            ctx.lineTo(p1.x, p1.y + h / 2);
            ctx.closePath();
        } else if (stroke.tool === 'cube') {
            const d = w * 0.25;
            ctx.rect(p1.x, p1.y + d, w - d, h - d);
            ctx.moveTo(p1.x, p1.y + d); ctx.lineTo(p1.x + d, p1.y);
            ctx.moveTo(p1.x + w - d, p1.y + d); ctx.lineTo(p1.x + w, p1.y);
            ctx.moveTo(p1.x + w - d, p1.y + h); ctx.lineTo(p1.x + w, p1.y + h - d);
            ctx.moveTo(p1.x, p1.y + h); ctx.lineTo(p1.x + d, p1.y + h - d);
            ctx.rect(p1.x + d, p1.y, w - d, h - d);
        } else if (stroke.tool === 'axis') {
            // Coordinate System with arrowheads
            ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2, p1.y + h);
            ctx.moveTo(p1.x, p1.y + h / 2); ctx.lineTo(p1.x + w, p1.y + h / 2);
            // X-axis arrow
            ctx.moveTo(p1.x + w, p1.y + h / 2); ctx.lineTo(p1.x + w - 10, p1.y + h / 2 - 5);
            ctx.moveTo(p1.x + w, p1.y + h / 2); ctx.lineTo(p1.x + w - 10, p1.y + h / 2 + 5);
            // Y-axis arrow
            ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2 - 5, p1.y + 10);
            ctx.moveTo(p1.x + w / 2, p1.y); ctx.lineTo(p1.x + w / 2 + 5, p1.y + 10);
        }

        ctx.stroke();
        ctx.restore();
        return;
    }

    // --- 4. Smooth Freehand Pen / Gel Pen / Calligraphy ---
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;

    const pts = stroke.points;
    const len = pts.length;

    if (len === 1) {
        // Single tap dot
        ctx.beginPath();
        const baseR = Math.max(1.5, stroke.width / 2);
        const r = (pts[0].pressure && pts[0].pressure > 0) ? baseR * (0.5 + pts[0].pressure) : baseR;
        ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    if (len === 2) {
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(pts[1].x + offsetPos.x, pts[1].y + offsetPos.y);
        ctx.stroke();
        ctx.restore();
        return;
    }

    // High quality Bezier interpolation
    // If pressure data exists, render with variable segment width
    const hasPressureData = pts.some(p => p.pressure !== undefined && p.pressure > 0 && p.pressure !== 0.5);

    if (hasPressureData && len > 2) {
        for (let i = 0; i < len - 1; i++) {
            const curr = pts[i];
            const next = pts[i + 1];
            const pX1 = curr.x + offsetPos.x;
            const pY1 = curr.y + offsetPos.y;
            const pX2 = next.x + offsetPos.x;
            const pY2 = next.y + offsetPos.y;

            const pFactor = Math.max(0.4, Math.min(1.8, ((curr.pressure || 0.5) + (next.pressure || 0.5))));
            ctx.lineWidth = stroke.width * pFactor;

            ctx.beginPath();
            ctx.moveTo(pX1, pY1);
            ctx.lineTo(pX2, pY2);
            ctx.stroke();
        }
    } else {
        // Fast, butter-smooth quadratic spline through midpoints
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        for (let i = 1; i < len - 1; i++) {
            const raw1 = pts[i];
            const raw2 = pts[i + 1];
            const midX = (raw1.x + raw2.x) / 2 + offsetPos.x;
            const midY = (raw1.y + raw2.y) / 2 + offsetPos.y;
            ctx.quadraticCurveTo(raw1.x + offsetPos.x, raw1.y + offsetPos.y, midX, midY);
        }

        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    ctx.restore();
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
    const [lineWidth, setLineWidth] = useState(2.5);

    // History (Vector Paths)
    const [paths, setPaths] = useState<Stroke[]>([]);
    const [historyStep, setHistoryStep] = useState(0);

    // View Transform
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

    // Selection & Drag State
    const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
    const [isDraggingStroke, setIsDraggingStroke] = useState(false);
    const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

    // --- Performance Optimization: Active Stroke Ref for ZERO-LAG live drawing ---
    const activeStrokeRef = useRef<Stroke | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const laserTrailRef = useRef<LaserPoint[]>([]);

    // --- Helpers ---
    const getScreenPoint = (e: React.PointerEvent | PointerEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5,
            time: Date.now()
        };
    };

    const toWorldPoint = (screenPoint: Point): Point => {
        return {
            x: (screenPoint.x - offset.x) / scale,
            y: (screenPoint.y - offset.y) / scale,
            pressure: screenPoint.pressure,
            time: screenPoint.time
        };
    };

    // --- Hit Testing ---
    const hitTest = (point: Point, strokes: Stroke[]): string | null => {
        for (let i = strokes.length - 1; i >= 0; i--) {
            const stroke = strokes[i];
            if (!stroke || !Array.isArray(stroke.points) || stroke.tool === 'laser' || stroke.tool === 'eraser') continue;

            const threshold = Math.max(14, stroke.width * 2.5) / scale;

            for (let j = 0; j < stroke.points.length; j += 2) {
                const sp = stroke.points[j];
                if (!sp) continue;
                const dx = sp.x - point.x;
                const dy = sp.y - point.y;
                if (dx * dx + dy * dy < threshold * threshold) {
                    return stroke.id;
                }
            }
        }
        return null;
    };

    // --- Cursor Generation ---
    const getCursor = () => {
        if (tool === 'select') return isDraggingStroke ? 'grabbing' : 'default';
        if (tool === 'move') return isPanning ? 'grabbing' : 'grab';
        if (tool === 'eraser') return 'crosshair';
        if (tool === 'laser') return 'crosshair';
        return 'crosshair';
    };

    // --- Full Screen Redraw ---
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        // Reset transform to native pixels & clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply View Transform with DPR
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offset.x * dpr, offset.y * dpr);

        // Render Committed Visible Paths
        const visiblePaths = paths.slice(0, historyStep);
        visiblePaths.forEach(path => {
            if (path.id === selectedStrokeId && isDraggingStroke) {
                drawSmoothStroke(ctx, path, dragOffset);
            } else {
                drawSmoothStroke(ctx, path);
            }
        });

        // Highlight Selected Stroke
        if (selectedStrokeId && !isDraggingStroke) {
            const selected = visiblePaths.find(p => p.id === selectedStrokeId);
            if (selected) {
                ctx.save();
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = 10;
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = selected.width + 3;
                ctx.globalAlpha = 0.6;
                drawSmoothStroke(ctx, selected);
                ctx.restore();
            }
        }

        // Draw Active Live Stroke (Direct from Ref)
        if (activeStrokeRef.current) {
            drawSmoothStroke(ctx, activeStrokeRef.current);
        }

        // Draw Laser Trail
        const now = Date.now();
        if (laserTrailRef.current.length > 0) {
            laserTrailRef.current = laserTrailRef.current.filter(p => now - p.time < 1800);

            if (laserTrailRef.current.length > 1) {
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                for (let i = 1; i < laserTrailRef.current.length; i++) {
                    const pA = laserTrailRef.current[i - 1];
                    const pB = laserTrailRef.current[i];
                    const age = now - pB.time;
                    const opacity = Math.max(0, 1 - age / 1800);

                    ctx.beginPath();
                    ctx.moveTo(pA.x, pA.y);
                    ctx.lineTo(pB.x, pB.y);
                    ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
                    ctx.lineWidth = (8 / scale) * opacity;
                    ctx.stroke();
                }

                const last = laserTrailRef.current[laserTrailRef.current.length - 1];
                if (last) {
                    ctx.beginPath();
                    ctx.arc(last.x, last.y, 6 / scale, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(last.x, last.y, 16 / scale, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    }, [scale, offset, paths, historyStep, selectedStrokeId, dragOffset, isDraggingStroke]);

    // Laser Animation Loop
    useEffect(() => {
        let animId: number;
        const checkLaser = () => {
            if (tool === 'laser' || laserTrailRef.current.length > 0) {
                redraw();
                animId = requestAnimationFrame(checkLaser);
            }
        };
        if (tool === 'laser' || laserTrailRef.current.length > 0) {
            animId = requestAnimationFrame(checkLaser);
        }
        return () => cancelAnimationFrame(animId);
    }, [tool, redraw]);

    // Redraw on dependencies
    useEffect(() => {
        redraw();
    }, [redraw]);

    // Resize Handler with DevicePixelRatio
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            const parent = containerRef.current;
            if (canvas && parent) {
                const rect = parent.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = Math.round(rect.width * dpr);
                canvas.height = Math.round(rect.height * dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                redraw();
            }
        };

        const ro = new ResizeObserver(resize);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', resize);
        resize();

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [redraw]);

    // --- High-Performance Pointer Events ---
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        // Prevent default touch gestures (scrolling, pinch zoom from browser)
        e.preventDefault();

        // Capture pointer to guarantee no lost points even if dragging off-screen
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // Ignore if pointer capture unsupported
        }

        const screenPoint = getScreenPoint(e);
        const worldPoint = toWorldPoint(screenPoint);

        // Select Tool Logic
        if (tool === 'select') {
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

        // Panning Logic (Middle click or Move tool)
        if (tool === 'move' || e.button === 1 || e.altKey) {
            setIsPanning(true);
            setLastPanPoint(screenPoint);
            return;
        }

        // Stroke Eraser (Single Click/Tap on stroke)
        if (tool === 'eraser') {
            const hitId = hitTest(worldPoint, paths.slice(0, historyStep));
            if (hitId) {
                // Delete clicked stroke immediately
                const updated = paths.filter(p => p.id !== hitId);
                setPaths(updated);
                setHistoryStep(updated.length);
                if (onDrawEnd) onDrawEnd();
                return;
            }
        }

        // Laser Tool
        if (tool === 'laser') {
            setIsDrawing(true);
            laserTrailRef.current.push({ ...worldPoint, time: Date.now() });
            redraw();
            return;
        }

        // Freehand / Shape Drawing Start
        setIsDrawing(true);
        activeStrokeRef.current = {
            points: [worldPoint],
            color: tool === 'eraser' ? '#000000' : color,
            width: lineWidth * (tool === 'highlighter' ? 3.5 : tool === 'eraser' ? 5 : 1),
            tool: tool === 'semigloss' ? 'pen' : tool,
            id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        };

        redraw();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

        if (isDraggingStroke && dragStartPos && selectedStrokeId) {
            const dx = worldPoint.x - dragStartPos.x;
            const dy = worldPoint.y - dragStartPos.y;
            setDragOffset({ x: dx, y: dy });
            redraw();
            return;
        }

        if (tool === 'laser' && isDrawing) {
            laserTrailRef.current.push({ ...worldPoint, time: Date.now() });
            redraw();
            return;
        }

        // Freehand Live Eraser (swipe-through delete)
        if (tool === 'eraser' && isDrawing) {
            const hitId = hitTest(worldPoint, paths.slice(0, historyStep));
            if (hitId) {
                const updated = paths.filter(p => p.id !== hitId);
                setPaths(updated);
                setHistoryStep(updated.length);
            }
            if (activeStrokeRef.current) {
                activeStrokeRef.current.points.push(worldPoint);
            }
            redraw();
            return;
        }

        if (isDrawing && activeStrokeRef.current) {
            if (isShapeTool(activeStrokeRef.current.tool)) {
                // Update shape endpoint
                activeStrokeRef.current.points = [activeStrokeRef.current.points[0], worldPoint];
            } else {
                // Append point with pressure
                activeStrokeRef.current.points.push(worldPoint);
            }

            // High efficiency RAF render
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    redraw();
                });
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // Ignore
        }

        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        if (isDraggingStroke && selectedStrokeId && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
            const newPaths = paths.map(p => {
                if (p && p.id === selectedStrokeId && Array.isArray(p.points)) {
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

        // Commit active stroke to paths state
        if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
            const newStroke = activeStrokeRef.current;
            activeStrokeRef.current = null;

            const visible = paths.slice(0, historyStep);
            visible.push(newStroke);
            setPaths(visible);
            setHistoryStep(visible.length);

            if (onDrawEnd) onDrawEnd();
        }

        redraw();
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.0015;
            setScale(prev => Math.min(Math.max(0.2, prev + delta), 4));
        } else {
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    useImperativeHandle(ref, () => ({
        clear: () => {
            activeStrokeRef.current = null;
            setPaths([]);
            setHistoryStep(0);
            setSelectedStrokeId(null);
            redraw();
        },
        undo: () => {
            setHistoryStep(prev => Math.max(0, prev - 1));
            setSelectedStrokeId(null);
        },
        redo: () => {
            setHistoryStep(prev => Math.min(paths.length, prev + 1));
            setSelectedStrokeId(null);
        },
        setTool,
        setColor,
        setLineWidth,
        resetView: () => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        },
        zoomIn: () => setScale(s => Math.min(s * 1.25, 4)),
        zoomOut: () => setScale(s => Math.max(s / 1.25, 0.2)),
        getCanvas: () => canvasRef.current,
        getPaths: () => paths.slice(0, historyStep),
        loadPaths: (newPaths: Stroke[]) => {
            activeStrokeRef.current = null;
            setPaths(newPaths || []);
            setHistoryStep((newPaths || []).length);
            setSelectedStrokeId(null);
        },
        canUndo: () => historyStep > 0,
        canRedo: () => historyStep < paths.length
    }));

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden touch-none select-none ${className}`}
            style={{
                backgroundColor:
                    backgroundColor === 'transparent'
                        ? 'transparent'
                        : backgroundColor === 'black'
                        ? '#090d16'
                        : '#ffffff',
                backgroundImage:
                    backgroundColor === 'grid'
                        ? 'radial-gradient(#94a3b8 1.2px, transparent 1.2px)'
                        : undefined,
                backgroundSize: backgroundColor === 'grid' ? '24px 24px' : undefined
            }}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="block w-full h-full touch-none"
                style={{
                    cursor: getCursor(),
                    touchAction: 'none'
                }}
            />
        </div>
    );
});

SmartBoard.displayName = "SmartBoard";

export function exportPathsToImage(paths: Stroke[], width = 1920, height = 1080, invertColors = false): string {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = invertColors ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    paths.forEach(stroke => {
        if (!stroke || !Array.isArray(stroke.points) || stroke.tool === 'laser') return;
        let strokeCopy = { ...stroke };
        if (invertColors && stroke.color.toLowerCase() === '#000000') {
            strokeCopy.color = '#ffffff';
        }
        drawSmoothStroke(ctx, strokeCopy);
    });

    return canvas.toDataURL('image/png');
}

export default memo(SmartBoard);
