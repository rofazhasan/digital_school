/**
 * Chemistry Inorganic Structures Diagram Presets
 * Crystal structures, coordination compounds, and inorganic molecules
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG inorganic chemistry diagrams
 */
function createInorganicDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * NaCl Crystal Structure (Face-Centered Cubic)
 */
export function createNaClCrystal(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 350, [
        // Cube edges
        `<line x1="100" y1="100" x2="250" y2="100" stroke="#333" stroke-width="2"/>`,
        `<line x1="100" y1="100" x2="100" y2="250" stroke="#333" stroke-width="2"/>`,
        `<line x1="250" y1="100" x2="250" y2="250" stroke="#333" stroke-width="2"/>`,
        `<line x1="100" y1="250" x2="250" y2="250" stroke="#333" stroke-width="2"/>`,
        // Back edges (dashed)
        `<line x1="150" y1="50" x2="300" y2="50" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="150" y1="50" x2="150" y2="200" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="300" y1="50" x2="300" y2="200" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="150" y1="200" x2="300" y2="200" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Connecting edges
        `<line x1="100" y1="100" x2="150" y2="50" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="250" y1="100" x2="300" y2="50" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="100" y1="250" x2="150" y2="200" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        `<line x1="250" y1="250" x2="300" y2="200" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Na+ ions (purple)
        `<circle cx="100" cy="100" r="15" fill="#9c27b0" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="105" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Na⁺</text>`,
        `<circle cx="250" cy="100" r="15" fill="#9c27b0" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="105" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Na⁺</text>`,
        `<circle cx="100" cy="250" r="15" fill="#9c27b0" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="255" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Na⁺</text>`,
        `<circle cx="250" cy="250" r="15" fill="#9c27b0" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="255" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Na⁺</text>`,
        // Cl- ions (green)
        `<circle cx="175" cy="100" r="15" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="105" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Cl⁻</text>`,
        `<circle cx="100" cy="175" r="15" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Cl⁻</text>`,
        `<circle cx="175" cy="175" r="15" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Cl⁻</text>`,
        `<circle cx="250" cy="175" r="15" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Cl⁻</text>`,
        `<circle cx="175" cy="250" r="15" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="255" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Cl⁻</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">NaCl Crystal Structure</text>`,
        `<text x="175" y="320" font-size="10" text-anchor="middle">Face-Centered Cubic (FCC)</text>`
    ]);
}

/**
 * Diamond Crystal Structure
 */
export function createDiamondStructure(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 350, [
        // Tetrahedral arrangement
        `<circle cx="175" cy="175" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="180" font-size="11" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Bonds to 4 neighbors
        `<line x1="175" y1="160" x2="175" y2="100" stroke="#333" stroke-width="3"/>`,
        `<circle cx="175" cy="90" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="95" font-size="10" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="175" y1="190" x2="175" y2="250" stroke="#333" stroke-width="3"/>`,
        `<circle cx="175" cy="260" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="265" font-size="10" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="160" y1="175" x2="100" y2="175" stroke="#333" stroke-width="3"/>`,
        `<circle cx="90" cy="175" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="90" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="190" y1="175" x2="250" y2="175" stroke="#333" stroke-width="3"/>`,
        `<circle cx="260" cy="175" r="12" fill="#333" stroke-width="2"/>`,
        `<text x="260" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Diamond Structure</text>`,
        `<text x="175" y="320" font-size="10" text-anchor="middle">Tetrahedral sp³ bonding</text>`
    ]);
}

/**
 * Graphite Structure
 */
export function createGraphiteStructure(id: string): FBDDiagram {
    return createInorganicDiagram(id, 400, 350, [
        // Hexagonal layers
        // Layer 1
        `<polygon points="100,100 150,75 200,100 200,150 150,175 100,150" fill="none" stroke="#333" stroke-width="3"/>`,
        `<polygon points="200,100 250,75 300,100 300,150 250,175 200,150" fill="none" stroke="#333" stroke-width="3"/>`,
        // Carbon atoms
        `<circle cx="100" cy="100" r="10" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="75" r="10" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="100" r="10" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="75" r="10" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<circle cx="300" cy="100" r="10" fill="#333" stroke="#333" stroke-width="2"/>`,
        // Layer 2 (offset, dashed)
        `<polygon points="100,220 150,195 200,220 200,270 150,295 100,270" fill="none" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<polygon points="200,220 250,195 300,220 300,270 250,295 200,270" fill="none" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>`,
        // Interlayer spacing
        `<line x1="150" y1="175" x2="150" y2="195" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>`,
        `<text x="320" y="210" font-size="10">Weak van der Waals</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Graphite Structure</text>`,
        `<text x="200" y="330" font-size="10" text-anchor="middle">Layered hexagonal sp² bonding</text>`
    ]);
}

/**
 * Coordination Complex - Octahedral
 */
export function createOctahedralComplex(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 350, [
        // Central metal ion
        `<circle cx="175" cy="175" r="20" fill="#ff9800" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="182" font-size="12" font-weight="bold" text-anchor="middle" fill="white">M</text>`,
        // 6 ligands (octahedral)
        // Top
        `<line x1="175" y1="155" x2="175" y2="80" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="70" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="75" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Bottom
        `<line x1="175" y1="195" x2="175" y2="270" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="280" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="285" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Left
        `<line x1="155" y1="175" x2="80" y2="175" stroke="#333" stroke-width="2"/>`,
        `<circle cx="70" cy="175" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="70" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Right
        `<line x1="195" y1="175" x2="270" y2="175" stroke="#333" stroke-width="2"/>`,
        `<circle cx="280" cy="175" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="280" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Front (perspective)
        `<line x1="185" y1="185" x2="230" y2="230" stroke="#333" stroke-width="2"/>`,
        `<circle cx="240" cy="240" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="240" y="245" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Back (perspective, dashed)
        `<line x1="165" y1="165" x2="120" y2="120" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<circle cx="110" cy="110" r="12" fill="#90caf9" stroke="#666" stroke-width="2"/>`,
        `<text x="110" y="115" font-size="10" font-weight="bold" text-anchor="middle">L</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Octahedral Complex</text>`,
        `<text x="175" y="330" font-size="10" text-anchor="middle">[ML₆]ⁿ⁺ (Coordination number = 6)</text>`
    ]);
}

