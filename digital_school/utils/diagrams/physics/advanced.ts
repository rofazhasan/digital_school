/**
 * Advanced Physics Diagrams
 * Multi-directional forces, complex scenarios
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Object with contact forces from multiple directions
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

    builder
        .addPoint('center', 300, 300, 'Object')
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
        centerX: 300,
        centerY: 300,
        width: 60,
        height: 60,
    });

    return builder.showAxes(true).build();
}

/**
 * Complex incline with multiple objects
 */
export function createComplexIncline(
    id: string,
    angle: number = 30,
    mass1: number = 5,
    mass2: number = 3
): FBDDiagram {
    const builder = new FBDBuilder(id, 800, 600);

    const angleRad = (angle * Math.PI) / 180;

    // Block 1 (lower on incline)
    const block1X = 300;
    const block1Y = 400;

    // Block 2 (higher on incline, connected by rope)
    const block2X = 500;
    const block2Y = 300;

    builder
        .addPoint('block1', block1X, block1Y, `m₁=${mass1}kg`)
        .addPoint('block2', block2X, block2Y, `m₂=${mass2}kg`);

    // Forces on block 1
    builder
        .addForce('w1', 'block1', 80, 270, 'm₁g', 'weight')
        .addForce('n1', 'block1', 70, 90 + angle, 'N₁', 'normal')
        .addForce('f1', 'block1', 40, 180, 'f₁', 'friction')
        .addForce('t1', 'block1', 60, angle, 'T', 'tension');

    // Forces on block 2
    builder
        .addForce('w2', 'block2', 60, 270, 'm₂g', 'weight')
        .addForce('n2', 'block2', 50, 90 + angle, 'N₂', 'normal')
        .addForce('f2', 'block2', 30, 180 + angle, 'f₂', 'friction')
        .addForce('t2', 'block2', 60, 180 + angle, 'T', 'tension');

    builder.setBody({
        type: 'rectangle',
        centerX: block1X,
        centerY: block1Y,
        width: 60,
        height: 40,
    });

    return builder.showAxes(true).build();
}

/**
 * Incline with pulley system
 */
export function createInclinePulley(
    id: string,
    angle: number = 30,
    mass1: number = 5,
    mass2: number = 3
): FBDDiagram {
    const builder = new FBDBuilder(id, 800, 600);

    // Block on incline
    builder
        .addPoint('incline_block', 300, 350, `m₁=${mass1}kg`)
        .addPoint('hanging_mass', 600, 400, `m₂=${mass2}kg`)
        .addPoint('pulley', 600, 200, 'Pulley');

    // Forces on incline block
    builder
        .addForce('w1', 'incline_block', 80, 270, 'm₁g', 'weight')
        .addForce('n1', 'incline_block', 70, 90 + angle, 'N', 'normal')
        .addForce('t1', 'incline_block', 60, angle, 'T', 'tension')
        .addForce('f1', 'incline_block', 35, 180, 'f', 'friction');

    // Forces on hanging mass
    builder
        .addForce('t2', 'hanging_mass', 60, 90, 'T', 'tension')
        .addForce('w2', 'hanging_mass', 80, 270, 'm₂g', 'weight');

    builder.setBody({
        type: 'rectangle',
        centerX: 300,
        centerY: 350,
        width: 60,
        height: 40,
    });

    return builder.showAxes(true).build();
}

/**
 * Three-body system with various forces
 */
export function createThreeBodySystem(
    id: string
): FBDDiagram {
    const builder = new FBDBuilder(id, 800, 600);

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
        .addForce('f32', 'm3', 50, 180, 'F₃₂', 'applied');

    builder.setBody({
        type: 'rectangle',
        centerX: 400,
        centerY: 300,
        width: 50,
        height: 40,
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

    builder
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
        });

    return builder.showAxes(true).build();
}
