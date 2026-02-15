/**
 * Differential Equations Components
 * First order ODE, second order ODE, phase portrait
 */

export interface DifferentialEquationsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create first order ODE diagram
 */
export function createFirstOrderODE(options: DifferentialEquationsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="first-order-ode" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">t</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">y(t)</text>
      
      <!-- Solution curves for different initial conditions -->
      ${[0, 1, 2].map(i => {
        const y0 = 110 - i * 30;
        return `
          <path d="M 30,${y0} Q 80,${y0 - 20} 130,${y0 - 30} Q 180,${y0 - 35} 200,${y0 - 37}" 
                stroke="${['#E74C3C', '#3498DB', '#27AE60'][i]}" stroke-width="2.5" fill="none"/>
          <circle cx="30" cy="${y0}" r="3" fill="${['#E74C3C', '#3498DB', '#27AE60'][i]}"/>
        `;
    }).join('')}
      
      <!-- Equation -->
      <text x="110" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        dy/dt = f(t, y)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          First Order ODE Solutions
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create second order ODE diagram
 */
export function createSecondOrderODE(options: DifferentialEquationsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="second-order-ode" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">t</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">y(t)</text>
      
      <!-- Oscillating solution (underdamped) -->
      <path d="M 30,80 Q 50,50 70,80 Q 90,105 110,80 Q 130,60 150,80 Q 170,95 190,80" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="190" y="75" font-size="9" fill="#E74C3C">Underdamped</text>
      
      <!-- Exponential decay (overdamped) -->
      <path d="M 30,50 Q 80,70 130,75 Q 180,78 200,79" 
            stroke="#3498DB" stroke-width="2.5" fill="none"/>
      <text x="190" y="85" font-size="9" fill="#3498DB">Overdamped</text>
      
      <!-- Equation -->
      <text x="110" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        d²y/dt² + a(dy/dt) + by = 0
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Second Order ODE (Damped Oscillator)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create phase portrait diagram
 */
export function createPhasePortrait(options: DifferentialEquationsOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="phase-portrait" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="100" y1="30" x2="100" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,127 185,130 180,133" fill="#2C3E50"/>
      <polygon points="97,30 100,25 103,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="185" y="135" font-size="10" fill="#2C3E50">x</text>
      <text x="105" y="25" font-size="10" fill="#2C3E50">y</text>
      
      <!-- Equilibrium point -->
      <circle cx="100" cy="95" r="4" fill="#E74C3C"/>
      <text x="110" y="100" font-size="9" fill="#E74C3C">Equilibrium</text>
      
      <!-- Trajectory spirals -->
      ${[0, 1, 2].map(i => {
        const angle = i * 2.1;
        const r0 = 40 + i * 10;
        return `
          <path d="M ${100 + r0 * Math.cos(angle)},${95 + r0 * Math.sin(angle)} 
                   Q ${100 + (r0 - 10) * Math.cos(angle + 1)},${95 + (r0 - 10) * Math.sin(angle + 1)} 
                     ${100 + (r0 - 20) * Math.cos(angle + 2)},${95 + (r0 - 20) * Math.sin(angle + 2)} 
                   Q ${100 + (r0 - 30) * Math.cos(angle + 3)},${95 + (r0 - 30) * Math.sin(angle + 3)} 
                     ${100 + (r0 - 35) * Math.cos(angle + 4)},${95 + (r0 - 35) * Math.sin(angle + 4)}" 
                stroke="#3498DB" stroke-width="2" fill="none"/>
        `;
    }).join('')}
      
      <!-- Direction arrows -->
      ${[0, 1, 2, 3].map(i => {
        const angle = i * 1.57;
        const r = 50;
        const x = 100 + r * Math.cos(angle);
        const y = 95 + r * Math.sin(angle);
        return `<polygon points="${x - 2},${y - 2} ${x + 2},${y} ${x - 2},${y + 2}" fill="#27AE60"/>`;
    }).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Phase Portrait (Spiral Sink)
        </text>
      ` : ''}
    </svg>
  `;
}
