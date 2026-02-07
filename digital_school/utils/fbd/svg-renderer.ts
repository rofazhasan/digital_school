
import type { FBDDiagram, FBDForce, FBDPoint, FBDBody, FBDMoment } from './types';
import { DEFAULT_FBD_CONFIG } from './types';

/**
 * Render FBDDiagram to SVG string
 */
export function renderFBDToSVG(diagram: FBDDiagram): string {
    const { width, height, id } = diagram;
    const config = DEFAULT_FBD_CONFIG;

    let svgContent = '';

    // 1. Grid (Optional)
    if (diagram.showGrid) {
        svgContent += renderGrid(width, height, config.gridSize, config.gridColor);
    }

    // 2. Axes (Optional)
    if (diagram.showAxes) {
        svgContent += renderAxes(width, height, config.axesColor);
    }

    // 3. Body
    if (diagram.body) {
        svgContent += renderBody(diagram.body);
    }

    // 4. Points (Fixed supports, etc.)
    diagram.points.forEach(point => {
        svgContent += renderPoint(point);
    });

    // 5. Forces
    diagram.forces.forEach(force => {
        const point = diagram.points.find(p => p.id === force.pointId);
        if (point) {
            svgContent += renderForce(force, point, config);
        }
    });

    // 6. Moments
    if (diagram.moments) {
        diagram.moments.forEach(moment => {
            const point = diagram.points.find(p => p.id === moment.pointId);
            if (point) {
                svgContent += renderMoment(moment, point);
            }
        });
    }

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="fbd-diagram" id="${id}">
        <rect width="${width}" height="${height}" fill="${diagram.backgroundColor || 'transparent'}" />
        ${svgContent}
    </svg>`;
}

function renderGrid(w: number, h: number, size: number, color: string): string {
    let path = '';
    for (let x = size; x < w; x += size) path += `M${x},0 L${x},${h} `;
    for (let y = size; y < h; y += size) path += `M0,${y} L${w},${y} `;
    return `<path d="${path}" stroke="${color}" stroke-width="1" fill="none" opacity="0.5" />`;
}

function renderAxes(w: number, h: number, color: string): string {
    // Simple center axes or corner axes? Usually center for specific diagrams, creates visual context
    // For general FBDs, usually we don't draw full axes unless specified.
    // Let's assume typical MathJax coord system style: thin lines
    // But mostly we just want a reference frame indicator
    return ''; // Placeholder: usually individual components handle their own context lines
}

function renderBody(body: FBDBody): string {
    const style = `fill="${body.fill || '#e2e8f0'}" stroke="${body.stroke || '#475569'}" stroke-width="2"`;

    switch (body.type) {
        case 'rectangle':
            return `<rect x="${body.centerX - (body.width || 0) / 2}" y="${body.centerY - (body.height || 0) / 2}" 
                          width="${body.width}" height="${body.height}" ${style} />`;
        case 'circle':
            return `<circle cx="${body.centerX}" cy="${body.centerY}" r="${body.radius}" ${style} />`;
        case 'triangle':
            // Simple equilateral/isosceles approximation based on radius/width
            const r = body.radius || (body.width ? body.width / 2 : 20);
            const h = r * Math.sqrt(3);
            const p1 = `${body.centerX},${body.centerY - r}`;
            const p2 = `${body.centerX - h / 2},${body.centerY + r / 2}`;
            const p3 = `${body.centerX + h / 2},${body.centerY + r / 2}`;
            return `<polygon points="${p1} ${p2} ${p3}" ${style} />`;
        default:
            return '';
    }
}

function renderPoint(point: FBDPoint): string {
    // Render a small dot or specific symbol for supports
    if (point.type === 'fixed') {
        // Draw a small cross or hatch
        return `<circle cx="${point.x}" cy="${point.y}" r="3" fill="#000" />
                <path d="M${point.x - 5},${point.y} L${point.x + 5},${point.y} M${point.x},${point.y - 5} L${point.x},${point.y + 5}" stroke="#000" stroke-width="1"/>`;
    }
    // Default dot
    return `<circle cx="${point.x}" cy="${point.y}" r="2" fill="#000" />
            ${point.label ? `<text x="${point.x + 5}" y="${point.y - 5}" font-size="12" font-family="sans-serif">${point.label}</text>` : ''}`;
}

function renderForce(force: FBDForce, point: FBDPoint, config: any): string {
    const angleRad = (force.angle * Math.PI) / 180;
    // Standard force length if magnitude is abstract, or scale it
    // For FBDs, magnitude often determines length relative to others
    // Let's use a base scale factor
    const length = force.magnitude > 0 ? force.magnitude * 2 : 60; // Heuristic

    // BUT usually 'magnitude' in our builder is implicitly the length in pixels for some presets
    // Let's trust the 'magnitude' is pixels for now if > 20, else scale it
    const len = force.magnitude < 20 ? force.magnitude * 10 : force.magnitude;

    // Coordinate system: SVG y is down.
    // Mathematical angle is usually CCW from X-axis.
    // So x = len * cos(theta), y = -len * sin(theta) (because y is flipped)
    // However, our data might assume specialized angle logic.
    // Checking mechanics.ts: 
    // .addForce('tension', 'm1', 80, 90, 'T', 'tension') -> 90 degrees usually means UP
    // cos(90)=0, sin(90)=1. y should decrease.
    // So endY = startY - len * sin(theta)

    const dx = len * Math.cos(angleRad);
    const dy = -len * Math.sin(angleRad); // Invert Y for SVG coords

    const endX = point.x + dx;
    const endY = point.y + dy;

    const color = force.color || config.forceColors[force.type || 'applied'] || '#000';

    // Arrowhead logic
    const headSize = 10;
    const angleFromX = Math.atan2(dy, dx);
    const x1 = endX - headSize * Math.cos(angleFromX - Math.PI / 6);
    const y1 = endY - headSize * Math.sin(angleFromX - Math.PI / 6);
    const x2 = endX - headSize * Math.cos(angleFromX + Math.PI / 6);
    const y2 = endY - headSize * Math.sin(angleFromX + Math.PI / 6);

    return `
        <g class="force-vector">
            <line x1="${point.x}" y1="${point.y}" x2="${endX}" y2="${endY}" stroke="${color}" stroke-width="2.5" />
            <polygon points="${endX},${endY} ${x1},${y1} ${x2},${y2}" fill="${color}" />
            ${force.label ? renderLabel(endX, endY, force.label, color, angleRad) : ''}
        </g>
    `;
}

function renderMoment(moment: FBDMoment, point: FBDPoint): string {
    // Curved arrow around point
    const r = moment.radius || 30;
    // CW or CCW
    // Draw an arc of ~270 degrees
    // Start angle depends on direction
    const color = '#9333ea'; // Purple for torque

    // Simple arc
    const largeArc = 1;
    const sweep = moment.direction === 'cw' ? 1 : 0;

    // Start top, go around
    const startX = point.x;
    const startY = point.y - r;
    const endX = point.x - r; // Quarter turn roughly
    const endY = point.y;

    // Better path
    const path = `M${point.x + r * 0.8},${point.y - r * 0.6} A${r},${r} 0 1,${sweep} ${point.x - r * 0.8},${point.y - r * 0.6}`;

    // Arrowhead at end
    // Too complex to calculate perfectly without vector math library, using approximation
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${moment.direction})" />
            ${moment.label ? `<text x="${point.x + r + 5}" y="${point.y - r}" fill="${color}" font-size="12">${moment.label}</text>` : ''}`;
}

function renderLabel(x: number, y: number, text: string, color: string, angleRad: number): string {
    // Offset label slightly away from arrow tip
    const offset = 15;
    const lx = x + offset * Math.cos(angleRad);
    const ly = y - offset * Math.sin(angleRad); // Remember Y flip
    return `<text x="${lx}" y="${ly}" fill="${color}" font-size="14" font-family="serif" font-style="italic" text-anchor="middle" dominant-baseline="middle">${parseMathLabel(text)}</text>`;
}

// Convert some basic math syntax to unicode/SVG tspan
function parseMathLabel(text: string): string {
    // basic subscript: m1 -> m<tspan..>1</tspan>
    return text.replace(/_(\w+)/g, '<tspan baseline-shift="sub" font-size="0.7em">$1</tspan>')
        .replace(/\^(\w+)/g, '<tspan baseline-shift="super" font-size="0.7em">$1</tspan>');
}
