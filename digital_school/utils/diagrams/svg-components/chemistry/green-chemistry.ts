/**
 * Green Chemistry Components
 * 12 principles, sustainable synthesis
 */

export interface GreenChemistryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create green chemistry principles diagram
 */
export function createGreenChemistryPrinciples(options: GreenChemistryOptions = {}): string {
    const { width = 240, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="green-chemistry-principles" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="120" y="25" font-size="12" fill="#27AE60" text-anchor="middle" font-weight="600">
        12 Principles of Green Chemistry
      </text>
      
      <!-- Principles grid -->
      ${[
            { num: 1, text: 'Prevent waste', x: 30, y: 45 },
            { num: 2, text: 'Atom economy', x: 130, y: 45 },
            { num: 3, text: 'Less hazardous', x: 30, y: 75 },
            { num: 4, text: 'Safer chemicals', x: 130, y: 75 },
            { num: 5, text: 'Safer solvents', x: 30, y: 105 },
            { num: 6, text: 'Energy efficiency', x: 130, y: 105 },
            { num: 7, text: 'Renewable', x: 30, y: 135 },
            { num: 8, text: 'Reduce derivatives', x: 130, y: 135 },
            { num: 9, text: 'Catalysis', x: 30, y: 165 },
            { num: 10, text: 'Degradable', x: 130, y: 165 },
            { num: 11, text: 'Real-time analysis', x: 30, y: 195 },
            { num: 12, text: 'Prevent accidents', x: 130, y: 195 }
        ].map(p => `
        <g>
          <circle cx="${p.x + 5}" cy="${p.y - 5}" r="8" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
          <text x="${p.x + 5}" y="${p.y - 1}" font-size="8" fill="#2C3E50" text-anchor="middle" font-weight="600">${p.num}</text>
          <text x="${p.x + 18}" y="${p.y}" font-size="9" fill="#2C3E50">${p.text}</text>
        </g>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Green Chemistry Principles
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create sustainable synthesis diagram
 */
export function createSustainableSynthesis(options: GreenChemistryOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="sustainable-synthesis" xmlns="http://www.w3.org/2000/svg">
      <!-- Atom Economy -->
      <g id="atom-economy">
        <rect x="30" y="40" width="80" height="50" fill="#E8F8F0" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="70" y="30" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">Atom Economy</text>
        <text x="70" y="60" font-size="10" fill="#2C3E50" text-anchor="middle">MW(product)</text>
        <line x1="50" y1="65" x2="90" y2="65" stroke="#2C3E50" stroke-width="1.5"/>
        <text x="70" y="80" font-size="10" fill="#2C3E50" text-anchor="middle">MW(reactants)</text>
        <text x="70" y="95" font-size="9" fill="#E74C3C" text-anchor="middle">× 100%</text>
      </g>
      
      <!-- E-factor -->
      <g id="e-factor">
        <rect x="130" y="40" width="80" height="50" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="170" y="30" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">E-factor</text>
        <text x="170" y="60" font-size="10" fill="#2C3E50" text-anchor="middle">kg waste</text>
        <line x1="150" y1="65" x2="190" y2="65" stroke="#2C3E50" stroke-width="1.5"/>
        <text x="170" y="80" font-size="10" fill="#2C3E50" text-anchor="middle">kg product</text>
        <text x="170" y="100" font-size="8" fill="#7F8C8D" text-anchor="middle">Lower is better</text>
      </g>
      
      <!-- Comparison -->
      <g id="comparison">
        <text x="110" y="125" font-size="9" fill="#27AE60" text-anchor="middle">High atom economy</text>
        <text x="110" y="140" font-size="9" fill="#9B59B6" text-anchor="middle">Low E-factor</text>
        <text x="110" y="155" font-size="9" fill="#E74C3C" text-anchor="middle">= Sustainable</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Sustainable Synthesis Metrics
        </text>
      ` : ''}
    </svg>
  `;
}
