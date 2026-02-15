/**
 * Physics Modern Physics & Quantum Mechanics Diagram Presets
 * Atomic models, quantum mechanics, nuclear physics
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG modern physics diagrams
 */
function createModernPhysicsDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * Bohr Model of Atom
 * @param id Diagram ID
 * @param n Principal quantum number (energy level)
 */
export function createBohrModel(id: string, n: number = 3): FBDDiagram {
    const elements: string[] = [
        // Nucleus
        `<circle cx="250" cy="250" r="20" fill="#d32f2f" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="255" font-size="12" font-weight="bold" text-anchor="middle" fill="white">+</text>`,
    ];

    // Add electron orbits
    for (let i = 1; i <= n; i++) {
        const radius = 40 + i * 40;
        elements.push(`<circle cx="250" cy="250" r="${radius}" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`);

        // Add electron
        const angle = (i * 60) * Math.PI / 180;
        const ex = 250 + radius * Math.cos(angle);
        const ey = 250 + radius * Math.sin(angle);
        elements.push(`<circle cx="${ex}" cy="${ey}" r="8" fill="#1976d2" stroke="#333" stroke-width="1"/>`);
        elements.push(`<text x="${ex}" y="${ey + 4}" font-size="10" font-weight="bold" text-anchor="middle" fill="white">e⁻</text>`);

        // Label
        elements.push(`<text x="${250 + radius + 15}" y="255" font-size="11">n=${i}</text>`);
    }

    elements.push(`<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Bohr Model</text>`);
    elements.push(`<text x="250" y="480" font-size="11" text-anchor="middle">Energy levels: n = 1 to ${n}</text>`);

    return createModernPhysicsDiagram(id, 500, 500, elements);
}

/**
 * Energy Level Diagram
 * @param id Diagram ID
 * @param element Element name
 */
export function createEnergyLevels(id: string, element: string = 'Hydrogen'): FBDDiagram {
    const levels = [
        { n: 1, E: -13.6, y: 350 },
        { n: 2, E: -3.4, y: 280 },
        { n: 3, E: -1.51, y: 230 },
        { n: 4, E: -0.85, y: 190 },
        { n: '∞', E: 0, y: 100 }
    ];

    const elements: string[] = [
        // Energy axis
        `<line x1="100" y1="380" x2="100" y2="80" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="80" y="70" font-size="14" font-weight="bold">E</text>`,
    ];

    // Add energy levels
    levels.forEach(level => {
        elements.push(`<line x1="120" y1="${level.y}" x2="380" y2="${level.y}" stroke="#333" stroke-width="2"/>`);
        elements.push(`<text x="390" y="${level.y + 5}" font-size="11">n = ${level.n}</text>`);
        elements.push(`<text x="50" y="${level.y + 5}" font-size="10" text-anchor="end">${level.E} eV</text>`);
    });

    // Add transition arrow (example: n=3 to n=2)
    elements.push(`<line x1="250" y1="230" x2="250" y2="280" stroke="#d32f2f" stroke-width="2" marker-end="url(#arrowred)"/>`);
    elements.push(`<text x="260" y="255" font-size="11" fill="#d32f2f">hν</text>`);

    elements.push(`<text x="250" y="40" font-size="14" font-weight="bold" text-anchor="middle">Energy Levels - ${element}</text>`);
    elements.push(`<text x="100" y="400" font-size="10">Ground state</text>`);

    return createModernPhysicsDiagram(id, 450, 420, elements);
}

/**
 * Photoelectric Effect Setup
 */
export function createPhotoelectricSetup(id: string): FBDDiagram {
    return createModernPhysicsDiagram(id, 500, 400, [
        // Light source
        `<circle cx="80" cy="200" r="30" fill="#fff9c4" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="205" font-size="12" text-anchor="middle">Light</text>`,

        // Photons
        `<line x1="110" y1="190" x2="180" y2="190" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="110" y1="200" x2="180" y2="200" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="110" y1="210" x2="180" y2="210" stroke="#ffd54f" stroke-width="3"/>`,
        `<text x="145" y="175" font-size="10">hν</text>`,

        // Metal plate
        `<rect x="200" y="150" width="20" height="100" fill="#9e9e9e" stroke="#333" stroke-width="2"/>`,
        `<text x="210" y="280" font-size="11" text-anchor="middle">Metal</text>`,

        // Ejected electrons
        `<circle cx="260" cy="170" r="5" fill="#1976d2"/>`,
        `<line x1="260" y1="170" x2="320" y2="140" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowblue)"/>`,
        `<text x="290" y="150" font-size="10" fill="#1976d2">e⁻</text>`,

        `<circle cx="260" cy="200" r="5" fill="#1976d2"/>`,
        `<line x1="260" y1="200" x2="320" y2="200" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowblue)"/>`,

        // Collector
        `<rect x="350" y="150" width="20" height="100" fill="#757575" stroke="#333" stroke-width="2"/>`,
        `<text x="360" y="280" font-size="11" text-anchor="middle">Collector</text>`,

        // Circuit
        `<line x1="370" y1="250" x2="370" y2="320" stroke="#333" stroke-width="2"/>`,
        `<line x1="370" y1="320" x2="210" y2="320" stroke="#333" stroke-width="2"/>`,
        `<line x1="210" y1="320" x2="210" y2="250" stroke="#333" stroke-width="2"/>`,

        // Ammeter
        `<circle cx="290" cy="320" r="20" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="290" y="325" font-size="14" font-weight="bold" text-anchor="middle">A</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Photoelectric Effect</text>`,
        `<text x="250" y="370" font-size="11" text-anchor="middle">KE = hν - φ</text>`
    ]);
}

