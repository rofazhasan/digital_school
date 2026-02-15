/**
 * Biology Plant Structures Diagram Presets
 * Plant cells, photosynthesis, flower parts, and plant anatomy
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG plant biology diagrams
 */
function createPlantDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * Flower Structure
 */
export function createFlowerStructure(id: string): FBDDiagram {
    return createPlantDiagram(id, 350, 450, [
        // Stem
        `<rect x="165" y="300" width="20" height="120" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="195" y="360" font-size="10">Stem</text>`,
        // Receptacle
        `<ellipse cx="175" cy="290" rx="30" ry="15" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        // Sepals (green)
        `<ellipse cx="175" cy="270" rx="50" ry="20" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="230" y="275" font-size="9">Sepals</text>`,
        // Petals (pink)
        `<ellipse cx="175" cy="200" rx="70" ry="40" fill="#f48fb1" stroke="#333" stroke-width="3"/>`,
        `<ellipse cx="140" cy="220" rx="40" ry="50" fill="#f48fb1" stroke="#333" stroke-width="3"/>`,
        `<ellipse cx="210" cy="220" rx="40" ry="50" fill="#f48fb1" stroke="#333" stroke-width="3"/>`,
        `<ellipse cx="150" cy="180" rx="50" ry="40" fill="#f48fb1" stroke="#333" stroke-width="3"/>`,
        `<ellipse cx="200" cy="180" rx="50" ry="40" fill="#f48fb1" stroke="#333" stroke-width="3"/>`,
        `<text x="250" y="200" font-size="10">Petals</text>`,
        // Stamen (male)
        `<line x1="160" y1="240" x2="160" y2="180" stroke="#fdd835" stroke-width="3"/>`,
        `<circle cx="160" cy="175" r="5" fill="#ff9800"/>`,
        `<line x1="190" y1="240" x2="190" y2="180" stroke="#fdd835" stroke-width="3"/>`,
        `<circle cx="190" cy="175" r="5" fill="#ff9800"/>`,
        `<text x="200" y="160" font-size="9">Stamen</text>`,
        `<text x="200" y="172" font-size="8">(anther)</text>`,
        // Pistil (female - central)
        `<line x1="175" y1="250" x2="175" y2="160" stroke="#66bb6a" stroke-width="5"/>`,
        `<ellipse cx="175" cy="155" rx="8" ry="10" fill="#8bc34a" stroke="#333" stroke-width="1"/>`,
        `<text x="120" y="210" font-size="9">Pistil</text>`,
        `<text x="120" y="222" font-size="8">(stigma,</text>`,
        `<text x="120" y="234" font-size="8">style,</text>`,
        `<text x="120" y="246" font-size="8">ovary)</text>`,
        // Ovary (enlarged)
        `<ellipse cx="175" cy="260" rx="15" ry="20" fill="#c8e6c9" stroke="#333" stroke-width="2"/>`,
        `<text x="195" y="265" font-size="8">Ovary</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Flower Structure</text>`,
        `<text x="175" y="435" font-size="10" text-anchor="middle">Complete flower anatomy</text>`
    ]);
}

/**
 * Leaf Structure
 */
export function createLeafStructure(id: string): FBDDiagram {
    return createPlantDiagram(id, 400, 350, [
        // Leaf blade
        `<ellipse cx="200" cy="175" rx="120" ry="80" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,
        // Midrib
        `<line x1="80" y1="175" x2="320" y2="175" stroke="#66bb6a" stroke-width="4"/>`,
        `<text x="330" y="180" font-size="10">Midrib</text>`,
        // Veins
        `<line x1="200" y1="175" x2="220" y2="120" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="220" y2="230" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="180" y2="120" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="180" y2="230" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="260" y2="140" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="260" y2="210" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="140" y2="140" stroke="#66bb6a" stroke-width="2"/>`,
        `<line x1="200" y1="175" x2="140" y2="210" stroke="#66bb6a" stroke-width="2"/>`,
        `<text x="330" y="140" font-size="9">Veins</text>`,
        // Petiole (leaf stalk)
        `<line x1="80" y1="175" x2="30" y2="200" stroke="#66bb6a" stroke-width="6"/>`,
        `<text x="40" y="220" font-size="10">Petiole</text>`,
        // Cross-section inset
        `<rect x="250" y="250" width="120" height="80" fill="#f5f5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="310" y="268" font-size="9" text-anchor="middle">Cross-section:</text>`,
        `<rect x="260" y="275" width="100" height="8" fill="#8bc34a" stroke="#333" stroke-width="1"/>`,
        `<text x="365" y="281" font-size="7">Upper epidermis</text>`,
        `<rect x="260" y="283" width="100" height="20" fill="#c8e6c9" stroke="#333" stroke-width="1"/>`,
        `<text x="365" y="295" font-size="7">Palisade layer</text>`,
        `<rect x="260" y="303" width="100" height="15" fill="#dcedc8" stroke="#333" stroke-width="1"/>`,
        `<text x="365" y="313" font-size="7">Spongy layer</text>`,
        `<rect x="260" y="318" width="100" height="8" fill="#8bc34a" stroke="#333" stroke-width="1"/>`,
        `<text x="365" y="324" font-size="7">Lower epidermis</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Leaf Structure</text>`
    ]);
}

