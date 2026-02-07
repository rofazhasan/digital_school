/**
 * Physics Mechanics Diagram Presets
 * Extended collection of mechanics diagrams beyond basic FBD
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Spring-mass system
 * Now with visual spring representation
 */
export function createSpringMass(id: string, mass: number = 5, orientation: 'vertical' | 'horizontal' = 'vertical'): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    if (orientation === 'vertical') {
        // Vertical spring
        const ceilY = 50;
        const massY = 300;
        const massX = 200;

        // Generate spring path
        const segments = 12;
        const springLen = massY - ceilY;
        const segLen = springLen / segments;
        let path = `M ${massX} ${ceilY}`;
        for (let i = 1; i <= segments; i++) {
            const xOffset = i % 2 === 0 ? -10 : 10;
            if (i === segments) path += ` L ${massX} ${ceilY + i * segLen}`; // Straight end
            else path += ` L ${massX + xOffset} ${ceilY + i * segLen}`;
        }

        builder.setBackgroundSVG(`
            <rect x="100" y="40" width="200" height="10" fill="url(#grad-metal)" stroke="#333" />
            <path d="${path}" fill="none" stroke="#555" stroke-width="2" />
        `)
            .addPoint('mass', massX, massY + 20, `${mass}kg`)
            .addForce('tension', 'mass', 80, 90, 'T', 'tension')
            .addForce('weight', 'mass', 80, 270, 'mg', 'weight')
            .setBody({
                type: 'rectangle',
                centerX: massX,
                centerY: massY + 20, // Center of mass block
                width: 60,
                height: 40,
                fill: 'url(#grad-cell-3d)'
            });
    } else {
        // Horizontal spring
        const wallX = 50;
        const massX = 300;
        const floorY = 300;
        const massY = floorY - 20;

        // Spring path
        const springLen = massX - wallX - 30; // -30 for half width
        const segments = 12;
        const segLen = springLen / segments;
        let path = `M ${wallX} ${massY}`;
        for (let i = 1; i <= segments; i++) {
            const yOffset = i % 2 === 0 ? -10 : 10;
            path += ` L ${wallX + i * segLen} ${massY + yOffset}`;
        }

        builder.setBackgroundSVG(`
            <rect x="40" y="150" width="10" height="200" fill="url(#grad-metal)" stroke="#333" />
            <line x1="40" y1="${floorY}" x2="400" y2="${floorY}" stroke="#333" stroke-width="2" />
            <path d="${path}" fill="none" stroke="#555" stroke-width="2" />
        `)
            .addPoint('mass', massX, massY, `${mass}kg`)
            .addForce('spring', 'mass', 60, 180, 'F_s', 'applied')
            .addForce('normal', 'mass', 50, 90, 'N', 'normal')
            .addForce('weight', 'mass', 50, 270, 'mg', 'weight')
            .setBody({
                type: 'rectangle',
                centerX: massX,
                centerY: massY,
                width: 60,
                height: 40,
                fill: 'url(#grad-cell-3d)'
            });
    }

    return builder.showAxes(true).build();
}

/**
 * Simple pendulum
 * World-class: pivot, ceiling, angle arc, gradient bob
 */
export function createPendulum(id: string, length: number = 250, angle: number = 30): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    const centerX = 200;
    const centerY = 50;
    const angleRad = (angle * Math.PI) / 180;
    const bobX = centerX + length * Math.sin(angleRad);
    const bobY = centerY + length * Math.cos(angleRad);

    // Angle arc
    const arcR = 60;
    const arcStartX = centerX;
    const arcStartY = centerY + arcR;
    const arcEndX = centerX + arcR * Math.sin(angleRad);
    const arcEndY = centerY + arcR * Math.cos(angleRad);

    // Large flag for arc > 180, sweep flag
    const sweep = angle > 0 ? 0 : 1; // Assuming positive angle is right/CCW convention check

    builder.setBackgroundSVG(`
        <!-- Ceiling -->
        <rect x="100" y="40" width="200" height="10" fill="url(#grad-metal)" stroke="#333" />
        
        <!-- Vertical Reference (dashed) -->
        <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${centerY + length + 20}" 
              stroke="#999" stroke-width="1" stroke-dasharray="5,5" />

        <!-- Angle Arc -->
        <path d="M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}" 
              fill="none" stroke="#e67e22" stroke-width="2" />
        <text x="${centerX + 15}" y="${centerY + 80}" font-size="14" fill="#e67e22">θ</text>

        <!-- String -->
        <line x1="${centerX}" y1="${centerY}" x2="${bobX}" y2="${bobY}" stroke="#333" stroke-width="2" />
        
        <!-- Pivot point -->
        <circle cx="${centerX}" cy="${centerY}" r="4" fill="#333" />
    `)
        .addPoint('bob', bobX, bobY, 'm')
        .addForce('tension', 'bob', 80, 90 - angle, 'T', 'tension')
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight')

        // Components of weight (optional/advanced mode usually, but requested upgrades imply detail)
        // .addForce('mg_cos', 'bob', 60, 270 - angle, 'mg cosθ', 'component')
        // .addForce('mg_sin', 'bob', 40, 180 - angle, 'mg sinθ', 'component')

        .setBody({
            type: 'circle',
            centerX: bobX,
            centerY: bobY,
            radius: 20,
            fill: 'url(#grad-sphere)', // Using spherical gradient
            stroke: '#2980b9'
        });

    return builder.showAxes(false).build();
}

