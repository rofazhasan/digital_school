import type { FBDDiagram } from '../../fbd/types';
import { createMolecule } from './apparatus';

// Helper for custom SVG molecules
function wrapSVG(id: string, svg: string, width: number = 300, height: number = 300): FBDDiagram {
    return {
        id, width, height, points: [], forces: [],
        customSVG: svg
    };
}

// ===== ALKANES & ISOMERS =====

export function createPentane(id: string): FBDDiagram {
    // C5H12 straight chain
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">CH3-CH2-CH2-CH2-CH3</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">n-Pentane</text>
    `;
    return wrapSVG(id, svg);
}

export function createIsopentane(id: string): FBDDiagram {
    // 2-methylbutane
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">CH3-CH(CH3)-CH2-CH3</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">Isopentane</text>
    `;
    return wrapSVG(id, svg);
}

export function createNeopentane(id: string): FBDDiagram {
    // 2,2-dimethylpropane
    const svg = `
        <text x="150" y="130" font-family="monospace" font-size="20" text-anchor="middle">CH3</text>
        <text x="150" y="150" font-family="monospace" font-size="20" text-anchor="middle">|</text>
        <text x="150" y="170" font-family="monospace" font-size="20" text-anchor="middle">CH3-C-CH3</text>
        <text x="150" y="190" font-family="monospace" font-size="20" text-anchor="middle">|</text>
        <text x="150" y="210" font-family="monospace" font-size="20" text-anchor="middle">CH3</text>
        <text x="150" y="250" text-anchor="middle" font-size="12">Neopentane</text>
    `;
    return wrapSVG(id, svg);
}

export function createHexane(id: string): FBDDiagram {
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="18">CH3-(CH2)4-CH3</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">n-Hexane</text>
    `;
    return wrapSVG(id, svg);
}

// ===== CYCLOALKANES =====

export function createCyclopropane(id: string): FBDDiagram {
    const svg = `
        <polygon points="150,100 100,186 200,186" fill="none" stroke="#333" stroke-width="3"/>
        <text x="150" y="220" text-anchor="middle" font-size="12">Cyclopropane</text>
    `;
    return wrapSVG(id, svg);
}

export function createCyclobutane(id: string): FBDDiagram {
    const svg = `
        <rect x="100" y="100" width="100" height="100" fill="none" stroke="#333" stroke-width="3"/>
        <text x="150" y="230" text-anchor="middle" font-size="12">Cyclobutane</text>
    `;
    return wrapSVG(id, svg);
}

export function createCyclopentane(id: string): FBDDiagram {
    const svg = `
        <polygon points="150,80 226,135 197,222 103,222 74,135" fill="none" stroke="#333" stroke-width="3"/>
        <text x="150" y="250" text-anchor="middle" font-size="12">Cyclopentane</text>
    `;
    return wrapSVG(id, svg);
}

export function createCyclohexane(id: string): FBDDiagram {
    const svg = `
        <polygon points="100,100 150,71 200,100 200,158 150,187 100,158" fill="none" stroke="#333" stroke-width="3"/>
        <text x="150" y="220" text-anchor="middle" font-size="12">Cyclohexane</text>
    `;
    return wrapSVG(id, svg);
}

// ===== FUNCTIONAL GROUPS =====
export function createEther(id: string): FBDDiagram {
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">R-O-R'</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">Ether Group</text>
    `;
    return wrapSVG(id, svg);
}

export function createEster(id: string): FBDDiagram {
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">R-COO-R'</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">Ester Group</text>
    `;
    return wrapSVG(id, svg);
}

export function createAmine(id: string): FBDDiagram {
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">R-NH2</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">Amine Group</text>
    `;
    return wrapSVG(id, svg);
}

export function createAmide(id: string): FBDDiagram {
    const svg = `
        <text x="150" y="150" font-family="monospace" font-size="20">R-CONH2</text>
        <text x="150" y="200" text-anchor="middle" font-size="12">Amide Group</text>
    `;
    return wrapSVG(id, svg);
}
