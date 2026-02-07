/**
 * Chemistry Organic Molecules Diagram Presets
 * Alkanes, alkenes, alkynes, aromatics, and functional groups
 * upgraded to World-Class 3D Visuals
 */

import type { FBDDiagram } from '../../fbd/types';
import { drawAtom3D, drawBond3D, AtomConfig, BondConfig } from './render-utils';

/**
 * Helper to build organic molecule SVG
 */
function buildMoleculeSVG(atoms: AtomConfig[], bonds: { from: number, to: number, type: 'single' | 'double' | 'triple' }[]): string[] {
    const svgElements: string[] = [];

    // 1. Draw Bonds first (behind atoms)
    bonds.forEach(bond => {
        const atom1 = atoms[bond.from];
        const atom2 = atoms[bond.to];
        svgElements.push(drawBond3D({
            x1: atom1.x,
            y1: atom1.y,
            x2: atom2.x,
            y2: atom2.y,
            type: bond.type
        }));
    });

    // 2. Draw Atoms
    atoms.forEach(atom => {
        svgElements.push(drawAtom3D(atom));
    });

    return svgElements;
}

function createOrganicDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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

// ALKANES

export function createMethane(id: string): FBDDiagram {
    const cx = 200, cy = 200;
    const atoms: AtomConfig[] = [
        { element: 'C', x: cx, y: cy }, // 0
        { element: 'H', x: cx, y: cy - 60 }, // 1 (Top)
        { element: 'H', x: cx + 55, y: cy + 40 }, // 2 (Right-down)
        { element: 'H', x: cx - 45, y: cy + 50 }, // 3 (Left-down front)
        { element: 'H', x: cx - 30, y: cy - 20, radius: 10 }, // 4 (Back - smaller radius for depth)
    ];

    // Adjust back hydrogen visual manually to be behind Carbon?
    // Actually, simple painter's algorithm: draw back first.
    // Let's reorder atoms for rendering: Back H, then Bonds, then C, then Front H?
    // Current helper draws all bonds then all atoms.
    // For true 3D, we need sorted z-index.
    // But for 2D diagram representation, standard bonds-then-atoms is usually okay,
    // except specifically for "3D-looking" tetrahedral where C covers back H.

    // Simplification: Standard 2D projection with 3D spheres.
    // 0: C, 1: Top H, 2: Right H, 3: Left H, 4: Bottom H

    const atomsList: AtomConfig[] = [
        { element: 'C', x: cx, y: cy },
        { element: 'H', x: cx, y: cy - 70 },
        { element: 'H', x: cx + 70, y: cy },
        { element: 'H', x: cx, y: cy + 70 },
        { element: 'H', x: cx - 70, y: cy },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' },
        { from: 0, to: 4, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atomsList, bonds as any);
    svg.push(`<text x="${cx}" y="40" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">CH₄ (Methane)</text>`);

    return createOrganicDiagram(id, 400, 400, svg);
}

export function createEthane(id: string): FBDDiagram {
    const y = 100;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 100, y }, // 0
        { element: 'C', x: 200, y }, // 1
        // Left C Hydrogens
        { element: 'H', x: 60, y: y - 50 },
        { element: 'H', x: 60, y: y + 50 },
        { element: 'H', x: 40, y: y },
        // Right C Hydrogens
        { element: 'H', x: 240, y: y - 50 },
        { element: 'H', x: 240, y: y + 50 },
        { element: 'H', x: 260, y: y },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' },
        { from: 0, to: 4, type: 'single' },
        { from: 1, to: 5, type: 'single' },
        { from: 1, to: 6, type: 'single' },
        { from: 1, to: 7, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="150" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₂H₆ (Ethane)</text>`);

    return createOrganicDiagram(id, 300, 200, svg);
}

export function createPropane(id: string): FBDDiagram {
    const y = 100;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 80, y },
        { element: 'C', x: 160, y },
        { element: 'C', x: 240, y },
        // H for C1
        { element: 'H', x: 80, y: y - 50 },
        { element: 'H', x: 80, y: y + 50 },
        { element: 'H', x: 30, y },
        // H for C2
        { element: 'H', x: 160, y: y - 50 },
        { element: 'H', x: 160, y: y + 50 },
        // H for C3
        { element: 'H', x: 240, y: y - 50 },
        { element: 'H', x: 240, y: y + 50 },
        { element: 'H', x: 290, y },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 1, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }, { from: 0, to: 4, type: 'single' }, { from: 0, to: 5, type: 'single' },
        { from: 1, to: 6, type: 'single' }, { from: 1, to: 7, type: 'single' },
        { from: 2, to: 8, type: 'single' }, { from: 2, to: 9, type: 'single' }, { from: 2, to: 10, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="160" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₃H₈ (Propane)</text>`);

    return createOrganicDiagram(id, 320, 200, svg);
}