/**
 * Nuclear Decay
 * @param id Diagram ID
 * @param type Type of decay (alpha, beta, gamma)
 */
export function createNuclearDecay(id: string, type: string = 'alpha'): FBDDiagram {
    const elements: string[] = [
        // Parent nucleus
        `<circle cx="150" cy="200" r="40" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="150" y="205" font-size="14" font-weight="bold" text-anchor="middle" fill="white">Parent</text>`,

        // Arrow
        `<line x1="200" y1="200" x2="280" y2="200" stroke="#333" stroke-width="3" marker-end="url(#arrow)"/>`,

        // Daughter nucleus
        `<circle cx="350" cy="200" r="35" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="350" y="205" font-size="14" font-weight="bold" text-anchor="middle" fill="white">Daughter</text>`,
    ];

    if (type === 'alpha') {
        elements.push(`<circle cx="240" cy="150" r="15" fill="#ffd54f" stroke="#333" stroke-width="2"/>`);
        elements.push(`<text x="240" y="155" font-size="12" font-weight="bold" text-anchor="middle">α</text>`);
        elements.push(`<text x="250" y="50" font-size="14" font-weight="bold" text-anchor="middle">Alpha Decay</text>`);
        elements.push(`<text x="250" y="350" font-size="11" text-anchor="middle">A → A-4 + ⁴He</text>`);
    } else if (type === 'beta') {
        elements.push(`<circle cx="240" cy="150" r="8" fill="#1976d2" stroke="#333" stroke-width="1"/>`);
        elements.push(`<text x="240" y="154" font-size="10" font-weight="bold" text-anchor="middle" fill="white">β⁻</text>`);
        elements.push(`<text x="250" y="50" font-size="14" font-weight="bold" text-anchor="middle">Beta Decay</text>`);
        elements.push(`<text x="250" y="350" font-size="11" text-anchor="middle">n → p + e⁻ + ν̄</text>`);
    } else if (type === 'gamma') {
        elements.push(`<path d="M 230 140 L 250 160 M 230 160 L 250 140" stroke="#9c27b0" stroke-width="3"/>`);
        elements.push(`<text x="240" y="130" font-size="12" font-weight="bold" fill="#9c27b0">γ</text>`);
        elements.push(`<text x="250" y="50" font-size="14" font-weight="bold" text-anchor="middle">Gamma Decay</text>`);
        elements.push(`<text x="250" y="350" font-size="11" text-anchor="middle">A* → A + γ</text>`);
    }

    return createModernPhysicsDiagram(id, 500, 380, elements);
}

/**
 * Nuclear Fission
 */
