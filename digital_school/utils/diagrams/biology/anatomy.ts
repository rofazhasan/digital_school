/**
 * Biology Human Anatomy Diagram Presets
 * Human body systems, organs, and anatomical structures
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG anatomy diagrams
 */
function createAnatomyDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * Human Eye
 */
export function createEye(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 300, [
        // Eyeball outline
        `<ellipse cx="200" cy="150" rx="120" ry="80" fill="#f5f5f5" stroke="#333" stroke-width="3"/>`,
        // Cornea
        `<ellipse cx="280" cy="150" rx="40" ry="60" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        // Iris
        `<circle cx="280" cy="150" r="35" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        // Pupil
        `<circle cx="280" cy="150" r="15" fill="#000"/>`,
        // Lens
        `<ellipse cx="240" cy="150" rx="20" ry="40" fill="#fff9c4" stroke="#333" stroke-width="2"/>`,
        // Retina
        `<path d="M 100 150 Q 100 100, 150 90" fill="none" stroke="#ff5252" stroke-width="2"/>`,
        `<text x="90" y="120" font-size="10">Retina</text>`,
        // Optic nerve
        `<line x1="100" y1="150" x2="50" y2="150" stroke="#fdd835" stroke-width="4"/>`,
        `<text x="30" y="155" font-size="10">Optic nerve</text>`,
        // Labels
        `<text x="280" y="100" font-size="10" text-anchor="middle">Cornea</text>`,
        `<text x="240" y="120" font-size="10">Lens</text>`,
        `<text x="280" y="155" font-size="9" text-anchor="middle" fill="white">Pupil</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Human Eye</text>`,
        `<text x="200" y="280" font-size="10" text-anchor="middle">Cross-sectional view</text>`
    ]);
}

/**
 * Human Ear
 */
export function createEar(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 350, [
        // Outer ear
        `<path d="M 50 150 Q 80 100, 120 120 Q 140 140, 130 170 Q 120 200, 80 180 Q 60 170, 50 150" fill="#ffccbc" stroke="#333" stroke-width="3"/>`,
        // Ear canal
        `<rect x="120" y="140" width="80" height="20" fill="#ffe0b2" stroke="#333" stroke-width="2"/>`,
        // Eardrum
        `<line x1="200" y1="135" x2="200" y2="165" stroke="#333" stroke-width="3"/>`,
        `<text x="205" y="155" font-size="9">Eardrum</text>`,
        // Middle ear bones
        `<circle cx="230" cy="150" r="8" fill="#fff" stroke="#333" stroke-width="2"/>`,
        `<circle cx="250" cy="150" r="8" fill="#fff" stroke="#333" stroke-width="2"/>`,
        `<circle cx="270" cy="150" r="8" fill="#fff" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="130" font-size="9" text-anchor="middle">Ossicles</text>`,
        // Cochlea
        `<circle cx="320" cy="150" r="30" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        `<path d="M 320 150 Q 330 140, 340 150 Q 330 160, 320 150" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="320" y="195" font-size="9" text-anchor="middle">Cochlea</text>`,
        // Semicircular canals
        `<circle cx="320" cy="100" r="20" fill="none" stroke="#333" stroke-width="2"/>`,
        `<circle cx="350" cy="120" r="20" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="335" y="80" font-size="9">Semicircular</text>`,
        `<text x="345" y="92" font-size="9">canals</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Human Ear</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">Outer, middle, and inner ear</text>`
    ]);
}

/**
 * Digestive System
 */
