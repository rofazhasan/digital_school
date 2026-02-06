/**
 * Chemistry Advanced Organic & Biochemistry Diagram Presets
 * Amino acids, sugars, polymers, and complex organic structures
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG organic chemistry diagrams
 */
function createAdvancedOrganicDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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

// AMINO ACIDS
export function createGlycine(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 350, 200, [
        // Amino group (NH2)
        `<circle cx="80" cy="100" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="105" font-size="11" font-weight="bold" text-anchor="middle" fill="white">NH₂</text>`,
        // Bond to carbon
        `<line x1="92" y1="100" x2="130" y2="100" stroke="#333" stroke-width="2"/>`,
        // Central carbon
        `<circle cx="150" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // H attached to central carbon
        `<line x1="150" y1="85" x2="150" y2="60" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="50" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="150" y="54" font-size="10" text-anchor="middle">H</text>`,
        // R group (H for glycine)
        `<line x1="150" y1="115" x2="150" y2="140" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="150" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="150" y="154" font-size="10" text-anchor="middle">H</text>`,
        `<text x="150" y="175" font-size="9" fill="#666">R = H</text>`,
        // Carboxyl group (COOH)
        `<line x1="165" y1="100" x2="210" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="230" cy="100" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="230" y="105" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        // Double bond O
        `<line x1="245" y1="95" x2="270" y2="80" stroke="#333" stroke-width="2"/>`,
        `<line x1="245" y1="105" x2="270" y2="90" stroke="#333" stroke-width="2"/>`,
        `<circle cx="280" cy="75" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="280" y="80" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // Single bond OH
        `<line x1="245" y1="100" x2="270" y2="120" stroke="#333" stroke-width="2"/>`,
        `<circle cx="285" cy="130" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="285" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Glycine (Gly)</text>`,
        `<text x="175" y="190" font-size="10" text-anchor="middle">Simplest amino acid</text>`
    ]);
}

export function createAlanine(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 350, 220, [
        // Similar structure to glycine but R = CH3
        `<circle cx="80" cy="110" r="12" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="115" font-size="11" font-weight="bold" text-anchor="middle" fill="white">NH₂</text>`,
        `<line x1="92" y1="110" x2="130" y2="110" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="110" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="115" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="150" y1="95" x2="150" y2="70" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="60" r="8" fill="#e3f2fd" stroke="#333" stroke-width="1"/>`,
        `<text x="150" y="64" font-size="10" text-anchor="middle">H</text>`,
        // R group (CH3 for alanine)
        `<line x1="150" y1="125" x2="150" y2="155" stroke="#333" stroke-width="2"/>`,
        `<circle cx="150" cy="170" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="175" font-size="11" font-weight="bold" text-anchor="middle" fill="white">CH₃</text>`,
        `<text x="150" y="195" font-size="9" fill="#666">R = CH₃</text>`,
        // Carboxyl
        `<line x1="165" y1="110" x2="210" y2="110" stroke="#333" stroke-width="2"/>`,
        `<circle cx="230" cy="110" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="230" y="115" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="245" y1="105" x2="270" y2="90" stroke="#333" stroke-width="2"/>`,
        `<line x1="245" y1="115" x2="270" y2="100" stroke="#333" stroke-width="2"/>`,
        `<circle cx="280" cy="85" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="280" y="90" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<line x1="245" y1="110" x2="270" y2="130" stroke="#333" stroke-width="2"/>`,
        `<circle cx="285" cy="140" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="285" y="145" font-size="11" font-weight="bold" text-anchor="middle" fill="white">OH</text>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Alanine (Ala)</text>`
    ]);
}

// SUGARS
export function createGlucoseRing(id: string): FBDDiagram {
    const cx = 200, cy = 150;
    const r = 60;
    // Hexagon for glucose ring
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Ring
        `<polygon points="${points.join(' ')}" fill="none" stroke="#333" stroke-width="3"/>`,
        // Oxygen in ring (top right)
        `<circle cx="${cx + r * Math.cos(30 * Math.PI / 180)}" cy="${cy + r * Math.sin(30 * Math.PI / 180)}" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="${cx + r * Math.cos(30 * Math.PI / 180)}" y="${cy + r * Math.sin(30 * Math.PI / 180) + 5}" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        // OH groups
        `<text x="${cx - 80}" y="${cy + 10}" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="${cx + 80}" y="${cy - 40}" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="${cx + 50}" y="${cy + 80}" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="${cx - 50}" y="${cy + 80}" font-size="11" fill="#ff5252">OH</text>`,
        // CH2OH group
        `<text x="${cx}" y="${cy - 90}" font-size="11">CH₂OH</text>`,
        `<text x="${cx}" y="30" font-size="14" font-weight="bold" text-anchor="middle">α-D-Glucose</text>`,
        `<text x="${cx}" y="320" font-size="10" text-anchor="middle">C₆H₁₂O₆ (Ring form)</text>`
    ]);
}

