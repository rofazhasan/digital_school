'use client';

import React from 'react';
import { DEFAULT_FBD_CONFIG } from '@/utils/fbd/types';

interface CoordinateAxesProps {
    width: number;
    height: number;
    centerX?: number;
    centerY?: number;
    showLabels?: boolean;
    color?: string;
}

export function CoordinateAxes({
    width,
    height,
    centerX = width / 2,
    centerY = height / 2,
    showLabels = true,
    color = DEFAULT_FBD_CONFIG.axesColor,
}: CoordinateAxesProps) {
    const padding = 30;
    const arrowSize = 8;

    return (
        <g className="coordinate-axes">
            {/* X-axis */}
            <line
                x1={padding}
                y1={centerY}
                x2={width - padding}
                y2={centerY}
                stroke={color}
                strokeWidth="1.5"
                opacity="0.6"
            />

            {/* X-axis arrow */}
            <polygon
                points={`${width - padding},${centerY} ${width - padding - arrowSize},${centerY - arrowSize / 2} ${width - padding - arrowSize},${centerY + arrowSize / 2}`}
                fill={color}
                opacity="0.6"
            />

            {/* Y-axis */}
            <line
                x1={centerX}
                y1={height - padding}
                x2={centerX}
                y2={padding}
                stroke={color}
                strokeWidth="1.5"
                opacity="0.6"
            />

            {/* Y-axis arrow */}
            <polygon
                points={`${centerX},${padding} ${centerX - arrowSize / 2},${padding + arrowSize} ${centerX + arrowSize / 2},${padding + arrowSize}`}
                fill={color}
                opacity="0.6"
            />

            {/* Labels */}
            {showLabels && (
                <>
                    <text
                        x={width - padding + 15}
                        y={centerY + 5}
                        fill={color}
                        fontSize="14"
                        fontWeight="500"
                    >
                        x
                    </text>
                    <text
                        x={centerX + 10}
                        y={padding - 5}
                        fill={color}
                        fontSize="14"
                        fontWeight="500"
                    >
                        y
                    </text>
                </>
            )}
        </g>
    );
}