export function createDigestiveSystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 350, 500, [
        // Mouth
        `<rect x="150" y="50" width="50" height="20" fill="#ffccbc" stroke="#333" stroke-width="2" rx="5"/>`,
        `<text x="175" y="45" font-size="10" text-anchor="middle">Mouth</text>`,
        // Esophagus
        `<rect x="165" y="70" width="20" height="80" fill="#ffe0b2" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="110" font-size="9">Esophagus</text>`,
        // Stomach
        `<ellipse cx="175" cy="180" rx="50" ry="40" fill="#fff9c4" stroke="#333" stroke-width="3"/>`,
        `<text x="240" y="185" font-size="10">Stomach</text>`,
        // Small intestine
        `<path d="M 175 220 Q 120 250, 140 290 Q 160 320, 120 350 Q 80 380, 120 410" fill="none" stroke="#c8e6c9" stroke-width="15"/>`,
        `<text x="60" y="320" font-size="10">Small</text>`,
        `<text x="60" y="335" font-size="10">intestine</text>`,
        // Large intestine
        `<path d="M 120 410 L 220 410 L 220 250 L 175 220" fill="none" stroke="#a5d6a7" stroke-width="20"/>`,
        `<text x="240" y="330" font-size="10">Large</text>`,
        `<text x="240" y="345" font-size="10">intestine</text>`,
        // Liver (simplified)
        `<ellipse cx="250" cy="160" rx="40" ry="30" fill="#8d6e63" stroke="#333" stroke-width="2"/>`,
        `<text x="250" y="145" font-size="9" text-anchor="middle">Liver</text>`,
        // Pancreas
        `<ellipse cx="220" cy="210" rx="30" ry="15" fill="#fdd835" stroke="#333" stroke-width="2"/>`,
        `<text x="260" y="215" font-size="9">Pancreas</text>`,
        // Title
        `<text x="175" y="25" font-size="14" font-weight="bold" text-anchor="middle">Digestive System</text>`,
        `<text x="175" y="480" font-size="10" text-anchor="middle">Simplified diagram</text>`
    ]);
}

/**
 * Respiratory System
 */
export function createRespiratorySystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 350, 450, [
        // Nasal cavity
        `<ellipse cx="175" cy="60" rx="30" ry="20" fill="#ffccbc" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="45" font-size="10" text-anchor="middle">Nasal cavity</text>`,
        // Trachea
        `<rect x="160" y="80" width="30" height="100" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<line x1="160" y1="95" x2="190" y2="95" stroke="#333" stroke-width="1"/>`,
        `<line x1="160" y1="110" x2="190" y2="110" stroke="#333" stroke-width="1"/>`,
        `<line x1="160" y1="125" x2="190" y2="125" stroke="#333" stroke-width="1"/>`,
        `<line x1="160" y1="140" x2="190" y2="140" stroke="#333" stroke-width="1"/>`,
        `<line x1="160" y1="155" x2="190" y2="155" stroke="#333" stroke-width="1"/>`,
        `<line x1="160" y1="170" x2="190" y2="170" stroke="#333" stroke-width="1"/>`,
        `<text x="205" y="130" font-size="10">Trachea</text>`,
        // Bronchi
        `<line x1="175" y1="180" x2="120" y2="220" stroke="#42a5f5" stroke-width="8"/>`,
        `<line x1="175" y1="180" x2="230" y2="220" stroke="#42a5f5" stroke-width="8"/>`,
        `<text x="175" y="205" font-size="9" text-anchor="middle">Bronchi</text>`,
        // Left lung
        `<ellipse cx="100" cy="300" rx="60" ry="100" fill="#ffcdd2" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="305" font-size="11" font-weight="bold" text-anchor="middle">Left</text>`,
        `<text x="100" y="320" font-size="11" font-weight="bold" text-anchor="middle">Lung</text>`,
        // Right lung
        `<ellipse cx="250" cy="300" rx="60" ry="100" fill="#ffcdd2" stroke="#333" stroke-width="3"/>`,
        `<text x="250" y="305" font-size="11" font-weight="bold" text-anchor="middle">Right</text>`,
        `<text x="250" y="320" font-size="11" font-weight="bold" text-anchor="middle">Lung</text>`,
        // Diaphragm
        `<path d="M 40 400 Q 175 420, 310 400" fill="none" stroke="#8d6e63" stroke-width="4"/>`,
        `<text x="175" y="435" font-size="10" text-anchor="middle">Diaphragm</text>`,
        // Title
        `<text x="175" y="25" font-size="14" font-weight="bold" text-anchor="middle">Respiratory System</text>`
    ]);
}

/**
 * Circulatory System (Heart and vessels)
 */
