/**
 * Mathematics 2D/3D Shapes and Functions Diagram Presets
 * Geometric shapes, 3D solids, and mathematical function graphs
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG mathematics diagrams
 */
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

// 2D SHAPES

export function createSquare(id: string, side: number = 100): FBDDiagram {
    const cx = 200, cy = 200;
    return createMathDiagram(id, 400, 400, [
        `<rect x="${cx - side / 2}" y="${cy - side / 2}" width="${side}" height="${side}" 
               fill="#e3f2fd" stroke="#1976d2" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Square</text>`,
        `<text x="${cx}" y="350" font-size="12" text-anchor="middle">Side = ${side}</text>`,
        `<text x="${cx}" y="370" font-size="11" text-anchor="middle">Area = ${side * side}</text>`
    ]);
}

export function createPentagon(id: string, side: number = 80): FBDDiagram {
    const cx = 200, cy = 200, r = side;
    const points: string[] = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${points.join(' ')}" fill="#fff9c4" stroke="#f57f17" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Pentagon</text>`,
        `<text x="${cx}" y="350" font-size="12" text-anchor="middle">5 sides</text>`
    ]);
}

export function createHexagon(id: string, side: number = 70): FBDDiagram {
    const cx = 200, cy = 200, r = side;
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${points.join(' ')}" fill="#c8e6c9" stroke="#2e7d32" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Hexagon</text>`,
        `<text x="${cx}" y="350" font-size="12" text-anchor="middle">6 sides</text>`
    ]);
}

export function createOctagon(id: string, side: number = 60): FBDDiagram {
    const cx = 200, cy = 200, r = side;
    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${points.join(' ')}" fill="#ffccbc" stroke="#d84315" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Octagon</text>`,
        `<text x="${cx}" y="350" font-size="12" text-anchor="middle">8 sides</text>`
    ]);
}

export function createTrapezoid(id: string, a: number = 120, b: number = 80, h: number = 80): FBDDiagram {
    const cx = 200, cy = 200;
    return createMathDiagram(id, 400, 400, [
        `<polygon points="${cx - a / 2},${cy + h / 2} ${cx + a / 2},${cy + h / 2} ${cx + b / 2},${cy - h / 2} ${cx - b / 2},${cy - h / 2}" 
                 fill="#f3e5f5" stroke="#7b1fa2" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Trapezoid</text>`,
        `<text x="${cx}" y="350" font-size="11" text-anchor="middle">a=${a}, b=${b}, h=${h}</text>`
    ]);
}

export function createRhombus(id: string, side: number = 80, angle: number = 60): FBDDiagram {
    const cx = 200, cy = 200;
    const rad = angle * Math.PI / 180;
    const dx = side * Math.cos(rad);
    const dy = side * Math.sin(rad);

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${cx},${cy - side} ${cx + dx},${cy - dy} ${cx},${cy + side} ${cx - dx},${cy + dy}" 
                 fill="#ffe0b2" stroke="#e65100" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Rhombus</text>`,
        `<text x="${cx}" y="350" font-size="11" text-anchor="middle">Side=${side}, Angle=${angle}°</text>`
    ]);
}

export function createParallelogram(id: string, a: number = 120, b: number = 70, angle: number = 60): FBDDiagram {
    const cx = 200, cy = 200;
    const offset = b * Math.cos(angle * Math.PI / 180);

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${cx - a / 2},${cy + b / 2} ${cx + a / 2},${cy + b / 2} ${cx + a / 2 + offset},${cy - b / 2} ${cx - a / 2 + offset},${cy - b / 2}" 
                 fill="#e1bee7" stroke="#8e24aa" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Parallelogram</text>`,
        `<text x="${cx}" y="350" font-size="11" text-anchor="middle">a=${a}, b=${b}, θ=${angle}°</text>`
    ]);
}

export function createEllipse(id: string, a: number = 120, b: number = 70): FBDDiagram {
    const cx = 200, cy = 200;
    return createMathDiagram(id, 400, 400, [
        `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="#b2dfdb" stroke="#00796b" stroke-width="3"/>`,
        `<line x1="${cx - a}" y1="${cy}" x2="${cx + a}" y2="${cy}" stroke="#333" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="${cx}" y1="${cy - b}" x2="${cx}" y2="${cy + b}" stroke="#333" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Ellipse</text>`,
        `<text x="${cx}" y="350" font-size="11" text-anchor="middle">a=${a}, b=${b}</text>`
    ]);
}

