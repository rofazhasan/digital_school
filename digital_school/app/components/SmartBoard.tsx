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

    // --- Rendering ---
    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.width;

        if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.3;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        } else if (stroke.tool === 'eraser') {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000000';
        } else {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }

        ctx.stroke();

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

        // 2. Draw Background
        if (backgroundColor === 'black') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backgroundColor === 'grid') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (backgroundColor === 'white') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // 'transparent' does nothing (clearRect already made it transparent)

        // 3. Apply View Transform (Including DPR!)
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offset.x * dpr, offset.y * dpr);

        if (backgroundColor === 'grid') {
            drawGrid(ctx, canvas.width, canvas.height, dpr);
        }

        // 4. Draw Paths
        const visiblePaths = paths.slice(0, historyStep);
        visiblePaths.forEach(path => drawStroke(ctx, path));

        // 5. Draw Current Stroke
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

            if (tool === 'laser' && isDrawing) {
                laserTrailRef.current.push({ ...worldPoint, time: Date.now() });
                return;
            }

            if (isDrawing && currentStroke) {
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
                    className={`block ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
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
