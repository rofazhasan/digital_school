/**
 * Professional Evolution Components
 * Natural selection, phylogenetic trees, speciation, adaptive radiation
 */

export interface EvolutionOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create natural selection diagram
 */
export function createNaturalSelection(options: EvolutionOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="natural-selection" xmlns="http://www.w3.org/2000/svg">
      <!-- Step 1: Variation -->
      <rect x="20" y="20" width="180" height="30" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="110" y="40" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">
        1. Variation in Population
      </text>
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${40 + i * 30}" cy="60" r="${5 + Math.random() * 3}" fill="#3498DB" opacity="0.6"/>
      `).join('')}
      
      <!-- Step 2: Selection Pressure -->
      <rect x="20" y="75" width="180" height="30" fill="#FFE6E6" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="110" y="95" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">
        2. Selection Pressure (Environment)
      </text>
      
      <!-- Step 3: Survival -->
      <rect x="20" y="110" width="180" height="30" fill="#E6F7E6" stroke="#27AE60" stroke-width="2" rx="3"/>
      <text x="110" y="130" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">
        3. Differential Survival & Reproduction
      </text>
      ${[0, 1, 2].map(i => `
        <circle cx="${60 + i * 40}" cy="150" r="7" fill="#27AE60" opacity="0.7"/>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Natural Selection Process
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create phylogenetic tree
 */
export function createPhylogeneticTree(options: EvolutionOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="phylogenetic-tree" xmlns="http://www.w3.org/2000/svg">
      <!-- Common ancestor -->
      <circle cx="100" cy="160" r="6" fill="#E74C3C"/>
      <text x="100" y="175" font-size="8" fill="#E74C3C" text-anchor="middle">Common Ancestor</text>
      
      <!-- Main trunk -->
      <line x1="100" y1="160" x2="100" y2="120" stroke="#7F8C8D" stroke-width="3"/>
      
      <!-- First split -->
      <line x1="100" y1="120" x2="60" y2="80" stroke="#7F8C8D" stroke-width="2.5"/>
      <line x1="100" y1="120" x2="140" y2="80" stroke="#7F8C8D" stroke-width="2.5"/>
      
      <!-- Second split (right branch) -->
      <line x1="140" y1="80" x2="120" y2="40" stroke="#7F8C8D" stroke-width="2"/>
      <line x1="140" y1="80" x2="160" y2="40" stroke="#7F8C8D" stroke-width="2"/>
      
      <!-- Species labels -->
      <circle cx="60" cy="80" r="5" fill="#3498DB"/>
      <text x="60" y="70" font-size="9" fill="#3498DB" text-anchor="middle">Species A</text>
      
      <circle cx="120" cy="40" r="5" fill="#27AE60"/>
      <text x="120" y="30" font-size="9" fill="#27AE60" text-anchor="middle">Species B</text>
      
      <circle cx="160" cy="40" r="5" fill="#F39C12"/>
      <text x="160" y="30" font-size="9" fill="#F39C12" text-anchor="middle">Species C</text>
      
      <!-- Time arrow -->
      <line x1="20" y1="170" x2="20" y2="30" stroke="#9B59B6" stroke-width="2"/>
      <polygon points="17,30 20,25 23,30" fill="#9B59B6"/>
      <text x="15" y="100" font-size="9" fill="#9B59B6" transform="rotate(-90 15 100)">Time</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Phylogenetic Tree
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create speciation diagram
 */
export function createSpeciation(options: EvolutionOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="speciation" xmlns="http://www.w3.org/2000/svg">
      <!-- Original population -->
      <ellipse cx="60" cy="50" rx="35" ry="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="60" y="55" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Population</text>
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${45 + Math.random() * 30}" cy="${40 + Math.random() * 20}" r="3" fill="#3498DB"/>
      `).join('')}
      
      <!-- Geographic barrier -->
      <rect x="105" y="20" width="10" height="80" fill="#7F8C8D" opacity="0.5"/>
      <text x="110" y="110" font-size="8" fill="#7F8C8D" text-anchor="middle">Barrier</text>
      
      <!-- Isolated populations -->
      <ellipse cx="160" cy="40" rx="30" ry="20" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
      <text x="160" y="30" font-size="9" fill="#27AE60" text-anchor="middle">Species A</text>
      ${[0, 1, 2, 3].map(i => `
        <circle cx="${148 + Math.random() * 24}" cy="${35 + Math.random() * 10}" r="3" fill="#27AE60"/>
      `).join('')}
      
      <ellipse cx="160" cy="80" rx="30" ry="20" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="160" y="100" font-size="9" fill="#E74C3C" text-anchor="middle">Species B</text>
      ${[0, 1, 2, 3].map(i => `
        <circle cx="${148 + Math.random() * 24}" cy="${75 + Math.random() * 10}" r="3" fill="#E74C3C"/>
      `).join('')}
      
      <!-- Arrows -->
      <line x1="95" y1="40" x2="130" y2="40" stroke="#F39C12" stroke-width="2"/>
      <polygon points="130,37 135,40 130,43" fill="#F39C12"/>
      <line x1="95" y1="70" x2="130" y2="80" stroke="#F39C12" stroke-width="2"/>
      <polygon points="130,77 135,80 130,83" fill="#F39C12"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Speciation (Geographic Isolation)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create adaptive radiation diagram
 */
export function createAdaptiveRadiation(options: EvolutionOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="adaptive-radiation" xmlns="http://www.w3.org/2000/svg">
      <!-- Common ancestor -->
      <circle cx="100" cy="140" r="8" fill="#E74C3C"/>
      <text x="100" y="158" font-size="9" fill="#E74C3C" text-anchor="middle">Ancestor</text>
      
      <!-- Radiation lines -->
      ${[0, 1, 2, 3, 4].map(i => {
        const angle = -90 + (i - 2) * 35;
        const rad = angle * Math.PI / 180;
        const x = 100 + 80 * Math.cos(rad);
        const y = 140 + 80 * Math.sin(rad);
        const colors = ['#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#E67E22'];
        return `
          <line x1="100" y1="140" x2="${x}" y2="${y}" stroke="${colors[i]}" stroke-width="2.5"/>
          <circle cx="${x}" cy="${y}" r="6" fill="${colors[i]}"/>
        `;
    }).join('')}
      
      <!-- Species labels -->
      <text x="40" y="65" font-size="8" fill="#3498DB">Niche 1</text>
      <text x="70" y="40" font-size="8" fill="#27AE60">Niche 2</text>
      <text x="100" y="30" font-size="8" fill="#F39C12">Niche 3</text>
      <text x="130" y="40" font-size="8" fill="#9B59B6">Niche 4</text>
      <text x="160" y="65" font-size="8" fill="#E67E22">Niche 5</text>
      
      <!-- Title -->
      <text x="100" y="20" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">
        Diverse Ecological Niches
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Adaptive Radiation
        </text>
      ` : ''}
    </svg>
  `;
}
