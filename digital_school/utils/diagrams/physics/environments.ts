/**
 * Environment-Specific Physics Diagrams
 * Same physics scenarios in different mediums (air, water, fire/gas)
 */

import { FBDBuilder } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';

/**
 * Pendulum in different environments
 */
export function createPendulumInMedium(
    id: string,
    length: number = 100,
    angle: number = 30,
    medium: 'air' | 'water' | 'fire' | 'vacuum' = 'air'
): FBDDiagram {
    const builder = new FBDBuilder(id, 500, 600);

    const angleRad = (angle * Math.PI) / 180;
    const bobX = 250 + length * Math.sin(angleRad);
    const bobY = 150 + length * Math.cos(angleRad);

    builder
        .addPoint('pivot', 250, 150, 'O')
        .addPoint('bob', bobX, bobY, 'm')
        .addForce('tension', 'bob', 80, 90 - angle, 'T', 'tension')
        .addForce('weight', 'bob', 80, 270, 'mg', 'weight');

    // Add drag force based on medium
    if (medium === 'air') {
        builder.addForce('drag', 'bob', 30, 180 - angle, 'F_d (air)', 'friction');
    } else if (medium === 'water') {
        builder.addForce('drag', 'bob', 60, 180 - angle, 'F_d (water)', 'friction');
        builder.addForce('buoyancy', 'bob', 40, 90, 'F_b', 'applied');
    } else if (medium === 'fire') {
        builder.addForce('drag', 'bob', 45, 180 - angle, 'F_d (hot gas)', 'friction');
        builder.addForce('thermal', 'bob', 25, 90, 'F_th', 'applied');
    }
    // vacuum has no drag
    builder.setBody({
        type: 'circle',
        centerX: bobX,
        centerY: bobY,
        radius: 20,
    });

    // Add visual environment
    if (medium === 'water') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="500" height="600" fill="#e0f7fa" opacity="0.5"/>
            <path d="M 0 50 Q 125 60 250 50 T 500 50 L 500 600 L 0 600 Z" fill="#b2ebf2" opacity="0.5"/>
        `);
    } else if (medium === 'fire') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="500" height="600" fill="#fff3e0" opacity="0.5"/>
            <!-- Heat waves / Fire gradient -->
            <defs>
                <linearGradient id="fire-grad-${id}" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#ffccbc" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="#ffab91" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <rect x="0" y="200" width="500" height="400" fill="url(#fire-grad-${id})"/>
        `);
    }

    return builder.showAxes(false).build();
}

/**
 * Projectile in different environments
 */
export function createProjectileInMedium(
    id: string,
    velocity: number = 30,
    angle: number = 45,
    medium: 'air' | 'water' | 'fire' | 'vacuum' = 'air'
): FBDDiagram {
    const builder = new FBDBuilder(id, 700, 500);

    builder
        .addPoint('launch', 150, 400, 'Launch')
        .addPoint('flight', 400, 250, 'In Flight')
        .addPoint('peak', 550, 150, 'Peak');

    // At launch
    builder.addForce('v0', 'launch', 100, angle, `v_0=${velocity}m/s`, 'applied');

    // During flight - forces depend on medium
    if (medium === 'air') {
        builder
            .addForce('drag', 'flight', 40, 180 + angle, 'F_d (air)', 'friction')
            .addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight');
    } else if (medium === 'water') {
        builder
            .addForce('drag', 'flight', 70, 180 + angle, 'F_d (water)', 'friction')
            .addForce('buoyancy', 'flight', 50, 90, 'F_b', 'applied')
            .addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight');
    } else if (medium === 'fire') {
        builder
            .addForce('drag', 'flight', 50, 180 + angle, 'F_d (hot gas)', 'friction')
            .addForce('thermal', 'flight', 30, 90, 'F_th', 'applied')
            .addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight');
    } else if (medium === 'vacuum') {
        builder.addForce('weight_flight', 'flight', 80, 270, 'mg', 'weight');
    }

    // At peak
    builder.addForce('weight_peak', 'peak', 80, 270, 'mg', 'weight');
    if (medium === 'water') {
        builder.addForce('buoyancy_peak', 'peak', 50, 90, 'F_b', 'applied');
    }

    builder.setBody({
        type: 'circle',
        centerX: 400,
        centerY: 250,
        radius: 15,
    });

    // Add visual environment
    if (medium === 'water') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="700" height="500" fill="#e0f7fa" opacity="0.3"/>
            <rect x="0" y="300" width="700" height="200" fill="#b2ebf2" opacity="0.5"/>
        `);
    } else if (medium === 'fire') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="700" height="500" fill="#fff3e0" opacity="0.3"/>
            <defs>
                <linearGradient id="fire-grad-proj-${id}" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#ffccbc" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#ffab91" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <rect x="0" y="100" width="700" height="400" fill="url(#fire-grad-proj-${id})"/>
        `);
    }

    return builder.showAxes(true).build();
}

/**
 * Free fall in different environments
 */
