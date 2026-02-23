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
  } else if (type === 'isosceles') {
    elements.push(`
      <polygon points="200,50 120,300 280,300" fill="none" stroke="#2563eb" stroke-width="3"/>
      <line x1="150" y1="170" x2="160" y2="180" stroke="#2563eb" stroke-width="2"/>
      <line x1="240" y1="180" x2="250" y2="170" stroke="#2563eb" stroke-width="2"/>
      <text x="200" y="40" font-size="12" text-anchor="middle">A</text>
      <text x="110" y="320" font-size="12">B</text>
      <text x="290" y="320" font-size="12">C</text>
      <text x="200" y="350" font-size="14" text-anchor="middle">Isosceles Triangle</text>
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

/**
 * Advanced Shaded Triangle
 */
export function createTriangleShaded(
  id: string,
  type: 'equilateral' | 'right' | 'isosceles' | 'scalene' | 'obtuse' = 'equilateral',
  shadeRegion?: 'top' | 'bottom' | 'left' | 'right' | 'inner-circle'
): FBDDiagram {
  const elements: string[] = [];
  let points = "";
  let centroid = { x: 200, y: 233 };

  if (type === 'equilateral') {
    points = "200,100 100,300 300,300";
    centroid = { x: 200, y: 233 };
  } else if (type === 'right') {
    points = "100,100 100,300 300,300";
    centroid = { x: 167, y: 233 };
  } else if (type === 'isosceles') {
    points = "200,50 120,300 280,300";
    centroid = { x: 200, y: 216 };
  } else if (type === 'scalene') {
    points = "150,120 100,300 350,280";
    centroid = { x: 200, y: 233 };
  } else if (type === 'obtuse') {
    points = "100,200 350,200 150,100";
    centroid = { x: 200, y: 167 };
  }

  const p = points.split(' ').map(pair => pair.split(',').map(Number));

  // Draw main triangle
  elements.push(`<polygon points="${points}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

  if (shadeRegion === 'inner-circle') {
    elements.push(`<circle cx="${centroid.x}" cy="${centroid.y}" r="40" fill="#93c5fd" opacity="0.5" stroke="#2563eb" stroke-dasharray="2,2"/>`);
  } else if (shadeRegion === 'top') {
    const mid1 = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2];
    const mid2 = [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2];
    elements.push(`<polygon points="${p[0][0]},${p[0][1]} ${mid1[0]},${mid1[1]} ${mid2[0]},${mid2[1]}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'bottom') {
    const mid1 = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2];
    const mid2 = [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2];
    elements.push(`<polygon points="${mid1[0]},${mid1[1]} ${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${mid2[0]},${mid2[1]}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'left') {
    // Shade between vertex 0, vertex 1 and midpoint of (0,2) or similar split
    const midBase = [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2];
    elements.push(`<polygon points="${p[0][0]},${p[0][1]} ${p[1][0]},${p[1][1]} ${midBase[0]},${midBase[1]}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'right') {
    const midBase = [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2];
    elements.push(`<polygon points="${p[0][0]},${p[0][1]} ${midBase[0]},${midBase[1]} ${p[2][0]},${p[2][1]}" fill="#93c5fd" opacity="0.6"/>`);
  }

  elements.push(`<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">${type.charAt(0).toUpperCase() + type.slice(1)} Triangle</text>`);

  return createMathDiagram(id, 400, 370, elements);
}

/**
 * Advanced Shaded Circle (Sectors, Segments, Rings)
 */
export function createCircleShaded(
  id: string,
  radius: number = 100,
  shadeType: 'sector' | 'segment' | 'ring' = 'sector',
  val1: number = 0, // start angle or inner radius
  val2: number = 90 // end angle
): FBDDiagram {
  const elements: string[] = [];
  const cx = 200, cy = 200;

  // Main circle
  elements.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#2563eb" stroke-width="2"/>`);

  if (shadeType === 'sector') {
    const startRad = (val1 - 90) * Math.PI / 180;
    const endRad = (val2 - 90) * Math.PI / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = (val2 - val1) > 180 ? 1 : 0;

    elements.push(`<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="#93c5fd" opacity="0.6" stroke="#1d4ed8"/>`);
  } else if (shadeType === 'ring') {
    const innerR = val1;
    elements.push(`<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,2"/>`);
    elements.push(`<path d="M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z
                            M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy + innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z" 
                   fill="#93c5fd" opacity="0.5" fill-rule="evenodd"/>`);
  }

  elements.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="#333"/>`);
  elements.push(`<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Circle (${shadeType})</text>`);

  return createMathDiagram(id, 400, 400, elements);
}

/**
 * Advanced Shaded Rectangle/Square
 */
export function createRectangleShaded(
  id: string,
  width: number = 200,
  height: number = 100,
  shadeRegion?: 'top' | 'bottom' | 'left' | 'right' | 'diagonal-tl-br' | 'diagonal-tr-bl'
): FBDDiagram {
  const elements: string[] = [];
  const x = (400 - width) / 2;
  const y = (300 - height) / 2;

  // Main rectangle
  elements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

  if (shadeRegion === 'top') {
    elements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height / 2}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'bottom') {
    elements.push(`<rect x="${x}" y="${y + height / 2}" width="${width}" height="${height / 2}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'left') {
    elements.push(`<rect x="${x}" y="${y}" width="${width / 2}" height="${height}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'right') {
    elements.push(`<rect x="${x + width / 2}" y="${y}" width="${width / 2}" height="${height}" fill="#93c5fd" opacity="0.6"/>`);
  } else if (shadeRegion === 'diagonal-tl-br') {
    elements.push(`<polygon points="${x},${y} ${x + width},${y} ${x + width},${y + height}" fill="#93c5fd" opacity="0.6"/>`);
  }

  const title = width === height ? "Square" : "Rectangle";
  elements.push(`<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">${title} (Shaded)</text>`);

  return createMathDiagram(id, 400, 350, elements);
}

/**
 * Advanced Shaded Regular Polygon
 */
export function createPolygonShaded(
  id: string,
  sides: number = 5,
  radius: number = 80,
  shadeIndices?: number[] // indices of vertices to form a shaded polygon
): FBDDiagram {
  const elements: string[] = [];
  const cx = 200, cy = 200;
  const points: [number, number][] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i * (360 / sides) - 90) * Math.PI / 180;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  const pointsStr = points.map(p => p.join(',')).join(' ');
  elements.push(`<polygon points="${pointsStr}" fill="none" stroke="#2563eb" stroke-width="3"/>`);

  if (shadeIndices && shadeIndices.length > 1) {
    const shadePoints = shadeIndices.map(idx => points[idx % sides].join(',')).join(' ');
    // Optionally connect to center for sectors
    elements.push(`<polygon points="${shadePoints}" fill="#93c5fd" opacity="0.6" stroke="#1d4ed8" stroke-dasharray="2,2"/>`);
  } else {
    // Default: shade one triangular segment from center
    const p1 = points[0];
    const p2 = points[1];
    elements.push(`<polygon points="${cx},${cy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}" fill="#93c5fd" opacity="0.6"/>`);
  }

  elements.push(`<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">${sides}-sided Polygon</text>`);

  return createMathDiagram(id, 400, 400, elements);
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
