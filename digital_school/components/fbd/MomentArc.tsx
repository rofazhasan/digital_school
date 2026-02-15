'use client';

import React from 'react';
import type { FBDMoment } from '@/utils/fbd/types';

interface MomentArcProps {
    moment: FBDMoment;
    centerX: number;
    centerY: number;
    radius?: number;
    showLabel?: boolean;
}

export function MomentArc({
    moment,
    centerX,
    centerY,
    radius = 30,
    showLabel = true,
}: MomentArcProps) {
    const { direction, label, magnitude } = moment;

    // Arc parameters
    const startAngle = direction === 'cw' ? -30 : 30;
    const endAngle = direction === 'cw' ? -330 : 330;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc path
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY - radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY - radius * Math.sin(endRad);

    const largeArcFlag = 1;
    const sweepFlag = direction === 'cw' ? 1 : 0;

    const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

    // Arrow head at the end
    const arrowAngle = endRad + (direction === 'cw' ? -0.3 : 0.3);
    const arrowSize = 8;
    const arrow1X = endX + arrowSize * Math.cos(arrowAngle);
    const arrow1Y = endY - arrowSize * Math.sin(arrowAngle);
    const arrow2X = endX + arrowSize * Math.cos(arrowAngle + Math.PI / 2);
    const arrow2Y = endY - arrowSize * Math.sin(arrowAngle + Math.PI / 2);

    return (
        <g className="moment-arc" data-moment-id={moment.id}>
            {/* Circular arc */}
            <path
                d={pathData}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                className="moment-path"
            />

            {/* Arrow head */}
            <polygon
                points={`${endX},${endY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}`}
                fill="#8B5CF6"
            />

            {/* Label */}
            {showLabel && (
                <text
                    x={centerX}
                    y={centerY - radius - 15}
                    fill="#8B5CF6"
                    fontSize="14"
                    fontWeight="500"
                    textAnchor="middle"
                    className="moment-label"
                >
                    {label} ({magnitude} N·m)
                </text>
            )}

            {/* Center point */}
            <circle
                cx={centerX}
                cy={centerY}
                r="3"
                fill="#8B5CF6"
                opacity="0.5"
            />
        </g>
    );
}
