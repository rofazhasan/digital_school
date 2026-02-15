/**
 * Biotechnology Components
 * PCR, gel electrophoresis, CRISPR-Cas9
 */

export interface BiotechnologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create PCR process diagram
 */
export function createPCRProcess(options: BiotechnologyOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="pcr-process" xmlns="http://www.w3.org/2000/svg">
      <!-- Cycle diagram -->
      <circle cx="120" cy="90" r="60" fill="none" stroke="#3498DB" stroke-width="2" stroke-dasharray="5,5"/>
      
      <!-- Step 1: Denaturation -->
      <g id="denaturation">
        <rect x="100" y="20" width="40" height="25" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="3"/>
        <text x="120" y="35" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">94-96°C</text>
        <text x="120" y="10" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">1. Denaturation</text>
      </g>
      
      <!-- Step 2: Annealing -->
      <g id="annealing">
        <rect x="155" y="80" width="40" height="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="175" y="95" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">50-65°C</text>
        <text x="195" y="95" font-size="9" fill="#3498DB" text-anchor="start" font-weight="600">2. Annealing</text>
      </g>
      
      <!-- Step 3: Extension -->
      <g id="extension">
        <rect x="100" y="135" width="40" height="25" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="120" y="150" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">72°C</text>
        <text x="120" y="175" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">3. Extension</text>
      </g>
      
      <!-- Arrows showing cycle -->
      <path d="M 140,35 Q 155,50 165,75" stroke="#F39C12" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
      <path d="M 165,105 Q 155,120 140,145" stroke="#F39C12" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
      <path d="M 100,145 Q 80,90 100,35" stroke="#F39C12" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
      
      <!-- Arrow marker -->
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      <!-- Cycle count -->
      <text x="120" y="95" font-size="11" fill="#9B59B6" text-anchor="middle" font-weight="600">25-35 cycles</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          PCR Process (Polymerase Chain Reaction)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create gel electrophoresis diagram
 */
export function createGelElectrophoresis(options: BiotechnologyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="gel-electrophoresis" xmlns="http://www.w3.org/2000/svg">
      <!-- Gel -->
      <rect x="60" y="40" width="100" height="90" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
      
      <!-- Wells -->
      ${[0, 1, 2, 3].map(i => `
        <rect x="${75 + i * 20}" y="45" width="10" height="8" fill="#2C3E50" opacity="0.3"/>
      `).join('')}
      
      <!-- DNA bands -->
      ${[
            { lane: 0, bands: [60, 80, 100] },
            { lane: 1, bands: [70, 90] },
            { lane: 2, bands: [65, 85, 105] },
            { lane: 3, bands: [75, 95] }
        ].map(lane => lane.bands.map(y => `
        <rect x="${75 + lane.lane * 20}" y="${y}" width="10" height="3" fill="#E74C3C" opacity="0.7"/>
      `).join('')).join('')}
      
      <!-- Electrodes -->
      <rect x="50" y="35" width="5" height="100" fill="#E74C3C"/>
      <text x="40" y="85" font-size="10" fill="#E74C3C" font-weight="600">−</text>
      
      <rect x="165" y="35" width="5" height="100" fill="#3498DB"/>
      <text x="175" y="85" font-size="10" fill="#3498DB" font-weight="600">+</text>
      
      <!-- Migration arrow -->
      <line x1="70" y1="145" x2="150" y2="145" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-gel)"/>
      <text x="110" y="155" font-size="9" fill="#F39C12" text-anchor="middle">DNA migration</text>
      
      <defs>
        <marker id="arrow-gel" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Gel Electrophoresis
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create CRISPR-Cas9 diagram
 */
export function createCRISPRCas9(options: BiotechnologyOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="crispr-cas9" xmlns="http://www.w3.org/2000/svg">
      <!-- DNA double helix -->
      <g id="dna">
        <line x1="40" y1="70" x2="200" y2="70" stroke="#3498DB" stroke-width="3"/>
        <line x1="40" y1="80" x2="200" y2="80" stroke="#3498DB" stroke-width="3"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `
          <line x1="${50 + i * 20}" y1="70" x2="${50 + i * 20}" y2="80" stroke="#7F8C8D" stroke-width="1.5"/>
        `).join('')}
      </g>
      
      <!-- Guide RNA -->
      <g id="guide-rna">
        <path d="M 100,50 Q 110,55 120,50" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
        <text x="110" y="40" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Guide RNA</text>
      </g>
      
      <!-- Cas9 protein -->
      <g id="cas9">
        <ellipse cx="120" cy="65" rx="25" ry="12" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2"/>
        <text x="120" y="68" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Cas9</text>
      </g>
      
      <!-- Cut site -->
      <g id="cut">
        <line x1="120" y1="60" x2="120" y2="90" stroke="#E74C3C" stroke-width="3" stroke-dasharray="5,3"/>
        <text x="130" y="75" font-size="9" fill="#E74C3C">Cut</text>
      </g>
      
      <!-- Result -->
      <g id="result">
        <line x1="40" y1="110" x2="115" y2="110" stroke="#3498DB" stroke-width="3"/>
        <line x1="125" y1="110" x2="200" y2="110" stroke="#3498DB" stroke-width="3"/>
        <line x1="40" y1="120" x2="115" y2="120" stroke="#3498DB" stroke-width="3"/>
        <line x1="125" y1="120" x2="200" y2="120" stroke="#3498DB" stroke-width="3"/>
        
        <!-- New DNA insert -->
        <rect x="115" y="108" width="10" height="14" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
        <text x="120" y="145" font-size="9" fill="#27AE60" text-anchor="middle">New DNA</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          CRISPR-Cas9 Gene Editing
        </text>
      ` : ''}
    </svg>
  `;
}
