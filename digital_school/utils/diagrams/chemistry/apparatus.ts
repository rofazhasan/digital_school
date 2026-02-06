/**
 * Chemistry Apparatus & Molecular Diagram Presets
 */

import type { FBDDiagram } from '../../fbd/types';

function createChemDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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

export function createBeaker(id: string, volume: number = 250): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <path d="M 100 100 L 100 300 Q 100 320 120 320 L 280 320 Q 300 320 300 300 L 300 100" 
          fill="none" stroke="#333" stroke-width="3"/>
    <line x1="90" y1="100" x2="310" y2="100" stroke="#333" stroke-width="2"/>
    <path d="M 110 200 L 110 300 Q 110 310 120 310 L 280 310 Q 290 310 290 300 L 290 200" 
          fill="#6366f1" fill-opacity="0.3" stroke="none"/>
    <text x="200" y="350" font-size="14" text-anchor="middle">${volume}mL Beaker</text>
  `);

    return createChemDiagram(id, 400, 400, elements);
}

export function createTestTube(id: string): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <path d="M 150 50 L 150 280 Q 150 320 180 320 Q 210 320 210 280 L 210 50" 
          fill="none" stroke="#333" stroke-width="3"/>
    <ellipse cx="180" cy="50" rx="30" ry="8" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 160 200 L 160 280 Q 160 310 180 310 Q 200 310 200 280 L 200 200" 
          fill="#ec4899" fill-opacity="0.4" stroke="none"/>
    <text x="180" y="350" font-size="14" text-anchor="middle">Test Tube</text>
  `);

    return createChemDiagram(id, 360, 380, elements);
}

export function createFlaskConical(id: string): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <path d="M 150 50 L 150 150 L 100 300 L 300 300 L 250 150 L 250 50" 
          fill="none" stroke="#333" stroke-width="3"/>
    <ellipse cx="200" cy="50" rx="50" ry="10" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 160 200 L 120 300 L 280 300 L 240 200" 
          fill="#10b981" fill-opacity="0.3" stroke="none"/>
    <text x="200" y="340" font-size="14" text-anchor="middle">Conical Flask</text>
  `);

    return createChemDiagram(id, 400, 370, elements);
}

export function createBurette(id: string): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <rect x="170" y="50" width="60" height="250" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 200 300 L 200 330 Q 200 340 190 340 L 180 340" 
          fill="none" stroke="#333" stroke-width="2"/>
    <circle cx="175" cy="340" r="5" fill="#333"/>
    <line x1="240" y1="100" x2="250" y2="100" stroke="#333" stroke-width="1"/>
    <line x1="240" y1="150" x2="250" y2="150" stroke="#333" stroke-width="1"/>
    <line x1="240" y1="200" x2="250" y2="200" stroke="#333" stroke-width="1"/>
    <line x1="240" y1="250" x2="250" y2="250" stroke="#333" stroke-width="1"/>
    <text x="260" y="105" font-size="10">0</text>
    <text x="260" y="155" font-size="10">10</text>
    <text x="260" y="205" font-size="10">20</text>
    <text x="260" y="255" font-size="10">30</text>
    <path d="M 175 80 L 175 200" fill="#f59e0b" fill-opacity="0.4" stroke="none"/>
    <rect x="173" y="80" width="54" height="120" fill="#f59e0b" fill-opacity="0.4"/>
    <text x="200" y="370" font-size="14" text-anchor="middle">Burette</text>
  `);

    return createChemDiagram(id, 400, 400, elements);
}

export function createFunnel(id: string): FBDDiagram {
    const elements: string[] = [];

    elements.push(`
    <ellipse cx="200" cy="100" rx="80" ry="15" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 120 100 L 190 250 L 210 250 L 280 100" 
          fill="none" stroke="#333" stroke-width="3"/>
    <rect x="195" y="250" width="10" height="80" fill="none" stroke="#333" stroke-width="3"/>
    <text x="200" y="360" font-size="14" text-anchor="middle">Funnel</text>
  `);

    return createChemDiagram(id, 400, 380, elements);
}

export function createAtom(id: string, electrons: number = 6, element: string = 'C'): FBDDiagram {
    const elements: string[] = [];
    const width = 400;
    const height = 400;
    const centerX = 200;
    const centerY = 200;

    // Nucleus
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="20" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>`);
    elements.push(`<text x="${centerX}" y="${centerY + 5}" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${element}</text>`);

    // Electron shells
    const shells = Math.ceil(electrons / 8);
    for (let shell = 1; shell <= shells; shell++) {
        const radius = 40 + shell * 40;
        elements.push(`<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,5"/>`);

        // Electrons in this shell
        const electronsInShell = Math.min(electrons - (shell - 1) * 8, 8);
        for (let e = 0; e < electronsInShell; e++) {
            const angle = (e / electronsInShell) * 2 * Math.PI;
            const ex = centerX + radius * Math.cos(angle);
            const ey = centerY + radius * Math.sin(angle);
            elements.push(`<circle cx="${ex}" cy="${ey}" r="6" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>`);
        }
    }

    elements.push(`<text x="${centerX}" y="370" font-size="14" text-anchor="middle">${element} Atom (${electrons} electrons)</text>`);

    return createChemDiagram(id, width, height, elements);
}

export function createMolecule(id: string, type: 'H2O' | 'CO2' | 'CH4' = 'H2O'): FBDDiagram {
    const elements: string[] = [];
    const width = 400;
    const height = 300;

    if (type === 'H2O') {
        // Water molecule
        elements.push(`<circle cx="200" cy="150" r="30" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>`);
        elements.push(`<text x="200" y="157" font-size="18" font-weight="bold" fill="white" text-anchor="middle">O</text>`);

        elements.push(`<line x1="200" y1="150" x2="140" y2="100" stroke="#333" stroke-width="3"/>`);
        elements.push(`<circle cx="140" cy="100" r="20" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>`);
        elements.push(`<text x="140" y="105" font-size="16" font-weight="bold" fill="#333" text-anchor="middle">H</text>`);

        elements.push(`<line x1="200" y1="150" x2="260" y2="100" stroke="#333" stroke-width="3"/>`);
        elements.push(`<circle cx="260" cy="100" r="20" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>`);
        elements.push(`<text x="260" y="105" font-size="16" font-weight="bold" fill="#333" text-anchor="middle">H</text>`);

        elements.push(`<text x="200" y="250" font-size="14" text-anchor="middle">H₂O (Water)</text>`);
    }

    return createChemDiagram(id, width, height, elements);
}
