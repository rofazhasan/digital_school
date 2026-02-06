/**
 * Chemistry Organic Molecules Diagram Presets
 * Alkanes, alkenes, alkynes, aromatics, and functional groups
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG organic chemistry diagrams
 */
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
    return createOrganicDiagram(id, 200, 200, [
        `<circle cx="100" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="100" y1="85" x2="100" y2="40" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="30" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="100" y="34" font-size="10" text-anchor="middle">H</text>`,
        `<line x1="115" y1="100" x2="150" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="160" cy="100" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="160" y="104" font-size="10" text-anchor="middle">H</text>`,
        `<line x1="85" y1="100" x2="50" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="40" cy="100" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="40" y="104" font-size="10" text-anchor="middle">H</text>`,
        `<line x1="100" y1="115" x2="100" y2="160" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="170" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="100" y="174" font-size="10" text-anchor="middle">H</text>`,
        `<text x="100" y="20" font-size="12" font-weight="bold" text-anchor="middle">CH₄</text>`
    ]);
}

export function createEthane(id: string): FBDDiagram {
    return createOrganicDiagram(id, 300, 150, [
        `<circle cx="100" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="115" y1="75" x2="185" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="150" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₂H₆ (Ethane)</text>`
    ]);
}

export function createPropane(id: string): FBDDiagram {
    return createOrganicDiagram(id, 350, 150, [
        `<circle cx="80" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="95" y1="75" x2="155" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="170" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="185" y1="75" x2="245" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="170" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₃H₈ (Propane)</text>`
    ]);
}

export function createButane(id: string): FBDDiagram {
    return createOrganicDiagram(id, 400, 200, [
        `<circle cx="80" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="95" y1="100" x2="145" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="160" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="160" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="175" y1="100" x2="225" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="240" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="240" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="255" y1="100" x2="305" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="320" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="200" y="30" font-size="12" font-weight="bold" text-anchor="middle">C₄H₁₀ (Butane)</text>`
    ]);
}

// ALKENES
export function createEthene(id: string): FBDDiagram {
    return createOrganicDiagram(id, 300, 150, [
        `<circle cx="100" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="115" y1="70" x2="185" y2="70" stroke="#333" stroke-width="2"/>`,
        `<line x1="115" y1="80" x2="185" y2="80" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="150" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₂H₄ (Ethene)</text>`,
        `<text x="150" y="130" font-size="10" text-anchor="middle">Double bond</text>`
    ]);
}

export function createPropene(id: string): FBDDiagram {
    return createOrganicDiagram(id, 350, 150, [
        `<circle cx="80" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="95" y1="70" x2="155" y2="70" stroke="#333" stroke-width="2"/>`,
        `<line x1="95" y1="80" x2="155" y2="80" stroke="#333" stroke-width="2"/>`,
        `<circle cx="170" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="185" y1="75" x2="245" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="170" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₃H₆ (Propene)</text>`
    ]);
}

// ALKYNES
export function createEthyne(id: string): FBDDiagram {
    return createOrganicDiagram(id, 300, 150, [
        `<circle cx="100" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="115" y1="68" x2="185" y2="68" stroke="#333" stroke-width="2"/>`,
        `<line x1="115" y1="75" x2="185" y2="75" stroke="#333" stroke-width="2"/>`,
        `<line x1="115" y1="82" x2="185" y2="82" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<text x="150" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₂H₂ (Ethyne)</text>`,
        `<text x="150" y="130" font-size="10" text-anchor="middle">Triple bond</text>`
    ]);
}

// AROMATICS
export function createBenzene(id: string): FBDDiagram {
    const cx = 150, cy = 150, r = 60;
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return createOrganicDiagram(id, 300, 300, [
        `<polygon points="${points.join(' ')}" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`,
        ...points.map((p, i) => {
            const [x, y] = p.split(',').map(Number);
            return `<circle cx="${x}" cy="${y}" r="15" fill="#333" stroke="#333" stroke-width="2"/>
                    <text x="${x}" y="${y + 5}" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`;
        }).join('\n'),
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">C₆H₆ (Benzene)</text>`,
        `<text x="${cx}" y="280" font-size="10" text-anchor="middle">Aromatic ring</text>`
    ]);
}

