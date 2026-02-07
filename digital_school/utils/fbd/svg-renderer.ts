import { SVG_DEFS } from '../diagrams/common/gradients';
import type { FBDDiagram, FBDForce, FBDPoint, FBDBody, FBDMoment } from './types';
import { DEFAULT_FBD_CONFIG } from './types';

/**
 * Render FBDDiagram to SVG string
 */
export function renderFBDToSVG(diagram: FBDDiagram): string {
    const { width, height, id } = diagram;
    const config = DEFAULT_FBD_CONFIG;

    let svgContent = SVG_DEFS;

    // 1. Grid (Optional)
    if (diagram.showGrid) {
        svgContent += renderGrid(width, height, config.gridSize, config.gridColor);
    }

    // 2. Axes (Optional)
    if (diagram.showAxes) {
        svgContent += renderAxes(width, height, config.axesColor);
    }

    // 3. Background SVG Layer (Incline planes, etc.)
    if (diagram.backgroundSVG) {
        let innerContent = diagram.backgroundSVG
            .replace(/<svg[^>]*>/, '')
            .replace(/<\/svg>/, '');
        svgContent += `<g class="diagram-background">${innerContent}</g>`;
    }

    // 4. Body (Backward compatibility and multi-body support)
    if (diagram.body) {
        svgContent += renderBody(diagram.body);
    }
    if (diagram.bodies) {
        diagram.bodies.forEach(body => {
            svgContent += renderBody(body);
        });
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

    return `<svg width="100%" height="auto" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="fbd-diagram responsive-svg" id="${id}" style="max-width: ${width}px; background-color: ${diagram.backgroundColor || 'transparent'};">
        <style>
            .fbd-diagram text { 
                font-family: 'Inter', 'Kalpurush', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            }
            .fbd-diagram .math-label { font-family: 'STIX Two Math', 'Latin Modern Math', serif; font-style: italic; }
        </style>
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
    const centerX = Number(body.centerX) || 0;
    const centerY = Number(body.centerY) || 0;
    const width = Number(body.width) || 0;
    const height = Number(body.height) || 0;
    const radius = Number(body.radius) || 0;
    const angle = Number(body.angle) || 0;

    const style = `fill="${body.fill || '#e2e8f0'}" stroke="${body.stroke || '#475569'}" stroke-width="2"`;
    const rotate = angle ? `transform="rotate(${angle}, ${centerX}, ${centerY})"` : '';

    let content = '';
    switch (body.type) {
        case 'rectangle':
            content = `<rect x="${centerX - width / 2}" y="${centerY - height / 2}" 
                             width="${width}" height="${height}" ${style} />`;
            break;
        case 'circle':
            content = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" ${style} />`;
            break;
        case 'triangle':
            const r = radius || (width ? width / 2 : 20);
            const h = r * Math.sqrt(3);
            const p1 = `${centerX},${centerY - r}`;
            const p2 = `${centerX - h / 2},${centerY + r / 2}`;
            const p3 = `${centerX + h / 2},${centerY + r / 2}`;
            content = `<polygon points="${p1} ${p2} ${p3}" ${style} />`;
            break;
    }

    return rotate ? `<g ${rotate}>${content}</g>` : content;
}

function renderPoint(point: FBDPoint): string {
    const x = Number(point.x) || 0;
    const y = Number(point.y) || 0;

    // Render a small dot or specific symbol for supports
    if (point.type === 'fixed') {
        // Draw a small cross or hatch
        return `<circle cx="${x}" cy="${y}" r="3" fill="#000" />
                <path d="M${x - 5},${y} L${x + 5},${y} M${x},${y - 5} L${x},${y + 5}" stroke="#000" stroke-width="1"/>`;
    }
    // Default dot
    return `<circle cx="${x}" cy="${y}" r="2" fill="#000" />
            ${point.label ? `<text x="${x + 5}" y="${y - 5}" font-size="12">${point.label}</text>` : ''}`;
}

function renderForce(force: FBDForce, point: FBDPoint, config: any): string {
    const px = Math.round(Number(point.x) || 0);
    const py = Math.round(Number(point.y) || 0);
    const magnitude = Number(force.magnitude) || 0;
    const angle = Number(force.angle) || 0;

    const angleRad = (angle * Math.PI) / 180;

    // Scale it: Trust magnitude is pixels if > 20, else scale it
    const len = magnitude < 20 ? magnitude * 10 : magnitude;

    const dx = len * Math.cos(angleRad);
    const dy = -len * Math.sin(angleRad); // Invert Y for SVG coords

    const endX = px + dx;
    const endY = py + dy;

    const color = force.color || config.forceColors[force.type || 'applied'] || '#000';

    return `
        <g class="force-vector" filter="url(#vector-glow)">
            <line x1="${px}" y1="${py}" x2="${endX}" y2="${endY}" 
                  stroke="${color}" stroke-width="2.5" stroke-linecap="round"
                  marker-end="url(#arrowhead)" />
            ${force.label ? renderLabel(endX, endY, force.label, color, angleRad) : ''}
        </g>
    `;
}

function renderMoment(moment: FBDMoment, point: FBDPoint): string {
    const px = Number(point.x) || 0;
    const py = Number(point.y) || 0;
    const r = Number(moment.radius) || 30;
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
    const lx = Number(x) || 0;
    const ly = Number(y) || 0;
    const offset = 15;
    const fx = lx + offset * Math.cos(angleRad);
    const fy = ly - offset * Math.sin(angleRad);

    const isMath = text.includes('$') || text.includes('\\') || text.includes('_') || text.includes('^');
    const className = isMath ? 'math-label' : 'bilingual-label';

    return `<text x="${fx}" y="${fy}" fill="${color}" font-size="14" font-family="serif" font-style="italic" text-anchor="middle" dominant-baseline="middle" class="${className}">${parseMathLabel(text)}</text>`;
}

// Convert some basic math syntax to unicode/SVG tspan
function parseMathLabel(text: string): string {
    if (!text) return '';

    // 1. Clean up delimiters
    let cleanText = text.replace(/\$+/g, '').trim();

    // 2. Map common LaTeX symbols to Unicode
    const symbolMap: Record<string, string> = {
        '\\theta': 'θ', '\\pi': 'π', '\\alpha': 'α', '\\beta': 'β',
        '\\gamma': 'γ', '\\Delta': 'Δ', '\\mu': 'μ', '\\Omega': 'Ω',
        '\\phi': 'ϕ', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ',
        '\\omega': 'ω', '\\lambda': 'λ', '\\epsilon': 'ε',
        '\\infty': '∞', '\\approx': '≈', '\\pm': '±', '\\times': '×',
        '\\cdot': '·', '\\degree': '°', '\\deg': '°', '\\nabla': '∇',
        '\\partial': '∂', '\\sqrt': '√', '\\sum': 'Σ', '\\int': '∫'
    };

    Object.entries(symbolMap).forEach(([latex, unicode]) => {
        const escapedLatex = latex.replace(/\\/g, '\\\\');
        cleanText = cleanText.replace(new RegExp(escapedLatex, 'g'), unicode);
    });

    // 3. Handle basic subscript/superscript with tspan
    // Note: We use baseline-shift which is widely supported in SVG
    return cleanText
        .replace(/_\{?(\w+)\}?/g, '<tspan baseline-shift="sub" font-size="0.7em" class="math-sub">$1</tspan>')
        .replace(/\^\{?(\w+)\}?/g, '<tspan baseline-shift="super" font-size="0.7em" class="math-sup">$1</tspan>');
}