export function createFission(id: string): FBDDiagram {
    return createModernPhysicsDiagram(id, 550, 400, [
        // Neutron incoming
        `<circle cx="50" cy="200" r="8" fill="#757575" stroke="#333" stroke-width="1"/>`,
        `<text x="50" y="204" font-size="8" text-anchor="middle">n</text>`,
        `<line x1="60" y1="200" x2="120" y2="200" stroke="#757575" stroke-width="2" marker-end="url(#arrow)"/>`,

        // U-235 nucleus
        `<circle cx="180" cy="200" r="45" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="180" y="200" font-size="12" font-weight="bold" text-anchor="middle" fill="white">²³⁵U</text>`,
        `<text x="180" y="215" font-size="10" text-anchor="middle" fill="white">+ n</text>`,

        // Arrow
        `<line x1="235" y1="200" x2="285" y2="200" stroke="#333" stroke-width="3" marker-end="url(#arrow)"/>`,

        // Fission products
        `<circle cx="360" cy="150" r="30" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="360" y="155" font-size="11" font-weight="bold" text-anchor="middle" fill="white">Fragment 1</text>`,

        `<circle cx="360" cy="250" r="30" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="360" y="255" font-size="11" font-weight="bold" text-anchor="middle" fill="white">Fragment 2</text>`,

        // Neutrons released
        `<circle cx="430" cy="180" r="6" fill="#757575"/>`,
        `<text x="430" y="183" font-size="7" text-anchor="middle">n</text>`,
        `<line x1="435" y1="180" x2="480" y2="170" stroke="#757575" stroke-width="2" marker-end="url(#arrow)"/>`,

        `<circle cx="430" cy="200" r="6" fill="#757575"/>`,
        `<text x="430" y="203" font-size="7" text-anchor="middle">n</text>`,
        `<line x1="435" y1="200" x2="480" y2="200" stroke="#757575" stroke-width="2" marker-end="url(#arrow)"/>`,

        `<circle cx="430" cy="220" r="6" fill="#757575"/>`,
        `<text x="430" y="223" font-size="7" text-anchor="middle">n</text>`,
        `<line x1="435" y1="220" x2="480" y2="230" stroke="#757575" stroke-width="2" marker-end="url(#arrow)"/>`,

        // Energy
        `<text x="320" y="320" font-size="13" font-weight="bold" fill="#ff9800">+ Energy</text>`,

        // Title
        `<text x="275" y="30" font-size="14" font-weight="bold" text-anchor="middle">Nuclear Fission</text>`,
        `<text x="275" y="370" font-size="11" text-anchor="middle">²³⁵U + n → Fragments + neutrons + Energy</text>`
    ]);
}

/**
 * Nuclear Fusion
 */
export function createFusion(id: string): FBDDiagram {
    return createModernPhysicsDiagram(id, 500, 350, [
        // Deuterium
        `<circle cx="120" cy="175" r="30" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="120" y="180" font-size="12" font-weight="bold" text-anchor="middle" fill="white">²H</text>`,
        `<line x1="155" y1="175" x2="195" y2="175" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,

        // Tritium
        `<circle cx="120" cy="245" r="30" fill="#1976d2" stroke="#333" stroke-width="2"/>`,
        `<text x="120" y="250" font-size="12" font-weight="bold" text-anchor="middle" fill="white">³H</text>`,
        `<line x1="155" y1="245" x2="195" y2="245" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,

        // Reaction
        `<text x="230" y="215" font-size="16" font-weight="bold" text-anchor="middle">→</text>`,

        // Helium
        `<circle cx="320" cy="175" r="28" fill="#ff9800" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="180" font-size="12" font-weight="bold" text-anchor="middle" fill="white">⁴He</text>`,

        // Neutron
        `<circle cx="320" cy="245" r="15" fill="#757575" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="250" font-size="11" font-weight="bold" text-anchor="middle" fill="white">n</text>`,

        // Energy
        `<text x="420" y="215" font-size="14" font-weight="bold" fill="#ff5252">+ 17.6 MeV</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Nuclear Fusion</text>`,
        `<text x="250" y="320" font-size="11" text-anchor="middle">²H + ³H → ⁴He + n + Energy</text>`
    ]);
}

/**
 * Quantum Tunneling
 */
export function createQuantumTunneling(id: string): FBDDiagram {
    return createModernPhysicsDiagram(id, 500, 350, [
        // Energy axis
        `<line x1="50" y1="300" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="30" y="40" font-size="14" font-weight="bold">E</text>`,

        // Position axis
        `<line x1="50" y1="300" x2="450" y2="300" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="450" y="320" font-size="14" font-weight="bold">x</text>`,

        // Potential barrier
        `<rect x="200" y="150" width="100" height="150" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="230" font-size="11" text-anchor="middle">Barrier</text>`,
        `<text x="250" y="245" font-size="11" text-anchor="middle">V₀</text>`,

        // Particle energy level
        `<line x1="50" y1="200" x2="450" y2="200" stroke="#d32f2f" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<text x="60" y="195" font-size="11" fill="#d32f2f">E \u003c V₀</text>`,

        // Wave function (before barrier)
        `<path d="M 50 200 Q 80 180, 110 200 T 170 200" fill="none" stroke="#1976d2" stroke-width="2"/>`,

        // Wave function (in barrier - decaying)
        `<path d="M 200 200 Q 220 210, 240 220 T 280 240" fill="none" stroke="#1976d2" stroke-width="2" opacity="0.5"/>`,

        // Wave function (after barrier - transmitted)
        `<path d="M 300 250 Q 330 240, 360 250 T 420 250" fill="none" stroke="#1976d2" stroke-width="2" opacity="0.7"/>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Quantum Tunneling</text>`,
        `<text x="250" y="330" font-size="10" text-anchor="middle">Particle can tunnel through barrier even when E \u003c V₀</text>`
    ]);
}
