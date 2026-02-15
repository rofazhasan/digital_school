/**
 * Smart Labeling and Annotation System
 * Automatically adds values, units, and coordinates to diagram elements
 */

import type { FBDDiagram, FBDForce, FBDPoint } from '../fbd/types';

export interface SmartLabel {
    text: string;
    value?: number;
    unit?: string;
    position: { x: number; y: number };
    type: 'force' | 'resistance' | 'voltage' | 'current' | 'mass' | 'length' | 'angle' | 'coordinate';
    color?: string;
}

/**
 * Add smart labels to forces
 */
export function addForceLabels(force: FBDForce, point: FBDPoint, showValue: boolean = true, showCoordinates: boolean = false): SmartLabel[] {
    const labels: SmartLabel[] = [];

    // Main force label with value
    if (showValue && force.label) {
        const match = force.label.match(/^([A-Za-z_]+)(?:=)?(\d+(?:\.\d+)?)?([A-Za-z]+)?$/);

        if (match) {
            const [, name, value, unit] = match;
            labels.push({
                text: value && unit ? `${name} = ${value}${unit}` : force.label,
                value: value ? parseFloat(value) : undefined,
                unit: unit || 'N',
                position: { x: point.x, y: point.y },
                type: 'force',
                color: getForceColor(force.type || 'applied'), // Check for type existence
            });
        } else {
            labels.push({
                text: force.label,
                position: { x: point.x, y: point.y },
                type: 'force',
                color: getForceColor(force.type || 'applied'),
            });
        }
    }

    // Coordinate label
    if (showCoordinates) {
        labels.push({
            text: `(${point.x.toFixed(0)}, ${point.y.toFixed(0)})`,
            position: { x: point.x, y: point.y + 20 },
            type: 'coordinate',
            color: '#6b7280',
        });
    }

    return labels;
}

/**
 * Add smart labels to circuit elements
 */
export function addCircuitLabels(element: {
    type: 'resistor' | 'capacitor' | 'inductor' | 'battery';
    value: number;
    position: { x: number; y: number };
}, showCoordinates: boolean = false): SmartLabel[] {
    const labels: SmartLabel[] = [];

    // Value with unit
    const units = {
        resistor: 'Ω',
        capacitor: 'F',
        inductor: 'H',
        battery: 'V',
    };

    labels.push({
        text: `${element.value}${units[element.type]}`,
        value: element.value,
        unit: units[element.type],
        position: element.position,
        type: element.type === 'resistor' ? 'resistance' :
            element.type === 'battery' ? 'voltage' : 'force',
        color: '#2563eb',
    });

    // Coordinates
    if (showCoordinates) {
        labels.push({
            text: `(${element.position.x}, ${element.position.y})`,
            position: { x: element.position.x, y: element.position.y + 15 },
            type: 'coordinate',
            color: '#6b7280',
        });
    }

    return labels;
}

/**
 * Add smart labels to points
 */
export function addPointLabels(point: FBDPoint, showCoordinates: boolean = true): SmartLabel[] {
    const labels: SmartLabel[] = [];

    // Point name
    if (point.label) {
        labels.push({
            text: point.label,
            position: { x: point.x, y: point.y - 10 },
            type: 'force',
            color: '#1f2937',
        });
    }

    // Coordinates
    if (showCoordinates) {
        labels.push({
            text: `(${point.x.toFixed(0)}, ${point.y.toFixed(0)})`,
            position: { x: point.x, y: point.y + 15 },
            type: 'coordinate',
            color: '#9ca3af',
        });
    }

    return labels;
}

/**
 * Generate tooltip content for interactive diagrams
 */
export function generateTooltip(element: {
    type: string;
    label?: string;
    value?: number;
    unit?: string;
    angle?: number;
    magnitude?: number;
}): string {
    const parts: string[] = [];

    parts.push(`<strong>${element.type.toUpperCase()}</strong>`);

    if (element.label) {
        parts.push(`Label: ${element.label}`);
    }

    if (element.value !== undefined && element.unit) {
        parts.push(`Value: ${element.value}${element.unit}`);
    }

    if (element.magnitude !== undefined) {
        parts.push(`Magnitude: ${element.magnitude.toFixed(2)}`);
    }

    if (element.angle !== undefined) {
        parts.push(`Angle: ${element.angle.toFixed(1)}°`);
    }

    return parts.join('<br>');
}

/**
 * Add measurement annotations
 */
export function addMeasurementAnnotation(
    start: { x: number; y: number },
    end: { x: number; y: number },
    label: string,
    unit: string = 'm'
): string {
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    return `
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
          stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,5"/>
    <circle cx="${start.x}" cy="${start.y}" r="3" fill="#f59e0b"/>
    <circle cx="${end.x}" cy="${end.y}" r="3" fill="#f59e0b"/>
    <text x="${midX}" y="${midY - 10}" 
          font-size="12" font-weight="bold" fill="#f59e0b" text-anchor="middle">
      ${label} = ${(distance / 20).toFixed(2)}${unit}
    </text>
  `;
}

/**
 * Add angle annotation
 */
export function addAngleAnnotation(
    center: { x: number; y: number },
    angle: number,
    radius: number = 40,
    label?: string
): string {
    const endX = center.x + radius * Math.cos((angle * Math.PI) / 180);
    const endY = center.y - radius * Math.sin((angle * Math.PI) / 180);

    const arcPath = describeArc(center.x, center.y, radius, 0, angle);

    return `
    <path d="${arcPath}" fill="none" stroke="#10b981" stroke-width="2"/>
    <text x="${center.x + radius * 0.6}" y="${center.y - radius * 0.3}" 
          font-size="11" font-weight="bold" fill="#10b981">
      ${label || `${angle.toFixed(1)}°`}
    </text>
  `;
}

/**
 * Helper: Describe SVG arc
 */
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY - (radius * Math.sin(angleInRadians))
    };
}

/**
 * Get force color based on type
 */
function getForceColor(type: string): string {
    const colors: Record<string, string> = {
        weight: '#ef4444',
        normal: '#3b82f6',
        friction: '#f59e0b',
        tension: '#8b5cf6',
        applied: '#10b981',
        spring: '#ec4899',
    };
    return colors[type] || '#6b7280';
}

/**
 * Format value with smart units
 */
export function formatValue(value: number, type: 'force' | 'resistance' | 'voltage' | 'current' | 'mass'): string {
    const units = {
        force: 'N',
        resistance: 'Ω',
        voltage: 'V',
        current: 'A',
        mass: 'kg',
    };

    // Smart formatting for large/small values
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)}k${units[type]}`;
    } else if (Math.abs(value) < 0.001 && value !== 0) {
        return `${(value * 1000).toFixed(2)}m${units[type]}`;
    } else {
        return `${value.toFixed(2)}${units[type]}`;
    }
}