export function createButane(id: string): FBDDiagram {
    // Zig-zag backbone for realism? Or straight? 
    // Standard chemical diagrams often use straight for simple alkanes, 
    // but zig-zag is more accurate. Let's stick to straight for clarity unless requested.
    const y = 100;
    const spacing = 70;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 60, y },
        { element: 'C', x: 60 + spacing, y },
        { element: 'C', x: 60 + spacing * 2, y },
        { element: 'C', x: 60 + spacing * 3, y },
        // Hydrogens omitted for simplicity in code, but required for diagram?
        // Let's add them.
        { element: 'H', x: 60, y: y - 50 }, { element: 'H', x: 60, y: y + 50 }, { element: 'H', x: 20, y },
        { element: 'H', x: 130, y: y - 50 }, { element: 'H', x: 130, y: y + 50 },
        { element: 'H', x: 200, y: y - 50 }, { element: 'H', x: 200, y: y + 50 },
        { element: 'H', x: 270, y: y - 50 }, { element: 'H', x: 270, y: y + 50 }, { element: 'H', x: 310, y },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' }, { from: 1, to: 2, type: 'single' }, { from: 2, to: 3, type: 'single' },
        // C1 H
        { from: 0, to: 4, type: 'single' }, { from: 0, to: 5, type: 'single' }, { from: 0, to: 6, type: 'single' },
        // C2 H
        { from: 1, to: 7, type: 'single' }, { from: 1, to: 8, type: 'single' },
        // C3 H
        { from: 2, to: 9, type: 'single' }, { from: 2, to: 10, type: 'single' },
        // C4 H
        { from: 3, to: 11, type: 'single' }, { from: 3, to: 12, type: 'single' }, { from: 3, to: 13, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="200" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₄H₁₀ (Butane)</text>`);

    return createOrganicDiagram(id, 400, 200, svg);
}

// ALKENES

export function createEthene(id: string): FBDDiagram {
    const y = 100;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 120, y },
        { element: 'C', x: 220, y },
        // H angled
        { element: 'H', x: 80, y: y - 50 },
        { element: 'H', x: 80, y: y + 50 },
        { element: 'H', x: 260, y: y - 50 },
        { element: 'H', x: 260, y: y + 50 },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'double' },
        { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' },
        { from: 1, to: 4, type: 'single' },
        { from: 1, to: 5, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="170" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₂H₄ (Ethene)</text>`);

    return createOrganicDiagram(id, 340, 200, svg);
}

export function createPropene(id: string): FBDDiagram {
    const y = 120;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 100, y },
        { element: 'C', x: 200, y },
        { element: 'C', x: 300, y }, // Methyl group
        // H for C1 (double bond start)
        { element: 'H', x: 60, y: y - 50 },
        { element: 'H', x: 60, y: y + 50 },
        // H for C2
        { element: 'H', x: 200, y: y - 70 },
        // H for C3 (Methyl)
        { element: 'H', x: 300, y: y - 50 },
        { element: 'H', x: 300, y: y + 50 },
        { element: 'H', x: 340, y },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'double' },
        { from: 1, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }, { from: 0, to: 4, type: 'single' },
        { from: 1, to: 5, type: 'single' },
        { from: 2, to: 6, type: 'single' }, { from: 2, to: 7, type: 'single' }, { from: 2, to: 8, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="200" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₃H₆ (Propene)</text>`);

    return createOrganicDiagram(id, 400, 250, svg);
}

// ALKYNES

export function createEthyne(id: string): FBDDiagram {
    const y = 100;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 120, y },
        { element: 'C', x: 220, y },
        { element: 'H', x: 60, y },
        { element: 'H', x: 280, y },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'triple' },
        { from: 0, to: 2, type: 'single' },
        { from: 1, to: 3, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="170" y="30" font-size="18" font-weight="bold" text-anchor="middle">C₂H₂ (Ethyne)</text>`);

    return createOrganicDiagram(id, 340, 200, svg);
}