/**
 * Root System
 */
export function createRootSystem(id: string): FBDDiagram {
    return createPlantDiagram(id, 350, 400, [
        // Soil line
        `<line x1="0" y1="100" x2="350" y2="100" stroke="#8d6e63" stroke-width="3"/>`,
        `<text x="10" y="95" font-size="10">Soil surface</text>`,
        // Taproot
        `<rect x="165" y="100" width="20" height="250" fill="#8d6e63" stroke="#333" stroke-width="3"/>`,
        `<text x="195" y="225" font-size="10">Taproot</text>`,
        // Lateral roots
        `<line x1="165" y1="150" x2="100" y2="180" stroke="#8d6e63" stroke-width="6"/>`,
        `<line x1="185" y1="150" x2="250" y2="180" stroke="#8d6e63" stroke-width="6"/>`,
        `<line x1="165" y1="200" x2="80" y2="240" stroke="#8d6e63" stroke-width="6"/>`,
        `<line x1="185" y1="200" x2="270" y2="240" stroke="#8d6e63" stroke-width="6"/>`,
        `<line x1="165" y1="250" x2="110" y2="290" stroke="#8d6e63" stroke-width="6"/>`,
        `<line x1="185" y1="250" x2="240" y2="290" stroke="#8d6e63" stroke-width="6"/>`,
        `<text x="280" y="220" font-size="9">Lateral roots</text>`,
        // Root hairs
        `<line x1="100" y1="180" x2="85" y2="185" stroke="#a1887f" stroke-width="1"/>`,
        `<line x1="100" y1="180" x2="90" y2="190" stroke="#a1887f" stroke-width="1"/>`,
        `<line x1="80" y1="240" x2="70" y2="245" stroke="#a1887f" stroke-width="1"/>`,
        `<line x1="80" y1="240" x2="75" y2="250" stroke="#a1887f" stroke-width="1"/>`,
        `<text x="60" y="260" font-size="8">Root hairs</text>`,
        // Root cap
        `<ellipse cx="175" cy="355" rx="15" ry="10" fill="#6d4c41" stroke="#333" stroke-width="2"/>`,
        `<text x="195" y="360" font-size="9">Root cap</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Root System</text>`,
        `<text x="175" y="385" font-size="10" text-anchor="middle">Taproot with lateral roots</text>`
    ]);
}

/**
 * Photosynthesis Process
 */
export function createPhotosynthesis(id: string): FBDDiagram {
    return createPlantDiagram(id, 450, 350, [
        // Chloroplast
        `<ellipse cx="225" cy="175" rx="100" ry="60" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,
        `<text x="225" y="185" font-size="12" font-weight="bold" text-anchor="middle">Chloroplast</text>`,
        // Inputs (left)
        `<text x="50" y="120" font-size="12" font-weight="bold">Inputs:</text>`,
        `<text x="50" y="140" font-size="11">6CO₂</text>`,
        `<text x="50" y="160" font-size="11">6H₂O</text>`,
        `<text x="50" y="180" font-size="11">Light</text>`,
        // Arrows to chloroplast
        `<line x1="90" y1="135" x2="120" y2="160" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="90" y1="155" x2="120" y2="170" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="90" y1="175" x2="120" y2="175" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        // Outputs (right)
        `<text x="350" y="120" font-size="12" font-weight="bold">Outputs:</text>`,
        `<text x="350" y="140" font-size="11">C₆H₁₂O₆</text>`,
        `<text x="350" y="160" font-size="11">6O₂</text>`,
        // Arrows from chloroplast
        `<line x1="325" y1="160" x2="345" y2="135" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="325" y1="170" x2="345" y2="155" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        // Equation
        `<text x="225" y="280" font-size="11" text-anchor="middle">6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</text>`,
        // Arrow marker definition
        `<defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#333" />
          </marker>
        </defs>`,
        // Title
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Photosynthesis</text>`,
        `<text x="225" y="320" font-size="10" text-anchor="middle">Light-dependent and light-independent reactions</text>`
    ]);
}

