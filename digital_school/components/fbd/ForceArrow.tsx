'use client';

import React from 'react';
import { calculateForceEndPoint } from '@/utils/fbd/calculations';
import { DEFAULT_FBD_CONFIG, type FBDForce } from '@/utils/fbd/types';

interface ForceArrowProps {
    force: FBDForce;
    startX: number;
    startY: number;
    scale?: number;
    showLabel?: boolean;
    showMagnitude?: boolean;
}

export function ForceArrow({
    force,
    startX,
    startY,
    scale = 1,
    showLabel = true,
    showMagnitude = false,
}: ForceArrowProps) {
    const { magnitude, angle, label, type = 'custom', color } = force;

    // Scale magnitude for visual representation
    const visualMagnitude = magnitude * scale;

    // Calculate end point
    const endPoint = calculateForceEndPoint(startX, startY, visualMagnitude, angle);

    // Get color from type or use custom color
    const arrowColor = color || DEFAULT_FBD_CONFIG.forceColors[type];

    // Calculate label position (slightly offset from arrow tip)
    const labelOffset = 15;
    const labelAngleRad = (angle * Math.PI) / 180;
    const labelX = endPoint.x + labelOffset * Math.cos(labelAngleRad);
    const labelY = endPoint.y - labelOffset * Math.sin(labelAngleRad);

    return (
        <g className="force-arrow" data-force-id={force.id}>
            {/* Arrow line */}
            <line
                x1={startX}
                y1={startY}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke={arrowColor}
                strokeWidth={DEFAULT_FBD_CONFIG.defaultArrowWidth}
                markerEnd="url(#arrowhead)"
                className="force-line"
            />

            {/* Label */}
            {showLabel && (
                <text
                    x={labelX}
                    y={labelY}
                    fill={arrowColor}
                    fontSize="14"
                    fontWeight="500"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="force-label"
                >
                    {label}
                    {showMagnitude && ` (${magnitude}N)`}
                </text>
            )}

            {/* Angle indicator (optional, can be toggled) */}
            {force.angle % 90 !== 0 && (
                <text
                    x={startX + 20}
                    y={startY - 10}
                    fill="#6B7280"
                    fontSize="11"
                    className="angle-label"
                >
                    {angle}°
                </text>
            )}
        </g>
    );
}

/**
 * SVG marker definition for arrow heads
 * Should be included once in the parent SVG
 */
export function ArrowMarkerDefs() {
    return (
        <defs>
            <marker
                id="arrowhead"
                markerWidth={DEFAULT_FBD_CONFIG.defaultArrowHeadSize}
                markerHeight={DEFAULT_FBD_CONFIG.defaultArrowHeadSize}
                refX={DEFAULT_FBD_CONFIG.defaultArrowHeadSize}
                refY={DEFAULT_FBD_CONFIG.defaultArrowHeadSize / 2}
                orient="auto"
                markerUnits="strokeWidth"
            >
                <polygon
                    points={`0 0, ${DEFAULT_FBD_CONFIG.defaultArrowHeadSize} ${DEFAULT_FBD_CONFIG.defaultArrowHeadSize / 2}, 0 ${DEFAULT_FBD_CONFIG.defaultArrowHeadSize}`}
                    fill="context-stroke"
                />
            </marker>
        </defs>
    );
}
