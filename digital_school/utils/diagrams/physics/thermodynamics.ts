/**
 * Physics Thermodynamics Diagram Presets
 * PV diagrams, heat engines, thermodynamic cycles, and phase diagrams
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG thermodynamics diagrams
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
 * @param id Diagram ID
 * @param process Type of process (isothermal, adiabatic, isobaric, isochoric)
 */
export function createPVDiagram(id: string, process: string = 'isothermal'): FBDDiagram {
    const elements: string[] = [
        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="14" font-weight="bold">V</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold">P</text>`,
    ];

    // Add process curve based on type
    if (process === 'isothermal') {
        elements.push(`<path d="M 100 100 Q 200 150, 400 300" fill="none" stroke="#d32f2f" stroke-width="3"/>`);
        elements.push(`<text x="250" y="30" font-size="14" font-weight="bold">Isothermal Process (T = constant)</text>`);
    } else if (process === 'adiabatic') {
        elements.push(`<path d="M 100 80 Q 200 180, 400 320" fill="none" stroke="#1976d2" stroke-width="3"/>`);
        elements.push(`<text x="250" y="30" font-size="14" font-weight="bold">Adiabatic Process (Q = 0)</text>`);
    } else if (process === 'isobaric') {
        elements.push(`<line x1="100" y1="200" x2="400" y2="200" stroke="#388e3c" stroke-width="3"/>`);
        elements.push(`<text x="250" y="30" font-size="14" font-weight="bold">Isobaric Process (P = constant)</text>`);
    } else if (process === 'isochoric') {
        elements.push(`<line x1="250" y1="100" x2="250" y2="300" stroke="#f57c00" stroke-width="3"/>`);
        elements.push(`<text x="250" y="30" font-size="14" font-weight="bold">Isochoric Process (V = constant)</text>`);
    }

    return createThermoDiagram(id, 500, 400, elements);
}

/**
 * Carnot Cycle
 * @param id Diagram ID
 * @param Th Hot reservoir temperature
 * @param Tc Cold reservoir temperature
 */
export function createCarnotCycle(id: string, Th: number = 500, Tc: number = 300): FBDDiagram {
    return createThermoDiagram(id, 500, 450, [
        // Axes
        `<line x1="50" y1="380" x2="450" y2="380" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="380" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="400" font-size="14" font-weight="bold">V</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold">P</text>`,

        // Carnot cycle (4 processes)
        // 1. Isothermal expansion (hot)
        `<path d="M 120 120 Q 180 140, 250 180" fill="none" stroke="#d32f2f" stroke-width="3"/>`,
        // 2. Adiabatic expansion
        `<path d="M 250 180 Q 300 240, 350 300" fill="none" stroke="#1976d2" stroke-width="3"/>`,
        // 3. Isothermal compression (cold)
        `<path d="M 350 300 Q 290 280, 220 250" fill="none" stroke="#d32f2f" stroke-width="3"/>`,
        // 4. Adiabatic compression
        `<path d="M 220 250 Q 170 190, 120 120" fill="none" stroke="#1976d2" stroke-width="3"/>`,

        // Labels
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Carnot Cycle</text>`,
        `<text x="180" y="110" font-size="11" fill="#d32f2f">1: Isothermal (T=${Th}K)</text>`,
        `<text x="320" y="240" font-size="11" fill="#1976d2">2: Adiabatic</text>`,
        `<text x="280" y="310" font-size="11" fill="#d32f2f">3: Isothermal (T=${Tc}K)</text>`,
        `<text x="140" y="200" font-size="11" fill="#1976d2">4: Adiabatic</text>`,
        `<text x="250" y="420" font-size="11" text-anchor="middle">η = 1 - Tc/Th = ${((1 - Tc / Th) * 100).toFixed(1)}%</text>`
    ]);
}

/**
 * Heat Engine Diagram
 * @param id Diagram ID
 * @param Qh Heat absorbed from hot reservoir
 * @param Qc Heat rejected to cold reservoir
 * @param W Work output
 */
export function createHeatEngine(id: string, Qh: number = 100, Qc: number = 60, W: number = 40): FBDDiagram {
    return createThermoDiagram(id, 400, 500, [
        // Hot reservoir
        `<rect x="150" y="50" width="100" height="40" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="75" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Hot (Th)</text>`,

        // Engine
        `<circle cx="200" cy="250" r="60" fill="#90caf9" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="255" font-size="16" font-weight="bold" text-anchor="middle">Engine</text>`,

        // Cold reservoir
        `<rect x="150" y="410" width="100" height="40" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="435" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Cold (Tc)</text>`,

        // Heat flow Qh (down)
        `<line x1="200" y1="90" x2="200" y2="190" stroke="#d32f2f" stroke-width="3" marker-end="url(#arrowred)"/>`,
        `<text x="220" y="140" font-size="13" font-weight="bold" fill="#d32f2f">Qh = ${Qh}J</text>`,

        // Heat flow Qc (down)
        `<line x1="200" y1="310" x2="200" y2="410" stroke="#1976d2" stroke-width="3" marker-end="url(#arrowblue)"/>`,
        `<text x="220" y="360" font-size="13" font-weight="bold" fill="#1976d2">Qc = ${Qc}J</text>`,

        // Work output (right)
        `<line x1="260" y1="250" x2="350" y2="250" stroke="#388e3c" stroke-width="3" marker-end="url(#arrowgreen)"/>`,
        `<text x="280" y="240" font-size="13" font-weight="bold" fill="#388e3c">W = ${W}J</text>`,

        // Title and efficiency
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle">Heat Engine</text>`,
        `<text x="200" y="490" font-size="12" text-anchor="middle">η = W/Qh = ${((W / Qh) * 100).toFixed(1)}%</text>`
    ]);
}

