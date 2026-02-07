/**
 * Thermochemistry Components
 * Hess's law, Gibbs energy, activation energy
 */

export interface ThermochemistryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create Hess's law diagram
 */
export function createHessLaw(options: ThermochemistryOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="hess-law" xmlns="http://www.w3.org/2000/svg">
      <!-- Reactants -->
      <rect x="40" y="40" width="50" height="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="65" y="60" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">A + B</text>
      
      <!-- Products -->
      <rect x="130" y="130" width="50" height="30" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
      <text x="155" y="150" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">C + D</text>
      
      <!-- Direct path -->
      <line x1="90" y1="55" x2="130" y2="145" stroke="#E74C3C" stroke-width="2.5" stroke-dasharray="5,3"/>
      <text x="110" y="90" font-size="10" fill="#E74C3C" transform="rotate(-60 110 90)">ΔH₁</text>
      
      <!-- Indirect path via intermediate -->
      <rect x="140" y="40" width="50" height="30" fill="#F39C12" opacity="0.3" stroke="#F39C12" stroke-width="2" rx="3"/>
      <text x="165" y="60" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">X + Y</text>
      
      <line x1="90" y1="55" x2="140" y2="55" stroke="#9B59B6" stroke-width="2.5"/>
      <polygon points="140,52 145,55 140,58" fill="#9B59B6"/>
      <text x="115" y="50" font-size="10" fill="#9B59B6">ΔH₂</text>
      
      <line x1="165" y1="70" x2="155" y2="130" stroke="#9B59B6" stroke-width="2.5"/>
      <polygon points="155,130 152,125 158,127" fill="#9B59B6"/>
      <text x="170" y="100" font-size="10" fill="#9B59B6">ΔH₃</text>
      
      <!-- Hess's law equation -->
      <text x="110" y="175" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        ΔH₁ = ΔH₂ + ΔH₃
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Hess's Law
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Gibbs free energy diagram
 */
export function createGibbsEnergy(options: ThermochemistryOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="gibbs-energy" xmlns="http://www.w3.org/2000/svg">
      <!-- Energy diagram -->
      <rect x="50" y="50" width="100" height="80" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
      
      <!-- Components -->
      <text x="100" y="70" font-size="12" fill="#E74C3C" text-anchor="middle" font-weight="600">ΔG</text>
      <text x="100" y="85" font-size="10" fill="#2C3E50" text-anchor="middle">=</text>
      <text x="100" y="100" font-size="11" fill="#3498DB" text-anchor="middle">ΔH - TΔS</text>
      
      <!-- Conditions -->
      <g id="spontaneous">
        <rect x="30" y="140" width="60" height="20" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="2"/>
        <text x="60" y="154" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">ΔG < 0</text>
        <text x="60" y="175" font-size="8" fill="#7F8C8D" text-anchor="middle">Spontaneous</text>
      </g>
      
      <g id="equilibrium">
        <rect x="95" y="140" width="60" height="20" fill="#F39C12" opacity="0.3" stroke="#F39C12" stroke-width="2" rx="2"/>
        <text x="125" y="154" font-size="9" fill="#F39C12" text-anchor="middle" font-weight="600">ΔG = 0</text>
        <text x="125" y="175" font-size="8" fill="#7F8C8D" text-anchor="middle">Equilibrium</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Gibbs Free Energy
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create activation energy diagram
 */
export function createActivationEnergy(options: ThermochemistryOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="activation-energy" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Reaction Progress</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Energy</text>
      
      <!-- Energy curve -->
      <path d="M 40,90 Q 80,40 115,50 Q 150,60 180,70" stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Reactants level -->
      <line x1="30" y1="90" x2="60" y2="90" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="50" y="85" font-size="9" fill="#3498DB" text-anchor="middle">Reactants</text>
      
      <!-- Products level -->
      <line x1="160" y1="70" x2="190" y2="70" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="175" y="65" font-size="9" fill="#27AE60" text-anchor="middle">Products</text>
      
      <!-- Activation energy -->
      <line x1="60" y1="90" x2="60" y2="50" stroke="#F39C12" stroke-width="2"/>
      <line x1="55" y1="90" x2="65" y2="90" stroke="#F39C12" stroke-width="2"/>
      <line x1="55" y1="50" x2="65" y2="50" stroke="#F39C12" stroke-width="2"/>
      <text x="50" y="70" font-size="9" fill="#F39C12" text-anchor="end">Ea</text>
      
      <!-- Transition state -->
      <circle cx="115" cy="50" r="3" fill="#9B59B6"/>
      <text x="115" y="40" font-size="9" fill="#9B59B6" text-anchor="middle">Transition State</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Activation Energy
        </text>
      ` : ''}
    </svg>
  `;
}
