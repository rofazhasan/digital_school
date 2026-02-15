/**
 * Advanced Mathematical Graphs
 * Conic sections, modular arithmetic, complex functions
 */

import type { FBDDiagram } from '../../fbd/types';

function createMathDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
    return {
        id,
        width,
        height,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Parabola graph
 */
export function createParabola(id: string, a: number = 1, h: number = 0, k: number = 0): FBDDiagram {
    const width = 600;
    const height = 600;
    const elements: string[] = [];
    const centerX = 300;
    const centerY = 300;
    const scale = 20;

    // Grid
    for (let x = 0; x <= 600; x += 50) {
        elements.push(`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    for (let y = 0; y <= 600; y += 50) {
        elements.push(`<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
    }

    // Axes
    elements.push(`<line x1="0" y1="${centerY}" x2="600" y2="${centerY}" stroke="#333" stroke-width="2"/>`);
    elements.push(`<line x1="${centerX}" y1="0" x2="${centerX}" y2="600" stroke="#333" stroke-width="2"/>`);
    elements.push(`<polygon points="600,${centerY} 590,${centerY - 5} 590,${centerY + 5}" fill="#333"/>`);
    elements.push(`<polygon points="${centerX},0 ${centerX - 5},10 ${centerX + 5},10" fill="#333"/>`);
    elements.push(`<text x="580" y="${centerY - 10}" font-size="14">x</text>`);
    elements.push(`<text x="${centerX + 10}" y="20" font-size="14">y</text>`);

    // Parabola: y = a(x-h)² + k
    let pathData = '';
    for (let x = -15; x <= 15; x += 0.1) {
        const y = a * Math.pow(x - h, 2) + k;
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;

        if (screenY >= 0 && screenY <= 600) {
            if (pathData === '') {
                pathData = `M ${screenX} ${screenY}`;
            } else {
                pathData += ` L ${screenX} ${screenY}`;
            }
        }
    }

    elements.push(`<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

    // Vertex
    const vertexX = centerX + h * scale;
    const vertexY = centerY - k * scale;
    elements.push(`<circle cx="${vertexX}" cy="${vertexY}" r="5" fill="#dc2626"/>`);
    elements.push(`<text x="${vertexX + 10}" y="${vertexY - 10}" font-size="12" fill="#dc2626">Vertex (${h},${k})</text>`);

    // Equation
    elements.push(`<text x="300" y="580" font-size="16" font-weight="bold" text-anchor="middle">y = ${a}(x${h !== 0 ? (h > 0 ? '-' + h : '+' + Math.abs(h)) : ''})² ${k !== 0 ? (k > 0 ? '+' + k : k) : ''}</text>`);

    return createMathDiagram(id, width, height, elements);
}

/**
 * Hyperbola graph
 */
export function createHyperbola(id: string, a: number = 2, b: number = 2, orientation: 'horizontal' | 'vertical' = 'horizontal'): FBDDiagram {
    const width = 600;
    const height = 600;
    const elements: string[] = [];
    const centerX = 300;
    const centerY = 300;
    const scale = 20;

    // Grid and axes (same as parabola)
    for (let x = 0; x <= 600; x += 50) {
        elements.push(`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    for (let y = 0; y <= 600; y += 50) {
        elements.push(`<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    elements.push(`<line x1="0" y1="${centerY}" x2="600" y2="${centerY}" stroke="#333" stroke-width="2"/>`);
    elements.push(`<line x1="${centerX}" y1="0" x2="${centerX}" y2="600" stroke="#333" stroke-width="2"/>`);

    // Asymptotes
    const slope = b / a;
    elements.push(`<line x1="0" y1="${centerY + 300 * slope}" x2="600" y2="${centerY - 300 * slope}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5"/>`);
    elements.push(`<line x1="0" y1="${centerY - 300 * slope}" x2="600" y2="${centerY + 300 * slope}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5"/>`);

    // Hyperbola branches
    if (orientation === 'horizontal') {
        // x²/a² - y²/b² = 1
        for (let branch = -1; branch <= 1; branch += 2) {
            let pathData = '';
            for (let x = a; x <= 15; x += 0.1) {
                const y = b * Math.sqrt(Math.pow(x / a, 2) - 1);
                const screenX = centerX + branch * x * scale;
                const screenY1 = centerY - y * scale;
                const screenY2 = centerY + y * scale;

                if (pathData === '') {
                    pathData = `M ${screenX} ${screenY1}`;
                } else {
                    pathData += ` L ${screenX} ${screenY1}`;
                }
            }
            elements.push(`<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

            pathData = '';
            for (let x = a; x <= 15; x += 0.1) {
                const y = b * Math.sqrt(Math.pow(x / a, 2) - 1);
                const screenX = centerX + branch * x * scale;
                const screenY2 = centerY + y * scale;

                if (pathData === '') {
                    pathData = `M ${screenX} ${screenY2}`;
                } else {
                    pathData += ` L ${screenX} ${screenY2}`;
                }
            }
            elements.push(`<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="3"/>`);
        }
    }

    elements.push(`<text x="300" y="580" font-size="16" font-weight="bold" text-anchor="middle">x²/${a}² - y²/${b}² = 1</text>`);

    return createMathDiagram(id, width, height, elements);
}

/**
 * Ellipse graph
 */
export function createEllipse(id: string, a: number = 4, b: number = 3): FBDDiagram {
    const width = 600;
    const height = 600;
    const elements: string[] = [];
    const centerX = 300;
    const centerY = 300;
    const scale = 20;

    // Grid and axes
    for (let x = 0; x <= 600; x += 50) {
        elements.push(`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    for (let y = 0; y <= 600; y += 50) {
        elements.push(`<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    elements.push(`<line x1="0" y1="${centerY}" x2="600" y2="${centerY}" stroke="#333" stroke-width="2"/>`);
    elements.push(`<line x1="${centerX}" y1="0" x2="${centerX}" y2="600" stroke="#333" stroke-width="2"/>`);

    // Ellipse
    elements.push(`<ellipse cx="${centerX}" cy="${centerY}" rx="${a * scale}" ry="${b * scale}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

    // Foci
    const c = Math.sqrt(a * a - b * b);
    elements.push(`<circle cx="${centerX - c * scale}" cy="${centerY}" r="5" fill="#dc2626"/>`);
    elements.push(`<circle cx="${centerX + c * scale}" cy="${centerY}" r="5" fill="#dc2626"/>`);
    elements.push(`<text x="${centerX - c * scale}" y="${centerY + 20}" font-size="11" text-anchor="middle" fill="#dc2626">F₁</text>`);
    elements.push(`<text x="${centerX + c * scale}" y="${centerY + 20}" font-size="11" text-anchor="middle" fill="#dc2626">F₂</text>`);

    // Major/minor axes
    elements.push(`<line x1="${centerX - a * scale}" y1="${centerY}" x2="${centerX + a * scale}" y2="${centerY}" stroke="#10b981" stroke-width="2"/>`);
    elements.push(`<line x1="${centerX}" y1="${centerY - b * scale}" x2="${centerX}" y2="${centerY + b * scale}" stroke="#10b981" stroke-width="2"/>`);

    elements.push(`<text x="300" y="580" font-size="16" font-weight="bold" text-anchor="middle">x²/${a}² + y²/${b}² = 1</text>`);

    return createMathDiagram(id, width, height, elements);
}

/**
 * Circle graph
 */
export function createCircleGraph(id: string, radius: number = 4): FBDDiagram {
    const width = 600;
    const height = 600;
    const elements: string[] = [];
    const centerX = 300;
    const centerY = 300;
    const scale = 20;

    // Grid and axes
    for (let x = 0; x <= 600; x += 50) {
        elements.push(`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    for (let y = 0; y <= 600; y += 50) {
        elements.push(`<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
    }
    elements.push(`<line x1="0" y1="${centerY}" x2="600" y2="${centerY}" stroke="#333" stroke-width="2"/>`);
    elements.push(`<line x1="${centerX}" y1="0" x2="${centerX}" y2="600" stroke="#333" stroke-width="2"/>`);

    // Circle
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="${radius * scale}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

    // Center and radius
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="5" fill="#dc2626"/>`);
    elements.push(`<line x1="${centerX}" y1="${centerY}" x2="${centerX + radius * scale}" y2="${centerY}" stroke="#10b981" stroke-width="2"/>`);
    elements.push(`<text x="${centerX + radius * scale / 2}" y="${centerY - 10}" font-size="12" fill="#10b981">r=${radius}</text>`);

    elements.push(`<text x="300" y="580" font-size="16" font-weight="bold" text-anchor="middle">x² + y² = ${radius}²</text>`);

    return createMathDiagram(id, width, height, elements);
}

/**
 * Modular arithmetic graph (clock arithmetic)
 */
export function createModularGraph(id: string, modulus: number = 12): FBDDiagram {
    const width = 500;
    const height = 500;
    const elements: string[] = [];
    const centerX = 250;
    const centerY = 250;
    const radius = 150;

    // Circle
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#333" stroke-width="3"/>`);

    // Numbers
    for (let i = 0; i < modulus; i++) {
        const angle = (i / modulus) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        elements.push(`<circle cx="${x}" cy="${y}" r="20" fill="#2563eb" stroke="#1e40af" stroke-width="2"/>`);
        elements.push(`<text x="${x}" y="${y + 5}" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${i}</text>`);
    }

    // Center
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="5" fill="#dc2626"/>`);

    elements.push(`<text x="250" y="450" font-size="16" font-weight="bold" text-anchor="middle">Modulo ${modulus}</text>`);

    return createMathDiagram(id, width, height, elements);
}

/**
 * Linear graph (y = mx + c)
 */
export function createLinearGraph(
    id: string,
    m: number = 1,
    c: number = 0,
    label: string = ''
): FBDDiagram {
    const width = 500;
    const height = 500;
    const elements: string[] = [];
    const centerX = 250;
    const centerY = 250;
    const scale = 40; // Pixels per unit

    // Grid
    elements.push(`<defs><pattern id="grid-${id}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse"><path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#f0f0f0" stroke-width="1"/></pattern></defs>`);
    elements.push(`<rect width="${width}" height="${height}" fill="url(#grid-${id})" />`);

    // Axes
    elements.push(`<line x1="20" y1="${centerY}" x2="${width - 20}" y2="${centerY}" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`);
    elements.push(`<line x1="${centerX}" y1="${height - 20}" x2="${centerX}" y2="20" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`);
    elements.push(`<text x="${width - 30}" y="${centerY + 20}" font-family="Arial" font-size="14">x</text>`);
    elements.push(`<text x="${centerX + 15}" y="30" font-family="Arial" font-size="14">y</text>`);

    // Calculate start and end points
    // y = mx + c -> pixelY = centerY - (m * (pixelX - centerX) / scale + c) * scale
    // xVal = (xPx - centerX) / scale

    const points: string[] = [];
    for (let xPx = 20; xPx <= width - 20; xPx += 5) {
        const xVal = (xPx - centerX) / scale;
        const yVal = m * xVal + c;
        const yPx = centerY - yVal * scale;

        if (yPx >= 20 && yPx <= height - 20) {
            points.push(`${xPx},${yPx}`);
        }
    }

    if (points.length > 1) {
        elements.push(`<polyline points="${points.join(' ')}" fill="none" stroke="#2563eb" stroke-width="3" />`);
    }

    // Label
    const displayLabel = label || `y = ${m}x + ${c}`;
    if (displayLabel) {
        elements.push(`<text x="${width - 150}" y="50" font-family="Arial" font-size="16" fill="#2563eb" font-weight="bold">${displayLabel}</text>`);
    }

    return createMathDiagram(id, width, height, elements);
}
