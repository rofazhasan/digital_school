/**
 * Biology Cell & Molecular Diagram Presets
 * Cell structures, organelles, molecular biology, and anatomy
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG biology diagrams
 */
function createBiologyDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * Plant Cell
 */
export function createPlantCell(id: string): FBDDiagram {
    return createBiologyDiagram(id, 400, 400, [
        // Cell wall (outer)
        `<rect x="50" y="50" width="300" height="300" fill="#c8e6c9" stroke="#2e7d32" stroke-width="4" rx="10"/>`,
        // Cell membrane (inner)
        `<rect x="70" y="70" width="260" height="260" fill="#e8f5e9" stroke="#388e3c" stroke-width="2" rx="8"/>`,
        // Nucleus
        `<circle cx="200" cy="200" r="50" fill="#b39ddb" stroke="#512da8" stroke-width="2"/>`,
        `<circle cx="200" cy="200" r="15" fill="#7e57c2"/>`,
        `<text x="200" y="270" font-size="11" text-anchor="middle">Nucleus</text>`,
        // Chloroplasts
        `<ellipse cx="120" cy="120" rx="25" ry="15" fill="#66bb6a" stroke="#2e7d32" stroke-width="2"/>`,
        `<ellipse cx="280" cy="120" rx="25" ry="15" fill="#66bb6a" stroke="#2e7d32" stroke-width="2"/>`,
        `<ellipse cx="120" cy="280" rx="25" ry="15" fill="#66bb6a" stroke="#2e7d32" stroke-width="2"/>`,
        `<text x="120" y="110" font-size="9" text-anchor="middle">Chloroplast</text>`,
        // Vacuole (large)
        `<circle cx="280" cy="250" r="40" fill="#b3e5fc" stroke="#0288d1" stroke-width="2"/>`,
        `<text x="280" y="305" font-size="10" text-anchor="middle">Vacuole</text>`,
        // Mitochondria
        `<ellipse cx="150" cy="150" rx="20" ry="12" fill="#ffab91" stroke="#d84315" stroke-width="1"/>`,
        `<text x="150" y="140" font-size="8" text-anchor="middle">Mitochondria</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Plant Cell</text>`,
        `<text x="200" y="380" font-size="10" text-anchor="middle">Eukaryotic cell with cell wall</text>`
    ]);
}

/**
 * Animal Cell
 */
export function createAnimalCell(id: string): FBDDiagram {
    return createBiologyDiagram(id, 400, 400, [
        // Cell membrane (irregular shape)
        `<ellipse cx="200" cy="200" rx="150" ry="140" fill="#ffe0b2" stroke="#e65100" stroke-width="3"/>`,
        // Nucleus
        `<circle cx="200" cy="200" r="50" fill="#b39ddb" stroke="#512da8" stroke-width="2"/>`,
        `<circle cx="200" cy="200" r="15" fill="#7e57c2"/>`,
        `<text x="200" y="270" font-size="11" text-anchor="middle">Nucleus</text>`,
        // Mitochondria
        `<ellipse cx="120" cy="150" rx="25" ry="15" fill="#ffab91" stroke="#d84315" stroke-width="2"/>`,
        `<ellipse cx="280" cy="180" rx="25" ry="15" fill="#ffab91" stroke="#d84315" stroke-width="2"/>`,
        `<text x="120" y="140" font-size="9" text-anchor="middle">Mitochondria</text>`,
        // Golgi apparatus
        `<g transform="translate(250, 250)">
          <path d="M 0 0 Q 10 -5, 20 0 Q 10 5, 0 0" fill="none" stroke="#8d6e63" stroke-width="2"/>
          <path d="M 0 8 Q 10 3, 20 8 Q 10 13, 0 8" fill="none" stroke="#8d6e63" stroke-width="2"/>
          <path d="M 0 16 Q 10 11, 20 16 Q 10 21, 0 16" fill="none" stroke="#8d6e63" stroke-width="2"/>
        </g>`,
        `<text x="260" y="285" font-size="9" text-anchor="middle">Golgi</text>`,
        // Ribosomes (small dots)
        `<circle cx="150" cy="250" r="3" fill="#424242"/>`,
        `<circle cx="160" cy="260" r="3" fill="#424242"/>`,
        `<circle cx="240" cy="150" r="3" fill="#424242"/>`,
        `<text x="150" y="275" font-size="8">Ribosomes</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Animal Cell</text>`,
        `<text x="200" y="380" font-size="10" text-anchor="middle">Eukaryotic cell without cell wall</text>`
    ]);
}