export function createCirculatorySystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 450, [
        // Heart (simplified)
        `<path d="M 200 150 Q 180 120, 160 120 Q 140 120, 140 140 Q 140 160, 200 220 Q 260 160, 260 140 Q 260 120, 240 120 Q 220 120, 200 150" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="175" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Heart</text>`,
        // Arteries (red)
        `<path d="M 200 100 L 200 50" stroke="#ff5252" stroke-width="6"/>`,
        `<text x="210" y="75" font-size="9">Aorta</text>`,
        `<path d="M 200 50 Q 150 50, 100 80" stroke="#ff5252" stroke-width="4"/>`,
        `<path d="M 200 50 Q 250 50, 300 80" stroke="#ff5252" stroke-width="4"/>`,
        `<text x="100" y="70" font-size="9">Arteries</text>`,
        // Veins (blue)
        `<path d="M 100 350 Q 150 380, 200 400" stroke="#42a5f5" stroke-width="4"/>`,
        `<path d="M 300 350 Q 250 380, 200 400" stroke="#42a5f5" stroke-width="4"/>`,
        `<path d="M 200 400 L 200 220" stroke="#42a5f5" stroke-width="6"/>`,
        `<text x="100" y="365" font-size="9">Veins</text>`,
        // Capillaries
        `<circle cx="100" cy="200" r="40" fill="none" stroke="#9c27b0" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<circle cx="300" cy="200" r="40" fill="none" stroke="#9c27b0" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<text x="100" y="250" font-size="9" text-anchor="middle">Capillaries</text>`,
        // Title
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle">Circulatory System</text>`,
        `<text x="200" y="435" font-size="10" text-anchor="middle">Simplified blood flow</text>`
    ]);
}

/**
 * Skeletal System (simplified)
 */
export function createSkeletalSystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 300, 500, [
        // Skull
        `<circle cx="150" cy="60" r="30" fill="#f5f5f5" stroke="#333" stroke-width="3"/>`,
        // Spine
        `<rect x="140" y="90" width="20" height="200" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
        `<line x1="140" y1="110" x2="160" y2="110" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="130" x2="160" y2="130" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="150" x2="160" y2="150" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="170" x2="160" y2="170" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="190" x2="160" y2="190" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="210" x2="160" y2="210" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="230" x2="160" y2="230" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="250" x2="160" y2="250" stroke="#333" stroke-width="1"/>`,
        `<line x1="140" y1="270" x2="160" y2="270" stroke="#333" stroke-width="1"/>`,
        `<text x="170" y="180" font-size="9">Spine</text>`,
        // Ribs
        `<ellipse cx="150" cy="140" rx="50" ry="30" fill="none" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="150" cy="170" rx="55" ry="35" fill="none" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="150" cy="200" rx="50" ry="30" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="210" y="170" font-size="9">Ribs</text>`,
        // Pelvis
        `<ellipse cx="150" cy="290" rx="60" ry="30" fill="#f5f5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="220" y="295" font-size="9">Pelvis</text>`,
        // Arms (simplified)
        `<line x1="140" y1="120" x2="80" y2="200" stroke="#bdbdbd" stroke-width="8"/>`,
        `<line x1="160" y1="120" x2="220" y2="200" stroke="#bdbdbd" stroke-width="8"/>`,
        // Legs (simplified)
        `<line x1="130" y1="290" x2="100" y2="450" stroke="#bdbdbd" stroke-width="10"/>`,
        `<line x1="170" y1="290" x2="200" y2="450" stroke="#bdbdbd" stroke-width="10"/>`,
        // Title
        `<text x="150" y="25" font-size="14" font-weight="bold" text-anchor="middle">Skeletal System</text>`,
        `<text x="150" y="485" font-size="10" text-anchor="middle">Simplified front view</text>`
    ]);
}

/**
 * Muscular System (simplified)
 */
