/**
 * Professional Simple Harmonic Motion (SHM) Components
 * Spring-mass systems, pendulum graphs, energy diagrams
 */

export interface SHMOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create spring-mass system
 */
export function createSpringMassSystem(options: SHMOptions = {}): string {
    const { width = 180, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="spring-mass-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Fixed support -->
      <rect x="60" y="20" width="60" height="10" fill="#2C3E50"/>
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#7F8C8D" stroke-width="1"/>
      </pattern>
      <rect x="60" y="20" width="60" height="10" fill="url(#hatch)"/>
      
      <!-- Spring (helical) -->
      <path d="M 90,30 L 90,50 L 85,55 L 95,65 L 85,75 L 95,85 L 85,95 L 95,105 L 90,110 L 90,130" 
            stroke="#3498DB" stroke-width="2.5" fill="none"/>
      
      <!-- Mass block -->
      <rect x="70" y="130" width="40" height="40" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="2"/>
      <text x="90" y="155" font-size="14" fill="white" text-anchor="middle" font-weight="600">m</text>
      
      <!-- Equilibrium position (dashed line) -->
      <line x1="20" y1="150" x2="160" y2="150" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="5,5"/>
      <text x="165" y="153" font-size="9" fill="#27AE60">y = 0</text>
      
      <!-- Displacement arrow -->
      <line x1="150" y1="150" x2="150" y2="130" stroke="#F39C12" stroke-width="2"/>
      <polygon points="150,130 147,135 153,135" fill="#F39C12"/>
      <text x="155" y="140" font-size="10" fill="#F39C12">y</text>
      
      <!-- Force arrow -->
      <line x1="90" y1="110" x2="90" y2="85" stroke="#9B59B6" stroke-width="2.5"/>
      <polygon points="90,85 87,90 93,90" fill="#9B59B6"/>
      <text x="95" y="95" font-size="10" fill="#9B59B6">F = -ky</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Spring-Mass System (SHM)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create SHM displacement-time graph
 */
export function createSHMGraph(options: SHMOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="shm-graph" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="140" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="80" x2="210" y2="80" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Grid -->
      ${Array.from({ length: 5 }, (_, i) => {
        const y = 30 + i * 25;
        return `<line x1="30" y1="${y}" x2="210" y2="${y}" stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
      
      <!-- Sine wave (displacement) -->
      <path d="M 30,80 Q 60,30 90,80 Q 120,130 150,80 Q 180,30 210,80" 
            stroke="#3498DB" stroke-width="3" fill="none"/>
      
      <!-- Amplitude markers -->
      <line x1="25" y1="30" x2="35" y2="30" stroke="#E74C3C" stroke-width="2"/>
      <text x="20" y="33" font-size="10" fill="#E74C3C" text-anchor="end">+A</text>
      <line x1="25" y1="130" x2="35" y2="130" stroke="#E74C3C" stroke-width="2"/>
      <text x="20" y="133" font-size="10" fill="#E74C3C" text-anchor="end">-A</text>
      
      <!-- Period marker -->
      <line x1="90" y1="85" x2="150" y2="85" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="120" y="100" font-size="10" fill="#27AE60" text-anchor="middle">T</text>
      
      <!-- Labels -->
      <text x="215" y="83" font-size="11" fill="#2C3E50" font-style="italic">t</text>
      <text x="25" y="15" font-size="11" fill="#2C3E50" font-style="italic">y</text>
      
      <!-- Equation -->
      <text x="110" y="155" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        y = A sin(ωt)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          SHM Displacement vs Time
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create SHM energy diagram
 */
export function createSHMEnergy(options: SHMOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="shm-energy" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="160" x2="190" y2="160" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Total energy (constant) -->
      <line x1="30" y1="40" x2="190" y2="40" stroke="#E74C3C" stroke-width="2.5"/>
      <text x="195" y="43" font-size="10" fill="#E74C3C">E<tspan font-size="7" baseline-shift="sub">total</tspan></text>
      
      <!-- Kinetic energy (inverted parabola) -->
      <path d="M 30,160 Q 110,40 190,160" stroke="#3498DB" stroke-width="2.5" fill="none"/>
      <text x="110" y="55" font-size="10" fill="#3498DB" text-anchor="middle">KE</text>
      
      <!-- Potential energy (parabola) -->
      <path d="M 30,40 Q 110,160 190,40" stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="110" y="170" font-size="10" fill="#27AE60" text-anchor="middle">PE</text>
      
      <!-- Position markers -->
      <line x1="30" y1="165" x2="30" y2="155" stroke="#7F8C8D" stroke-width="1.5"/>
      <text x="30" y="175" font-size="9" fill="#7F8C8D" text-anchor="middle">-A</text>
      <line x1="110" y1="165" x2="110" y2="155" stroke="#7F8C8D" stroke-width="1.5"/>
      <text x="110" y="175" font-size="9" fill="#7F8C8D" text-anchor="middle">0</text>
      <line x1="190" y1="165" x2="190" y2="155" stroke="#7F8C8D" stroke-width="1.5"/>
      <text x="190" y="175" font-size="9" fill="#7F8C8D" text-anchor="middle">+A</text>
      
      <!-- Labels -->
      <text x="195" y="163" font-size="11" fill="#2C3E50" font-style="italic">x</text>
      <text x="25" y="15" font-size="11" fill="#2C3E50" font-style="italic">E</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Energy in SHM
        </text>
      ` : ''}
    </svg>
  `;
}
