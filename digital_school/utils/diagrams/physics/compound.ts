/**
 * Compound/Complex FBD Presets
 * Combinations of multiple physics elements
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Spring-loaded projectile launcher
 * Combines spring mechanics with projectile motion
 */
export function createSpringProjectile(
    id: string,
    springConstant: number = 100,
    mass: number = 2,
    compressionAngle: number = 45
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 500);

    const angleRad = (compressionAngle * Math.PI) / 180;
    const groundY = 400;
    const launchX = 150;
    const launchY = 350;

    // Draw launcher tube/base
    builder.setBackgroundSVG(`
        <path d="M 0 ${groundY} L 700 ${groundY}" stroke="#333" stroke-width="2" />
        <rect x="0" y="${groundY}" width="700" height="20" fill="#e0e0e0" />
        
        <!-- Launcher base -->
        <path d="M ${launchX} ${groundY} L ${launchX - 40} ${groundY} L ${launchX} ${launchY} Z" fill="#7f8c8d" />
        
        <!-- Spring (schematic line for now, or zigzag along angle) -->
        <line x1="${launchX - 30}" y1="${launchY + 30}" x2="${launchX}" y2="${launchY}" stroke="#555" stroke-width="3" stroke-dasharray="2,2" />
    `)
        .addPoint('launch', launchX, launchY, 'Launch')
        .addPoint('projectile', 200, 300, `${mass}kg`)
        .addPoint('peak', 450, 150, 'Peak')
        .addPoint('land', 650, 400, 'Land')

        // Forces at launch
        .addForce('spring', 'projectile', 100, compressionAngle, `F_s`, 'applied')
        .addForce('weight', 'projectile', 60, 270, 'mg', 'weight')
        .addForce('normal', 'projectile', 50, 90 + compressionAngle, 'N', 'normal')

        // Force at peak
        .addForce('gravity_peak', 'peak', 60, 270, 'mg', 'weight')

        .setBody({
            type: 'circle',
            centerX: 200, // Just after launch
            centerY: 300,
            radius: 15,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(true).build();
}

/**
 * Spring pendulum (elastic pendulum)
 * Combines spring oscillation with pendulum motion
 */
export function createSpringPendulum(
    id: string,
    restLength: number = 100,
    mass: number = 2,
    angle: number = 20,
    extension: number = 40
): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 600);

    const angleRad = (angle * Math.PI) / 180;
    const currentLength = restLength + extension;
    const pivotX = 250;
    const pivotY = 100;
    const bobX = pivotX + currentLength * Math.sin(angleRad);
    const bobY = pivotY + currentLength * Math.cos(angleRad);

    // Generate zigzag spring path
    const numCoils = 12;
    const springVecX = bobX - pivotX;
    const springVecY = bobY - pivotY;
    const segX = springVecX / numCoils;
    const segY = springVecY / numCoils;

    // Perpendicular vector for width
    const perpX = -springVecY / currentLength * 10;
    const perpY = springVecX / currentLength * 10;

    let d = `M ${pivotX} ${pivotY}`;
    for (let i = 1; i <= numCoils; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        // End point of segment
        const px = pivotX + i * segX + perpX * sign;
        const py = pivotY + i * segY + perpY * sign;
        if (i === numCoils) d += ` L ${bobX} ${bobY}`; // Connect to bob center
        else d += ` L ${px} ${py}`;
    }

    builder.setBackgroundSVG(`
        <rect x="150" y="90" width="200" height="10" fill="url(#grad-metal)" stroke="#333" />
        <path d="${d}" fill="none" stroke="#333" stroke-width="2" />
    `)
        .addPoint('pivot', pivotX, pivotY, 'O')
        .addPoint('bob', bobX, bobY, `${mass}kg`)

        .addForce('spring', 'bob', 80, 90 - angle + 180, `F_s`, 'applied') // Pulling back
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight')

        .setBody({
            type: 'circle',
            centerX: bobX,
            centerY: bobY,
            radius: 20,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(false).build();
}

/**
 * Double pendulum
 */
export function createDoublePendulum(
    id: string,
    length1: number = 120,
    length2: number = 100,
    angle1: number = 30,
    angle2: number = 45
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 700);

    const angle1Rad = (angle1 * Math.PI) / 180;
    const angle2Rad = (angle2 * Math.PI) / 180;

    const pivotX = 300;
    const pivotY = 100;

    const bob1X = pivotX + length1 * Math.sin(angle1Rad);
    const bob1Y = pivotY + length1 * Math.cos(angle1Rad);

    const bob2X = bob1X + length2 * Math.sin(angle2Rad);
    const bob2Y = bob1Y + length2 * Math.cos(angle2Rad);

    builder.setBackgroundSVG(`
        <rect x="200" y="90" width="200" height="10" fill="url(#grad-metal)" stroke="#333" />
        <line x1="${pivotX}" y1="${pivotY}" x2="${bob1X}" y2="${bob1Y}" stroke="#333" stroke-width="2" />
        <line x1="${bob1X}" y1="${bob1Y}" x2="${bob2X}" y2="${bob2Y}" stroke="#333" stroke-width="2" />
        <circle cx="${pivotX}" cy="${pivotY}" r="4" fill="#333" />
    `)
        .addPoint('pivot', pivotX, pivotY, 'O')
        .addPoint('bob1', bob1X, bob1Y, 'm₁')
        .addPoint('bob2', bob2X, bob2Y, 'm₂')

        // Forces on bob 1
        .addForce('t1', 'bob1', 60, 90 - angle1 + 180, 'T₁', 'tension')
        .addForce('w1', 'bob1', 60, 270, 'm₁g', 'weight')
        .addForce('t2_reaction', 'bob1', 50, 90 - angle2, 'T₂', 'applied') // Pull from thread 2

        // Forces on bob 2
        .addForce('t2', 'bob2', 60, 90 - angle2 + 180, 'T₂', 'tension')
        .addForce('w2', 'bob2', 60, 270, 'm₂g', 'weight')

        .setBody({
            type: 'circle',
            centerX: bob1X,
            centerY: bob1Y,
            radius: 18,
            fill: 'url(#grad-sphere)'
        })
        .addBody({
            type: 'circle',
            centerX: bob2X,
            centerY: bob2Y,
            radius: 18,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(false).build();
}

/**
 * Inclined plane with spring
 * Already updated in previous phase, reaffirming content with standard patterns
 */
export function createInclineSpring(
    id: string,
    angle: number = 30,
    mass: number = 5,
    springCompression: number = 0.2
): FBDDiagram {
    const angleRad = (angle * Math.PI) / 180;
    const startX = 100;
    const startY = 400;
    const baseW = 500;
    const baseH = baseW * Math.tan(angleRad);

    const wallX = startX;
    const wallY = startY;

    // Block pos
    const blockDist = 250;
    const blockX = startX + blockDist * Math.cos(angleRad);
    const blockY = startY - blockDist * Math.sin(angleRad);

    return new FBDBuilder(id, 700, 500)
        .setBackgroundSVG(`
            <path d="M ${startX} ${startY} L ${startX + baseW} ${startY} L ${startX + baseW} ${startY - baseH} Z" 
                  fill="url(#soft-shadow)" stroke="#34495e" stroke-width="2" />
            <rect x="${wallX - 10}" y="${wallY - 40}" width="10" height="80" fill="#7f8c8d" transform="rotate(${-angle}, ${wallX}, ${wallY})"/>
            <text x="${startX + 40}" y="${startY - 10}" font-size="14" fill="#e67e22" font-family="Inter">${angle}°</text>
        `)
        .addPoint('block', blockX, blockY, `m`)
        .addForce('spring', 'block', 80, 180 + angle, `F_s`, 'applied')
        .addForce('weight', 'block', 100, 270, 'mg', 'weight')
        .addForce('normal', 'block', 80, 90 + angle, 'N', 'normal')
        .addForce('friction', 'block', 40, 180 + angle, 'f', 'friction')
        .setBody({
            type: 'rectangle',
            centerX: blockX,
            centerY: blockY,
            width: 60,
            height: 40,
            fill: 'url(#grad-cell-3d)',
            angle: -angle
        })
        .showAxes(true)
        .build();
}

/**
 * Coupled oscillators (Wall - m1 - m2)
 * World-class: Fixed walls, zigzag springs, 3D blocks
 */
export function createCoupledOscillators(
    id: string,
    mass1: number = 3,
    mass2: number = 5
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 400);

    const wallX = 50;
    const m1X = 250;
    const m2X = 500;
    const groundY = 300;
    const blockY = groundY - 25; // Half height (50/2)

    // Helper for horizontal zigzag spring
    const drawSpring = (x1: number, x2: number, y: number) => {
        const len = x2 - x1;
        const coils = 10;
        const seg = len / coils;
        let d = `M ${x1} ${y}`;
        for (let i = 1; i <= coils; i++) {
            const h = i % 2 === 0 ? -10 : 10;
            if (i === coils) d += ` L ${x2} ${y}`;
            else d += ` L ${x1 + i * seg} ${y + h}`;
        }
        return d;
    };

    builder.setBackgroundSVG(`
        <!-- Ground -->
        <line x1="0" y1="${groundY}" x2="700" y2="${groundY}" stroke="#333" stroke-width="2" />
        
        <!-- Wall -->
        <rect x="0" y="${groundY - 100}" width="50" height="100" fill="url(#grad-metal)" stroke="#333" />
        
        <!-- Springs -->
        <path d="${drawSpring(wallX, m1X - 30, blockY)}" fill="none" stroke="#555" stroke-width="2" />
        <path d="${drawSpring(m1X + 30, m2X - 30, blockY)}" fill="none" stroke="#555" stroke-width="2" />
    `)
        .addPoint('wall', wallX, blockY, 'Wall')
        .addPoint('m1', m1X, blockY, `m₁`)
        .addPoint('m2', m2X, blockY, `m₂`)

        // Forces on m1
        .addForce('spring1', 'm1', 60, 180, 'F_{s1}', 'applied') // Pull to wall
        .addForce('spring2', 'm1', 60, 0, 'F_{s2}', 'applied') // Pull to m2
        .addForce('normal1', 'm1', 50, 90, 'N₁', 'normal')
        .addForce('weight1', 'm1', 50, 270, 'm₁g', 'weight')

        // Forces on m2
        .addForce('spring2_reaction', 'm2', 60, 180, 'F_{s2}', 'applied')
        .addForce('normal2', 'm2', 50, 90, 'N₂', 'normal')
        .addForce('weight2', 'm2', 50, 270, 'm₂g', 'weight')

        .setBody({
            type: 'rectangle',
            centerX: m1X,
            centerY: blockY,
            width: 60,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        })
        .addBody({
            type: 'rectangle',
            centerX: m2X,
            centerY: blockY,
            width: 60,
            height: 50,
            fill: 'url(#grad-cell-3d)'
        });

    return builder.showAxes(false).build();
}

/**
 * Projectile with air resistance
 */
export function createProjectileWithDrag(
    id: string,
    velocity: number = 30,
    angle: number = 45
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 500);

    const startX = 50;
    const startY = 400;
    const peakX = 350;
    const peakY = 150;
    const flightX = 200;
    const flightY = 250;

    builder.setBackgroundSVG(`
        <path d="M ${startX} ${startY} Q ${peakX} -50 ${650} ${startY}" fill="none" stroke="#ccc" stroke-dasharray="5,5" />
        <line x1="0" y1="${startY}" x2="700" y2="${startY}" stroke="#333" stroke-width="2" />
    `)
        .addPoint('launch', startX, startY, 'Launch')
        .addPoint('flight', flightX, flightY, 'v')
        .addPoint('peak', peakX, peakY, 'v_x')

        .addForce('v0', 'launch', 80, angle, 'v₀', 'applied')

        // During flight
        .addForce('drag', 'flight', 50, 180 + angle, 'F_d', 'friction')
        .addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight')
        .addForce('v_flight', 'flight', 60, angle - 20, 'v', 'component') // Velocity vector

        // At peak
        .addForce('drag_peak', 'peak', 40, 180, 'F_d', 'friction')
        .addForce('weight_peak', 'peak', 80, 270, 'mg', 'weight')

        .setBody({
            type: 'circle',
            centerX: flightX,
            centerY: flightY,
            radius: 12,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(true).build();
}

/**
 * Rotating pendulum (conical)
 */
export function createConicalPendulum(
    id: string,
    length: number = 150,
    angle: number = 30
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 500);

    const centerX = 300;
    const topY = 50;
    const angleRad = (angle * Math.PI) / 180;
    const bobX = centerX + length * Math.sin(angleRad);
    const bobY = topY + length * Math.cos(angleRad);
    const radius = length * Math.sin(angleRad);

    builder.setBackgroundSVG(`
        <rect x="250" y="40" width="100" height="10" fill="#7f8c8d" />
        <line x1="${centerX}" y1="${topY}" x2="${centerX}" y2="${bobY}" stroke="#ccc" stroke-dasharray="4,4" />
        
        <!-- Orbital path -->
        <ellipse cx="${centerX}" cy="${bobY}" rx="${radius}" ry="${radius / 4}" fill="none" stroke="#3498db" stroke-dasharray="2,2" />
        
        <!-- String -->
        <line x1="${centerX}" y1="${topY}" x2="${bobX}" y2="${bobY}" stroke="#333" stroke-width="2" />
    `)
        .addPoint('pivot', centerX, topY, 'O')
        .addPoint('bob', bobX, bobY, 'm')

        .addForce('tension', 'bob', 80, 90 - angle + 180, 'T', 'tension') // Towards pivot
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight')
        .addForce('centripetal', 'bob', 60, 180, 'F_c', 'applied') // Towards center (schematic)

        .setBody({
            type: 'circle',
            centerX: bobX,
            centerY: bobY,
            radius: 15,
            fill: 'url(#grad-sphere)'
        });

    return builder.showAxes(false).build();
}
