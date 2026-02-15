/**
 * Professional Wave and Optics Components
 * Realistic wave diagrams, lenses, mirrors, and optical phenomena
 */

export interface WaveOpticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create professional sine wave
 */
export function createWave(
    amplitude: number,
    wavelength: number,
    cycles: number = 2,
    options: WaveOpticsOptions = {}
): string {
    const { width = 200, height = 100, showLabel = true, color = '#3498DB' } = options;

    // Generate smooth sine wave path
    const points: string[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const angle = (i / steps) * cycles * 2 * Math.PI;
        const y = height / 2 + amplitude * Math.sin(angle);
        points.push(i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="wave-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${adjustBrightness(color, 20)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Equilibrium line -->
      <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" 
            stroke="#95A5A6" stroke-width="1" stroke-dasharray="5,5"/>
      
      <!-- Wave -->
      <path d="${points.join(' ')}" stroke="url(#waveGrad)" stroke-width="3" 
            fill="none" stroke-linecap="round"/>
      
      ${showLabel ? `
        <!-- Amplitude marker -->
        <line x1="${width / 4}" y1="${height / 2}" x2="${width / 4}" y2="${height / 2 - amplitude}" 
              stroke="#E74C3C" stroke-width="2" marker-end="url(#arrowhead)"/>
        <text x="${width / 4 + 10}" y="${height / 2 - amplitude / 2}" 
              font-size="11" font-family="Inter, sans-serif" fill="#E74C3C">
          A=${amplitude}
        </text>
        
        <!-- Wavelength marker -->
        <line x1="0" y1="${height - 10}" x2="${width / cycles}" y2="${height - 10}" 
              stroke="#27AE60" stroke-width="2"/>
        <text x="${width / (2 * cycles)}" y="${height - 15}" 
              font-size="11" font-family="Inter, sans-serif" fill="#27AE60" text-anchor="middle">
          λ=${wavelength}
        </text>
      ` : ''}
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
    </svg>
  `;
}

/**
 * Create professional convex lens
 */
export function createLens(
    type: 'convex' | 'concave' = 'convex',
    focalLength: number = 10,
    options: WaveOpticsOptions = {}
): string {
    const { width = 120, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="lens-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Glass gradient -->
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.4" />
          <stop offset="50%" style="stop-color:#FFFFFF;stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:#E8F4F8;stop-opacity:0.4" />
        </linearGradient>
      </defs>
      
      <!-- Principal axis -->
      <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" 
            stroke="#2C3E50" stroke-width="1.5" stroke-dasharray="3,3"/>
      
      ${type === 'convex' ? `
        <!-- Convex lens shape -->
        <path d="M ${width / 2 - 15},10 Q ${width / 2},${height / 2} ${width / 2 - 15},${height - 10}" 
              fill="url(#lensGrad)" stroke="#3498DB" stroke-width="3"/>
        <path d="M ${width / 2 + 15},10 Q ${width / 2},${height / 2} ${width / 2 + 15},${height - 10}" 
              fill="url(#lensGrad)" stroke="#3498DB" stroke-width="3"/>
        
        <!-- Focal points -->
        <circle cx="${width / 2 - focalLength * 3}" cy="${height / 2}" r="3" fill="#E74C3C"/>
        <circle cx="${width / 2 + focalLength * 3}" cy="${height / 2}" r="3" fill="#E74C3C"/>
        
        ${showLabel ? `
          <text x="${width / 2 - focalLength * 3}" y="${height / 2 + 15}" 
                font-size="10" font-family="Inter, sans-serif" fill="#E74C3C" text-anchor="middle">
            F
          </text>
          <text x="${width / 2 + focalLength * 3}" y="${height / 2 + 15}" 
                font-size="10" font-family="Inter, sans-serif" fill="#E74C3C" text-anchor="middle">
            F'
          </text>
          <text x="${width / 2}" y="${height + 25}" 
                font-size="11" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
            Convex Lens (f=${focalLength}cm)
          </text>
        ` : ''}
      ` : `
        <!-- Concave lens shape -->
        <path d="M ${width / 2 - 15},10 Q ${width / 2 - 20},${height / 2} ${width / 2 - 15},${height - 10}" 
              fill="url(#lensGrad)" stroke="#3498DB" stroke-width="3"/>
        <path d="M ${width / 2 + 15},10 Q ${width / 2 + 20},${height / 2} ${width / 2 + 15},${height - 10}" 
              fill="url(#lensGrad)" stroke="#3498DB" stroke-width="3"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 25}" 
                font-size="11" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
            Concave Lens (f=${focalLength}cm)
          </text>
        ` : ''}
      `}
      
      <!-- Center marker -->
      <line x1="${width / 2}" y1="${height / 2 - 5}" x2="${width / 2}" y2="${height / 2 + 5}" 
            stroke="#2C3E50" stroke-width="2"/>
    </svg>
  `;
}

/**
 * Create professional prism with refraction
 */
export function createPrism(options: WaveOpticsOptions = {}): string {
    const { width = 150, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="prism-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Glass prism gradient -->
        <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#BDC3C7;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      
      <!-- Prism (equilateral triangle) -->
      <path d="M 60,20 L 110,90 L 10,90 Z" 
            fill="url(#prismGrad)" stroke="#3498DB" stroke-width="3"/>
      
      <!-- Incident white light -->
      <line x1="0" y1="50" x2="50" y2="50" 
            stroke="#ECF0F1" stroke-width="4"/>
      
      <!-- Refracted spectrum (rainbow) -->
      ${[
            { color: '#E74C3C', angle: -15, label: 'Red' },
            { color: '#E67E22', angle: -10, label: 'Orange' },
            { color: '#F39C12', angle: -5, label: 'Yellow' },
            { color: '#27AE60', angle: 0, label: 'Green' },
            { color: '#3498DB', angle: 5, label: 'Blue' },
            { color: '#8E44AD', angle: 10, label: 'Violet' }
        ].map(({ color, angle }) => {
            const startX = 85;
            const startY = 70;
            const endX = startX + 50 * Math.cos((angle - 30) * Math.PI / 180);
            const endY = startY + 50 * Math.sin((angle - 30) * Math.PI / 180);
            return `
          <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
                stroke="${color}" stroke-width="3" opacity="0.9"/>
        `;
        }).join('')}
      
      ${showLabel ? `
        <text x="75" y="115" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Dispersion of Light
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create interference pattern
 */
export function createInterference(
    slitSeparation: number = 2,
    options: WaveOpticsOptions = {}
): string {
    const { width = 180, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="interference-diagram" xmlns="http://www.w3.org/2000/svg">
      <!-- Double slit -->
      <rect x="40" y="20" width="5" height="35" fill="#2C3E50"/>
      <rect x="40" y="65" width="5" height="35" fill="#2C3E50"/>
      
      <!-- Slits (gaps) -->
      <rect x="40" y="55" width="5" height="${slitSeparation * 5}" fill="#ECF0F1"/>
      
      <!-- Incident wave -->
      <line x1="0" y1="60" x2="40" y2="60" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Interference pattern (bright and dark fringes) -->
      ${Array.from({ length: 7 }, (_, i) => {
        const y = 20 + i * 13;
        const brightness = Math.abs(Math.cos(i * Math.PI / 3));
        return `
          <rect x="120" y="${y}" width="40" height="10" 
                fill="#F39C12" opacity="${brightness}"/>
        `;
    }).join('')}
      
      <!-- Wave paths -->
      <path d="M 45,47 Q 80,40 120,35" stroke="#3498DB" stroke-width="1.5" 
            fill="none" stroke-dasharray="3,3"/>
      <path d="M 45,60 Q 80,60 120,60" stroke="#3498DB" stroke-width="1.5" 
            fill="none" stroke-dasharray="3,3"/>
      
      ${showLabel ? `
        <text x="90" y="115" font-size="10" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Interference Pattern
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Helper function to adjust color brightness
 */
function adjustBrightness(color: string, percent: number): string {
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
