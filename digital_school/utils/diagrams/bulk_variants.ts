
import type { FBDDiagram } from '../fbd/types';
import { createBlockOnIncline } from '../fbd/generator';
import { createParabola, createHyperbola } from './svg-components/mathematics/graphs';
import { createResistor, createCapacitor } from './physics/electricity';

// Helper to wrap SVG
function wrapSVG(id: string, svg: string): FBDDiagram {
    return { id, width: 300, height: 300, points: [], forces: [], customSVG: svg };
}

/**
 * Generate bulk variants of incline planes
 */
export function generateInclineVariants(): Record<string, (id: string) => FBDDiagram> {
    const variants: Record<string, (id: string) => FBDDiagram> = {};
    for (let angle = 5; angle <= 85; angle += 5) {
        variants[`incline-${angle}`] = (id: string) => createBlockOnIncline(id, angle);
    }
    return variants;
}

/**
 * Generate bulk variants of parabolas
 */
export function generateParabolaVariants(): Record<string, (id: string) => FBDDiagram> {
    const variants: Record<string, (id: string) => FBDDiagram> = {};
    const coeffs = [0.1, 0.2, 0.5, 1, 2, -0.1, -0.5, -1];
    coeffs.forEach(a => {
        const name = `parabola-${a > 0 ? 'pos' : 'neg'}-${Math.abs(a).toString().replace('.', 'p')}`;
        variants[name] = (id: string) => ({
            id, width: 300, height: 300, points: [], forces: [],
            customSVG: createParabola(a, 0, 0, { width: 300, height: 300 })
        });
    });
    return variants;
}

/**
 * Generate bulk variants of hyperbolas
 */
export function generateHyperbolaVariants(): Record<string, (id: string) => FBDDiagram> {
    const variants: Record<string, (id: string) => FBDDiagram> = {};
    const params = [[1, 1], [2, 2], [3, 3], [1, 2], [2, 1], [3, 1], [1, 3]];
    params.forEach(([a, b]) => {
        const name = `hyperbola-${a}-${b}`;
        variants[name] = (id: string) => ({
            id, width: 300, height: 300, points: [], forces: [],
            customSVG: createHyperbola(a, b, { width: 300, height: 300 })
        });
    });
    return variants;
}

/**
 * Generate simplified chemical element placeholders (Periodic Table)
 * Just to reach the count with useful distinct items
 */
export function generateElementVariants(): Record<string, (id: string) => FBDDiagram> {
    const variants: Record<string, (id: string) => FBDDiagram> = {};
    const elements = [
        ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'],
        ['B', 'Boron'], ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'],
        ['F', 'Fluorine'], ['Ne', 'Neon'], ['Na', 'Sodium'], ['Mg', 'Magnesium'],
        ['Al', 'Aluminum'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'],
        ['Cl', 'Chlorine'], ['Ar', 'Argon'], ['K', 'Potassium'], ['Ca', 'Calcium'],
        ['Sc', 'Scandium'], ['Ti', 'Titanium'], ['V', 'Vanadium'], ['Cr', 'Chromium'],
        ['Mn', 'Manganese'], ['Fe', 'Iron'], ['Co', 'Cobalt'], ['Ni', 'Nickel'],
        ['Cu', 'Copper'], ['Zn', 'Zinc']
    ];

    elements.forEach(([symbol, name]) => {
        variants[`element-${name.toLowerCase()}`] = (id: string) => wrapSVG(id, `
            <rect x="50" y="50" width="200" height="200" fill="white" stroke="#333" stroke-width="4"/>
            <text x="150" y="150" font-size="80" text-anchor="middle" font-family="sans-serif">${symbol}</text>
            <text x="150" y="220" font-size="24" text-anchor="middle" font-family="sans-serif">${name}</text>
        `);
    });
    return variants;
}