// 3D SHAPES

export function createSphere(id: string, radius: number = 80): FBDDiagram {
    const cx = 200, cy = 200;
    return createMathDiagram(id, 400, 400, [
        `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#sphereGradient)" stroke="#1976d2" stroke-width="3"/>`,
        `<ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#1976d2" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<defs>
          <radialGradient id="sphereGradient">
            <stop offset="0%" stop-color="#e3f2fd"/>
            <stop offset="100%" stop-color="#1976d2"/>
          </radialGradient>
        </defs>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Sphere</text>`,
        `<text x="${cx}" y="350" font-size="11" text-anchor="middle">r=${radius}</text>`,
        `<text x="${cx}" y="370" font-size="10" text-anchor="middle">Volume = ${((4 / 3) * Math.PI * radius ** 3).toFixed(0)}</text>`
    ]);
}

export function createCylinder(id: string, radius: number = 60, height: number = 120): FBDDiagram {
    const cx = 200, cy = 200;
    return createMathDiagram(id, 400, 450, [
        // Top ellipse
        `<ellipse cx="${cx}" cy="${cy - height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="#c8e6c9" stroke="#2e7d32" stroke-width="3"/>`,
        // Side rectangles
        `<rect x="${cx - radius}" y="${cy - height / 2}" width="${radius * 2}" height="${height}" fill="#a5d6a7" stroke="#2e7d32" stroke-width="3"/>`,
        // Bottom ellipse
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="#66bb6a" stroke="#2e7d32" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Cylinder</text>`,
        `<text x="${cx}" y="400" font-size="11" text-anchor="middle">r=${radius}, h=${height}</text>`
    ]);
}

export function createCone(id: string, radius: number = 70, height: number = 120): FBDDiagram {
    const cx = 200, cy = 250;
    return createMathDiagram(id, 400, 450, [
        // Base
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="#ffccbc" stroke="#d84315" stroke-width="3"/>`,
        // Sides
        `<path d="M ${cx} ${cy - height / 2} L ${cx - radius} ${cy + height / 2}" fill="none" stroke="#d84315" stroke-width="3"/>`,
        `<path d="M ${cx} ${cy - height / 2} L ${cx + radius} ${cy + height / 2}" fill="none" stroke="#d84315" stroke-width="3"/>`,
        // Fill
        `<path d="M ${cx} ${cy - height / 2} L ${cx - radius} ${cy + height / 2} A ${radius} ${radius * 0.3} 0 0 0 ${cx + radius} ${cy + height / 2} Z" 
               fill="#ffab91" opacity="0.7"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Cone</text>`,
        `<text x="${cx}" y="420" font-size="11" text-anchor="middle">r=${radius}, h=${height}</text>`
    ]);
}

/**
 * Advanced Shaded Cylinder (Filling level)
 */
export function createCylinderShaded(id: string, radius: number = 60, height: number = 120, fillRatio: number = 0.5): FBDDiagram {
    const cx = 200, cy = 200;
    const filledHeight = height * fillRatio;
    const fillY = (cy + height / 2) - filledHeight;

    return createMathDiagram(id, 400, 450, [
        // Bottom ellipse
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="#66bb6a" stroke="#2e7d32" stroke-width="3"/>`,
        // Shaded part
        `<rect x="${cx - radius}" y="${fillY}" width="${radius * 2}" height="${filledHeight}" fill="#81c784" opacity="0.8"/>`,
        `<ellipse cx="${cx}" cy="${fillY}" rx="${radius}" ry="${radius * 0.3}" fill="#a5d6a7" stroke="#2e7d32" stroke-width="2"/>`,
        // Side lines
        `<line x1="${cx - radius}" y1="${cy - height / 2}" x2="${cx - radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="3"/>`,
        `<line x1="${cx + radius}" y1="${cy - height / 2}" x2="${cx + radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="3"/>`,
        // Top ellipse
        `<ellipse cx="${cx}" cy="${cy - height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#2e7d32" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Cylinder (Fill: ${(fillRatio * 100).toFixed(0)}%)</text>`
    ]);
}

/**
 * Advanced Shaded Cone (Frustum / Sliced)
 */