/**
 * Tetrahedral Complex
 */
export function createTetrahedralComplex(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 350, [
        // Central metal
        `<circle cx="175" cy="175" r="20" fill="#ff9800" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="182" font-size="12" font-weight="bold" text-anchor="middle" fill="white">M</text>`,
        // 4 ligands (tetrahedral)
        `<line x1="175" y1="155" x2="175" y2="90" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="80" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="85" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        `<line x1="165" y1="190" x2="110" y2="250" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="260" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="265" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        `<line x1="185" y1="190" x2="240" y2="250" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="260" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="265" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        `<line x1="195" y1="175" x2="260" y2="175" stroke="#333" stroke-width="2"/>`,
        `<circle cx="270" cy="175" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="270" y="180" font-size="10" font-weight="bold" text-anchor="middle" fill="white">L</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Tetrahedral Complex</text>`,
        `<text x="175" y="320" font-size="10" text-anchor="middle">[ML₄]ⁿ⁺ (Coordination number = 4)</text>`
    ]);
}

/**
 * Ammonia (NH3)
 */
export function createAmmonia(id: string): FBDDiagram {
    return createInorganicDiagram(id, 300, 300, [
        // Nitrogen (central)
        `<circle cx="150" cy="150" r="18" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="150" y="157" font-size="13" font-weight="bold" text-anchor="middle" fill="white">N</text>`,
        // 3 Hydrogens (trigonal pyramidal)
        `<line x1="150" y1="132" x2="150" y2="80" stroke="#333" stroke-width="3"/>`,
        `<circle cx="150" cy="70" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="75" font-size="11" text-anchor="middle">H</text>`,
        `<line x1="135" y1="160" x2="90" y2="210" stroke="#333" stroke-width="3"/>`,
        `<circle cx="80" cy="220" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="225" font-size="11" text-anchor="middle">H</text>`,
        `<line x1="165" y1="160" x2="210" y2="210" stroke="#333" stroke-width="3"/>`,
        `<circle cx="220" cy="220" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="220" y="225" font-size="11" text-anchor="middle">H</text>`,
        // Lone pair
        `<circle cx="150" cy="185" r="4" fill="#333"/>`,
        `<circle cx="160" cy="185" r="4" fill="#333"/>`,
        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">Ammonia (NH₃)</text>`,
        `<text x="150" y="270" font-size="10" text-anchor="middle">Trigonal pyramidal</text>`
    ]);
}

/**
 * Sulfuric Acid (H2SO4)
 */
