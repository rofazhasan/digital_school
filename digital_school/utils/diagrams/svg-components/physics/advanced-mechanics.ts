/**
 * Advanced Mechanics Components
 * Centripetal force, angular velocity, momentum conservation, work-energy, power
 */

export interface AdvancedMechanicsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create centripetal force diagram
 */
export function createCentripetalForce(options: AdvancedMechanicsOptions = {}): string {
    const { width = 200, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="centripetal-force" xmlns="http://www.w3.org/2000/svg">
      <!-- Circular path -->
      <circle cx="100" cy="100" r="60" fill="none" stroke="#3498DB" stroke-width="2" stroke-dasharray="5,3"/>
      
      <!-- Object on path -->
      <circle cx="160" cy="100" r="8" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="160" y="105" font-size="8" fill="white" text-anchor="middle" font-weight="600">m</text>
      
      <!-- Velocity vector (tangent) -->
      <line x1="160" y1="100" x2="160" y2="60" stroke="#27AE60" stroke-width="3"/>
      <polygon points="157,60 160,55 163,60" fill="#27AE60"/>
      <text x="165" y="75" font-size="10" fill="#27AE60" font-weight="600">v</text>
      
      <!-- Centripetal force (toward center) -->
      <line x1="160" y1="100" x2="110" y2="100" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="110,97 105,100 110,103" fill="#E74C3C"/>
      <text x="135" y="95" font-size="10" fill="#E74C3C" font-weight="600">F<tspan font-size="7" baseline-shift="sub">c</tspan></text>
      
      <!-- Center point -->
      <circle cx="100" cy="100" r="3" fill="#2C3E50"/>
      
      <!-- Radius -->
      <line x1="100" y1="100" x2="160" y2="100" stroke="#7F8C8D" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="130" y="115" font-size="9" fill="#7F8C8D">r</text>
      
      <!-- Formula -->
      <text x="100" y="185" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        F<tspan font-size="7" baseline-shift="sub">c</tspan> = mv²/r
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Centripetal Force
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create angular velocity diagram
 */
export function createAngularVelocity(options: AdvancedMechanicsOptions = {}): string {
    const { width = 180, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="angular-velocity" xmlns="http://www.w3.org/2000/svg">
      <!-- Rotating disk -->
      <circle cx="90" cy="90" r="50" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Rotation axis (out of page) -->
      <circle cx="90" cy="90" r="4" fill="#2C3E50"/>
      <circle cx="90" cy="90" r="8" fill="none" stroke="#2C3E50" stroke-width="1.5"/>
      
      <!-- Angular velocity vector (right-hand rule) -->
      <line x1="90" y1="90" x2="90" y2="40" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="87,40 90,35 93,40" fill="#E74C3C"/>
      <text x="95" y="60" font-size="12" fill="#E74C3C" font-weight="600">ω</text>
      
      <!-- Rotation arrow -->
      <path d="M 120,70 A 30,30 0 0,1 110,110" stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <polygon points="110,110 107,105 113,107" fill="#27AE60"/>
      
      <!-- Point on disk -->
      <circle cx="125" cy="90" r="4" fill="#F39C12"/>
      <text x="135" y="93" font-size="9" fill="#F39C12">r</text>
      
      <!-- Formula -->
      <text x="90" y="165" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        v = ωr
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Angular Velocity
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create conservation of momentum diagram
 */
export function createMomentumConservation(options: AdvancedMechanicsOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="momentum-conservation" xmlns="http://www.w3.org/2000/svg">
      <!-- Before collision -->
      <g id="before">
        <text x="60" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">Before</text>
        
        <!-- Object 1 moving -->
        <rect x="30" y="40" width="20" height="20" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="2"/>
        <text x="40" y="54" font-size="9" fill="white" text-anchor="middle" font-weight="600">m₁</text>
        <line x1="55" y1="50" x2="75" y2="50" stroke="#27AE60" stroke-width="2.5"/>
        <polygon points="75,47 80,50 75,53" fill="#27AE60"/>
        <text x="67" y="45" font-size="9" fill="#27AE60">v₁</text>
        
        <!-- Object 2 stationary -->
        <rect x="90" y="40" width="20" height="20" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="2"/>
        <text x="100" y="54" font-size="9" fill="white" text-anchor="middle" font-weight="600">m₂</text>
        <text x="100" y="75" font-size="8" fill="#7F8C8D" text-anchor="middle">v₂ = 0</text>
      </g>
      
      <!-- After collision -->
      <g id="after">
        <text x="180" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">After</text>
        
        <!-- Combined or separated objects -->
        <rect x="150" y="40" width="20" height="20" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="2"/>
        <text x="160" y="54" font-size="9" fill="white" text-anchor="middle" font-weight="600">m₁</text>
        <line x1="175" y1="50" x2="195" y2="50" stroke="#27AE60" stroke-width="2.5"/>
        <polygon points="195,47 200,50 195,53" fill="#27AE60"/>
        <text x="185" y="45" font-size="8" fill="#27AE60">v₁'</text>
        
        <rect x="205" y="40" width="20" height="20" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="2"/>
        <text x="215" y="54" font-size="9" fill="white" text-anchor="middle" font-weight="600">m₂</text>
        <line x1="230" y1="50" x2="245" y2="50" stroke="#27AE60" stroke-width="2.5"/>
        <polygon points="245,47 248,50 245,53" fill="#27AE60"/>
        <text x="237" y="45" font-size="8" fill="#27AE60">v₂'</text>
      </g>
      
      <!-- Conservation equation -->
      <text x="120" y="110" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Conservation of Momentum
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create work-energy theorem diagram
 */
export function createWorkEnergyTheorem(options: AdvancedMechanicsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="work-energy-theorem" xmlns="http://www.w3.org/2000/svg">
      <!-- Object -->
      <rect x="40" y="80" width="30" height="30" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="3"/>
      <text x="55" y="100" font-size="11" fill="white" text-anchor="middle" font-weight="600">m</text>
      
      <!-- Force -->
      <line x1="75" y1="95" x2="120" y2="95" stroke="#3498DB" stroke-width="3"/>
      <polygon points="120,92 125,95 120,98" fill="#3498DB"/>
      <text x="100" y="90" font-size="11" fill="#3498DB" font-weight="600">F</text>
      
      <!-- Displacement -->
      <line x1="55" y1="125" x2="145" y2="125" stroke="#27AE60" stroke-width="2" stroke-dasharray="5,3"/>
      <line x1="55" y1="120" x2="55" y2="130" stroke="#27AE60" stroke-width="2"/>
      <line x1="145" y1="120" x2="145" y2="130" stroke="#27AE60" stroke-width="2"/>
      <text x="100" y="140" font-size="10" fill="#27AE60" text-anchor="middle">d</text>
      
      <!-- Work done -->
      <text x="100" y="40" font-size="11" fill="#F39C12" text-anchor="middle" font-weight="600">
        Work = F · d
      </text>
      
      <!-- Energy change -->
      <text x="100" y="60" font-size="10" fill="#9B59B6" text-anchor="middle">
        ΔKE = ½m(v₂² - v₁²)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Work-Energy Theorem
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create power diagram
 */
export function createPower(options: AdvancedMechanicsOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="power" xmlns="http://www.w3.org/2000/svg">
      <!-- Work representation -->
      <rect x="30" y="50" width="60" height="40" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="60" y="75" font-size="12" fill="#3498DB" text-anchor="middle" font-weight="600">Work</text>
      
      <!-- Time arrow -->
      <line x1="100" y1="70" x2="140" y2="70" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="140,67 145,70 140,73" fill="#F39C12"/>
      <text x="122" y="65" font-size="10" fill="#F39C12">Time</text>
      
      <!-- Power result -->
      <circle cx="165" cy="70" r="25" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="165" y="75" font-size="12" fill="#E74C3C" text-anchor="middle" font-weight="600">Power</text>
      
      <!-- Formulas -->
      <text x="100" y="115" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        P = W/t = F·v
      </text>
      <text x="100" y="130" font-size="9" fill="#7F8C8D" text-anchor="middle">
        Unit: Watt (J/s)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Power (Rate of Work)
        </text>
      ` : ''}
    </svg>
  `;
}
