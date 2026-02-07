/**
 * Professional Advanced Genetics Components
 * Meiosis, genetic variation, gene expression
 */

export interface GeneticsAdvancedOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create meiosis stages diagram
 */
export function createMeiosisStages(options: GeneticsAdvancedOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="meiosis-stages" xmlns="http://www.w3.org/2000/svg">
      <!-- Diploid cell -->
      <circle cx="40" cy="50" r="25" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="40" y="30" font-size="9" fill="#3498DB" text-anchor="middle">Diploid (2n)</text>
      ${[0, 1, 2, 3].map(i => `
        <rect x="${30 + (i % 2) * 12}" y="${42 + Math.floor(i / 2) * 12}" width="8" height="8" fill="${i < 2 ? '#E74C3C' : '#27AE60'}" opacity="0.7"/>
      `).join('')}
      
      <!-- Meiosis I -->
      <text x="100" y="30" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Meiosis I</text>
      <line x1="65" y1="50" x2="85" y2="50" stroke="#F39C12" stroke-width="2"/>
      <polygon points="85,47 90,50 85,53" fill="#F39C12"/>
      
      <!-- After Meiosis I (2 cells) -->
      <circle cx="120" cy="35" r="18" fill="#FFE6E6" stroke="#E74C3C" stroke-width="2"/>
      ${[0, 1].map(i => `
        <rect x="${115 + i * 8}" y="30" width="6" height="6" fill="#E74C3C" opacity="0.7"/>
      `).join('')}
      
      <circle cx="120" cy="65" r="18" fill="#E6F7E6" stroke="#27AE60" stroke-width="2"/>
      ${[0, 1].map(i => `
        <rect x="${115 + i * 8}" y="60" width="6" height="6" fill="#27AE60" opacity="0.7"/>
      `).join('')}
      
      <!-- Meiosis II -->
      <text x="170" y="30" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Meiosis II</text>
      <line x1="138" y1="35" x2="155" y2="35" stroke="#F39C12" stroke-width="2"/>
      <polygon points="155,32 160,35 155,38" fill="#F39C12"/>
      <line x1="138" y1="65" x2="155" y2="65" stroke="#F39C12" stroke-width="2"/>
      <polygon points="155,62 160,65 155,68" fill="#F39C12"/>
      
      <!-- Haploid cells (4 total) -->
      ${[0, 1, 2, 3].map(i => {
        const y = 25 + (i % 2) * 50;
        const x = 190 + Math.floor(i / 2) * 30;
        const color = i < 2 ? '#E74C3C' : '#27AE60';
        return `
          <circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="1.5"/>
          <rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="${color}" opacity="0.7"/>
        `;
    }).join('')}
      
      <text x="205" y="100" font-size="8" fill="#9B59B6" text-anchor="middle">4 Haploid (n)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Meiosis Stages
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create genetic variation diagram
 */
export function createGeneticVariation(options: GeneticsAdvancedOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="genetic-variation" xmlns="http://www.w3.org/2000/svg">
      <!-- Crossing over -->
      <g id="crossing-over">
        <text x="60" y="25" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Crossing Over</text>
        <rect x="30" y="35" width="60" height="8" fill="#E74C3C" opacity="0.6"/>
        <rect x="30" y="47" width="60" height="8" fill="#3498DB" opacity="0.6"/>
        <!-- X mark for crossover -->
        <line x1="55" y1="35" x2="65" y2="55" stroke="#F39C12" stroke-width="2"/>
        <line x1="65" y1="35" x2="55" y2="55" stroke="#F39C12" stroke-width="2"/>
        <!-- Recombinant -->
        <rect x="30" y="65" width="30" height="8" fill="#E74C3C" opacity="0.6"/>
        <rect x="60" y="65" width="30" height="8" fill="#3498DB" opacity="0.6"/>
        <rect x="30" y="77" width="30" height="8" fill="#3498DB" opacity="0.6"/>
        <rect x="60" y="77" width="30" height="8" fill="#E74C3C" opacity="0.6"/>
        <text x="60" y="95" font-size="8" fill="#27AE60" text-anchor="middle">Recombinant</text>
      </g>
      
      <!-- Independent assortment -->
      <g id="independent-assortment">
        <text x="160" y="25" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Independent</text>
        <text x="160" y="35" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Assortment</text>
        
        <!-- Chromosome pairs -->
        <rect x="135" y="45" width="8" height="20" fill="#E74C3C" opacity="0.6"/>
        <rect x="147" y="45" width="8" height="20" fill="#E74C3C" opacity="0.6"/>
        <rect x="165" y="45" width="8" height="20" fill="#3498DB" opacity="0.6"/>
        <rect x="177" y="45" width="8" height="20" fill="#3498DB" opacity="0.6"/>
        
        <!-- Different combinations -->
        <rect x="135" y="75" width="8" height="15" fill="#E74C3C" opacity="0.6"/>
        <rect x="147" y="75" width="8" height="15" fill="#3498DB" opacity="0.6"/>
        
        <rect x="165" y="75" width="8" height="15" fill="#E74C3C" opacity="0.6"/>
        <rect x="177" y="75" width="8" height="15" fill="#3498DB" opacity="0.6"/>
        
        <text x="160" y="105" font-size="8" fill="#27AE60" text-anchor="middle">Different combos</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Sources of Genetic Variation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create gene expression diagram
 */
export function createGeneExpression(options: GeneticsAdvancedOptions = {}): string {
    const { width = 240, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="gene-expression" xmlns="http://www.w3.org/2000/svg">
      <!-- DNA -->
      <rect x="20" y="40" width="60" height="15" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="2"/>
      <text x="50" y="52" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">DNA</text>
      <text x="50" y="30" font-size="8" fill="#7F8C8D" text-anchor="middle">Nucleus</text>
      
      <!-- Transcription arrow -->
      <line x1="85" y1="47" x2="105" y2="47" stroke="#F39C12" stroke-width="2"/>
      <polygon points="105,44 110,47 105,50" fill="#F39C12"/>
      <text x="95" y="42" font-size="8" fill="#F39C12" text-anchor="middle">Transcription</text>
      
      <!-- RNA -->
      <rect x="115" y="40" width="50" height="15" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="2"/>
      <text x="140" y="52" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">mRNA</text>
      
      <!-- Translation arrow -->
      <line x1="140" y1="60" x2="140" y2="75" stroke="#F39C12" stroke-width="2"/>
      <polygon points="137,75 140,80 143,75" fill="#F39C12"/>
      <text x="150" y="70" font-size="8" fill="#F39C12">Translation</text>
      
      <!-- Protein -->
      <path d="M 110,85 Q 125,75 140,85 Q 155,95 170,85" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
      <text x="140" y="95" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">Protein</text>
      <text x="140" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">Cytoplasm</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Gene Expression (Central Dogma)
        </text>
      ` : ''}
    </svg>
  `;
}
