/**
 * Quantum Mechanics Components
 * Wave-particle duality, energy levels, uncertainty, tunneling, Schrödinger's cat
 */

export interface QuantumOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create wave-particle duality (double slit) diagram
 */
export function createWaveParticleDuality(options: QuantumOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="wave-particle-duality" xmlns="http://www.w3.org/2000/svg">
      <!-- Electron source -->
      <circle cx="30" cy="90" r="8" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="30" y="94" font-size="8" fill="white" text-anchor="middle" font-weight="600">e⁻</text>
      
      <!-- Wave representation -->
      <path d="M 40,90 Q 55,75 70,90 Q 85,105 100,90" stroke="#3498DB" stroke-width="2" fill="none"/>
      
      <!-- Double slit barrier -->
      <rect x="110" y="40" width="10" height="40" fill="#2C3E50"/>
      <rect x="110" y="100" width="10" height="40" fill="#2C3E50"/>
      <text x="105" y="95" font-size="8" fill="#7F8C8D" text-anchor="end">Slits</text>
      
      <!-- Interference pattern on screen -->
      <rect x="180" y="40" width="5" height="120" fill="#E8F4F8" stroke="#3498DB" stroke-width="1"/>
      
      <!-- Intensity pattern -->
      ${[0, 1, 2, 3, 4].map(i => {
        const y = 50 + i * 20;
        const intensity = i === 2 ? 15 : (i === 1 || i === 3 ? 10 : 5);
        return `<rect x="${175 - intensity}" y="${y}" width="${intensity}" height="8" fill="#F39C12" opacity="${0.3 + i * 0.1}"/>`;
    }).join('')}
      
      <text x="195" y="100" font-size="8" fill="#F39C12" transform="rotate(90 195 100)">Intensity</text>
      
      <!-- Label -->
      <text x="110" y="25" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">
        Interference Pattern
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Wave-Particle Duality
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create quantum energy levels diagram
 */
export function createQuantumEnergyLevels(options: QuantumOptions = {}): string {
    const { width = 180, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="quantum-energy-levels" xmlns="http://www.w3.org/2000/svg">
      <!-- Energy levels -->
      ${[
            { n: 1, y: 140, energy: 'E₁', color: '#E74C3C' },
            { n: 2, y: 110, energy: 'E₂', color: '#F39C12' },
            { n: 3, y: 90, energy: 'E₃', color: '#27AE60' },
            { n: 4, y: 75, energy: 'E₄', color: '#3498DB' },
            { n: 'infinity', y: 50, energy: 'E∞ = 0', color: '#7F8C8D' }
        ].map((level, i) => `
        <line x1="50" y1="${level.y}" x2="130" y2="${level.y}" stroke="${level.color}" stroke-width="2.5"/>
        <text x="40" y="${level.y + 4}" font-size="9" fill="${level.color}" text-anchor="end">n=${level.n}</text>
        <text x="140" y="${level.y + 4}" font-size="9" fill="${level.color}">${level.energy}</text>
      `).join('')}
      
      <!-- Electron transition -->
      <circle cx="90" cy="110" r="4" fill="#9B59B6"/>
      <line x1="90" y1="110" x2="90" y2="75" stroke="#9B59B6" stroke-width="2" stroke-dasharray="3,3"/>
      <polygon points="87,75 90,70 93,75" fill="#9B59B6"/>
      
      <!-- Photon emission -->
      <path d="M 95,92 Q 110,92 110,80" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="110" cy="80" r="3" fill="#FFD700"/>
      <text x="120" y="85" font-size="9" fill="#FFD700">hν</text>
      
      <!-- Energy axis -->
      <line x1="30" y1="150" x2="30" y2="40" stroke="#2C3E50" stroke-width="1.5"/>
      <polygon points="27,40 30,35 33,40" fill="#2C3E50"/>
      <text x="20" y="95" font-size="9" fill="#2C3E50" transform="rotate(-90 20 95)">Energy</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Quantum Energy Levels
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Heisenberg uncertainty principle diagram
 */
export function createHeisenbergUncertainty(options: QuantumOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="heisenberg-uncertainty" xmlns="http://www.w3.org/2000/svg">
      <!-- Position uncertainty -->
      <rect x="40" y="50" width="60" height="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="70" y="70" font-size="11" fill="#3498DB" text-anchor="middle" font-weight="600">Δx</text>
      <text x="70" y="95" font-size="9" fill="#7F8C8D" text-anchor="middle">Position</text>
      
      <!-- Multiplication sign -->
      <text x="110" y="70" font-size="14" fill="#2C3E50">×</text>
      
      <!-- Momentum uncertainty -->
      <rect x="130" y="50" width="60" height="30" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="160" y="70" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">Δp</text>
      <text x="160" y="95" font-size="9" fill="#7F8C8D" text-anchor="middle">Momentum</text>
      
      <!-- Inequality -->
      <text x="100" y="120" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        Δx · Δp ≥ ℏ/2
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Heisenberg Uncertainty Principle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create quantum tunneling diagram
 */
export function createQuantumTunneling(options: QuantumOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="quantum-tunneling" xmlns="http://www.w3.org/2000/svg">
      <!-- Energy barrier -->
      <rect x="90" y="40" width="40" height="60" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="110" y="30" font-size="9" fill="#E74C3C" text-anchor="middle">Barrier</text>
      
      <!-- Particle before barrier -->
      <circle cx="60" cy="70" r="6" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
      <text x="60" y="90" font-size="8" fill="#3498DB" text-anchor="middle">E < V</text>
      
      <!-- Wave function -->
      <path d="M 30,70 Q 45,60 60,70 Q 75,80 90,70" stroke="#27AE60" stroke-width="2" fill="none"/>
      
      <!-- Tunneling through barrier (exponential decay) -->
      <path d="M 90,70 Q 100,72 110,75 Q 120,78 130,80" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3" fill="none" opacity="0.6"/>
      
      <!-- Particle after barrier (transmitted) -->
      <circle cx="160" cy="70" r="5" fill="#3498DB" opacity="0.6" stroke="#2980B9" stroke-width="2"/>
      <path d="M 130,70 Q 145,68 160,70 Q 175,72 190,70" stroke="#27AE60" stroke-width="2" fill="none" opacity="0.6"/>
      
      <!-- Probability -->
      <text x="110" y="115" font-size="9" fill="#9B59B6" text-anchor="middle">
        P ∝ e^(-2κd)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Quantum Tunneling
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Schrödinger's cat diagram
 */
export function createSchrodingerCat(options: QuantumOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="schrodinger-cat" xmlns="http://www.w3.org/2000/svg">
      <!-- Box -->
      <rect x="30" y="40" width="140" height="80" fill="#E8F4F8" stroke="#3498DB" stroke-width="2.5" rx="5"/>
      <text x="100" y="30" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Closed Box</text>
      
      <!-- Superposition state -->
      <g id="superposition">
        <!-- Alive cat (left side) -->
        <circle cx="70" cy="80" r="15" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
        <text x="70" y="85" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">😺</text>
        <text x="70" y="105" font-size="8" fill="#27AE60" text-anchor="middle">Alive</text>
        
        <!-- Plus sign -->
        <text x="100" y="85" font-size="14" fill="#9B59B6" text-anchor="middle">+</text>
        
        <!-- Dead cat (right side) -->
        <circle cx="130" cy="80" r="15" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
        <text x="130" y="85" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">💀</text>
        <text x="130" y="105" font-size="8" fill="#E74C3C" text-anchor="middle">Dead</text>
      </g>
      
      <!-- Superposition label -->
      <text x="100" y="135" font-size="9" fill="#9B59B6" text-anchor="middle" font-style="italic">
        Superposition until observed
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Schrödinger's Cat (Superposition)
        </text>
      ` : ''}
    </svg>
  `;
}
