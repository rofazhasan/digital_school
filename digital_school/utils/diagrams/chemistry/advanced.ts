/**
 * Advanced Chemistry Diagrams
 * Reactions, solutions, large molecules, organic compounds
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

/**
 * Chemical reaction with beakers
 */
export function createReactionSetup(
    id: string,
    reactant1: string = 'HCl',
    reactant2: string = 'NaOH',
    product: string = 'NaCl + H₂O'
): FBDDiagram {
    const elements: string[] = [];

    // Beaker 1 (Reactant 1)
    elements.push(`
    <path d="M 80 150 L 80 300 Q 80 320 100 320 L 180 320 Q 200 320 200 300 L 200 150" 
          fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 90 220 L 90 300 Q 90 310 100 310 L 180 310 Q 190 310 190 300 L 190 220" 
          fill="#ef4444" fill-opacity="0.3" stroke="none"/>
    <text x="140" y="270" font-size="16" font-weight="bold" text-anchor="middle">${reactant1}</text>
    <text x="140" y="350" font-size="12" text-anchor="middle">Reactant 1</text>
  `);

    // Plus sign
    elements.push(`<text x="250" y="250" font-size="24" font-weight="bold" text-anchor="middle">+</text>`);

    // Beaker 2 (Reactant 2)
    elements.push(`
    <path d="M 280 150 L 280 300 Q 280 320 300 320 L 380 320 Q 400 320 400 300 L 400 150" 
          fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 290 220 L 290 300 Q 290 310 300 310 L 380 310 Q 390 310 390 300 L 390 220" 
          fill="#3b82f6" fill-opacity="0.3" stroke="none"/>
    <text x="340" y="270" font-size="16" font-weight="bold" text-anchor="middle">${reactant2}</text>
    <text x="340" y="350" font-size="12" text-anchor="middle">Reactant 2</text>
  `);

    // Arrow
    elements.push(`
    <defs>
      <marker id="arrowhead-chem" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#333"/>
      </marker>
    </defs>
    <line x1="420" y1="250" x2="480" y2="250" stroke="#333" stroke-width="3" marker-end="url(#arrowhead-chem)"/>
  `);

    // Product beaker
    elements.push(`
    <path d="M 500 150 L 500 300 Q 500 320 520 320 L 600 320 Q 620 320 620 300 L 620 150" 
          fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 510 220 L 510 300 Q 510 310 520 310 L 600 310 Q 610 310 610 300 L 610 220" 
          fill="#10b981" fill-opacity="0.3" stroke="none"/>
    <text x="560" y="270" font-size="14" font-weight="bold" text-anchor="middle">${product}</text>
    <text x="560" y="350" font-size="12" text-anchor="middle">Product</text>
  `);

    return createChemDiagram(id, 700, 400, elements);
}

/**
 * Titration setup
 */
export function createTitration(id: string): FBDDiagram {
    const elements: string[] = [];

    // Burette
    elements.push(`
    <rect x="250" y="50" width="60" height="200" fill="none" stroke="#333" stroke-width="3"/>
    <rect x="253" y="100" width="54" height="100" fill="#ec4899" fill-opacity="0.4"/>
    <path d="M 280 250 L 280 280 Q 280 290 270 290 L 260 290" 
          fill="none" stroke="#333" stroke-width="2"/>
    <circle cx="255" cy="290" r="5" fill="#333"/>
    <text x="280" y="40" font-size="14" font-weight="bold" text-anchor="middle">Burette</text>
    <text x="330" y="150" font-size="11">Titrant</text>
  `);

    // Flask
    elements.push(`
    <path d="M 200 320 L 200 380 L 150 480 L 350 480 L 300 380 L 300 320" 
          fill="none" stroke="#333" stroke-width="3"/>
    <ellipse cx="250" cy="320" rx="50" ry="10" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 210 400 L 170 480 L 330 480 L 290 400" 
          fill="#6366f1" fill-opacity="0.3" stroke="none"/>
    <text x="250" y="520" font-size="14" font-weight="bold" text-anchor="middle">Conical Flask</text>
    <text x="250" y="450" font-size="12" text-anchor="middle">Analyte</text>
  `);

    // Indicator drop
    elements.push(`
    <circle cx="280" cy="300" r="3" fill="#ec4899"/>
    <text x="300" y="305" font-size="10" fill="#666">Indicator</text>
  `);

    return createChemDiagram(id, 500, 550, elements);
}

