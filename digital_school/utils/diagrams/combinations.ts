/**
 * Universal Combination System
 * Combine any diagrams in series, parallel, or compound arrangements
 */

import type { FBDDiagram } from '../fbd/types';
import { DIAGRAM_PRESETS } from './index';

/**
 * Combine multiple diagrams in series (horizontal arrangement)
 */
export function combineSeries(
    id: string,
    diagrams: Array<{ preset: string; params?: any[] }>,
    spacing: number = 50
): FBDDiagram {
    const elements: string[] = [];
    let currentX = 50;
    const baseY = 200;
    let maxHeight = 400;

    diagrams.forEach((diag, idx) => {
        const presetFn = DIAGRAM_PRESETS[diag.preset];
        if (!presetFn) return;

        const tempId = `temp-${idx}`;
        const params = diag.params || [];
        const diagram = presetFn(tempId, ...params);

        // Wrap diagram in a group and translate
        elements.push(`<g transform="translate(${currentX}, 0)">`);

        if (diagram.customSVG) {
            elements.push(diagram.customSVG);
        } else {
            // Render standard FBD elements
            elements.push(`<!-- Diagram ${idx + 1}: ${diag.preset} -->`);
        }

        elements.push(`</g>`);

        // Add connector arrow
        if (idx < diagrams.length - 1) {
            elements.push(`
        <defs>
          <marker id="arrow-series-${idx}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#666"/>
          </marker>
        </defs>
        <line x1="${currentX + diagram.width}" y1="${baseY}" 
              x2="${currentX + diagram.width + spacing}" y2="${baseY}" 
              stroke="#666" stroke-width="2" marker-end="url(#arrow-series-${idx})"/>
      `);
        }

        currentX += diagram.width + spacing;
        maxHeight = Math.max(maxHeight, diagram.height);
    });

    return {
        id,
        width: currentX + 50,
        height: maxHeight,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Combine multiple diagrams in parallel (vertical arrangement)
 */
export function combineParallel(
    id: string,
    diagrams: Array<{ preset: string; params?: any[] }>,
    spacing: number = 50
): FBDDiagram {
    const elements: string[] = [];
    let currentY = 50;
    const baseX = 100;
    let maxWidth = 600;

    diagrams.forEach((diag, idx) => {
        const presetFn = DIAGRAM_PRESETS[diag.preset];
        if (!presetFn) return;

        const tempId = `temp-${idx}`;
        const params = diag.params || [];
        const diagram = presetFn(tempId, ...params);

        // Wrap diagram in a group and translate
        elements.push(`<g transform="translate(0, ${currentY})">`);

        if (diagram.customSVG) {
            elements.push(diagram.customSVG);
        } else {
            elements.push(`<!-- Diagram ${idx + 1}: ${diag.preset} -->`);
        }

        elements.push(`</g>`);

        // Add label
        elements.push(`
      <text x="20" y="${currentY + diagram.height / 2}" 
            font-size="14" font-weight="bold" fill="#666">
        ${idx + 1}
      </text>
    `);

        currentY += diagram.height + spacing;
        maxWidth = Math.max(maxWidth, diagram.width);
    });

    return {
        id,
        width: maxWidth + 100,
        height: currentY,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Create a grid of diagrams (matrix layout)
 */
export function combineGrid(
    id: string,
    diagrams: Array<{ preset: string; params?: any[]; label?: string }>,
    columns: number = 2,
    spacing: number = 50
): FBDDiagram {
    const elements: string[] = [];
    const cellWidth = 400;
    const cellHeight = 400;

    diagrams.forEach((diag, idx) => {
        const presetFn = DIAGRAM_PRESETS[diag.preset];
        if (!presetFn) return;

        const row = Math.floor(idx / columns);
        const col = idx % columns;
        const x = col * (cellWidth + spacing) + 50;
        const y = row * (cellHeight + spacing) + 50;

        const tempId = `temp-${idx}`;
        const params = diag.params || [];
        const diagram = presetFn(tempId, ...params);

        // Background box
        elements.push(`
      <rect x="${x - 10}" y="${y - 10}" 
            width="${cellWidth + 20}" height="${cellHeight + 20}" 
            fill="#f9fafb" stroke="#e5e7eb" stroke-width="2" rx="10"/>
    `);

        // Diagram
        elements.push(`<g transform="translate(${x}, ${y})">`);

        if (diagram.customSVG) {
            // Scale to fit cell
            const scale = Math.min(cellWidth / diagram.width, cellHeight / diagram.height) * 0.9;
            elements.push(`<g transform="scale(${scale})">`);
            elements.push(diagram.customSVG);
            elements.push(`</g>`);
        }

        elements.push(`</g>`);

        // Label
        const label = diag.label || `${diag.preset}`;
        elements.push(`
      <text x="${x + cellWidth / 2}" y="${y + cellHeight + 30}" 
            font-size="14" font-weight="bold" text-anchor="middle" fill="#333">
        ${label}
      </text>
    `);
    });

    const rows = Math.ceil(diagrams.length / columns);
    const totalWidth = columns * (cellWidth + spacing) + 100;
    const totalHeight = rows * (cellHeight + spacing) + 100;

    return {
        id,
        width: totalWidth,
        height: totalHeight,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Create comparison view (side-by-side with labels)
 */
export function combineComparison(
    id: string,
    diagrams: Array<{ preset: string; params?: any[]; label: string }>,
    title?: string
): FBDDiagram {
    const elements: string[] = [];
    const spacing = 100;
    const cellWidth = 350;
    let currentX = 50;

    // Title
    if (title) {
        elements.push(`
      <text x="${(diagrams.length * (cellWidth + spacing)) / 2}" y="30" 
            font-size="20" font-weight="bold" text-anchor="middle" fill="#333">
        ${title}
      </text>
    `);
    }

    diagrams.forEach((diag, idx) => {
        const presetFn = DIAGRAM_PRESETS[diag.preset];
        if (!presetFn) return;

        const tempId = `temp-${idx}`;
        const params = diag.params || [];
        const diagram = presetFn(tempId, ...params);

        // Label at top
        elements.push(`
      <text x="${currentX + cellWidth / 2}" y="70" 
            font-size="16" font-weight="bold" text-anchor="middle" fill="#2563eb">
        ${diag.label}
      </text>
    `);

        // Diagram
        elements.push(`<g transform="translate(${currentX}, 90)">`);

        if (diagram.customSVG) {
            const scale = Math.min(cellWidth / diagram.width, 0.8);
            elements.push(`<g transform="scale(${scale})">`);
            elements.push(diagram.customSVG);
            elements.push(`</g>`);
        }

        elements.push(`</g>`);

        currentX += cellWidth + spacing;
    });

    return {
        id,
        width: currentX,
        height: 500,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Parse combination syntax
 * Examples:
 * - SERIES:spring,pendulum,incline
 * - PARALLEL:beaker,test-tube,flask
 * - GRID:2:dna,protein,atp,enzyme
 * - COMPARE:Air|pendulum-air,Water|pendulum-water
 */
export function parseCombination(syntax: string): FBDDiagram | null {
    const parts = syntax.split(':');
    const mode = parts[0].toUpperCase();

    if (mode === 'SERIES' && parts.length >= 2) {
        const presets = parts[1].split(',').map(p => ({ preset: p.trim() }));
        return combineSeries('combo-series', presets);
    }

    if (mode === 'PARALLEL' && parts.length >= 2) {
        const presets = parts[1].split(',').map(p => ({ preset: p.trim() }));
        return combineParallel('combo-parallel', presets);
    }

    if (mode === 'GRID' && parts.length >= 3) {
        const columns = parseInt(parts[1]);
        const presets = parts[2].split(',').map(p => ({ preset: p.trim() }));
        return combineGrid('combo-grid', presets, columns);
    }

    if (mode === 'COMPARE' && parts.length >= 2) {
        const items = parts[1].split(',').map(item => {
            const [label, preset] = item.split('|');
            return { preset: preset.trim(), params: [], label: label.trim() };
        });
        return combineComparison('combo-compare', items);
    }

    return null;
}