// AROMATICS

export function createBenzene(id: string): FBDDiagram {
    const cx = 200, cy = 200, r = 80;
    const atoms: AtomConfig[] = [];
    const bonds: any[] = [];

    // Create 6 Carbons
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        atoms.push({
            element: 'C',
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });

        // Add Hydrogens
        const rH = r + 50;
        atoms.push({
            element: 'H',
            x: cx + rH * Math.cos(angle),
            y: cy + rH * Math.sin(angle)
        });

        // Bond C-H
        bonds.push({ from: i * 2, to: i * 2 + 1, type: 'single' });

        // Bond C-C (Alternating double/single for Kekule structure)
        const nextC = ((i + 1) % 6) * 2;
        const bondType = i % 2 === 0 ? 'double' : 'single';
        bonds.push({ from: i * 2, to: nextC, type: bondType });
    }

    const svg = buildMoleculeSVG(atoms, bonds);

    // Add resonance circle overlay (dotted)
    svg.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>`);
    svg.push(`<text x="${cx}" y="50" font-size="20" font-weight="bold" text-anchor="middle">C₆H₆ (Benzene)</text>`);

    return createOrganicDiagram(id, 400, 400, svg);
}

export function createToluene(id: string): FBDDiagram {
    // Benzene Base
    const cx = 200, cy = 220, r = 70;
    const atoms: AtomConfig[] = [];
    const bonds: any[] = [];

    // 6 Ring Carbons
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        atoms.push({
            element: 'C',
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });
    }

    // Connect Ring
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        bonds.push({ from: i, to: next, type: i % 2 === 0 ? 'double' : 'single' });

        // Add H to all except top (index 0)
        if (i !== 0) {
            const angle = (i * 60 - 90) * Math.PI / 180;
            atoms.push({
                element: 'H',
                x: cx + (r + 40) * Math.cos(angle),
                y: cy + (r + 40) * Math.sin(angle)
            });
            bonds.push({ from: i, to: atoms.length - 1, type: 'single' });
        }
    }

    // Methyl Group at top (index 0)
    const methylCIndex = atoms.length;
    atoms.push({ element: 'C', x: cx, y: cy - 130 }); // Methyl C
    bonds.push({ from: 0, to: methylCIndex, type: 'single' });

    // Methyl H
    atoms.push({ element: 'H', x: cx, y: cy - 180 });
    atoms.push({ element: 'H', x: cx - 40, y: cy - 140 });
    atoms.push({ element: 'H', x: cx + 40, y: cy - 140 });
    bonds.push({ from: methylCIndex, to: atoms.length - 3, type: 'single' });
    bonds.push({ from: methylCIndex, to: atoms.length - 2, type: 'single' });
    bonds.push({ from: methylCIndex, to: atoms.length - 1, type: 'single' });

    const svg = buildMoleculeSVG(atoms, bonds);
    svg.push(`<text x="${cx}" y="30" font-size="20" font-weight="bold" text-anchor="middle">C₇H₈ (Toluene)</text>`);

    return createOrganicDiagram(id, 400, 420, svg);
}

export function createPhenol(id: string): FBDDiagram {
    const cx = 200, cy = 220, r = 70;
    const atoms: AtomConfig[] = [];
    const bonds: any[] = [];

    // Ring
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        atoms.push({ element: 'C', x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    for (let i = 0; i < 6; i++) {
        bonds.push({ from: i, to: (i + 1) % 6, type: i % 2 === 0 ? 'double' : 'single' });
        if (i !== 0) {
            const angle = (i * 60 - 90) * Math.PI / 180;
            atoms.push({ element: 'H', x: cx + (r + 40) * Math.cos(angle), y: cy + (r + 40) * Math.sin(angle) });
            bonds.push({ from: i, to: atoms.length - 1, type: 'single' });
        }
    }

    // OH Group
    const oIndex = atoms.length;
    atoms.push({ element: 'O', x: cx, y: cy - 130 });
    bonds.push({ from: 0, to: oIndex, type: 'single' });

    atoms.push({ element: 'H', x: cx + 40, y: cy - 150 });
    bonds.push({ from: oIndex, to: atoms.length - 1, type: 'single' });

    const svg = buildMoleculeSVG(atoms, bonds);
    svg.push(`<text x="${cx}" y="30" font-size="20" font-weight="bold" text-anchor="middle">C₆H₅OH (Phenol)</text>`);

    return createOrganicDiagram(id, 400, 420, svg);
}

// FUNCTIONAL GROUPS

export function createEthanol(id: string): FBDDiagram {
    const y = 140;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 100, y }, // 0
        { element: 'C', x: 200, y }, // 1
        { element: 'O', x: 280, y }, // 2
        // H for C1
        { element: 'H', x: 100, y: y - 60 },
        { element: 'H', x: 100, y: y + 60 },
        { element: 'H', x: 40, y },
        // H for C2
        { element: 'H', x: 200, y: y - 60 },
        { element: 'H', x: 200, y: y + 60 },
        // H for O
        { element: 'H', x: 320, y: y - 30 },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 1, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }, { from: 0, to: 4, type: 'single' }, { from: 0, to: 5, type: 'single' },
        { from: 1, to: 6, type: 'single' }, { from: 1, to: 7, type: 'single' },
        { from: 2, to: 8, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="200" y="40" font-size="20" font-weight="bold" text-anchor="middle">C₂H₅OH (Ethanol)</text>`);

    return createOrganicDiagram(id, 400, 250, svg);
}

