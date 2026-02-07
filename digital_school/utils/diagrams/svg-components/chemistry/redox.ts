/**
 * Professional Redox Reactions Components
 * Oxidation states, electrochemical cells, half-reactions, EMF series
 */

export interface RedoxOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create oxidation states diagram
 */
export function createOxidationStates(options: RedoxOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="oxidation-states" xmlns="http://www.w3.org/2000/svg">
      <!-- Electron transfer -->
      <text x="100" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">
        Zn + Cu²⁺ → Zn²⁺ + Cu
      </text>
      
      <!-- Zinc (loses electrons - oxidation) -->
      <circle cx="50" cy="70" r="20" fill="#7F8C8D" stroke="#2C3E50" stroke-width="2"/>
      <text x="50" y="75" font-size="12" fill="white" text-anchor="middle" font-weight="600">Zn</text>
      <text x="50" y="100" font-size="9" fill="#E74C3C" text-anchor="middle">Oxidation</text>
      <text x="50" y="110" font-size="8" fill="#E74C3C" text-anchor="middle">0 → +2</text>
      
      <!-- Electrons -->
      ${[0, 1].map(i => `
        <circle cx="${80 + i * 20}" cy="70" r="4" fill="#3498DB"/>
        <text x="${80 + i * 20}" cy="74" font-size="7" fill="white" text-anchor="middle">e⁻</text>
      `).join('')}
      <line x1="70" y1="70" x2="110" y2="70" stroke="#3498DB" stroke-width="2"/>
      <polygon points="110,67 115,70 110,73" fill="#3498DB"/>
      
      <!-- Copper (gains electrons - reduction) -->
      <circle cx="150" cy="70" r="20" fill="#CD7F32" stroke="#2C3E50" stroke-width="2"/>
      <text x="150" y="75" font-size="12" fill="white" text-anchor="middle" font-weight="600">Cu</text>
      <text x="150" y="100" font-size="9" fill="#27AE60" text-anchor="middle">Reduction</text>
      <text x="150" y="110" font-size="8" fill="#27AE60" text-anchor="middle">+2 → 0</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Oxidation States (Electron Transfer)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create electrochemical cell
 */
export function createElectrochemicalCell(options: RedoxOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="electrochemical-cell" xmlns="http://www.w3.org/2000/svg">
      <!-- Left beaker (anode) -->
      <path d="M 30,80 L 30,150 L 90,150 L 90,80" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="60" y="165" font-size="9" fill="#E74C3C" text-anchor="middle">Anode (−)</text>
      
      <!-- Zinc electrode -->
      <rect x="55" y="60" width="10" height="90" fill="#7F8C8D" stroke="#2C3E50" stroke-width="2"/>
      <text x="60" y="55" font-size="9" fill="#7F8C8D" text-anchor="middle">Zn</text>
      
      <!-- Right beaker (cathode) -->
      <path d="M 150,80 L 150,150 L 210,150 L 210,80" fill="#FFF4E6" stroke="#F39C12" stroke-width="2"/>
      <text x="180" y="165" font-size="9" fill="#27AE60" text-anchor="middle">Cathode (+)</text>
      
      <!-- Copper electrode -->
      <rect x="175" y="60" width="10" height="90" fill="#CD7F32" stroke="#2C3E50" stroke-width="2"/>
      <text x="180" y="55" font-size="9" fill="#CD7F32" text-anchor="middle">Cu</text>
      
      <!-- Salt bridge -->
      <path d="M 90,100 Q 120,70 150,100" fill="#95A5A6" stroke="#7F8C8D" stroke-width="2"/>
      <text x="120" y="80" font-size="8" fill="#2C3E50" text-anchor="middle">Salt Bridge</text>
      
      <!-- Wire and electron flow -->
      <path d="M 60,50 L 60,30 L 180,30 L 180,50" stroke="#2C3E50" stroke-width="2" fill="none"/>
      ${[0, 1, 2].map(i => `
        <circle cx="${80 + i * 30}" cy="30" r="3" fill="#3498DB"/>
      `).join('')}
      <polygon points="165,30 170,27 170,33" fill="#3498DB"/>
      <text x="120" y="20" font-size="8" fill="#3498DB" text-anchor="middle">e⁻ flow</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Electrochemical Cell (Galvanic)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create redox half-reactions
 */
export function createRedoxHalfReactions(options: RedoxOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="redox-half-reactions" xmlns="http://www.w3.org/2000/svg">
      <!-- Oxidation half-reaction -->
      <rect x="20" y="30" width="180" height="30" fill="#FFE6E6" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="110" y="50" font-size="11" fill="#E74C3C" text-anchor="middle" font-family="Inter, sans-serif">
        Zn → Zn²⁺ + 2e⁻ (Oxidation)
      </text>
      
      <!-- Reduction half-reaction -->
      <rect x="20" y="70" width="180" height="30" fill="#E6F7E6" stroke="#27AE60" stroke-width="2" rx="3"/>
      <text x="110" y="90" font-size="11" fill="#27AE60" text-anchor="middle" font-family="Inter, sans-serif">
        Cu²⁺ + 2e⁻ → Cu (Reduction)
      </text>
      
      <!-- Overall reaction -->
      <text x="110" y="115" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">
        Overall: Zn + Cu²⁺ → Zn²⁺ + Cu
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Redox Half-Reactions
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create electromotive series
 */
export function createEMFSeries(options: RedoxOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="emf-series" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="100" y="20" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">
        Standard Reduction Potentials
      </text>
      
      <!-- Scale -->
      <line x1="30" y1="40" x2="30" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="27,40 30,35 33,40" fill="#2C3E50"/>
      <text x="25" y="35" font-size="9" fill="#2C3E50" text-anchor="end">E° (V)</text>
      
      <!-- Reactions (ordered by potential) -->
      ${[
            { reaction: 'Au³⁺ + 3e⁻ → Au', E: '+1.50', y: 50 },
            { reaction: 'Ag⁺ + e⁻ → Ag', E: '+0.80', y: 70 },
            { reaction: 'Cu²⁺ + 2e⁻ → Cu', E: '+0.34', y: 90 },
            { reaction: '2H⁺ + 2e⁻ → H₂', E: '0.00', y: 110 },
            { reaction: 'Zn²⁺ + 2e⁻ → Zn', E: '−0.76', y: 130 },
            { reaction: 'Li⁺ + e⁻ → Li', E: '−3.05', y: 150 }
        ].map(item => `
        <line x1="35" y1="${item.y}" x2="45" y2="${item.y}" stroke="#7F8C8D" stroke-width="1.5"/>
        <text x="50" y="${item.y + 4}" font-size="8" fill="#2C3E50">${item.reaction}</text>
        <text x="180" y="${item.y + 4}" font-size="8" fill="${item.E.startsWith('+') ? '#27AE60' : item.E === '0.00' ? '#F39C12' : '#E74C3C'}" text-anchor="end">${item.E}</text>
      `).join('')}
      
      <!-- Labels -->
      <text x="190" y="55" font-size="8" fill="#27AE60">Strong</text>
      <text x="190" y="63" font-size="8" fill="#27AE60">Oxidizer</text>
      <text x="190" y="145" font-size="8" fill="#E74C3C">Strong</text>
      <text x="190" y="153" font-size="8" fill="#E74C3C">Reducer</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Electromotive Series
        </text>
      ` : ''}
    </svg>
  `;
}