export function createMuscularSystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 300, 500, [
        // Head
        `<circle cx="150" cy="60" r="30" fill="#ffccbc" stroke="#333" stroke-width="2"/>`,
        // Neck
        `<rect x="135" y="90" width="30" height="30" fill="#d7ccc8" stroke="#333" stroke-width="2"/>`,
        // Torso muscles
        `<ellipse cx="150" cy="180" rx="60" ry="80" fill="#d32f2f" stroke="#333" stroke-width="2"/>`,
        `<line x1="150" y1="100" x2="150" y2="260" stroke="#b71c1c" stroke-width="2"/>`,
        `<text x="220" y="180" font-size="9">Pectorals</text>`,
        // Arm muscles
        `<ellipse cx="80" cy="160" rx="20" ry="50" fill="#c62828" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="220" cy="160" rx="20" ry="50" fill="#c62828" stroke="#333" stroke-width="2"/>`,
        `<text x="50" y="160" font-size="8">Biceps</text>`,
        // Leg muscles
        `<ellipse cx="120" cy="350" rx="25" ry="80" fill="#c62828" stroke="#333" stroke-width="2"/>`,
        `<ellipse cx="180" cy="350" rx="25" ry="80" fill="#c62828" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="350" font-size="8">Quadriceps</text>`,
        // Title
        `<text x="150" y="25" font-size="14" font-weight="bold" text-anchor="middle">Muscular System</text>`,
        `<text x="150" y="485" font-size="10" text-anchor="middle">Major muscle groups</text>`
    ]);
}

/**
 * Nervous System (simplified)
 */
export function createNervousSystem(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 300, 500, [
        // Brain
        `<ellipse cx="150" cy="60" rx="40" ry="35" fill="#e1bee7" stroke="#333" stroke-width="3"/>`,
        `<text x="150" y="65" font-size="11" font-weight="bold" text-anchor="middle">Brain</text>`,
        // Spinal cord
        `<rect x="140" y="95" width="20" height="250" fill="#ce93d8" stroke="#333" stroke-width="2"/>`,
        `<text x="170" y="220" font-size="9">Spinal cord</text>`,
        // Nerves branching out
        `<line x1="140" y1="120" x2="80" y2="150" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="120" x2="220" y2="150" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="140" y1="160" x2="90" y2="190" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="160" x2="210" y2="190" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="140" y1="200" x2="100" y2="230" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="200" x2="200" y2="230" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="140" y1="240" x2="90" y2="270" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="240" x2="210" y2="270" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="140" y1="280" x2="100" y2="310" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="280" x2="200" y2="310" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="140" y1="320" x2="90" y2="380" stroke="#9c27b0" stroke-width="2"/>`,
        `<line x1="160" y1="320" x2="210" y2="380" stroke="#9c27b0" stroke-width="2"/>`,
        `<text x="50" y="200" font-size="8">Peripheral</text>`,
        `<text x="50" y="212" font-size="8">nerves</text>`,
        // Title
        `<text x="150" y="25" font-size="14" font-weight="bold" text-anchor="middle">Nervous System</text>`,
        `<text x="150" y="470" font-size="10" text-anchor="middle">Central & peripheral</text>`
    ]);
}

/**
 * Kidney
 */