export function createFructose(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Pentagon for fructose ring
        `<circle cx="200" cy="150" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="230" cy="130" r="12" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="230" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="white">O</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">β-D-Fructose</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₆H₁₂O₆ (Ketose)</text>`
    ]);
}

// POLYMERS
export function createPolyethylene(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 450, 200, [
        // Repeating unit
        `<text x="50" y="100" font-size="16">...</text>`,
        `<line x1="70" y1="95" x2="100" y2="95" stroke="#333" stroke-width="2"/>`,
        `<circle cx="120" cy="95" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="120" y="100" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="135" y1="95" x2="165" y2="95" stroke="#333" stroke-width="2"/>`,
        `<circle cx="185" cy="95" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="185" y="100" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="200" y1="95" x2="230" y2="95" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="100" font-size="16">...</text>`,
        // H atoms
        `<line x1="120" y1="80" x2="120" y2="60" stroke="#333" stroke-width="1"/>`,
        `<text x="120" y="55" font-size="10">H</text>`,
        `<line x1="120" y1="110" x2="120" y2="130" stroke="#333" stroke-width="1"/>`,
        `<text x="120" y="145" font-size="10">H</text>`,
        `<line x1="185" y1="80" x2="185" y2="60" stroke="#333" stroke-width="1"/>`,
        `<text x="185" y="55" font-size="10">H</text>`,
        `<line x1="185" y1="110" x2="185" y2="130" stroke="#333" stroke-width="1"/>`,
        `<text x="185" y="145" font-size="10">H</text>`,
        // Bracket
        `<text x="60" y="60" font-size="20">[</text>`,
        `<text x="240" y="60" font-size="20">]</text>`,
        `<text x="260" y="65" font-size="12">n</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Polyethylene</text>`,
        `<text x="225" y="180" font-size="10" text-anchor="middle">(CH₂-CH₂)ₙ</text>`
    ]);
}

export function createPVC(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 450, 220, [
        `<text x="50" y="100" font-size="16">...</text>`,
        `<circle cx="120" cy="95" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="120" y="100" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="135" y1="95" x2="165" y2="95" stroke="#333" stroke-width="2"/>`,
        `<circle cx="185" cy="95" r="15" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="185" y="100" font-size="12" font-weight="bold" text-anchor="middle" fill="white">C</text>`,
        `<line x1="200" y1="95" x2="230" y2="95" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="100" font-size="16">...</text>`,
        // H and Cl
        `<line x1="120" y1="80" x2="120" y2="60" stroke="#333" stroke-width="1"/>`,
        `<text x="120" y="55" font-size="10">H</text>`,
        `<line x1="120" y1="110" x2="120" y2="130" stroke="#333" stroke-width="1"/>`,
        `<text x="120" y="145" font-size="10">H</text>`,
        `<line x1="185" y1="80" x2="185" y2="60" stroke="#333" stroke-width="1"/>`,
        `<text x="185" y="55" font-size="10">H</text>`,
        `<line x1="185" y1="110" x2="185" y2="130" stroke="#333" stroke-width="1"/>`,
        `<circle cx="185" cy="145" r="10" fill="#66bb6a" stroke="#333" stroke-width="2"/>`,
        `<text x="185" y="150" font-size="10" font-weight="bold" text-anchor="middle">Cl</text>`,
        `<text x="60" y="60" font-size="20">[</text>`,
        `<text x="240" y="60" font-size="20">]</text>`,
        `<text x="260" y="65" font-size="12">n</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">PVC (Polyvinyl Chloride)</text>`,
        `<text x="225" y="200" font-size="10" text-anchor="middle">(CH₂-CHCl)ₙ</text>`
    ]);
}

