/**
 * Chemistry Rendering Utilities
 * Helpers for drawing 3D atoms, bonds, and molecular structures.
 */

export type ElementType = 'C' | 'H' | 'O' | 'N' | 'S' | 'Cl' | 'F' | 'P' | 'Metal' | 'Generic';

export interface AtomConfig {
    element: ElementType;
    x: number;
    y: number;
    radius?: number; // Defaults based on element if not provided
    label?: string;
    showLabel?: boolean;
}

export interface BondConfig {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: 'single' | 'double' | 'triple';
    width?: number; // Default 3
}

/**
 * Get gradient ID for an element
 */
export function getElementGradient(element: ElementType): string {
    switch (element) {
        case 'C': return 'grad-sphere-black';
        case 'H': return 'grad-sphere-white';
        case 'O': return 'grad-sphere-red';
        case 'N': return 'grad-sphere-blue';
        case 'S': return 'grad-sphere-yellow';
        case 'Cl': return 'grad-sphere-green';
        case 'F': return 'grad-sphere-green'; // Reuse green for now or add more
        case 'P': return 'grad-charge-pos'; // Orange/Reddish
        case 'Metal': return 'grad-metal';
        default: return 'grad-sphere';
    }
}

/**
 * Get text color for an element label
 */
export function getElementTextColor(element: ElementType): string {
    switch (element) {
        case 'H': return '#334155'; // Dark text on white
        case 'S': return '#334155'; // Dark text on yellow
        case 'Cl': return '#064e3b'; // Dark green
        case 'Metal': return '#334155';
        default: return 'white'; // Light text on dark/colored backgrounds (C, O, N)
    }
}

/**
 * Get default radius for an element
 */
export function getElementRadius(element: ElementType): number {
    switch (element) {
        case 'H': return 12;
        case 'C': return 18;
        case 'N': return 18;
        case 'O': return 16;
        case 'S': return 20;
        case 'Cl': return 20;
        default: return 18;
    }
}

/**
 * Draw a 3D Atom
 */
export function drawAtom3D(config: AtomConfig): string {
    const { element, x, y, showLabel = true } = config;
    const r = config.radius || getElementRadius(element);
    const grad = getElementGradient(element);
    const textColor = getElementTextColor(element);
    const label = config.label || element;

    // Shadow for depth
    const shadow = `<ellipse cx="${x + 2}" cy="${y + r + 2}" rx="${r * 0.8}" ry="${r * 0.3}" fill="black" opacity="0.2" filter="url(#soft-shadow)"/>`;

    // Main sphere
    const sphere = `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;

    // Specular highlight (top-left) - already in gradient but can be enhanced
    // const highlight = `<ellipse cx="${x - r * 0.3}" cy="${y - r * 0.3}" rx="${r * 0.2}" ry="${r * 0.15}" fill="white" opacity="0.4" transform="rotate(-45, ${x - r * 0.3}, ${y - r * 0.3})"/>`;

    // Label
    const text = showLabel ?
        `<text x="${x}" y="${y + 1}" font-size="${Math.max(10, r * 0.8)}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle" style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${label}</text>` : '';

    return `<g class="atom-${element}" transform="translate(0,0)">
        ${shadow}
        ${sphere}
        ${text}
    </g>`;
}

/**
 * Draw a 3D Bond
 */
export function drawBond3D(config: BondConfig): string {
    const { x1, y1, x2, y2, type, width = 4 } = config;

    // Calculate perpendicular offset for double/triple bonds
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return '';

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy; // Perpendicular vector
    const py = ux;

    const offset = width * 1.5;

    // Bond color/gradient
    const stroke = "#94a3b8"; // Slate 400 - standard gray bond
    // Could use gradient if we knew atoms, but generic gray is standard 

    let svg = '';

    // Draw lines based on type
    if (type === 'single') {
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" />`;
    } else if (type === 'double') {
        svg += `<line x1="${x1 + px * offset / 2}" y1="${y1 + py * offset / 2}" x2="${x2 + px * offset / 2}" y2="${y2 + py * offset / 2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
        svg += `<line x1="${x1 - px * offset / 2}" y1="${y1 - py * offset / 2}" x2="${x2 - px * offset / 2}" y2="${y2 - py * offset / 2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
    } else if (type === 'triple') {
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
        svg += `<line x1="${x1 + px * offset}" y1="${y1 + py * offset}" x2="${x2 + px * offset}" y2="${y2 + py * offset}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
        svg += `<line x1="${x1 - px * offset}" y1="${y1 - py * offset}" x2="${x2 - px * offset}" y2="${y2 - py * offset}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
    }

    return `<g class="bond">${svg}</g>`;
}

/**
 * Helper to build organic molecule SVG from atom/bond config
 */
export function buildMoleculeSVG(atoms: AtomConfig[], bonds: { from: number, to: number, type: 'single' | 'double' | 'triple' }[]): string[] {
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