export function createKidney(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 350, 400, [
        // Kidney shape
        `<path d="M 175 100 Q 250 100, 250 200 Q 250 300, 175 300 Q 150 300, 150 250 L 150 150 Q 150 100, 175 100" fill="#8d6e63" stroke="#333" stroke-width="3"/>`,
        // Renal pelvis
        `<ellipse cx="170" cy="200" rx="30" ry="50" fill="#ffccbc" stroke="#333" stroke-width="2"/>`,
        // Ureter
        `<line x1="170" y1="250" x2="170" y2="350" stroke="#fdd835" stroke-width="6"/>`,
        `<text x="180" y="300" font-size="10">Ureter</text>`,
        // Renal artery
        `<line x1="100" y1="180" x2="150" y2="180" stroke="#ff5252" stroke-width="5"/>`,
        `<text x="80" y="175" font-size="9">Renal artery</text>`,
        // Renal vein
        `<line x1="100" y1="220" x2="150" y2="220" stroke="#42a5f5" stroke-width="5"/>`,
        `<text x="80" y="235" font-size="9">Renal vein</text>`,
        // Labels
        `<text x="200" y="150" font-size="10">Cortex</text>`,
        `<text x="170" y="205" font-size="9" text-anchor="middle">Pelvis</text>`,
        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Human Kidney</text>`,
        `<text x="175" y="380" font-size="10" text-anchor="middle">Cross-sectional view</text>`
    ]);
}

/**
 * Liver
 */
export function createLiver(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 300, [
        // Liver shape (simplified)
        `<path d="M 100 100 Q 80 150, 100 200 L 300 200 Q 320 150, 300 100 Z" fill="#8d6e63" stroke="#333" stroke-width="3"/>`,
        // Lobes division
        `<line x1="200" y1="100" x2="200" y2="200" stroke="#6d4c41" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<text x="150" y="160" font-size="11" font-weight="bold">Left lobe</text>`,
        `<text x="240" y="160" font-size="11" font-weight="bold">Right lobe</text>`,
        // Hepatic artery
        `<line x1="150" y1="200" x2="150" y2="250" stroke="#ff5252" stroke-width="4"/>`,
        `<text x="155" y="235" font-size="9">Hepatic artery</text>`,
        // Portal vein
        `<line x1="200" y1="200" x2="200" y2="250" stroke="#42a5f5" stroke-width="4"/>`,
        `<text x="205" y="235" font-size="9">Portal vein</text>`,
        // Bile duct
        `<line x1="250" y1="200" x2="250" y2="250" stroke="#66bb6a" stroke-width="4"/>`,
        `<text x="255" y="235" font-size="9">Bile duct</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Human Liver</text>`,
        `<text x="200" y="280" font-size="10" text-anchor="middle">Largest internal organ</text>`
    ]);
}

/**
 * Skin Layers
 */
export function createSkinLayers(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 350, [
        // Epidermis
        `<rect x="50" y="80" width="300" height="40" fill="#ffccbc" stroke="#333" stroke-width="3"/>`,
        `<text x="370" y="105" font-size="11" font-weight="bold">Epidermis</text>`,
        // Dermis
        `<rect x="50" y="120" width="300" height="80" fill="#d7ccc8" stroke="#333" stroke-width="3"/>`,
        `<text x="370" y="165" font-size="11" font-weight="bold">Dermis</text>`,
        // Hypodermis
        `<rect x="50" y="200" width="300" height="60" fill="#bcaaa4" stroke="#333" stroke-width="3"/>`,
        `<text x="370" y="235" font-size="11" font-weight="bold">Hypodermis</text>`,
        // Hair follicle
        `<rect x="150" y="80" width="10" height="120" fill="#8d6e63" stroke="#333" stroke-width="2"/>`,
        `<line x1="155" y1="60" x2="155" y2="80" stroke="#8d6e63" stroke-width="3"/>`,
        `<text x="165" y="140" font-size="9">Hair follicle</text>`,
        // Sweat gland
        `<circle cx="250" cy="240" r="15" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<line x1="250" y1="225" x2="250" y2="100" stroke="#42a5f5" stroke-width="2"/>`,
        `<text x="260" y="245" font-size="9">Sweat gland</text>`,
        // Blood vessels
        `<line x1="100" y1="150" x2="200" y2="150" stroke="#ff5252" stroke-width="3"/>`,
        `<text x="100" y="140" font-size="9">Blood vessels</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Skin Layers</text>`,
        `<text x="200" y="320" font-size="10" text-anchor="middle">Cross-sectional view</text>`
    ]);
}

/**
 * Tooth Structure
 */
export function createTooth(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 300, 400, [
        // Crown
        `<path d="M 150 100 Q 120 120, 120 160 L 120 200 L 180 200 L 180 160 Q 180 120, 150 100" fill="#f5f5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="190" y="150" font-size="10">Crown</text>`,
        // Enamel layer
        `<path d="M 150 100 Q 125 115, 125 160 L 125 200 L 175 200 L 175 160 Q 175 115, 150 100" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        `<text x="190" y="120" font-size="9">Enamel</text>`,
        // Dentin
        `<text x="150" y="170" font-size="9" text-anchor="middle">Dentin</text>`,
        // Pulp
        `<ellipse cx="150" cy="160" rx="15" ry="30" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="130" y="165" font-size="8">Pulp</text>`,
        // Root
        `<path d="M 120 200 L 130 280 Q 150 300, 170 280 L 180 200" fill="#fff9c4" stroke="#333" stroke-width="3"/>`,
        `<text x="190" y="240" font-size="10">Root</text>`,
        // Root canal
        `<line x1="150" y1="190" x2="150" y2="290" stroke="#ff5252" stroke-width="3"/>`,
        `<text x="160" y="250" font-size="8">Canal</text>`,
        // Gum line
        `<line x1="80" y1="200" x2="220" y2="200" stroke="#ffccbc" stroke-width="8"/>`,
        `<text x="60" y="205" font-size="9">Gum</text>`,
        // Bone
        `<rect x="80" y="200" width="140" height="100" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
        `<text x="60" y="250" font-size="9">Bone</text>`,
        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">Tooth Structure</text>`,
        `<text x="150" y="370" font-size="10" text-anchor="middle">Cross-sectional view</text>`
    ]);
}

