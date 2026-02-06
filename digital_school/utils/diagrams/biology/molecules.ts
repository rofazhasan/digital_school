/**
 * Biology Molecular Diagrams
 * DNA, proteins, cells, large biomolecules
 */

import type { FBDDiagram } from '../../fbd/types';

function createBioDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * DNA double helix (simplified)
 */
export function createDNA(id: string, basePairs: number = 5): FBDDiagram {
    const elements: string[] = [];
    const width = 400;
    const height = 600;

    // DNA strands
    for (let i = 0; i <= basePairs; i++) {
        const y = 100 + i * 80;
        const offset = Math.sin(i * 0.8) * 40;

        // Left strand
        const x1 = 150 + offset;
        const x2 = 150 + Math.sin((i + 1) * 0.8) * 40;

        // Right strand
        const x3 = 250 + offset;
        const x4 = 250 + Math.sin((i + 1) * 0.8) * 40;

        if (i < basePairs) {
            // Backbone
            elements.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y + 80}" stroke="#3b82f6" stroke-width="4"/>`);
            elements.push(`<line x1="${x3}" y1="${y}" x2="${x4}" y2="${y + 80}" stroke="#3b82f6" stroke-width="4"/>`);

            // Base pairs
            const baseY = y + 40;
            const baseX1 = 150 + Math.sin((i + 0.5) * 0.8) * 40;
            const baseX2 = 250 + Math.sin((i + 0.5) * 0.8) * 40;

            const bases = ['A-T', 'G-C', 'C-G', 'T-A', 'A-T'];
            const baseColor = bases[i % bases.length].includes('A') || bases[i % bases.length].includes('T') ? '#ef4444' : '#10b981';

            elements.push(`<line x1="${baseX1}" y1="${baseY}" x2="${baseX2}" y2="${baseY}" stroke="${baseColor}" stroke-width="3" stroke-dasharray="5,5"/>`);
            elements.push(`<text x="${(baseX1 + baseX2) / 2}" y="${baseY - 5}" font-size="11" text-anchor="middle" fill="${baseColor}">${bases[i % bases.length]}</text>`);
        }

        // Phosphate groups
        elements.push(`<circle cx="${x1}" cy="${y}" r="8" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>`);
        elements.push(`<circle cx="${x3}" cy="${y}" r="8" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>`);
    }

    elements.push(`<text x="200" y="550" font-size="16" font-weight="bold" text-anchor="middle">DNA Double Helix</text>`);

    return createBioDiagram(id, width, height, elements);
}

/**
 * Protein structure (alpha helix)
 */
export function createProteinHelix(id: string): FBDDiagram {
    const elements: string[] = [];

    // Alpha helix representation
    for (let i = 0; i < 8; i++) {
        const y = 100 + i * 40;
        const x = 200 + Math.sin(i * 0.7) * 60;
        const size = 15 + Math.cos(i * 0.7) * 5;

        // Amino acid residue
        elements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2"/>`);
        elements.push(`<text x="${x}" y="${y + 4}" font-size="10" font-weight="bold" fill="white" text-anchor="middle">AA</text>`);

        // Connecting peptide bond
        if (i < 7) {
            const nextY = 100 + (i + 1) * 40;
            const nextX = 200 + Math.sin((i + 1) * 0.7) * 60;
            elements.push(`<line x1="${x}" y1="${y}" x2="${nextX}" y2="${nextY}" stroke="#333" stroke-width="2"/>`);
        }
    }

    // Hydrogen bonds (dashed lines)
    for (let i = 0; i < 5; i++) {
        const y1 = 100 + i * 40;
        const y2 = 100 + (i + 3) * 40;
        const x1 = 200 + Math.sin(i * 0.7) * 60;
        const x2 = 200 + Math.sin((i + 3) * 0.7) * 60;

        elements.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#dc2626" stroke-width="1" stroke-dasharray="3,3"/>`);
    }

    elements.push(`<text x="200" y="450" font-size="16" font-weight="bold" text-anchor="middle">α-Helix</text>`);
    elements.push(`<text x="200" y="470" font-size="11" text-anchor="middle" fill="#666">Protein Secondary Structure</text>`);

    return createBioDiagram(id, 400, 500, elements);
}

/**
 * Cell membrane (phospholipid bilayer)
 */
