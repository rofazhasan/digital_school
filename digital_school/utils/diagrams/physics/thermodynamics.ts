/**
 * Physics Thermodynamics Diagram Presets
 * PV diagrams, heat engines, thermodynamic cycles, and phase diagrams
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG thermodynamics diagrams
 * @deprecated Use FBDBuilder instead
 */
function createThermoDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * PV Diagram (Pressure-Volume)
 * Replaces basic lines with smooth curves and shading
 */
export function createPVDiagram(id: string, process: string = 'isothermal'): FBDDiagram {
    const width = 500;
    const height = 400;
    const builder = new FBDBuilder(id, width, height);

    // Standard axes are P (y) and V (x)
    // We'll draw them manually or use builder features, but custom labeling is needed

    let curvePath = '';
    let areaPath = '';
    let label = '';
    let color = '';
    let p1 = { x: 100, y: 100 };
    let p2 = { x: 400, y: 300 };

    if (process === 'isothermal') {
        // P = k/V
        // P1V1 = P2V2
        p1 = { x: 100, y: 100 };
        p2 = { x: 400, y: 300 };
        // Control point for hyperbola-like curve
        curvePath = `M ${p1.x} ${p1.y} Q 180 280, ${p2.x} ${p2.y}`;
        areaPath = `M ${p1.x} ${p1.y} Q 180 280, ${p2.x} ${p2.y} L ${p2.x} 350 L ${p1.x} 350 Z`;
        label = 'Isothermal (T = const)';
        color = '#d32f2f'; // Red for heat involved
    } else if (process === 'adiabatic') {
        // Steeper than isothermal
        p1 = { x: 100, y: 80 };
        p2 = { x: 350, y: 320 };
        curvePath = `M ${p1.x} ${p1.y} Q 150 280, ${p2.x} ${p2.y}`;
        areaPath = `M ${p1.x} ${p1.y} Q 150 280, ${p2.x} ${p2.y} L ${p2.x} 350 L ${p1.x} 350 Z`;
        label = 'Adiabatic (Q = 0)';
        color = '#1976d2'; // Blue 
    } else if (process === 'isobaric') {
        p1 = { x: 100, y: 200 };
        p2 = { x: 400, y: 200 };
        curvePath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
        areaPath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p2.x} 350 L ${p1.x} 350 Z`;
        label = 'Isobaric (P = const)';
        color = '#388e3c'; // Green
    } else if (process === 'isochoric') {
        p1 = { x: 250, y: 100 };
        p2 = { x: 250, y: 300 };
        curvePath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
        // No area under vertical line
        areaPath = '';
        label = 'Isochoric (V = const)';
        color = '#f57c00'; // Orange
    }

    const svgElements = [
        // Grid/Axes background
        `<defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#eee" stroke-width="1"/>
            </pattern>
        </defs>`,
        `<rect width="100%" height="100%" fill="url(#grid)" />`,

        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="14" font-weight="bold" font-family="Inter, sans-serif">V</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold" font-family="Inter, sans-serif">P</text>`,

        // Area under curve (Work) using semi-transparent fill
        areaPath ? `<path d="${areaPath}" fill="${color}" fill-opacity="0.1" stroke="none"/>` : '',

        // Process Curve
        `<path d="${curvePath}" fill="none" stroke="${color}" stroke-width="3"/>`,

        // Arrows to indicate direction (approximate mid-point)
        // Manual placement for simplicity based on process type
        // ... (complex to calculate exact tangent, so we skip or put standardized marker)

        // Points
        `<circle cx="${p1.x}" cy="${p1.y}" r="4" fill="#333"/>`,
        `<text x="${p1.x - 10}" y="${p1.y - 10}" font-size="12" font-family="Inter, sans-serif">1</text>`,
        `<circle cx="${p2.x}" cy="${p2.y}" r="4" fill="#333"/>`,
        `<text x="${p2.x + 10}" y="${p2.y + 10}" font-size="12" font-family="Inter, sans-serif">2</text>`,

        // Title
        `<text x="250" y="30" font-size="16" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${label}</text>`
    ];

    builder.setBackgroundSVG(svgElements.join('\n'));
    // We don't really use physics points/forces here, so we just build
    return builder.build();
}