/**
 * Lung Alveoli
 */
export function createAlveoli(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 350, [
        // Bronchiole
        `<line x1="50" y1="175" x2="150" y2="175" stroke="#42a5f5" stroke-width="8"/>`,
        `<text x="100" y="165" font-size="10" text-anchor="middle">Bronchiole</text>`,
        // Alveoli cluster
        `<circle cx="200" cy="140" r="25" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<circle cx="240" cy="150" r="25" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<circle cx="200" cy="190" r="25" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<circle cx="260" cy="190" r="25" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<circle cx="220" cy="220" r="25" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<text x="300" y="175" font-size="10">Alveoli</text>`,
        // Capillaries
        `<circle cx="200" cy="140" r="30" fill="none" stroke="#ff5252" stroke-width="2" stroke-dasharray="3,3"/>`,
        `<circle cx="240" cy="150" r="30" fill="none" stroke="#ff5252" stroke-width="2" stroke-dasharray="3,3"/>`,
        `<circle cx="200" cy="190" r="30" fill="none" stroke="#ff5252" stroke-width="2" stroke-dasharray="3,3"/>`,
        `<text x="300" y="120" font-size="9" fill="#ff5252">Capillaries</text>`,
        // Gas exchange arrows
        `<text x="150" y="280" font-size="10">O₂ →</text>`,
        `<text x="150" y="300" font-size="10">← CO₂</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Lung Alveoli</text>`,
        `<text x="200" y="330" font-size="10" text-anchor="middle">Gas exchange site</text>`
    ]);
}

/**
 * Nephron (kidney functional unit)
 */
export function createNephron(id: string): FBDDiagram {
    return createAnatomyDiagram(id, 400, 450, [
        // Glomerulus
        `<circle cx="100" cy="100" r="30" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="105" font-size="10" font-weight="bold" text-anchor="middle" fill="white">Glomerulus</text>`,
        // Bowman's capsule
        `<circle cx="100" cy="100" r="45" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="160" font-size="9" text-anchor="middle">Bowman's capsule</text>`,
        // Proximal tubule
        `<path d="M 145 100 Q 180 100, 180 140 Q 180 180, 150 180" fill="none" stroke="#42a5f5" stroke-width="6"/>`,
        `<text x="200" y="140" font-size="9">Proximal tubule</text>`,
        // Loop of Henle
        `<path d="M 150 180 L 150 300 L 100 300 L 100 220" fill="none" stroke="#66bb6a" stroke-width="6"/>`,
        `<text x="160" y="260" font-size="9">Loop of Henle</text>`,
        // Distal tubule
        `<path d="M 100 220 Q 70 220, 70 260 Q 70 300, 100 300" fill="none" stroke="#fdd835" stroke-width="6"/>`,
        `<text x="40" y="260" font-size="9">Distal tubule</text>`,
        // Collecting duct
        `<line x1="100" y1="300" x2="100" y2="400" stroke="#9c27b0" stroke-width="8"/>`,
        `<text x="110" y="350" font-size="9">Collecting duct</text>`,
        // Title
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Nephron</text>`,
        `<text x="200" y="430" font-size="10" text-anchor="middle">Functional unit of kidney</text>`
    ]);
}
