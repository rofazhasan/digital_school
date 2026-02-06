'use client';

import React from 'react';
import type { FBDBody } from '@/utils/fbd/types';

interface RigidBodyProps {
    body: FBDBody;
}

export function RigidBody({ body }: RigidBodyProps) {
    const { type, centerX, centerY, width, height, radius, points, fill = '#E5E7EB', stroke = '#374151' } = body;

    switch (type) {
        case 'point':
            return (
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={5}
                    fill={stroke}
                    className="rigid-body-point"
                />
            );

        case 'circle':
            return (
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius || 30}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                    className="rigid-body-circle"
                />
            );

        case 'rectangle':
            return (
                <rect
                    x={centerX - (width || 60) / 2}
                    y={centerY - (height || 40) / 2}
                    width={width || 60}
                    height={height || 40}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                    className="rigid-body-rectangle"
                />
            );

        case 'triangle':
            if (!points || points.length < 3) {
                // Default equilateral triangle
                const size = 40;
                const h = (size * Math.sqrt(3)) / 2;
                const trianglePoints = [
                    { x: centerX, y: centerY - (2 * h) / 3 },
                    { x: centerX - size / 2, y: centerY + h / 3 },
                    { x: centerX + size / 2, y: centerY + h / 3 },
                ];

                return (
                    <polygon
                        points={trianglePoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        className="rigid-body-triangle"
                    />
                );
            }

            return (
                <polygon
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                    className="rigid-body-triangle"
                />
            );

        case 'custom':
            if (!points || points.length === 0) return null;

            return (
                <polygon
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                    className="rigid-body-custom"
                />
            );

        default:
            return null;
    }
}