/**
 * Mitochondria
 */
export function createMitochondria(id: string): FBDDiagram {
    return createBiologyDiagram(id, 350, 200, [
        // Outer membrane
        `<ellipse cx="175" cy="100" rx="140" ry="70" fill="#ffccbc" stroke="#d84315" stroke-width="3"/>`,
        // Inner membrane (cristae)
        `<path d="M 60 100 Q 80 80, 100 100 T 140 100 T 180 100 T 220 100 T 260 100 T 290 100" 
               fill="none" stroke="#bf360c" stroke-width="2"/>`,
        `<path d="M 60 100 Q 80 120, 100 100 T 140 100 T 180 100 T 220 100 T 260 100 T 290 100" 
               fill="none" stroke="#bf360c" stroke-width="2"/>`,
        // Matrix
        `<text x="175" y="105" font-size="12" text-anchor="middle">Matrix</text>`,
        // Labels
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Mitochondrion</text>`,
        `<text x="50" y="70" font-size="10">Outer membrane</text>`,
        `<text x="50" y="130" font-size="10">Inner membrane (cristae)</text>`,
        `<text x="175" y="180" font-size="10" text-anchor="middle">Powerhouse of the cell - ATP production</text>`
    ]);
}

/**
 * Chloroplast
 */
export function createChloroplast(id: string): FBDDiagram {
    return createBiologyDiagram(id, 350, 250, [
        // Outer membrane
        `<ellipse cx="175" cy="125" rx="140" ry="90" fill="#c8e6c9" stroke="#2e7d32" stroke-width="3"/>`,
        // Thylakoids (stacked)
        `<g transform="translate(100, 80)">
          <ellipse cx="0" cy="0" rx="30" ry="8" fill="#66bb6a" stroke="#1b5e20" stroke-width="1"/>
          <ellipse cx="0" cy="10" rx="30" ry="8" fill="#66bb6a" stroke="#1b5e20" stroke-width="1"/>
          <ellipse cx="0" cy="20" rx="30" ry="8" fill="#66bb6a" stroke="#1b5e20" stroke-width="1"/>
        </g>`,
        `<g transform="translate(200, 100)">
          <ellipse cx="0" cy="0" rx="30" ry="8" fill="#66bb6a" stroke="#1b5e20" stroke-width="1"/>
          <ellipse cx="0" cy="10" rx="30" ry="8" fill="#66bb6a" stroke="#1b5e20" stroke-width="1"/>
        </g>`,
        // Labels
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Chloroplast</text>`,
        `<text x="100" y="75" font-size="9" text-anchor="middle">Grana</text>`,
        `<text x="175" y="160" font-size="10" text-anchor="middle">Stroma</text>`,
        `<text x="175" y="230" font-size="10" text-anchor="middle">Site of photosynthesis</text>`
    ]);
}

/**
 * DNA Double Helix
 */
export function createDNA(id: string): FBDDiagram {
    const elements: string[] = [
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">DNA Double Helix</text>`
    ];

    // Create helix structure
    for (let i = 0; i < 15; i++) {
        const y = 60 + i * 20;
        const offset = Math.sin(i * 0.8) * 40;

        // Left strand
        elements.push(`<circle cx="${150 + offset}" cy="${y}" r="8" fill="#1976d2" stroke="#0d47a1" stroke-width="2"/>`);
        // Right strand
        elements.push(`<circle cx="${250 - offset}" cy="${y}" r="8" fill="#d32f2f" stroke="#b71c1c" stroke-width="2"/>`);
        // Base pairs
        elements.push(`<line x1="${150 + offset}" y1="${y}" x2="${250 - offset}" y2="${y}" stroke="#757575" stroke-width="2"/>`);
    }

    elements.push(`<text x="200" y="360" font-size="10" text-anchor="middle">Deoxyribonucleic Acid</text>`);
    elements.push(`<text x="120" y="200" font-size="9" fill="#1976d2">Sugar-phosphate backbone</text>`);

    return createBiologyDiagram(id, 400, 380, elements);
}

/**
 * DNA Replication
 */
