/**
 * Professional Electromagnetism Components
 * Electromagnetic induction, AC generator, LC circuit
 */

export interface ElectromagnetismOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create electromagnetic induction diagram
 */
export function createEMInduction(options: ElectromagnetismOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="em-induction" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowEM" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Coil -->
      ${[0, 1, 2, 3].map(i => {
        const y = 60 + i * 20;
        return `<ellipse cx="120" cy="${y}" rx="30" ry="8" fill="none" stroke="#3498DB" stroke-width="2.5"/>`;
    }).join('')}
      
      <!-- Magnet (moving) -->
      <rect x="30" y="80" width="50" height="40" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="3"/>
      <text x="55" y="95" font-size="12" fill="white" text-anchor="middle" font-weight="600">N</text>
      <text x="55" y="115" font-size="12" fill="white" text-anchor="middle" font-weight="600">S</text>
      
      <!-- Velocity arrow -->
      <line x1="85" y1="100" x2="105" y2="100" stroke="#F39C12" stroke-width="3" marker-end="url(#arrowEM)"/>
      <text x="95" y="95" font-size="10" fill="#F39C12">v</text>
      
      <!-- Magnetic field lines -->
      ${[0, 1, 2].map(i => {
        const x = 40 + i * 15;
        return `<path d="M ${x},75 Q ${x + 10},60 ${x + 20},75" stroke="#9B59B6" stroke-width="1.5" fill="none" opacity="0.5"/>`;
    }).join('')}
      
      <!-- Induced current -->
      <path d="M 150,70 L 170,70 L 170,130 L 150,130" stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="175" y="100" font-size="10" fill="#27AE60">I<tspan font-size="7" baseline-shift="sub">induced</tspan></text>
      
      <!-- Equation -->
      <text x="100" y="165" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        ε = -dΦ<tspan font-size="8" baseline-shift="sub">B</tspan>/dt
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Electromagnetic Induction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create AC generator diagram
 */
export function createACGenerator(options: ElectromagnetismOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ac-generator" xmlns="http://www.w3.org/2000/svg">
      <!-- Magnetic field (N and S poles) -->
      <rect x="40" y="50" width="30" height="80" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="55" y="95" font-size="14" fill="#E74C3C" font-weight="600">N</text>
      
      <rect x="130" y="50" width="30" height="80" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="145" y="95" font-size="14" fill="#3498DB" font-weight="600">S</text>
      
      <!-- Rotating coil -->
      <ellipse cx="100" cy="90" rx="25" ry="35" fill="none" stroke="#27AE60" stroke-width="3" transform="rotate(30 100 90)"/>
      
      <!-- Rotation axis -->
      <line x1="100" y1="40" x2="100" y2="140" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Rotation arrow -->
      <path d="M 115,60 A 20,20 0 0,1 120,80" stroke="#F39C12" stroke-width="2" fill="none"/>
      <polygon points="120,80 118,75 123,77" fill="#F39C12"/>
      <text x="125" y="70" font-size="10" fill="#F39C12">ω</text>
      
      <!-- Output terminals -->
      <circle cx="100" cy="40" r="5" fill="#7F8C8D" stroke="#2C3E50" stroke-width="1.5"/>
      <circle cx="100" cy="140" r="5" fill="#7F8C8D" stroke="#2C3E50" stroke-width="1.5"/>
      
      <!-- AC output wave -->
      <path d="M 20,160 Q 40,150 60,160 Q 80,170 100,160 Q 120,150 140,160 Q 160,170 180,160" 
            stroke="#9B59B6" stroke-width="2" fill="none"/>
      <text x="185" y="163" font-size="9" fill="#9B59B6">AC</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          AC Generator
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create LC circuit diagram
 */
export function createLCCircuit(options: ElectromagnetismOptions = {}): string {
    const { width = 180, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="lc-circuit" xmlns="http://www.w3.org/2000/svg">
      <!-- Circuit loop -->
      <rect x="40" y="40" width="100" height="80" fill="none" stroke="#2C3E50" stroke-width="2" rx="5"/>
      
      <!-- Inductor (coil) -->
      ${[0, 1, 2, 3].map(i => {
        const x = 50 + i * 10;
        return `<path d="M ${x},40 Q ${x + 5},30 ${x + 10},40" stroke="#3498DB" stroke-width="2.5" fill="none"/>`;
    }).join('')}
      <text x="70" y="25" font-size="10" fill="#3498DB" text-anchor="middle">L</text>
      
      <!-- Capacitor -->
      <line x1="120" y1="50" x2="120" y2="70" stroke="#E74C3C" stroke-width="3"/>
      <line x1="125" y1="50" x2="125" y2="70" stroke="#E74C3C" stroke-width="3"/>
      <text x="122" y="85" font-size="10" fill="#E74C3C" text-anchor="middle">C</text>
      
      <!-- Energy oscillation indicator -->
      <text x="90" y="75" font-size="9" fill="#27AE60" text-anchor="middle">Energy</text>
      <text x="90" y="85" font-size="9" fill="#27AE60" text-anchor="middle">Oscillates</text>
      
      <!-- Frequency equation -->
      <text x="90" y="145" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        f = 1/(2π√LC)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          LC Circuit (Oscillator)
        </text>
      ` : ''}
    </svg>
  `;
}