export function createToluene(id: string): FBDDiagram {
    return createOrganicDiagram(id, 300, 320, [
        // Benzene ring (simplified)
        `<circle cx="150" cy="150" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="150" cy="150" r="35" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<text x="150" y="155" font-size="14" font-weight="bold" text-anchor="middle">C₆H₅</text>`,
        // Methyl group
        `<line x1="150" y1="100" x2="150" y2="50" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="35" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="40" font-size="12" font-weight="bold" text-anchor="middle" fill="white">CH₃</text>`,
        `<text x="150" y="25" font-size="14" font-weight="bold" text-anchor="middle">C₇H₈ (Toluene)</text>`,
        `<text x="150" y="290" font-size="10" text-anchor="middle">Methyl benzene</text>`
    ]);
}

export function createPhenol(id: string): FBDDiagram {
    return createOrganicDiagram(id, 300, 320, [
        // Benzene ring
        `<circle cx="150" cy="150" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="150" cy="150" r="35" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<text x="150" y="155" font-size="14" font-weight="bold" text-anchor="middle">C₆H₅</text>`,
        // OH group
        `<line x1="150" y1="100" x2="150" y2="50" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="35" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="40" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<text x="150" y="25" font-size="14" font-weight="bold" text-anchor="middle">C₆H₅OH (Phenol)</text>`,
        `<text x="150" y="290" font-size="10" text-anchor="middle">Hydroxyl benzene</text>`
    ]);
}

// FUNCTIONAL GROUPS
export function createEthanol(id: string): FBDDiagram {
    return createOrganicDiagram(id, 350, 150, [
        `<circle cx="80" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="95" y1="75" x2="155" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="170" cy="75" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="185" y1="75" x2="235" y2="75" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="75" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="80" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<text x="170" y="20" font-size="12" font-weight="bold" text-anchor="middle">C₂H₅OH (Ethanol)</text>`,
        `<text x="170" y="130" font-size="10" text-anchor="middle">Alcohol</text>`
    ]);
}

export function createAceticAcid(id: string): FBDDiagram {
    return createOrganicDiagram(id, 400, 200, [
        `<circle cx="100" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="115" y1="100" x2="175" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="190" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="190" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Double bond to O
        `<line x1="205" y1="95" x2="245" y2="75" stroke="#333" stroke-width="2"/>`,
        `<line x1="205" y1="105" x2="245" y2="85" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="70" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="75" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // Single bond to OH
        `<line x1="205" y1="100" x2="255" y2="120" stroke="#333" stroke-width="2"/>`,
        `<circle cx="270" cy="130" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="270" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<text x="200" y="30" font-size="12" font-weight="bold" text-anchor="middle">CH₃COOH (Acetic Acid)</text>`,
        `<text x="200" y="180" font-size="10" text-anchor="middle">Carboxylic acid</text>`
    ]);
}

export function createAcetone(id: string): FBDDiagram {
    return createOrganicDiagram(id, 350, 200, [
        `<circle cx="80" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="95" y1="100" x2="155" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="170" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="185" y1="100" x2="245" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Double bond to O (up)
        `<line x1="170" y1="85" x2="170" y2="50" stroke="#333" stroke-width="2"/>`,
        `<line x1="175" y1="85" x2="175" y2="50" stroke="#333" stroke-width="2"/>`,
        `<circle cx="172" cy="35" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="172" y="40" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<text x="170" y="20" font-size="12" font-weight="bold" text-anchor="middle">(CH₃)₂CO (Acetone)</text>`,
        `<text x="170" y="180" font-size="10" text-anchor="middle">Ketone</text>`
    ]);
}
