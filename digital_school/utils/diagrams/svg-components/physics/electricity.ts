/**
 * Professional Electricity and Magnetism Components
 * Electric fields, magnetic fields, transformers, motors
 */

export interface ElectricityOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create electric field lines around a point charge
 */
export function createElectricField(
    charge: 'positive' | 'negative' = 'positive',
    options: ElectricityOptions = {}
): string {
    const { width = 140, height = 140, showLabel = true, color = charge === 'positive' ? '#E74C3C' : '#3498DB' } = options;
    const cx = width / 2;
    const cy = height / 2;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="electric-field" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="fieldArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="${color}"/>
        </marker>
        <radialGradient id="chargeGrad">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Central charge -->
      <circle cx="${cx}" cy="${cy}" r="15" fill="url(#chargeGrad)" 
              stroke="#2C3E50" stroke-width="2"/>
      <text x="${cx}" y="${cy + 5}" font-size="18" font-family="Inter, sans-serif" 
            font-weight="bold" fill="white" text-anchor="middle">
        ${charge === 'positive' ? '+' : '−'}
      </text>
      
      <!-- Field lines (8 directions) -->
      ${Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45) * Math.PI / 180;
        const startR = 20;
        const endR = 60;
        const x1 = cx + startR * Math.cos(angle);
        const y1 = cy + startR * Math.sin(angle);
        const x2 = cx + endR * Math.cos(angle);
        const y2 = cy + endR * Math.sin(angle);

        // Reverse direction for negative charge
        const [sx, sy, ex, ey] = charge === 'positive' ? [x1, y1, x2, y2] : [x2, y2, x1, y1];

        return `
          <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" 
                stroke="${color}" stroke-width="2" marker-end="url(#fieldArrow)"/>
        `;
    }).join('')}
      
      ${showLabel ? `
        <text x="${cx}" y="${height - 5}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          ${charge === 'positive' ? 'Positive' : 'Negative'} Charge
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create magnetic field lines around a bar magnet
 */
export function createMagneticField(options: ElectricityOptions = {}): string {
    const { width = 180, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="magnetic-field" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="northGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="southGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Bar magnet -->
      <rect x="60" y="45" width="30" height="30" fill="url(#northGrad)" 
            stroke="#2C3E50" stroke-width="2" rx="2"/>
      <rect x="90" y="45" width="30" height="30" fill="url(#southGrad)" 
            stroke="#2C3E50" stroke-width="2" rx="2"/>
      
      <!-- Pole labels -->
      <text x="75" y="65" font-size="16" font-family="Inter, sans-serif" 
            font-weight="bold" fill="white" text-anchor="middle">N</text>
      <text x="105" y="65" font-size="16" font-family="Inter, sans-serif" 
            font-weight="bold" fill="white" text-anchor="middle">S</text>
      
      <!-- Magnetic field lines (curved) -->
      ${[
            { d: "M 90,35 Q 120,20 150,35", y: 35 },
            { d: "M 90,25 Q 130,5 170,25", y: 25 },
            { d: "M 90,85 Q 120,100 150,85", y: 85 },
            { d: "M 90,95 Q 130,115 170,95", y: 95 },
            { d: "M 60,35 Q 30,20 10,35", y: 35 },
            { d: "M 60,25 Q 20,5 10,25", y: 25 },
            { d: "M 60,85 Q 30,100 10,85", y: 85 },
            { d: "M 60,95 Q 20,115 10,95", y: 95 }
        ].map(({ d }) => `
        <path d="${d}" stroke="#27AE60" stroke-width="2" fill="none" 
              marker-end="url(#magnetArrow)"/>
      `).join('')}
      
      <defs>
        <marker id="magnetArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="90" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Bar Magnet with Field Lines
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create transformer with coils
 */
export function createTransformer(
    primaryTurns: number = 10,
    secondaryTurns: number = 20,
    options: ElectricityOptions = {}
): string {
    const { width = 160, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="transformer" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#95A5A6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7F8C8D;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Iron core -->
      <rect x="65" y="20" width="30" height="80" fill="url(#coreGrad)" 
            stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Primary coil (left) -->
      <g id="primaryCoil">
        ${Array.from({ length: Math.min(primaryTurns, 8) }, (_, i) => `
          <ellipse cx="50" cy="${30 + i * 8}" rx="15" ry="4" 
                   fill="none" stroke="#E74C3C" stroke-width="2.5"/>
        `).join('')}
        <!-- Terminals -->
        <line x1="20" y1="40" x2="35" y2="40" stroke="#CD7F32" stroke-width="3"/>
        <line x1="20" y1="80" x2="35" y2="80" stroke="#CD7F32" stroke-width="3"/>
        <circle cx="20" cy="40" r="3" fill="#CD7F32"/>
        <circle cx="20" cy="80" r="3" fill="#CD7F32"/>
      </g>
      
      <!-- Secondary coil (right) -->
      <g id="secondaryCoil">
        ${Array.from({ length: Math.min(secondaryTurns, 8) }, (_, i) => `
          <ellipse cx="110" cy="${30 + i * 8}" rx="15" ry="4" 
                   fill="none" stroke="#3498DB" stroke-width="2.5"/>
        `).join('')}
        <!-- Terminals -->
        <line x1="125" y1="40" x2="140" y2="40" stroke="#CD7F32" stroke-width="3"/>
        <line x1="125" y1="80" x2="140" y2="80" stroke="#CD7F32" stroke-width="3"/>
        <circle cx="140" cy="40" r="3" fill="#CD7F32"/>
        <circle cx="140" cy="80" r="3" fill="#CD7F32"/>
      </g>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="30" y="15" font-size="10" font-family="Inter, sans-serif" 
              fill="#E74C3C" text-anchor="middle">
          Primary (${primaryTurns})
        </text>
        <text x="130" y="15" font-size="10" font-family="Inter, sans-serif" 
              fill="#3498DB" text-anchor="middle">
          Secondary (${secondaryTurns})
        </text>
        <text x="80" y="115" font-size="9" font-family="Inter, sans-serif" 
              fill="#7F8C8D" text-anchor="middle">
          Iron Core
        </text>
        <text x="80" y="${height + 25}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Transformer (${primaryTurns}:${secondaryTurns})
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create simple DC motor
 */
export function createMotor(options: ElectricityOptions = {}): string {
    const { width = 140, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="dc-motor" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="motorGrad">
          <stop offset="0%" style="stop-color:#ECF0F1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#BDC3C7;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Stator (outer casing) -->
      <circle cx="70" cy="70" r="55" fill="url(#motorGrad)" 
              stroke="#2C3E50" stroke-width="3"/>
      
      <!-- Magnets (N and S poles) -->
      <path d="M 70,20 A 50 50 0 0 1 120,70 L 70,70 Z" fill="#E74C3C" opacity="0.7"/>
      <path d="M 70,70 L 20,70 A 50 50 0 0 1 70,20 Z" fill="#3498DB" opacity="0.7"/>
      <text x="90" y="50" font-size="14" font-family="Inter, sans-serif" 
            font-weight="bold" fill="white">N</text>
      <text x="50" y="50" font-size="14" font-family="Inter, sans-serif" 
            font-weight="bold" fill="white">S</text>
      
      <!-- Rotor (armature) -->
      <circle cx="70" cy="70" r="25" fill="#F39C12" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Coil winding -->
      <rect x="60" y="50" width="20" height="40" fill="#CD7F32" 
            stroke="#8B4513" stroke-width="2" rx="2"/>
      
      <!-- Shaft -->
      <line x1="70" y1="15" x2="70" y2="45" stroke="#7F8C8D" stroke-width="4"/>
      <line x1="70" y1="95" x2="70" y2="125" stroke="#7F8C8D" stroke-width="4"/>
      <circle cx="70" cy="15" r="3" fill="#7F8C8D"/>
      <circle cx="70" cy="125" r="3" fill="#7F8C8D"/>
      
      <!-- Brushes -->
      <rect x="25" y="85" width="10" height="15" fill="#34495E"/>
      <rect x="105" y="85" width="10" height="15" fill="#34495E"/>
      
      <!-- Terminals -->
      <line x1="10" y1="92" x2="25" y2="92" stroke="#CD7F32" stroke-width="3"/>
      <line x1="115" y1="92" x2="130" y2="92" stroke="#CD7F32" stroke-width="3"/>
      <circle cx="10" cy="92" r="3" fill="#E74C3C"/>
      <circle cx="130" cy="92" r="3" fill="#3498DB"/>
      
      ${showLabel ? `
        <text x="5" y="88" font-size="9" font-family="Inter, sans-serif" fill="#E74C3C">+</text>
        <text x="132" y="88" font-size="9" font-family="Inter, sans-serif" fill="#3498DB">−</text>
        <text x="70" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          DC Motor
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create parallel plate capacitor with electric field
 */
export function createParallelPlateCapacitor(options: ElectricityOptions = {}): string {
    const { width = 120, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="parallel-capacitor" xmlns="http://www.w3.org/2000/svg">
      <!-- Positive plate -->
      <rect x="30" y="20" width="60" height="8" fill="#E74C3C" 
            stroke="#C0392B" stroke-width="2"/>
      ${Array.from({ length: 6 }, (_, i) => `
        <text x="${35 + i * 10}" y="17" font-size="12" fill="#E74C3C">+</text>
      `).join('')}
      
      <!-- Negative plate -->
      <rect x="30" y="72" width="60" height="8" fill="#3498DB" 
            stroke="#2980B9" stroke-width="2"/>
      ${Array.from({ length: 6 }, (_, i) => `
        <text x="${35 + i * 10}" y="90" font-size="12" fill="#3498DB">−</text>
      `).join('')}
      
      <!-- Electric field lines (uniform) -->
      ${Array.from({ length: 5 }, (_, i) => `
        <line x1="${35 + i * 12}" y1="32" x2="${35 + i * 12}" y2="68" 
              stroke="#27AE60" stroke-width="2" marker-end="url(#capArrow)"/>
      `).join('')}
      
      <!-- Terminals -->
      <line x1="90" y1="24" x2="110" y2="24" stroke="#CD7F32" stroke-width="3"/>
      <line x1="90" y1="76" x2="110" y2="76" stroke="#CD7F32" stroke-width="3"/>
      <circle cx="110" cy="24" r="3" fill="#E74C3C"/>
      <circle cx="110" cy="76" r="3" fill="#3498DB"/>
      
      <defs>
        <marker id="capArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="60" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Parallel Plate Capacitor
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