/**
 * Carnot Cycle
 * World-class rendering with 4 distinct steps and labeled isotherms/adiabats
 */
export function createCarnotCycle(id: string, Th: number = 500, Tc: number = 300): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 500);

    // Coordinates for cycle points
    const p1 = { x: 150, y: 150 }; // Start of isothermal expansion
    const p2 = { x: 300, y: 220 }; // End of isothermal expansion / Start of adiabatic expansion
    const p3 = { x: 450, y: 350 }; // End of adiabatic expansion / Start of isothermal compression
    const p4 = { x: 250, y: 320 }; // End of isothermal compression / Start of adiabatic compression

    // Paths
    // 1->2 Isothermal Exp (Hot) - Curve down shallow
    const path12 = `M ${p1.x} ${p1.y} Q 220 170, ${p2.x} ${p2.y}`;
    // 2->3 Adiabatic Exp - Curve down steep
    const path23 = `M ${p2.x} ${p2.y} Q 350 270, ${p3.x} ${p3.y}`;
    // 3->4 Isothermal Comp (Cold) - Curve up shallow
    const path34 = `M ${p3.x} ${p3.y} Q 350 340, ${p4.x} ${p4.y}`;
    // 4->1 Adiabatic Comp - Curve up steep
    const path41 = `M ${p4.x} ${p4.y} Q 180 250, ${p1.x} ${p1.y}`;

    // Fill area
    const areaPath = `${path12} ${path23.replace('M', 'L')} ${path34.replace('M', 'L')} ${path41.replace('M', 'L')} Z`;

    const svg = `
        <defs>
            <linearGradient id="carnot-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ffeb3b;stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:#ff9800;stop-opacity:0.2" />
            </linearGradient>
            <marker id="arrow-path" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
            </marker>
        </defs>

        <!-- Axes -->
        <line x1="50" y1="450" x2="550" y2="450" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>
        <line x1="50" y1="450" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>
        <text x="540" y="470" font-size="14" font-weight="bold" font-family="Inter">V</text>
        <text x="30" y="40" font-size="14" font-weight="bold" font-family="Inter">P</text>

        <!-- Cycle Area -->
        <path d="${areaPath}" fill="url(#carnot-fill)" stroke="none" />

        <!-- Processes -->
        <!-- 1->2 Isothermal Expansion (Heat In) -->
        <path d="${path12}" stroke="#d32f2f" stroke-width="3" fill="none" marker-mid="url(#arrow-path)"/>
        <text x="210" y="150" font-size="11" fill="#d32f2f" font-family="Inter">Isothermal Exp (Th)</text>
        
        <!-- 2->3 Adiabatic Expansion -->
        <path d="${path23}" stroke="#1976d2" stroke-width="3" fill="none" marker-mid="url(#arrow-path)"/>
        <text x="380" y="260" font-size="11" fill="#1976d2" font-family="Inter">Adiabatic Exp</text>

        <!-- 3->4 Isothermal Compression (Heat Out) -->
        <path d="${path34}" stroke="#303f9f" stroke-width="3" fill="none" marker-mid="url(#arrow-path)"/>
        <text x="340" y="380" font-size="11" fill="#303f9f" font-family="Inter">Isothermal Comp (Tc)</text>

        <!-- 4->1 Adiabatic Compression -->
        <path d="${path41}" stroke="#388e3c" stroke-width="3" fill="none" marker-mid="url(#arrow-path)"/>
        <text x="130" y="270" font-size="11" fill="#388e3c" font-family="Inter">Adiabatic Comp</text>

        <!-- Points -->
        <circle cx="${p1.x}" cy="${p1.y}" r="5" fill="#333"/>
        <text x="${p1.x - 15}" y="${p1.y}" font-size="12" font-weight="bold">1</text>
        
        <circle cx="${p2.x}" cy="${p2.y}" r="5" fill="#333"/>
        <text x="${p2.x + 10}" y="${p2.y}" font-size="12" font-weight="bold">2</text>

        <circle cx="${p3.x}" cy="${p3.y}" r="5" fill="#333"/>
        <text x="${p3.x + 10}" y="${p3.y}" font-size="12" font-weight="bold">3</text>

        <circle cx="${p4.x}" cy="${p4.y}" r="5" fill="#333"/>
        <text x="${p4.x - 15}" y="${p4.y + 10}" font-size="12" font-weight="bold">4</text>

        <!-- Info -->
        <text x="300" y="40" font-size="18" font-weight="bold" text-anchor="middle" font-family="Inter">Carnot Cycle</text>
        <text x="300" y="480" font-size="12" text-anchor="middle" font-family="Inter">Efficiency η = 1 - Tc/Th = ${((1 - Tc / Th) * 100).toFixed(1)}%</text>
    `;

    return builder.setBackgroundSVG(svg).build();
}

