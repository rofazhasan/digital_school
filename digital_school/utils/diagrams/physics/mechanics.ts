/**
 * Physics Mechanics Diagram Presets
 * Extended collection of mechanics diagrams beyond basic FBD
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Spring-mass system
 * @param id Diagram ID
 * @param mass Mass value
 * @param orientation 'vertical' | 'horizontal'
 */
export function createSpringMass(id: string, mass: number = 5, orientation: 'vertical' | 'horizontal' = 'vertical'): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    if (orientation === 'vertical') {
        // Vertical spring
        builder
            .addPoint('top', 200, 100, 'Fixed')
            .addPoint('mass', 200, 300, `${mass}kg`)
            .addForce('tension', 'mass', 80, 90, 'T', 'tension')
            .addForce('weight', 'mass', 80, 270, 'mg', 'weight')
            .setBody({ type: 'rectangle', centerX: 200, centerY: 300, width: 60, height: 40 });
    } else {
        // Horizontal spring
        builder
            .addPoint('wall', 100, 250, 'Wall')
            .addPoint('mass', 300, 250, `${mass}kg`)
            .addForce('spring', 'mass', 60, 180, 'F_s', 'applied')
            .addForce('normal', 'mass', 50, 90, 'N', 'normal')
            .addForce('weight', 'mass', 50, 270, 'mg', 'weight')
            .setBody({ type: 'rectangle', centerX: 300, centerY: 250, width: 60, height: 40 });
    }

    return builder.showAxes(true).build();
}

/**
 * Simple pendulum
 * @param id Diagram ID
 * @param length Pendulum length
 * @param angle Angle from vertical (degrees)
 */
export function createPendulum(id: string, length: number = 100, angle: number = 30): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    const angleRad = (angle * Math.PI) / 180;
    const bobX = 200 + length * Math.sin(angleRad);
    const bobY = 150 + length * Math.cos(angleRad);

    builder
        .addPoint('pivot', 200, 150, 'O')
        .addPoint('bob', bobX, bobY, 'm')
        .addForce('tension', 'bob', 80, 90 - angle, 'T', 'tension')
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight')
        .setBody({ type: 'circle', centerX: bobX, centerY: bobY, radius: 20 });

    return builder.showAxes(false).build();
}

/**
 * Projectile motion
 * @param id Diagram ID
 * @param angle Launch angle (degrees)
 * @param velocity Initial velocity
 */
export function createProjectile(id: string, angle: number = 45, velocity: number = 20): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);

    builder
        .addPoint('launch', 100, 300, 'Launch')
        .addPoint('peak', 300, 150, 'Peak')
        .addForce('velocity', 'launch', 100, angle, `v_0=${velocity}m/s`, 'applied')
        .addForce('gravity', 'peak', 60, 270, 'g', 'weight')
        .showAxes(true);

    return builder.build();
}

/**
 * Free fall diagram
 * @param id Diagram ID
 * @param height Initial height
 */
export function createFreeFall(id: string, height: number = 100): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    builder
        .addPoint('top', 200, 100, `h=${height}m`)
        .addPoint('falling', 200, 250, 'Object')
        .addPoint('ground', 200, 450, 'Ground')
        .addForce('weight', 'falling', 80, 270, 'mg', 'weight')
        .setBody({ type: 'circle', centerX: 200, centerY: 250, radius: 25 })
        .showAxes(false);

    return builder.build();
}

/**
 * Collision diagram (before and after)
 * @param id Diagram ID
 * @param mass1 First mass
 * @param mass2 Second mass
 */
export function createCollision(id: string, mass1: number = 5, mass2: number = 3): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 300);

    // Before collision
    builder
        .addPoint('m1_before', 150, 150, `m₁=${mass1}kg`)
        .addPoint('m2_before', 350, 150, `m₂=${mass2}kg`)
        .addForce('v1', 'm1_before', 80, 0, 'v₁', 'applied')
        .addForce('v2', 'm2_before', 60, 180, 'v₂', 'applied')
        .setBody({ type: 'rectangle', centerX: 150, centerY: 150, width: 50, height: 40 });

    return builder.showAxes(false).build();
}

/**
 * Lever system
 * @param id Diagram ID
 * @param length Lever length
 */
export function createLever(id: string, length: number = 400): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 400);

    builder
        .addPoint('fulcrum', 300, 250, 'Fulcrum')
        .addPoint('effort', 150, 200, 'Effort')
        .addPoint('load', 450, 200, 'Load')
        .addForce('effort_force', 'effort', 80, 270, 'F_E', 'applied')
        .addForce('load_force', 'load', 100, 270, 'F_L', 'weight')
        .addForce('reaction', 'fulcrum', 120, 90, 'R', 'normal')
        .setBody({ type: 'rectangle', centerX: 300, centerY: 220, width: length, height: 10 });

    return builder.showAxes(false).build();
}

/**
 * Atwood machine (pulley with two masses)
 * @param id Diagram ID
 * @param mass1 First mass
 * @param mass2 Second mass
 */
export function createAtwoodMachine(id: string, mass1: number = 5, mass2: number = 3): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 600);

    builder
        .addPoint('pulley', 250, 100, 'Pulley')
        .addPoint('m1', 150, 350, `m₁=${mass1}kg`)
        .addPoint('m2', 350, 400, `m₂=${mass2}kg`)
        .addForce('t1', 'm1', 80, 90, 'T', 'tension')
        .addForce('w1', 'm1', 80, 270, 'm₁g', 'weight')
        .addForce('t2', 'm2', 60, 90, 'T', 'tension')
        .addForce('w2', 'm2', 60, 270, 'm₂g', 'weight')
        .setBody({ type: 'rectangle', centerX: 150, centerY: 350, width: 50, height: 50 });

    return builder.showAxes(false).build();
}
