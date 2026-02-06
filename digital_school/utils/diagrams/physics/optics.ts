/**
 * Physics Optics & Light Diagram Presets
 * Lenses, mirrors, optical instruments, and wave phenomena
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG optics diagrams
 */
function createOpticsDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * Convex Lens (Converging)
 * @param id Diagram ID
 * @param focalLength Focal length in cm
 */
export function createConvexLens(id: string, focalLength: number = 15): FBDDiagram {
    const cx = 200;
    const cy = 150;
    return createOpticsDiagram(id, 400, 300, [
        // Principal axis
        `<line x1="50" y1="${cy}" x2="350" y2="${cy}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Lens (convex shape)
        `<path d="M ${cx} ${cy - 80} Q ${cx - 15} ${cy} ${cx} ${cy + 80}" fill="none" stroke="#333" stroke-width="3"/>`,
        `<path d="M ${cx} ${cy - 80} Q ${cx + 15} ${cy} ${cx} ${cy + 80}" fill="none" stroke="#333" stroke-width="3"/>`,
        // Focal points
        `<circle cx="${cx - focalLength * 3}" cy="${cy}" r="3" fill="#d32f2f"/>`,
        `<circle cx="${cx + focalLength * 3}" cy="${cy}" r="3" fill="#d32f2f"/>`,
        `<text x="${cx - focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        `<text x="${cx + focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        // Center marker
        `<line x1="${cx}" y1="${cy - 90}" x2="${cx}" y2="${cy + 90}" stroke="#333" stroke-width="2"/>`,
        `<text x="${cx}" y="${cy - 100}" font-size="14" font-weight="bold" text-anchor="middle">Convex Lens</text>`,
        `<text x="${cx}" y="${cy + 110}" font-size="11" text-anchor="middle">f = ${focalLength}cm</text>`
    ]);
}

/**
 * Concave Lens (Diverging)
 * @param id Diagram ID
 * @param focalLength Focal length in cm
 */
export function createConcaveLens(id: string, focalLength: number = 15): FBDDiagram {
    const cx = 200;
    const cy = 150;
    return createOpticsDiagram(id, 400, 300, [
        // Principal axis
        `<line x1="50" y1="${cy}" x2="350" y2="${cy}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Lens (concave shape)
        `<path d="M ${cx} ${cy - 80} Q ${cx + 15} ${cy} ${cx} ${cy + 80}" fill="none" stroke="#333" stroke-width="3"/>`,
        `<path d="M ${cx} ${cy - 80} Q ${cx - 15} ${cy} ${cx} ${cy + 80}" fill="none" stroke="#333" stroke-width="3"/>`,
        // Focal points
        `<circle cx="${cx - focalLength * 3}" cy="${cy}" r="3" fill="#1976d2"/>`,
        `<circle cx="${cx + focalLength * 3}" cy="${cy}" r="3" fill="#1976d2"/>`,
        `<text x="${cx - focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        `<text x="${cx + focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        // Center marker
        `<line x1="${cx}" y1="${cy - 90}" x2="${cx}" y2="${cy + 90}" stroke="#333" stroke-width="2"/>`,
        `<text x="${cx}" y="${cy - 100}" font-size="14" font-weight="bold" text-anchor="middle">Concave Lens</text>`,
        `<text x="${cx}" y="${cy + 110}" font-size="11" text-anchor="middle">f = -${focalLength}cm</text>`
    ]);
}

/**
 * Convex Mirror
 * @param id Diagram ID
 * @param focalLength Focal length in cm
 */
export function createConvexMirror(id: string, focalLength: number = 10): FBDDiagram {
    const cx = 200;
    const cy = 150;
    return createOpticsDiagram(id, 400, 300, [
        // Principal axis
        `<line x1="50" y1="${cy}" x2="350" y2="${cy}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Mirror (convex arc)
        `<path d="M ${cx} ${cy - 80} Q ${cx - 20} ${cy} ${cx} ${cy + 80}" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        // Reflective coating (back)
        `<path d="M ${cx} ${cy - 80} L ${cx + 5} ${cy - 78} L ${cx + 5} ${cy + 78} L ${cx} ${cy + 80}" fill="#666"/>`,
        // Focal point
        `<circle cx="${cx - focalLength * 3}" cy="${cy}" r="3" fill="#1976d2"/>`,
        `<text x="${cx - focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        // Center of curvature
        `<circle cx="${cx - focalLength * 6}" cy="${cy}" r="3" fill="#666"/>`,
        `<text x="${cx - focalLength * 6}" y="${cy + 20}" font-size="12" text-anchor="middle">C</text>`,
        `<text x="${cx}" y="${cy - 100}" font-size="14" font-weight="bold" text-anchor="middle">Convex Mirror</text>`,
        `<text x="${cx}" y="${cy + 110}" font-size="11" text-anchor="middle">f = -${focalLength}cm</text>`
    ]);
}

/**
 * Concave Mirror
 * @param id Diagram ID
 * @param focalLength Focal length in cm
 */
export function createConcaveMirror(id: string, focalLength: number = 10): FBDDiagram {
    const cx = 200;
    const cy = 150;
    return createOpticsDiagram(id, 400, 300, [
        // Principal axis
        `<line x1="50" y1="${cy}" x2="350" y2="${cy}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Mirror (concave arc)
        `<path d="M ${cx} ${cy - 80} Q ${cx + 20} ${cy} ${cx} ${cy + 80}" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        // Reflective coating (front)
        `<path d="M ${cx} ${cy - 80} L ${cx - 5} ${cy - 78} L ${cx - 5} ${cy + 78} L ${cx} ${cy + 80}" fill="#666"/>`,
        // Focal point
        `<circle cx="${cx + focalLength * 3}" cy="${cy}" r="3" fill="#d32f2f"/>`,
        `<text x="${cx + focalLength * 3}" y="${cy + 20}" font-size="12" text-anchor="middle">F</text>`,
        // Center of curvature
        `<circle cx="${cx + focalLength * 6}" cy="${cy}" r="3" fill="#666"/>`,
        `<text x="${cx + focalLength * 6}" y="${cy + 20}" font-size="12" text-anchor="middle">C</text>`,
        `<text x="${cx}" y="${cy - 100}" font-size="14" font-weight="bold" text-anchor="middle">Concave Mirror</text>`,
        `<text x="${cx}" y="${cy + 110}" font-size="11" text-anchor="middle">f = ${focalLength}cm</text>`
    ]);
}

/**
 * Plane Mirror
 */
export function createPlaneMirror(id: string): FBDDiagram {
    return createOpticsDiagram(id, 350, 300, [
        // Mirror surface
        `<line x1="175" y1="50" x2="175" y2="250" stroke="#333" stroke-width="4"/>`,
        // Reflective coating
        `<rect x="170" y="50" width="10" height="200" fill="#666"/>`,
        // Normal line
        `<line x1="175" y1="150" x2="100" y2="150" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Incident ray
        `<line x1="50" y1="100" x2="175" y2="150" stroke="#d32f2f" stroke-width="2" marker-end="url(#arrowred)"/>`,
        // Reflected ray
        `<line x1="175" y1="150" x2="50" y2="200" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowblue)"/>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Plane Mirror</text>`,
        `<text x="100" y="90" font-size="11" fill="#d32f2f">Incident</text>`,
        `<text x="100" y="210" font-size="11" fill="#1976d2">Reflected</text>`
    ]);
}

/**
 * Prism (Triangular)
 * @param id Diagram ID
 * @param angle Apex angle in degrees
 */
export function createPrism(id: string, angle: number = 60): FBDDiagram {
    return createOpticsDiagram(id, 400, 300, [
        // Prism triangle
        `<polygon points="200,80 320,220 80,220" fill="#e3f2fd" stroke="#333" stroke-width="3" opacity="0.7"/>`,
        // White light ray entering
        `<line x1="30" y1="140" x2="140" y2="160" stroke="#666" stroke-width="3"/>`,
        // Dispersed rays (spectrum)
        `<line x1="260" y1="190" x2="370" y2="220" stroke="#ff0000" stroke-width="2"/>`, // Red
        `<line x1="260" y1="190" x2="365" y2="210" stroke="#ff7f00" stroke-width="2"/>`, // Orange
        `<line x1="260" y1="190" x2="360" y2="200" stroke="#ffff00" stroke-width="2"/>`, // Yellow
        `<line x1="260" y1="190" x2="355" y2="190" stroke="#00ff00" stroke-width="2"/>`, // Green
        `<line x1="260" y1="190" x2="350" y2="180" stroke="#0000ff" stroke-width="2"/>`, // Blue
        `<line x1="260" y1="190" x2="345" y2="170" stroke="#4b0082" stroke-width="2"/>`, // Indigo
        `<line x1="260" y1="190" x2="340" y2="160" stroke="#9400d3" stroke-width="2"/>`, // Violet
        `<text x="200" y="50" font-size="14" font-weight="bold" text-anchor="middle">Prism</text>`,
        `<text x="200" y="260" font-size="11" text-anchor="middle">Apex angle: ${angle}°</text>`,
        `<text x="50" y="130" font-size="10">White light</text>`,
        `<text x="320" y="240" font-size="10">Spectrum</text>`
    ]);
}

/**
 * Telescope (Refracting)
 */
export function createTelescope(id: string): FBDDiagram {
    return createOpticsDiagram(id, 500, 250, [
        // Telescope tube
        `<rect x="50" y="100" width="400" height="50" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
        // Objective lens (large)
        `<ellipse cx="70" cy="125" rx="8" ry="25" fill="#b3e5fc" stroke="#333" stroke-width="2"/>`,
        // Eyepiece lens (small)
        `<ellipse cx="430" cy="125" rx="5" ry="15" fill="#b3e5fc" stroke="#333" stroke-width="2"/>`,
        // Light rays
        `<line x1="10" y1="110" x2="70" y2="110" stroke="#ffd54f" stroke-width="2"/>`,
        `<line x1="10" y1="140" x2="70" y2="140" stroke="#ffd54f" stroke-width="2"/>`,
        `<line x1="70" y1="110" x2="250" y2="125" stroke="#ffd54f" stroke-width="1" stroke-dasharray="3,3"/>`,
        `<line x1="70" y1="140" x2="250" y2="125" stroke="#ffd54f" stroke-width="1" stroke-dasharray="3,3"/>`,
        `<text x="250" y="80" font-size="14" font-weight="bold" text-anchor="middle">Refracting Telescope</text>`,
        `<text x="70" y="180" font-size="10" text-anchor="middle">Objective</text>`,
        `<text x="430" y="180" font-size="10" text-anchor="middle">Eyepiece</text>`
    ]);
}

/**
 * Microscope (Compound)
 */
export function createMicroscope(id: string): FBDDiagram {
    return createOpticsDiagram(id, 300, 400, [
        // Body tube
        `<rect x="130" y="50" width="40" height="200" fill="#424242" stroke="#333" stroke-width="2"/>`,
        // Eyepiece
        `<rect x="125" y="30" width="50" height="30" fill="#616161" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="150" cy="45" rx="15" ry="8" fill="#b3e5fc" stroke="#333" stroke-width="1"/>`,
        // Objective lens
        `<ellipse cx="150" cy="260" rx="10" ry="5" fill="#b3e5fc" stroke="#333" stroke-width="1"/>`,
        // Stage
        `<rect x="100" y="280" width="100" height="10" fill="#757575" stroke="#333" stroke-width="2"/>`,
        // Base
        `<rect x="80" y="350" width="140" height="30" fill="#424242" stroke="#333" stroke-width="2"/>`,
        // Mirror/Light source
        `<circle cx="150" cy="330" r="15" fill="#fff9c4" stroke="#333" stroke-width="2"/>`,
        // Specimen
        `<rect x="140" y="275" width="20" height="3" fill="#ff5722"/>`,
        `<text x="150" y="20" font-size="14" font-weight="bold" text-anchor="middle">Compound Microscope</text>`,
        `<text x="200" y="50" font-size="9">Eyepiece</text>`,
        `<text x="200" y="265" font-size="9">Objective</text>`,
        `<text x="200" y="285" font-size="9">Stage</text>`
    ]);
}

/**
 * Diffraction Grating
 * @param id Diagram ID
 * @param spacing Line spacing in micrometers
 */
export function createDiffractionGrating(id: string, spacing: number = 1.67): FBDDiagram {
    return createOpticsDiagram(id, 400, 300, [
        // Grating (multiple slits)
        `<rect x="180" y="50" width="40" height="200" fill="#333" opacity="0.3"/>`,
        ...Array.from({ length: 10 }, (_, i) =>
            `<rect x="180" y="${60 + i * 20}" width="40" height="2" fill="#fff"/>`
        ),
        // Incident light
        `<line x1="50" y1="150" x2="180" y2="150" stroke="#ffd54f" stroke-width="3"/>`,
        // Diffracted orders
        `<line x1="220" y1="150" x2="350" y2="150" stroke="#ff0000" stroke-width="2"/>`, // 0th order
        `<line x1="220" y1="150" x2="340" y2="100" stroke="#00ff00" stroke-width="2"/>`, // +1
        `<line x1="220" y1="150" x2="340" y2="200" stroke="#00ff00" stroke-width="2"/>`, // -1
        `<line x1="220" y1="150" x2="330" y2="70" stroke="#0000ff" stroke-width="2"/>`, // +2
        `<line x1="220" y1="150" x2="330" y2="230" stroke="#0000ff" stroke-width="2"/>`, // -2
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Diffraction Grating</text>`,
        `<text x="200" y="270" font-size="11" text-anchor="middle">d = ${spacing}μm</text>`,
        `<text x="340" y="150" font-size="9">m=0</text>`,
        `<text x="330" y="95" font-size="9">m=+1</text>`,
        `<text x="330" y="210" font-size="9">m=-1</text>`
    ]);
}

/**
 * Laser Beam
 * @param id Diagram ID
 * @param wavelength Wavelength in nm
 */
export function createLaser(id: string, wavelength: number = 632.8): FBDDiagram {
    const color = wavelength < 500 ? '#0000ff' : wavelength < 580 ? '#00ff00' : '#ff0000';
    return createOpticsDiagram(id, 400, 200, [
        // Laser device
        `<rect x="50" y="80" width="100" height="40" fill="#424242" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="100" r="15" fill="#d32f2f"/>`,
        // Laser beam (coherent light)
        `<line x1="150" y1="100" x2="350" y2="100" stroke="${color}" stroke-width="4" opacity="0.8"/>`,
        `<line x1="150" y1="95" x2="350" y2="95" stroke="${color}" stroke-width="1" opacity="0.5"/>`,
        `<line x1="150" y1="105" x2="350" y2="105" stroke="${color}" stroke-width="1" opacity="0.5"/>`,
        // Beam spread lines
        `<line x1="350" y1="100" x2="380" y2="95" stroke="${color}" stroke-width="2" opacity="0.6"/>`,
        `<line x1="350" y1="100" x2="380" y2="105" stroke="${color}" stroke-width="2" opacity="0.6"/>`,
        `<text x="200" y="50" font-size="14" font-weight="bold" text-anchor="middle">Laser</text>`,
        `<text x="200" y="160" font-size="11" text-anchor="middle">λ = ${wavelength}nm</text>`,
        `<text x="100" y="140" font-size="9" text-anchor="middle">Laser source</text>`
    ]);
}

/**
 * Fiber Optic Cable
 */
export function createFiberOptic(id: string): FBDDiagram {
    return createOpticsDiagram(id, 450, 250, [
        // Fiber core (curved path)
        `<path d="M 50 125 Q 150 125, 200 100 T 350 125 T 400 100" fill="none" stroke="#42a5f5" stroke-width="8" opacity="0.6"/>`,
        // Cladding
        `<path d="M 50 125 Q 150 125, 200 100 T 350 125 T 400 100" fill="none" stroke="#90caf9" stroke-width="14" opacity="0.3"/>`,
        // Light ray bouncing inside
        `<path d="M 50 125 L 100 120 L 150 130 L 200 100 L 250 105 L 300 125 L 350 120 L 400 100" 
               fill="none" stroke="#ffd54f" stroke-width="2" stroke-dasharray="5,5"/>`,
        // Input light
        `<line x1="10" y1="125" x2="50" y2="125" stroke="#ffd54f" stroke-width="3"/>`,
        // Output light
        `<line x1="400" y1="100" x2="440" y2="100" stroke="#ffd54f" stroke-width="3"/>`,
        `<text x="225" y="50" font-size="14" font-weight="bold" text-anchor="middle">Fiber Optic Cable</text>`,
        `<text x="225" y="200" font-size="10" text-anchor="middle">Total Internal Reflection</text>`,
        `<text x="30" y="115" font-size="9">Input</text>`,
        `<text x="410" y="90" font-size="9">Output</text>`
    ]);
}
