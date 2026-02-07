/**
 * Advanced Physics Diagrams
 * Multi-directional forces, complex scenarios
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Object with contact forces from multiple directions
 * World-Class: 3D block, surface, glowing vectors
 */
export function createMultiContactForces(
    id: string,
    forces: Array<{ angle: number; magnitude: number; label: string }> = [
        { angle: 0, magnitude: 50, label: 'F₁' },
        { angle: 60, magnitude: 40, label: 'F₂' },
        { angle: 120, magnitude: 45, label: 'F₃' },
        { angle: 180, magnitude: 35, label: 'F₄' },
    ]
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 600);
    const cx = 300;
    const cy = 300;
    const size = 80;

    builder.setBackgroundSVG(`
        <!-- Floor/Surface context (schematic) -->
        <ellipse cx="${cx}" cy="${cy + size / 2 + 10}" rx="${size}" ry="${size / 4}" fill="#e0e0e0" opacity="0.5" />
    `)
        .addPoint('center', cx, cy, 'Object')
        .addForce('weight', 'center', 60, 270, 'mg', 'weight')
        .addForce('normal', 'center', 60, 90, 'N', 'normal');

    // Add all contact forces
    forces.forEach((force, idx) => {
        builder.addForce(
            `contact${idx}`,
            'center',
            force.magnitude,
            force.angle,
            force.label,
            'applied'
        );
    });

    builder.setBody({
        type: 'rectangle',
        centerX: cx,
        centerY: cy,
        width: size,
        height: size,
        fill: 'url(#grad-cell-3d)',
        stroke: '#2c3e50'
    });

    return builder.showAxes(true).build();
}

/**
 * Complex incline with multiple objects (World-Class)
 * Kept from previous phase
 */
export function createComplexIncline(
    id: string,
    angle: number = 30,
    mass1: number = 5,
    mass2: number = 3
): FBDDiagram {
    const angleRad = (angle * Math.PI) / 180;

    // Incline Base geometry
    const startX = 100;
    const startY = 450;
    const baseW = 600;
    const baseH = baseW * Math.tan(angleRad);

    // Block 1 (lower on incline)
    const block1Dist = 200;
    const block1X = startX + block1Dist * Math.cos(angleRad);
    const block1Y = startY - block1Dist * Math.sin(angleRad);

    // Block 2 (higher on incline)
    const block2Dist = 450;
    const block2X = startX + block2Dist * Math.cos(angleRad);
    const block2Y = startY - block2Dist * Math.sin(angleRad);

    return new FBDBuilder(id, 800, 600)
        .setBackgroundSVG(`
            <path d="M ${startX} ${startY} L ${startX + baseW} ${startY} L ${startX + baseW} ${startY - baseH} Z" 
                  fill="url(#soft-shadow)" stroke="#34495e" stroke-width="2" />
            <path d="M ${startX + 30} ${startY} A 30 30 0 0 0 ${startX + 30 * Math.cos(angleRad)} ${startY - 30 * Math.sin(angleRad)}" 
                  fill="none" stroke="#e67e22" stroke-width="2" />
            <text x="${startX + 40}" y="${startY - 10}" font-size="14" fill="#e67e22" font-family="Inter">${angle}°</text>
        `)
        .addPoint('block1', block1X, block1Y, `m₁`)
        .addPoint('block2', block2X, block2Y, `m₂`)
        .addForce('w1', 'block1', 70, 270, 'm₁g', 'weight')
        .addForce('n1', 'block1', 60, 90 + angle, 'N₁', 'normal')
        .addForce('t1', 'block1', 50, angle, 'T', 'tension')
        .addForce('w2', 'block2', 60, 270, 'm₂g', 'weight')
        .addForce('n2', 'block2', 50, 90 + angle, 'N₂', 'normal')
        .addForce('t2', 'block2', 50, 180 + angle, 'T', 'tension')
        .setBody({
            type: 'rectangle',
            centerX: block1X,
            centerY: block1Y,
            width: 50,
            height: 35,
            fill: 'url(#grad-cell-3d)',
            angle: -angle
        })
        .addBody({
            type: 'rectangle',
            centerX: block2X,
            centerY: block2Y,
            width: 50,
            height: 35,
            fill: 'url(#grad-cell-3d)',
            angle: -angle
        })
        .showAxes(true)
        .build();
}

/**
 * Incline with pulley system (World-Class)
 * Kept from previous phase
 */