export function createFreeFallInMedium(
    id: string,
    mass: number = 5,
    medium: 'air' | 'water' | 'fire' | 'vacuum' = 'air'
): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    builder
        .addPoint('object', 200, 250, `${mass}kg`)
        .addForce('weight', 'object', 100, 270, 'mg', 'weight');

    // Add medium-specific forces
    if (medium === 'air') {
        builder.addForce('drag', 'object', 40, 90, 'F_d (air)', 'friction');
    } else if (medium === 'water') {
        builder
            .addForce('drag', 'object', 70, 90, 'F_d (water)', 'friction')
            .addForce('buoyancy', 'object', 60, 90, 'F_b', 'applied');
    } else if (medium === 'fire') {
        builder
            .addForce('drag', 'object', 50, 90, 'F_d (hot gas)', 'friction')
            .addForce('thermal', 'object', 30, 90, 'F_th', 'applied');
    }
    // vacuum has only weight

    builder.setBody({
        type: 'circle',
        centerX: 200,
        centerY: 250,
        radius: 25,
    });

    // Add visual environment
    if (medium === 'water') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="400" height="500" fill="#e0f7fa" opacity="0.5"/>
        `);
    } else if (medium === 'fire') {
        builder.setBackgroundSVG(`
            <rect x="0" y="0" width="400" height="500" fill="#fff3e0" opacity="0.5"/>
        `);
    }

    return builder.showAxes(true).build();
}

/**
 * Comparison diagram - same object in different mediums
 */
export function createMediumComparison(
    id: string,
    scenario: 'pendulum' | 'projectile' | 'freefall' = 'pendulum'
): FBDDiagram {
    const width = 800;
    const height = 600;
    const elements: string[] = [];

    // Title
    elements.push(`<text x="400" y="30" font-size="18" font-weight="bold" text-anchor="middle" fill="#333">Medium Comparison: ${scenario}</text>`);

    // Labels for each medium
    const mediums = ['Vacuum', 'Air', 'Water', 'Fire/Hot Gas'];
    const xPositions = [100, 300, 500, 700];

    mediums.forEach((medium, idx) => {
        const x = xPositions[idx];

        // Medium label
        elements.push(`<text x="${x}" y="60" font-size="14" font-weight="bold" text-anchor="middle" fill="#666">${medium}</text>`);

        // Visual representation
        if (scenario === 'pendulum') {
            // Simple pendulum representation
            elements.push(`<line x1="${x}" y1="80" x2="${x}" y2="100" stroke="#333" stroke-width="2"/>`);
            elements.push(`<line x1="${x}" y1="100" x2="${x + 30}" y2="180" stroke="#333" stroke-width="2"/>`);
            elements.push(`<circle cx="${x + 30}" cy="180" r="15" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>`);

            // Forces
            elements.push(`<line x1="${x + 30}" y1="180" x2="${x + 30}" y2="230" stroke="#ef4444" stroke-width="2" marker-end="url(#arrowhead)"/>`);
            elements.push(`<text x="${x + 35}" y="240" font-size="10" fill="#ef4444">mg</text>`);

            // Drag force (varies by medium)
            if (medium !== 'Vacuum') {
                const dragLength = medium === 'Water' ? 40 : medium === 'Fire/Hot Gas' ? 30 : 20;
                elements.push(`<line x1="${x + 30}" y1="180" x2="${x + 30 - dragLength}" y2="180" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowhead)"/>`);
                elements.push(`<text x="${x - 10}" y="175" font-size="9" fill="#f59e0b">F_d</text>`);
            }

            // Buoyancy for water
            if (medium === 'Water') {
                elements.push(`<line x1="${x + 30}" y1="180" x2="${x + 30}" y2="150" stroke="#10b981" stroke-width="2" marker-end="url(#arrowhead)"/>`);
                elements.push(`<text x="${x + 35}" y="145" font-size="9" fill="#10b981">F_b</text>`);
            }
        }

        // Characteristics
        const y = 280;
        if (medium === 'Vacuum') {
            elements.push(`<text x="${x}" y="${y}" font-size="10" text-anchor="middle" fill="#666">No drag</text>`);
            elements.push(`<text x="${x}" y="${y + 15}" font-size="10" text-anchor="middle" fill="#666">Max range</text>`);
        } else if (medium === 'Air') {
            elements.push(`<text x="${x}" y="${y}" font-size="10" text-anchor="middle" fill="#666">Low drag</text>`);
            elements.push(`<text x="${x}" y="${y + 15}" font-size="10" text-anchor="middle" fill="#666">Normal</text>`);
        } else if (medium === 'Water') {
            elements.push(`<text x="${x}" y="${y}" font-size="10" text-anchor="middle" fill="#666">High drag</text>`);
            elements.push(`<text x="${x}" y="${y + 15}" font-size="10" text-anchor="middle" fill="#666">+ Buoyancy</text>`);
        } else {
            elements.push(`<text x="${x}" y="${y}" font-size="10" text-anchor="middle" fill="#666">Med drag</text>`);
            elements.push(`<text x="${x}" y="${y + 15}" font-size="10" text-anchor="middle" fill="#666">+ Thermal</text>`);
        }
    });

    // Arrow marker definition
    elements.unshift(`
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#333"/>
      </marker>
    </defs>
  `);

    return {
        id,
        width,
        height,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}
