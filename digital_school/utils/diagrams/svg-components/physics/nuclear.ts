/**
 * Nuclear Physics Components
 * Fission, fusion, radioactive decay, half-life
 */

export interface NuclearPhysicsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create nuclear fission diagram
 */
export function createNuclearFission(options: NuclearPhysicsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nuclear-fission" xmlns="http://www.w3.org/2000/svg">
      <!-- Neutron incoming -->
      <circle cx="30" cy="80" r="4" fill="#3498DB"/>
      <line x1="35" y1="80" x2="55" y2="80" stroke="#3498DB" stroke-width="2"/>
      <polygon points="55,77 60,80 55,83" fill="#3498DB"/>
      <text x="42" y="75" font-size="8" fill="#3498DB">n</text>
      
      <!-- Uranium nucleus -->
      <circle cx="80" cy="80" r="20" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
      <text x="80" y="85" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">²³⁵U</text>
      
      <!-- Fission products -->
      <circle cx="140" cy="60" r="12" fill="#F39C12" opacity="0.5" stroke="#F39C12" stroke-width="2"/>
      <text x="140" y="64" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Kr</text>
      
      <circle cx="140" cy="100" r="12" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
      <text x="140" y="104" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Ba</text>
      
      <!-- Released neutrons -->
      ${[0, 1, 2].map(i => `
        <circle cx="${170 + i * 15}" cy="${70 + i * 10}" r="3" fill="#3498DB"/>
        <line x1="${165 + i * 15}" y1="${70 + i * 10}" x2="${175 + i * 15}" y2="${70 + i * 10}" stroke="#3498DB" stroke-width="1.5"/>
        <polygon points="${175 + i * 15},${68 + i * 10} ${180 + i * 15},${70 + i * 10} ${175 + i * 15},${72 + i * 10}" fill="#3498DB"/>
      `).join('')}
      <text x="185" y="95" font-size="8" fill="#3498DB">3n</text>
      
      <!-- Energy release -->
      <text x="110" y="130" font-size="10" fill="#E74C3C" text-anchor="middle">+ Energy</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Nuclear Fission
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create nuclear fusion diagram
 */
export function createNuclearFusion(options: NuclearPhysicsOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nuclear-fusion" xmlns="http://www.w3.org/2000/svg">
      <!-- Deuterium -->
      <circle cx="50" cy="70" r="12" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="2"/>
      <text x="50" y="74" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">²H</text>
      <line x1="65" y1="70" x2="80" y2="70" stroke="#F39C12" stroke-width="2"/>
      <polygon points="80,67 85,70 80,73" fill="#F39C12"/>
      
      <!-- Tritium -->
      <circle cx="50" cy="100" r="12" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="2"/>
      <text x="50" y="104" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">³H</text>
      <line x1="65" y1="100" x2="80" y2="100" stroke="#F39C12" stroke-width="2"/>
      <polygon points="80,97 85,100 80,103" fill="#F39C12"/>
      
      <!-- Plus sign -->
      <text x="95" y="90" font-size="14" fill="#2C3E50">+</text>
      
      <!-- Helium product -->
      <circle cx="140" cy="70" r="14" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
      <text x="140" y="74" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">⁴He</text>
      
      <!-- Neutron product -->
      <circle cx="140" cy="105" r="5" fill="#9B59B6"/>
      <text x="140" y="108" font-size="8" fill="white" text-anchor="middle" font-weight="600">n</text>
      
      <!-- Energy release -->
      <text x="140" y="125" font-size="10" fill="#E74C3C" text-anchor="middle">+ 17.6 MeV</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Nuclear Fusion
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create radioactive decay diagram
 */
export function createRadioactiveDecay(options: NuclearPhysicsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="radioactive-decay" xmlns="http://www.w3.org/2000/svg">
      <!-- Parent nucleus -->
      <circle cx="60" cy="80" r="20" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
      <text x="60" y="85" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Parent</text>
      
      <!-- Decay types -->
      <!-- Alpha decay -->
      <g id="alpha">
        <line x1="85" y1="60" x2="110" y2="50" stroke="#F39C12" stroke-width="2"/>
        <circle cx="115" cy="48" r="5" fill="#F39C12"/>
        <text x="115" y="51" font-size="7" fill="white" text-anchor="middle" font-weight="600">α</text>
        <text x="130" y="50" font-size="8" fill="#F39C12">⁴He</text>
      </g>
      
      <!-- Beta decay -->
      <g id="beta">
        <line x1="85" y1="80" x2="110" y2="80" stroke="#3498DB" stroke-width="2"/>
        <circle cx="115" cy="80" r="4" fill="#3498DB"/>
        <text x="115" y="83" font-size="7" fill="white" text-anchor="middle" font-weight="600">β</text>
        <text x="130" y="83" font-size="8" fill="#3498DB">e⁻</text>
      </g>
      
      <!-- Gamma decay -->
      <g id="gamma">
        <line x1="85" y1="100" x2="110" y2="110" stroke="#9B59B6" stroke-width="2"/>
        <path d="M 110,105 Q 115,110 120,105" stroke="#9B59B6" stroke-width="2" fill="none"/>
        <text x="130" y="113" font-size="8" fill="#9B59B6">γ</text>
      </g>
      
      <!-- Daughter nucleus -->
      <circle cx="160" cy="80" r="18" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
      <text x="160" y="85" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Daughter</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Radioactive Decay (α, β, γ)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create half-life graph
 */
export function createHalfLifeGraph(options: NuclearPhysicsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="half-life-graph" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,127 185,130 180,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="185" y="135" font-size="10" fill="#2C3E50">t</text>
      <text x="20" y="25" font-size="10" fill="#2C3E50">N</text>
      
      <!-- Exponential decay curve -->
      <path d="M 30,40 Q 60,50 90,70 Q 120,95 150,115 Q 165,125 180,128" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Half-life markers -->
      ${[0, 1, 2].map(i => {
        const x = 30 + i * 50;
        const y = 40 + i * 37.5;
        return `
          <line x1="${x}" y1="${y}" x2="${x}" y2="130" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
          <line x1="30" y1="${y}" x2="${x}" y2="${y}" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
          <text x="${x}" y="145" font-size="9" fill="#3498DB" text-anchor="middle">${i}t<tspan font-size="7" baseline-shift="sub">½</tspan></text>
          <text x="20" y="${y + 4}" font-size="9" fill="#3498DB" text-anchor="end">N₀/${Math.pow(2, i)}</text>
        `;
    }).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Half-Life (Exponential Decay)
        </text>
      ` : ''}
    </svg>
  `;
}
