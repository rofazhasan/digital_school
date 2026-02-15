/**
 * Developmental Biology Components
 * Embryonic development, cell differentiation
 */

export interface DevelopmentalBiologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create embryonic development stages diagram
 */
export function createEmbryonicDevelopment(options: DevelopmentalBiologyOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="embryonic-development" xmlns="http://www.w3.org/2000/svg">
      <!-- Zygote -->
      <g id="zygote">
        <circle cx="40" cy="80" r="12" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
        <text x="40" y="60" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Zygote</text>
        <text x="40" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">1 cell</text>
      </g>
      
      <!-- Arrow -->
      <line x1="55" y1="80" x2="70" y2="80" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-dev)"/>
      
      <!-- Morula -->
      <g id="morula">
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = (i * Math.PI * 2) / 8;
        const x = 90 + Math.cos(angle) * 8;
        const y = 80 + Math.sin(angle) * 8;
        return `<circle cx="${x}" cy="${y}" r="3" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="1"/>`;
    }).join('')}
        <text x="90" y="60" font-size="9" fill="#3498DB" text-anchor="middle" font-weight="600">Morula</text>
        <text x="90" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">16-32 cells</text>
      </g>
      
      <!-- Arrow -->
      <line x1="105" y1="80" x2="120" y2="80" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-dev)"/>
      
      <!-- Blastula -->
      <g id="blastula">
        <circle cx="145" cy="80" r="15" fill="none" stroke="#27AE60" stroke-width="2"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
        const angle = (i * Math.PI * 2) / 12;
        const x = 145 + Math.cos(angle) * 15;
        const y = 80 + Math.sin(angle) * 15;
        return `<circle cx="${x}" cy="${y}" r="2" fill="#27AE60"/>`;
    }).join('')}
        <text x="145" y="60" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Blastula</text>
        <text x="145" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">Hollow ball</text>
      </g>
      
      <!-- Arrow -->
      <line x1="165" y1="80" x2="180" y2="80" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-dev)"/>
      
      <!-- Gastrula -->
      <g id="gastrula">
        <ellipse cx="205" cy="80" rx="12" ry="15" fill="none" stroke="#9B59B6" stroke-width="2"/>
        <path d="M 205,65 Q 210,80 205,95" stroke="#9B59B6" stroke-width="2" fill="none"/>
        <text x="205" y="60" font-size="9" fill="#9B59B6" text-anchor="middle" font-weight="600">Gastrula</text>
        <text x="205" y="110" font-size="8" fill="#7F8C8D" text-anchor="middle">3 layers</text>
      </g>
      
      <!-- Germ layers -->
      <text x="120" y="135" font-size="8" fill="#E74C3C" text-anchor="middle">Ectoderm</text>
      <text x="120" y="145" font-size="8" fill="#3498DB" text-anchor="middle">Mesoderm</text>
      <text x="120" y="155" font-size="8" fill="#27AE60" text-anchor="middle">Endoderm</text>
      
      <defs>
        <marker id="arrow-dev" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Embryonic Development Stages
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create cell differentiation diagram
 */
export function createCellDifferentiation(options: DevelopmentalBiologyOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="cell-differentiation" xmlns="http://www.w3.org/2000/svg">
      <!-- Stem cell -->
      <g id="stem-cell">
        <circle cx="120" cy="40" r="15" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2"/>
        <text x="120" y="44" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Stem Cell</text>
        <text x="120" y="20" font-size="9" fill="#9B59B6" text-anchor="middle">Pluripotent</text>
      </g>
      
      <!-- Differentiation arrows -->
      ${[
            { angle: -60, color: '#E74C3C', name: 'Neuron', y: 110 },
            { angle: 0, color: '#3498DB', name: 'Muscle', y: 110 },
            { angle: 60, color: '#27AE60', name: 'Blood', y: 110 }
        ].map(cell => {
            const rad = (cell.angle * Math.PI) / 180;
            const x1 = 120 + Math.cos(rad) * 20;
            const y1 = 40 + Math.sin(rad) * 20;
            const x2 = 120 + Math.cos(rad) * 60;
            const y2 = 40 + Math.sin(rad) * 60;
            return `
          <g>
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                  stroke="${cell.color}" stroke-width="2" marker-end="url(#arrow-diff-${cell.name})"/>
            <circle cx="${x2}" cy="${y2}" r="12" fill="${cell.color}" opacity="0.3" stroke="${cell.color}" stroke-width="2"/>
            <text x="${x2}" y="${cell.y}" font-size="8" fill="${cell.color}" text-anchor="middle" font-weight="600">${cell.name}</text>
          </g>
          <defs>
            <marker id="arrow-diff-${cell.name}" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="${cell.color}"/>
            </marker>
          </defs>
        `;
        }).join('')}
      
      <!-- Process label -->
      <text x="120" y="145" font-size="10" fill="#F39C12" text-anchor="middle" font-weight="600">
        Differentiation
      </text>
      <text x="120" y="160" font-size="8" fill="#7F8C8D" text-anchor="middle">
        Specialized cell types
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Cell Differentiation
        </text>
      ` : ''}
    </svg>
  `;
}
