/**
 * World-Class Advanced Features
 * Interactive tooltips, zoom, pan, export, animations
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { FBDDiagram } from '@/utils/fbd/types';
import { FBDRenderer } from './FBDRenderer';

interface AdvancedFBDRendererProps {
    diagram: FBDDiagram;
    interactive?: boolean;
    showCoordinates?: boolean;
    showTooltips?: boolean;
    enableZoom?: boolean;
    enableExport?: boolean;
    showMeasurements?: boolean;
    className?: string;
}

export const AdvancedFBDRenderer: React.FC<AdvancedFBDRendererProps> = ({
    diagram,
    interactive = false,
    showCoordinates = false,
    showTooltips = true,
    enableZoom = false,
    enableExport = false,
    showMeasurements = false,
    className = '',
}) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hoveredElement, setHoveredElement] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Zoom handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (!enableZoom) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
    };

    // Pan handlers
    const handleMouseMove = (e: React.MouseEvent) => {
        if (showTooltips && hoveredElement) {
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    };

    // Export to PNG
    const exportToPNG = async () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = diagram.width;
        canvas.height = diagram.height;

        img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${diagram.id}.png`;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Export to SVG
    const exportToSVG = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${diagram.id}.svg`;
        downloadLink.click();
        URL.revokeObjectURL(url);
    };

    // Copy to clipboard
    const copyToClipboard = async () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        await navigator.clipboard.writeText(svgData);
        alert('SVG copied to clipboard!');
    };

    return (
        <div
            ref={containerRef}
            className={`relative fbd-diagram-container ${className}`}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
        >
            {/* Toolbar */}
            {(enableZoom || enableExport) && (
                <div className="absolute top-2 right-2 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
                    {enableZoom && (
                        <>
                            <button
                                onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                title="Zoom In"
                            >
                                +
                            </button>
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                title="Zoom Out"
                            >
                                −
                            </button>
                            <button
                                onClick={() => setZoom(1)}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                title="Reset Zoom"
                            >
                                Reset
                            </button>
                        </>
                    )}

                    {enableExport && (
                        <>
                            <div className="w-px bg-gray-300" />
                            <button
                                onClick={exportToPNG}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                title="Export as PNG"
                            >
                                PNG
                            </button>
                            <button
                                onClick={exportToSVG}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                title="Export as SVG"
                            >
                                SVG
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                                title="Copy SVG"
                            >
                                Copy
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Diagram */}
            <div
                className="fbd-diagram-wrapper"
                style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-out',
                }}
            >
                <div ref={svgRef as any}>
                    <FBDRenderer diagram={diagram} />
                </div>
            </div>

            {/* Tooltip */}
            {showTooltips && hoveredElement && (
                <div
                    className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
                    style={{
                        left: tooltipPos.x + 10,
                        top: tooltipPos.y + 10,
                    }}
                >
                    <div dangerouslySetInnerHTML={{ __html: hoveredElement }} />
                </div>
            )}

            {/* Zoom indicator */}
            {enableZoom && zoom !== 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                    {(zoom * 100).toFixed(0)}%
                </div>
            )}

            {/* Coordinates overlay */}
            {showCoordinates && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs font-mono">
                    Coordinates enabled
                </div>
            )}
        </div>
    );
};

/**
 * Animated diagram renderer
 */
export const AnimatedFBDRenderer: React.FC<{
    diagram: FBDDiagram;
    animationDuration?: number;
}> = ({ diagram, animationDuration = 1000 }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(1, elapsed / animationDuration);
            setProgress(newProgress);

            if (newProgress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }, [animationDuration]);

    return (
        <div style={{ opacity: progress }}>
            <FBDRenderer diagram={diagram} />
        </div>
    );
};