export function createConeShaded(id: string, radius: number = 70, height: number = 120, h1: number = 0, h2: number = 0.5): FBDDiagram {
    const cx = 200, cy = 250;
    const topY = cy - height / 2;

    // Helper to get radius at a given ratio from apex (0 to 1)
    const getRadAt = (ratio: number) => radius * ratio;
    const getYAt = (ratio: number) => topY + height * ratio;

    const r1 = getRadAt(h1);
    const y1 = getYAt(h1);
    const r2 = getRadAt(h2);
    const y2 = getYAt(h2);

    return createMathDiagram(id, 400, 450, [
        // Base
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#d84315" stroke-width="2" stroke-dasharray="5,2"/>`,
        // Shaded region (Frustum)
        `<path d="M ${cx - r2} ${y2} A ${r2} ${r2 * 0.3} 0 0 0 ${cx + r2} ${y2} L ${cx + r1} ${y1} A ${r1} ${r1 * 0.3} 0 0 1 ${cx - r1} ${y1} Z" 
               fill="#ffab91" opacity="0.8" stroke="#d84315" stroke-width="2"/>`,
        // Main outline
        `<path d="M ${cx} ${topY} L ${cx - radius} ${cy + height / 2}" fill="none" stroke="#d84315" stroke-width="3"/>`,
        `<path d="M ${cx} ${topY} L ${cx + radius} ${cy + height / 2}" fill="none" stroke="#d84315" stroke-width="3"/>`,
        `<ellipse cx="${cx}" cy="${y2}" rx="${r2}" ry="${r2 * 0.3}" fill="none" stroke="#d84315" stroke-width="2"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Cone (Shaded Section)</text>`
    ]);
}

/**
 * Advanced Shaded Pyramid
 */
export function createPyramidShaded(id: string, base: number = 100, height: number = 120, h1: number = 0.3, h2: number = 0.7): FBDDiagram {
    const cx = 200, cy = 250;
    const topY = cy - height / 2;
    const baseY = cy + height / 3;

    const getSideAt = (ratio: number) => base * ratio;
    const getYAt = (ratio: number) => topY + (baseY - topY) * ratio;

    const s1 = getSideAt(h1);
    const y1 = getYAt(h1);
    const s2 = getSideAt(h2);
    const y2 = getYAt(h2);

    return createMathDiagram(id, 400, 450, [
        // Outline
        `<path d="M ${cx} ${topY} L ${cx - base / 2} ${baseY} L ${cx + base / 2} ${baseY} Z" fill="none" stroke="#f57f17" stroke-width="2"/>`,
        // Shaded Frustum
        `<path d="M ${cx - s1 / 2} ${y1} L ${cx + s1 / 2} ${y1} L ${cx + s2 / 2} ${y2} L ${cx - s2 / 2} ${y2} Z" fill="#fdd835" opacity="0.7"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Pyramid (Shaded)</text>`
    ]);
}


export function createPyramid(id: string, base: number = 100, height: number = 120): FBDDiagram {
    const cx = 200, cy = 250;
    return createMathDiagram(id, 400, 450, [
        // Base (square)
        `<polygon points="${cx - base / 2},${cy + height / 3} ${cx + base / 2},${cy + height / 3} ${cx + base / 2 - 20},${cy + height / 3 + 20} ${cx - base / 2 - 20},${cy + height / 3 + 20}" 
                 fill="#fff9c4" stroke="#f57f17" stroke-width="2"/>`,
        // Faces
        `<path d="M ${cx} ${cy - height / 2} L ${cx - base / 2} ${cy + height / 3} L ${cx + base / 2} ${cy + height / 3} Z" 
               fill="#fdd835" stroke="#f57f17" stroke-width="3"/>`,
        `<path d="M ${cx} ${cy - height / 2} L ${cx + base / 2} ${cy + height / 3} L ${cx + base / 2 - 20} ${cy + height / 3 + 20} Z" 
               fill="#fbc02d" stroke="#f57f17" stroke-width="3"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Pyramid</text>`,
        `<text x="${cx}" y="420" font-size="11" text-anchor="middle">Base=${base}, h=${height}</text>`
    ]);
}

// FUNCTION GRAPHS

