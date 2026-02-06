/**
 * Physics Waves & Optics Diagram Presets
 */

import type { FBDDiagram } from '../../fbd/types';

function createWaveDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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

export function createTransverseWave(id: string, wavelength: number = 100, amplitude: number = 30): FBDDiagram {
    const width = 600;
    const height = 200;
    const elements: string[] = [];

    // Generate sine wave path
    let pathData = `M 50 ${height / 2}`;
    for (let x = 0; x <= 500; x += 5) {
        const y = height / 2 + amplitude * Math.sin((x / wavelength) * 2 * Math.PI);
        pathData += ` L ${50 + x} ${y}`;
    }

    elements.push(`<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="3"/>`);
    elements.push(`<line x1="50" y1="${height / 2}" x2="550" y2="${height / 2}" stroke="#999" stroke-width="1" stroke-dasharray="5,5"/>`);
    elements.push(`<text x="300" y="30" font-size="14" text-anchor="middle" fill="#333">Transverse Wave</text>`);
    elements.push(`<text x="300" y="180" font-size="12" text-anchor="middle" fill="#666">λ = ${wavelength}</text>`);

    return createWaveDiagram(id, width, height, elements);
}

export function createLongitudinalWave(id: string): FBDDiagram {
    const width = 600;
    const height = 150;
    const elements: string[] = [];

    // Compression and rarefaction
    for (let x = 0; x < 500; x += 10) {
        const density = Math.abs(Math.sin((x / 50) * Math.PI));
        const spacing = 5 + density * 10;
        elements.push(`<line x1="${50 + x}" y1="50" x2="${50 + x}" y2="100" stroke="#2563eb" stroke-width="${1 + density * 2}"/>`);
    }

    elements.push(`<text x="300" y="30" font-size="14" text-anchor="middle" fill="#333">Longitudinal Wave</text>`);
    elements.push(`<text x="150" y="130" font-size="11" fill="#666">Compression</text>`);
    elements.push(`<text x="400" y="130" font-size="11" fill="#666">Rarefaction</text>`);

    return createWaveDiagram(id, width, height, elements);
}

export function createStandingWave(id: string): FBDDiagram {
    const width = 600;
    const height = 200;
    const elements: string[] = [];

    // Standing wave envelope
    let pathData1 = `M 50 100`;
    let pathData2 = `M 50 100`;

    for (let x = 0; x <= 500; x += 5) {
        const envelope = 40 * Math.sin((x / 500) * 3 * Math.PI);
        pathData1 += ` L ${50 + x} ${100 - envelope}`;
        pathData2 += ` L ${50 + x} ${100 + envelope}`;
    }

    elements.push(`<path d="${pathData1}" fill="none" stroke="#2563eb" stroke-width="2"/>`);
    elements.push(`<path d="${pathData2}" fill="none" stroke="#2563eb" stroke-width="2"/>`);
    elements.push(`<line x1="50" y1="100" x2="550" y2="100" stroke="#999" stroke-width="1" stroke-dasharray="5,5"/>`);

    // Nodes
    for (let i = 0; i <= 3; i++) {
        const x = 50 + (i * 500 / 3);
        elements.push(`<circle cx="${x}" cy="100" r="4" fill="#dc2626"/>`);
        elements.push(`<text x="${x}" y="130" font-size="10" text-anchor="middle" fill="#666">N</text>`);
    }

    elements.push(`<text x="300" y="30" font-size="14" text-anchor="middle" fill="#333">Standing Wave</text>`);

    return createWaveDiagram(id, width, height, elements);
}

export function createRayDiagram(id: string, type: 'convex' | 'concave' = 'convex'): FBDDiagram {
    const width = 600;
    const height = 400;
    const elements: string[] = [];

    const lensX = 300;
    const lensY = 200;

    // Lens
    if (type === 'convex') {
        elements.push(`<path d="M ${lensX - 5} 100 Q ${lensX + 20} 200 ${lensX - 5} 300" fill="none" stroke="#333" stroke-width="3"/>`);
        elements.push(`<path d="M ${lensX + 5} 100 Q ${lensX - 20} 200 ${lensX + 5} 300" fill="none" stroke="#333" stroke-width="3"/>`);
    } else {
        elements.push(`<path d="M ${lensX - 5} 100 Q ${lensX - 20} 200 ${lensX - 5} 300" fill="none" stroke="#333" stroke-width="3"/>`);
        elements.push(`<path d="M ${lensX + 5} 100 Q ${lensX + 20} 200 ${lensX + 5} 300" fill="none" stroke="#333" stroke-width="3"/>`);
    }

    // Principal axis
    elements.push(`<line x1="50" y1="${lensY}" x2="550" y2="${lensY}" stroke="#999" stroke-width="1" stroke-dasharray="5,5"/>`);

    // Object
    elements.push(`<line x1="150" y1="${lensY}" x2="150" y2="${lensY - 60}" stroke="#dc2626" stroke-width="3"/>`);
    elements.push(`<polygon points="150,${lensY - 60} 145,${lensY - 50} 155,${lensY - 50}" fill="#dc2626"/>`);

    // Rays
    elements.push(`<line x1="150" y1="${lensY - 60}" x2="${lensX}" y2="${lensY - 60}" stroke="#2563eb" stroke-width="2"/>`);
    elements.push(`<line x1="${lensX}" y1="${lensY - 60}" x2="500" y2="${lensY + 40}" stroke="#2563eb" stroke-width="2"/>`);

    elements.push(`<text x="300" y="30" font-size="14" text-anchor="middle" fill="#333">${type === 'convex' ? 'Convex' : 'Concave'} Lens Ray Diagram</text>`);

    return createWaveDiagram(id, width, height, elements);
}
