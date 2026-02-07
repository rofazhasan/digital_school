/**
 * Microbiology Components
 * Bacterial cell, viral replication
 */

export interface MicrobiologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create bacterial cell diagram
 */
export function createBacterialCell(options: MicrobiologyOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="bacterial-cell" xmlns="http://www.w3.org/2000/svg">
      <!-- Cell wall -->
      <ellipse cx="100" cy="90" rx="60" ry="50" fill="#E8F4F8" stroke="#3498DB" stroke-width="3"/>
      
      <!-- Cell membrane -->
      <ellipse cx="100" cy="90" rx="55" ry="45" fill="none" stroke="#2980B9" stroke-width="2" stroke-dasharray="3,3"/>
      
      <!-- Nucleoid (DNA) -->
      <path d="M 85,75 Q 95,70 105,75 Q 115,80 105,85 Q 95,90 85,85 Q 75,80 85,75" 
            fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="95" y="82" font-size="9" fill="#E74C3C" text-anchor="middle">DNA</text>
      
      <!-- Ribosomes -->
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${70 + (i % 3) * 20}" cy="${100 + Math.floor(i / 3) * 15}" r="2" fill="#F39C12"/>
      `).join('')}
      <text x="90" y="125" font-size="8" fill="#F39C12" text-anchor="middle">Ribosomes</text>
      
      <!-- Flagellum -->
      <path d="M 160,90 Q 170,85 180,90 Q 190,95 200,90" stroke="#27AE60" stroke-width="2" fill="none"/>
      <text x="180" y="105" font-size="8" fill="#27AE60" text-anchor="middle">Flagellum</text>
      
      <!-- Pili -->
      ${[0, 1, 2].map(i => `
        <line x1="${50 + i * 10}" y1="${50 + i * 5}" x2="${40 + i * 10}" y2="${40 + i * 5}" 
              stroke="#9B59B6" stroke-width="1.5"/>
      `).join('')}
      <text x="50" y="35" font-size="8" fill="#9B59B6">Pili</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Bacterial Cell
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create viral replication cycle diagram
 */
export function createViralReplication(options: MicrobiologyOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${width + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="viral-replication" xmlns="http://www.w3.org/2000/svg">
      <!-- Virus -->
      <g id="virus">
        <polygon points="40,50 50,45 60,50 55,60 45,60" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
        ${[0, 1, 2, 3, 4].map(i => `
          <line x1="${50 + Math.cos(i * 1.26) * 10}" y1="${52 + Math.sin(i * 1.26) * 10}" 
                x2="${50 + Math.cos(i * 1.26) * 15}" y2="${52 + Math.sin(i * 1.26) * 15}" 
                stroke="#E74C3C" stroke-width="2"/>
        `).join('')}
        <text x="50" y="35" font-size="9" fill="#E74C3C" text-anchor="middle">Virus</text>
      </g>
      
      <!-- Host cell -->
      <circle cx="120" cy="90" r="40" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="120" y="75" font-size="9" fill="#3498DB" text-anchor="middle">Host Cell</text>
      
      <!-- Attachment -->
      <line x1="65" y1="55" x2="85" y2="70" stroke="#F39C12" stroke-width="2"/>
      <polygon points="85,70 90,68 87,73" fill="#F39C12"/>
      <text x="75" y="60" font-size="8" fill="#F39C12">1. Attach</text>
      
      <!-- Entry -->
      <circle cx="105" cy="85" r="6" fill="#E74C3C" opacity="0.5"/>
      <text x="95" y="95" font-size="8" fill="#7F8C8D">2. Entry</text>
      
      <!-- Replication -->
      ${[0, 1, 2].map(i => `
        <circle cx="${115 + i * 10}" cy="${95 + i * 5}" r="3" fill="#E74C3C" opacity="0.5"/>
      `).join('')}
      <text x="125" y="115" font-size="8" fill="#7F8C8D">3. Replicate</text>
      
      <!-- Assembly -->
      <polygon points="140,100 145,97 150,100 147,105 143,105" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="1"/>
      <text x="147" y="120" font-size="8" fill="#7F8C8D">4. Assemble</text>
      
      <!-- Release -->
      ${[0, 1, 2].map(i => `
        <polygon points="${170 + i * 15},${80 + i * 10} ${175 + i * 15},${77 + i * 10} ${180 + i * 15},${80 + i * 10} ${177 + i * 15},${85 + i * 10} ${173 + i * 15},${85 + i * 10}" 
                 fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="1"/>
      `).join('')}
      <text x="185" y="110" font-size="8" fill="#7F8C8D">5. Release</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Viral Replication Cycle
        </text>
      ` : ''}
    </svg>
  `;
}