/**
 * Heat Engine Diagram
 */
export function createHeatEngine(id: string, Qh: number = 100, Qc: number = 60, W: number = 40): FBDDiagram {
    return createThermoDiagram(id, 400, 500, [
        // Hot reservoir
        `<rect x="150" y="50" width="100" height="40" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="75" font-size="12" font-weight="bold" text-anchor="middle" fill="white" font-family="Inter">Hot Reservoir (Th)</text>`,

        // Engine
        `<circle cx="200" cy="250" r="60" fill="url(#grad-metal)" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="255" font-size="16" font-weight="bold" text-anchor="middle" font-family="Inter">Engine</text>`,

        // Cold reservoir
        `<rect x="150" y="410" width="100" height="40" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="435" font-size="12" font-weight="bold" text-anchor="middle" fill="white" font-family="Inter">Cold Reservoir (Tc)</text>`,

        // Heat flow Qh (down)
        `<line x1="200" y1="90" x2="200" y2="190" stroke="#d32f2f" stroke-width="4" marker-end="url(#arrowred)"/>`,
        `<text x="220" y="140" font-size="13" font-weight="bold" fill="#d32f2f" font-family="Inter">Qh = ${Qh}J</text>`,

        // Heat flow Qc (down)
        `<line x1="200" y1="310" x2="200" y2="410" stroke="#1976d2" stroke-width="4" marker-end="url(#arrowblue)"/>`,
        `<text x="220" y="360" font-size="13" font-weight="bold" fill="#1976d2" font-family="Inter">Qc = ${Qc}J</text>`,

        // Work output (right)
        `<line x1="260" y1="250" x2="350" y2="250" stroke="#388e3c" stroke-width="4" marker-end="url(#arrowgreen)"/>`,
        `<text x="280" y="240" font-size="13" font-weight="bold" fill="#388e3c" font-family="Inter">W = ${W}J</text>`,

        // Title and efficiency
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle" font-family="Inter">Heat Engine</text>`,
        `<text x="200" y="490" font-size="12" text-anchor="middle" font-family="Inter">η = W/Qh = ${((W / Qh) * 100).toFixed(1)}%</text>`
    ]);
}

/**
 * Refrigerator/Heat Pump Diagram
 */
export function createRefrigerator(id: string): FBDDiagram {
    return createThermoDiagram(id, 400, 500, [
        // Hot reservoir (outside)
        `<rect x="150" y="50" width="100" height="40" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="75" font-size="12" font-weight="bold" text-anchor="middle" fill="white" font-family="Inter">Hot (Th)</text>`,

        // Refrigerator
        `<circle cx="200" cy="250" r="60" fill="#e1f5fe" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="255" font-size="14" font-weight="bold" text-anchor="middle" font-family="Inter">Refrigerator</text>`,

        // Cold reservoir (inside)
        `<rect x="150" y="410" width="100" height="40" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="435" font-size="12" font-weight="bold" text-anchor="middle" fill="white" font-family="Inter">Cold (Tc)</text>`,

        // Heat flow Qh (up)
        `<line x1="200" y1="190" x2="200" y2="90" stroke="#d32f2f" stroke-width="4" marker-end="url(#arrowred)"/>`,
        `<text x="220" y="140" font-size="13" font-weight="bold" fill="#d32f2f" font-family="Inter">Qh</text>`,

        // Heat flow Qc (up)
        `<line x1="200" y1="410" x2="200" y2="310" stroke="#1976d2" stroke-width="4" marker-end="url(#arrowblue)"/>`,
        `<text x="220" y="360" font-size="13" font-weight="bold" fill="#1976d2" font-family="Inter">Qc</text>`,

        // Work input (left)
        `<line x1="40" y1="250" x2="140" y2="250" stroke="#388e3c" stroke-width="4" marker-end="url(#arrowgreen)"/>`,
        `<text x="60" y="240" font-size="13" font-weight="bold" fill="#388e3c" font-family="Inter">W</text>`,

        // Title
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle" font-family="Inter">Refrigerator</text>`,
        `<text x="200" y="490" font-size="11" text-anchor="middle" font-family="Inter">COP = Qc/W</text>`
    ]);
}