// More complex molecules
export function createCaffeine(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 350, 350, [
        // Simplified caffeine structure
        `<circle cx="175" cy="175" r="100" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="180" font-size="14" font-weight="bold" text-anchor="middle">Caffeine</text>`,
        `<text x="175" y="200" font-size="12" text-anchor="middle">C₈H₁₀N₄O₂</text>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Caffeine</text>`,
        `<text x="175" y="320" font-size="10" text-anchor="middle">Stimulant alkaloid</text>`
    ]);
}

export function createAspirin(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Benzene ring
        `<circle cx="150" cy="175" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="150" cy="175" r="35" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`,
        // Carboxyl group
        `<line x1="200" y1="175" x2="250" y2="175" stroke="#333" stroke-width="2"/>`,
        `<text x="270" y="180" font-size="12">COOH</text>`,
        // Acetyl group
        `<line x1="150" y1="125" x2="150" y2="80" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="70" font-size="12" text-anchor="middle">OCOCH₃</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Aspirin</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₉H₈O₄ (Acetylsalicylic acid)</text>`
    ]);
}

export function createDopamine(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Benzene ring with OH groups
        `<circle cx="150" cy="150" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="120" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="120" y="180" font-size="11" fill="#ff5252">OH</text>`,
        // Side chain
        `<line x1="200" y1="150" x2="250" y2="150" stroke="#333" stroke-width="2"/>`,
        `<text x="280" y="155" font-size="12">CH₂CH₂NH₂</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Dopamine</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₈H₁₁NO₂ (Neurotransmitter)</text>`
    ]);
}

export function createSerotonin(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Indole ring system
        `<circle cx="150" cy="150" r="50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<circle cx="200" cy="150" r="30" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="175" y="155" font-size="11">NH</text>`,
        // Side chain
        `<line x1="230" y1="150" x2="280" y2="150" stroke="#333" stroke-width="2"/>`,
        `<text x="310" y="155" font-size="12">CH₂CH₂NH₂</text>`,
        // OH group
        `<text x="150" y="100" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Serotonin</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₁₀H₁₂N₂O (Neurotransmitter)</text>`
    ]);
}

export function createCholesterol(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Steroid ring system (simplified)
        `<rect x="100" y="120" width="60" height="60" fill="none" stroke="#333" stroke-width="3" rx="5"/>`,
        `<rect x="160" y="120" width="60" height="60" fill="none" stroke="#333" stroke-width="3" rx="5"/>`,
        `<rect x="100" y="180" width="60" height="60" fill="none" stroke="#333" stroke-width="3" rx="5"/>`,
        `<rect x="160" y="180" width="60" height="60" fill="none" stroke="#333" stroke-width="3" rx="5"/>`,
        // OH group
        `<text x="80" y="155" font-size="11" fill="#ff5252">OH</text>`,
        // Side chain
        `<line x1="220" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Cholesterol</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₂₇H₄₆O (Steroid lipid)</text>`
    ]);
}

export function createVitaminC(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Lactone ring
        `<circle cx="200" cy="175" r="60" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="180" font-size="12" text-anchor="middle">Lactone Ring</text>`,
        // OH groups
        `<text x="150" y="150" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="250" y="150" font-size="11" fill="#ff5252">OH</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Vitamin C</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">C₆H₈O₆ (Ascorbic acid)</text>`
    ]);
}

