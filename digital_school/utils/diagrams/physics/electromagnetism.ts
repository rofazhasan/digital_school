/**
 * Electromagnetism Diagrams
 * World-Class implementations of fundamental E&M laws
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Coulomb's Law
 * Two point charges with force vectors
 */
export function createCoulombsLaw(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);
    const q1x = 150, q1y = 200;
    const q2x = 450, q2y = 200;
    const r = 30;

    builder.setBackgroundSVG(`
        <!-- Distance dashed line -->
        <line x1="${q1x}" y1="${q1y + 50}" x2="${q2x}" y2="${q2y + 50}" stroke="#777" stroke-width="2" stroke-dasharray="5,5" />
        <line x1="${q1x}" y1="${q1y + 40}" x2="${q1x}" y2="${q1y + 60}" stroke="#777" stroke-width="2" />
        <line x1="${q2x}" y1="${q2y + 40}" x2="${q2x}" y2="${q2y + 60}" stroke="#777" stroke-width="2" />
        <text x="300" y="${q1y + 70}" font-size="14" text-anchor="middle" font-family="Inter">r</text>

        <!-- Charges glow effect (simulated with radial gradient opacity) -->
        <circle cx="${q1x}" cy="${q1y}" r="${r + 10}" fill="url(#grad-charge-pos)" opacity="0.3" />
        <circle cx="${q2x}" cy="${q2y}" r="${r + 10}" fill="url(#grad-charge-neg)" opacity="0.3" />
    `)
        .addPoint('q1', q1x, q1y, '+q₁')
        .addPoint('q2', q2x, q2y, '-q₂')

        // Repulsive or Attractive Forces
        // Assuming q1 positive, q2 negative -> Attraction
        .addForce('F12', 'q1', 80, 0, 'F₁₂', 'applied') // Force on 1 by 2 (Right)
        .addForce('F21', 'q2', 80, 180, 'F₂₁', 'applied') // Force on 2 by 1 (Left)

        .setBody({
            type: 'circle',
            centerX: q1x,
            centerY: q1y,
            radius: r,
            fill: 'url(#grad-charge-pos)' // Need to define this or use red
        })
        .addBody({
            type: 'circle',
            centerX: q2x,
            centerY: q2y,
            radius: r,
            fill: 'url(#grad-charge-neg)' // Need to define this or use blue
        });

    return builder.showAxes(false).build();
}

/**
 * Ampère's Law
 * Current carrying wire and magnetic field loop
 */
export function createAmpereLaw(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 500);
    const cx = 250, cy = 250;

    // Draw 3D wire (infinite z-axis)
    // We visualize it as a cylinder going into the page or vertical
    // Let's do vertical wire, horizontal loop

    builder.setBackgroundSVG(`
        <!-- Magnetic Field Loops (Ellipse) -->
        <ellipse cx="${cx}" cy="${cy}" rx="120" ry="40" fill="none" stroke="#1976d2" stroke-width="2" stroke-dasharray="5,5" />
        
        <!-- B Field Direction Arrows using Paths along ellipse -->
        <!-- Front arrow -->
        <path d="M ${cx} ${cy + 40} L ${cx - 10} ${cy + 45} M ${cx} ${cy + 40} L ${cx - 10} ${cy + 35}" stroke="#1976d2" stroke-width="2" fill="none" />
        <text x="${cx + 80}" y="${cy + 50}" fill="#1976d2" font-weight="bold">B</text>

        <!-- Current Wire (Vertical cylinder) -->
        <rect x="${cx - 10}" y="50" width="20" height="400" fill="url(#grad-metal)" stroke="#333" />
        
        <!-- Field Loop Front (Solid) overlaps wire? No wire goes through -->
        <path d="M ${cx - 120} ${cy} A 120 40 0 0 0 ${cx + 120} ${cy}" fill="none" stroke="#1976d2" stroke-width="3" />
        <!-- Back part is dashed above -->
    `)
        .addPoint('wire', cx, cy - 100, 'I')
        .addForce('I', 'wire', 80, 270, 'I', 'applied'); // Current down

    return builder.showAxes(false).build();
}

/**
 * Lenz's Law
 * Magnet moving towards loop, induced current
 */