/**
 * Plant Stem Cross-Section
 */
export function createStemCrossSection(id: string): FBDDiagram {
    return createPlantDiagram(id, 400, 400, [
        // Outer circle (epidermis)
        `<circle cx="200" cy="200" r="140" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,
        // Cortex
        `<circle cx="200" cy="200" r="120" fill="#dcedc8" stroke="#333" stroke-width="2"/>`,
        `<text x="90" y="210" font-size="10">Cortex</text>`,
        // Vascular bundles
        `<circle cx="200" cy="120" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="160" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="280" cy="220" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="280" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="320" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="140" cy="280" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="120" cy="220" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<circle cx="140" cy="160" r="20" fill="#8bc34a" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="225" font-size="9">Vascular</text>`,
        `<text x="320" y="237" font-size="9">bundles</text>`,
        // Pith (center)
        `<circle cx="200" cy="200" r="60" fill="#f1f8e9" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="205" font-size="11" font-weight="bold" text-anchor="middle">Pith</text>`,
        // Epidermis label
        `<text x="310" y="100" font-size="10">Epidermis</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Stem Cross-Section</text>`,
        `<text x="200" y="380" font-size="10" text-anchor="middle">Dicot stem</text>`
    ]);
}

/**
 * Seed Structure
 */
export function createSeedStructure(id: string): FBDDiagram {
    return createPlantDiagram(id, 350, 300, [
        // Seed coat
        `<ellipse cx="175" cy="150" rx="100" ry="80" fill="#8d6e63" stroke="#333" stroke-width="3"/>`,
        `<text x="280" y="155" font-size="10">Seed coat</text>`,
        // Embryo
        `<ellipse cx="160" cy="150" rx="70" ry="55" fill="#fff9c4" stroke="#333" stroke-width="2"/>`,
        // Cotyledons
        `<ellipse cx="140" cy="150" rx="40" ry="45" fill="#fdd835" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="155" font-size="9" text-anchor="middle">Cotyledon</text>`,
        // Embryonic axis
        `<line x1="180" y1="120" x2="180" y2="180" stroke="#66bb6a" stroke-width="4"/>`,
        `<text x="195" y="140" font-size="8">Plumule</text>`,
        `<text x="195" y="165" font-size="8">Radicle</text>`,
        // Endosperm
        `<text x="220" y="120" font-size="9">Endosperm</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Seed Structure</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Dicot seed</text>`
    ]);
}

/**
 * Stomata
 */
export function createStomata(id: string): FBDDiagram {
    return createPlantDiagram(id, 350, 300, [
        // Epidermis cells
        `<rect x="50" y="100" width="250" height="40" fill="#c8e6c9" stroke="#333" stroke-width="2"/>`,
        `<rect x="50" y="160" width="250" height="40" fill="#c8e6c9" stroke="#333" stroke-width="2"/>`,
        // Guard cells (kidney-shaped)
        `<ellipse cx="150" cy="140" rx="30" ry="20" fill="#66bb6a" stroke="#333" stroke-width="3"/>`,
        `<ellipse cx="200" cy="140" rx="30" ry="20" fill="#66bb6a" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="145" font-size="9">Guard cell</text>`,
        // Stomatal pore
        `<ellipse cx="175" cy="140" rx="15" ry="8" fill="#fff" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="145" font-size="8" text-anchor="middle">Pore</text>`,
        // Gas exchange arrows
        `<text x="175" y="80" font-size="10" text-anchor="middle">CO₂ ↓</text>`,
        `<text x="175" y="230" font-size="10" text-anchor="middle">O₂ ↑ H₂O ↑</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Stomata</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Gas exchange in leaves</text>`
    ]);
}

/**
 * Xylem and Phloem
 */
export function createXylemPhloem(id: string): FBDDiagram {
    return createPlantDiagram(id, 400, 400, [
        // Xylem (left)
        `<rect x="100" y="100" width="80" height="250" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="140" y="90" font-size="12" font-weight="bold" text-anchor="middle">Xylem</text>`,
        `<text x="140" y="230" font-size="10" text-anchor="middle">Water &</text>`,
        `<text x="140" y="245" font-size="10" text-anchor="middle">minerals</text>`,
        `<text x="140" y="260" font-size="10" text-anchor="middle">↑</text>`,
        `<text x="140" y="370" font-size="9" text-anchor="middle">From roots</text>`,
        `<text x="140" y="120" font-size="9" text-anchor="middle">To leaves</text>`,
        // Phloem (right)
        `<rect x="220" y="100" width="80" height="250" fill="#66bb6a" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="90" font-size="12" font-weight="bold" text-anchor="middle">Phloem</text>`,
        `<text x="260" y="230" font-size="10" text-anchor="middle">Sugars</text>`,
        `<text x="260" y="245" font-size="10" text-anchor="middle">↓</text>`,
        `<text x="260" y="120" font-size="9" text-anchor="middle">From leaves</text>`,
        `<text x="260" y="370" font-size="9" text-anchor="middle">To roots</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Vascular Tissue</text>`,
        `<text x="200" y="390" font-size="10" text-anchor="middle">Transport systems in plants</text>`
    ]);
}

/**
 * Germination Stages
 */
export function createGermination(id: string): FBDDiagram {
    return createPlantDiagram(id, 450, 300, [
        // Stage 1: Seed
        `<ellipse cx="80" cy="200" rx="20" ry="30" fill="#8d6e63" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="250" font-size="9" text-anchor="middle">1. Seed</text>`,
        // Stage 2: Radicle emerges
        `<ellipse cx="180" cy="200" rx="20" ry="30" fill="#8d6e63" stroke="#333" stroke-width="2"/>`,
        `<line x1="180" y1="230" x2="180" y2="260" stroke="#66bb6a" stroke-width="3"/>`,
        `<text x="180" y="280" font-size="9" text-anchor="middle">2. Radicle</text>`,
        // Stage 3: Shoot emerges
        `<ellipse cx="280" cy="210" rx="18" ry="25" fill="#8d6e63" stroke="#333" stroke-width="2"/>`,
        `<line x1="280" y1="235" x2="280" y2="260" stroke="#66bb6a" stroke-width="3"/>`,
        `<line x1="280" y1="185" x2="280" y2="150" stroke="#66bb6a" stroke-width="3"/>`,
        `<circle cx="280" cy="145" r="5" fill="#8bc34a"/>`,
        `<text x="280" y="290" font-size="9" text-anchor="middle">3. Shoot</text>`,
        // Stage 4: Seedling
        `<line x1="380" y1="200" x2="380" y2="260" stroke="#66bb6a" stroke-width="4"/>`,
        `<line x1="380" y1="200" x2="380" y2="120" stroke="#66bb6a" stroke-width="4"/>`,
        `<ellipse cx="370" cy="110" rx="15" ry="10" fill="#8bc34a" stroke="#333" stroke-width="1"/>`,
        `<ellipse cx="390" cy="110" rx="15" ry="10" fill="#8bc34a" stroke="#333" stroke-width="1"/>`,
        `<text x="380" y="290" font-size="9" text-anchor="middle">4. Seedling</text>`,
        // Soil line
        `<line x1="0" y1="200" x2="450" y2="200" stroke="#8d6e63" stroke-width="2" stroke-dasharray="5,5"/>`,
        // Title
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Germination Stages</text>`
    ]);
}

