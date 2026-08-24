/**
 * Excel-Friendly FBD Format Parser
 * Converts compact text format to FBD diagrams for bulk uploads
 */

import type { FBDDiagram, FBDForce, FBDPoint } from './types';
import { FBDBuilder } from './generator';
import { DIAGRAM_PRESETS } from '../diagrams/index';

/**
 * Excel FBD Format (Compact Text Format)
 * 
 * Format: POINTS | FORCES | OPTIONS
 * 
 * POINTS: P1(300,200,A) P2(400,200,B)
 * FORCES: F1@P1(80,0,F1,applied) F2@P1(60,90,N,normal)
 * OPTIONS: axes=true grid=false
 * 
 * Example in Excel cell:
 * P1(300,200) | F1@P1(80,0,mg,weight) F2@P1(70,90,N,normal) | axes=true
 * 
 * Presets (even simpler):
 * PRESET:incline(30,10,true)
 * PRESET:hanging(5)
 * PRESET:pulley(5,3)
 */

interface ParsedFBDData {
    points: Array<{ id: string; x: number; y: number; label?: string }>;
    forces: Array<{ id: string; pointId: string; magnitude: number; angle: number; label: string; type?: string }>;
    options: Record<string, any>;
}

/**
 * Parse Excel FBD format to FBD diagram
 */
export function parseExcelFBD(text: string, questionId: string = 'fbd'): FBDDiagram | null {
    if (!text || text.trim() === '') return null;

    text = text.trim();

    // Check if it's a preset
    if (text.startsWith('PRESET:')) {
        return parsePreset(text, questionId);
    }

    // Parse custom format
    return parseCustomFormat(text, questionId);
}

/**
 * Parse preset format
 * Examples:
 * - PRESET:incline(30,10,true)
 * - PRESET:hanging(5)
 * - PRESET:pulley(5,3)
 * - PRESET:beam(400,100)
 */
function parsePreset(text: string, questionId: string): FBDDiagram | null {
    const match = text.match(/PRESET:([\w-]+)\s*\(([\s\S]*)\)/);
    if (!match) return null;

    const [, presetType, paramsRaw] = match;
    const params = parseArguments(paramsRaw);
    const presetKey = presetType.toLowerCase();

    // 1. Check centralized registry first (modern approach)
    const generator = DIAGRAM_PRESETS[presetKey];
    if (generator) {
        try {
            return generator(questionId, ...params);
        } catch (error) {
            console.error(`Error generating preset diagram for ${presetKey}:`, error);
        }
    }

    // 2. Legacy hardcoded fallback
    switch (presetKey) {
        case 'incline':
        case 'block': {
            const angle = parseFloat(params[0]) || 30;
            const mass = parseFloat(params[1]) || 10;
            const friction = params[2] === 'true';

            return new FBDBuilder(questionId, 600, 400)
                .addPoint('block', 300, 200, 'Block')
                .addForce('weight', 'block', 80, 270, 'mg', 'weight')
                .addForce('normal', 'block', 70, 90, 'N', 'normal')
                .addForce('friction', 'block', friction ? 30 : 0, 180, 'f', 'friction')
                .setBody({ type: 'rectangle', centerX: 300, centerY: 200, width: 60, height: 40 })
                .build();
        }

        case 'hanging':
        case 'mass': {
            const mass = parseFloat(params[0]) || 5;

            return new FBDBuilder(questionId, 400, 500)
                .addPoint('mass', 200, 250, 'M')
                .addForce('tension', 'mass', 100, 90, 'T', 'tension')
                .addForce('weight', 'mass', 100, 270, 'mg', 'weight')
                .setBody({ type: 'circle', centerX: 200, centerY: 250, radius: 30 })
                .build();
        }

        case 'pulley': {
            const mass1 = parseFloat(params[0]) || 5;
            const mass2 = parseFloat(params[1]) || 3;

            return new FBDBuilder(questionId, 700, 400)
                .addPoint('m1', 200, 200, 'm₁')
                .addPoint('m2', 500, 200, 'm₂')
                .addForce('t1', 'm1', 80, 90, 'T', 'tension')
                .addForce('w1', 'm1', 80, 270, 'm₁g', 'weight')
                .addForce('t2', 'm2', 60, 90, 'T', 'tension')
                .addForce('w2', 'm2', 60, 270, 'm₂g', 'weight')
                .build();
        }

        case 'beam': {
            const length = parseFloat(params[0]) || 400;
            const load = parseFloat(params[1]) || 100;

            return new FBDBuilder(questionId, 700, 400)
                .addPoint('left', 150, 200, 'A')
                .addPoint('right', 550, 200, 'B')
                .addForce('ra', 'left', 60, 90, 'R_A', 'normal')
                .addForce('rb', 'right', 60, 90, 'R_B', 'normal')
                .addForce('load', 'left', 80, 270, 'W', 'applied')
                .setBody({ type: 'rectangle', centerX: 350, centerY: 200, width: length, height: 20 })
                .showGrid(true)
                .build();
        }

        default:
            return null;
    }
}