/**
 * Refrigerator/Heat Pump Diagram
 * @param id Diagram ID
 */
export function createRefrigerator(id: string): FBDDiagram {
    return createThermoDiagram(id, 400, 500, [
        // Hot reservoir (outside)
        `<rect x="150" y="50" width="100" height="40" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="75" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Hot (Th)</text>`,

        // Refrigerator
        `<circle cx="200" cy="250" r="60" fill="#e1f5fe" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="255" font-size="14" font-weight="bold" text-anchor="middle">Refrigerator</text>`,

        // Cold reservoir (inside)
        `<rect x="150" y="410" width="100" height="40" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="435" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Cold (Tc)</text>`,

        // Heat flow Qh (up)
        `<line x1="200" y1="190" x2="200" y2="90" stroke="#d32f2f" stroke-width="3" marker-end="url(#arrowred)"/>`,
        `<text x="220" y="140" font-size="13" font-weight="bold" fill="#d32f2f">Qh</text>`,

        // Heat flow Qc (up)
        `<line x1="200" y1="410" x2="200" y2="310" stroke="#1976d2" stroke-width="3" marker-end="url(#arrowblue)"/>`,
        `<text x="220" y="360" font-size="13" font-weight="bold" fill="#1976d2">Qc</text>`,

        // Work input (left)
        `<line x1="40" y1="250" x2="140" y2="250" stroke="#388e3c" stroke-width="3" marker-end="url(#arrowgreen)"/>`,
        `<text x="60" y="240" font-size="13" font-weight="bold" fill="#388e3c">W</text>`,

        // Title
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle">Refrigerator</text>`,
        `<text x="200" y="490" font-size="11" text-anchor="middle">COP = Qc/W</text>`
    ]);
}

/**
 * Phase Diagram
 * @param id Diagram ID
 * @param substance Name of substance
 */
export function createPhaseDiagram(id: string, substance: string = 'Water'): FBDDiagram {
    return createThermoDiagram(id, 500, 450, [
        // Axes
        `<line x1="50" y1="380" x2="450" y2="380" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="380" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="400" font-size="14" font-weight="bold">T</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold">P</text>`,

        // Triple point
        `<circle cx="150" cy="300" r="5" fill="#d32f2f"/>`,
        `<text x="160" y="295" font-size="11" font-weight="bold">Triple Point</text>`,

        // Critical point
        `<circle cx="380" cy="120" r="5" fill="#1976d2"/>`,
        `<text x="320" y="110" font-size="11" font-weight="bold">Critical Point</text>`,

        // Solid-Liquid boundary
        `<line x1="150" y1="300" x2="200" y2="100" stroke="#333" stroke-width="2"/>`,

        // Liquid-Gas boundary
        `<path d="M 150 300 Q 250 250, 380 120" fill="none" stroke="#333" stroke-width="2"/>`,

        // Solid-Gas boundary (sublimation)
        `<path d="M 150 300 Q 100 250, 80 150" fill="none" stroke="#333" stroke-width="2"/>`,

        // Region labels
        `<text x="120" y="200" font-size="14" font-weight="bold" fill="#42a5f5">SOLID</text>`,
        `<text x="250" y="200" font-size="14" font-weight="bold" fill="#1976d2">LIQUID</text>`,
        `<text x="300" y="320" font-size="14" font-weight="bold" fill="#ff9800">GAS</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Phase Diagram - ${substance}</text>`
    ]);
}

/**
 * Maxwell-Boltzmann Distribution
 * @param id Diagram ID
 * @param temperature Temperature in Kelvin
 */
export function createMaxwellDistribution(id: string, temperature: number = 300): FBDDiagram {
    return createThermoDiagram(id, 500, 400, [
        // Axes
        `<line x1="50" y1="350" x2="450" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="370" font-size="14" font-weight="bold">v (speed)</text>`,
        `<text x="30" y="40" font-size="14" font-weight="bold">f(v)</text>`,

        // Distribution curve
        `<path d="M 50 350 Q 100 320, 150 250 T 250 150 Q 300 120, 350 140 T 450 300" fill="none" stroke="#d32f2f" stroke-width="3"/>`,

        // Most probable speed marker
        `<line x1="250" y1="150" x2="250" y2="350" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<text x="250" y="370" font-size="11" text-anchor="middle">vmp</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Maxwell-Boltzmann Distribution</text>`,
        `<text x="250" y="50" font-size="12" text-anchor="middle">T = ${temperature}K</text>`
    ]);
}

/**
 * Isothermal Process
 * @param id Diagram ID
 * @param temperature Temperature in Kelvin
 */
export function createIsothermal(id: string, temperature: number = 300): FBDDiagram {
    return createPVDiagram(id, 'isothermal');
}

/**
 * Adiabatic Process
 * @param id Diagram ID
 */
export function createAdiabatic(id: string): FBDDiagram {
    return createPVDiagram(id, 'adiabatic');
}

/**
 * Isobaric Process
 * @param id Diagram ID
 * @param pressure Pressure in Pa
 */
export function createIsobaric(id: string, pressure: number = 101325): FBDDiagram {
    return createPVDiagram(id, 'isobaric');
}

/**
 * Isochoric Process
 * @param id Diagram ID
 * @param volume Volume in m³
 */
export function createIsochoric(id: string, volume: number = 0.001): FBDDiagram {
    return createPVDiagram(id, 'isochoric');
}
