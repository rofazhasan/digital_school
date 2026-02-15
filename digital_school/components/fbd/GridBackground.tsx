'use client';

import React from 'react';
import { DEFAULT_FBD_CONFIG } from '@/utils/fbd/types';

interface GridBackgroundProps {
    width: number;
    height: number;
    gridSize?: number;
    color?: string;
    backgroundColor?: string;
}

export function GridBackground({
    width,
    height,
    gridSize = DEFAULT_FBD_CONFIG.gridSize,
    color = DEFAULT_FBD_CONFIG.gridColor,
    backgroundColor = '#fafafa',
}: GridBackgroundProps) {
    const verticalLines = [];
    const horizontalLines = [];

    // Generate vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
        verticalLines.push(
            <line
                key={`v-${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={color}
                strokeWidth="0.5"
                opacity="0.3"
            />
        );
    }

    // Generate horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
        horizontalLines.push(
            <line
                key={`h-${y}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={color}
                strokeWidth="0.5"
                opacity="0.3"
            />
        );
    }

    return (
        <g className="grid-background">
            <rect width={width} height={height} fill={backgroundColor} />
            {verticalLines}
            {horizontalLines}
        </g>
    );
}