/**
 * Distillation apparatus
 */
export function createDistillation(id: string): FBDDiagram {
    const elements: string[] = [];

    // Round bottom flask
    elements.push(`
    <circle cx="150" cy="350" r="60" fill="none" stroke="#333" stroke-width="3"/>
    <ellipse cx="150" cy="290" rx="20" ry="8" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="150" cy="350" r="50" fill="#f59e0b" fill-opacity="0.3"/>
    <text x="150" y="430" font-size="11" text-anchor="middle">Mixture</text>
    
    <!-- Heat source -->
    <path d="M 120 420 Q 130 430 140 420 Q 150 430 160 420 Q 170 430 180 420" 
          stroke="#ef4444" stroke-width="2" fill="none"/>
    <text x="150" y="450" font-size="10" text-anchor="middle" fill="#ef4444">Heat</text>
  `);

    // Condenser
    elements.push(`
    <rect x="210" y="200" width="200" height="40" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="210" y1="210" x2="410" y2="210" stroke="#3b82f6" stroke-width="2"/>
    <line x1="210" y1="230" x2="410" y2="230" stroke="#3b82f6" stroke-width="2"/>
    <text x="310" y="195" font-size="11" text-anchor="middle">Condenser</text>
    <text x="220" y="260" font-size="9" fill="#3b82f6">Cold water in</text>
    <text x="360" y="190" font-size="9" fill="#3b82f6">Cold water out</text>
  `);

    // Connecting tube
    elements.push(`
    <path d="M 150 290 Q 180 250 210 220" fill="none" stroke="#333" stroke-width="3"/>
  `);

    // Collection flask
    elements.push(`
    <path d="M 410 220 L 450 280 L 450 350 Q 450 370 470 370 L 530 370 Q 550 370 550 350 L 550 280 L 590 220" 
          fill="none" stroke="#333" stroke-width="3"/>
    <path d="M 460 300 L 460 350 Q 460 360 470 360 L 530 360 Q 540 360 540 350 L 540 300" 
          fill="#10b981" fill-opacity="0.3" stroke="none"/>
    <text x="500" y="400" font-size="11" text-anchor="middle">Distillate</text>
  `);

    return createChemDiagram(id, 650, 470, elements);
}

/**
 * Large organic molecule (benzene ring)
 */