export function createInclinePulley(
    id: string,
    angle: number = 30,
    mass1: number = 5,
    mass2: number = 3
): FBDDiagram {
    const angleRad = (angle * Math.PI) / 180;
    const startX = 100;
    const startY = 450;
    const baseW = 500;
    const baseH = baseW * Math.tan(angleRad);

    const pulleyX = startX + baseW;
    const pulleyY = startY - baseH;

    // Block on incline
    const blockDist = 250;
    const blockX = startX + blockDist * Math.cos(angleRad);
    const blockY = startY - blockDist * Math.sin(angleRad);

    return new FBDBuilder(id, 800, 600)
        .setBackgroundSVG(`
            <path d="M ${startX} ${startY} L ${startX + baseW} ${startY} L ${pulleyX} ${pulleyY} Z" 
                  fill="url(#soft-shadow)" stroke="#34495e" stroke-width="2" />
            <circle cx="${pulleyX}" cy="${pulleyY}" r="20" fill="white" stroke="#2c3e50" stroke-width="2"/>
            <path d="M ${startX + 30} ${startY} A 30 30 0 0 0 ${startX + 30 * Math.cos(angleRad)} ${startY - 30 * Math.sin(angleRad)}" 
                  fill="none" stroke="#e67e22" stroke-width="2" />
        `)
        .addPoint('block', blockX, blockY, `m₁`)
        .addPoint('hanging', pulleyX + 40, pulleyY + 150, `m₂`)
        .addForce('w1', 'block', 70, 270, 'm₁g', 'weight')
        .addForce('n1', 'block', 60, 90 + angle, 'N', 'normal')
        .addForce('t1', 'block', 60, angle, 'T', 'tension')
        .addForce('w2', 'hanging', 60, 270, 'm₂g', 'weight')
        .addForce('t2', 'hanging', 60, 90, 'T', 'tension')
        .setBody({
            type: 'rectangle',
            centerX: blockX,
            centerY: blockY,
            width: 50,
            height: 35,
            fill: 'url(#grad-cell-3d)',
            angle: -angle
        })
        .addBody({
            type: 'rectangle',
            centerX: pulleyX + 40,
            centerY: pulleyY + 150,
            width: 40,
            height: 40,
            fill: 'url(#grad-cell-3d)'
        })
        .showAxes(true)
        .build();
}

/**
 * Three-body system with various forces
 * Enhanced with 3D blocks
 */
export function createThreeBodySystem(
    id: string
): FBDDiagram {
    const builder = new FBDBuilder(id, 800, 600);

    // Using schematic positions but real blocks
    builder.setBackgroundSVG(`
        <line x1="100" y1="325" x2="700" y2="325" stroke="#333" stroke-width="2" />
    `)

    builder
        .addPoint('m1', 200, 300, 'm₁')
        .addPoint('m2', 400, 300, 'm₂')
        .addPoint('m3', 600, 300, 'm₃');

    // Forces on m1
    builder
        .addForce('w1', 'm1', 60, 270, 'm₁g', 'weight')
        .addForce('n1', 'm1', 60, 90, 'N₁', 'normal')
        .addForce('f12', 'm1', 50, 0, 'F₁₂', 'applied');

    // Forces on m2
    builder
        .addForce('w2', 'm2', 60, 270, 'm₂g', 'weight')
        .addForce('n2', 'm2', 60, 90, 'N₂', 'normal')
        .addForce('f21', 'm2', 50, 180, 'F₂₁', 'applied')
        .addForce('f23', 'm2', 50, 0, 'F₂₃', 'applied');

    // Forces on m3
    builder
        .addForce('w3', 'm3', 60, 270, 'm₃g', 'weight')
        .addForce('n3', 'm3', 60, 90, 'N₃', 'normal')
        .addForce('f32', 'm3', 50, 180, 'F₃₂', 'applied')

        // 3D Blocks
        .setBody({
            type: 'rectangle',
            centerX: 200,
            centerY: 300,
            width: 50,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        })
        .addBody({
            type: 'rectangle',
            centerX: 400,
            centerY: 300,
            width: 50,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        })
        .addBody({
            type: 'rectangle',
            centerX: 600,
            centerY: 300,
            width: 50,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        });

    return builder.showAxes(true).build();
}

/**
 * Circular motion with multiple forces
 */
export function createCircularMotionForces(
    id: string,
    radius: number = 100
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 600);

    const centerX = 300;
    const centerY = 300;
    const objectX = centerX + radius;
    const objectY = centerY;

    builder.setBackgroundSVG(`
        <circle cx="${centerX}" cy="${centerY}" r="4" fill="#333" />
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#ccc" stroke-dasharray="5,5" />
    `)
        .addPoint('center', centerX, centerY, 'O')
        .addPoint('object', objectX, objectY, 'm')

        .addForce('centripetal', 'object', 80, 180, 'F_c', 'applied')
        .addForce('weight', 'object', 60, 270, 'mg', 'weight')
        .addForce('normal', 'object', 60, 90, 'N', 'normal')
        .addForce('friction', 'object', 40, 90, 'f', 'friction')

        .setBody({
            type: 'circle',
            centerX: objectX,
            centerY: objectY,
            radius: 20,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(true).build();
}
