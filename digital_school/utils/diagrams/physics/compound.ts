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

    // Launch point (compressed spring position)
    builder
        .addPoint('launch', 150, 350, 'Launch')
        .addPoint('projectile', 200, 300, `${mass}kg`)
        .addPoint('peak', 450, 150, 'Peak')
        .addPoint('land', 650, 350, 'Land');

    // Forces at launch
    builder
        .addForce('spring', 'projectile', 120, compressionAngle, `F_s=kx`, 'applied')
        .addForce('weight', 'projectile', 60, 270, 'mg', 'weight')
        .addForce('normal', 'projectile', 50, 90 + compressionAngle, 'N', 'normal');

    // Force at peak (only gravity)
    builder
        .addForce('gravity_peak', 'peak', 60, 270, 'mg', 'weight');

    // Body
    builder.setBody({
        type: 'circle',
        centerX: 200,
        centerY: 300,
        radius: 20,
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
    extension: number = 20
): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 600);

    const angleRad = (angle * Math.PI) / 180;
    const currentLength = restLength + extension;
    const bobX = 250 + currentLength * Math.sin(angleRad);
    const bobY = 150 + currentLength * Math.cos(angleRad);

    builder
        .addPoint('pivot', 250, 150, 'O')
        .addPoint('bob', bobX, bobY, `${mass}kg`)
        .addPoint('rest', 250 + restLength * Math.sin(angleRad), 150 + restLength * Math.cos(angleRad), 'Rest');

    // Spring force (along the spring)
    builder.addForce('spring', 'bob', 80, 90 - angle, `F_s=k\\Delta x`, 'applied');

    // Weight
    builder.addForce('weight', 'bob', 80, 270, 'mg', 'weight');

    // Tension (if needed, can be resultant)
    builder.addForce('tension', 'bob', 70, 90 - angle, 'T', 'tension');

    builder.setBody({
        type: 'circle',
        centerX: bobX,
        centerY: bobY,
        radius: 20,
    });

    return builder.showAxes(false).build();
}

/**
 * Double pendulum
 * Two pendulums connected in series
 */
export function createDoublePendulum(
    id: string,
    length1: number = 100,
    length2: number = 80,
    angle1: number = 30,
    angle2: number = 45
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 700);

    const angle1Rad = (angle1 * Math.PI) / 180;
    const angle2Rad = (angle2 * Math.PI) / 180;

    const bob1X = 300 + length1 * Math.sin(angle1Rad);
    const bob1Y = 150 + length1 * Math.cos(angle1Rad);

    const bob2X = bob1X + length2 * Math.sin(angle2Rad);
    const bob2Y = bob1Y + length2 * Math.cos(angle2Rad);

    builder
        .addPoint('pivot', 300, 150, 'O')
        .addPoint('bob1', bob1X, bob1Y, 'm₁')
        .addPoint('bob2', bob2X, bob2Y, 'm₂');

    // Forces on bob 1
    builder
        .addForce('t1', 'bob1', 80, 90 - angle1, 'T₁', 'tension')
        .addForce('w1', 'bob1', 60, 270, 'm₁g', 'weight')
        .addForce('t2_reaction', 'bob1', 50, 270 - angle2, 'T₂', 'applied');

    // Forces on bob 2
    builder
        .addForce('t2', 'bob2', 60, 90 - angle2, 'T₂', 'tension')
        .addForce('w2', 'bob2', 60, 270, 'm₂g', 'weight');

    builder.setBody({
        type: 'circle',
        centerX: bob1X,
        centerY: bob1Y,
        radius: 18,
    });

    return builder.showAxes(false).build();
}

/**
 * Inclined plane with spring
 * Block on incline connected to spring
 */
export function createInclineSpring(
    id: string,
    angle: number = 30,
    mass: number = 5,
    springCompression: number = 0.2
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 500);

    builder
        .addPoint('wall', 150, 300, 'Wall')
        .addPoint('block', 350, 300, `${mass}kg`)
        .addForce('spring', 'block', 80, 180, `F_s=kx`, 'applied')
        .addForce('weight', 'block', 100, 270, 'mg', 'weight')
        .addForce('normal', 'block', 80, 90 + angle, 'N', 'normal')
        .addForce('friction', 'block', 40, 180, 'f', 'friction')
        .setBody({
            type: 'rectangle',
            centerX: 350,
            centerY: 300,
            width: 60,
            height: 40,
        });

    return builder.showAxes(true).build();
}

/**
 * Coupled oscillators (two masses connected by spring)
 */
export function createCoupledOscillators(
    id: string,
    mass1: number = 3,
    mass2: number = 5
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 400);

    builder
        .addPoint('wall', 100, 200, 'Wall')
        .addPoint('m1', 300, 200, `m₁=${mass1}kg`)
        .addPoint('m2', 500, 200, `m₂=${mass2}kg`);

    // Forces on mass 1
    builder
        .addForce('spring1', 'm1', 60, 180, 'F₁', 'applied')
        .addForce('spring2', 'm1', 60, 0, 'F₂', 'applied')
        .addForce('normal1', 'm1', 50, 90, 'N₁', 'normal')
        .addForce('weight1', 'm1', 50, 270, 'm₁g', 'weight');

    // Forces on mass 2
    builder
        .addForce('spring2_reaction', 'm2', 60, 180, 'F₂', 'applied')
        .addForce('normal2', 'm2', 50, 90, 'N₂', 'normal')
        .addForce('weight2', 'm2', 50, 270, 'm₂g', 'weight');

    builder.setBody({
        type: 'rectangle',
        centerX: 300,
        centerY: 200,
        width: 50,
        height: 40,
    });

    return builder.showAxes(false).build();
}

/**
 * Projectile with air resistance
 * Combines projectile motion with drag force
 */
export function createProjectileWithDrag(
    id: string,
    velocity: number = 30,
    angle: number = 45
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 500);

    builder
        .addPoint('launch', 150, 400, 'Launch')
        .addPoint('flight', 400, 250, 'In Flight')
        .addPoint('peak', 550, 150, 'Peak');

    // At launch
    builder.addForce('v0', 'launch', 100, angle, `v_0=${velocity}m/s`, 'applied');

    // During flight
    builder
        .addForce('drag', 'flight', 60, 180 + angle, 'F_d', 'friction')
        .addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight');

    // At peak
    builder
        .addForce('drag_peak', 'peak', 40, 180, 'F_d', 'friction')
        .addForce('weight_peak', 'peak', 80, 270, 'mg', 'weight');

    builder.setBody({
        type: 'circle',
        centerX: 400,
        centerY: 250,
        radius: 15,
    });

    return builder.showAxes(true).build();
}

/**
 * Rotating pendulum (conical pendulum)
 * Pendulum moving in horizontal circle
 */
export function createConicalPendulum(
    id: string,
    length: number = 100,
    angle: number = 30
): FBDDiagram {
    const builder = new FBDBuilder(id, 600, 500);

    const angleRad = (angle * Math.PI) / 180;
    const bobX = 300 + length * Math.sin(angleRad);
    const bobY = 150 + length * Math.cos(angleRad);

    builder
        .addPoint('pivot', 300, 150, 'O')
        .addPoint('bob', bobX, bobY, 'm')
        .addForce('tension', 'bob', 100, 90 - angle, 'T', 'tension')
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight')
        .addForce('centripetal', 'bob', 70, 180, 'F_c', 'applied')
        .setBody({
            type: 'circle',
            centerX: bobX,
            centerY: bobY,
            radius: 20,
        });

    return builder.showAxes(false).build();
}
