/**
 * FBD Generator Utilities
 * Programmatic creation of Free Body Diagrams
 */

import type { FBDDiagram, FBDForce, FBDPoint, FBDBody, FBDMoment } from './types';
import { renderFBDToSVG } from './svg-renderer';

/**
 * FBD Builder - Fluent API for creating diagrams
 */
export class FBDBuilder {
    private diagram: FBDDiagram;

    constructor(id: string, width: number = 600, height: number = 400) {
        this.diagram = {
            id,
            width,
            height,
            points: [],
            forces: [],
            moments: [],
            showAxes: true,
            showGrid: false,
        };
    }

    /**
     * Add a point to the diagram
     */
    addPoint(id: string, x: number, y: number, label?: string): this {
        this.diagram.points.push({ id, x, y, label });
        return this;
    }

    /**
     * Add a force vector
     */
    addForce(
        id: string,
        pointId: string,
        magnitude: number,
        angle: number,
        label: string,
        type?: FBDForce['type']
    ): this {
        this.diagram.forces.push({
            id,
            pointId,
            magnitude,
            angle,
            label,
            type,
        });
        return this;
    }

    /**
     * Add a moment (torque)
     */
    addMoment(
        id: string,
        pointId: string,
        magnitude: number,
        direction: 'cw' | 'ccw',
        label: string
    ): this {
        if (!this.diagram.moments) {
            this.diagram.moments = [];
        }
        this.diagram.moments.push({
            id,
            pointId,
            magnitude,
            direction,
            label,
        });
        return this;
    }

    /**
     * Set the rigid body
     */
    setBody(body: FBDBody): this {
        this.diagram.body = body;
        return this;
    }

    /**
     * Toggle axes visibility
     */
    showAxes(show: boolean = true): this {
        this.diagram.showAxes = show;
        return this;
    }

    /**
     * Toggle grid visibility
     */
    showGrid(show: boolean = true): this {
        this.diagram.showGrid = show;
        return this;
    }

    /**
     * Toggle angle labels
     */
    showAngles(show: boolean = true): this {
        this.diagram.showAngles = show;
        return this;
    }


    /**
     * Build and return the diagram
     */
    build(): FBDDiagram {
        // Generate SVG if not already present
        if (!this.diagram.customSVG) {
            this.diagram.customSVG = renderFBDToSVG(this.diagram);
        }
        return this.diagram;
    }
}

/**
 * Quick helper to create a simple FBD with one point and multiple forces
 */
export function createSimpleFBD(
    id: string,
    centerX: number,
    centerY: number,
    forces: Array<{
        magnitude: number;
        angle: number;
        label: string;
        type?: FBDForce['type'];
    }>
): FBDDiagram {
    const builder = new FBDBuilder(id)
        .addPoint('center', centerX, centerY, 'O');

    forces.forEach((force, index) => {
        builder.addForce(
            `f${index + 1}`,
            'center',
            force.magnitude,
            force.angle,
            force.label,
            force.type
        );
    });

    return builder.build();
}

/**
 * Create a block on incline diagram
 */
export function createBlockOnIncline(
    id: string,
    inclineAngle: number = 30,
    mass: number = 10,
    friction: boolean = true
): FBDDiagram {
    const g = 9.8;
    const weight = mass * g;
    const normal = weight * Math.cos((inclineAngle * Math.PI) / 180);
    const parallel = weight * Math.sin((inclineAngle * Math.PI) / 180);

    const builder = new FBDBuilder(id, 600, 400)
        .addPoint('block', 300, 200, 'Block')
        .addForce('weight', 'block', 80, 270, 'mg', 'weight')
        .addForce('normal', 'block', 70, 90 + inclineAngle, 'N', 'normal')
        .setBody({
            type: 'rectangle',
            centerX: 300,
            centerY: 200,
            width: 60,
            height: 40,
        });

    if (friction) {
        builder.addForce('friction', 'block', 30, 180, 'f', 'friction');
    }

    return builder.build();
}

/**
 * Create a hanging mass diagram
 */
export function createHangingMass(
    id: string,
    mass: number = 5,
    tension?: number
): FBDDiagram {
    const g = 9.8;
    const weight = mass * g;
    const T = tension || weight;

    return new FBDBuilder(id, 400, 500)
        .addPoint('mass', 200, 250, 'M')
        .addForce('tension', 'mass', 100, 90, 'T', 'tension')
        .addForce('weight', 'mass', 100, 270, 'mg', 'weight')
        .setBody({
            type: 'circle',
            centerX: 200,
            centerY: 250,
            radius: 30,
        })
        .build();
}

/**
 * Create a pulley system diagram
 */
export function createPulleySystem(
    id: string,
    mass1: number = 5,
    mass2: number = 3
): FBDDiagram {
    const g = 9.8;

    return new FBDBuilder(id, 700, 400)
        .addPoint('m1', 200, 200, 'm₁')
        .addPoint('m2', 500, 200, 'm₂')
        .addForce('t1', 'm1', 80, 90, 'T', 'tension')
        .addForce('w1', 'm1', 80, 270, 'm₁g', 'weight')
        .addForce('t2', 'm2', 60, 90, 'T', 'tension')
        .addForce('w2', 'm2', 60, 270, 'm₂g', 'weight')
        .setBody({
            type: 'circle',
            centerX: 200,
            centerY: 200,
            radius: 25,
        })
        .build();
}

/**
 * Create a beam with distributed load
 */
export function createBeamDiagram(
    id: string,
    length: number = 400,
    load: number = 100
): FBDDiagram {
    const centerX = 350;
    const centerY = 200;

    return new FBDBuilder(id, 700, 400)
        .addPoint('left', centerX - length / 2, centerY, 'A')
        .addPoint('right', centerX + length / 2, centerY, 'B')
        .addForce('ra', 'left', 60, 90, 'R_A', 'normal')
        .addForce('rb', 'right', 60, 90, 'R_B', 'normal')
        .addForce('load', 'left', 80, 270, 'W', 'applied')
        .setBody({
            type: 'rectangle',
            centerX,
            centerY,
            width: length,
            height: 20,
        })
        .showGrid(true)
        .build();
}

/**
 * Parse FBD from JSON string
 */
export function parseFBD(json: string): FBDDiagram {
    return JSON.parse(json) as FBDDiagram;
}

/**
 * Serialize FBD to JSON string
 */
export function serializeFBD(diagram: FBDDiagram): string {
    return JSON.stringify(diagram, null, 2);
}

/**
 * Validate FBD diagram structure
 */
export function validateFBD(diagram: FBDDiagram): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!diagram.id) errors.push('Diagram must have an id');
    if (!diagram.width || diagram.width <= 0) errors.push('Invalid width');
    if (!diagram.height || diagram.height <= 0) errors.push('Invalid height');
    if (!diagram.points || diagram.points.length === 0) errors.push('Diagram must have at least one point');

    // Validate forces reference existing points
    const pointIds = new Set(diagram.points.map(p => p.id));
    diagram.forces.forEach((force, index) => {
        if (!pointIds.has(force.pointId)) {
            errors.push(`Force ${index} references non-existent point: ${force.pointId}`);
        }
    });

    // Validate moments reference existing points
    diagram.moments?.forEach((moment, index) => {
        if (!pointIds.has(moment.pointId)) {
            errors.push(`Moment ${index} references non-existent point: ${moment.pointId}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