/**
 * Transpiration
 */
export function createTranspiration(id: string): FBDDiagram {
    return createPlantDiagram(id, 350, 450, [
        // Plant outline
        `<rect x="165" y="300" width="20" height="120" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="175" cy="200" rx="60" ry="80" fill="#c8e6c9" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="210" font-size="11" text-anchor="middle">Leaves</text>`,
        // Water vapor leaving leaves
        `<circle cx="130" cy="150" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<circle cx="145" cy="130" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<circle cx="160" cy="110" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<circle cx="220" cy="150" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<circle cx="205" cy="130" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<circle cx="190" cy="110" r="5" fill="#42a5f5" opacity="0.5"/>`,
        `<text x="250" y="130" font-size="10">H₂O vapor</text>`,
        // Xylem (water transport)
        `<rect x="170" y="300" width="10" height="120" fill="#42a5f5" stroke="#333" stroke-width="1"/>`,
        `<text x="190" y="360" font-size="9">Xylem</text>`,
        `<text x="190" y="340" font-size="12">↑</text>`,
        // Roots
        `<line x1="175" y1="420" x2="140" y2="440" stroke="#8d6e63" stroke-width="4"/>`,
        `<line x1="175" y1="420" x2="210" y2="440" stroke="#8d6e63" stroke-width="4"/>`,
        `<text x="175" y="435" font-size="9" text-anchor="middle">Roots</text>`,
        // Water uptake
        `<circle cx="120" cy="440" r="8" fill="#42a5f5"/>`,
        `<circle cx="230" cy="440" r="8" fill="#42a5f5"/>`,
        `<text x="100" y="435" font-size="9">H₂O</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Transpiration</text>`,
        `<text x="175" y="435" font-size="10" text-anchor="middle">Water movement through plant</text>`
    ]);
}