export function createDNAReplication(id: string): FBDDiagram {
    return createBiologyDiagram(id, 500, 400, [
        // Original DNA (top)
        `<line x1="100" y1="80" x2="400" y2="80" stroke="#1976d2" stroke-width="4"/>`,
        `<line x1="100" y1="100" x2="400" y2="100" stroke="#d32f2f" stroke-width="4"/>`,
        `<text x="250" y="70" font-size="11" text-anchor="middle">Original DNA</text>`,

        // Replication fork
        `<path d="M 250 100 L 250 150" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="125" font-size="10">Helicase</text>`,

        // Leading strand
        `<line x1="100" y1="200" x2="250" y2="200" stroke="#1976d2" stroke-width="4"/>`,
        `<line x1="100" y1="220" x2="250" y2="220" stroke="#4caf50" stroke-width="4"/>`,
        `<text x="175" y="190" font-size="10" text-anchor="middle">Leading strand</text>`,

        // Lagging strand
        `<line x1="250" y1="280" x2="400" y2="280" stroke="#d32f2f" stroke-width="4"/>`,
        `<line x1="250" y1="300" x2="400" y2="300" stroke="#4caf50" stroke-width="4"/>`,
        `<text x="325" y="270" font-size="10" text-anchor="middle">Lagging strand</text>`,
        `<text x="325" y="320" font-size="9" text-anchor="middle">Okazaki fragments</text>`,

        // DNA polymerase
        `<circle cx="200" cy="210" r="15" fill="#ff9800" stroke="#e65100" stroke-width="2"/>`,
        `<text x="200" y="215" font-size="8" text-anchor="middle">Pol</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">DNA Replication</text>`,
        `<text x="250" y="370" font-size="10" text-anchor="middle">Semiconservative replication</text>`
    ]);
}

/**
 * Transcription (DNA to RNA)
 */
