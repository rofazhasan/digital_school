/**
 * Professional Biology Genetics Components
 * DNA replication, Punnett squares, genetic crosses
 */

export interface GeneticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create DNA replication diagram
 */
export function createDNAReplication(options: GeneticsOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="dna-replication" xmlns="http://www.w3.org/2000/svg">
      <!-- Original DNA strand (left) -->
      <g id="original">
        <!-- Backbone -->
        <path d="M 40,30 Q 35,60 40,90 Q 45,120 40,150" 
              stroke="#E74C3C" stroke-width="3" fill="none"/>
        <path d="M 80,30 Q 85,60 80,90 Q 75,120 80,150" 
              stroke="#3498DB" stroke-width="3" fill="none"/>
        
        <!-- Base pairs -->
        ${[0, 1, 2, 3, 4].map(i => {
        const y = 40 + i * 25;
        return `
            <line x1="40" y1="${y}" x2="80" y2="${y}" stroke="#95A5A6" stroke-width="2"/>
            <circle cx="50" cy="${y}" r="4" fill="#F39C12"/>
            <circle cx="70" cy="${y}" r="4" fill="#27AE60"/>
          `;
    }).join('')}
      </g>
      
      <!-- Replication fork (center) -->
      <path d="M 100,90 L 120,70 L 120,110 Z" fill="#F39C12" opacity="0.6"/>
      <text x="105" y="95" font-size="8" fill="#2C3E50">Fork</text>
      
      <!-- New strands (right) -->
      <g id="newStrands">
        <!-- Leading strand -->
        <path d="M 120,30 Q 115,50 120,70" 
              stroke="#E74C3C" stroke-width="3" fill="none"/>
        <path d="M 160,30 Q 165,50 160,70" 
              stroke="#9B59B6" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
        
        <!-- Lagging strand -->
        <path d="M 120,110 Q 115,130 120,150" 
              stroke="#3498DB" stroke-width="3" fill="none"/>
        <path d="M 160,110 Q 165,130 160,150" 
              stroke="#9B59B6" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
        
        <!-- New base pairs -->
        ${[0, 1].map(i => {
        const y = 40 + i * 25;
        return `
            <line x1="120" y1="${y}" x2="160" y2="${y}" stroke="#95A5A6" stroke-width="2"/>
            <circle cx="130" cy="${y}" r="4" fill="#F39C12"/>
            <circle cx="150" cy="${y}" r="4" fill="#27AE60"/>
          `;
    }).join('')}
        ${[0, 1].map(i => {
        const y = 115 + i * 25;
        return `
            <line x1="120" y1="${y}" x2="160" y2="${y}" stroke="#95A5A6" stroke-width="2"/>
            <circle cx="130" cy="${y}" r="4" fill="#27AE60"/>
            <circle cx="150" cy="${y}" r="4" fill="#F39C12"/>
          `;
    }).join('')}
      </g>
      
      <!-- Labels -->
      <text x="60" y="25" font-size="9" fill="#2C3E50" text-anchor="middle">Parent DNA</text>
      <text x="140" y="25" font-size="9" fill="#9B59B6" text-anchor="middle">New DNA</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          DNA Replication
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Punnett square
 */
export function createPunnettSquare(
    parent1: string = 'Aa',
    parent2: string = 'Aa',
    options: GeneticsOptions = {}
): string {
    const { width = 180, height = 180, showLabel = true } = options;

    // Generate gametes
    const gametes1 = [parent1[0], parent1[1]];
    const gametes2 = [parent2[0], parent2[1]];

    // Generate offspring
    const offspring = gametes1.flatMap(g1 =>
        gametes2.map(g2 => g1 + g2)
    );

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="punnett-square" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      <rect x="60" y="60" width="100" height="100" fill="none" stroke="#2C3E50" stroke-width="2"/>
      <line x1="110" y1="60" x2="110" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <line x1="60" y1="110" x2="160" y2="110" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Parent 1 gametes (top) -->
      <text x="85" y="50" font-size="14" fill="#E74C3C" text-anchor="middle" font-weight="600">
        ${gametes1[0]}
      </text>
      <text x="135" y="50" font-size="14" fill="#E74C3C" text-anchor="middle" font-weight="600">
        ${gametes1[1]}
      </text>
      
      <!-- Parent 2 gametes (left) -->
      <text x="45" y="90" font-size="14" fill="#3498DB" text-anchor="middle" font-weight="600">
        ${gametes2[0]}
      </text>
      <text x="45" y="140" font-size="14" fill="#3498DB" text-anchor="middle" font-weight="600">
        ${gametes2[1]}
      </text>
      
      <!-- Offspring genotypes -->
      ${offspring.map((genotype, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 85 + col * 50;
        const y = 90 + row * 50;
        const isDominant = genotype.includes('A') || genotype.includes(parent1[0].toUpperCase());
        return `
          <rect x="${x - 20}" y="${y - 20}" width="40" height="40" 
                fill="${isDominant ? '#27AE60' : '#95A5A6'}" opacity="0.2"/>
          <text x="${x}" y="${y}" font-size="13" fill="#2C3E50" 
                text-anchor="middle" font-weight="600">
            ${genotype}
          </text>
        `;
    }).join('')}
      
      <!-- Parent labels -->
      <text x="110" y="30" font-size="10" fill="#E74C3C" text-anchor="middle">
        Parent 1: ${parent1}
      </text>
      <text x="25" y="110" font-size="10" fill="#3498DB" text-anchor="middle" 
            writing-mode="tb" transform="rotate(-90, 25, 110)">
        Parent 2: ${parent2}
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Punnett Square
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create cell division (mitosis) diagram
 */
export function createMitosis(options: GeneticsOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="mitosis" xmlns="http://www.w3.org/2000/svg">
      <!-- Interphase -->
      <g id="interphase">
        <circle cx="30" cy="70" r="25" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <circle cx="30" cy="70" r="12" fill="#E74C3C" opacity="0.3"/>
        <path d="M 25,70 Q 30,65 35,70" stroke="#3498DB" stroke-width="2" fill="none"/>
        <text x="30" y="105" font-size="8" fill="#2C3E50" text-anchor="middle">Interphase</text>
      </g>
      
      <!-- Prophase -->
      <g id="prophase">
        <circle cx="80" cy="70" r="25" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <path d="M 75,65 L 75,75 M 85,65 L 85,75" stroke="#3498DB" stroke-width="3"/>
        <text x="80" y="105" font-size="8" fill="#2C3E50" text-anchor="middle">Prophase</text>
      </g>
      
      <!-- Metaphase -->
      <g id="metaphase">
        <circle cx="130" cy="70" r="25" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <line x1="120" y1="70" x2="140" y2="70" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="2,2"/>
        <path d="M 125,70 L 125,65 L 125,75 M 135,70 L 135,65 L 135,75" 
              stroke="#3498DB" stroke-width="3"/>
        <text x="130" y="105" font-size="8" fill="#2C3E50" text-anchor="middle">Metaphase</text>
      </g>
      
      <!-- Anaphase -->
      <g id="anaphase">
        <circle cx="180" cy="70" r="25" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <path d="M 170,70 L 170,65 L 170,75 M 190,70 L 190,65 L 190,75" 
              stroke="#3498DB" stroke-width="3"/>
        <line x1="175" y1="70" x2="185" y2="70" stroke="#E74C3C" stroke-width="1" opacity="0.3"/>
        <text x="180" y="105" font-size="8" fill="#2C3E50" text-anchor="middle">Anaphase</text>
      </g>
      
      <!-- Telophase/Cytokinesis -->
      <g id="telophase">
        <ellipse cx="215" cy="60" rx="12" ry="18" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <ellipse cx="215" cy="80" rx="12" ry="18" fill="#ECF0F1" stroke="#2C3E50" stroke-width="2"/>
        <path d="M 213,60 L 213,55 L 213,65" stroke="#3498DB" stroke-width="2"/>
        <path d="M 213,80 L 213,75 L 213,85" stroke="#3498DB" stroke-width="2"/>
        <text x="215" y="110" font-size="7" fill="#2C3E50" text-anchor="middle">Telophase</text>
      </g>
      
      <!-- Arrows -->
      ${[60, 110, 160].map(x => `
        <polygon points="${x},70 ${x + 5},68 ${x + 5},72" fill="#7F8C8D"/>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Mitosis Stages
        </text>
      ` : ''}
    </svg>
  `;
}