/**
 * Phase Diagram
 */
export function createPhaseDiagram(id: string, substance: string = 'Water'): FBDDiagram {
    return createThermoDiagram(id, 500, 450, [
        // Axes
        `<line x1="50" y1="380" x2="450" y2="380" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="380" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="400" font-size="14" font-weight="bold" font-family="Inter">T</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold" font-family="Inter">P</text>`,

        // Triple point
        `<circle cx="150" cy="300" r="5" fill="#d32f2f"/>`,
        `<text x="160" y="295" font-size="11" font-weight="bold" font-family="Inter">Triple Point</text>`,

        // Critical point
        `<circle cx="380" cy="120" r="5" fill="#1976d2"/>`,
        `<text x="320" y="110" font-size="11" font-weight="bold" font-family="Inter">Critical Point</text>`,

        // Solid-Liquid boundary
        `<line x1="150" y1="300" x2="200" y2="100" stroke="#333" stroke-width="2"/>`,

        // Liquid-Gas boundary
        `<path d="M 150 300 Q 250 250, 380 120" fill="none" stroke="#333" stroke-width="2"/>`,

        // Solid-Gas boundary (sublimation)
        `<path d="M 150 300 Q 100 250, 80 150" fill="none" stroke="#333" stroke-width="2"/>`,

        // Region labels
        `<text x="120" y="200" font-size="14" font-weight="bold" fill="#42a5f5" font-family="Inter">SOLID</text>`,
        `<text x="250" y="200" font-size="14" font-weight="bold" fill="#1976d2" font-family="Inter">LIQUID</text>`,
        `<text x="300" y="320" font-size="14" font-weight="bold" fill="#ff9800" font-family="Inter">GAS</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle" font-family="Inter">Phase Diagram - ${substance}</text>`
    ]);
}

/**
 * Maxwell-Boltzmann Distribution
 */
export function createMaxwellDistribution(id: string, temperature: number = 300): FBDDiagram {
    return createThermoDiagram(id, 500, 400, [
        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="14" font-weight="bold" font-family="Inter">v (speed)</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold" font-family="Inter">f(v)</text>`,

        // Distribution curve
        `<path d="M 50 350 Q 100 320, 150 250 T 250 150 Q 300 120, 350 140 T 450 300" fill="none" stroke="#d32f2f" stroke-width="3"/>`,

        // Most probable speed marker
        `<line x1="250" y1="150" x2="250" y2="350" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<text x="250" y="370" font-size="11" text-anchor="middle" font-family="Inter">vmp</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle" font-family="Inter">Maxwell-Boltzmann Distribution</text>`,
        `<text x="250" y="50" font-size="12" text-anchor="middle" font-family="Inter">T = ${temperature}K</text>`
    ]);
}

/**
 * Isothermal Process
 */
export function createIsothermal(id: string, temperature: number = 300): FBDDiagram {
    return createPVDiagram(id, 'isothermal');
}

/**
 * Adiabatic Process
 */
export function createAdiabatic(id: string): FBDDiagram {
    return createPVDiagram(id, 'adiabatic');
}

/**
 * Isobaric Process
 */
export function createIsobaric(id: string, pressure: number = 101325): FBDDiagram {
    return createPVDiagram(id, 'isobaric');
}

/**
 * Isochoric Process
 */
export function createIsochoric(id: string, volume: number = 0.001): FBDDiagram {
    return createPVDiagram(id, 'isochoric');
}
