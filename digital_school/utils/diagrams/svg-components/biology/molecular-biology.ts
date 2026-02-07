/**
 * Molecular Biology Components
 * Protein synthesis, DNA structure, enzyme kinetics, cell signaling
 */

export interface MolecularBiologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create protein synthesis diagram
 */
export function createProteinSynthesis(options: MolecularBiologyOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="protein-synthesis" xmlns="http://www.w3.org/2000/svg">
      <!-- DNA -->
      <g id="dna">
        <path d="M 30,50 Q 40,40 50,50 Q 60,60 70,50" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
        <path d="M 30,60 Q 40,70 50,60 Q 60,50 70,60" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
        <text x="50" y="35" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">DNA</text>
      </g>
      
      <!-- Transcription arrow -->
      <line x1="75" y1="55" x2="95" y2="55" stroke="#F39C12" stroke-width="2"/>
      <polygon points="95,52 100,55 95,58" fill="#F39C12"/>
      <text x="87" y="50" font-size="8" fill="#F39C12">Transcription</text>
      
      <!-- mRNA -->
      <g id="mrna">
        <path d="M 105,50 L 115,55 L 125,50 L 135,55 L 145,50" stroke="#3498DB" stroke-width="2.5" fill="none"/>
        <text x="125" y="40" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">mRNA</text>
      </g>
      
      <!-- Translation arrow -->
      <line x1="120" y1="65" x2="120" y2="85" stroke="#F39C12" stroke-width="2"/>
      <polygon points="117,85 120,90 123,85" fill="#F39C12"/>
      <text x="130" y="77" font-size="8" fill="#F39C12">Translation</text>
      
      <!-- Ribosome -->
      <ellipse cx="120" cy="110" rx="30" ry="20" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2"/>
      <text x="120" y="115" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Ribosome</text>
      
      <!-- tRNA -->
      ${[0, 1, 2].map(i => `
        <path d="M ${95 + i * 20},130 L ${95 + i * 20},140 L ${100 + i * 20},145 L ${90 + i * 20},145 Z" 
              fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="1.5"/>
      `).join('')}
      <text x="105" y="160" font-size="9" fill="#27AE60" text-anchor="middle">tRNA</text>
      
      <!-- Protein chain -->
      <path d="M 160,110 Q 170,100 180,110 Q 190,120 200,110 Q 210,100 220,110" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      <text x="190" y="95" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">Protein</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Protein Synthesis
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create DNA double helix structure diagram
 */
export function createDNAStructure(options: MolecularBiologyOptions = {}): string {
    const { width = 180, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="dna-structure" xmlns="http://www.w3.org/2000/svg">
      <!-- Double helix -->
      <path d="M 60,30 Q 70,50 60,70 Q 50,90 60,110 Q 70,130 60,150 Q 50,170 60,190" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      <path d="M 120,30 Q 110,50 120,70 Q 130,90 120,110 Q 110,130 120,150 Q 130,170 120,190" 
            stroke="#3498DB" stroke-width="3" fill="none"/>
      
      <!-- Base pairs -->
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const y = 40 + i * 20;
        const x1 = 60 + Math.sin(i * 0.8) * 10;
        const x2 = 120 - Math.sin(i * 0.8) * 10;
        const color = i % 2 === 0 ? '#F39C12' : '#27AE60';
        return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2"/>`;
    }).join('')}
      
      <!-- Labels -->
      <text x="30" y="100" font-size="9" fill="#F39C12">A-T</text>
      <text x="30" y="120" font-size="9" fill="#27AE60">G-C</text>
      <text x="90" y="210" font-size="10" fill="#2C3E50" text-anchor="middle">3.4 nm/turn</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          DNA Double Helix
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create enzyme kinetics (Michaelis-Menten) diagram
 */
export function createEnzymeKinetics(options: MolecularBiologyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="enzyme-kinetics" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">[Substrate]</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Velocity</text>
      
      <!-- Michaelis-Menten curve -->
      <path d="M 30,130 Q 60,80 90,55 Q 120,40 150,35 Q 175,32 200,30" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Vmax line -->
      <line x1="30" y1="30" x2="200" y2="30" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="205" y="34" font-size="9" fill="#3498DB">Vmax</text>
      
      <!-- Km marker -->
      <line x1="90" y1="55" x2="90" y2="130" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="90" y="145" font-size="9" fill="#27AE60" text-anchor="middle">Km</text>
      
      <!-- Vmax/2 line -->
      <line x1="30" y1="55" x2="90" y2="55" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="25" y="59" font-size="8" fill="#F39C12" text-anchor="end">Vmax/2</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Enzyme Kinetics (Michaelis-Menten)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create cell signaling pathway diagram
 */
export function createCellSignaling(options: MolecularBiologyOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="cell-signaling" xmlns="http://www.w3.org/2000/svg">
      <!-- Cell membrane -->
      <rect x="30" y="60" width="140" height="3" fill="#2C3E50"/>
      <text x="100" y="55" font-size="9" fill="#7F8C8D" text-anchor="middle">Cell Membrane</text>
      
      <!-- Extracellular signal (ligand) -->
      <circle cx="100" cy="35" r="8" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="100" y="25" font-size="9" fill="#E74C3C" text-anchor="middle">Ligand</text>
      
      <!-- Receptor -->
      <rect x="95" y="45" width="10" height="30" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="2"/>
      <text x="110" y="62" font-size="8" fill="#3498DB">Receptor</text>
      
      <!-- Signal transduction cascade -->
      ${[0, 1, 2].map(i => `
        <circle cx="${70 + i * 30}" cy="${90 + i * 20}" r="6" fill="#F39C12" stroke="#E67E22" stroke-width="1.5"/>
        <line x1="${70 + i * 30}" y1="${96 + i * 20}" x2="${70 + (i + 1) * 30}" y2="${104 + (i + 1) * 20}" 
              stroke="#27AE60" stroke-width="2" marker-end="url(#arrowhead)"/>
      `).join('')}
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      <text x="100" y="105" font-size="8" fill="#F39C12">Signal Cascade</text>
      
      <!-- Cellular response -->
      <rect x="70" y="145" width="60" height="25" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2" rx="3"/>
      <text x="100" y="162" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Response</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Cell Signaling Pathway
        </text>
      ` : ''}
    </svg>
  `;
}