/**
 * Projectile motion
 * World-class: Trajectory path, ground, velocity components
 */
export function createProjectile(id: string, angle: number = 45, velocity: number = 20): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);

    const startX = 50;
    const startY = 350;
    const g = 9.8;
    const v0 = velocity * 5; // Scale for visual
    const angleRad = (angle * Math.PI) / 180;

    // Calculate range
    const range = (v0 * v0 * Math.sin(2 * angleRad)) / g;
    const maxH = (v0 * v0 * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * g);

    // Scale to fit canvas if needed
    const scale = Math.min(500 / range, 250 / maxH);
    const rangeScaled = range * scale;
    const maxHScaled = maxH * scale;

    const endX = startX + rangeScaled;
    const peakX = startX + rangeScaled / 2;
    const peakY = startY - maxHScaled;

    // Path command for parabola
    const path = `M ${startX} ${startY} Q ${startX + rangeScaled / 2} ${startY - 2 * maxHScaled} ${endX} ${startY}`;

    builder.setBackgroundSVG(`
        <!-- Ground -->
        <rect x="0" y="${startY}" width="600" height="50" fill="#e0e0e0" />
        <line x1="0" y1="${startY}" x2="600" y2="${startY}" stroke="#333" stroke-width="2" />
        
        <!-- Trajectory -->
        <path d="${path}" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="6,4" />
        
        <!-- Peak marker -->
        <line x1="${peakX}" y1="${peakY}" x2="${peakX}" y2="${startY}" stroke="#ccc" stroke-dasharray="4,4" />
        <text x="${peakX + 5}" y="${peakY - 5}" font-size="12" fill="#666">Peak</text>
    `)
        .addPoint('launch', startX, startY - 10, 'v₀')
        .addPoint('peak', peakX, peakY, 'v_x')

        .addForce('v0', 'launch', 80, angle, 'v₀', 'applied')
        // Components at launch
        .addForce('vx', 'launch', 60, 0, 'v_x', 'component')
        .addForce('vy', 'launch', 60, 90, 'v_y', 'component')

        .addForce('gravity', 'peak', 50, 270, 'g', 'weight')
        .addForce('vx_peak', 'peak', 60, 0, 'v_x', 'applied') // Only horizontal velocity at peak

        .setBody({
            type: 'circle',
            centerX: startX,
            centerY: startY,
            radius: 8,
            fill: '#333'
        }); // Ball at start

    return builder.showAxes(true).build();
}

/**
 * Free fall diagram
 */
export function createFreeFall(id: string, height: number = 100): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    builder.setBackgroundSVG(`
        <!-- Ground -->
        <rect x="50" y="450" width="300" height="20" fill="#e0e0e0" />
        <line x1="50" y1="450" x2="350" y2="450" stroke="#333" stroke-width="2" />
        
        <!-- Height marker -->
        <line x1="100" y1="100" x2="100" y2="450" stroke="#666" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" />
        <text x="80" y="275" font-size="12" text-anchor="end">h</text>
    `)
        .addPoint('falling', 200, 250, 'm')
        .addForce('weight', 'falling', 80, 270, 'mg', 'weight')
        .addForce('drag', 'falling', 40, 90, 'F_d', 'friction') // Air resistance
        .setBody({
            type: 'circle',
            centerX: 200,
            centerY: 250,
            radius: 25,
            fill: 'url(#grad-sphere)'
        })
        .showAxes(false);

    return builder.build();
}

