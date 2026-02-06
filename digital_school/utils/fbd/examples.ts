/**
 * Example Free Body Diagrams
 * Demonstrates various FBD configurations for testing and reference
 */

import type { FBDDiagram } from './types';

/**
 * Example 1: Simple block on incline with weight and normal force
 */
export const blockOnIncline: FBDDiagram = {
    id: 'block-on-incline',
    width: 600,
    height: 400,
    showAxes: true,
    showGrid: false,
    points: [
        { id: 'p1', x: 300, y: 200, label: 'A', type: 'free' },
    ],
    forces: [
        {
            id: 'f1',
            pointId: 'p1',
            magnitude: 80,
            angle: 270, // downward
            label: 'mg',
            type: 'weight',
        },
        {
            id: 'f2',
            pointId: 'p1',
            magnitude: 70,
            angle: 90, // upward
            label: 'N',
            type: 'normal',
        },
        {
            id: 'f3',
            pointId: 'p1',
            magnitude: 40,
            angle: 180, // left
            label: 'f',
            type: 'friction',
        },
    ],
    body: {
        type: 'rectangle',
        centerX: 300,
        centerY: 200,
        width: 60,
        height: 40,
    },
};

/**
 * Example 2: Hanging mass with tension
 */
export const hangingMass: FBDDiagram = {
    id: 'hanging-mass',
    width: 400,
    height: 500,
    showAxes: true,
    showGrid: false,
    points: [
        { id: 'p1', x: 200, y: 250, label: 'M', type: 'free' },
    ],
    forces: [
        {
            id: 'f1',
            pointId: 'p1',
            magnitude: 100,
            angle: 90, // upward
            label: 'T',
            type: 'tension',
        },
        {
            id: 'f2',
            pointId: 'p1',
            magnitude: 100,
            angle: 270, // downward
            label: 'mg',
            type: 'weight',
        },
    ],
    body: {
        type: 'circle',
        centerX: 200,
        centerY: 250,
        radius: 30,
    },
};

/**
 * Example 3: Beam with multiple forces and moment
 */
export const beamWithMoment: FBDDiagram = {
    id: 'beam-with-moment',
    width: 700,
    height: 400,
    showAxes: true,
    showGrid: true,
    points: [
        { id: 'p1', x: 150, y: 200, label: 'A', type: 'pivot' },
        { id: 'p2', x: 550, y: 200, label: 'B', type: 'free' },
    ],
    forces: [
        {
            id: 'f1',
            pointId: 'p1',
            magnitude: 60,
            angle: 90,
            label: 'R_A',
            type: 'normal',
        },
        {
            id: 'f2',
            pointId: 'p2',
            magnitude: 80,
            angle: 270,
            label: 'F',
            type: 'applied',
        },
        {
            id: 'f3',
            pointId: 'p2',
            magnitude: 60,
            angle: 90,
            label: 'R_B',
            type: 'normal',
        },
    ],
    moments: [
        {
            id: 'm1',
            pointId: 'p1',
            magnitude: 50,
            direction: 'ccw',
            label: 'M',
            radius: 40,
        },
    ],
    body: {
        type: 'rectangle',
        centerX: 350,
        centerY: 200,
        width: 400,
        height: 20,
    },
};

/**
 * Example 4: Particle with angled forces
 */
export const particleWithAngledForces: FBDDiagram = {
    id: 'particle-angled',
    width: 500,
    height: 500,
    showAxes: true,
    showGrid: false,
    showAngles: true,
    points: [
        { id: 'p1', x: 250, y: 250, label: 'O', type: 'free' },
    ],
    forces: [
        {
            id: 'f1',
            pointId: 'p1',
            magnitude: 80,
            angle: 0,
            label: 'F_1',
            type: 'applied',
        },
        {
            id: 'f2',
            pointId: 'p1',
            magnitude: 60,
            angle: 60,
            label: 'F_2',
            type: 'applied',
        },
        {
            id: 'f3',
            pointId: 'p1',
            magnitude: 70,
            angle: 135,
            label: 'F_3',
            type: 'applied',
        },
    ],
    body: {
        type: 'point',
        centerX: 250,
        centerY: 250,
    },
};

/**
 * All examples for easy access
 */
export const fbdExamples = {
    blockOnIncline,
    hangingMass,
    beamWithMoment,
    particleWithAngledForces,
};

