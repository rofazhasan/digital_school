/**
 * Professional Optics Components
 * Mirrors, diffraction, polarization, ray diagrams
 */

export interface OpticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create concave mirror ray diagram
 */
export function createConcaveMirror(options: OpticsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="concave-mirror" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="rayArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      <!-- Mirror (concave curve) -->
      <path d="M 160,30 Q 140,80 160,130" stroke="#7F8C8D" stroke-width="5" fill="none"/>
      
      <!-- Reflective coating (back) -->
      <path d="M 160,30 Q 140,80 160,130" stroke="#95A5A6" stroke-width="3" fill="none"/>
      
      <!-- Principal axis -->
      <line x1="20" y1="80" x2="180" y2="80" stroke="#2C3E50" stroke-width="1.5" stroke-dasharray="3,3"/>
      
      <!-- Focal point (F) -->
      <circle cx="120" cy="80" r="3" fill="#E74C3C"/>
      <text x="120" y="95" font-size="10" fill="#E74C3C" text-anchor="middle">F</text>
      
      <!-- Center of curvature (C) -->
      <circle cx="80" cy="80" r="3" fill="#3498DB"/>
      <text x="80" y="95" font-size="10" fill="#3498DB" text-anchor="middle">C</text>
      
      <!-- Object -->
      <line x1="40" y1="80" x2="40" y2="50" stroke="#27AE60" stroke-width="3"/>
      <polygon points="37,52 40,50 43,52" fill="#27AE60"/>
      <text x="40" y="45" font-size="9" fill="#27AE60" text-anchor="middle">Object</text>
      
      <!-- Ray 1: Parallel to axis, reflects through F -->
      <line x1="40" y1="50" x2="145" y2="50" stroke="#F39C12" stroke-width="2" marker-end="url(#rayArrow)"/>
      <line x1="145" y1="50" x2="120" y2="80" stroke="#F39C12" stroke-width="2"/>
      
      <!-- Ray 2: Through F, reflects parallel -->
      <line x1="40" y1="50" x2="120" y2="80" stroke="#9B59B6" stroke-width="2"/>
      <line x1="120" y1="80" x2="145" y2="110" stroke="#9B59B6" stroke-width="2" marker-end="url(#rayArrow)"/>
      
      <!-- Ray 3: Through C, reflects back -->
      <line x1="40" y1="50" x2="80" y2="80" stroke="#E74C3C" stroke-width="2"/>
      <line x1="80" y1="80" x2="40" y2="110" stroke="#E74C3C" stroke-width="2" marker-end="url(#rayArrow)"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Concave Mirror Ray Diagram
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create convex mirror ray diagram
 */
export function createConvexMirror(options: OpticsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="convex-mirror" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="rayArrowConvex" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      <!-- Mirror (convex curve) -->
      <path d="M 40,30 Q 60,80 40,130" stroke="#7F8C8D" stroke-width="5" fill="none"/>
      
      <!-- Principal axis -->
      <line x1="20" y1="80" x2="180" y2="80" stroke="#2C3E50" stroke-width="1.5" stroke-dasharray="3,3"/>
      
      <!-- Focal point (F) - behind mirror -->
      <circle cx="80" cy="80" r="3" fill="#E74C3C" opacity="0.5"/>
      <text x="80" y="95" font-size="10" fill="#E74C3C" text-anchor="middle">F</text>
      
      <!-- Object -->
      <line x1="120" y1="80" x2="120" y2="50" stroke="#27AE60" stroke-width="3"/>
      <polygon points="117,52 120,50 123,52" fill="#27AE60"/>
      <text x="120" y="45" font-size="9" fill="#27AE60" text-anchor="middle">Object</text>
      
      <!-- Ray 1: Parallel to axis, diverges as if from F -->
      <line x1="120" y1="50" x2="55" y2="50" stroke="#F39C12" stroke-width="2"/>
      <line x1="55" y1="50" x2="20" y2="35" stroke="#F39C12" stroke-width="2" marker-end="url(#rayArrowConvex)"/>
      <line x1="55" y1="50" x2="80" y2="80" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.5"/>
      
      <!-- Ray 2: Toward F, reflects parallel -->
      <line x1="120" y1="50" x2="55" y2="65" stroke="#9B59B6" stroke-width="2"/>
      <line x1="55" y1="65" x2="20" y2="65" stroke="#9B59B6" stroke-width="2" marker-end="url(#rayArrowConvex)"/>
      
      <!-- Virtual image (dashed) -->
      <line x1="90" y1="80" x2="90" y2="65" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3" opacity="0.6"/>
      <text x="90" y="60" font-size="8" fill="#27AE60" text-anchor="middle">Virtual Image</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Convex Mirror Ray Diagram
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create diffraction pattern
 */
export function createDiffraction(options: OpticsOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="diffraction" xmlns="http://www.w3.org/2000/svg">
      <!-- Slit -->
      <rect x="80" y="30" width="5" height="80" fill="#2C3E50"/>
      <rect x="80" y="55" width="5" height="30" fill="white"/>
      <text x="70" y="75" font-size="9" fill="#2C3E50">Slit</text>
      
      <!-- Incident wave -->
      ${Array.from({ length: 5 }, (_, i) => {
        const y = 40 + i * 15;
        return `
          <path d="M 20,${y} Q 35,${y - 5} 50,${y} Q 65,${y + 5} 80,${y}" 
                stroke="#3498DB" stroke-width="2" fill="none"/>
        `;
    }).join('')}
      
      <!-- Diffracted waves (spreading) -->
      ${Array.from({ length: 7 }, (_, i) => {
        const angle = -30 + i * 10;
        const rad = (angle * Math.PI) / 180;
        const x2 = 85 + 60 * Math.cos(rad);
        const y2 = 70 + 60 * Math.sin(rad);
        return `
          <line x1="85" y1="70" x2="${x2}" y2="${y2}" 
                stroke="#F39C12" stroke-width="1.5" opacity="${0.3 + (3 - Math.abs(i - 3)) * 0.2}"/>
        `;
    }).join('')}
      
      <!-- Screen -->
      <rect x="180" y="20" width="5" height="100" fill="#95A5A6"/>
      <text x="190" y="70" font-size="9" fill="#2C3E50">Screen</text>
      
      <!-- Intensity pattern on screen -->
      ${Array.from({ length: 5 }, (_, i) => {
        const y = 40 + i * 15;
        const intensity = i === 2 ? 1 : 0.3 / (Math.abs(i - 2) + 1);
        return `
          <rect x="185" y="${y - 2}" width="${intensity * 15}" height="4" 
                fill="#F39C12" opacity="${intensity}"/>
        `;
    }).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Single-Slit Diffraction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create polarization diagram
 */
export function createPolarization(options: OpticsOptions = {}): string {
    const { width = 200, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="polarization" xmlns="http://www.w3.org/2000/svg">
      <!-- Unpolarized light (left) -->
      <g id="unpolarized">
        ${Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45);
        const rad = (angle * Math.PI) / 180;
        const x1 = 40 + 10 * Math.cos(rad);
        const y1 = 60 + 10 * Math.sin(rad);
        const x2 = 40 - 10 * Math.cos(rad);
        const y2 = 60 - 10 * Math.sin(rad);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                        stroke="#3498DB" stroke-width="2"/>`;
    }).join('')}
        <text x="40" y="85" font-size="9" fill="#2C3E50" text-anchor="middle">Unpolarized</text>
      </g>
      
      <!-- Polarizer -->
      <rect x="75" y="30" width="8" height="60" fill="#7F8C8D" opacity="0.7"/>
      <line x1="75" y1="30" x2="83" y2="90" stroke="#2C3E50" stroke-width="2"/>
      <text x="79" y="105" font-size="8" fill="#2C3E50" text-anchor="middle">Polarizer</text>
      
      <!-- Polarized light (vertical) -->
      <g id="polarized">
        <line x1="120" y1="45" x2="120" y2="75" stroke="#27AE60" stroke-width="3"/>
        <line x1="140" y1="45" x2="140" y2="75" stroke="#27AE60" stroke-width="3"/>
        <line x1="160" y1="45" x2="160" y2="75" stroke="#27AE60" stroke-width="3"/>
        <text x="140" y="95" font-size="9" fill="#27AE60" text-anchor="middle">Polarized</text>
      </g>
      
      <!-- Direction arrow -->
      <line x1="50" y1="60" x2="70" y2="60" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="70,57 75,60 70,63" fill="#E74C3C"/>
      
      <line x1="90" y1="60" x2="110" y2="60" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="110,57 115,60 110,63" fill="#E74C3C"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Light Polarization
        </text>
      ` : ''}
    </svg>
  `;
}