/**
 * Collision diagram (before and after)
 */
export function createCollision(id: string, mass1: number = 5, mass2: number = 3): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 300);

    builder.setBackgroundSVG(`
        <!-- Floor -->
        <line x1="50" y1="200" x2="650" y2="200" stroke="#333" stroke-width="2" />
    `)
        // Before collision
        .addPoint('m1', 200, 180, `m₁`)
        .addPoint('m2', 400, 180, `m₂`)
        .addForce('v1', 'm1', 60, 0, 'v₁', 'applied')
        .addForce('v2', 'm2', 40, 180, 'v₂', 'applied')

        .setBody({
            type: 'rectangle',
            centerX: 200,
            centerY: 180,
            width: 50,
            height: 40,
            fill: '#3498db'
        })
        .addBody({
            type: 'rectangle',
            centerX: 400,
            centerY: 180,
            width: 50,
            height: 40,
            fill: '#e74c3c'
        });

    return builder.showAxes(false).build();
}

/**
 * Lever system
 * World-class: Triangular fulcrum, beam thickness
 */
export function createLever(id: string, length: number = 400): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);

    builder.setBackgroundSVG(`
        <!-- Fulcrum -->
        <path d="M 280 250 L 320 250 L 300 210 Z" fill="url(#grad-metal)" stroke="#333" stroke-width="2" />
        
        <!-- Floor -->
        <line x1="50" y1="250" x2="550" y2="250" stroke="#333" stroke-width="2" />
    `)
        .addPoint('effort', 150, 210, 'Effort')
        .addPoint('load', 450, 210, 'Load')

        .addForce('effort_force', 'effort', 80, 270, 'F_E', 'applied')
        .addForce('load_force', 'load', 100, 270, 'F_L', 'weight')
        .addForce('reaction', 'effort', 0, 0, 'R', 'normal') // Anchor for point, visual only

        // Using body for beam
        .setBody({
            type: 'rectangle',
            centerX: 300,
            centerY: 205, // Resting on fulcrum tip (210) - half height (5)
            width: length,
            height: 10,
            fill: '#ecf0f1',
            stroke: '#2c3e50'
        });

    return builder.showAxes(false).build();
}

/**
 * Atwood machine (pulley with two masses)
 * World-class: Pulley wheel, rope over pulley, 3D masses
 */
export function createAtwoodMachine(id: string, mass1: number = 5, mass2: number = 3): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 600);

    const pulleyX = 250;
    const pulleyY = 100;
    const pulleyR = 40;
    const m1X = pulleyX - pulleyR;
    const m2X = pulleyX + pulleyR;
    const m1Y = 350;
    const m2Y = 250; // Different height to show dynamics

    builder.setBackgroundSVG(`
        <!-- Ceiling Support -->
        <rect x="245" y="0" width="10" height="100" fill="#555" />
        
        <!-- Rope -->
        <path d="M ${m1X} ${m1Y} L ${m1X} ${pulleyY} A ${pulleyR} ${pulleyR} 0 0 1 ${m2X} ${pulleyY} L ${m2X} ${m2Y}" 
              fill="none" stroke="#2c3e50" stroke-width="3" />

        <!-- Pulley Wheel -->
        <circle cx="${pulleyX}" cy="${pulleyY}" r="${pulleyR}" fill="url(#grad-metal)" stroke="#2c3e50" stroke-width="2"/>
        <circle cx="${pulleyX}" cy="${pulleyY}" r="5" fill="#333"/>
    `)
        .addPoint('m1', m1X, m1Y, `m₁`)
        .addPoint('m2', m2X, m2Y, `m₂`)

        .addForce('t1', 'm1', 80, 90, 'T', 'tension')
        .addForce('w1', 'm1', 80, 270, 'm₁g', 'weight')

        .addForce('t2', 'm2', 80, 90, 'T', 'tension')
        .addForce('w2', 'm2', 60, 270, 'm₂g', 'weight')

        .setBody({
            type: 'rectangle',
            centerX: m1X,
            centerY: m1Y,
            width: 50,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        })
        .addBody({
            type: 'rectangle',
            centerX: m2X,
            centerY: m2Y,
            width: 40,
            height: 40,
            fill: 'url(#grad-cell-3d)'
        });

    return builder.showAxes(false).build();
}
