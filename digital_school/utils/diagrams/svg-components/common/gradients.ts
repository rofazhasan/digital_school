/**
 * Common SVG Gradients and Filters
 * Reusable visual effects for professional diagrams
 */

export interface GradientDefs {
    metal: string;
    glass: string;
    plastic: string;
    shadow: string;
}

/**
 * Create metal gradient for conductors (copper, gold, silver)
 */
export function createMetalGradient(id: string = 'metalGrad', color: 'copper' | 'gold' | 'silver' = 'copper'): string {
    const colors = {
        copper: { light: '#E8A87C', mid: '#CD7F32', dark: '#B87333' },
        gold: { light: '#FFD700', mid: '#D4AF37', dark: '#B8960F' },
        silver: { light: '#E8E8E8', mid: '#C0C0C0', dark: '#A8A8A8' }
    };

    const c = colors[color];

    return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${c.dark};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${c.light};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c.dark};stop-opacity:1" />
    </linearGradient>
  `;
}

/**
 * Create glass gradient for transparent objects
 */
export function createGlassGradient(id: string = 'glassGrad'): string {
    return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.3" />
      <stop offset="50%" style="stop-color:#FFFFFF;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#E8F4F8;stop-opacity:0.3" />
    </linearGradient>
  `;
}

/**
 * Create plastic/insulator gradient
 */
export function createPlasticGradient(id: string = 'plasticGrad', color: string = '#2C3E50'): string {
    return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
    </linearGradient>
  `;
}

/**
 * Create radial gradient for 3D spheres/circles
 */
export function createRadialGradient(id: string, color: string): string {
    return `
    <radialGradient id="${id}">
      <stop offset="0%" style="stop-color:${adjustBrightness(color, 40)};stop-opacity:1" />
      <stop offset="70%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -30)};stop-opacity:1" />
    </radialGradient>
  `;
}

/**
 * Create drop shadow filter
 */
export function createShadowFilter(id: string = 'shadow', blur: number = 3, offsetX: number = 2, offsetY: number = 2): string {
    return `
    <filter id="${id}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/>
      <feOffset dx="${offsetX}" dy="${offsetY}" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Create glow effect filter
 */
export function createGlowFilter(id: string = 'glow', color: string = '#4A90E2'): string {
    return `
    <filter id="${id}">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Create all common gradients and filters
 */
export function createCommonDefs(): string {
    return `
    <defs>
      ${createMetalGradient('copperGrad', 'copper')}
      ${createMetalGradient('goldGrad', 'gold')}
      ${createMetalGradient('silverGrad', 'silver')}
      ${createGlassGradient('glassGrad')}
      ${createPlasticGradient('plasticGrad', '#2C3E50')}
      ${createShadowFilter('shadow')}
      ${createGlowFilter('glow')}
    </defs>
  `;
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color: string, percent: number): string {
    // Simple brightness adjustment for hex colors
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

/**
 * Create arrow marker for vectors and flow
 */
export function createArrowMarker(id: string = 'arrow', color: string = '#2C3E50', size: number = 10): string {
    return `
    <marker id="${id}" markerWidth="${size}" markerHeight="${size}" 
            refX="${size / 2}" refY="${size / 2}" orient="auto" markerUnits="strokeWidth">
      <polygon points="0 0, ${size} ${size / 2}, 0 ${size}" fill="${color}"/>
    </marker>
  `;
}

/**
 * Create dot marker for connection points
 */
export function createDotMarker(id: string = 'dot', color: string = '#CD7F32', size: number = 4): string {
    return `
    <marker id="${id}" markerWidth="${size * 2}" markerHeight="${size * 2}" 
            refX="${size}" refY="${size}">
      <circle cx="${size}" cy="${size}" r="${size}" fill="${color}"/>
    </marker>
  `;
}
