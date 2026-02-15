/**
 * Professional Fluid Mechanics Components
 * Bernoulli, buoyancy, fluid flow
 */

export interface FluidOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create Bernoulli's principle diagram
 */
export function createBernouliPrinciple(options: FluidOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="bernoulli-principle" xmlns="http://www.w3.org/2000/svg">
      <!-- Pipe (varying diameter) -->
      <path d="M 20,60 L 60,60 L 80,70 L 120,70 L 140,60 L 200,60" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="2"/>
      <path d="M 20,100 L 60,100 L 80,90 L 120,90 L 140,100 L 200,100" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="2"/>
      
      <!-- Flow lines -->
      ${[0, 1, 2].map(i => {
        const y = 70 + i * 10;
        return `<path d="M 25,${y} L 55,${y} L 75,${y + (i === 1 ? 0 : (i === 0 ? -5 : 5))} L 115,${y + (i === 1 ? 0 : (i === 0 ? -5 : 5))} L 135,${y} L 195,${y}" 
                      stroke="#3498DB" stroke-width="1.5" fill="none" opacity="0.6"/>`;
    }).join('')}
      
      <!-- Velocity arrows -->
      <line x1="35" y1="50" x2="45" y2="50" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="45,47 50,50 45,53" fill="#E74C3C"/>
      <text x="40" y="45" font-size="9" fill="#E74C3C" text-anchor="middle">v₁</text>
      
      <line x1="90" y1="50" x2="110" y2="50" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="110,47 115,50 110,53" fill="#E74C3C"/>
      <text x="100" y="45" font-size="9" fill="#E74C3C" text-anchor="middle">v₂ > v₁</text>
      
      <!-- Pressure indicators -->
      <text x="40" y="120" font-size="10" fill="#27AE60" text-anchor="middle">P₁ (high)</text>
      <text x="100" y="120" font-size="10" fill="#9B59B6" text-anchor="middle">P₂ (low)</text>
      
      <!-- Equation -->
      <text x="110" y="135" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        P + ½ρv² + ρgh = constant
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Bernoulli's Principle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create buoyancy (Archimedes) diagram
 */
export function createBuoyancy(options: FluidOptions = {}): string {
    const { width = 180, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="buoyancy" xmlns="http://www.w3.org/2000/svg">
      <!-- Water -->
      <rect x="20" y="80" width="140" height="80" fill="#3498DB" opacity="0.3"/>
      <line x1="20" y1="80" x2="160" y2="80" stroke="#3498DB" stroke-width="2"/>
      <text x="165" y="120" font-size="9" fill="#3498DB">Water</text>
      
      <!-- Object (floating) -->
      <rect x="70" y="60" width="40" height="60" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="2"/>
      
      <!-- Weight force -->
      <line x1="90" y1="90" x2="90" y2="130" stroke="#E74C3C" stroke-width="2.5"/>
      <polygon points="87,130 90,135 93,130" fill="#E74C3C"/>
      <text x="95" y="115" font-size="10" fill="#E74C3C">W = mg</text>
      
      <!-- Buoyant force -->
      <line x1="90" y1="110" x2="90" y2="50" stroke="#27AE60" stroke-width="2.5"/>
      <polygon points="87,50 90,45 93,50" fill="#27AE60"/>
      <text x="95" y="70" font-size="10" fill="#27AE60">F<tspan font-size="7" baseline-shift="sub">B</tspan></text>
      
      <!-- Displaced water volume -->
      <rect x="70" y="80" width="40" height="40" fill="none" stroke="#F39C12" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="115" y="100" font-size="9" fill="#F39C12">V<tspan font-size="6" baseline-shift="sub">displaced</tspan></text>
      
      <!-- Equation -->
      <text x="90" y="170" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        F<tspan font-size="7" baseline-shift="sub">B</tspan> = ρ<tspan font-size="7" baseline-shift="sub">fluid</tspan>gV
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Buoyancy (Archimedes' Principle)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create fluid flow diagram
 */
export function createFluidFlow(options: FluidOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="fluid-flow" xmlns="http://www.w3.org/2000/svg">
      <!-- Laminar flow -->
      <g id="laminar">
        <text x="50" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">Laminar</text>
        ${[0, 1, 2, 3, 4].map(i => {
        const y = 35 + i * 12;
        return `<path d="M 10,${y} L 90,${y}" stroke="#3498DB" stroke-width="2" fill="none"/>`;
    }).join('')}
        <text x="50" y="100" font-size="9" fill="#27AE60" text-anchor="middle">Low Re</text>
        <text x="50" y="110" font-size="9" fill="#27AE60" text-anchor="middle">Smooth</text>
      </g>
      
      <!-- Turbulent flow -->
      <g id="turbulent">
        <text x="160" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">Turbulent</text>
        ${[0, 1, 2, 3, 4].map(i => {
        const y = 35 + i * 12;
        const path = `M 120,${y} Q 135,${y + (Math.random() - 0.5) * 8} 150,${y + (Math.random() - 0.5) * 10} Q 175,${y + (Math.random() - 0.5) * 8} 200,${y}`;
        return `<path d="${path}" stroke="#E74C3C" stroke-width="2" fill="none"/>`;
    }).join('')}
        <text x="160" y="100" font-size="9" fill="#9B59B6" text-anchor="middle">High Re</text>
        <text x="160" y="110" font-size="9" fill="#9B59B6" text-anchor="middle">Chaotic</text>
      </g>
      
      <!-- Reynolds number -->
      <text x="110" y="130" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        Re = ρvL/μ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Laminar vs Turbulent Flow
        </text>
      ` : ''}
    </svg>
  `;
}