export function createTranscription(id: string): FBDDiagram {
    return createBiologyDiagram(id, 450, 350, [
        // DNA template
        `<line x1="80" y1="100" x2="370" y2="100" stroke="#1976d2" stroke-width="4"/>`,
        `<line x1="80" y1="120" x2="370" y2="120" stroke="#d32f2f" stroke-width="4"/>`,
        `<text x="225" y="90" font-size="11" text-anchor="middle">DNA Template</text>`,

        // RNA polymerase
        `<circle cx="225" cy="110" r="30" fill="#ff9800" stroke="#e65100" stroke-width="3"/>`,
        `<text x="225" y="115" font-size="10" font-weight="bold" text-anchor="middle">RNA Pol</text>`,

        // mRNA being synthesized
        `<path d="M 260 110 Q 300 140, 340 170" fill="none" stroke="#4caf50" stroke-width="4"/>`,
        `<text x="300" y="190" font-size="11" fill="#4caf50">mRNA</text>`,

        // Direction arrow
        `<line x1="150" y1="150" x2="300" y2="150" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="225" y="145" font-size="9">Direction</text>`,

        // Title
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Transcription</text>`,
        `<text x="225" y="320" font-size="10" text-anchor="middle">DNA → RNA (mRNA synthesis)</text>`
    ]);
}

/**
 * Translation (RNA to Protein)
 */
export function createTranslation(id: string): FBDDiagram {
    return createBiologyDiagram(id, 500, 400, [
        // Ribosome (large and small subunits)
        `<ellipse cx="250" cy="150" rx="80" ry="50" fill="#b39ddb" stroke="#512da8" stroke-width="3" opacity="0.7"/>`,
        `<ellipse cx="250" cy="200" rx="90" ry="40" fill="#9575cd" stroke="#512da8" stroke-width="3" opacity="0.7"/>`,
        `<text x="250" y="160" font-size="11" font-weight="bold" text-anchor="middle">Ribosome</text>`,

        // mRNA
        `<line x1="100" y1="180" x2="400" y2="180" stroke="#4caf50" stroke-width="4"/>`,
        `<text x="250" y="170" font-size="10" text-anchor="middle">mRNA</text>`,

        // tRNA with amino acid
        `<path d="M 220 120 L 220 150 M 215 140 L 225 140" stroke="#ff9800" stroke-width="3"/>`,
        `<circle cx="220" cy="110" r="10" fill="#ffab91" stroke="#d84315" stroke-width="2"/>`,
        `<text x="220" y="100" font-size="8" text-anchor="middle">AA</text>`,
        `<text x="200" y="130" font-size="9">tRNA</text>`,

        // Growing protein chain
        `<path d="M 280 150 Q 320 140, 360 130 Q 380 120, 400 110" fill="none" stroke="#e91e63" stroke-width="4"/>`,
        `<text x="350" y="100" font-size="10" fill="#e91e63">Protein</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Translation</text>`,
        `<text x="250" y="370" font-size="10" text-anchor="middle">mRNA → Protein (Protein synthesis)</text>`
    ]);
}

/**
 * Neuron (Nerve Cell)
 */
export function createNeuron(id: string): FBDDiagram {
    return createBiologyDiagram(id, 550, 300, [
        // Dendrites
        `<path d="M 80 100 Q 100 80, 120 100" fill="none" stroke="#333" stroke-width="2"/>`,
        `<path d="M 80 150 Q 100 170, 120 150" fill="none" stroke="#333" stroke-width="2"/>`,
        `<path d="M 90 125 Q 110 125, 120 125" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="70" y="125" font-size="10">Dendrites</text>`,

        // Cell body (soma)
        `<circle cx="150" cy="125" r="35" fill="#ffccbc" stroke="#d84315" stroke-width="3"/>`,
        `<circle cx="150" cy="125" r="15" fill="#b39ddb" stroke="#512da8" stroke-width="2"/>`,
        `<text x="150" y="180" font-size="10" text-anchor="middle">Cell body</text>`,

        // Axon
        `<line x1="185" y1="125" x2="450" y2="125" stroke="#333" stroke-width="4"/>`,
        `<text x="300" y="115" font-size="10" text-anchor="middle">Axon</text>`,

        // Myelin sheath
        `<rect x="220" y="115" width="40" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="2" rx="5"/>`,
        `<rect x="280" y="115" width="40" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="2" rx="5"/>`,
        `<rect x="340" y="115" width="40" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="2" rx="5"/>`,
        `<text x="300" y="155" font-size="9" text-anchor="middle">Myelin sheath</text>`,

        // Axon terminals
        `<circle cx="470" cy="110" r="8" fill="#1976d2" stroke="#0d47a1" stroke-width="2"/>`,
        `<circle cx="480" cy="125" r="8" fill="#1976d2" stroke="#0d47a1" stroke-width="2"/>`,
        `<circle cx="470" cy="140" r="8" fill="#1976d2" stroke="#0d47a1" stroke-width="2"/>`,
        `<text x="500" y="125" font-size="10">Axon terminals</text>`,

        // Title
        `<text x="275" y="30" font-size="14" font-weight="bold" text-anchor="middle">Neuron (Nerve Cell)</text>`,
        `<text x="275" y="280" font-size="10" text-anchor="middle">Transmits electrical signals</text>`
    ]);
}

/**
 * Heart (Simple Diagram)
 */
export function createHeart(id: string): FBDDiagram {
    return createBiologyDiagram(id, 400, 450, [
        // Heart outline (simplified)
        `<path d="M 200 350 Q 120 280, 120 200 Q 120 140, 160 120 Q 200 100, 200 150 Q 200 100, 240 120 Q 280 140, 280 200 Q 280 280, 200 350 Z" 
               fill="#ffcdd2" stroke="#c62828" stroke-width="4"/>`,

        // Chambers
        `<text x="160" y="180" font-size="11" font-weight="bold">RA</text>`,
        `<text x="240" y="180" font-size="11" font-weight="bold">LA</text>`,
        `<text x="160" y="280" font-size="11" font-weight="bold">RV</text>`,
        `<text x="240" y="280" font-size="11" font-weight="bold">LV</text>`,

        // Valves (simplified)
        `<line x1="160" y1="220" x2="160" y2="240" stroke="#333" stroke-width="3"/>`,
        `<line x1="240" y1="220" x2="240" y2="240" stroke="#333" stroke-width="3"/>`,

        // Blood vessels
        `<rect x="185" y="80" width="30" height="40" fill="#1976d2" stroke="#0d47a1" stroke-width="2"/>`,
        `<text x="200" y="75" font-size="9" text-anchor="middle">Aorta</text>`,

        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Human Heart</text>`,
        `<text x="200" y="400" font-size="10" text-anchor="middle">RA: Right Atrium, LA: Left Atrium</text>`,
        `<text x="200" y="420" font-size="10" text-anchor="middle">RV: Right Ventricle, LV: Left Ventricle</text>`
    ]);
}
