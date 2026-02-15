'use client';

import React from 'react';
import { ForceArrow, ArrowMarkerDefs } from './ForceArrow';
import { CoordinateAxes } from './CoordinateAxes';
import { GridBackground } from './GridBackground';
import { MomentArc } from './MomentArc';
import { RigidBody } from './RigidBody';
import type { FBDDiagram } from '@/utils/fbd/types';

interface FBDRendererProps {
    diagram: FBDDiagram;
    scale?: number;
    className?: string;
    showMagnitudes?: boolean;
}

/**
 * Main Free Body Diagram Renderer
 * Renders a complete FBD with all forces, moments, body, axes, and grid
 */
export function FBDRenderer({
    diagram,
    scale = 1,
    className = '',
    showMagnitudes = false,
}: FBDRendererProps) {
    const {
        width,
        height,
        points,
        forces,
        moments = [],
        body,
        showAxes = true,
        showGrid = false,
        backgroundColor = '#fafafa',
        customSVG,
    } = diagram;

    // Create a map of point IDs to coordinates for quick lookup
    const pointMap = new Map(points.map(p => [p.id, p]));

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={`fbd-renderer ${className}`}
            style={{ backgroundColor }}
        >
            {/* SVG Definitions (arrow heads, etc.) */}
            <ArrowMarkerDefs />

            {/* Custom SVG Content (for circuits, waves, chemistry, etc.) */}
            {customSVG ? (
                <g dangerouslySetInnerHTML={{ __html: customSVG }} />
            ) : (
                <>
                    {/* Grid Background (optional) */}
                    {showGrid && (
                        <GridBackground
                            width={width}
                            height={height}
                            backgroundColor={backgroundColor}
                        />
                    )}

                    {/* Coordinate Axes (optional) */}
                    {showAxes && (
                        <CoordinateAxes
                            width={width}
                            height={height}
                        />
                    )}

                    {/* Rigid Body (if defined) */}
                    {body && <RigidBody body={body} />}

                    {/* Points */}
                    {points.map(point => (
                        <g key={point.id}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={4}
                                fill="#374151"
                                className="fbd-point"
                            />
                            {point.label && (
                                <text
                                    x={point.x}
                                    y={point.y - 10}
                                    fill="#374151"
                                    fontSize="12"
                                    fontWeight="500"
                                    textAnchor="middle"
                                >
                                    {point.label}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Forces */}
                    {forces.map(force => {
                        const point = pointMap.get(force.pointId);
                        if (!point) return null;

                        return (
                            <ForceArrow
                                key={force.id}
                                force={force}
                                startX={point.x}
                                startY={point.y}
                                scale={scale}
                                showMagnitude={showMagnitudes}
                            />
                        );
                    })}

                    {/* Moments */}
                    {moments.map(moment => {
                        const point = pointMap.get(moment.pointId);
                        if (!point) return null;

                        return (
                            <MomentArc
                                key={moment.id}
                                moment={moment}
                                centerX={point.x}
                                centerY={point.y}
                                radius={moment.radius}
                            />
                        );
                    })}
                </>
            )}
        </svg>
    );
}

/**
 * FBD Preview Component - Read-only, optimized for display
 */
export function FBDPreview({
    diagram,
    maxWidth = 600,
    maxHeight = 400,
}: {
    diagram: FBDDiagram;
    maxWidth?: number;
    maxHeight?: number;
}) {
    // Calculate scale to fit within max dimensions
    const scaleX = maxWidth / diagram.width;
    const scaleY = maxHeight / diagram.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = diagram.width * scale;
    const scaledHeight = diagram.height * scale;

    return (
        <div className="fbd-preview" style={{ width: scaledWidth, height: scaledHeight }}>
            <FBDRenderer diagram={diagram} scale={scale} />
        </div>
    );
}