export function createCellMembrane(id: string): FBDDiagram {
    const elements: string[] = [];

    // Phospholipid bilayer
    for (let i = 0; i < 8; i++) {
        const x = 80 + i * 60;

        // Top layer
        // Hydrophilic head
        elements.push(`<circle cx="${x}" cy="150" r="12" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>`);
        // Hydrophobic tails
        elements.push(`<line x1="${x - 5}" y1="162" x2="${x - 5}" y2="220" stroke="#f59e0b" stroke-width="3"/>`);
        elements.push(`<line x1="${x + 5}" y1="162" x2="${x + 5}" y2="220" stroke="#f59e0b" stroke-width="3"/>`);

        // Bottom layer
        // Hydrophobic tails
        elements.push(`<line x1="${x - 5}" y1="280" x2="${x - 5}" y2="220" stroke="#f59e0b" stroke-width="3"/>`);
        elements.push(`<line x1="${x + 5}" y1="280" x2="${x + 5}" y2="220" stroke="#f59e0b" stroke-width="3"/>`);
        // Hydrophilic head
        elements.push(`<circle cx="${x}" cy="292" r="12" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>`);
    }

    // Membrane proteins
    elements.push(`
    <rect x="200" y="140" width="30" height="170" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2" rx="5"/>
    <text x="215" y="230" font-size="10" font-weight="bold" fill="white" text-anchor="middle">P</text>
  `);

    elements.push(`
    <ellipse cx="350" cy="220" rx="25" ry="60" fill="#10b981" stroke="#059669" stroke-width="2"/>
    <text x="350" y="225" font-size="10" font-weight="bold" fill="white" text-anchor="middle">P</text>
  `);

    // Labels
    elements.push(`<text x="250" y="130" font-size="11" fill="#666">Extracellular</text>`);
    elements.push(`<text x="250" y="330" font-size="11" fill="#666">Intracellular</text>`);
    elements.push(`<text x="250" y="370" font-size="16" font-weight="bold" text-anchor="middle">Cell Membrane</text>`);

    return createBioDiagram(id, 500, 400, elements);
}

/**
 * ATP molecule
 */
export function createATP(id: string): FBDDiagram {
    const elements: string[] = [];

    // Adenine base
    elements.push(`
    <circle cx="150" cy="200" r="30" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
    <text x="150" y="206" font-size="14" font-weight="bold" fill="white" text-anchor="middle">Adenine</text>
  `);

    // Ribose sugar
    elements.push(`
    <circle cx="250" cy="200" r="25" fill="#10b981" stroke="#059669" stroke-width="2"/>
    <text x="250" y="206" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Ribose</text>
    <line x1="180" y1="200" x2="225" y2="200" stroke="#333" stroke-width="3"/>
  `);

    // Phosphate groups
    const phosphates = [
        { x: 320, label: 'P' },
        { x: 380, label: 'P' },
        { x: 440, label: 'P' },
    ];

    phosphates.forEach((p, i) => {
        elements.push(`<circle cx="${p.x}" cy="200" r="20" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>`);
        elements.push(`<text x="${p.x}" y="206" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${p.label}</text>`);

        if (i === 0) {
            elements.push(`<line x1="275" y1="200" x2="300" y2="200" stroke="#333" stroke-width="3"/>`);
        } else {
            elements.push(`<line x1="${p.x - 40}" y1="200" x2="${p.x - 20}" y2="200" stroke="#333" stroke-width="3"/>`);
        }

        // High energy bonds
        if (i > 0) {
            elements.push(`<text x="${p.x - 30}" y="185" font-size="10" fill="#ef4444">~</text>`);
        }
    });

    elements.push(`<text x="300" y="270" font-size="16" font-weight="bold" text-anchor="middle">ATP (Adenosine Triphosphate)</text>`);
    elements.push(`<text x="300" y="290" font-size="11" text-anchor="middle" fill="#666">Energy Currency of the Cell</text>`);

    return createBioDiagram(id, 600, 320, elements);
}

/**
 * Enzyme-substrate complex
 */
export function createEnzymeSubstrate(id: string): FBDDiagram {
    const elements: string[] = [];

    // Enzyme (large shape with active site)
    elements.push(`
    <path d="M 100 200 Q 100 100 200 100 Q 300 100 300 200 Q 300 250 250 280 Q 200 250 200 200 Q 200 250 150 280 Q 100 250 100 200" 
          fill="#8b5cf6" fill-opacity="0.3" stroke="#6d28d9" stroke-width="3"/>
    <text x="200" y="180" font-size="14" font-weight="bold" text-anchor="middle">Enzyme</text>
  `);

    // Active site (indentation)
    elements.push(`
    <path d="M 200 200 Q 220 220 200 240 Q 180 220 200 200" 
          fill="none" stroke="#6d28d9" stroke-width="3" stroke-dasharray="5,5"/>
    <text x="200" y="260" font-size="10" fill="#666">Active Site</text>
  `);

    // Substrate
    elements.push(`
    <rect x="350" y="200" width="60" height="40" fill="#10b981" stroke="#059669" stroke-width="2" rx="5"/>
    <text x="380" y="225" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Substrate</text>
  `);

    // Arrow
    elements.push(`
    <defs>
      <marker id="arrow-enzyme" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#333"/>
      </marker>
    </defs>
    <line x1="310" y1="220" x2="340" y2="220" stroke="#333" stroke-width="2" marker-end="url(#arrow-enzyme)"/>
  `);

    elements.push(`<text x="250" y="330" font-size="14" font-weight="bold" text-anchor="middle">Enzyme-Substrate Complex</text>`);

    return createBioDiagram(id, 500, 360, elements);
}
