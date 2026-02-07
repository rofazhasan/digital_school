import { FBDBuilder, createBlockOnIncline } from '../../fbd/generator';
import type { FBDDiagram } from '../../fbd/types';
import { createLRCCircuit } from './circuits';

// Helper to wrap SVG in FBDDiagram
// Kept for legacy support if needed, but we try to use FBDBuilder now
function wrapSVG(id: string, svg: string, width: number = 300, height: number = 300): FBDDiagram {
    return {
        id, width, height, points: [], forces: [],
        customSVG: svg
    };
}

// ===== MECHANICS VARIANTS =====

export function createInclineFrictionKinetic(id: string): FBDDiagram {
    const diagram = createBlockOnIncline(id, 30);
    diagram.forces.push({
        id: 'fk', pointId: 'center', magnitude: 30, angle: 210, label: 'fk', color: '#E74C3C'
    });
    // Add shading to diagram if not present (createBlockOnIncline usually handles it now)
    return diagram;
}

export function createInclineFrictionStatic(id: string): FBDDiagram {
    const diagram = createBlockOnIncline(id, 20);
    diagram.forces.push({
        id: 'fs', pointId: 'center', magnitude: 30, angle: 200, label: 'fs', color: '#E74C3C'
    });
    return diagram;
}

export function createBlockStacked(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 400);
    builder.setBackgroundSVG(`
        <line x1="50" y1="300" x2="350" y2="300" stroke="#333" stroke-width="2" />
    `)
        .addPoint('M', 200, 275, 'M')
        .addPoint('m', 200, 235, 'm')

        // Bottom Block M
        .setBody({
            type: 'rectangle',
            centerX: 200,
            centerY: 275,
            width: 100,
            height: 50,
            fill: '#bdc3c7',
            stroke: '#2c3e50'
        })
        // Top Block m
        .addBody({
            type: 'rectangle',
            centerX: 200,
            centerY: 235, // 275 - 25 - 15 = 235
            width: 50,
            height: 30,
            fill: '#95a5a6',
            stroke: '#2c3e50'
        });

    return builder.build();
}

/**
 * Double pulley system
 * World-Class: Real pulleys, rope path
 */
export function createPulleyCompound2(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 400, 500);

    const ceilingY = 50;
    const pulley1X = 150;
    const pulley1Y = 100;
    const pulley2X = 250;
    const pulley2Y = 250; // Movable pulley

    builder.setBackgroundSVG(`
        <!-- Ceiling -->
        <line x1="100" y1="${ceilingY}" x2="300" y2="${ceilingY}" stroke="#333" stroke-width="2" />
        
        <!-- Rope Fixed End (at ceiling) -->
        <line x1="210" y1="${ceilingY}" x2="210" y2="${pulley2Y - 20}" stroke="#333" stroke-width="2" />
        
        <!-- Rope around movable pulley -->
        <!-- Just schematic logic: Rope goes from valid ceiling point -> down to movable pulley -> up to fixed pulley -> down to F -->
        <!-- Fixed Pulley Support -->
        <line x1="${pulley1X}" y1="${ceilingY}" x2="${pulley1X}" y2="${pulley1Y}" stroke="#333" stroke-width="2" />

        <!-- Rope Path -->
        <path d="M 270 ${ceilingY} L 270 ${pulley2Y} A 20 20 0 0 1 230 ${pulley2Y} L 230 ${100} Q 230 80 210 80 Q 190 80 190 100 L 190 200"
              fill="none" stroke="#2c3e50" stroke-width="2" />
        
        <!-- Simplification: Standard double pulley (one fixed, one moving) -->
        <!-- Fixed Pulley -->
        <circle cx="${pulley1X}" cy="${pulley1Y}" r="20" fill="url(#grad-metal)" stroke="#333" />
        
        <!-- Movable Pulley -->
        <circle cx="${pulley1X}" cy="${pulley2Y}" r="20" fill="url(#grad-metal)" stroke="#333" />
        
        <!-- Rope -->
        <!-- 1. Ceiling to Moving Pulley Center? No, usually around rim -->
        <!-- Let's do: Ceiling(180) -> MovingPulley(180,250) -> FixedPulley(150,100) -> Pull(120) -->
        <line x1="170" y1="${ceilingY}" x2="170" y2="${pulley2Y}" stroke="#333" stroke-width="2" />
        <line x1="130" y1="${pulley2Y}" x2="130" y2="${pulley1Y}" stroke="#333" stroke-width="2" /> <!-- Up to fixed -->
        <line x1="110" y1="${pulley1Y}" x2="110" y2="250" stroke="#333" stroke-width="2" /> <!-- Pull string -->
         
        <!-- Load on Moving Pulley -->
        <rect x="${pulley1X - 15}" y="${pulley2Y + 25}" width="30" height="30" fill="url(#grad-cell-3d)" />
    `)
        .addPoint('load', pulley1X, pulley2Y + 40, 'm')
        .addForce('F', 'load', 80, 270, 'mg', 'weight')
        .addForce('T', 'load', 80, 90, '2T', 'tension'); // Idealized

    return builder.build();
}