export function createCosine(id: string, A: number = 1, omega: number = 1): FBDDiagram {
    const elements: string[] = [
        // Axes
        `<line x1="50" y1="200" x2="450" y2="200" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="220" font-size="12">x</text>`,
        `<text x="30" y="50" font-size="12">y</text>`,
    ];

    // Cosine curve
    let path = 'M 50 ';
    for (let x = 0; x <= 400; x += 2) {
        const y = 200 - A * 100 * Math.cos(omega * x / 50);
        path += x === 0 ? y : ` L ${50 + x} ${y}`;
    }
    elements.push(`<path d="${path}" fill="none" stroke="#1976d2" stroke-width="3"/>`);

    elements.push(`<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">y = ${A}cos(${omega}x)</text>`);

    return createMathDiagram(id, 500, 400, elements);
}

export function createTangent(id: string, A: number = 1, omega: number = 1): FBDDiagram {
    const elements: string[] = [
        // Axes
        `<line x1="50" y1="200" x2="450" y2="200" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="250" y1="350" x2="250" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="220" font-size="12">x</text>`,
        `<text x="230" y="50" font-size="12">y</text>`,
    ];

    // Tangent curve (with asymptotes)
    for (let segment = 0; segment < 3; segment++) {
        let path = '';
        const offset = segment * 100 - 100;
        for (let x = -45; x <= 45; x += 2) {
            const y = 200 - A * 50 * Math.tan(omega * x * Math.PI / 180);
            if (Math.abs(y - 200) < 150) {
                path += path === '' ? `M ${250 + offset + x} ${y}` : ` L ${250 + offset + x} ${y}`;
            }
        }
        if (path) elements.push(`<path d="${path}" fill="none" stroke="#d32f2f" stroke-width="3"/>`);

        // Asymptotes
        const asymX = 250 + offset + 50;
        if (asymX > 50 && asymX < 450) {
            elements.push(`<line x1="${asymX}" y1="50" x2="${asymX}" y2="350" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`);
        }
    }

    elements.push(`<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">y = ${A}tan(${omega}x)</text>`);

    return createMathDiagram(id, 500, 400, elements);
}

export function createExponential(id: string, a: number = 2): FBDDiagram {
    const elements: string[] = [
        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="12">x</text>`,
        `<text x="30" y="50" font-size="12">y</text>`,
    ];

    // Exponential curve
    let path = '';
    for (let x = -200; x <= 200; x += 2) {
        const y = 350 - 50 * Math.pow(a, x / 50);
        if (y > 50 && y < 350) {
            path += path === '' ? `M ${250 + x} ${y}` : ` L ${250 + x} ${y}`;
        }
    }
    elements.push(`<path d="${path}" fill="none" stroke="#388e3c" stroke-width="3"/>`);

    elements.push(`<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">y = ${a}^x</text>`);

    return createMathDiagram(id, 500, 400, elements);
}

export function createLogarithm(id: string, base: number = 10): FBDDiagram {
    const elements: string[] = [
        // Axes
        `<line x1="50" y1="200" x2="450" y2="200" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="220" font-size="12">x</text>`,
        `<text x="30" y="50" font-size="12">y</text>`,
    ];

    // Logarithm curve
    let path = '';
    for (let x = 1; x <= 400; x += 2) {
        const y = 200 - 50 * Math.log(x / 10) / Math.log(base);
        if (y > 50 && y < 350) {
            path += path === '' ? `M ${50 + x} ${y}` : ` L ${50 + x} ${y}`;
        }
    }
    elements.push(`<path d="${path}" fill="none" stroke="#f57c00" stroke-width="3"/>`);

    // Asymptote at x=0
    elements.push(`<line x1="50" y1="50" x2="50" y2="350" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`);

    elements.push(`<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">y = log${base}(x)</text>`);

    return createMathDiagram(id, 500, 400, elements);
}

export function createAbsoluteValue(id: string, a: number = 1): FBDDiagram {
    return createMathDiagram(id, 500, 400, [
        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="250" y1="350" x2="250" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="12">x</text>`,
        `<text x="230" y="50" font-size="12">y</text>`,
        // V-shape
        `<path d="M 50 ${350 - a * 200} L 250 350 L 450 ${350 - a * 200}" fill="none" stroke="#7b1fa2" stroke-width="3"/>`,
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">y = ${a}|x|</text>`
    ]);
}