export function createAceticAcid(id: string): FBDDiagram {
    const y = 140;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 100, y }, // 0: Methyl C
        { element: 'C', x: 200, y }, // 1: Carboxyl C
        { element: 'O', x: 200, y: y - 80 }, // 2: Double bond O
        { element: 'O', x: 280, y }, // 3: Single bond O
        // H for Methyl C
        { element: 'H', x: 40, y },
        { element: 'H', x: 100, y: y - 60 },
        { element: 'H', x: 100, y: y + 60 },
        // H for OH
        { element: 'H', x: 330, y: y - 20 },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 1, to: 2, type: 'double' }, // C=O
        { from: 1, to: 3, type: 'single' }, // C-OH
        { from: 3, to: 7, type: 'single' }, // O-H
        // Methyl H
        { from: 0, to: 4, type: 'single' },
        { from: 0, to: 5, type: 'single' },
        { from: 0, to: 6, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="200" y="30" font-size="20" font-weight="bold" text-anchor="middle">CH₃COOH (Acetic Acid)</text>`);

    return createOrganicDiagram(id, 400, 260, svg);
}

export function createAcetone(id: string): FBDDiagram {
    const y = 140;
    const atoms: AtomConfig[] = [
        { element: 'C', x: 100, y }, // 0
        { element: 'C', x: 200, y }, // 1 (Carbonyl)
        { element: 'C', x: 300, y }, // 2
        { element: 'O', x: 200, y: y - 80 }, // 3 (Double bond O)
        // H for C1
        { element: 'H', x: 40, y }, { element: 'H', x: 100, y: y - 60 }, { element: 'H', x: 100, y: y + 60 },
        // H for C3
        { element: 'H', x: 360, y }, { element: 'H', x: 300, y: y - 60 }, { element: 'H', x: 300, y: y + 60 },
    ];

    const bonds = [
        { from: 0, to: 1, type: 'single' },
        { from: 1, to: 2, type: 'single' },
        { from: 1, to: 3, type: 'double' },
        // C1 H
        { from: 0, to: 4, type: 'single' }, { from: 0, to: 5, type: 'single' }, { from: 0, to: 6, type: 'single' },
        // C3 H
        { from: 2, to: 7, type: 'single' }, { from: 2, to: 8, type: 'single' }, { from: 2, to: 9, type: 'single' },
    ] as const;

    const svg = buildMoleculeSVG(atoms, bonds as any);
    svg.push(`<text x="200" y="30" font-size="20" font-weight="bold" text-anchor="middle">(CH₃)₂CO (Acetone)</text>`);

    return createOrganicDiagram(id, 400, 250, svg);
}
