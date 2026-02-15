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
  const { width = 280, height = 200, showLabel = true } = options;

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width} ${height + 30}" 
         style="max-width: ${width}px;" class="protein-synthesis-v2" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Soft Glow -->
      <circle cx="140" cy="110" r="100" fill="url(#grad-bio-soft)" opacity="0.05" />

      <!-- DNA Triple/Double Helix Detail -->
      <g id="dna-premium" filter="url(#dna-glow)">
        <path d="M 30,50 Q 45,35 60,50 Q 75,65 90,50" stroke="#c0392b" stroke-width="3" fill="none" opacity="0.8"/>
        <path d="M 30,60 Q 45,75 60,60 Q 75,45 90,60" stroke="#2980b9" stroke-width="3" fill="none" opacity="0.8"/>
        <text x="60" y="32" font-size="10" fill="#2c3e50" text-anchor="middle" font-weight="700">DNA TEMPLATE</text>
      </g>
      
      <!-- Transcription Complex -->
      <path d="M 95,55 L 115,55" stroke="#f39c12" stroke-width="2" stroke-dasharray="2,1"/>
      <polygon points="115,52 120,55 115,58" fill="#f39c12"/>
      
      <!-- mRNA Ribbon -->
      <g id="mrna-premium" filter="url(#soft-shadow)">
        <path d="M 125,50 C 145,50 145,100 120,105" stroke="#3498db" stroke-width="4" fill="none" stroke-linecap="round"/>
        <text x="155" y="75" font-size="10" fill="#3498db" font-weight="700">mRNA</text>
      </g>
      
      <!-- Ribosome: 3D SHADED -->
      <g id="ribosome-3d" filter="url(#soft-shadow)">
        <!-- Large Subunit -->
        <ellipse cx="120" cy="120" rx="45" ry="30" fill="url(#grad-cell-3d)" stroke="#2980b9" stroke-width="1.5" opacity="0.9"/>
        <!-- Small Subunit -->
        <ellipse cx="120" cy="145" rx="35" ry="15" fill="#ecf0f1" stroke="#7f8c8d" stroke-width="1.5" />
        <text x="120" y="125" font-size="11" fill="#2c3e50" text-anchor="middle" font-weight="800">RIBOSOME</text>
      </g>
      
      <!-- tRNA with "Amino Acid" sphere -->
      ${[0, 1].map(i => `
        <g transform="translate(${90 + i * 25}, 160)">
          <path d="M 0,0 L 0,-15 L 5,-20 L -5,-20 Z" fill="#27ae60" stroke="#1e8449" stroke-width="1"/>
          <circle cx="0" cy="-25" r="5" fill="#e67e22" stroke="#d35400" />
        </g>
      `).join('')}
      
      <!-- Growing Polypeptide Chain -->
      <g filter="url(#soft-shadow)">
        <path d="M 165,120 C 185,100 210,140 240,110" stroke="#e74c3c" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1,6" />
        <circle cx="165" cy="120" r="4" fill="#e74c3c" />
        <circle cx="180" cy="110" r="4" fill="#e74c3c" />
        <circle cx="200" cy="125" r="4" fill="#e74c3c" />
        <text x="210" y="90" font-size="11" fill="#c0392b" font-weight="700">PROTEIN CHAIN</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 22}" font-size="13" font-family="Inter, sans-serif" 
              fill="#2c3e50" text-anchor="middle" font-weight="600">
          Protein Synthesis (Translation)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create DNA double helix structure diagram
 */
export function createDNAStructure(options: MolecularBiologyOptions = {}): string {
  const { width = 180, height = 240, showLabel = true } = options;

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width} ${height + 20}" 
         style="max-width: ${width}px;" class="dna-structure-v2" xmlns="http://www.w3.org/2000/svg">
      <!-- Glow Layer -->
      <g filter="url(#dna-glow)">
        <!-- Helix A -->
        <path d="M 60,30 Q 85,60 60,90 Q 35,120 60,150 Q 85,180 60,210" 
              stroke="#e74c3c" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.9"/>
        <!-- Helix B -->
        <path d="M 120,30 Q 95,60 120,90 Q 145,120 120,150 Q 95,180 120,210" 
              stroke="#3498db" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.9"/>
      </g>
      
      <!-- Base Pairs (Hydrogen Bonds) -->
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
    const y = 45 + i * 18;
    const phase = (i * 18) / 60;
    const xOffset = Math.sin(phase * Math.PI) * 20;
    const x1 = 90 + xOffset;
    const x2 = 90 - xOffset;
    const color = i % 2 === 0 ? '#f1c40f' : '#2ecc71';
    return `
          <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
        `;
  }).join('')}
      
      <!-- Annotations -->
      <g style="font-family: 'Inter', sans-serif; font-weight: 600;">
        <text x="25" y="100" font-size="8" fill="#e67e22">ADENINE-THYMINE</text>
        <text x="25" y="120" font-size="8" fill="#27ae60">GUANINE-CYTOSINE</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Inter, sans-serif" 
              fill="#2c3e50" text-anchor="middle" font-weight="600">
          DNA Double Helix Structure
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
