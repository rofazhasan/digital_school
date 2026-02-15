/**
 * Chemistry Apparatus & Molecular Diagram Presets
 */

import type { FBDDiagram } from '../../fbd/types';
import { createMethane, createCO2 as createCO2String } from '../svg-components/chemistry/molecules';
import { drawAtom3D, buildMoleculeSVG } from './render-utils';

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

    // Beaker body with glass gradient
    elements.push(`
    <path d="M 100 100 L 100 300 Q 100 320 120 320 L 280 320 Q 300 320 300 300 L 300 100" 
          fill="url(#glass-grad)" stroke="#475569" stroke-width="2" opacity="0.8"/>
    <line x1="90" y1="100" x2="310" y2="100" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
    
    // Graduation marks
    ${Array.from({ length: 5 }, (_, i) => {
        const y = 300 - i * 40;
        return `<line x1="100" y1="${y}" x2="115" y2="${y}" stroke="#475569" stroke-width="1"/>
                <text x="120" y="${y + 4}" font-size="8" fill="#64748b">${i * 50}</text>`;
    }).join('')}
    
    // Liquid
    <path d="M 102 200 L 102 300 Q 102 318 120 318 L 280 318 Q 298 318 298 300 L 298 200 Z" 
          fill="#3b82f6" fill-opacity="0.25" stroke="none"/>
          
    <text x="200" y="360" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle">${volume}mL Beaker</text>
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

    // Flask body with glass gradient
    elements.push(`
    <path d="M 150 50 L 150 150 L 100 300 L 300 300 L 250 150 L 250 50" 
          fill="url(#glass-grad)" stroke="#475569" stroke-width="2" opacity="0.8"/>
    <ellipse cx="200" cy="50" rx="50" ry="10" fill="none" stroke="#475569" stroke-width="2"/>
    
    // Graduation marks
    <line x1="125" y1="240" x2="140" y2="240" stroke="#475569" stroke-width="1"/>
    <text x="145" y="244" font-size="8" fill="#64748b">100</text>
    <line x1="145" y1="180" x2="160" y2="180" stroke="#475569" stroke-width="1"/>
    <text x="165" y="184" font-size="8" fill="#64748b">200</text>
    
    // Liquid
    <path d="M 160 200 L 120 300 L 280 300 L 240 200 Z" 
          fill="#10b981" fill-opacity="0.25" stroke="none"/>
          
    <text x="200" y="350" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle">Conical Flask</text>
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

    // Nucleus (3D Sphere)
    // We manually create a big sphere for nucleus using the gradient
    // drawAtom3D draws it with label.
    elements.push(drawAtom3D({
        element: element as any,
        x: centerX,
        y: centerY,
        radius: 25,
        label: element
    }));

    // Electron shells
    const shells = Math.ceil(electrons / 8);
    for (let shell = 1; shell <= shells; shell++) {
        const radius = 50 + shell * 40;
        elements.push(`<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`);

        // Electrons in this shell
        const electronsInShell = Math.min(electrons - (shell - 1) * 8, 8);
        for (let e = 0; e < electronsInShell; e++) {
            const angle = (e / electronsInShell) * 2 * Math.PI - Math.PI / 2;
            const ex = centerX + radius * Math.cos(angle);
            const ey = centerY + radius * Math.sin(angle);

            // 3D Electron (small blue sphere)
            elements.push(`<circle cx="${ex}" cy="${ey}" r="6" fill="url(#grad-sphere-blue)" stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/>`);
            // Glow effect
            elements.push(`<circle cx="${ex}" cy="${ey}" r="8" fill="url(#grad-charge-neg)" opacity="0.4"/>`);
        }
    }

    elements.push(`<text x="${centerX}" y="380" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">${element} Atom (${electrons} electrons)</text>`);

    return createChemDiagram(id, width, height, elements);
}


export function createMolecule(id: string, type: 'H2O' | 'CO2' | 'CH4' = 'H2O'): FBDDiagram {
    const width = 400;
    const height = 300;
    const cx = 200, cy = 150;

    if (type === 'H2O') {
        const atoms = [
            { element: 'O', x: cx, y: cy },
            { element: 'H', x: cx - 60, y: cy + 50 },
            { element: 'H', x: cx + 60, y: cy + 50 },
        ];
        const bonds = [
            { from: 0, to: 1, type: 'single' },
            { from: 0, to: 2, type: 'single' },
        ];
        const svg = buildMoleculeSVG(atoms as any, bonds as any);
        svg.push(`<text x="${cx}" y="250" font-size="18" font-weight="bold" text-anchor="middle">H₂O (Water)</text>`);
        return createChemDiagram(id, width, height, svg);

    } else if (type === 'CO2') {
        const atoms = [
            { element: 'C', x: cx, y: cy },
            { element: 'O', x: cx - 80, y: cy },
            { element: 'O', x: cx + 80, y: cy },
        ];
        const bonds = [
            { from: 0, to: 1, type: 'double' },
            { from: 0, to: 2, type: 'double' },
        ];
        const svg = buildMoleculeSVG(atoms as any, bonds as any);
        svg.push(`<text x="${cx}" y="250" font-size="18" font-weight="bold" text-anchor="middle">CO₂ (Carbon Dioxide)</text>`);
        return createChemDiagram(id, width, height, svg);

    } else if (type === 'CH4') {
        // Reuse Methane logic or similar
        const atoms = [
            { element: 'C', x: cx, y: cy },
            { element: 'H', x: cx, y: cy - 60 },
            { element: 'H', x: cx + 60, y: cy + 30 },
            { element: 'H', x: cx - 50, y: cy + 40 },
            { element: 'H', x: cx - 30, y: cy - 20, radius: 10 },
        ];
        const bonds = [
            { from: 0, to: 1, type: 'single' },
            { from: 0, to: 2, type: 'single' },
            { from: 0, to: 3, type: 'single' },
            { from: 0, to: 4, type: 'single' },
        ];
        const svg = buildMoleculeSVG(atoms as any, bonds as any);
        svg.push(`<text x="${cx}" y="250" font-size="18" font-weight="bold" text-anchor="middle">CH₄ (Methane)</text>`);
        return createChemDiagram(id, width, height, svg);
    }

    return createChemDiagram(id, width, height, []);
}
