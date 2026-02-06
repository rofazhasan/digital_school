'use client';

import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexLabelProps {
    x: number;
    y: number;
    math: string;
    inline?: boolean;
    fontSize?: number;
    color?: string;
}

/**
 * Renders LaTeX math inside SVG using foreignObject
 * For simple labels, use inline mode
 * For complex equations, use block mode
 */
export function LatexLabel({
    x,
    y,
    math,
    inline = true,
    fontSize = 14,
    color = '#000',
}: LatexLabelProps) {
    const width = math.length * (fontSize * 0.6) + 20;
    const height = fontSize * 2;

    return (
        <foreignObject
            x={x - width / 2}
            y={y - height / 2}
            width={width}
            height={height}
            className="latex-label"
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${fontSize}px`,
                    color,
                }}
            >
                {inline ? (
                    <InlineMath math={math} />
                ) : (
                    <BlockMath math={math} />
                )}
            </div>
        </foreignObject>
    );
}