export function createSpringSeries(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 300, 400);
    // ... Implement if needed, or leave wrapping if acceptable. 
    // Given scope, I'll update to basic builder to ensure scaling
    builder.setBackgroundSVG(`
        <rect x="100" y="40" width="100" height="10" fill="#555" />
        <!-- Schematic springs -->
        <path d="M 150 50 L 150 100 L 160 110 L 140 120 L 160 130 L 150 140 L 150 190" fill="none" stroke="#333" />
        <path d="M 150 190 L 150 240 L 160 250 L 140 260 L 160 270 L 150 280 L 150 330" fill="none" stroke="#333" />
    `)
        .setBody({
            type: 'rectangle',
            centerX: 150,
            centerY: 350,
            width: 40,
            height: 40,
            fill: '#e67e22'
        });
    return builder.build();
}

export function createSpringParallel(id: string): FBDDiagram {
    const builder = new FBDBuilder(id, 300, 400);
    builder.setBackgroundSVG(`
        <rect x="50" y="40" width="200" height="10" fill="#555" />
        <path d="M 100 50 L 100 330" stroke="#333" stroke-dasharray="2,2" /> <!-- Spring 1 -->
        <path d="M 200 50 L 200 330" stroke="#333" stroke-dasharray="2,2" /> <!-- Spring 2 -->
    `)
        .setBody({
            type: 'rectangle',
            centerX: 150,
            centerY: 350,
            width: 140,
            height: 40,
            fill: '#e67e22'
        });
    return builder.build();
}

// ===== ELECTRICITY VARIANTS =====

export function createCircuitWheatstone(id: string): FBDDiagram {
    const svg = `
        <rect x="50" y="50" width="200" height="200" fill="none" stroke="none"/>
        <line x1="150" y1="50" x2="100" y2="100" stroke="#333" stroke-width="2"/>
        <line x1="150" y1="50" x2="200" y2="100" stroke="#333" stroke-width="2"/>
        <line x1="100" y1="100" x2="150" y2="150" stroke="#333" stroke-width="2"/>
        <line x1="200" y1="100" x2="150" y2="150" stroke="#333" stroke-width="2"/>
        <rect x="90" y="90" width="20" height="20" fill="white" stroke="#333"/>
        <rect x="190" y="90" width="20" height="20" fill="white" stroke="#333"/>
        <text x="150" y="40" text-anchor="middle">Wheatstone Bridge</text>
    `;
    return wrapSVG(id, svg);
}

export function createCircuitLadder(id: string): FBDDiagram {
    const svg = `
        <line x1="50" y1="100" x2="250" y2="100" stroke="#333" stroke-width="2"/>
        <line x1="50" y1="200" x2="250" y2="200" stroke="#333" stroke-width="2"/>
        <rect x="80" y="90" width="20" height="20" fill="white" stroke="#333"/>
        <rect x="140" y="90" width="20" height="20" fill="white" stroke="#333"/>
        <rect x="200" y="90" width="20" height="20" fill="white" stroke="#333"/>
        <line x1="110" y1="100" x2="110" y2="200" stroke="#333" stroke-width="2"/>
        <rect x="100" y="140" width="20" height="20" fill="white" stroke="#333"/>
    `;
    return wrapSVG(id, svg);
}

export function createCircuitRCCharging(id: string): FBDDiagram {
    return createLRCCircuit(id, 'series');
}

// ===== OPTICS VARIANTS =====

export function createLensCombinationConvexConvex(id: string): FBDDiagram {
    const svg = `
        <line x1="0" y1="150" x2="300" y2="150" stroke="#333" stroke-dasharray="4,4"/>
        <ellipse cx="100" cy="150" rx="10" ry="60" fill="none" stroke="#2980B9" stroke-width="2"/>
        <ellipse cx="200" cy="150" rx="10" ry="60" fill="none" stroke="#2980B9" stroke-width="2"/>
        <line x1="100" y1="90" x2="100" y2="210" stroke="#2980B9" stroke-width="1"/>
        <line x1="200" y1="90" x2="200" y2="210" stroke="#2980B9" stroke-width="1"/>
    `;
    return wrapSVG(id, svg);
}

export function createLensCombinationConvexConcave(id: string): FBDDiagram {
    const svg = `
        <line x1="0" y1="150" x2="300" y2="150" stroke="#333" stroke-dasharray="4,4"/>
        <ellipse cx="100" cy="150" rx="10" ry="60" fill="none" stroke="#2980B9" stroke-width="2"/>
        <path d="M 190 90 Q 200 150 190 210 L 210 210 Q 200 150 210 90 Z" fill="none" stroke="#2980B9" stroke-width="2"/>
    `;
    return wrapSVG(id, svg);
}