export function createBenzene(id: string): FBDDiagram {
    const elements: string[] = [];
    const centerX = 200;
    const centerY = 200;
    const radius = 60;

    // Hexagon
    for (let i = 0; i < 6; i++) {
        const angle1 = (i * 60 - 90) * Math.PI / 180;
        const angle2 = ((i + 1) * 60 - 90) * Math.PI / 180;
        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);

        elements.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="3"/>`);

        // Carbon atoms
        elements.push(`<circle cx="${x1}" cy="${y1}" r="15" fill="#6b7280" stroke="#374151" stroke-width="2"/>`);
        elements.push(`<text x="${x1}" y="${y1 + 5}" font-size="14" font-weight="bold" fill="white" text-anchor="middle">C</text>`);

        // Hydrogen atoms
        const hAngle = angle1;
        const hx = centerX + (radius + 40) * Math.cos(hAngle);
        const hy = centerY + (radius + 40) * Math.sin(hAngle);
        elements.push(`<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="#333" stroke-width="2"/>`);
        elements.push(`<circle cx="${hx}" cy="${hy}" r="12" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>`);
        elements.push(`<text x="${hx}" y="${hy + 4}" font-size="12" font-weight="bold" fill="#333" text-anchor="middle">H</text>`);
    }

    // Inner circle (aromatic)
    elements.push(`<circle cx="${centerX}" cy="${centerY}" r="40" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`);

    elements.push(`<text x="${centerX}" y="350" font-size="14" font-weight="bold" text-anchor="middle">C₆H₆ (Benzene)</text>`);

    return createChemDiagram(id, 400, 380, elements);
}

/**
 * Glucose molecule
 */
export function createGlucose(id: string): FBDDiagram {
    const elements: string[] = [];

    // Ring structure (simplified)
    const points = [
        { x: 200, y: 150 },
        { x: 280, y: 150 },
        { x: 320, y: 220 },
        { x: 280, y: 290 },
        { x: 200, y: 290 },
        { x: 160, y: 220 },
    ];

    // Draw ring
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        elements.push(`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#333" stroke-width="3"/>`);
    }

    // Carbon and oxygen atoms
    const labels = ['C', 'C', 'C', 'C', 'C', 'O'];
    points.forEach((p, i) => {
        const color = labels[i] === 'O' ? '#dc2626' : '#6b7280';
        const textColor = 'white';
        elements.push(`<circle cx="${p.x}" cy="${p.y}" r="18" fill="${color}" stroke="#374151" stroke-width="2"/>`);
        elements.push(`<text x="${p.x}" y="${p.y + 6}" font-size="16" font-weight="bold" fill="${textColor}" text-anchor="middle">${labels[i]}</text>`);
    });

    // OH groups
    const ohPositions = [
        { x: 200, y: 100, label: 'OH' },
        { x: 320, y: 100, label: 'OH' },
        { x: 360, y: 220, label: 'OH' },
        { x: 320, y: 340, label: 'OH' },
    ];

    ohPositions.forEach(oh => {
        elements.push(`<text x="${oh.x}" y="${oh.y}" font-size="14" font-weight="bold" fill="#dc2626">${oh.label}</text>`);
    });

    elements.push(`<text x="240" y="380" font-size="14" font-weight="bold" text-anchor="middle">C₆H₁₂O₆ (Glucose)</text>`);

    return createChemDiagram(id, 480, 410, elements);
}

/**
 * Amino acid structure
 */
export function createAminoAcid(id: string, name: string = 'Glycine'): FBDDiagram {
    const elements: string[] = [];

    // Central carbon
    elements.push(`
    <circle cx="250" cy="200" r="20" fill="#6b7280" stroke="#374151" stroke-width="2"/>
    <text x="250" y="206" font-size="16" font-weight="bold" fill="white" text-anchor="middle">C</text>
  `);

    // Amino group (NH₂)
    elements.push(`
    <line x1="250" y1="200" x2="180" y2="150" stroke="#333" stroke-width="3"/>
    <circle cx="180" cy="150" r="18" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
    <text x="180" y="156" font-size="14" font-weight="bold" fill="white" text-anchor="middle">N</text>
    <text x="150" y="145" font-size="12" fill="#3b82f6">H₂</text>
  `);

    // Carboxyl group (COOH)
    elements.push(`
    <line x1="250" y1="200" x2="320" y2="150" stroke="#333" stroke-width="3"/>
    <circle cx="320" cy="150" r="18" fill="#6b7280" stroke="#374151" stroke-width="2"/>
    <text x="320" y="156" font-size="14" font-weight="bold" fill="white" text-anchor="middle">C</text>
    <text x="360" y="145" font-size="12" fill="#dc2626">OOH</text>
  `);

    // Hydrogen
    elements.push(`
    <line x1="250" y1="200" x2="250" y2="270" stroke="#333" stroke-width="2"/>
    <circle cx="250" cy="270" r="15" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
    <text x="250" y="276" font-size="14" font-weight="bold" fill="#333" text-anchor="middle">H</text>
  `);

    // R group
    elements.push(`
    <line x1="250" y1="200" x2="180" y2="250" stroke="#333" stroke-width="3"/>
    <circle cx="180" cy="250" r="18" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2"/>
    <text x="180" y="256" font-size="14" font-weight="bold" fill="white" text-anchor="middle">R</text>
  `);

    elements.push(`<text x="250" y="330" font-size="14" font-weight="bold" text-anchor="middle">${name}</text>`);

    return createChemDiagram(id, 500, 360, elements);
}