export function createLenzLaw(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);

    const loopX = 200, loopY = 200;
    const magX = 450, magY = 200;

    builder.setBackgroundSVG(`
        <!-- Loop (Solenoid single turn style) -->
        <ellipse cx="${loopX}" cy="${loopY}" rx="40" ry="100" fill="none" stroke="#e67e22" stroke-width="4" />
        
        <!-- Induced Field B_ind (Opposes change) -->
        <!-- If Magnet N moves Left towards loop, B_ext increases Left. B_ind must be Right. -->
        <!-- So current implies Right field via RHR -->
        <line x1="${loopX}" y1="${loopY}" x2="${loopX + 100}" y2="${loopY}" stroke="#e67e22" stroke-width="3" stroke-dasharray="4,4" marker-end="url(#arrow)" />
        <text x="${loopX + 50}" y="${loopY - 10}" fill="#e67e22" font-size="12">B_ind</text>

        <!-- Induced Current Direction -->
        <!-- Front going Down? RHR: Thumb Right -> Fingers curl Down in front -->
        <path d="M ${loopX} ${loopY + 100} L ${loopX - 10} ${loopY + 90} M ${loopX} ${loopY + 100} L ${loopX + 10} ${loopY + 90}" stroke="#e67e22" stroke-width="3" fill="none" />
        <text x="${loopX - 20}" y="${loopY + 110}" fill="#e67e22" font-weight="bold">I_ind</text>

        <!-- Magnet -->
        <rect x="${magX}" y="${magY - 30}" width="100" height="60" fill="url(#grad-metal)" stroke="#333" />
        <!-- N pole -->
        <rect x="${magX}" y="${magY - 30}" width="50" height="60" fill="#e74c3c" stroke="none" />
        <text x="${magX + 25}" y="${magY + 5}" fill="white" font-weight="bold">N</text>
        <!-- S pole -->
        <rect x="${magX + 50}" y="${magY - 30}" width="50" height="60" fill="#3498db" stroke="none" />
        <text x="${magX + 75}" y="${magY + 5}" fill="white" font-weight="bold">S</text>
        
        <!-- Velocity Vector -->
        <line x1="${magX}" y1="${magY - 50}" x2="${magX - 60}" y2="${magY - 50}" stroke="#333" stroke-width="3" marker-end="url(#arrow)" />
        <text x="${magX - 30}" y="${magY - 60}" fill="#333" font-weight="bold">v</text>
    `);

    return builder.showAxes(false).build();
}

/**
 * Gauss's Law
 * Charge enclosed by surface
 */
export function createGaussLaw(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 500);
    const cx = 250, cy = 250;
    const R = 150;

    builder.setBackgroundSVG(`
        <!-- Gaussian Surface (Sphere projection) -->
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#grad-sphere)" fill-opacity="0.1" stroke="#333" stroke-dasharray="5,5" />
        <text x="${cx + R - 20}" y="${cy + R}" fill="#555">Gaussian Surface</text>

        <!-- Electric Field Lines Radiating -->
        ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
        const rad = deg * Math.PI / 180;
        const x1 = cx + 30 * Math.cos(rad);
        const y1 = cy + 30 * Math.sin(rad);
        const x2 = cx + (R + 30) * Math.cos(rad);
        const y2 = cy + (R + 30) * Math.sin(rad);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrow)" />`;
    }).join('\n')}
    `)
        .addPoint('charge', cx, cy, '+Q')
        .setBody({
            type: 'circle',
            centerX: cx,
            centerY: cy,
            radius: 20,
            fill: 'url(#grad-charge-pos)'
        });

    return builder.showAxes(false).build();
}

/**
 * Faraday's Law
 * Flux change inducing EMF
 */
export function createFaradayLaw(id: string): FBDDiagram {
    // Similar to Lenz but focusing on loop area/flux lines
    const builder = new FBDBuilder(id, 500, 400);
    const loopX = 150, loopY = 200;

    builder.setBackgroundSVG(`
        <!-- Magnetic Field Lines (External) -->
        ${[160, 200, 240].map(y =>
        `<line x1="0" y1="${y}" x2="500" y2="${y}" stroke="#1976d2" stroke-width="1" opacity="0.3" />`
    ).join('\n')}
        
        <!-- Loop Area -->
        <rect x="${loopX}" y="${loopY - 50}" width="100" height="100" fill="none" stroke="#333" stroke-width="4" />
        
        <!-- Normal Vector -->
        <line x1="${loopX + 50}" y1="${loopY}" x2="${loopX + 50}" y2="${loopY}" stroke="none" /> 
        <!-- Area shading -->
        <rect x="${loopX}" y="${loopY - 50}" width="100" height="100" fill="#333" fill-opacity="0.1" />
    `)
        .addPoint('loop', loopX + 50, loopY, 'Area A')
        .addForce('B', 'loop', 80, 0, 'B', 'applied')
        .addForce('n', 'loop', 60, 90, 'n', 'normal');

    return builder.showAxes(false).build();
}
