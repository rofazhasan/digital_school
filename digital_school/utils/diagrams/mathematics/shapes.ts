/**
 * Mathematics Shapes & Graphs Diagram Presets
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

export function create2DAxes(id: string, showGrid: boolean = true): FBDDiagram {
    const width = 500;
    const height = 500;
    const elements: string[] = [];
    const centerX = 250;
    const centerY = 250;

    // Grid
    if (showGrid) {
        for (let x = 50; x <= 450; x += 50) {
            elements.push(`<line x1="${x}" y1="50" x2="${x}" y2="450" stroke="#e5e7eb" stroke-width="1"/>`);
        }
        for (let y = 50; y <= 450; y += 50) {
            elements.push(`<line x1="50" y1="${y}" x2="450" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
        }
    }

    // Axes
    elements.push(`<line x1="50" y1="${centerY}" x2="450" y2="${centerY}" stroke="#333" stroke-width="2"/>`);
    elements.push(`<polygon points="450,${centerY} 440,${centerY - 5} 440,${centerY + 5}" fill="#333"/>`);
    elements.push(`<text x="460" y="${centerY + 5}" font-size="16">x</text>`);

    elements.push(`<line x1="${centerX}" y1="450" x2="${centerX}" y2="50" stroke="#333" stroke-width="2"/>`);
    elements.push(`<polygon points="${centerX},50 ${centerX - 5},60 ${centerX + 5},60" fill="#333"/>`);
    elements.push(`<text x="${centerX + 10}" y="45" font-size="16">y</text>`);

    // Origin
    elements.push(`<text x="${centerX - 15}" y="${centerY + 20}" font-size="14">O</text>`);

    return createMathDiagram(id, width, height, elements);
}

export function createTriangle(id: string, type: 'equilateral' | 'right' | 'isosceles' = 'equilateral'): FBDDiagram {
    const elements: string[] = [];

    if (type === 'equilateral') {
        elements.push(`
      <polygon points="200,100 100,300 300,300" fill="none" stroke="#2563eb" stroke-width="3"/>
      <text x="200" y="90" font-size="12" text-anchor="middle">A</text>
      <text x="90" y="320" font-size="12">B</text>
      <text x="310" y="320" font-size="12">C</text>
      <text x="200" y="350" font-size="14" text-anchor="middle">Equilateral Triangle</text>
    `);
    } else if (type === 'right') {
        elements.push(`
      <polygon points="100,100 100,300 300,300" fill="none" stroke="#2563eb" stroke-width="3"/>
      <rect x="100" y="285" width="15" height="15" fill="none" stroke="#2563eb" stroke-width="2"/>
      <text x="90" y="100" font-size="12">A</text>
      <text x="90" y="320" font-size="12">B</text>
      <text x="310" y="320" font-size="12">C</text>
      <text x="200" y="350" font-size="14" text-anchor="middle">Right Triangle</text>
    `);
    }

    return createMathDiagram(id, 400, 370, elements);
}

export function createCircle(id: string, radius: number = 80): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <circle cx="200" cy="200" r="${radius}" fill="none" stroke="#2563eb" stroke-width="3"/>
    <line x1="200" y1="200" x2="${200 + radius}" y2="200" stroke="#dc2626" stroke-width="2"/>
    <circle cx="200" cy="200" r="3" fill="#333"/>
    <text x="200" y="190" font-size="12" text-anchor="middle">O</text>
    <text x="${200 + radius / 2}" y="190" font-size="12" text-anchor="middle">r</text>
    <text x="200" y="320" font-size="14" text-anchor="middle">Circle (r = ${radius})</text>
  `);

    return createMathDiagram(id, 400, 350, elements);
}

export function createRectangle(id: string, width: number = 200, height: number = 120): FBDDiagram {
    const elements: string[] = [];
    const x = (400 - width) / 2;
    const y = (300 - height) / 2;

    elements.push(`
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#2563eb" stroke-width="3"/>
    <text x="${x - 10}" y="${y + height / 2}" font-size="12">h=${height}</text>
    <text x="${x + width / 2}" y="${y + height + 20}" font-size="12" text-anchor="middle">w=${width}</text>
    <text x="200" y="320" font-size="14" text-anchor="middle">Rectangle</text>
  `);

    return createMathDiagram(id, 400, 350, elements);
}

export function createSineGraph(id: string, amplitude: number = 80, periods: number = 2): FBDDiagram {
    const width = 600;
    const height = 400;
    const elements: string[] = [];
    const centerY = 200;

    // Axes
    elements.push(`<line x1="50" y1="${centerY}" x2="550" y2="${centerY}" stroke="#999" stroke-width="1"/>`);
    elements.push(`<line x1="50" y1="50" x2="50" y2="350" stroke="#999" stroke-width="1"/>`);

    // Sine wave
    let pathData = `M 50 ${centerY}`;
    for (let x = 0; x <= 500; x += 2) {
        const y = centerY - amplitude * Math.sin((x / 500) * periods * 2 * Math.PI);
        pathData += ` L ${50 + x} ${y}`;
    }

    elements.push(`<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="3"/>`);
    elements.push(`<text x="300" y="30" font-size="14" text-anchor="middle">y = sin(x)</text>`);
    elements.push(`<text x="560" y="${centerY + 5}" font-size="12">x</text>`);
    elements.push(`<text x="40" y="45" font-size="12">y</text>`);

    return createMathDiagram(id, width, height, elements);
}

export function createVector(id: string, magnitude: number = 100, angle: number = 45): FBDDiagram {
    const elements: string[] = [];
    const startX = 100;
    const startY = 250;
    const angleRad = (angle * Math.PI) / 180;
    const endX = startX + magnitude * Math.cos(angleRad);
    const endY = startY - magnitude * Math.sin(angleRad);

    elements.push(`
    <defs>
      <marker id="arrowhead-vec" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#2563eb"/>
      </marker>
    </defs>
    <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
          stroke="#2563eb" stroke-width="3" marker-end="url(#arrowhead-vec)"/>
    <circle cx="${startX}" cy="${startY}" r="3" fill="#333"/>
    <text x="${(startX + endX) / 2 + 10}" y="${(startY + endY) / 2 - 10}" font-size="14" fill="#2563eb">v</text>
    <text x="200" y="350" font-size="14" text-anchor="middle">Vector (magnitude: ${magnitude}, angle: ${angle}°)</text>
  `);

    return createMathDiagram(id, 400, 370, elements);
}

export function createCube(id: string): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <!-- Front face -->
    <polygon points="150,200 250,200 250,300 150,300" fill="#93c5fd" stroke="#2563eb" stroke-width="2"/>
    <!-- Top face -->
    <polygon points="150,200 200,150 300,150 250,200" fill="#60a5fa" stroke="#2563eb" stroke-width="2"/>
    <!-- Right face -->
    <polygon points="250,200 300,150 300,250 250,300" fill="#3b82f6" stroke="#2563eb" stroke-width="2"/>
    <text x="200" y="340" font-size="14" text-anchor="middle">Cube (3D)</text>
  `);

    return createMathDiagram(id, 400, 360, elements);
}