export function createNucleotide(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 450, [
        // Phosphate group (top)
        `<circle cx="200" cy="80" r="25" fill="#ffd54f" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="88" font-size="12" font-weight="bold" text-anchor="middle">PO₄³⁻</text>`,
        `<text x="200" y="55" font-size="10" text-anchor="middle">Phosphate</text>`,

        // Bond to sugar
        `<line x1="200" y1="105" x2="200" y2="140" stroke="#333" stroke-width="3"/>`,

        // Ribose sugar (pentagon)
        `<polygon points="200,140 230,160 215,195 185,195 170,160" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="175" font-size="11" font-weight="bold" text-anchor="middle">Ribose</text>`,
        `<circle cx="215" cy="155" r="8" fill="#ff5252" stroke="#333" stroke-width="1"/>`,
        `<text x="215" y="159" font-size="8" text-anchor="middle" fill="white">O</text>`,

        // Bond to base
        `<line x1="200" y1="195" x2="200" y2="230" stroke="#333" stroke-width="3"/>`,

        // Nitrogenous base (simplified)
        `<circle cx="200" cy="280" r="50" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="285" font-size="12" font-weight="bold" text-anchor="middle">Base</text>`,
        `<text x="200" y="305" font-size="9" text-anchor="middle">(A, G, C, U)</text>`,

        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Nucleotide</text>`,
        `<text x="200" y="400" font-size="10" text-anchor="middle">Building block of RNA/DNA</text>`,
        `<text x="200" y="420" font-size="9" text-anchor="middle">Phosphate + Sugar + Base</text>`
    ]);
}

export function createFattyAcid(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 500, 250, [
        // Carboxyl head (hydrophilic)
        `<circle cx="80" cy="125" r="30" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="80" y="132" font-size="12" font-weight="bold" text-anchor="middle" fill="white">COOH</text>`,
        `<text x="80" y="170" font-size="9" text-anchor="middle">Hydrophilic</text>`,

        // Hydrocarbon tail (hydrophobic)
        `<line x1="110" y1="125" x2="150" y2="125" stroke="#333" stroke-width="3"/>`,

        // Zigzag chain
        `<circle cx="170" cy="125" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="130" font-size="10" text-anchor="middle" fill="white">C</text>`,
        `<line x1="182" y1="125" x2="208" y2="125" stroke="#333" stroke-width="3"/>`,

        `<circle cx="220" cy="125" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="220" y="130" font-size="10" text-anchor="middle" fill="white">C</text>`,
        `<line x1="232" y1="125" x2="258" y2="125" stroke="#333" stroke-width="3"/>`,

        `<circle cx="270" cy="125" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="270" y="130" font-size="10" text-anchor="middle" fill="white">C</text>`,
        `<line x1="282" y1="125" x2="308" y2="125" stroke="#333" stroke-width="3"/>`,

        `<circle cx="320" cy="125" r="12" fill="#333" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="130" font-size="10" text-anchor="middle" fill="white">C</text>`,
        `<line x1="332" y1="125" x2="358" y2="125" stroke="#333" stroke-width="3"/>`,

        `<text x="380" y="130" font-size="14">...</text>`,
        `<text x="420" y="130" font-size="12" font-weight="bold">CH₃</text>`,

        `<text x="300" y="170" font-size="9" text-anchor="middle">Hydrophobic tail</text>`,

        // Title
        `<text x="250" y="30" font-size="14" font-weight="bold" text-anchor="middle">Fatty Acid</text>`,
        `<text x="250" y="220" font-size="10" text-anchor="middle">Long-chain carboxylic acid (Lipid component)</text>`
    ]);
}

export function createSteroid(id: string): FBDDiagram {
    return createAdvancedOrganicDiagram(id, 400, 350, [
        // Four-ring steroid structure (A, B, C, D rings)
        // Ring A (bottom left)
        `<circle cx="120" cy="200" r="40" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="205" font-size="12" font-weight="bold" text-anchor="middle">A</text>`,

        // Ring B (top left)
        `<circle cx="160" cy="160" r="40" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="160" y="165" font-size="12" font-weight="bold" text-anchor="middle">B</text>`,

        // Ring C (top right)
        `<circle cx="220" cy="160" r="40" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="220" y="165" font-size="12" font-weight="bold" text-anchor="middle">C</text>`,

        // Ring D (bottom right, 5-membered)
        `<circle cx="260" cy="200" r="35" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="205" font-size="12" font-weight="bold" text-anchor="middle">D</text>`,

        // Connecting lines between rings
        `<line x1="145" y1="180" x2="135" y2="180" stroke="#333" stroke-width="4"/>`,
        `<line x1="195" y1="160" x2="185" y2="160" stroke="#333" stroke-width="4"/>`,
        `<line x1="245" y1="180" x2="235" y2="180" stroke="#333" stroke-width="4"/>`,

        // Side groups
        `<text x="90" y="180" font-size="10" fill="#ff5252">OH</text>`,
        `<text x="300" y="200" font-size="10">R</text>`,

        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Steroid Structure</text>`,
        `<text x="200" y="280" font-size="10" text-anchor="middle">Four-ring core structure</text>`,
        `<text x="200" y="300" font-size="9" text-anchor="middle">Examples: Cholesterol, Testosterone, Estrogen</text>`,
        `<text x="200" y="320" font-size="9" text-anchor="middle">3 cyclohexane + 1 cyclopentane rings</text>`
    ]);
}