export function createSulfuricAcid(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 300, [
        // Sulfur (central)
        `<circle cx="175" cy="150" r="18" fill="#fdd835" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="157" font-size="13" font-weight="bold" text-anchor="middle">S</text>`,
        // Double bonded oxygens (top and bottom)
        `<line x1="175" y1="132" x2="175" y2="90" stroke="#333" stroke-width="2"/>`,
        `<line x1="178" y1="132" x2="178" y2="90" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="80" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="175" y1="168" x2="175" y2="210" stroke="#333" stroke-width="2"/>`,
        `<line x1="178" y1="168" x2="178" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // OH groups (left and right)
        `<line x1="157" y1="150" x2="110" y2="150" stroke="#333" stroke-width="2"/>`,
        `<circle cx="95" cy="150" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="95" y="155" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<line x1="193" y1="150" x2="240" y2="150" stroke="#333" stroke-width="2"/>`,
        `<circle cx="255" cy="150" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="255" y="155" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Sulfuric Acid (H₂SO₄)</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Strong diprotic acid</text>`
    ]);
}

/**
 * Phosphoric Acid (H3PO4)
 */
export function createPhosphoricAcid(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 320, [
        // Phosphorus (central)
        `<circle cx="175" cy="160" r="18" fill="#ff9800" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="167" font-size="13" font-weight="bold" text-anchor="middle" fill="white">P</text>`,
        // Double bonded oxygen (top)
        `<line x1="175" y1="142" x2="175" y2="90" stroke="#333" stroke-width="2"/>`,
        `<line x1="178" y1="142" x2="178" y2="90" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="80" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // Three OH groups
        `<line x1="160" y1="172" x2="120" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="110" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="110" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<line x1="190" y1="172" x2="230" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="240" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="240" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<line x1="175" y1="178" x2="175" y2="240" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="250" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="255" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Phosphoric Acid (H₃PO₄)</text>`,
        `<text x="175" y="300" font-size="10" text-anchor="middle">Triprotic acid</text>`
    ]);
}

/**
 * Carbonate Ion (CO3^2-)
 */
export function createCarbonateIon(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 300, [
        // Carbon (central)
        `<circle cx="175" cy="150" r="15" fill="#333" stroke="#333" stroke-width="3"/>`,
        `<text x="175" cy="156" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Three oxygens (trigonal planar, 120° apart)
        `<line x1="175" y1="135" x2="175" y2="80" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="70" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="75" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="162" y1="160" x2="110" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="188" y1="160" x2="240" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // Charge
        `<text x="290" y="150" font-size="16" font-weight="bold">2−</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Carbonate Ion (CO₃²⁻)</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Trigonal planar, resonance</text>`
    ]);
}

/**
 * Nitrate Ion (NO3^-)
 */
export function createNitrateIon(id: string): FBDDiagram {
    return createInorganicDiagram(id, 350, 300, [
        // Nitrogen (central)
        `<circle cx="175" cy="150" r="15" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="156" font-size="12" font-weight="bold" text-anchor="middle" fill="white">N</text>`,
        // Three oxygens
        `<line x1="175" y1="135" x2="175" y2="80" stroke="#333" stroke-width="2"/>`,
        `<circle cx="175" cy="70" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="75" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="162" y1="160" x2="110" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="100" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="188" y1="160" x2="240" y2="210" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="220" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // Charge
        `<text x="290" y="150" font-size="16" font-weight="bold">−</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Nitrate Ion (NO₃⁻)</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Trigonal planar</text>`
    ]);
}

/**
 * Ammonium Ion (NH4^+)
 */
export function createAmmoniumIon(id: string): FBDDiagram {
    return createInorganicDiagram(id, 300, 320, [
        // Nitrogen (central)
        `<circle cx="150" cy="160" r="18" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="150" y="167" font-size="13" font-weight="bold" text-anchor="middle" fill="white">N</text>`,
        // 4 Hydrogens (tetrahedral)
        `<line x1="150" y1="142" x2="150" y2="90" stroke="#333" stroke-width="3"/>`,
        `<circle cx="150" cy="80" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="85" font-size="11" text-anchor="middle">H</text>`,
        `<line x1="135" y1="172" x2="90" y2="220" stroke="#333" stroke-width="3"/>`,
        `<circle cx="80" cy="230" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="235" font-size="11" text-anchor="middle">H</text>`,
        `<line x1="165" y1="172" x2="210" y2="220" stroke="#333" stroke-width="3"/>`,
        `<circle cx="220" cy="230" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="220" y="235" font-size="11" text-anchor="middle">H</text>`,
        `<line x1="168" y1="160" x2="220" y2="160" stroke="#333" stroke-width="3"/>`,
        `<circle cx="230" cy="160" r="12" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="230" y="165" font-size="11" text-anchor="middle">H</text>`,
        // Charge
        `<text x="260" y="160" font-size="16" font-weight="bold">+</text>`,
        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">Ammonium Ion (NH₄⁺)</text>`,
        `<text x="150" y="290" font-size="10" text-anchor="middle">Tetrahedral</text>`
    ]);
}
