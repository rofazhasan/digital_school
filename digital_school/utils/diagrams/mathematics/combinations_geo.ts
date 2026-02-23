/**
 * Mathematics Geometry Combinations
 * Nested shapes: Sphere in Cylinder, Cone in Cylinder, etc.
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
 * Sphere inscribed in a Cylinder
 */
export function createSphereInCylinder(id: string, radius: number = 70): FBDDiagram {
    const cx = 200, cy = 200;
    const height = radius * 2;

    return createMathDiagram(id, 400, 450, [
        // Cylinder Bottom
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        // Cylinder Sides
        `<line x1="${cx - radius}" y1="${cy - height / 2}" x2="${cx - radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        `<line x1="${cx + radius}" y1="${cy - height / 2}" x2="${cx + radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        // Sphere
        `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#93c5fd" opacity="0.4" stroke="#1976d2" stroke-width="2"/>`,
        `<ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#1976d2" stroke-width="1" stroke-dasharray="4,2"/>`,
        // Cylinder Top
        `<ellipse cx="${cx}" cy="${cy - height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Sphere in Cylinder</text>`
    ]);
}

/**
 * Cone inscribed in a Cylinder
 */
export function createConeInCylinder(id: string, radius: number = 70, height: number = 140): FBDDiagram {
    const cx = 200, cy = 220;

    return createMathDiagram(id, 400, 450, [
        // Cylinder
        `<ellipse cx="${cx}" cy="${cy + height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        `<line x1="${cx - radius}" y1="${cy - height / 2}" x2="${cx - radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        `<line x1="${cx + radius}" y1="${cy - height / 2}" x2="${cx + radius}" y2="${cy + height / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        `<ellipse cx="${cx}" cy="${cy - height / 2}" rx="${radius}" ry="${radius * 0.3}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        // Cone
        `<path d="M ${cx} ${cy - height / 2} L ${cx - radius} ${cy + height / 2} A ${radius} ${radius * 0.3} 0 0 0 ${cx + radius} ${cy + height / 2} Z" 
               fill="#ffab91" opacity="0.5" stroke="#d84315" stroke-width="2"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Cone in Cylinder</text>`
    ]);
}

/**
 * Sphere in a Cone
 */
export function createSphereInCone(id: string, coneRadius: number = 80, coneHeight: number = 160): FBDDiagram {
    const cx = 200, cy = 230;
    const topY = cy - coneHeight / 2;
    // Calculate sphere radius for tangency based on triangle geometry
    const theta = Math.atan(coneRadius / coneHeight);
    const sphereRadius = coneRadius * (1 - Math.sin(theta)) / Math.cos(theta); // Rough approximation for visual
    const sphereY = cy + coneHeight / 2 - sphereRadius;

    return createMathDiagram(id, 400, 450, [
        // Cone Outline
        `<path d="M ${cx} ${topY} L ${cx - coneRadius} ${cy + coneHeight / 2}" stroke="#d84315" stroke-width="2"/>`,
        `<path d="M ${cx} ${topY} L ${cx + coneRadius} ${cy + coneHeight / 2}" stroke="#d84315" stroke-width="2"/>`,
        `<ellipse cx="${cx}" cy="${cy + coneHeight / 2}" rx="${coneRadius}" ry="${coneRadius * 0.3}" fill="none" stroke="#d84315" stroke-width="2"/>`,
        // Sphere
        `<circle cx="${cx}" cy="${sphereY}" r="${sphereRadius}" fill="#93c5fd" opacity="0.6" stroke="#1976d2" stroke-width="2"/>`,
        `<text x="${cx}" y="50" font-size="14" font-weight="bold" text-anchor="middle">Sphere in Cone</text>`
    ]);
}

/**
 * Cylinder inscribed in a Sphere
 */
export function createCylinderInSphere(id: string, sphereRadius: number = 100): FBDDiagram {
    const cx = 200, cy = 200;
    const cylRadius = sphereRadius * 0.8;
    const cylHeight = 2 * Math.sqrt(sphereRadius ** 2 - cylRadius ** 2);

    return createMathDiagram(id, 400, 400, [
        // Sphere
        `<circle cx="${cx}" cy="${cy}" r="${sphereRadius}" fill="#93c5fd" opacity="0.3" stroke="#1976d2" stroke-width="2"/>`,
        // Cylinder
        `<ellipse cx="${cx}" cy="${cy + cylHeight / 2}" rx="${cylRadius}" ry="${cylRadius * 0.2}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        `<line x1="${cx - cylRadius}" y1="${cy - cylHeight / 2}" x2="${cx - cylRadius}" y2="${cy + cylHeight / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        `<line x1="${cx + cylRadius}" y1="${cy - cylHeight / 2}" x2="${cx + cylRadius}" y2="${cy + cylHeight / 2}" stroke="#2e7d32" stroke-width="2"/>`,
        `<ellipse cx="${cx}" cy="${cy - cylHeight / 2}" rx="${cylRadius}" ry="${cylRadius * 0.2}" fill="none" stroke="#2e7d32" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Cylinder in Sphere</text>`
    ]);
}

/**
 * Circle inscribed in a Square
 */
export function createCircleInSquare(id: string, side: number = 160): FBDDiagram {
    const cx = 200, cy = 200;
    const r = side / 2;

    return createMathDiagram(id, 400, 400, [
        `<rect x="${cx - r}" y="${cy - r}" width="${side}" height="${side}" fill="none" stroke="#2563eb" stroke-width="2"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#93c5fd" opacity="0.5" stroke="#1d4ed8" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Circle in Square</text>`
    ]);
}

/**
 * Circle inscribed in a Triangle (Incircle)
 */
export function createCircleInTriangle(id: string): FBDDiagram {
    const cx = 200, cy = 220;
    // Equilateral triangle
    const side = 200;
    const h = (Math.sqrt(3) / 2) * side;
    const r = h / 3; // Inradius for equilateral

    return createMathDiagram(id, 400, 400, [
        `<polygon points="${cx},${cy - 2 * h / 3} ${cx - side / 2},${cy + h / 3} ${cx + side / 2},${cy + h / 3}" fill="none" stroke="#2563eb" stroke-width="2"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#93c5fd" opacity="0.5" stroke="#1d4ed8" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Incircle of Triangle</text>`
    ]);
}

/**
 * Cube inscribed in a Sphere
 */
export function createCubeInSphere(id: string, sphereRadius: number = 100): FBDDiagram {
    const cx = 200, cy = 200;
    const side = (2 * sphereRadius) / Math.sqrt(3);

    return createMathDiagram(id, 400, 400, [
        `<circle cx="${cx}" cy="${cy}" r="${sphereRadius}" fill="#93c5fd" opacity="0.3" stroke="#1976d2" stroke-width="2"/>`,
        `<rect x="${cx - side / 2}" y="${cy - side / 2}" width="${side}" height="${side}" fill="#66bb6a" opacity="0.6" stroke="#2e7d32" stroke-width="2"/>`,
        `<path d="M ${cx - side / 2} ${cy - side / 2} L ${cx - side / 4} ${cy - side / 4 * 3} L ${cx + side / 4 * 3} ${cy - side / 4 * 3} L ${cx + side / 2} ${cy - side / 2} Z" fill="#81c784" opacity="0.6" stroke="#2e7d32" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Cube in Sphere</text>`
    ]);
}

/**
 * Square inscribed in a Circle
 */
export function createSquareInCircle(id: string, r: number = 80): FBDDiagram {
    const cx = 200, cy = 200;
    const side = r * Math.sqrt(2);

    return createMathDiagram(id, 400, 400, [
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2563eb" stroke-width="2"/>`,
        `<rect x="${cx - side / 2}" y="${cy - side / 2}" width="${side}" height="${side}" fill="#93c5fd" opacity="0.5" stroke="#1d4ed8" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Square in Circle</text>`
    ]);
}

/**
 * Triangle inscribed in a Circle (Circumcircle)
 */
export function createTriangleInCircle(id: string, r: number = 80): FBDDiagram {
    const cx = 200, cy = 200;
    const points: [number, number][] = [];
    for (let i = 0; i < 3; i++) {
        const angle = (i * 120 - 90) * Math.PI / 180;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    const pointsStr = points.map(p => p.join(',')).join(' ');

    return createMathDiagram(id, 400, 400, [
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2563eb" stroke-width="2"/>`,
        `<polygon points="${pointsStr}" fill="#93c5fd" opacity="0.5" stroke="#1d4ed8" stroke-width="2"/>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">Triangle in Circle</text>`
    ]);
}