/**
 * Robustly parse argument string into an array of values.
 * Handles numbers, booleans, strings, and arrays/objects.
 */
function parseArguments(argsStr: string): any[] {
    const args: any[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        if (char === '[' || char === '{') depth++;
        if (char === ']' || char === '}') depth--;

        if (char === ',' && depth === 0) {
            args.push(parseValue(current.trim()));
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        args.push(parseValue(current.trim()));
    }
    return args;
}

function parseValue(val: string): any {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val)) && val !== '') return Number(val);

    // Handle arrays/objects
    if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
        try {
            // Replace single quotes with double quotes for valid JSON parsing
            const validJson = val.replace(/'/g, '"');
            return JSON.parse(validJson);
        } catch (e) {
            return val;
        }
    }

    // Remove quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        return val.slice(1, -1);
    }
    return val;
}

/**
 * Parse custom format
 * Format: POINTS | FORCES | OPTIONS
 * Example: P1(300,200,A) | F1@P1(80,0,F,applied) F2@P1(60,90,N,normal) | axes=true
 */
function parseCustomFormat(text: string, questionId: string): FBDDiagram | null {
    const parts = text.split('|').map(p => p.trim());

    const pointsStr = parts[0] || '';
    const forcesStr = parts[1] || '';
    const optionsStr = parts[2] || '';

    const parsed: ParsedFBDData = {
        points: [],
        forces: [],
        options: {},
    };

    // Parse points: P1(300,200,A) P2(400,200,B)
    if (pointsStr) {
        const pointMatches = pointsStr.matchAll(/(\w+)\((\d+),(\d+)(?:,(\w+))?\)/g);
        for (const match of pointMatches) {
            const [, id, x, y, label] = match;
            parsed.points.push({
                id,
                x: parseInt(x),
                y: parseInt(y),
                label,
            });
        }
    }

    // Parse forces: F1@P1(80,0,F,applied) F2@P1(60,90,N,normal)
    if (forcesStr) {
        const forceMatches = forcesStr.matchAll(/(\w+)@(\w+)\((\d+),(\d+),([^,]+)(?:,(\w+))?\)/g);
        for (const match of forceMatches) {
            const [, id, pointId, magnitude, angle, label, type] = match;
            parsed.forces.push({
                id,
                pointId,
                magnitude: parseInt(magnitude),
                angle: parseInt(angle),
                label,
                type,
            });
        }
    }

    // Parse options: axes=true grid=false
    if (optionsStr) {
        const optionMatches = optionsStr.matchAll(/(\w+)=(\w+)/g);
        for (const match of optionMatches) {
            const [, key, value] = match;
            parsed.options[key] = value === 'true';
        }
    }

    // Build diagram
    if (parsed.points.length === 0) return null;

    const builder = new FBDBuilder(questionId, 600, 400);

    // Add points
    parsed.points.forEach(p => {
        builder.addPoint(p.id, p.x, p.y, p.label);
    });

    // Add forces
    parsed.forces.forEach(f => {
        builder.addForce(f.id, f.pointId, f.magnitude, f.angle, f.label, f.type as any);
    });

    // Apply options
    if (parsed.options.axes !== undefined) {
        builder.showAxes(parsed.options.axes);
    }
    if (parsed.options.grid !== undefined) {
        builder.showGrid(parsed.options.grid);
    }

    return builder.build();
}

/**
 * Generate Excel template examples
 */
export function generateExcelFBDExamples(): string[] {
    return [
        // Preset examples (EASIEST)
        'PRESET:incline(30,10,true)',
        'PRESET:hanging(5)',
        'PRESET:pulley(5,3)',
        'PRESET:beam(400,100)',

        // Custom examples (MORE FLEXIBLE)
        'P1(300,200,O) | F1@P1(80,0,F1,applied) F2@P1(60,90,F2,applied) | axes=true',
        'P1(300,200,A) | F1@P1(100,270,mg,weight) F2@P1(100,90,T,tension) | axes=true grid=false',
    ];
}

/**
 * Validate Excel FBD format
 */
export function validateExcelFBD(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim() === '') {
        return { valid: true }; // Empty is valid (optional field)
    }

    try {
        const diagram = parseExcelFBD(text, 'test');
        if (!diagram) {
            return { valid: false, error: 'Invalid FBD format' };
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, error: (error as Error).message };
    }
}

/**
 * Convert FBD diagram back to Excel format (for export)
 */
export function fbdToExcelFormat(diagram: FBDDiagram): string {
    const points = diagram.points
        .map(p => `${p.id}(${p.x},${p.y}${p.label ? ',' + p.label : ''})`)
        .join(' ');

    const forces = diagram.forces
        .map(f => `${f.id}@${f.pointId}(${f.magnitude},${f.angle},${f.label}${f.type ? ',' + f.type : ''})`)
        .join(' ');

    const options = [];
    if (diagram.showAxes !== undefined) options.push(`axes=${diagram.showAxes}`);
    if (diagram.showGrid !== undefined) options.push(`grid=${diagram.showGrid}`);

    return [points, forces, options.join(' ')].filter(Boolean).join(' | ');
}
